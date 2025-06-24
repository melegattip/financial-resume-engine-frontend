import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Zap
} from 'lucide-react';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const SmartCategorization = ({ 
  description, 
  selectedCategoryId, 
  onCategorySelect, 
  categories = [],
  disabled = false 
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Función para obtener sugerencia de IA
  const getSuggestion = async (desc) => {
    if (!desc || desc.trim().length < 3) {
      setSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    try {
      setLoading(true);
      const response = await aiAPI.suggestCategory(desc.trim());
      
      if (response.data) {
        // Encontrar la categoría que coincida con la sugerencia
        const suggestedCategory = categories.find(
          cat => cat.name.toLowerCase() === response.data.suggested_category.toLowerCase()
        );

        setSuggestion({
          ...response.data,
          categoryId: suggestedCategory?.id || null,
          categoryExists: !!suggestedCategory
        });
        setShowSuggestion(true);
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      // No mostrar error toast, solo fallar silenciosamente
    } finally {
      setLoading(false);
    }
  };

  // Efecto para obtener sugerencia cuando cambia la descripción
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getSuggestion(description);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [description, categories]);

  // Función para aplicar la sugerencia
  const applySuggestion = () => {
    if (suggestion?.categoryId) {
      onCategorySelect(suggestion.categoryId);
      setShowSuggestion(false);
      toast.success(`Categoría "${suggestion.suggested_category}" aplicada`);
    }
  };

  // Función para descartar la sugerencia
  const dismissSuggestion = () => {
    setShowSuggestion(false);
  };

  // No mostrar nada si está deshabilitado o no hay descripción
  if (disabled || !description || description.trim().length < 3) {
    return null;
  }

  // Mostrar loader mientras carga
  if (loading) {
    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-600">Analizando con IA...</span>
        </div>
      </div>
    );
  }

  // No mostrar si no hay sugerencia o ya está oculta
  if (!showSuggestion || !suggestion) {
    return null;
  }

  // No mostrar si la categoría sugerida ya está seleccionada
  if (suggestion.categoryId && selectedCategoryId === suggestion.categoryId) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="p-1 bg-gradient-to-br from-purple-500 to-blue-600 rounded">
            <Brain className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Sugerencia de IA
            </span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
              suggestion.confidence === 'high' ? 'bg-green-100 text-green-800' :
              suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {suggestion.confidence === 'high' ? 'Alta confianza' :
               suggestion.confidence === 'medium' ? 'Media confianza' : 'Baja confianza'}
            </span>
          </div>
          
          <p className="text-sm text-purple-800 mb-2">
            <span className="font-medium">Categoría sugerida:</span> {suggestion.suggested_category}
          </p>
          
          {suggestion.reasoning && (
            <p className="text-xs text-purple-700 mb-3">
              {suggestion.reasoning}
            </p>
          )}
          
          <div className="flex items-center space-x-2">
            {suggestion.categoryExists ? (
              <button
                onClick={applySuggestion}
                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white text-xs font-medium rounded-md hover:from-purple-600 hover:to-blue-700 transition-colors"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Aplicar
              </button>
            ) : (
              <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md">
                <AlertCircle className="w-3 h-3 mr-1" />
                Categoría no disponible
              </div>
            )}
            
            <button
              onClick={dismissSuggestion}
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCategorization; 