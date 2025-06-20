import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Menu, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth, useUser } from '../../contexts/AuthContext';
import PeriodFilter from './PeriodFilter';

const Header = ({ title, subtitle, onMenuClick }) => {
  const { logout } = useAuth();
  const { user, fullName, initials } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  };

  return (
    <header className="bg-white border-b border-fr-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-fr hover:bg-fr-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-fr-gray-600" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-fr-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-fr-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Period Filter */}
          <PeriodFilter />

          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fr-gray-400" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              className="pl-10 pr-4 py-2 border border-fr-gray-300 rounded-fr focus:outline-none focus:ring-2 focus:ring-fr-primary focus:border-transparent w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-fr hover:bg-fr-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-fr-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-fr-accent rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-fr hover:bg-fr-gray-100 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-fr-gray-900">
                  {fullName || 'Usuario'}
                </div>
                <div className="text-xs text-fr-gray-500">
                  {user?.email || 'Cuenta Personal'}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-8 h-8 bg-gradient-to-br from-fr-primary to-fr-secondary rounded-full flex items-center justify-center">
                  {initials ? (
                    <span className="text-white text-sm font-medium">
                      {initials}
                    </span>
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-fr-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-fr shadow-lg border border-fr-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-fr-gray-100">
                  <p className="text-sm font-medium text-fr-gray-900">
                    {fullName}
                  </p>
                  <p className="text-xs text-fr-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    // Aquí podrías navegar a settings
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-fr-gray-700 hover:bg-fr-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Configuración
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 