import axios from 'axios';
import toast from 'react-hot-toast';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Usuario mock para desarrollo (en producción vendría de autenticación)
const MOCK_USER_ID = 'user123';

// Interceptor para agregar el header x-caller-id
api.interceptors.request.use(
  (config) => {
    config.headers['x-caller-id'] = MOCK_USER_ID;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Error desconocido';
    
    if (error.response?.status === 401) {
      toast.error('No autorizado');
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
  create: (data) => api.post('/categories', { ...data, user_id: MOCK_USER_ID }),
  update: (id, data) => api.patch(`/categories/${id}`, { ...data, user_id: MOCK_USER_ID }),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Servicios de Gastos
export const expensesAPI = {
  list: () => api.get('/expenses'),
  listUnpaid: () => api.get('/expenses/unpaid'),
  get: (userId = MOCK_USER_ID, id) => api.get(`/expenses/${userId}/${id}`),
  create: (data) => api.post('/expenses', { ...data, user_id: MOCK_USER_ID }),
  update: (userId = MOCK_USER_ID, id, data) => api.patch(`/expenses/${userId}/${id}`, { ...data, user_id: MOCK_USER_ID }),
  delete: (userId = MOCK_USER_ID, id) => api.delete(`/expenses/${userId}/${id}`),
};

// Servicios de Ingresos
export const incomesAPI = {
  list: () => api.get('/incomes'),
  get: (userId = MOCK_USER_ID, id) => api.get(`/incomes/${userId}/${id}`),
  create: (data) => api.post('/incomes', { ...data, user_id: MOCK_USER_ID }),
  update: (userId = MOCK_USER_ID, id, data) => api.patch(`/incomes/${userId}/${id}`, { ...data, user_id: MOCK_USER_ID }),
  delete: (userId = MOCK_USER_ID, id) => api.delete(`/incomes/${userId}/${id}`),
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

// Nuevos servicios de Dashboard y Analytics
export const dashboardAPI = {
  overview: (params) => api.get('/dashboard', { params }),
};

export const analyticsAPI = {
  expenses: (params) => api.get('/expenses/summary', { params }),
  incomes: (params) => api.get('/incomes/summary', { params }),
  categories: (params) => api.get('/categories/analytics', { params }),
};

// Utilidades
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatPercentage = (percentage) => {
  return `${percentage.toFixed(1)}%`;
};

export default api; 