import axios from 'axios';
import configService from './configService';

// Configuración base de axios - SOLO comunicación HTTP
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
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
    console.log('🔄 [apiClient] Inicializando configuración dinámica...');
    const config = await configService.loadConfig();
    
    // Actualizar la baseURL de axios con la configuración dinámica
    apiClient.defaults.baseURL = config.api_base_url;
    configInitialized = true;
    
    console.log('✅ [apiClient] Configuración dinámica inicializada:', {
      baseURL: apiClient.defaults.baseURL,
      environment: config.environment,
      version: config.version
    });
  } catch (error) {
    console.error('❌ [apiClient] Error inicializando configuración:', error);
    // Mantener la configuración por defecto
  }
};

// Inicializar configuración al cargar el módulo
initializeConfig();

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
  async (config) => {
    // Asegurar que la configuración esté inicializada antes de cada request
    if (!configInitialized) {
      await initializeConfig();
    }
    
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