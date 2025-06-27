import React, { useState, useEffect } from 'react';
import { savingsGoalsAPI, formatCurrency } from '../services/api';
import toast from '../utils/notifications';

const SavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [transactionGoal, setTransactionGoal] = useState(null);
  const [transactionType, setTransactionType] = useState('deposit');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    category: 'emergency',
    priority: 'medium',
    auto_save_amount: '',
    auto_save_frequency: 'monthly'
  });

  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsRes, dashboardRes] = await Promise.all([
        savingsGoalsAPI.list(filters),
        savingsGoalsAPI.getDashboard()
      ]);
      
      setGoals(goalsRes.data.data?.goals || []);
      setDashboard(dashboardRes.data.data);
    } catch (error) {
      console.error('Error loading savings goals:', error);
      toast.error('Error cargando metas de ahorro');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
        auto_save_amount: parseFloat(formData.auto_save_amount || 0)
      };

      if (editingGoal) {
        await savingsGoalsAPI.update(editingGoal.id, data);
        toast.success('Meta de ahorro actualizada exitosamente');
      } else {
        await savingsGoalsAPI.create(data);
        toast.success('Meta de ahorro creada exitosamente');
      }

      setShowModal(false);
      setEditingGoal(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Error guardando meta de ahorro');
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      const data = {
        amount: parseFloat(transactionData.amount),
        description: transactionData.description
      };

      if (transactionType === 'deposit') {
        await savingsGoalsAPI.deposit(transactionGoal.id, data);
        toast.success('Depósito realizado exitosamente');
      } else {
        await savingsGoalsAPI.withdraw(transactionGoal.id, data);
        toast.success('Retiro realizado exitosamente');
      }

      setShowTransactionModal(false);
      setTransactionGoal(null);
      setTransactionData({ amount: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Error procesando transacción');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date,
      category: goal.category,
      priority: goal.priority,
      auto_save_amount: goal.auto_save_amount?.toString() || '',
      auto_save_frequency: goal.auto_save_frequency || 'monthly'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta meta de ahorro?')) {
      try {
        await savingsGoalsAPI.delete(id);
        toast.success('Meta de ahorro eliminada exitosamente');
        loadData();
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Error eliminando meta de ahorro');
      }
    }
  };

  const handlePause = async (id) => {
    try {
      await savingsGoalsAPI.pause(id);
      toast.success('Meta pausada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error pausing goal:', error);
      toast.error('Error pausando meta');
    }
  };

  const handleResume = async (id) => {
    try {
      await savingsGoalsAPI.resume(id);
      toast.success('Meta reanudada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error resuming goal:', error);
      toast.error('Error reanudando meta');
    }
  };

  const openTransactionModal = (goal, type) => {
    setTransactionGoal(goal);
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_amount: '',
      current_amount: '',
      target_date: '',
      category: 'emergency',
      priority: 'medium',
      auto_save_amount: '',
      auto_save_frequency: 'monthly'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'achieved': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'achieved': return 'Lograda';
      case 'paused': return 'Pausada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'emergency': return 'Emergencia';
      case 'vacation': return 'Vacaciones';
      case 'house': return 'Casa';
      case 'education': return 'Educación';
      case 'retirement': return 'Jubilación';
      case 'investment': return 'Inversión';
      case 'other': return 'Otro';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-fr-gray-600">Cargando metas de ahorro...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-fr-gray-900">Metas de Ahorro</h1>
          <p className="text-fr-gray-600">Gestiona tus objetivos financieros</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-fr-primary text-white px-4 py-2 rounded-lg hover:bg-fr-primary-dark transition-colors"
        >
          Nueva Meta
        </button>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Total Metas</h3>
            <p className="text-2xl font-bold text-fr-gray-900">{dashboard.summary?.total_goals || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Metas Activas</h3>
            <p className="text-2xl font-bold text-blue-600">{dashboard.summary?.active_goals || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Total Ahorrado</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard.summary?.total_saved || 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-fr-gray-500">Meta Total</h3>
            <p className="text-2xl font-bold text-fr-gray-900">
              {formatCurrency(dashboard.summary?.total_target || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="achieved">Lograda</option>
            <option value="paused">Pausada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todas las categorías</option>
            <option value="emergency">Emergencia</option>
            <option value="vacation">Vacaciones</option>
            <option value="house">Casa</option>
            <option value="education">Educación</option>
            <option value="retirement">Jubilación</option>
            <option value="investment">Inversión</option>
            <option value="other">Otro</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="created_at">Fecha de creación</option>
            <option value="name">Nombre</option>
            <option value="target_amount">Monto objetivo</option>
            <option value="progress_percentage">% Progreso</option>
            <option value="target_date">Fecha objetivo</option>
          </select>

          <select
            value={filters.sort_order}
            onChange={(e) => setFilters({...filters, sort_order: e.target.value})}
            className="border border-fr-gray-300 rounded-lg px-3 py-2"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-fr-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-fr-gray-900 mb-2">No hay metas de ahorro</h3>
            <p className="text-fr-gray-600 mb-4">Crea tu primera meta para empezar a ahorrar</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-fr-primary text-white px-4 py-2 rounded-lg hover:bg-fr-primary-dark transition-colors"
            >
              Crear Meta
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-fr-gray-900 truncate">{goal.name}</h3>
                  <div className="flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(goal.status)}`}>
                      {getStatusText(goal.status)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(goal.priority)}`}>
                      {getPriorityText(goal.priority)}
                    </span>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-fr-gray-600 mb-4 line-clamp-2">{goal.description}</p>
                )}

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-fr-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{goal.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-fr-gray-200 rounded-full h-3">
                    <div
                      className="bg-fr-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-fr-gray-600 mt-1">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-fr-gray-600 mb-4">
                  <div>
                    <span className="block font-medium">Categoría</span>
                    <span>{getCategoryText(goal.category)}</span>
                  </div>
                  <div>
                    <span className="block font-medium">Fecha objetivo</span>
                    <span>{new Date(goal.target_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {goal.auto_save_amount > 0 && (
                  <div className="bg-fr-gray-50 p-3 rounded-lg mb-4">
                    <div className="text-sm text-fr-gray-600">
                      <span className="font-medium">Auto-ahorro:</span> {formatCurrency(goal.auto_save_amount)} {goal.auto_save_frequency === 'monthly' ? 'mensual' : goal.auto_save_frequency}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {goal.status === 'active' && (
                    <>
                      <button
                        onClick={() => openTransactionModal(goal, 'deposit')}
                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        Depositar
                      </button>
                      <button
                        onClick={() => openTransactionModal(goal, 'withdraw')}
                        className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 transition-colors"
                      >
                        Retirar
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleEdit(goal)}
                    className="bg-fr-primary text-white px-3 py-2 rounded text-sm hover:bg-fr-primary-dark transition-colors"
                  >
                    Editar
                  </button>
                  
                  {goal.status === 'active' ? (
                    <button
                      onClick={() => handlePause(goal.id)}
                      className="bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Pausar
                    </button>
                  ) : goal.status === 'paused' ? (
                    <button
                      onClick={() => handleResume(goal.id)}
                      className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Reanudar
                    </button>
                  ) : null}
                  
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-fr-gray-900 mb-4">
              {editingGoal ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Monto objetivo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Monto actual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Fecha objetivo
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="emergency">Emergencia</option>
                  <option value="vacation">Vacaciones</option>
                  <option value="house">Casa</option>
                  <option value="education">Educación</option>
                  <option value="retirement">Jubilación</option>
                  <option value="investment">Inversión</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Auto-ahorro (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.auto_save_amount}
                  onChange={(e) => setFormData({...formData, auto_save_amount: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Frecuencia de auto-ahorro
                </label>
                <select
                  value={formData.auto_save_frequency}
                  onChange={(e) => setFormData({...formData, auto_save_frequency: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoal(null);
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
                  {editingGoal ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-fr-gray-900 mb-4">
              {transactionType === 'deposit' ? 'Depositar en' : 'Retirar de'} "{transactionGoal?.name}"
            </h2>
            
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                  className="w-full border border-fr-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    setTransactionGoal(null);
                    setTransactionData({ amount: '', description: '' });
                  }}
                  className="px-4 py-2 text-fr-gray-700 border border-fr-gray-300 rounded-lg hover:bg-fr-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${
                    transactionType === 'deposit' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {transactionType === 'deposit' ? 'Depositar' : 'Retirar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals; 