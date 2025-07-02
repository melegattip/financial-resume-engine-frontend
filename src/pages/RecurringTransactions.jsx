import React, { useState, useEffect } from 'react';
import { recurringTransactionsAPI, categoriesAPI, formatCurrency } from '../services/api';
import toast from '../utils/notifications';
import dataService from '../services/dataService';

const RecurringTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProjectionModal, setShowProjectionModal] = useState(false);
  const [showFuturePreview, setShowFuturePreview] = useState(false);
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

  const handleProcessPending = async () => {
    try {
      setLoading(true);
      const response = await recurringTransactionsAPI.processPending();
      const result = response.data;
      
      if (result.success_count > 0) {
        toast.success(`✅ ${result.success_count} transacciones ejecutadas exitosamente`);
        
        // Recargar datos locales primero
        await loadData();
        
        // Invalidar cache inmediatamente
        dataService.invalidateAfterMutation('recurring_transaction');
        
        // Forzar actualización adicional con delay para asegurar sincronización
        setTimeout(() => {
          console.log('🔄 Forzando actualización adicional después de ejecutar transacciones pendientes');
          dataService.invalidateAfterMutation('recurring_transaction');
        }, 1500);
      }
      
      if (result.failure_count > 0) {
        toast.error(`❌ ${result.failure_count} transacciones fallaron`);
      }
      
      if (result.processed_count === 0) {
        toast.info('ℹ️ No hay transacciones pendientes por ejecutar');
      }
      
    } catch (error) {
      console.error('Error processing pending transactions:', error);
      toast.error('Error procesando transacciones pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransaction = async (id) => {
    try {
      const response = await recurringTransactionsAPI.execute(id);
      const result = response.data.data;
      
      if (result.success) {
        toast.success(`✅ Transacción ejecutada exitosamente`);
        if (result.next_execution_date) {
          toast.info(`📅 Próxima ejecución: ${formatDate(result.next_execution_date)}`);
        }
        
        // Recargar datos locales primero
        await loadData();
        
        // Invalidar cache inmediatamente
        dataService.invalidateAfterMutation('recurring_transaction');
        
        // Forzar actualización adicional con delay para asegurar sincronización
        setTimeout(() => {
          console.log('🔄 Forzando actualización adicional después de ejecutar transacción individual');
          dataService.invalidateAfterMutation('recurring_transaction');
        }, 1500);
      } else {
        toast.error(`❌ Error: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Error executing transaction:', error);
      toast.error('Error ejecutando transacción');
    }
  };

  const resetForm = () => {
    setFormData({
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
  };

  const getTypeColor = (type) => {
    return type === 'income' 
      ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' 
      : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30';
  };

  const getTypeText = (type) => {
    return type === 'income' ? 'Ingreso' : 'Gasto';
  };

  const getFrequencyText = (frequency) => {
    const frequencies = {
      daily: 'Diaria',
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual'
    };
    return frequencies[frequency] || frequency;
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDaysUntilNext = (nextDate) => {
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `${diffDays} días`;
  };

  const isTransactionOverdue = (nextDate) => {
    const today = new Date();
    const next = new Date(nextDate);
    return next <= today;
  };

  const generateFuturePreview = () => {
    const futureMonths = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
      const monthName = targetMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      
      // Calcular transacciones que aplicarían en ese mes
      transactions.forEach(transaction => {
        if (!transaction.is_active) return;
        
        const monthlyAmount = calculateMonthlyEquivalent(transaction);
        if (transaction.type === 'income') {
          monthlyIncome += monthlyAmount;
        } else {
          monthlyExpenses += monthlyAmount;
        }
      });
      
      futureMonths.push({
        month: monthName,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        balance: monthlyIncome - monthlyExpenses
      });
    }
    
    return futureMonths;
  };

  const calculateMonthlyEquivalent = (transaction) => {
    switch (transaction.frequency) {
      case 'daily':
        return transaction.amount * 30; // Aproximado
      case 'weekly':
        return transaction.amount * 4.33; // Aproximado
      case 'monthly':
        return transaction.amount;
      case 'yearly':
        return transaction.amount / 12;
      default:
        return transaction.amount;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando transacciones recurrentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Gestiona tus ingresos y gastos automáticos</p>
        </div>
        <div className="flex space-x-3">
          {/* Botón discreto para desarrollo - ejecutar pendientes */}
          <button
            onClick={handleProcessPending}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            title="Ejecutar transacciones pendientes (desarrollo)"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'}
          </button>
          <button
            onClick={() => setShowFuturePreview(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
          >
            Vista Futura
          </button>
          <button
            onClick={loadProjection}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Ver Proyección
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Nueva Transacción
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Activas</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboard.summary?.total_active || 0}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactivas</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{dashboard.summary?.total_inactive || 0}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Mensuales</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(dashboard.summary?.monthly_income_total || 0)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos Mensuales</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(dashboard.summary?.monthly_expense_total || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="input"
          >
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          
          <select
            value={filters.frequency}
            onChange={(e) => setFilters({...filters, frequency: e.target.value})}
            className="input"
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
            className="input"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
          </select>

          <select
            value={filters.category_id}
            onChange={(e) => setFilters({...filters, category_id: e.target.value})}
            className="input"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
            className="input"
          >
            <option value="next_execution_date">Próxima ejecución</option>
            <option value="description">Descripción</option>
            <option value="amount">Monto</option>
            <option value="created_at">Fecha de creación</option>
          </select>

          <select
            value={filters.sort_order}
            onChange={(e) => setFilters({...filters, sort_order: e.target.value})}
            className="input"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay transacciones recurrentes</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Crea tu primera transacción recurrente para automatizar tus finanzas</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Crear Transacción
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transacción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Próxima Ejecución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                        {getTypeText(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {getFrequencyText(transaction.frequency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {getCategoryName(transaction.category_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(transaction.next_date)}
                      </div>
                      <div className={`text-xs font-medium ${
                        isTransactionOverdue(transaction.next_date) 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {isTransactionOverdue(transaction.next_date) && '⚠️ '}
                        {getDaysUntilNext(transaction.next_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.is_active 
                          ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' 
                          : 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30'
                      }`}>
                        {transaction.is_active ? 'Activa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Botón de ejecutar para transacciones vencidas y activas */}
                        {transaction.is_active && isTransactionOverdue(transaction.next_date) && (
                          <button
                            onClick={() => handleExecuteTransaction(transaction.id)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Ejecutar ahora (vencida)"
                          >
                            ⚡
                          </button>
                        )}
                        {transaction.is_active ? (
                          <button
                            onClick={() => handlePause(transaction.id)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Pausar"
                          >
                            ⏸️
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResume(transaction.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Reanudar"
                          >
                            ▶️
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingTransaction ? 'Editar Transacción Recurrente' : 'Nueva Transacción Recurrente'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="input"
                  required
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frecuencia
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="input"
                  required
                >
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="input"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Próxima ejecución
                </label>
                <input
                  type="date"
                  value={formData.next_date}
                  onChange={(e) => setFormData({...formData, next_date: e.target.value})}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Puede ser hoy o cualquier fecha futura
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de fin (opcional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="input"
                  min={formData.next_date || new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Debe ser posterior a la fecha de próxima ejecución
                </p>
              </div>

              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Día del mes (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({...formData, day_of_month: e.target.value})}
                    className="input"
                  />
                </div>
              )}

              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Día de la semana
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                    className="input"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingTransaction ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Future Preview Modal */}
      {showFuturePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                🔮 Vista Futura - Próximos 6 Meses
              </h2>
              <button
                onClick={() => setShowFuturePreview(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 Esta vista muestra una proyección aproximada basada en tus transacciones recurrentes activas.
                Los cálculos son estimativos y pueden variar según fechas específicas y cambios futuros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generateFuturePreview().map((month, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 capitalize">
                    {month.month}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos:</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(month.income)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gastos:</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(month.expenses)}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Balance:</span>
                        <span className={`text-sm font-bold ${
                          month.balance >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(month.balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                🚀 Próximas Funcionalidades
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                <li>• Integración con metas de ahorro</li>
                <li>• Comparación con presupuestos</li>
                <li>• Alertas de desvíos financieros</li>
                <li>• Simulación de escenarios</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Projection Modal */}
      {showProjectionModal && projection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
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
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                </select>
                <button
                  onClick={() => setShowProjectionModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Total Ingresos</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(projection.summary?.total_projected_income || 0)}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Total Gastos</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(projection.summary?.total_projected_expenses || 0)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Flujo Neto</h3>
                <p className={`text-2xl font-bold ${
                  (projection.summary?.net_projected_amount || 0) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(projection.summary?.net_projected_amount || 0)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Mes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Gastos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Flujo Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projection.monthly_projections?.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {month.month_display}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(month.income)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(month.expenses)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        month.net_amount >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Eliminar Transacción Recurrente
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                ¿Estás seguro de que quieres eliminar la transacción "{deletingTransaction.description}"? 
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
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