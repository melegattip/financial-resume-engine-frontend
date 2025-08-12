import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { FaPlus, FaSearch, FaArrowDown, FaCalendar, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaDollarSign } from 'react-icons/fa';
import { formatCurrency, formatPercentage } from '../services/api';
import { usePeriod } from '../contexts/PeriodContext';
import { useGamification } from '../contexts/GamificationContext';
import { useOptimizedAPI } from '../hooks/useOptimizedAPI';
import useDataRefresh from '../hooks/useDataRefresh';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import ValidatedInput from '../components/ValidatedInput';
import { validateAmount, validateDescription, VALIDATION_RULES } from '../utils/validation';

const Expenses = () => {
  const location = useLocation();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [payingExpense, setPayingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaid, setFilterPaid] = useState('all');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    due_date: '',
    paid: false,
  });

  // Estados para validación del formulario
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Usar el contexto global de período
  const {
    selectedYear,
    selectedMonth,
    balancesHidden,
    updateAvailableData,
  } = usePeriod();

  // Usar el hook optimizado para operaciones API
  const { 
    expenses: expensesAPI, 
    categories: categoriesAPI
  } = useOptimizedAPI();

  // Hook de gamificación para registrar acciones
  const { recordCreateExpense, recordUpdateExpense, recordDeleteExpense } = useGamification();

  // Leer parámetros de URL y aplicar filtros automáticamente
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get('status');
    
    if (statusParam) {
      // Mapear parámetros de URL a valores del filtro
      const filterMapping = {
        'pending': 'unpaid',
        'paid': 'paid',
        'all': 'all'
      };
      
      const newFilter = filterMapping[statusParam] || 'all';
      console.log(`🔍 [Expenses] Aplicando filtro desde URL: ${statusParam} → ${newFilter}`);
      setFilterPaid(newFilter);
    }
  }, [location.search]);

  const formatAmount = (amount) => {
    if (balancesHidden) return '••••••';
    return formatCurrency(amount);
  };

  const formatPercentageAmount = (percentage) => {
    if (balancesHidden) return '••••';
    return formatPercentage(percentage);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos de gastos con API optimizada...');
      
      const [expensesResponse, categoriesResponse] = await Promise.all([
        expensesAPI.list(),
        categoriesAPI.list(),
      ]);
      
      // Normalizar datos de respuesta
      const expensesData = expensesResponse.data?.expenses || expensesResponse.expenses || expensesResponse || [];
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || categoriesResponse || [];
      
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Actualizar datos disponibles en el contexto de períodos
      updateAvailableData(expensesData, []);
      
      console.log('✅ Datos de gastos cargados exitosamente:', {
        expenses: expensesData.length,
        categories: categoriesData.length
      });
      
    } catch (error) {
      console.warn('⚠️ Error al cargar gastos:', error.message);
      
      // Establecer datos vacíos
      setExpenses([]);
      setCategories([]);
      
      // No mostrar toast aquí porque useOptimizedAPI ya lo maneja
    } finally {
      setLoading(false);
    }
  }, [expensesAPI, categoriesAPI, updateAvailableData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hook para refrescar automáticamente cuando cambian los datos
  useDataRefresh(loadData, ['expense', 'recurring_transaction']);

  // Validar formulario completo
  const validateForm = useCallback(() => {
    const errors = {};
    let valid = true;

    // Validar descripción
    const descriptionValidation = validateDescription(formData.description);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.error;
      valid = false;
    }

    // Validar monto
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error;
      valid = false;
    }

    setFormErrors(errors);
    setIsFormValid(valid);
    return valid;
  }, [formData]);

  // Validar formulario cuando cambien los datos
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar antes de enviar
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      // Convertir amount a número antes de enviar
      const dataToSend = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, dataToSend);
        // useOptimizedAPI ya muestra el toast de éxito
        
        // 🎮 Registrar acción de gamificación
        console.log(`🎯 [Expenses] Registrando actualización de expense: ${editingExpense.id}`);
        recordUpdateExpense(editingExpense.id, `Gasto actualizado: ${dataToSend.description}`);
      } else {
        const result = await expensesAPI.create(dataToSend);
        // useOptimizedAPI ya muestra el toast de éxito
        
        // 🎮 Registrar acción de gamificación  
        const expenseId = result?.data?.id || `expense-${Date.now()}`;
        console.log(`🎯 [Expenses] Registrando creación de expense: ${expenseId}`);
        recordCreateExpense(expenseId, `Nuevo gasto: ${dataToSend.description}`);
      }
      
      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        category_id: '',
        due_date: '',
        paid: false,
      });
      setFormErrors({});
      
      // Recargar datos para mostrar cambios
      await loadData();
    } catch (error) {
      // useOptimizedAPI ya maneja el error y muestra el toast
      console.error('Error en handleSubmit:', error);
      // Si la request tardó pero el backend creó el recurso, evitamos dejar el modal abierto
      if (error?.code === 'ECONNABORTED') {
        setShowModal(false);
        setEditingExpense(null);
        setFormData({
          description: '',
          amount: '',
          category_id: '',
          due_date: '',
          paid: false,
        });
        setFormErrors({});
        // Forzar recarga de datos para reflejar el gasto creado
        await loadData();
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category_id: expense.category_id || '',
      due_date: expense.due_date || '',
      paid: expense.paid,
    });
    setShowModal(true);
  };

  const handleDelete = (expense) => {
    setDeletingExpense(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    
    try {
      setDeleteLoading(true);
      await expensesAPI.delete(deletingExpense.id);
      // useOptimizedAPI ya muestra el toast de éxito
      
      // 🎮 Registrar acción de gamificación
      console.log(`🎯 [Expenses] Registrando eliminación de expense: ${deletingExpense.id}`);
      recordDeleteExpense(deletingExpense.id, `Gasto eliminado: ${deletingExpense.description}`);
      
      // Recargar datos para mostrar cambios
      await loadData();
    } catch (error) {
      // useOptimizedAPI ya maneja el error
      console.error('Error en confirmDelete:', error);
    } finally {
      // ✅ Siempre cerrar modal y limpiar estado, sin importar si hay errores
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeletingExpense(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingExpense(null);
  };

  const togglePaid = async (expense) => {
    if (expense.paid) {
      // Si ya está pagado, permitir marcarlo como no pagado
      try {
        const updateData = { paid: false };
        await expensesAPI.update(expense.id, updateData);
        // useOptimizedAPI ya muestra el toast de éxito
        
        // Recargar datos para mostrar cambios
        await loadData();
      } catch (error) {
        // useOptimizedAPI ya maneja el error
        console.error('Error en togglePaid:', error);
      }
    } else {
      // Si no está pagado, abrir modal de pago
      setPayingExpense(expense);
      const pendingAmount = expense.pending_amount || (expense.amount - (expense.amount_paid || 0));
      setPaymentAmount(pendingAmount.toString());
      setShowPaymentModal(true);
    }
  };

  const handlePayment = async (paymentType) => {
    try {
      if (paymentType === 'total') {
        // Pago total - marcar como pagado
        const updateData = { paid: true };
        await expensesAPI.update(payingExpense.id, updateData);
        toast.success('Gasto pagado completamente');
      } else if (paymentType === 'partial') {
        // Pago parcial - enviar payment_amount
        const paymentAmt = parseFloat(paymentAmount);
        if (paymentAmt <= 0 || paymentAmt > payingExpense.amount) {
          toast.error('Monto de pago inválido');
          return;
        }
        
        const updateData = { payment_amount: paymentAmt };
        await expensesAPI.update(payingExpense.id, updateData);
        
        // Verificar si el pago cubre el total
        const remaining = payingExpense.amount - (payingExpense.amount_paid || 0) - paymentAmt;
        if (remaining <= 0) {
          toast.success('Gasto pagado completamente');
        } else {
          toast.success(`Pago parcial registrado. Quedan ${formatCurrency(remaining)} pendientes`);
        }
      }
      
      setShowPaymentModal(false);
      setPayingExpense(null);
      setPaymentAmount('');
      
      // Recargar datos para mostrar cambios
      await loadData();
    } catch (error) {
      // useOptimizedAPI ya maneja el error base, pero estos son casos especiales
      console.error('Error en handlePayment:', error);
    }
  };

  const filteredExpenses = Array.isArray(expenses) 
    ? expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterPaid === 'all' || 
          (filterPaid === 'paid' && expense.paid) ||
          (filterPaid === 'unpaid' && !expense.paid);
        
        // Filtros de fecha
        const expenseDate = new Date(expense.created_at);
        const matchesYear = !selectedYear || expenseDate.getFullYear().toString() === selectedYear;
        const matchesMonth = !selectedMonth || expense.created_at.slice(0, 7) === selectedMonth;
        
        return matchesSearch && matchesFilter && matchesYear && matchesMonth;
      })
    : [];

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const unpaidExpenses = filteredExpenses.filter(e => !e.paid);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-fr-gray-600 dark:text-gray-400">Cargando gastos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">Total Gastos</p>
              <p className="text-2xl font-bold text-fr-gray-900 dark:text-gray-100">{formatAmount(totalExpenses)}</p>
            </div>
            <div className="p-3 rounded-fr bg-gray-100 dark:bg-gray-700">
              <FaArrowDown className="w-6 h-6 text-fr-gray-900 dark:text-gray-300" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">Gastos Pendientes</p>
              <p className="text-2xl font-bold text-fr-gray-900 dark:text-gray-100">{unpaidExpenses.length}</p>
            </div>
            <div className="p-3 rounded-fr bg-gray-100 dark:bg-gray-700">
              <FaCalendar className="w-6 h-6 text-fr-gray-900 dark:text-gray-300" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fr-gray-600 dark:text-gray-400">Monto Pendiente</p>
                              <p className="text-2xl font-bold text-fr-gray-900 dark:text-gray-100">
                  {formatAmount(unpaidExpenses.reduce((sum, e) => sum + e.amount, 0))}
                </p>
            </div>
            <div className="p-3 rounded-fr bg-gray-100 dark:bg-gray-700">
              <FaTimesCircle className="w-6 h-6 text-fr-gray-900 dark:text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Primera fila: Búsqueda y Estado */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Búsqueda */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fr-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input w-full sm:w-64"
                />
              </div>

              {/* Filtro */}
              <select
                value={filterPaid}
                onChange={(e) => setFilterPaid(e.target.value)}
                className="input w-full sm:w-auto"
              >
                <option value="all">Todos los gastos</option>
                <option value="paid">Pagados</option>
                <option value="unpaid">Pendientes</option>
              </select>
            </div>


          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="card">
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <FaArrowDown className="w-12 h-12 text-fr-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-fr-gray-900 dark:text-gray-100 mb-2">No hay gastos</h3>
              <p className="text-fr-gray-500 dark:text-gray-400">Comienza agregando tu primer gasto</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const category = categories.find(c => c.id === expense.category_id);
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-fr bg-fr-gray-50 dark:bg-gray-700 hover:bg-fr-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => togglePaid(expense)}
                      className={`p-2 rounded-fr transition-colors ${
                        expense.paid 
                          ? 'bg-green-100 dark:bg-green-900/30 text-fr-secondary dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                          : 'bg-red-100 dark:bg-red-900/30 text-fr-error dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                      }`}
                    >
                      {expense.paid ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <FaTimesCircle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-fr-gray-900 dark:text-gray-100">{expense.description}</h3>
                        {category && (
                          <span className="badge-info">{category.name}</span>
                        )}
                        {expense.paid && (
                          <span className="badge-success">Pagado</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-fr-gray-500 dark:text-gray-400">
                        {expense.due_date && (
                          <span>Vence: {new Date(expense.due_date).toLocaleDateString('es-AR')}</span>
                        )}
                        <span>Creado: {new Date(expense.created_at).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {expense.amount_paid > 0 && expense.amount_paid < expense.amount ? (
                        // Pago parcial - mostrar total vs pendiente
                        <div>
                          <p className="font-semibold text-fr-gray-900 dark:text-gray-100 text-lg">
                            {formatAmount(expense.pending_amount || (expense.amount - (expense.amount_paid || 0)))}
                          </p>
                          <p className="text-sm text-fr-gray-500 dark:text-gray-400">
                            de {formatAmount(expense.amount)} total
                          </p>
                          <p className="text-xs text-fr-secondary dark:text-green-400">
                            Pagado: {formatAmount(expense.amount_paid || 0)}
                          </p>
                        </div>
                      ) : (
                        // Sin pagos parciales - mostrar solo el monto
                        <p className="font-semibold text-fr-gray-900 dark:text-gray-100 text-lg">
                          {formatAmount(expense.amount)}
                        </p>
                      )}
                      {expense.percentage && (
                        <p className="text-sm text-fr-gray-500 dark:text-gray-400">
                          {formatPercentageAmount(expense.percentage)} del total
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 rounded-fr text-fr-gray-600 dark:text-gray-400 hover:bg-fr-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-2 rounded-fr text-fr-error dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-fr-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-fr-gray-900 dark:text-gray-100 mb-6">
              {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <ValidatedInput
                type="text"
                name="description"
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                validator={validateDescription}
                validateOnChange={true}
                required={true}
                placeholder="Ej: Compras del supermercado"
                helpText="Describe brevemente el gasto"
                maxLength={255}
              />

              <ValidatedInput
                type="currency"
                name="amount"
                label="Monto"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                validator={(value) => validateAmount(value, { fieldName: 'monto' })}
                validateOnChange={true}
                required={true}
                placeholder="0.00"
                helpText="Ingresa el monto del gasto"
                icon={<FaDollarSign />}
                iconPosition="left"
                allowNegative={false}
                maxDecimals={2}
              />

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="paid"
                  checked={formData.paid}
                  onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="paid" className="text-sm font-medium text-fr-gray-700 dark:text-gray-300">
                  Marcar como pagado
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                    setFormData({
                      description: '',
                      amount: '',
                      category_id: '',
                      due_date: '',
                      paid: false,
                    });
                    setFormErrors({});
                  }}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`btn-primary flex-1 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isFormValid}
                >
                  {editingExpense ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Pago */}
      {showPaymentModal && payingExpense && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-fr-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-fr-gray-900 dark:text-gray-100 mb-6">
              Registrar Pago
            </h2>

            {/* Información del gasto */}
            <div className="bg-fr-gray-50 dark:bg-gray-700 rounded-fr p-4 mb-6">
              <h3 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-2">{payingExpense.description}</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold text-fr-gray-900 dark:text-gray-100">
                  Monto total: {formatCurrency(payingExpense.amount)}
                </p>
                {payingExpense.amount_paid > 0 && (
                  <>
                    <p className="text-sm text-fr-secondary dark:text-green-400">
                      Ya pagado: {formatCurrency(payingExpense.amount_paid)}
                    </p>
                    <p className="text-lg font-bold text-fr-accent dark:text-yellow-400">
                      Pendiente: {formatCurrency(payingExpense.pending_amount || (payingExpense.amount - payingExpense.amount_paid))}
                    </p>
                  </>
                )}
              </div>
              {payingExpense.due_date && (
                <p className="text-sm text-fr-gray-600 dark:text-gray-400 mt-1">
                  Vence: {new Date(payingExpense.due_date).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>

            {/* Opciones de pago */}
            <div className="space-y-4">
              {/* Pago Total */}
              <button
                onClick={() => handlePayment('total')}
                className="w-full p-4 border-2 border-fr-secondary dark:border-green-600 rounded-fr hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-fr-gray-900 dark:text-gray-100">💰 Pago Total</h4>
                    <p className="text-sm text-fr-gray-600 dark:text-gray-400">Marcar como completamente pagado</p>
                  </div>
                  <p className="font-bold text-fr-secondary dark:text-green-400">
                    {formatCurrency(payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0)))}
                  </p>
                </div>
              </button>

              {/* Pago Parcial */}
              <div className="border-2 border-fr-accent dark:border-yellow-600 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-3">💸 Pago Parcial</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
                      Monto a pagar
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      max={payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0))}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="text-sm text-fr-gray-600 dark:text-gray-400">
                    <p>Quedarían pendientes: <span className="font-medium">
                      {formatCurrency(Math.max(0, (payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0))) - (parseFloat(paymentAmount) || 0)))}
                    </span></p>
                  </div>
                  <button
                    onClick={() => handlePayment('partial')}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Registrar Pago Parcial
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingExpense(null);
                  setPaymentAmount('');
                }}
                className="btn-outline flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Gasto"
        message={`¿Estás seguro de que quieres eliminar el gasto "${deletingExpense?.description}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Expenses; 