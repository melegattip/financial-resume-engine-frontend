import DOMPurify from 'dompurify';

/**
 * Utilidades de validación y sanitización
 */

// Expresiones regulares para validación
const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  alphanumericSpanish: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ0-9\s]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

/**
 * Sanitizar entrada de texto
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  
  // Eliminar HTML malicioso
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Trim y normalizar espacios
  return sanitized.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitizar entrada HTML
 */
export const sanitizeHTML = (input) => {
  if (typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Validadores específicos
 */
export const validators = {
  required: (value) => ({
    isValid: value != null && value !== '' && String(value).trim() !== '',
    message: 'Este campo es requerido'
  }),

  email: (value) => ({
    isValid: !value || PATTERNS.email.test(value),
    message: 'Formato de email inválido'
  }),

  phone: (value) => ({
    isValid: !value || PATTERNS.phone.test(value),
    message: 'Formato de teléfono inválido'
  }),

  currency: (value) => {
    const numValue = parseFloat(value);
    return {
      isValid: !value || (PATTERNS.currency.test(value) && numValue >= 0),
      message: 'Formato de moneda inválido'
    };
  },

  positiveNumber: (value) => {
    const numValue = parseFloat(value);
    return {
      isValid: !value || (!isNaN(numValue) && numValue > 0),
      message: 'Debe ser un número positivo'
    };
  },

  minLength: (min) => (value) => ({
    isValid: !value || value.length >= min,
    message: `Mínimo ${min} caracteres`
  }),

  maxLength: (max) => (value) => ({
    isValid: !value || value.length <= max,
    message: `Máximo ${max} caracteres`
  }),

  pattern: (pattern, message) => (value) => ({
    isValid: !value || pattern.test(value),
    message
  }),

  alphanumericSpanish: (value) => ({
    isValid: !value || PATTERNS.alphanumericSpanish.test(value),
    message: 'Solo letras, números y espacios permitidos'
  }),

  password: (value) => ({
    isValid: !value || PATTERNS.password.test(value),
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo'
  }),

  url: (value) => ({
    isValid: !value || PATTERNS.url.test(value),
    message: 'URL inválida'
  }),

  dateRange: (startDate, endDate) => (value) => {
    if (!value) return { isValid: true };
    
    const date = new Date(value);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let isValid = true;
    if (start && date < start) isValid = false;
    if (end && date > end) isValid = false;
    
    return {
      isValid,
      message: `Fecha debe estar entre ${start?.toLocaleDateString()} y ${end?.toLocaleDateString()}`
    };
  },

  custom: (validatorFn, message) => (value) => ({
    isValid: validatorFn(value),
    message
  })
};

/**
 * Validar objeto completo
 */
export const validateObject = (data, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    
    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break; // Solo mostrar el primer error por campo
      }
    }
  });

  return { isValid, errors };
};

/**
 * Esquemas de validación para la aplicación financiera
 */
export const schemas = {
  expense: {
    description: [
      validators.required,
      validators.minLength(3),
      validators.maxLength(100),
      validators.alphanumericSpanish
    ],
    amount: [
      validators.required,
      validators.positiveNumber
    ],
    category_id: [
      validators.required
    ],
    due_date: [
      validators.dateRange(new Date(), null)
    ]
  },

  income: {
    description: [
      validators.required,
      validators.minLength(3),
      validators.maxLength(100),
      validators.alphanumericSpanish
    ],
    amount: [
      validators.required,
      validators.positiveNumber
    ],
    category_id: [
      validators.required
    ]
  },

  category: {
    name: [
      validators.required,
      validators.minLength(2),
      validators.maxLength(50),
      validators.alphanumericSpanish
    ],
    description: [
      validators.maxLength(200)
    ]
  },

  user: {
    email: [
      validators.required,
      validators.email
    ],
    password: [
      validators.required,
      validators.password
    ],
    name: [
      validators.required,
      validators.minLength(2),
      validators.maxLength(50),
      validators.pattern(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/, 'Solo letras y espacios')
    ]
  }
};

/**
 * Funciones de sanitización específicas
 */
export const sanitizers = {
  expense: (data) => ({
    description: sanitizeText(data.description),
    amount: parseFloat(data.amount) || 0,
    category_id: parseInt(data.category_id) || null,
    due_date: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : null,
    paid: Boolean(data.paid)
  }),

  income: (data) => ({
    description: sanitizeText(data.description),
    amount: parseFloat(data.amount) || 0,
    category_id: parseInt(data.category_id) || null
  }),

  category: (data) => ({
    name: sanitizeText(data.name),
    description: sanitizeText(data.description)
  }),

  user: (data) => ({
    email: sanitizeText(data.email).toLowerCase(),
    name: sanitizeText(data.name),
    // Nota: Las contraseñas nunca deben sanitizarse, solo validarse
    password: data.password
  })
};

/**
 * Función helper para validar y sanitizar
 */
export const validateAndSanitize = (data, type) => {
  // Sanitizar primero
  const sanitizedData = sanitizers[type] ? sanitizers[type](data) : data;
  
  // Luego validar
  const schema = schemas[type];
  if (!schema) {
    return { isValid: true, data: sanitizedData, errors: {} };
  }
  
  const validation = validateObject(sanitizedData, schema);
  
  return {
    isValid: validation.isValid,
    data: sanitizedData,
    errors: validation.errors
  };
};

/**
 * Rate limiting simple para formularios
 */
class FormRateLimit {
  constructor() {
    this.attempts = new Map();
    this.cooldownPeriod = 60000; // 1 minuto
    this.maxAttempts = 5;
  }

  canSubmit(formId) {
    const now = Date.now();
    const formAttempts = this.attempts.get(formId) || { count: 0, lastAttempt: 0 };
    
    // Reset si pasó el período de cooldown
    if (now - formAttempts.lastAttempt > this.cooldownPeriod) {
      formAttempts.count = 0;
    }
    
    return formAttempts.count < this.maxAttempts;
  }

  recordAttempt(formId) {
    const now = Date.now();
    const formAttempts = this.attempts.get(formId) || { count: 0, lastAttempt: 0 };
    
    formAttempts.count++;
    formAttempts.lastAttempt = now;
    
    this.attempts.set(formId, formAttempts);
  }

  getRemainingCooldown(formId) {
    const formAttempts = this.attempts.get(formId);
    if (!formAttempts || formAttempts.count < this.maxAttempts) {
      return 0;
    }
    
    const elapsed = Date.now() - formAttempts.lastAttempt;
    return Math.max(0, this.cooldownPeriod - elapsed);
  }
}

export const formRateLimit = new FormRateLimit();

export default {
  sanitizeText,
  sanitizeHTML,
  validators,
  validateObject,
  schemas,
  sanitizers,
  validateAndSanitize,
  formRateLimit
}; 