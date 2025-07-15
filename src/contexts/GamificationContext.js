import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getGamificationAPI } from '../services/gamificationAPI';
import { useGamificationNotifications } from '../components/GamificationNotification';

/**
 * 🎮 GAMIFICATION CONTEXT
 * 
 * Contexto global para manejar:
 * - Estado de gamificación del usuario
 * - Notificaciones de XP y logros
 * - Registro de acciones
 * - Features desbloqueables por nivel
 * - Cache y sincronización
 */

// 🔒 FEATURE GATES - Definición de features desbloqueables
const FEATURE_GATES = {
  SAVINGS_GOALS: {
    name: 'Metas de Ahorro',
    description: 'Crea y gestiona objetivos de ahorro personalizados',
    requiredLevel: 3,
    icon: '🎯',
    benefits: ['Objetivos personalizados', 'Seguimiento de progreso', 'Auto-ahorro']
  },
  BUDGETS: {
    name: 'Presupuestos',
    description: 'Controla tus gastos con límites inteligentes por categoría',
    requiredLevel: 5,
    icon: '📊',
    benefits: ['Límites por categoría', 'Alertas automáticas', 'Control de gastos']
  },
  AI_INSIGHTS: {
    name: 'IA Financiera',
    description: 'Análisis inteligente con IA para decisiones financieras',
    requiredLevel: 7,
    icon: '🧠',
    benefits: ['Análisis de compras', 'Score crediticio', 'Insights personalizados']
  }
};

// 🏆 NIVELES DEL SISTEMA
const LEVEL_SYSTEM = {
  1: { name: 'Financial Newbie', minXP: 0, color: '#9CA3AF' },
  2: { name: 'Money Tracker', minXP: 100, color: '#10B981' },
  3: { name: 'Smart Saver', minXP: 300, color: '#3B82F6' },
  4: { name: 'Budget Master', minXP: 600, color: '#8B5CF6' },
  5: { name: 'Financial Planner', minXP: 1000, color: '#F59E0B' },
  6: { name: 'Investment Seeker', minXP: 1500, color: '#EF4444' },
  7: { name: 'Wealth Builder', minXP: 2200, color: '#EC4899' },
  8: { name: 'Financial Strategist', minXP: 3000, color: '#06B6D4' },
  9: { name: 'Money Mentor', minXP: 4000, color: '#84CC16' },
  10: { name: 'Financial Magnate', minXP: 5500, color: '#F97316' }
};

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  // Estado del usuario
  const [userProfile, setUserProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache para evitar llamadas innecesarias
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);

  // Notificaciones
  const {
    showXPGained,
    showLevelUp,
    showAchievementUnlocked,
    GamificationNotification
  } = useGamificationNotifications();

  const api = getGamificationAPI();

  // Cargar datos iniciales
  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      
      const [profileData, achievementsData, statsData] = await Promise.all([
        api.getUserProfile(),
        api.getUserAchievements(),
        api.getUserStats()
      ]);

      setUserProfile(profileData);
      setAchievements(achievementsData);
      setStats(statsData);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error loading gamification data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Registrar acción y manejar resultado
  const recordAction = useCallback(async (actionType, entityType, entityId, description) => {
    // Evitar acciones duplicadas
    const actionKey = `${actionType}-${entityType}-${entityId}`;
    
    try {
      if (pendingActions.includes(actionKey)) {
        return null;
      }

      setPendingActions(prev => [...prev, actionKey]);

      const result = await api.recordAction({
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        description: description || `User ${actionType} ${entityType}`
      });

      // Actualizar datos locales
      if (result.xp_earned > 0) {
        setUserProfile(prev => ({
          ...prev,
          total_xp: result.total_xp,
          current_level: result.new_level
        }));

        setStats(prev => ({
          ...prev,
          total_xp: result.total_xp,
          current_level: result.new_level
        }));

        // Mostrar notificación de XP ganado
        showXPGained(result.xp_earned, `¡Has ganado ${result.xp_earned} XP!`);
      }

      // Mostrar notificación de subida de nivel
      if (result.level_up) {
        const levelInfo = getLevelInfo(result.new_level);
        showLevelUp(result.new_level, levelInfo.name);
      }

      // Mostrar notificaciones de nuevos logros
      if (result.new_achievements && result.new_achievements.length > 0) {
        result.new_achievements.forEach(achievement => {
          showAchievementUnlocked(achievement.name, achievement.description);
        });

        // Actualizar logros locales
        setAchievements(prev => 
          prev.map(a => {
            const updated = result.new_achievements.find(na => na.id === a.id);
            return updated ? { ...a, ...updated } : a;
          })
        );
      }

      // Limpiar acción pendiente
      setPendingActions(prev => prev.filter(p => p !== actionKey));

      return result;
    } catch (err) {
      console.error('Error recording gamification action:', err);
      setPendingActions(prev => prev.filter(p => p !== actionKey));
      return null;
    }
  }, [api, pendingActions, showXPGained, showLevelUp, showAchievementUnlocked]);

  // Métodos de conveniencia para acciones comunes
  const recordInsightViewed = useCallback((insightId, insightTitle) => {
    return recordAction('view_insight', 'insight', insightId, `Viewed insight: ${insightTitle}`);
  }, [recordAction]);

  const recordInsightUnderstood = useCallback((insightId, insightTitle) => {
    return recordAction('understand_insight', 'insight', insightId, `Understood insight: ${insightTitle}`);
  }, [recordAction]);

  const recordActionCompleted = useCallback((actionId, actionDescription) => {
    return recordAction('complete_action', 'suggestion', actionId, `Completed action: ${actionDescription}`);
  }, [recordAction]);

  const recordPatternViewed = useCallback((patternId, patternType) => {
    return recordAction('view_pattern', 'pattern', patternId, `Viewed pattern: ${patternType}`);
  }, [recordAction]);

  const recordSuggestionUsed = useCallback((suggestionId, suggestionTitle) => {
    return recordAction('use_suggestion', 'suggestion', suggestionId, `Applied suggestion: ${suggestionTitle}`);
  }, [recordAction]);

  // Información de niveles
  const getLevelInfo = (level) => {
    const levels = [
      { level: 0, name: "Financial Newbie", color: "#94A3B8", emoji: "🌱" },
      { level: 1, name: "Money Aware", color: "#60A5FA", emoji: "👀" },
      { level: 2, name: "Budget Tracker", color: "#34D399", emoji: "📊" },
      { level: 3, name: "Savings Starter", color: "#FBBF24", emoji: "💰" },
      { level: 4, name: "Financial Explorer", color: "#F472B6", emoji: "🧭" },
      { level: 5, name: "Money Manager", color: "#A78BFA", emoji: "💼" },
      { level: 6, name: "Investment Learner", color: "#FB7185", emoji: "📈" },
      { level: 7, name: "Financial Guru", color: "#10B981", emoji: "🧠" },
      { level: 8, name: "Money Master", color: "#8B5CF6", emoji: "👑" },
      { level: 9, name: "Financial Magnate", color: "#EF4444", emoji: "💎" }
    ];
    
    return levels[level] || levels[0];
  };

  // Refresh de datos (útil después de acciones importantes)
  const refreshData = useCallback(async () => {
    // Solo refrescar si han pasado al menos 30 segundos desde la última actualización
    if (lastUpdate && Date.now() - lastUpdate < 30000) {
      return;
    }
    
    await loadGamificationData();
  }, [lastUpdate]);

  const value = {
    // Estado
    userProfile,
    achievements,
    stats,
    loading,
    error,

    // Acciones principales
    recordAction,
    recordInsightViewed,
    recordInsightUnderstood,
    recordActionCompleted,
    recordPatternViewed,
    recordSuggestionUsed,

    // Utilidades
    getLevelInfo,
    refreshData,
    loadGamificationData,

    // Componente de notificaciones
    GamificationNotification,

    // Estado de cache
    lastUpdate,
    pendingActions
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <GamificationNotification />
    </GamificationContext.Provider>
  );
};

export default GamificationContext; 