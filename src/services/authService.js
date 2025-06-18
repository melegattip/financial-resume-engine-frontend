import axios from 'axios';
import toast from '../utils/notifications';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

// Crear instancia de axios para autenticación
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Claves para localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const EXPIRES_AT_KEY = 'auth_expires_at';

/**
 * Servicio de autenticación
 */
class AuthService {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.user = null;
    this.expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    
    // Cargar usuario si existe token válido
    this.loadUserFromStorage();
    
    // Configurar interceptor de axios para agregar token automáticamente
    this.setupAuthInterceptor();
  }

  /**
   * Carga el usuario del localStorage si hay un token válido
   */
  loadUserFromStorage() {
    if (this.token && this.isTokenValid()) {
      try {
        const userData = localStorage.getItem(USER_KEY);
        if (userData) {
          this.user = JSON.parse(userData);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        this.clearAuthData();
      }
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Configura el interceptor de axios para agregar el token automáticamente
   */
  setupAuthInterceptor() {
    // Interceptor para requests
    authAPI.interceptors.request.use(
      (config) => {
        if (this.token && this.isTokenValid()) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para responses
    authAPI.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Intentar refresh token
          try {
            await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${this.token}`;
            return authAPI(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica si el token actual es válido (no expirado)
   */
  isTokenValid() {
    if (!this.token || !this.expiresAt) return false;
    
    const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    const expirationTime = parseInt(this.expiresAt);
    
    // Considerar token inválido si expira en los próximos 5 minutos
    return expirationTime > (now + 300);
  }

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario (email, password, firstName, lastName)
   */
  async register(userData) {
    try {
      const response = await authAPI.post('/auth/register', userData);
      const { data } = response.data;
      
      this.saveAuthData(data);
      
      toast.success('¡Registro exitoso! Bienvenido');
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.error || 'Error en el registro';
      toast.error(message);
      throw new Error(message);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   * @param {Object} credentials - Credenciales (email, password)
   */
  async login(credentials) {
    try {
      const response = await authAPI.post('/auth/login', credentials);
      const { data } = response.data;
      
      this.saveAuthData(data);
      
      toast.success(`¡Bienvenido de vuelta, ${data.user.first_name}!`);
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.error || 'Error en el login';
      toast.error(message);
      throw new Error(message);
    }
  }

  /**
   * Cierra la sesión actual
   */
  async logout() {
    try {
      // Intentar notificar al servidor (opcional)
      if (this.isAuthenticated()) {
        await authAPI.post('/auth/logout');
      }
    } catch (error) {
      // No importa si falla, igual limpiaremos el local storage
      console.warn('Error during logout:', error);
    } finally {
      this.clearAuthData();
      toast.success('Sesión cerrada correctamente');
    }
  }

  /**
   * Renueva el token JWT
   */
  async refreshToken() {
    try {
      const response = await authAPI.post('/auth/refresh');
      const { data } = response.data;
      
      this.saveAuthData(data);
      return data;
    } catch (error) {
      this.clearAuthData();
      throw new Error('Error renovando token');
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile() {
    try {
      const response = await authAPI.get('/auth/profile');
      const { data } = response.data;
      
      // Actualizar datos del usuario en memoria y storage
      this.user = data;
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Error obteniendo perfil';
      throw new Error(message);
    }
  }

  /**
   * Cambia la contraseña del usuario
   * @param {Object} passwordData - Datos de cambio de contraseña
   */
  async changePassword(passwordData) {
    try {
      await authAPI.put('/auth/change-password', passwordData);
      toast.success('Contraseña cambiada exitosamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Error cambiando contraseña';
      toast.error(message);
      throw new Error(message);
    }
  }

  /**
   * Guarda los datos de autenticación en localStorage
   * @param {Object} authData - Datos de autenticación del servidor
   */
  saveAuthData(authData) {
    const { token, expires_at, user } = authData;
    
    this.token = token;
    this.user = user;
    this.expiresAt = expires_at;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(EXPIRES_AT_KEY, expires_at.toString());
  }

  /**
   * Limpia todos los datos de autenticación
   */
  clearAuthData() {
    this.token = null;
    this.user = null;
    this.expiresAt = null;
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    return this.token && this.user && this.isTokenValid();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Obtiene el token actual
   */
  getToken() {
    return this.token;
  }

  /**
   * Obtiene headers de autorización para requests manuales
   */
  getAuthHeaders() {
    if (this.token && this.isTokenValid()) {
      return {
        Authorization: `Bearer ${this.token}`,
      };
    }
    return {};
  }

  /**
   * Verifica si el usuario tiene un rol específico (para futuras implementaciones)
   */
  hasRole(role) {
    return this.user?.roles?.includes(role) || false;
  }

  /**
   * Obtiene información de la sesión
   */
  getSessionInfo() {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.user,
      expiresAt: this.expiresAt ? new Date(parseInt(this.expiresAt) * 1000) : null,
      timeUntilExpiry: this.expiresAt ? (parseInt(this.expiresAt) - Math.floor(Date.now() / 1000)) : 0,
    };
  }
}

// Crear instancia única
const authService = new AuthService();

// Funciones de utilidad para facilitar el uso
export const authAPI_instance = authAPI; // Para requests manuales
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const getAuthHeaders = () => authService.getAuthHeaders();

export default authService; 