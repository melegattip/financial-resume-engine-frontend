/**
 * Sistema de logging seguro que ofusca datos sensibles
 * Previene la exposición de PII, tokens, y datos financieros
 */

// Configuración de entorno
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Patrones de datos sensibles a ofuscar
const SENSITIVE_PATTERNS = {
  // Tokens y credenciales
  jwt: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g,
  bearer: /Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g,
  apiKey: /sk-[A-Za-z0-9]{48,}/g,
  
  // Datos personales
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?54)?[\s-]?(\(?\d{2,4}\)?)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
  
  // Datos financieros (montos específicos)
  amount: /\$[\d,]+\.?\d*/g,
  cardNumber: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  
  // IDs de usuario
  userId: /user_id["']?\s*:\s*["']?\d+/gi,
  id: /"id"\s*:\s*\d+/gi
};

// Campos sensibles en objetos
const SENSITIVE_FIELDS = [
  'password', 'token', 'authorization', 'api_key', 'apiKey',
  'email', 'phone', 'amount', 'balance', 'income', 'expense',
  'user_id', 'userId', 'id', 'ID', 'description'
];

/**
 * Ofusca datos sensibles en strings
 */
const obfuscateString = (str) => {
  if (typeof str !== 'string') return str;
  
  let result = str;
  
  // Reemplazar patrones sensibles
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    result = result.replace(pattern, (match) => {
      switch (type) {
        case 'jwt':
        case 'bearer':
          return `[TOKEN_REDACTED_${match.substring(0, 8)}...]`;
        case 'apiKey':
          return `[API_KEY_REDACTED_${match.substring(0, 6)}...]`;
        case 'email':
          const [user, domain] = match.split('@');
          return `${user.substring(0, 2)}***@${domain}`;
        case 'phone':
          return '[PHONE_REDACTED]';
        case 'amount':
          return '[AMOUNT_REDACTED]';
        case 'cardNumber':
          return '[CARD_REDACTED]';
        default:
          return '[DATA_REDACTED]';
      }
    });
  });
  
  return result;
};

/**
 * Ofusca datos sensibles en objetos
 */
const obfuscateObject = (obj, depth = 0) => {
  if (depth > 5) return '[DEEP_OBJECT_REDACTED]'; // Prevenir recursión infinita
  
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => obfuscateObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const result = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      
      // Verificar si es un campo sensible
      const isSensitiveField = SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase())
      );
      
      if (isSensitiveField) {
        if (typeof value === 'string') {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'number') {
          result[key] = '[NUMBER_REDACTED]';
        } else {
          result[key] = '[DATA_REDACTED]';
        }
      } else if (typeof value === 'string') {
        result[key] = obfuscateString(value);
      } else if (typeof value === 'object') {
        result[key] = obfuscateObject(value, depth + 1);
      } else {
        result[key] = value;
      }
    });
    
    return result;
  }
  
  if (typeof obj === 'string') {
    return obfuscateString(obj);
  }
  
  return obj;
};

/**
 * Logger seguro principal
 */
class SecureLogger {
  constructor() {
    this.isEnabled = isDevelopment || process.env.REACT_APP_ENABLE_LOGGING === 'true';
    this.level = process.env.REACT_APP_LOG_LEVEL || 'info';
  }
  
  // Método principal para procesar argumentos
  _processArgs(args) {
    if (!this.isEnabled) return [];
    
    return args.map(arg => {
      if (typeof arg === 'string') {
        return obfuscateString(arg);
      } else if (typeof arg === 'object') {
        return obfuscateObject(arg);
      }
      return arg;
    });
  }
  
  // Métodos de logging
  log(...args) {
    if (!this.isEnabled) return;
    const safeArgs = this._processArgs(args);
    console.log('[SECURE]', ...safeArgs);
  }
  
  info(...args) {
    if (!this.isEnabled) return;
    const safeArgs = this._processArgs(args);
    console.info('[SECURE]', ...safeArgs);
  }
  
  warn(...args) {
    if (!this.isEnabled) return;
    const safeArgs = this._processArgs(args);
    console.warn('[SECURE]', ...safeArgs);
  }
  
  error(...args) {
    if (!this.isEnabled) return;
    const safeArgs = this._processArgs(args);
    console.error('[SECURE]', ...safeArgs);
  }
  
  debug(...args) {
    if (!this.isEnabled || this.level !== 'debug') return;
    const safeArgs = this._processArgs(args);
    console.debug('[SECURE]', ...safeArgs);
  }
  
  // Método especial para logs de API
  apiRequest(config) {
    if (!this.isEnabled) return;
    
    const safeConfig = {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers?.Authorization,
      hasCallerId: !!config.headers?.['X-Caller-ID'],
      // NO loggear headers completos
    };
    
    this.debug('🔧 API Request:', safeConfig);
  }
  
  apiResponse(response) {
    if (!this.isEnabled) return;
    
    const safeResponse = {
      url: response.config?.url,
      status: response.status,
      // NO loggear data de respuesta
    };
    
    this.debug('✅ API Response:', safeResponse);
  }
  
  apiError(error) {
    if (!this.isEnabled) return;
    
    const safeError = {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      timeout: error.code === 'ECONNABORTED' && error.message?.includes('timeout'),
      // NO loggear response data completa
    };
    
    this.error('❌ API Error:', safeError);
  }
}

// Instancia singleton
const secureLogger = new SecureLogger();

// Funciones de conveniencia
export const secureLog = (...args) => secureLogger.log(...args);
export const secureInfo = (...args) => secureLogger.info(...args);
export const secureWarn = (...args) => secureLogger.warn(...args);
export const secureError = (...args) => secureLogger.error(...args);
export const secureDebug = (...args) => secureLogger.debug(...args);

// Métodos especiales
export const logApiRequest = (config) => secureLogger.apiRequest(config);
export const logApiResponse = (response) => secureLogger.apiResponse(response);
export const logApiError = (error) => secureLogger.apiError(error);

export default secureLogger; 