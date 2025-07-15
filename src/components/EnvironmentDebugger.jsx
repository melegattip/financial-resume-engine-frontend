import React, { useState } from 'react';
import envConfig from '../config/environments';

const EnvironmentDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleEnvironmentChange = (env) => {
    if (window.confirm(`¿Cambiar a ambiente ${env}? La página se recargará.`)) {
      envConfig.setEnvironment(env);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Resetear al ambiente auto-detectado? La página se recargará.')) {
      envConfig.resetEnvironment();
    }
  };

  const environments = envConfig.getAllEnvironments();

  // Solo mostrar en desarrollo o si hay ambiente forzado
  if (!envConfig.IS_DEVELOPMENT && !envConfig.debug.forcedEnv) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-white font-medium shadow-lg transition-all duration-200 ${
          envConfig.ENVIRONMENT === 'development' 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : envConfig.ENVIRONMENT === 'render'
            ? 'bg-purple-500 hover:bg-purple-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {envConfig.ENVIRONMENT_NAME}
        {envConfig.debug.forcedEnv && ' (Forzado)'}
      </button>

      {/* Panel de debug */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Environment Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Ambiente actual */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Ambiente Actual:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                envConfig.ENVIRONMENT === 'development'
                  ? 'bg-blue-100 text-blue-800'
                  : envConfig.ENVIRONMENT === 'render'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {envConfig.ENVIRONMENT_NAME}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mb-2">
              API: {envConfig.API_BASE_URL}
            </div>
            
            {envConfig.debug.forcedEnv && (
              <div className="text-xs text-orange-600 mb-2">
                ⚠️ Ambiente forzado manualmente
              </div>
            )}
          </div>

          {/* Cambiar ambiente */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Cambiar Ambiente:</div>
            <div className="space-y-2">
              {Object.entries(environments).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleEnvironmentChange(key)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    envConfig.ENVIRONMENT === key
                      ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={envConfig.ENVIRONMENT === key}
                >
                  <div className="font-medium">{config.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {config.API_BASE_URL}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botón de reset */}
          {envConfig.debug.forcedEnv && (
            <button
              onClick={handleReset}
              className="w-full px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
            >
              🔄 Resetear a Auto-detectado
            </button>
          )}

          {/* Detalles técnicos */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            >
              {showDetails ? '▼' : '▶'} Detalles técnicos
            </button>
            
            {showDetails && (
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Hostname: {envConfig.debug.hostname}</div>
                <div>Detectado: {envConfig.debug.detectedEnv}</div>
                <div>Activo: {envConfig.debug.activeEnv}</div>
                <div>Forzado: {envConfig.debug.forcedEnv || 'No'}</div>
                <div className="pt-1">
                  <div className="font-medium">URLs:</div>
                  <div>API: {envConfig.API_BASE_URL}</div>
                  <div>Gamification: {envConfig.GAMIFICATION_API_URL}</div>
                  <div>AI: {envConfig.AI_API_URL}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentDebugger; 