import axios from 'axios';
import toast from '../utils/notifications';
import configService from './configService';
import envConfig from '../config/environments';

// Configuración base de axios - usa configuración dinámica
const api = axios.create({
  baseURL: envConfig.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para inicializar la configuración dinámica
let configInitialized = false;

const initializeConfig = async () => {
  if (configInitialized) return;
  
  try {
    console.log('🔄 Inicializando configuración dinámica...');
    const config = await configService.loadConfig();
    
    // Actualizar la baseURL de axios con la configuración dinámica
    api.defaults.baseURL = config.api_base_url;
    configInitialized = true;
    
    console.log('✅ Configuración dinámica inicializada:', {
      baseURL: api.defaults.baseURL,
      environment: config.environment,
      version: config.version
    });
  } catch (error) {
    console.error('❌ Error inicializando configuración:', error);
    // Mantener la configuración por defecto
  }
};

// Inicializar configuración al cargar el módulo
initializeConfig();

// Función para obtener el token desde localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Función para obtener el usuario actual desde localStorage
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('auth_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Interceptor para agregar el token JWT
api.interceptors.request.use(
  async (config) => {
    // Asegurar que la configuración esté inicializada antes de cada request
    if (!configInitialized) {
      await initializeConfig();
    }
    
    const token = getAuthToken();
    const user = getCurrentUser();
    
    // Agregar Authorization header si tenemos token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Agregar X-Caller-ID si tenemos usuario autenticado (para compatibilidad con backend)
    if (user && user.id) {
      config.headers['X-Caller-ID'] = user.id.toString();
    }
    
    console.log('🔧 API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasAuth: !!token,
      hasCallerId: !!(user && user.id),
      userId: user?.id
    });
    
    return config;
  },
  (error) => {
    console.error('🔧 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.error || error.message,
      responseData: error.response?.data,
    });
    
    // Log adicional para debugging
    if (error.response) {
      console.error('🔍 Full response data:', error.response.data);
      console.error('🔍 Response status:', error.response.status);
    } else if (error.request) {
      console.error('🔍 Request made but no response:', error.request);
    } else {
      console.error('🔍 Error setting up request:', error.message);
    }
    
    const message = error.response?.data?.error || error.message || 'Error desconocido';
    
    if (error.response?.status === 401) {
      toast.error('Sesión expirada - Por favor inicia sesión nuevamente');
      // Limpiar datos de autenticación
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_expires_at');
      // Redirigir al login
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
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
  get: (userId, id) => api.get(`/expenses/${userId}/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (userId, id, data) => api.patch(`/expenses/${userId}/${id}`, data),
  delete: (userId, id) => api.delete(`/expenses/${userId}/${id}`),
};

// Servicios de Ingresos
export const incomesAPI = {
  list: () => api.get('/incomes'),
  get: (userId, id) => api.get(`/incomes/${userId}/${id}`),
  create: (data) => api.post('/incomes', data),
  update: (userId, id, data) => api.patch(`/incomes/${userId}/${id}`, data),
  delete: (userId, id) => api.delete(`/incomes/${userId}/${id}`),
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

// Servicios de IA
export const aiAPI = {
  // Obtener insights generados por IA
  getInsights: async (year = null, month = null) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const queryString = params.toString();
    const url = `/ai/insights${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Analizar si puedes permitirte una compra
  canIBuy: async (purchaseData) => {
    const response = await api.post('/ai/can-i-buy', purchaseData);
    return response.data;
  },

  // Obtener plan de mejora crediticia
  getCreditImprovementPlan: async (year = null, month = null) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const queryString = params.toString();
    const url = `/ai/credit-improvement-plan${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Obtener puntuación de salud financiera
  getHealthScore: async () => {
    const response = await api.get('/insights/financial-health');
    return response.data;
  }
};

// Servicios de Presupuestos
export const budgetsAPI = {
  list: (params) => api.get('/budgets', { params }),
  get: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getStatus: (params) => api.get('/budgets/status', { params }),
  getDashboard: (params) => api.get('/budgets/dashboard', { params }),
};

// Servicios de Metas de Ahorro
export const savingsGoalsAPI = {
  list: (params) => api.get('/savings-goals', { params }),
  get: (id) => api.get(`/savings-goals/${id}`),
  create: (data) => api.post('/savings-goals', data),
  update: (id, data) => api.put(`/savings-goals/${id}`, data),
  delete: (id) => api.delete(`/savings-goals/${id}`),
  deposit: (id, data) => api.post(`/savings-goals/${id}/deposit`, data),
  withdraw: (id, data) => api.post(`/savings-goals/${id}/withdraw`, data),
  pause: (id) => api.post(`/savings-goals/${id}/pause`),
  resume: (id) => api.post(`/savings-goals/${id}/resume`),
  getDashboard: () => api.get('/savings-goals/dashboard'),
};

// Servicios de Transacciones Recurrentes
export const recurringTransactionsAPI = {
  list: (params) => api.get('/recurring-transactions', { params }),
  get: (id) => api.get(`/recurring-transactions/${id}`),
  create: (data) => api.post('/recurring-transactions', data),
  update: (id, data) => api.put(`/recurring-transactions/${id}`, data),
  delete: (id) => api.delete(`/recurring-transactions/${id}`),
  pause: (id) => api.post(`/recurring-transactions/${id}/pause`),
  resume: (id) => api.post(`/recurring-transactions/${id}/resume`),
  execute: (id) => api.post(`/recurring-transactions/${id}/execute`),
  getDashboard: () => api.get('/recurring-transactions/dashboard'),
  getProjection: (months = 6) => api.get('/recurring-transactions/projection', { 
    params: { months } 
  }),
  processPending: () => api.post('/recurring-transactions/batch/process'),
  sendNotifications: () => api.post('/recurring-transactions/batch/notify'),
};

export default api; 