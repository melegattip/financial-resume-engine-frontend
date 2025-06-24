import axios from 'axios';
import toast from '../utils/notifications';
import { SecureTokenStorage, SecureUserStorage, setSecureItem, getSecureItem, removeSecureItem } from '../utils/secureStorage';
import { secureDebug, secureError, secureLog } from '../utils/secureLogger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

// Crear instancia de axios para autenticación
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Claves para almacenamiento seguro
const EXPIRES_AT_KEY = 'auth_expires_at';

/**
 * Servicio de autenticación
 */
class AuthService {
  constructor() {
    // Inicializar propiedades
    this.token = null;
    this.user = null;
    this.expiresAt = null;
    
    // Cargar datos del almacenamiento seguro
    this.loadUserFromStorage();
    
    // Configurar interceptor de axios para agregar token automáticamente
    this.setupAuthInterceptor();
  }

  /**
   * Carga el usuario del almacenamiento seguro si hay un token válido
   */
  loadUserFromStorage() {
    try {
      // Intentar cargar token y datos del almacenamiento seguro
      this.token = SecureTokenStorage.getToken();
      this.expiresAt = getSecureItem(EXPIRES_AT_KEY);
      
      if (this.token && this.isTokenValid()) {
        this.user = SecureUserStorage.getUser();
        console.log('✅ AuthService: Datos cargados correctamente del almacenamiento', {
          tokenLength: this.token?.length,
          userEmail: this.user?.email,
          expiresAt: this.expiresAt
        });
      } else {
        console.log('❌ AuthService: Token no válido o expirado, limpiando datos');
        this.clearAuthData();
      }
    } catch (error) {
      console.error('❌ AuthService: Error loading user from storage:', error);
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

        // Solo intentar refresh si es un 401 y no es una petición de login/register
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                              originalRequest.url?.includes('/auth/register') ||
                              originalRequest.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          // Solo intentar refresh token si tenemos un token válido almacenado
          if (this.token && this.isTokenValid()) {
            try {
              await this.refreshToken();
              originalRequest.headers.Authorization = `Bearer ${this.token}`;
              return authAPI(originalRequest);
            } catch (refreshError) {
              this.logout();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            // Si no tenemos token válido, ir directo al login
            this.logout();
            window.location.href = '/login';
            return Promise.reject(error);
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
    if (!this.token || !this.expiresAt) {
      console.log('❌ AuthService: Token o expiresAt no disponible');
      return false;
    }
    
    const now = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    const expirationTime = parseInt(this.expiresAt);
    
    // Considerar token inválido si expira en los próximos 5 minutos
    const isValid = expirationTime > (now + 300);
    
    console.log('🔍 AuthService: Token validation:', {
      now,
      expirationTime,
      timeLeft: expirationTime - now,
      isValid
    });
    
    return isValid;
  }

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario (email, password, firstName, lastName)
   */
  async register(userData) {
    try {
      // Transformar datos del frontend al formato que espera el backend
      const backendData = {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName
      };
      
      secureDebug('Enviando datos de registro (SECURE):', { email: backendData.email });
      
      const response = await authAPI.post('/auth/register', backendData);
      const { data } = response.data;
      
      this.saveAuthData(data);
      
      toast.success('¡Registro exitoso! Bienvenido');
      return { success: true, data };
    } catch (error) {
      secureError('Error en registro:', error.response?.data || error.message);
      const message = error.response?.data?.error || error.response?.data?.message || 'Error en el registro';
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
      secureDebug('Error during logout:', error);
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
      
      // Actualizar datos del usuario en memoria y almacenamiento seguro
      this.user = data;
      SecureUserStorage.setUser(data);
      
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
   * Guarda los datos de autenticación en almacenamiento seguro
   * @param {Object} authData - Datos de autenticación del servidor
   */
  saveAuthData(authData) {
    const { token, expires_at, user } = authData;
    
    this.token = token;
    this.user = user;
    this.expiresAt = expires_at;
    
    // Almacenar de forma segura
    SecureTokenStorage.setToken(token, expires_at ? (expires_at - Math.floor(Date.now() / 1000)) : null);
    SecureUserStorage.setUser(user);
    setSecureItem(EXPIRES_AT_KEY, expires_at.toString());
  }

  /**
   * Limpia todos los datos de autenticación
   */
  clearAuthData() {
    this.token = null;
    this.user = null;
    this.expiresAt = null;
    
    // Limpiar almacenamiento seguro
    SecureTokenStorage.removeToken();
    SecureUserStorage.removeUser();
    removeSecureItem(EXPIRES_AT_KEY);
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
      const headers = {
        Authorization: `Bearer ${this.token}`,
      };
      
      // Agregar X-Caller-ID si tenemos usuario
      // Intentar diferentes propiedades que podría tener el ID
      let userId = null;
      if (this.user) {
        userId = this.user.id || this.user.ID || this.user.user_id || this.user.userId;
      }
      
      if (userId) {
        headers['X-Caller-ID'] = userId.toString();
      }
      
      return headers;
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