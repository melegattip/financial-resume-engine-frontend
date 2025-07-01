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

  // Grupo 1: Transacciones principales
  const mainMenuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/incomes', icon: PlusCircle, label: 'Ingresos' },
    { path: '/expenses', icon: MinusCircle, label: 'Gastos' },
    { path: '/recurring-transactions', icon: RefreshCw, label: 'Recurrentes' },
    { path: '/categories', icon: FolderOpen, label: 'Categorías' }
  ];

  // Grupo 2: Análisis y planificación
  const analysisMenuItems = [
    { path: '/insights', icon: Brain, label: 'IA Financiero', hasSparkles: true },
    { path: '/budgets', icon: PieChart, label: 'Presupuestos', subtitle: 'Controla tus límites' },
    { path: '/savings-goals', icon: Target, label: 'Metas de Ahorro', subtitle: 'Objetivos financieros' },
    { path: '/reports', icon: FileText, label: 'Reportes' }
  ];

  // Grupo 3: Configuración
  const settingsMenuItems = [
    { path: '/settings', icon: Settings, label: 'Configuración' }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path) => location.pathname === path;

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsOpen(false)}
        className={`
          group flex flex-col px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
          ${active 
            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${
            active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          }`} />
          <span className="font-medium">{item.label}</span>
          {item.hasSparkles && (
            <Sparkles className={`w-3 h-3 ${
              active ? 'text-blue-500 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'
            }`} />
          )}
        </div>
        {item.subtitle && (
          <span className={`text-xs ml-8 mt-1 ${
            active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {item.subtitle}
          </span>
        )}
      </Link>
    );
  };

  const renderSeparator = () => (
    <div className="my-4">
      <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
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
        fixed lg:fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Financial Resume</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tu asistente financiero</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {/* Grupo 1: Transacciones principales */}
            <div className="space-y-2">
              {mainMenuItems.map(renderMenuItem)}
            </div>

            {renderSeparator()}

            {/* Grupo 2: Análisis y planificación */}
            <div className="space-y-2">
              {analysisMenuItems.map(renderMenuItem)}
            </div>

            {renderSeparator()}

            {/* Grupo 3: Configuración */}
            <div className="space-y-2">
              {settingsMenuItems.map(renderMenuItem)}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 