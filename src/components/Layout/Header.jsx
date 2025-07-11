import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PeriodFilter from './PeriodFilter';
import ThemeToggle from '../ThemeToggle';
import { FaUser, FaSignOutAlt, FaBell, FaHome, FaBrain, FaPlusCircle, FaMinusCircle, FaFolderOpen, FaFileAlt, FaCog, FaChartPie, FaBullseye, FaRedo } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Mapeo de rutas a información de página
  const getPageInfo = (pathname) => {
    const routes = {
      '/dashboard': { 
        title: 'Dashboard', 
        subtitle: 'Resumen de tu actividad financiera',
        icon: FaHome
      },
      '/insights': { 
        title: 'Análisis Inteligente', 
        subtitle: 'Recomendaciones personalizadas con inteligencia artificial',
        icon: FaBrain
      },
      '/expenses': { 
        title: 'Gastos', 
        subtitle: 'Gestiona tus gastos y pagos pendientes',
        icon: FaMinusCircle
      },
      '/incomes': { 
        title: 'Ingresos', 
        subtitle: 'Registra y controla tus ingresos',
                  icon: FaPlusCircle
      },
      '/categories': { 
        title: 'Categorías', 
        subtitle: 'Organiza tus transacciones',
                  icon: FaFolderOpen
      },
      '/reports': { 
        title: 'Reportes', 
        subtitle: 'Análisis detallado de tus finanzas',
        icon: FaFileAlt
      },
      '/budgets': { 
        title: 'Presupuestos', 
        subtitle: 'Controla tus límites de gasto',
        icon: FaChartPie
      },
      '/savings-goals': { 
        title: 'Metas de Ahorro', 
        subtitle: 'Alcanza tus objetivos financieros',
        icon: FaBullseye
      },
      '/recurring-transactions': { 
        title: 'Transacciones Recurrentes', 
        subtitle: 'Automatiza tus transacciones',
        icon: FaRedo
      },
      '/settings': { 
        title: 'Configuración', 
        subtitle: 'Ajustes de tu cuenta',
        icon: FaCog
      },
    };
    return routes[pathname] || { 
      title: 'Niloft', 
      subtitle: 'Gestión financiera inteligente',
      icon: FaHome
    };
  };

  const pageInfo = getPageInfo(location.pathname);
  const PageIcon = pageInfo.icon;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm dark:shadow-gray-900/20 mt-1 transition-colors duration-300">
              <div className="px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-20">
          {/* Page title and info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <PageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {pageInfo.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate hidden lg:block">
                  {pageInfo.subtitle}
                </p>
              </div>
            </div>
            
            {/* Mobile: Solo título */}
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Period Filter */}
            <PeriodFilter />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications - Temporalmente oculto hasta implementar la funcionalidad 
            <button className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <FaBell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            */}

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32">
                  {user?.name || user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role || 'Miembro'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Avatar */}
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaUser className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <FaSignOutAlt className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 