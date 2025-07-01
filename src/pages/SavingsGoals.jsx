import React, { useState, useEffect } from 'react';
import { savingsGoalsAPI, formatCurrency } from '../services/api';
import toast from '../utils/notifications';
import ConfirmationModal from '../components/ConfirmationModal';

const SavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [transactionGoal, setTransactionGoal] = useState(null);
  const [transactionType, setTransactionType] = useState('deposit');
  const [selectedGoal, setSelectedGoal] = useState(null);
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

  // Estados para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDelete = (goal) => {
    setDeletingGoal(goal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingGoal) return;
    
    try {
      setDeleteLoading(true);
      await savingsGoalsAPI.delete(deletingGoal.id);
      toast.success('Meta de ahorro eliminada exitosamente');
      loadData();
      setShowDeleteModal(false);
      setDeletingGoal(null);
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Error eliminando meta de ahorro');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingGoal(null);
    setDeleteLoading(false);
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
      category: 'money',
      priority: 'medium',
      auto_save_amount: '',
      auto_save_frequency: 'monthly'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'achieved': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/50';
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
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/50';
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
    const icon = iconOptions.find(option => option.value === category);
    return icon ? icon.label : category;
  };

  // Opciones de iconos disponibles
  const iconOptions = [
    { value: 'car', emoji: '🚗', label: 'Auto' },
    { value: 'house', emoji: '🏠', label: 'Casa' },
    { value: 'vacation', emoji: '✈️', label: 'Vacaciones' },
    { value: 'education', emoji: '📚', label: 'Educación' },
    { value: 'emergency', emoji: '🏥', label: 'Emergencia' },
    { value: 'investment', emoji: '📈', label: 'Inversión' },
    { value: 'wedding', emoji: '💒', label: 'Boda' },
    { value: 'baby', emoji: '👶', label: 'Bebé' },
    { value: 'pet', emoji: '🐕', label: 'Mascota' },
    { value: 'technology', emoji: '💻', label: 'Tecnología' },
    { value: 'sports', emoji: '⚽', label: 'Deportes' },
    { value: 'music', emoji: '🎵', label: 'Música' },
    { value: 'food', emoji: '🍕', label: 'Comida' },
    { value: 'shopping', emoji: '🛍️', label: 'Compras' },
    { value: 'gift', emoji: '🎁', label: 'Regalo' },
    { value: 'money', emoji: '💰', label: 'Dinero' }
  ];

  const getCategoryIcon = (category) => {
    const icon = iconOptions.find(option => option.value === category);
    return icon ? icon.emoji : '💰';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando metas de ahorro...</span>
      </div>
    );
  }

  // Vista detalle de una meta específica
  if (selectedGoal) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 rounded-2xl mx-4 mt-4 p-6 shadow-sm border dark:border-gray-700">
            {/* Header con botón de regreso */}
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setSelectedGoal(null)}
                className="flex items-center text-blue-500 dark:text-blue-400 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Ir a mis metas
              </button>
            </div>

            {/* Título y imagen */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{selectedGoal.name}</h1>
              <div className="text-6xl mb-6">{getCategoryIcon(selectedGoal.category)}</div>
              
              <div className="mb-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {formatCurrency(selectedGoal.current_amount)}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-center space-x-8 mb-8">
                <button 
                  onClick={() => openTransactionModal(selectedGoal, 'deposit')}
                  className="flex flex-col items-center relative group"
                  title="Depositar dinero en esta meta"
                >
                  <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
                    <span className="text-2xl">💰</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Ahorrar</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Depositar dinero en esta meta
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                  </div>
                </button>
                
                <button 
                  onClick={() => openTransactionModal(selectedGoal, 'withdraw')}
                  className="flex flex-col items-center relative group"
                  title="Retirar dinero de esta meta"
                >
                  <div className="w-16 h-16 bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
                    <span className="text-2xl">💸</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Retirar</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Retirar dinero de esta meta
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleEdit(selectedGoal)}
                  className="flex flex-col items-center relative group"
                  title="Editar configuración de la meta"
                >
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
                    <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Configurar</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Editar configuración de la meta
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto mx-4 border dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoal(null);
                    resetForm();
                  }}
                  className="flex items-center text-blue-500 dark:text-blue-400 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a mis metas
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                Configurá tu meta de ahorro
              </h2>

              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{getCategoryIcon(formData.category)}</div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {iconOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({...formData, category: option.value})}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.category === option.value
                            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.emoji}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Smiles, Seguro Santander"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Meta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Ingresá el monto que deseás alcanzar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Plazo
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Elegí la fecha para lograr tu objetivo"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 dark:bg-blue-600 text-white py-4 rounded-lg text-lg font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  {editingGoal ? 'Actualizar Meta' : 'Crear Meta'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                {transactionType === 'deposit' ? 'Depositar' : 'Retirar'} - {transactionGoal?.name}
              </h2>
              
              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionData.amount}
                    onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={transactionData.description}
                    onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows="3"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-lg text-white transition-colors ${
                      transactionType === 'deposit' 
                        ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' 
                        : 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
                    }`}
                  >
                    {transactionType === 'deposit' ? 'Depositar' : 'Retirar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Eliminar Meta de Ahorro"
          message={`¿Estás seguro de que quieres eliminar la meta "${deletingGoal?.name}"? Esta acción no se puede deshacer y se perderá todo el historial asociado.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          loading={deleteLoading}
        />
      </>
    );
  }

  // Vista principal de ahorros
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header con total ahorrado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl mx-4 mt-4 p-6 shadow-sm border dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Total ahorrado</h2>
          <div className="flex items-baseline mb-3">
            <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(dashboard?.summary?.total_saved || 0)}
            </span>
          </div>

          {/* Botón de crear */}
          <div className="flex justify-center mb-8">
            <button 
              onClick={() => setShowModal(true)}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-2 hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Crear</span>
            </button>
          </div>

          {/* Lista de metas de ahorro */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Tus metas de ahorro</h3>
            <div className="space-y-3">
              {goals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay metas de ahorro</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Crea tu primera meta para empezar a ahorrar</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    Crear Meta
                  </button>
                </div>
              ) : (
                goals.map((goal) => (
                  <div 
                    key={goal.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedGoal(goal)}
                  >
                    {/* Icono */}
                    <div className="text-3xl">
                      {getCategoryIcon(goal.category)}
                    </div>
                    
                    {/* Título y categoría */}
                    <div className="flex-1 ml-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{goal.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getCategoryText(goal.category)}</p>
                    </div>
                    
                    {/* Botones circulares de acción */}
                    <div className="flex space-x-3 mx-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTransactionModal(goal, 'deposit');
                        }}
                        className="flex flex-col items-center relative group"
                        title="Depositar dinero"
                      >
                        <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                          <span className="text-lg">💰</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Depositar dinero
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                        </div>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTransactionModal(goal, 'withdraw');
                        }}
                        className="flex flex-col items-center relative group"
                        title="Retirar dinero"
                      >
                        <div className="w-10 h-10 bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                          <span className="text-lg">💸</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Retirar dinero
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                        </div>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGoal(goal);
                        }}
                        className="flex flex-col items-center relative group"
                        title="Ver detalles"
                      >
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Ver detalles
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                        </div>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(goal);
                        }}
                        className="flex flex-col items-center relative group"
                        title="Eliminar meta"
                      >
                        <div className="w-10 h-10 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Eliminar meta
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Monto */}
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(goal.current_amount)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto mx-4 border dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingGoal(null);
                  resetForm();
                }}
                className="flex items-center text-blue-500 dark:text-blue-400 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a mis metas
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Configurá tu meta de ahorro
            </h2>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{getCategoryIcon(formData.category)}</div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Icono
                </label>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {iconOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, category: option.value})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.category === option.value
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Smiles, Seguro Santander"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Meta
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ingresá el monto que deseás alcanzar"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Plazo
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Elegí la fecha para lograr tu objetivo"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 dark:bg-blue-600 text-white py-4 rounded-lg text-lg font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                {editingGoal ? 'Actualizar Meta' : 'Crear Meta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {transactionType === 'deposit' ? 'Depositar' : 'Retirar'} - {transactionGoal?.name}
            </h2>
            
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows="3"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 rounded-lg text-white transition-colors ${
                    transactionType === 'deposit' 
                      ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' 
                      : 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
                  }`}
                >
                  {transactionType === 'deposit' ? 'Depositar' : 'Retirar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Meta de Ahorro"
        message={`¿Estás seguro de que quieres eliminar la meta "${deletingGoal?.name}"? Esta acción no se puede deshacer y se perderá todo el historial asociado.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteLoading}
      />
    </>
  );
};

export default SavingsGoals; 