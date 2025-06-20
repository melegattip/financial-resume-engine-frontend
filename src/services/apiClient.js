import axios from 'axios';

// Configuración base de axios - SOLO comunicación HTTP
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener headers de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('auth_user');
  
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user?.id) {
        headers['X-Caller-ID'] = user.id.toString();
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  return headers;
};

// Interceptor para agregar headers de autenticación automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    config.headers = { ...config.headers, ...authHeaders };
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores HTTP (sin lógica de negocio)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo logging, sin toasts ni lógica de negocio
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });
    
    return Promise.reject(error);
  }
);

// Cliente HTTP puro - solo comunicación
export default apiClient; 