import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { expensesAPI, categoriesAPI, formatCurrency, formatPercentage } from '../services/api';
import toast from 'react-hot-toast';

const Expenses = () => {
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
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    due_date: '',
    paid: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Funciones para filtros de fecha
  const getAvailableYears = () => {
    if (!expenses.length) return [];
    const years = [...new Set(expenses.map(expense => 
      new Date(expense.created_at).getFullYear()
    ))];
    return years.sort((a, b) => b - a);
  };

  const getAvailableMonths = () => {
    if (!expenses.length) return [];
    let expensesToCheck = expenses;
    
    // Si hay año seleccionado, filtrar por ese año
    if (selectedYear) {
      expensesToCheck = expenses.filter(expense => 
        new Date(expense.created_at).getFullYear().toString() === selectedYear
      );
    }
    
    const months = [...new Set(expensesToCheck.map(expense => 
      expense.created_at.slice(0, 7) // YYYY-MM
    ))];
    return months.sort().reverse();
  };

  const formatMonthOnly = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = date.toLocaleDateString('es-AR', { 
      month: 'long' 
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, categoriesResponse] = await Promise.all([
        expensesAPI.list(),
        categoriesAPI.list(),
      ]);
      
      // Asegurar que siempre sean arrays
      const expensesData = expensesResponse.data?.expenses || expensesResponse.data || [];
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || [];
      
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
      setExpenses([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convertir amount a número antes de enviar
      const dataToSend = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingExpense) {
        await expensesAPI.update(editingExpense.user_id, editingExpense.id, dataToSend);
        toast.success('Gasto actualizado correctamente');
      } else {
        await expensesAPI.create(dataToSend);
        toast.success('Gasto creado correctamente');
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
      loadData();
    } catch (error) {
      toast.error('Error al guardar el gasto');
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

  const handleDelete = async (expense) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await expensesAPI.delete(expense.user_id, expense.id);
        toast.success('Gasto eliminado correctamente');
        loadData();
      } catch (error) {
        toast.error('Error al eliminar el gasto');
      }
    }
  };

  const togglePaid = async (expense) => {
    if (expense.paid) {
      // Si ya está pagado, permitir marcarlo como no pagado
      try {
        const updateData = { paid: false };
        await expensesAPI.update(expense.user_id, expense.id, updateData);
        toast.success('Gasto marcado como pendiente');
        loadData();
      } catch (error) {
        toast.error('Error al actualizar el estado del gasto');
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
        await expensesAPI.update(payingExpense.user_id, payingExpense.id, updateData);
        toast.success('Gasto pagado completamente');
      } else if (paymentType === 'partial') {
        // Pago parcial - enviar payment_amount
        const paymentAmt = parseFloat(paymentAmount);
        if (paymentAmt <= 0 || paymentAmt > payingExpense.amount) {
          toast.error('Monto de pago inválido');
          return;
        }
        
        const updateData = { payment_amount: paymentAmt };
        await expensesAPI.update(payingExpense.user_id, payingExpense.id, updateData);
        
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
      loadData();
    } catch (error) {
      toast.error('Error al procesar el pago');
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
        <span className="ml-2 text-mp-gray-600">Cargando gastos...</span>
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
              <p className="text-sm font-medium text-mp-gray-600">Total Gastos</p>
              <p className="text-2xl font-bold text-mp-accent">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3 rounded-mp bg-orange-100">
              <TrendingDown className="w-6 h-6 text-mp-accent" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Gastos Pendientes</p>
              <p className="text-2xl font-bold text-mp-error">{unpaidExpenses.length}</p>
            </div>
            <div className="p-3 rounded-mp bg-red-100">
              <Calendar className="w-6 h-6 text-mp-error" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Monto Pendiente</p>
              <p className="text-2xl font-bold text-mp-error">
                {formatCurrency(unpaidExpenses.reduce((sum, e) => sum + e.amount, 0))}
              </p>
            </div>
            <div className="p-3 rounded-mp bg-red-100">
              <XCircle className="w-6 h-6 text-mp-error" />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mp-gray-400" />
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

            {/* Segunda fila: Filtros de fecha */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Selector de Año */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mp-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedMonth(''); // Reset mes cuando cambia año
                  }}
                  className="pl-10 input w-full sm:w-32"
                >
                  <option value="">Todos</option>
                  {getAvailableYears().map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Mes */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input w-full sm:w-40"
                disabled={!selectedYear}
              >
                <option value="">Todos los meses</option>
                {getAvailableMonths().map(month => (
                  <option key={month} value={month}>
                    {formatMonthOnly(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="card">
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-12 h-12 text-mp-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-mp-gray-900 mb-2">No hay gastos</h3>
              <p className="text-mp-gray-500">Comienza agregando tu primer gasto</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const category = categories.find(c => c.id === expense.category_id);
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 rounded-mp bg-mp-gray-50 hover:bg-mp-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => togglePaid(expense)}
                      className={`p-2 rounded-mp transition-colors ${
                        expense.paid 
                          ? 'bg-green-100 text-mp-secondary hover:bg-green-200' 
                          : 'bg-red-100 text-mp-error hover:bg-red-200'
                      }`}
                    >
                      {expense.paid ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-mp-gray-900">{expense.description}</h3>
                        {category && (
                          <span className="badge-info">{category.name}</span>
                        )}
                        {expense.paid && (
                          <span className="badge-success">Pagado</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-mp-gray-500">
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
                          <p className="font-semibold text-mp-accent text-lg">
                            {formatCurrency(expense.pending_amount || (expense.amount - (expense.amount_paid || 0)))}
                          </p>
                          <p className="text-sm text-mp-gray-500">
                            de {formatCurrency(expense.amount)} total
                          </p>
                          <p className="text-xs text-mp-secondary">
                            Pagado: {formatCurrency(expense.amount_paid || 0)}
                          </p>
                        </div>
                      ) : (
                        // Sin pagos parciales - mostrar solo el monto
                        <p className="font-semibold text-mp-accent text-lg">
                          {formatCurrency(expense.amount)}
                        </p>
                      )}
                      {expense.percentage && (
                        <p className="text-sm text-mp-gray-500">
                          {formatPercentage(expense.percentage)} del total
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 rounded-mp text-mp-gray-600 hover:bg-mp-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-2 rounded-mp text-mp-error hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="bg-white rounded-mp-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-mp-gray-900 mb-6">
              {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mp-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mp-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mp-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-mp-gray-700 mb-2">
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
                <label htmlFor="paid" className="text-sm font-medium text-mp-gray-700">
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
                  }}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
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
          <div className="bg-white rounded-mp-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-mp-gray-900 mb-6">
              Registrar Pago
            </h2>

            {/* Información del gasto */}
            <div className="bg-mp-gray-50 rounded-mp p-4 mb-6">
              <h3 className="font-medium text-mp-gray-900 mb-2">{payingExpense.description}</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold text-mp-gray-900">
                  Monto total: {formatCurrency(payingExpense.amount)}
                </p>
                {payingExpense.amount_paid > 0 && (
                  <>
                    <p className="text-sm text-mp-secondary">
                      Ya pagado: {formatCurrency(payingExpense.amount_paid)}
                    </p>
                    <p className="text-lg font-bold text-mp-accent">
                      Pendiente: {formatCurrency(payingExpense.pending_amount || (payingExpense.amount - payingExpense.amount_paid))}
                    </p>
                  </>
                )}
              </div>
              {payingExpense.due_date && (
                <p className="text-sm text-mp-gray-600 mt-1">
                  Vence: {new Date(payingExpense.due_date).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>

            {/* Opciones de pago */}
            <div className="space-y-4">
              {/* Pago Total */}
              <button
                onClick={() => handlePayment('total')}
                className="w-full p-4 border-2 border-mp-secondary rounded-mp hover:bg-green-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-mp-gray-900">💰 Pago Total</h4>
                    <p className="text-sm text-mp-gray-600">Marcar como completamente pagado</p>
                  </div>
                  <p className="font-bold text-mp-secondary">
                    {formatCurrency(payingExpense.pending_amount || (payingExpense.amount - (payingExpense.amount_paid || 0)))}
                  </p>
                </div>
              </button>

              {/* Pago Parcial */}
              <div className="border-2 border-mp-accent rounded-mp p-4">
                <h4 className="font-medium text-mp-gray-900 mb-3">💸 Pago Parcial</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-mp-gray-700 mb-2">
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
                  <div className="text-sm text-mp-gray-600">
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
    </div>
  );
};

export default Expenses; 