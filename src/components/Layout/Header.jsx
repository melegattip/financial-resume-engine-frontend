import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

const Header = ({ title, subtitle, onMenuClick }) => {
  return (
    <header className="bg-white border-b border-mp-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-mp hover:bg-mp-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-mp-gray-600" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-mp-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-mp-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mp-gray-400" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              className="pl-10 pr-4 py-2 border border-mp-gray-300 rounded-mp focus:outline-none focus:ring-2 focus:ring-mp-primary focus:border-transparent w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-mp hover:bg-mp-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-mp-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-mp-accent rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-mp-gray-900">Usuario Demo</div>
              <div className="text-xs text-mp-gray-500">Cuenta Personal</div>
            </div>
            <button className="w-8 h-8 bg-gradient-to-br from-mp-primary to-mp-secondary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 