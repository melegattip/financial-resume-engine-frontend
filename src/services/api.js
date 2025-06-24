import axios from 'axios';
import toast from '../utils/notifications';
import { logApiRequest, logApiResponse, logApiError, secureDebug } from '../utils/secureLogger';
import { SecureTokenStorage, SecureUserStorage } from '../utils/secureStorage';
import authService from './authService';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuración especial para IA con timeout extendido
const aiApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000, // 30 segundos para IA
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener el token desde authService o almacenamiento seguro
const getAuthToken = () => {
  // Intentar obtener el token del authService primero (en memoria)
  let token = authService.getToken();
  
  // Si no está en memoria, intentar del almacenamiento seguro
  if (!token) {
    token = SecureTokenStorage.getToken();
  }
  
  return token;
};

// Función para obtener el usuario actual desde authService o almacenamiento seguro
const getCurrentUser = () => {
  try {
    // Intentar obtener el usuario del authService primero (en memoria)
    let user = authService.getCurrentUser();
    
    // Si no está en memoria, intentar del almacenamiento seguro
    if (!user) {
      user = SecureUserStorage.getUser();
    }
    
    return user;
  } catch (error) {
    secureDebug('Error retrieving user data:', error);
    return null;
  }
};

// Función para configurar interceptors en ambas instancias
const setupInterceptors = (apiInstance) => {
// Interceptor para agregar el token JWT y X-Caller-ID
  apiInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    // Logs de depuración
    console.log('🔧 Interceptor Debug:', {
      url: config.url,
      token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
      user: user ? `ID: ${user.id}` : 'NO USER'
    });
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Token agregado al header Authorization');
    } else {
      console.log('❌ NO se agregó token - token no encontrado');
    }
    
    // Agregar X-Caller-ID si tenemos usuario autenticado
    let userId = null;
    if (user) {
      userId = user.id || user.ID || user.user_id || user.userId;
    }
    
    if (userId) {
      const callerIdValue = userId.toString();
      config.headers['X-Caller-ID'] = callerIdValue;
      console.log('✅ X-Caller-ID agregado:', callerIdValue);
    } else {
      console.log('❌ NO se agregó X-Caller-ID - usuario no encontrado');
    }
      
      // Log seguro de la request
      logApiRequest(config);
    
    return config;
  },
  (error) => {
      secureDebug('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
  apiInstance.interceptors.response.use(
  (response) => {
      logApiResponse(response);
    return response;
  },
  (error) => {
      logApiError(error);
    
    const message = error.response?.data?.error || error.message || 'Error desconocido';
    
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        toast.error('La operación tomó demasiado tiempo. Intenta de nuevo.');
      } else if (error.response?.status === 401) {
      toast.error('No autorizado - Inicia sesión');
      // Podrías redirigir al login aquí si es necesario
      // window.location.href = '/login';
    } else if (error.response?.status === 404) {
      toast.error('Recurso no encontrado');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);
};

// Configurar interceptors en ambas instancias
setupInterceptors(api);
setupInterceptors(aiApi);

// Servicios de Categorías
export const categoriesAPI = {
  list: () => api.get('/categories'),
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Servicios de Gastos
export const expensesAPI = {
  list: () => api.get('/expenses'),
  listUnpaid: () => api.get('/expenses/unpaid'),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Servicios de Ingresos
export const incomesAPI = {
  list: () => api.get('/incomes'),
  get: (id) => api.get(`/incomes/${id}`),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.patch(`/incomes/${id}`, data),
  delete: (id) => api.delete(`/incomes/${id}`),
};

// Servicios de Reportes
export const reportsAPI = {
  generate: (startDate, endDate) => 
    api.get('/reports', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }),
};

// Servicios de Dashboard y Analytics
export const dashboardAPI = {
  overview: (params) => api.get('/dashboard', { params }),
};

export const analyticsAPI = {
  expenses: (params) => api.get('/analytics/expenses', { params }),
  incomes: (params) => api.get('/analytics/incomes', { params }),
  categories: (params) => api.get('/analytics/categories', { params }),
};

// Servicios de IA (NUEVOS) - Usando aiApi con timeout extendido
export const aiAPI = {
  // Obtener insights financieros inteligentes
  getInsights: (params) => aiApi.get('/ai/insights', { params }),
  
  // Analizar patrones de gastos
  getPatterns: (params) => aiApi.get('/ai/patterns', { params }),
  
  // Sugerir categorización automática
  suggestCategory: (description) => aiApi.post('/ai/categorize', { description }),
};

// Utilidades
export const formatCurrency = (amount) => {
  // Validar que amount sea un número válido
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || amount === null || amount === undefined) {
    return '$0,00';
  }
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(numericAmount);
};

export const formatDate = (date) => {
  // Validar que date sea válida
  if (!date || date === null || date === undefined) {
    return 'Fecha no disponible';
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }
  
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

export const formatPercentage = (percentage) => {
  // Validar que percentage sea un número válido
  const numericPercentage = Number(percentage);
  if (isNaN(numericPercentage) || percentage === null || percentage === undefined) {
    return '0.0%';
  }
  
  return `${numericPercentage.toFixed(1)}%`;
};

export default api; 