/**
 * 🎮 GAMIFICATION WIDGET COMPONENT
 * 
 * Widget compacto para mostrar el estado de gamificación del usuario:
 * - Nivel actual y nombre
 * - XP total y progreso
 * - Barra de progreso hacia siguiente nivel
 * - Click para ir a página de achievements
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaTrophy, FaBolt, FaChevronUp } from 'react-icons/fa';
import { useGamification } from '../contexts/GamificationContext';

const GamificationWidget = () => {
  const navigate = useNavigate();
  const { userProfile, stats, loading, error, getLevelInfo } = useGamification();



  const handleClick = () => {
    navigate('/achievements');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="space-y-1">
          <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-12 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50">
        <FaTrophy className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">Gamificación no disponible</span>
      </div>
    );
  }

  const levelInfo = getLevelInfo(userProfile.current_level || 0);
  const progressPercent = stats?.progress_percent || 0;
  const totalXP = userProfile.total_xp || 0;
  const xpToNext = stats?.xp_to_next_level || 0;

  return (
    <div 
      onClick={handleClick}
      className="flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group border border-purple-100 dark:border-purple-800"
    >
      {/* Avatar de nivel */}
      <div className="relative">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
          style={{ backgroundColor: levelInfo.color }}
        >
          {levelInfo.emoji}
        </div>
        {userProfile.current_level > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-yellow-900">{userProfile.current_level}</span>
          </div>
        )}
      </div>

      {/* Información de nivel y XP */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {levelInfo.name}
          </span>
          <div className="flex items-center space-x-1">
            <FaBolt className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {totalXP.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="mt-1 flex items-center space-x-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {xpToNext > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              +{xpToNext}
            </span>
          )}
        </div>
      </div>

      {/* Indicador de hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <FaChevronUp className="w-3 h-3 text-gray-400 transform rotate-90" />
      </div>
    </div>
  );
};

export default GamificationWidget; 