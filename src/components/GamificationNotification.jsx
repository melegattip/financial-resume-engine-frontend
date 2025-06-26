/**
 * 🎮 GAMIFICATION NOTIFICATION COMPONENT
 * 
 * Componente para mostrar notificaciones de gamificación:
 * - XP ganado
 * - Level ups
 * - Nuevos achievements
 * - Progreso general
 */

import React, { useState, useEffect } from 'react';
import { Star, Trophy, Zap, TrendingUp } from 'lucide-react';

const GamificationNotification = ({ 
  notification, 
  onClose, 
  autoCloseDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      // Auto close after delay
      if (autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notification, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose?.();
    }, 300);
  };

  if (!notification || !isVisible) return null;

  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'xp_gained':
        return {
          icon: <Zap className="w-6 h-6 text-yellow-400" />,
          bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          title: `+${notification.xp} XP Ganado!`,
          message: notification.message || 'Has ganado experiencia'
        };
      
      case 'level_up':
        return {
          icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
          bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500',
          title: `¡Nivel ${notification.newLevel}!`,
          message: notification.levelName || 'Has subido de nivel'
        };
      
      case 'achievement_unlocked':
        return {
          icon: <Trophy className="w-6 h-6 text-gold-400" />,
          bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          title: '¡Logro Desbloqueado!',
          message: notification.achievementName || 'Nuevo achievement'
        };
      
      default:
        return {
          icon: <Star className="w-6 h-6 text-green-400" />,
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          title: 'Gamificación',
          message: notification.message || 'Acción completada'
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          ${config.bgColor} text-white rounded-lg shadow-lg p-4 min-w-80 max-w-sm
          transform transition-all duration-300 ease-out
          ${isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
          animate-bounce-in
        `}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm mb-1">
              {config.title}
            </h4>
            <p className="text-sm opacity-90 leading-relaxed">
              {config.message}
            </p>
            
            {/* Información adicional */}
            {notification.details && (
              <div className="mt-2 text-xs opacity-75">
                {notification.details}
              </div>
            )}
            
            {/* Progreso de XP si es level up */}
            {notification.type === 'level_up' && notification.xpProgress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs opacity-75 mb-1">
                  <span>XP: {notification.xpProgress.current}</span>
                  <span>Siguiente: {notification.xpProgress.next}</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5">
                  <div 
                    className="bg-white h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${notification.xpProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook para manejar notificaciones de gamificación
export const useGamificationNotifications = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (notificationData) => {
    setNotification(notificationData);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  // Métodos de conveniencia
  const showXPGained = (xp, message = '') => {
    showNotification({
      type: 'xp_gained',
      xp,
      message: message || `Has ganado ${xp} puntos de experiencia`
    });
  };

  const showLevelUp = (newLevel, levelName, xpProgress = null) => {
    showNotification({
      type: 'level_up',
      newLevel,
      levelName,
      xpProgress,
      message: `¡Felicidades! Ahora eres ${levelName}`
    });
  };

  const showAchievementUnlocked = (achievementName, description = '') => {
    showNotification({
      type: 'achievement_unlocked',
      achievementName,
      message: description || `Has desbloqueado: ${achievementName}`
    });
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showXPGained,
    showLevelUp,
    showAchievementUnlocked,
    GamificationNotification: (props) => (
      <GamificationNotification
        notification={notification}
        onClose={hideNotification}
        {...props}
      />
    )
  };
};

export default GamificationNotification; 