import React, { useState, useEffect } from 'react';
import { recurringTransactionsAPI, categoriesAPI, formatCurrency } from '../services/api';
import toast from '../utils/notifications';

const RecurringTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProjectionModal, setShowProjectionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [projectionMonths, setProjectionMonths] = useState(6);
  const [filters, setFilters] = useState({
    type: '',
    frequency: '',
    status: '',
    category_id: '',
    sort_by: 'next_execution_date',
    sort_order: 'asc'
  });

  const getDefaultDate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    frequency: 'monthly',
    category_id: '',
    next_date: getDefaultDate(),
    end_date: '',
    day_of_month: '',
    day_of_week: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, categoriesRes, dashboardRes] = await Promise.all([
        recurringTransactionsAPI.list(filters),
        categoriesAPI.list(),
        recurringTransactionsAPI.getDashboard()
      ]);
      
      setTransactions(transactionsRes.data.data?.transactions || []);
      setCategories(categoriesRes.data.data || []);
      setDashboard(dashboardRes.data.data);
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
      toast.error('Error cargando transacciones recurrentes');
    } finally {
      setLoading(false);
    }
  };

  const loadProjection = async (months = projectionMonths) => {
    try {
      const projectionRes = await recurringTransactionsAPI.getProjection(months);
      setProjection(projectionRes.data.data);
      setShowProjectionModal(true);
    } catch (error) {
      console.error('Error loading projection:', error);
      toast.error('Error cargando proyección');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación del frontend
    if (!formData.description || formData.description.trim() === '') {
      toast.error('La descripción es requerida');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    
    if (!formData.next_date) {
      toast.error('La fecha de próxima ejecución es requerida');
      return;
    }
    
    // Validar que la fecha de próxima ejecución no sea en el pasado
    const nextDateString = formData.next_date;
    const todayString = new Date().toISOString().split('T')[0];
    
    if (nextDateString < todayString) {
      toast.error('La fecha de próxima ejecución no puede ser anterior a hoy');
      return;
    }
    
    // Validar fecha de fin si se proporciona
    if (formData.end_date) {
      if (formData.end_date <= nextDateString) {
        toast.error('La fecha de fin debe ser posterior a la fecha de próxima ejecución');
        return;
      }
    }
    
    try {
      const data = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        frequency: formData.frequency,
        category_id: formData.category_id || undefined,
        next_date: formData.next_date,
        auto_create: true, // Por defecto habilitado
        notify_before: 1, // Notificar 1 día antes por defecto
        end_date: formData.end_date || undefined,
        max_executions: undefined // No implementado en el frontend aún
      };

      if (editingTransaction) {
        await recurringTransactionsAPI.update(editingTransaction.id, data);
        toast.success('Transacción recurrente actualizada exitosamente');
      } else {
        await recurringTransactionsAPI.create(data);
        toast.success('Transacción recurrente creada exitosamente');
      }

      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error guardando transacción recurrente';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description || '',
      amount: transaction.amount.toString(),
      type: transaction.type,
      frequency: transaction.frequency,
      category_id: transaction.category_id || '',
      next_date: transaction.next_date,
      end_date: transaction.end_date || '',
      day_of_month: transaction.day_of_month?.toString() || '',
      day_of_week: transaction.day_of_week?.toString() || '',
      is_active: transaction.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletingTransaction) {
      try {
        await recurringTransactionsAPI.delete(deletingTransaction.id);
        toast.success('Transacción recurrente eliminada exitosamente');
        loadData();
      } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        toast.error('Error eliminando transacción recurrente');
      } finally {
        setShowDeleteModal(false);
        setDeletingTransaction(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingTransaction(null);
  };

  const handlePause = async (id) => {
    try {
      await recurringTransactionsAPI.pause(id);
      toast.success('Transacción pausada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error pausing transaction:', error);
      toast.error('Error pausando transacción');
    }
  };

  const handleResume = async (id) => {
    try {
      await recurringTransactionsAPI.resume(id);
      toast.success('Transacción reanudada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error resuming transaction:', error);
      toast.error('Error reanudando transacción');
    }
  };





  const resetForm = () => {
    // Calcular fecha por defecto (próximo mes)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1); // Primer día del próximo mes
    const defaultDate = nextMonth.toISOString().split('T')[0];
    
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      frequency: 'monthly',
      category_id: '',
      next_date: defaultDate,
      end_date: '',
      day_of_month: '',
      day_of_week: '',
      is_active: true
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'text-green-600 bg-green-100';
      case 'expense': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'income': return 'Ingreso';
      case 'expense': return 'Gasto';
      default: return type;
    }
  };

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'daily': return 'Diaria';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      case 'yearly': return 'Anual';
      default: return frequency;
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilNext = (nextDate) => {
    if (!nextDate) return 'N/A';
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `${diffDays} días`;
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-fr-gray-600">Cargando transacciones recurrentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-fr-gray-600">Gestiona tus ingresos y gastos automáticos</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadProjection}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ver Proyección
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-fr-primary text-white px-4 py-2 rounded-lg hover:bg-fr-primary-dark transition-colors"
          >
            Nueva Transacción
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Total Activas</h3>
            <p className="text-2xl font-bold text-fr-gray-900">{dashboard.summary?.total_active || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Inactivas</h3>
            <p className="text-2xl font-bold text-yellow-600">{dashboard.summary?.total_inactive || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Ingresos Mensuales</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard.summary?.monthly_income_total || 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Gastos Mensuales</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(dashboard.summary?.monthly_expense_total || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          
          <select
            value={filters.frequency}
            onChange={(e) => setFilters({...filters, frequency: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todas las frecuencias</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
          </select>

          <select
            value={filters.category_id}
            onChange={(e) => setFilters({...filters, category_id: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="next_execution_date">Próxima ejecución</option>
            <option value="description">Descripción</option>
            <option value="amount">Monto</option>
            <option value="created_at">Fecha de creación</option>
          </select>

          <select
            value={filters.sort_order}
            onChange={(e) => setFilters({...filters, sort_order: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-fr-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-fr-gray-900 mb-2">No hay transacciones recurrentes</h3>
            <p className="text-fr-gray-600 mb-4">Crea tu primera transacción recurrente para automatizar tus finanzas</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-fr-primary text-white px-4 py-2 rounded-lg hover:bg-fr-primary-dark transition-colors"
            >
              Crear Transacción
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-fr-gray-200">
              <thead className="bg-fr-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Transacción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Próxima Ejecución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-fr-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-fr-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-fr-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-fr-gray-900">{transaction.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                        {getTypeText(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fr-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fr-gray-900">
                      {getFrequencyText(transaction.frequency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fr-gray-900">
                      {getCategoryName(transaction.category_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-fr-gray-900">
                        {formatDate(transaction.next_date)}
                      </div>
                      <div className="text-xs text-fr-gray-500">
                        {getDaysUntilNext(transaction.next_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.is_active ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                      }`}>
                        {transaction.is_active ? 'Activa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {transaction.is_active ? (
                          <button
                            onClick={() => handlePause(transaction.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Pausar"
                          >
                            ⏸️
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResume(transaction.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Reanudar"
                          >
                            ▶️
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-fr-primary hover:text-fr-primary-dark"
                          title="Editar"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-fr-gray-900 mb-4">
              {editingTransaction ? 'Editar Transacción Recurrente' : 'Nueva Transacción Recurrente'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Próxima ejecución
                </label>
                <input
                  type="date"
                  value={formData.next_date}
                  onChange={(e) => setFormData({...formData, next_date: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <p className="text-xs text-fr-gray-500 mt-1">
                  Puede ser hoy o cualquier fecha futura
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Fecha de fin (opcional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  min={formData.next_date || new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-fr-gray-500 mt-1">
                  Debe ser posterior a la fecha de próxima ejecución
                </p>
              </div>

              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                    Día del mes (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({...formData, day_of_month: e.target.value})}
                    className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                    Día de la semana
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                    className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Seleccionar día</option>
                    <option value="0">Domingo</option>
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                  </select>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 text-fr-primary focus:ring-fr-primary border-fr-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-fr-gray-700">
                  Activa
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-fr-gray-700 border border-fr-gray-300 rounded-lg hover:bg-fr-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-fr-primary text-white rounded-lg hover:bg-fr-primary-dark"
                >
                  {editingTransaction ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projection Modal */}
      {showProjectionModal && projection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-fr-gray-900">
                Proyección de Flujo de Caja - {projectionMonths} meses
              </h2>
              <div className="flex items-center space-x-2">
                <select
                  value={projectionMonths}
                  onChange={(e) => {
                    const newMonths = parseInt(e.target.value);
                    setProjectionMonths(newMonths);
                    // Trigger automatic update with the new value
                    loadProjection(newMonths);
                  }}
                  className="border border-fr-gray-300 rounded px-2 py-1"
                >
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                </select>
                <button
                  onClick={() => setShowProjectionModal(false)}
                  className="text-fr-gray-500 hover:text-fr-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Total Ingresos</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(projection.summary?.total_projected_income || 0)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-800">Total Gastos</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(projection.summary?.total_projected_expenses || 0)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Flujo Neto</h3>
                <p className={`text-2xl font-bold ${
                  (projection.summary?.net_projected_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(projection.summary?.net_projected_amount || 0)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-fr-gray-200">
                <thead className="bg-fr-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase">
                      Mes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase">
                      Gastos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fr-gray-500 uppercase">
                      Flujo Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-fr-gray-200">
                  {projection.monthly_projections?.map((month, index) => (
                    <tr key={index} className="hover:bg-fr-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-fr-gray-900">
                        {month.month_display}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(month.income)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(month.expenses)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        month.net_amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(month.net_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Eliminar Transacción Recurrente
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de que quieres eliminar la transacción "{deletingTransaction.description}"? 
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringTransactions; 