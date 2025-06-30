import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  PlusCircle, 
  MinusCircle, 
  FolderOpen, 
  Brain, 
  FileText, 
  Settings, 
  Menu, 
  X,
  Home,
  TrendingUp,
  Sparkles,
  PieChart,
  Target,
  RefreshCw
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', priority: 1 },
    { path: '/insights', icon: Brain, label: 'IA Financiero', priority: 2 },
    { path: '/incomes', icon: PlusCircle, label: 'Ingresos', priority: 3 },
    { path: '/expenses', icon: MinusCircle, label: 'Gastos', priority: 4 },
    { path: '/budgets', icon: PieChart, label: 'Presupuestos', priority: 5, subtitle: 'Controla tus límites' },
    { path: '/savings-goals', icon: Target, label: 'Metas de Ahorro', priority: 6, subtitle: 'Objetivos financieros' },
    { path: '/recurring-transactions', icon: RefreshCw, label: 'Recurrentes', priority: 7 },
    { path: '/categories', icon: FolderOpen, label: 'Categorías', priority: 8 },
    { path: '/reports', icon: FileText, label: 'Reportes', priority: 9 },
    { path: '/settings', icon: Settings, label: 'Configuración', priority: 10 }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Financial Resume</h1>
                <p className="text-xs text-gray-500">Tu asistente financiero</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex flex-col px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50
                    ${active 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${
                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                    {item.path === '/insights' && (
                      <Sparkles className={`w-3 h-3 ${
                        active ? 'text-blue-500' : 'text-gray-300'
                      }`} />
                    )}
                  </div>
                  {item.subtitle && (
                    <span className={`text-xs ml-8 mt-1 ${
                      active ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.subtitle}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">IA Financiera</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Obtén recomendaciones personalizadas con inteligencia artificial
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 