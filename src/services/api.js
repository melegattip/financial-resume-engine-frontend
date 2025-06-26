import axios from 'axios';
import toast from '../utils/notifications';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (config) => {
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
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });
    
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