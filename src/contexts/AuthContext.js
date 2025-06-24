import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService';
import { secureError, secureDebug, secureLog } from '../utils/secureLogger';

// Crear el contexto
const AuthContext = createContext(null);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    secureError('useAuth llamado fuera del AuthProvider');
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
  secureDebug('AuthProvider iniciando...');
  
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar autenticación inicial
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setAuthState(AUTH_STATES.AUTHENTICATED);
          secureLog('Usuario ya autenticado');
        } else {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          secureDebug('Usuario no autenticado');
        }
      } catch (error) {
        secureError('Error inicializando auth:', error);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Funciones de autenticación
  const login = useCallback(async (credentials) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      secureDebug('Intentando login...');
      
      const result = await authService.login(credentials);
      setUser(result.data.user);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      
      secureLog('Login exitoso');
      return result;
    } catch (error) {
      secureError('Error en login:', error);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      secureDebug('Intentando registro...');
      
      const result = await authService.register(userData);
      setUser(result.data.user);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      
      secureLog('Registro exitoso');
      return result;
    } catch (error) {
      secureError('Error en registro:', error);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      secureDebug('Cerrando sesión...');
      await authService.logout();
    } catch (error) {
      secureDebug('Error durante logout:', error);
    } finally {
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      secureLog('Sesión cerrada');
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      return result;
    } catch (error) {
      secureError('Error renovando token:', error);
      await logout();
      throw error;
    }
  }, [logout]);

  const changePassword = useCallback(async (passwordData) => {
    try {
      const result = await authService.changePassword(passwordData);
      return result;
    } catch (error) {
      secureError('Error cambiando contraseña:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      // Por ahora solo simulamos la actualización
      setUser(prev => ({ ...prev, ...profileData }));
      return { success: true };
    } catch (error) {
      secureError('Error actualizando perfil:', error);
      throw error;
    }
  }, []);

  // Valor del contexto
  const contextValue = {
    // Estado
    authState,
    user,
    isInitialized,
    
    // Estados derivados
    isAuthenticated: authState === AUTH_STATES.AUTHENTICATED,
    isLoading: authState === AUTH_STATES.LOADING,
    isError: authState === AUTH_STATES.ERROR,
    
    // Acciones
    login,
    register,
    logout,
    refreshToken,
    changePassword,
    updateProfile,
    
    // Utilidades
    hasRole: (role) => user?.roles?.includes(role) || false,
    getAuthHeaders: () => authService.getAuthHeaders(),
    timeUntilExpiry: authService.getSessionInfo().timeUntilExpiry,
    expiresAt: authService.getSessionInfo().expiresAt,
  };

  secureDebug('AuthProvider contexto:', {
    authState,
    isAuthenticated: contextValue.isAuthenticated,
    hasUser: !!user,
    isInitialized
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para verificar autenticación
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
  
  const fullName = user 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario'
    : 'Usuario';
    
  const initials = user 
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` 
    : 'U';
  
  return {
    user,
    fullName,
    initials,
    updateProfile,
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