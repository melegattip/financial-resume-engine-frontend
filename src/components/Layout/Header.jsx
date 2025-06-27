import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PeriodFilter from './PeriodFilter';
import { 
  User, 
  LogOut, 
  Bell,
  Home,
  Brain,
  PlusCircle,
  MinusCircle,
  FolderOpen,
  FileText,
  Settings
} from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Mapeo de rutas a información de página
  const getPageInfo = (pathname) => {
    const routes = {
      '/dashboard': { 
        title: 'Dashboard', 
        subtitle: 'Resumen de tu actividad financiera',
        icon: Home
      },
      '/insights': { 
        title: 'Análisis Inteligente', 
        subtitle: 'Recomendaciones personalizadas con inteligencia artificial',
        icon: Brain
      },
      '/expenses': { 
        title: 'Gastos', 
        subtitle: 'Gestiona tus gastos y pagos pendientes',
        icon: MinusCircle
      },
      '/incomes': { 
        title: 'Ingresos', 
        subtitle: 'Registra y controla tus ingresos',
        icon: PlusCircle
      },
      '/categories': { 
        title: 'Categorías', 
        subtitle: 'Organiza tus transacciones',
        icon: FolderOpen
      },
      '/reports': { 
        title: 'Reportes', 
        subtitle: 'Análisis detallado de tus finanzas',
        icon: FileText
      },
      '/settings': { 
        title: 'Configuración', 
        subtitle: 'Ajustes de tu cuenta',
        icon: Settings
      },
    };
    return routes[pathname] || { 
      title: 'Financial Resume', 
      subtitle: 'Gestión financiera inteligente',
      icon: Home
    };
  };

  const pageInfo = getPageInfo(location.pathname);
  const PageIcon = pageInfo.icon;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm mt-1">
              <div className="px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-20">
          {/* Page title and info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <PageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {pageInfo.title}
                </h1>
                <p className="text-sm text-gray-600 truncate hidden lg:block">
                  {pageInfo.subtitle}
                </p>
              </div>
            </div>
            
            {/* Mobile: Solo título */}
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Period Filter */}
            <PeriodFilter />

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {user?.name || user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role || 'Miembro'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Avatar */}
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
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