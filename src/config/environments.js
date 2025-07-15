// Configuración de URLs por ambiente
const environments = {
  development: {
    name: 'Development',
    API_BASE_URL: 'http://localhost:8080/api/v1',
    GAMIFICATION_API_URL: 'http://localhost:8081/api/v1',
    AI_API_URL: 'http://localhost:8082/api/v1',
    REDIS_URL: 'redis://localhost:6379',
    WEBSOCKET_URL: 'ws://localhost:8080/ws',
    CORS_ORIGIN: 'http://localhost:3000',
    // Configuración específica para desarrollo
    RATE_LIMIT_DISABLED: true,
    REQUEST_THROTTLE_MS: 100,  // Throttle mínimo entre requests
    CONFIG_CACHE_DISABLED: true  // Deshabilitar cache de configuración
  },
  
  render: {
    name: 'Render.com',
    API_BASE_URL: 'https://financial-resume-engine.onrender.com/api/v1',
    GAMIFICATION_API_URL: 'https://financial-gamification-service.onrender.com/api/v1',
    AI_API_URL: 'https://financial-ai-servicefinancial-ai-service.onrender.com/api/v1',
    REDIS_URL: 'redis://red-d1qmg0juibrs73esqdfg:6379',
    WEBSOCKET_URL: 'wss://financial-resume-engine.onrender.com/ws',
    CORS_ORIGIN: 'https://financial-resume-engine-frontend.onrender.com'
  },
  
  gcp: {
    name: 'Google Cloud Platform',
    API_BASE_URL: 'https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/api/v1',
    GAMIFICATION_API_URL: 'https://stable---financial-gamification-service-ncf3kbolwa-rj.a.run.app/api/v1',
    AI_API_URL: 'https://stable---financial-ai-service-ncf3kbolwa-rj.a.run.app/api/v1',
    REDIS_URL: 'redis://redis-memory-store:6379',
    WEBSOCKET_URL: 'wss://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/ws',
    CORS_ORIGIN: 'https://stable---financial-resume-frontend-ncf3kbolwa-rj.a.run.app'
  }
};

// Detectar ambiente automáticamente
const detectEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('onrender.com') || hostname === 'financial.niloft.com') {
    return 'render';
  } else if (hostname.includes('run.app')) {
    return 'gcp';
  }
  
  // Fallback basado en variables de entorno
  const envFromVar = process.env.REACT_APP_ENVIRONMENT;
  return envFromVar || 'development';
};

// Configuración actual basada en el ambiente
const currentEnvironment = detectEnvironment();
const config = environments[currentEnvironment];

// Función para obtener configuración con fallback
const getConfig = (key, fallback = null) => {
  // Primero intentar variable de entorno específica
  const envVar = process.env[`REACT_APP_${key}`];
  if (envVar) return envVar;
  
  // Luego usar configuración del ambiente
  if (config && config[key]) return config[key];
  
  // Finalmente usar fallback
  return fallback;
};

// Función para cambiar ambiente manualmente (útil para debug)
const setEnvironment = (env) => {
  if (environments[env]) {
    localStorage.setItem('FORCE_ENVIRONMENT', env);
    window.location.reload();
  }
};

// Función para resetear ambiente forzado
const resetEnvironment = () => {
  localStorage.removeItem('FORCE_ENVIRONMENT');
  window.location.reload();
};

// Verificar si hay ambiente forzado
const forcedEnv = localStorage.getItem('FORCE_ENVIRONMENT');
const activeEnvironment = forcedEnv && environments[forcedEnv] ? forcedEnv : currentEnvironment;
const activeConfig = environments[activeEnvironment];

// Exportar configuración
export default {
  // Información del ambiente
  ENVIRONMENT: activeEnvironment,
  ENVIRONMENT_NAME: activeConfig.name,
  
  // URLs de servicios
  API_BASE_URL: getConfig('API_BASE_URL', activeConfig.API_BASE_URL),
  GAMIFICATION_API_URL: getConfig('GAMIFICATION_API_URL', activeConfig.GAMIFICATION_API_URL),
  AI_API_URL: getConfig('AI_API_URL', activeConfig.AI_API_URL),
  REDIS_URL: getConfig('REDIS_URL', activeConfig.REDIS_URL),
  WEBSOCKET_URL: getConfig('WEBSOCKET_URL', activeConfig.WEBSOCKET_URL),
  CORS_ORIGIN: getConfig('CORS_ORIGIN', activeConfig.CORS_ORIGIN),
  
  // Configuración de desarrollo
  IS_DEVELOPMENT: activeEnvironment === 'development',
  IS_PRODUCTION: activeEnvironment !== 'development',
  
  // Funciones utilitarias
  getAllEnvironments: () => environments,
  setEnvironment,
  resetEnvironment,
  
  // Información de debug
  debug: {
    hostname: window.location.hostname,
    detectedEnv: currentEnvironment,
    activeEnv: activeEnvironment,
    forcedEnv,
    config: activeConfig
  }
};

// Debug en consola (solo en desarrollo)
if (activeEnvironment === 'development') {
  console.log('🔧 Environment Config:', {
    environment: activeEnvironment,
    config: activeConfig,
    debug: {
      hostname: window.location.hostname,
      detectedEnv: currentEnvironment,
      forcedEnv
    }
  });
} 