import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Estados posibles de autenticación
export const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
};

/**
 * Proveedor del contexto de autenticación
 */
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Actualiza el estado de autenticación basado en el servicio
   */
  const updateAuthState = useCallback(() => {
    try {
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      const session = authService.getSessionInfo();

      setUser(currentUser);
      setSessionInfo(session);
      setAuthState(isAuth ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.UNAUTHENTICATED);
    } catch (error) {
      console.error('Error updating auth state:', error);
      setAuthState(AUTH_STATES.ERROR);
      setUser(null);
      setSessionInfo(null);
    }
  }, []);

  /**
   * Inicializa el estado de autenticación al cargar la aplicación
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Si hay un usuario logueado, intentar obtener su perfil actualizado
        if (authService.isAuthenticated()) {
          try {
            await authService.getProfile();
          } catch (error) {
            // Si falla obtener el perfil, limpiar datos
            console.warn('Failed to get profile on init:', error);
            authService.clearAuthData();
          }
        }

        updateAuthState();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(AUTH_STATES.ERROR);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [updateAuthState]);

  /**
   * Configurar un timer para verificar expiración del token
   */
  useEffect(() => {
    if (authState !== AUTH_STATES.AUTHENTICATED) return;

    const checkTokenExpiration = () => {
      if (!authService.isTokenValid()) {
        handleLogout();
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [authState]);

  /**
   * Maneja el registro de usuario
   */
  const handleRegister = useCallback(async (userData) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      
      const result = await authService.register(userData);
      updateAuthState();
      
      return result;
    } catch (error) {
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      throw error;
    }
  }, [updateAuthState]);

  /**
   * Maneja el login de usuario
   */
  const handleLogin = useCallback(async (credentials) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      
      const result = await authService.login(credentials);
      updateAuthState();
      
      return result;
    } catch (error) {
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      throw error;
    }
  }, [updateAuthState]);

  /**
   * Maneja el logout
   */
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      updateAuthState();
    }
  }, [updateAuthState]);

  /**
   * Actualiza el perfil del usuario
   */
  const updateProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, []);

  /**
   * Cambia la contraseña del usuario
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      return await authService.changePassword(passwordData);
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = useCallback((role) => {
    return authService.hasRole(role);
  }, []);

  /**
   * Obtiene headers de autorización
   */
  const getAuthHeaders = useCallback(() => {
    return authService.getAuthHeaders();
  }, []);

  /**
   * Renueva el token manualmente
   */
  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
      updateAuthState();
    } catch (error) {
      handleLogout();
      throw error;
    }
  }, [updateAuthState, handleLogout]);

  // Valores del contexto
  const contextValue = {
    // Estado
    authState,
    user,
    sessionInfo,
    isInitialized,
    
    // Estados derivados
    isAuthenticated: authState === AUTH_STATES.AUTHENTICATED,
    isLoading: authState === AUTH_STATES.LOADING,
    isError: authState === AUTH_STATES.ERROR,
    
    // Acciones
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    updateProfile,
    changePassword,
    refreshToken,
    
    // Utilidades
    hasRole,
    getAuthHeaders,
    
    // Info de la sesión
    timeUntilExpiry: sessionInfo?.timeUntilExpiry || 0,
    expiresAt: sessionInfo?.expiresAt,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para verificar autenticación con loading
 */
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  
  return {
    isAuthenticated,
    isLoading: isLoading || !isInitialized,
    isReady: isInitialized && !isLoading,
  };
};

/**
 * Hook para obtener datos del usuario
 */
export const useUser = () => {
  const { user, updateProfile } = useAuth();
  
  return {
    user,
    updateProfile,
    fullName: user ? `${user.first_name} ${user.last_name}` : '',
    initials: user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : '',
  };
};

/**
 * Hook para acciones de autenticación
 */
export const useAuthActions = () => {
  const { login, register, logout, changePassword } = useAuth();
  
  return {
    login,
    register,
    logout,
    changePassword,
  };
};

export default AuthContext; 