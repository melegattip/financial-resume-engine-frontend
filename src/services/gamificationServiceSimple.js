import { getGamificationAPI } from './gamificationAPI';

/**
 * Servicio para gestionar gamificación relacionada con insights
 */
class GamificationService {
  
  constructor() {
    this.api = getGamificationAPI();
  }
  
  /**
   * Registra que el usuario vio un insight
   */
  async recordInsightViewed(insightId, insightTitle) {
    try {
      const result = await this.api.recordAction(
        'view_insight',
        'insight', 
        insightId,
        `Viewed insight: ${insightTitle}`
      );
      
      console.log('✅ Insight viewed recorded:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Error recording insight view:', error);
      // No lanzar error para no interrumpir la experiencia del usuario
      return null;
    }
  }

  /**
   * Registra que el usuario entendió/revisó un insight
   */
  async recordInsightUnderstood(insightId, insightTitle) {
    try {
      const result = await this.api.recordAction(
        'understand_insight',
        'insight',
        insightId,
        `Understood insight: ${insightTitle}`
      );
      
      console.log('✅ Insight understood recorded:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Error recording insight understanding:', error);
      return null;
    }
  }

  /**
   * Registra que el usuario completó una acción sugerida
   */
  async recordActionCompleted(actionType, description) {
    try {
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