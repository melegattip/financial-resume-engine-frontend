import { getGamificationAPI } from './gamificationAPI';

/**
 * Servicio para gestionar gamificación relacionada con insights
 */
class GamificationService {
  
  constructor() {
    this.api = getGamificationAPI();
  }
  
  /**
   * Registra que el usuario vio una recomendación
   */
  async recordInsightViewed(insightId, insightTitle) {
    try {
      // En desarrollo, verificar si el servicio está disponible antes de intentar
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        // No hacer la llamada si el servicio probablemente no está corriendo
        console.debug('⚠️ Gamification deshabilitado en desarrollo - servicios no corriendo');
        return null;
      }
      
      const result = await this.api.recordAction(
        'view_insight',
        'insight', 
        insightId,
        `Vio recomendación: ${insightTitle}`
      );
      
      console.log('✅ Recomendación vista registrada:', result);
      return result;
    } catch (error) {
      // Silenciar errores de gamificación para no interferir con la UX principal
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.debug('⚠️ Gamification service not available:', error.response?.status);
      } else {
        console.warn('⚠️ Error recording insight view:', error.message);
      }
      return null;
    }
  }

  /**
   * Registra que el usuario entendió/revisó una recomendación
   */
  async recordInsightUnderstood(insightId, insightTitle) {
    try {
      // En desarrollo, deshabilitar gamification
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        console.debug('⚠️ Gamification deshabilitado en desarrollo - servicios no corriendo');
        return null;
      }
      
      const result = await this.api.recordAction(
        'understand_insight',
        'insight',
        insightId,
        `Understood insight: ${insightTitle}`
      );
      
      console.log('✅ Insight understood recorded:', result);
      return result;
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.debug('⚠️ Gamification service not available:', error.response?.status);
      } else {
        console.warn('⚠️ Error recording insight understanding:', error.message);
      }
      return null;
    }
  }

  /**
   * Registra que el usuario completó una acción sugerida
   */
  async recordActionCompleted(actionType, description) {
    try {
      // En desarrollo, deshabilitar gamification
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        console.debug('⚠️ Gamification deshabilitado en desarrollo - servicios no corriendo');
        return null;
      }
      
      const result = await this.api.recordAction(
        'complete_action',
        'suggestion',
        `action_${Date.now()}`,
        description
      );
      
      console.log('✅ Action completed recorded:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Error recording action completion:', error);
      return null;
    }
  }

  /**
   * Registra que el usuario usó el análisis "¿Puedo comprarlo?"
   */
  async recordPurchaseAnalysisUsed(itemName, amount) {
    try {
      const result = await this.api.recordAction(
        'use_suggestion',
        'suggestion',
        `purchase_analysis_${Date.now()}`,
        `Used purchase analysis for: ${itemName} ($${amount})`
      );
      
      console.log('✅ Purchase analysis recorded:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Error recording purchase analysis:', error);
      return null;
    }
  }

  /**
   * Obtiene el perfil de gamificación del usuario
   */
  async getUserProfile() {
    try {
      return await this.api.getUserProfile();
    } catch (error) {
      console.warn('⚠️ Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Obtiene las estadísticas de gamificación
   */
  async getUserStats() {
    try {
      return await this.api.getUserStats();
    } catch (error) {
      console.warn('⚠️ Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Obtiene los achievements del usuario
   */
  async getUserAchievements() {
    try {
      return await this.api.getUserAchievements();
    } catch (error) {
      console.warn('⚠️ Error getting achievements:', error);
      return [];
    }
  }
}

export default new GamificationService(); 