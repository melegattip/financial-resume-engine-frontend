import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { incomesAPI, categoriesAPI, formatCurrency } from '../services/api';
import { mockIncomes, mockCategories, simulateNetworkDelay, createMockResponse } from '../services/mockData';
import { usePeriod } from '../contexts/PeriodContext';
import toast from 'react-hot-toast';

const Incomes = () => {
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
  });

  // Usar el contexto global de período
  const {
    selectedYear,
    selectedMonth,
    balancesHidden,
  } = usePeriod();

  const formatAmount = (amount) => {
    if (balancesHidden) return '••••••';
    return formatCurrency(amount);
  };

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [incomesResponse, categoriesResponse] = await Promise.all([
        incomesAPI.list(),
        categoriesAPI.list(),
      ]);
      
      // Asegurar que siempre sean arrays
      const incomesData = incomesResponse.data?.incomes || incomesResponse.data || [];
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || [];
      
      setIncomes(Array.isArray(incomesData) ? incomesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.warn('⚠️ API no disponible, usando datos mock:', error.message);
      
      // Fallback a datos mock
      await simulateNetworkDelay(300);
      setIncomes(mockIncomes);
      setCategories(mockCategories);
      
      toast.success('🚧 Usando datos de ejemplo (backend no disponible)', {
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convertir amount a número antes de enviar
      const dataToSend = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingIncome) {
        await incomesAPI.update(editingIncome.user_id, editingIncome.id, dataToSend);
        toast.success('Ingreso actualizado correctamente');
      } else {
        await incomesAPI.create(dataToSend);
        toast.success('Ingreso creado correctamente');
      }
      setShowModal(false);
      setEditingIncome(null);
      setFormData({ description: '', amount: '', category_id: '' });
      loadData();
    } catch (error) {
      toast.error('Error al guardar el ingreso');
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setFormData({
      description: income.description,
      amount: income.amount.toString(),
      category_id: income.category_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (income) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      try {
        await incomesAPI.delete(income.user_id, income.id);
        toast.success('Ingreso eliminado correctamente');
        loadData();
      } catch (error) {
        toast.error('Error al eliminar el ingreso');
      }
    }
  };

  const filteredIncomes = Array.isArray(incomes) 
    ? incomes.filter(income => {
        const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtros de fecha
        const incomeDate = new Date(income.created_at);
        const matchesYear = !selectedYear || incomeDate.getFullYear().toString() === selectedYear;
        const matchesMonth = !selectedMonth || income.created_at.slice(0, 7) === selectedMonth;
        
        return matchesSearch && matchesYear && matchesMonth;
      })
    : [];

  const totalIncomes = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-mp-gray-600">Cargando ingresos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-mp-secondary">{formatAmount(totalIncomes)}</p>
            </div>
            <div className="p-3 rounded-mp bg-green-100">
              <TrendingUp className="w-6 h-6 text-mp-secondary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-mp-gray-600">Cantidad de Ingresos</p>
              <p className="text-2xl font-bold text-mp-secondary">{filteredIncomes.length}</p>
            </div>
            <div className="p-3 rounded-mp bg-green-100">
              <TrendingUp className="w-6 h-6 text-mp-secondary" />
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Primera fila: Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mp-gray-400" />
              <input
                type="text"
                placeholder="Buscar ingresos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input w-full sm:w-64"
              />
            </div>


          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ingreso</span>
          </button>
        </div>
      </div>

      {/* Lista de ingresos */}
      <div className="card">
        <div className="space-y-4">
          {filteredIncomes.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-mp-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-mp-gray-900 mb-2">No hay ingresos</h3>
              <p className="text-mp-gray-500">Comienza agregando tu primer ingreso</p>
            </div>
          ) : (
            filteredIncomes.map((income) => {
              const category = categories.find(c => c.id === income.category_id);
              return (
                <div key={income.id} className="flex items-center justify-between p-4 rounded-mp bg-mp-gray-50 hover:bg-mp-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-mp bg-green-100">
                      <TrendingUp className="w-5 h-5 text-mp-secondary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-mp-gray-900">{income.description}</h3>
                        {category && (
                          <span className="badge-info">{category.name}</span>
                        )}
                      </div>
                      <div className="text-sm text-mp-gray-500 mt-1">
                        Creado: {new Date(income.created_at).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-mp-secondary text-lg">
                        +{formatAmount(income.amount)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(income)}
                        className="p-2 rounded-mp text-mp-gray-600 hover:bg-mp-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income)}
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
      {showModal && (
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-mp-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-mp-gray-900 mb-6">
                {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
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

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingIncome(null);
                      setFormData({ description: '', amount: '', category_id: '' });
                    }}
                    className="btn-outline flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-secondary flex-1">
                    {editingIncome ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default Incomes; 