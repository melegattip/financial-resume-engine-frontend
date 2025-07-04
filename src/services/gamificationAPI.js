/**
 * 🎮 GAMIFICATION API SERVICE
 * 
 * Servicio para conectar con la API de gamificación real
 * Reemplaza el sistema local por llamadas al backend
 */

import apiClient from './apiClient';

class GamificationAPI {
  constructor() {
    this.baseURL = '/gamification'; // apiClient ya incluye /api/v1
  }

  // 📊 ENDPOINTS PÚBLICOS (no requieren autenticación)
  
  /**
   * Obtiene los tipos de acciones disponibles
   */
  async getActionTypes() {
    try {
      const response = await fetch(`${this.baseURL}/action-types`);
      if (!response.ok) throw new Error('Failed to fetch action types');
      return await response.json();
    } catch (error) {
      console.error('Error fetching action types:', error);
      throw error;
    }
  }

  /**
   * Obtiene información de todos los niveles
   */
  async getLevels() {
    try {
      const response = await fetch(`${this.baseURL}/levels`);
      if (!response.ok) throw new Error('Failed to fetch levels');
      return await response.json();
    } catch (error) {
      console.error('Error fetching levels:', error);
      throw error;
    }
  }

  // 🔐 ENDPOINTS PROTEGIDOS (requieren autenticación)

  /**
   * Obtiene el perfil de gamificación del usuario
   */
  async getUserProfile() {
    try {
      const response = await apiClient.get(`${this.baseURL}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Obtiene las estadísticas detalladas del usuario
   */
  async getUserStats() {
    try {
      const response = await apiClient.get(`${this.baseURL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene los achievements del usuario
   */
  async getUserAchievements() {
    try {
      const response = await apiClient.get(`${this.baseURL}/achievements`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  }

  /**
   * Registra una acción del usuario y otorga XP
   * @param {string} actionType - Tipo de acción (view_insight, understand_insight, etc.)
   * @param {string} entityType - Tipo de entidad (insight, suggestion, pattern, etc.)
   * @param {string} entityId - ID de la entidad
   * @param {string} description - Descripción de la acción
   */
  async recordAction(actionType, entityType, entityId, description = '') {
    try {
      // El userID se extrae automáticamente del JWT token en el backend
      // NO necesitamos enviarlo en el payload
      const response = await apiClient.post(`${this.baseURL}/actions`, {
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description: description
      });
      return response.data;
    } catch (error) {
      console.error('Error recording action:', error);
      throw error;
    }
  }



  // 🎯 MÉTODOS DE CONVENIENCIA

  /**
   * Registra que el usuario vio un insight
   */
  async recordViewInsight(insightId, description = 'User viewed insight') {
    return this.recordAction('view_insight', 'insight', insightId, description);
  }

  /**
   * Registra que el usuario entendió un insight
   */
  async recordUnderstandInsight(insightId, description = 'User understood insight') {
    return this.recordAction('understand_insight', 'insight', insightId, description);
  }

  /**
   * Registra que el usuario completó una acción
   */
  async recordCompleteAction(actionId, description = 'User completed action') {
    return this.recordAction('complete_action', 'action', actionId, description);
  }

  /**
   * Registra que el usuario vio un patrón de gastos
   */
  async recordViewPattern(patternId, description = 'User viewed spending pattern') {
    return this.recordAction('view_pattern', 'pattern', patternId, description);
  }

  /**
   * Registra que el usuario aplicó una sugerencia
   */
  async recordUseSuggestion(suggestionId, description = 'User applied suggestion') {
    return this.recordAction('use_suggestion', 'suggestion', suggestionId, description);
  }

  // 📊 ACCIONES DE NAVEGACIÓN (para el widget de IA)

  /**
   * Registra navegación al dashboard
   */
  async recordViewDashboard() {
    return this.recordAction('view_insight', 'dashboard', 'main-dashboard', 'User viewed dashboard');
  }

  /**
   * Registra visualización de gastos
   */
  async recordViewExpenses() {
    return this.recordAction('view_insight', 'expense', 'expense-list', 'User viewed expenses');
  }

  /**
   * Registra visualización de analytics
   */
  async recordViewAnalytics(analyticsType = 'general') {
    return this.recordAction('view_pattern', 'analytics', analyticsType, `User viewed ${analyticsType} analytics`);
  }
}

// 🌟 SINGLETON PATTERN
let gamificationAPIInstance = null;

export const getGamificationAPI = () => {
  if (!gamificationAPIInstance) {
    gamificationAPIInstance = new GamificationAPI();
  }
  return gamificationAPIInstance;
};

export default GamificationAPI; 