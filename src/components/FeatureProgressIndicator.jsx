import React from 'react';
import { useGamification } from '../contexts/GamificationContext';

/**
 * 🎯 FEATURE PROGRESS INDICATOR
 * 
 * Muestra progreso hacia desbloqueo de features en sidebar/menus
 */
const FeatureProgressIndicator = ({ feature, children, showBadge = true }) => {
  const { 
    isFeatureUnlocked, 
    getFeatureAccess, 
    userProfile,
    FEATURE_GATES,
    LEVEL_SYSTEM
  } = useGamification();

  const isUnlocked = isFeatureUnlocked(feature);
  
  // Si ya está desbloqueada, mostrar sin indicadores
  if (isUnlocked) {
    return children;
  }

  const featureData = FEATURE_GATES[feature];
  const access = getFeatureAccess(feature);
  const currentLevel = userProfile?.current_level || 0;
  const requiredLevel = featureData.requiredLevel;
  
  // Calcular progreso
  const currentXP = LEVEL_SYSTEM[currentLevel]?.minXP || 0;
  const targetXP = LEVEL_SYSTEM[requiredLevel]?.minXP || 1;
  const progress = Math.min((currentXP / targetXP) * 100, 100);

  return (
    <div className="relative group">
      {children}
      
      {/* Badge de nivel requerido */}
      {showBadge && (
        <div className="absolute -top-1 -right-1 flex items-center">
          <div 
            className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg"
            style={{ backgroundColor: LEVEL_SYSTEM[requiredLevel]?.color || '#6B7280' }}
          >
            {requiredLevel}
          </div>
        </div>
      )}

      {/* Tooltip con información detallada */}
      <div className="absolute left-full ml-2 top-0 z-50 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        
        {/* Header */}
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-2">{featureData.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {featureData.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Requiere Nivel {requiredLevel}
            </p>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progreso</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {access.xpNeeded} XP restantes
          </p>
        </div>

        {/* Beneficios principales */}
        <div className="space-y-1">
          {featureData.benefits.slice(0, 2).map((benefit, index) => (
            <div key={index} className="flex items-center text-xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">{benefit}</span>
            </div>
          ))}
          {featureData.benefits.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 ml-3">
              +{featureData.benefits.length - 2} más...
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            💡 Continúa usando la app para desbloquear
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 🔓 UNLOCK NOTIFICATION
 * 
 * Componente para mostrar cuando una feature se desbloquea
 */
export const UnlockNotification = ({ feature, onClose }) => {
  const { FEATURE_GATES } = useGamification();
  const featureData = FEATURE_GATES[feature];

  if (!featureData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center animate-bounce">
        <div className="text-6xl mb-4">{featureData.icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ¡Feature Desbloqueada!
        </h2>
        <h3 className="text-xl text-blue-600 dark:text-blue-400 mb-4">
          {featureData.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {featureData.description}
        </p>
        
        <div className="space-y-2 mb-6">
          {featureData.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✨</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          ¡Explorar ahora!
        </button>
      </div>
    </div>
  );
};

export default FeatureProgressIndicator; 