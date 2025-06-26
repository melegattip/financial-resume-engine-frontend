import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-react';
import { useOptimizedAPI } from '../hooks/useOptimizedAPI';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Usar el hook optimizado para operaciones API
  const { 
    categories: categoriesAPI
  } = useOptimizedAPI();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando categorías con API optimizada...');
      
      const response = await categoriesAPI.list();
      const categoriesData = response.data?.data || response.data || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      console.log('✅ Categorías cargadas exitosamente:', categoriesData.length);
    } catch (error) {
      console.error('Error loading categories:', error);
      // No mostrar toast aquí porque useOptimizedAPI ya lo maneja
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        // useOptimizedAPI ya muestra el toast de éxito
      } else {
        await categoriesAPI.create(formData);
        // useOptimizedAPI ya muestra el toast de éxito
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      await loadCategories();
    } catch (error) {
      // useOptimizedAPI ya maneja el error
      console.error('Error en handleSubmit:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await categoriesAPI.delete(category.id);
        // useOptimizedAPI ya muestra el toast de éxito
        await loadCategories();
      } catch (error) {
        // useOptimizedAPI ya maneja el error
        console.error('Error en handleDelete:', error);
      }
    }
  };

  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2 text-fr-gray-600">Cargando categorías...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fr-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input w-full sm:w-64"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Tag className="w-12 h-12 text-fr-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-fr-gray-900 mb-2">No hay categorías</h3>
            <p className="text-fr-gray-500">Comienza creando tu primera categoría</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-fr bg-blue-100">
                    <Tag className="w-5 h-5 text-fr-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-fr-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-fr-gray-500 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-fr text-fr-gray-600 hover:bg-fr-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 rounded-fr text-fr-error hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-fr-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-fr-gray-900 mb-6">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories; 