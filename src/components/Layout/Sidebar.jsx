import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  TrendingDown,
  Settings,
  CreditCard,
  BarChart3,
  Tag,
  Brain,
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Resumen general',
    },
    {
      title: 'Insights Financieros',
      icon: Brain,
      path: '/insights',
      description: 'Análisis con IA',
    },
    {
      title: 'Ingresos',
      icon: TrendingUp,
      path: '/incomes',
      description: 'Gestionar ingresos',
    },
    {
      title: 'Gastos',
      icon: TrendingDown,
      path: '/expenses',
      description: 'Gestionar gastos',
    },
    {
      title: 'Categorías',
      icon: Tag,
      path: '/categories',
      description: 'Organizar transacciones',
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      path: '/reports',
      description: 'Análisis financiero',
    },
    {
      title: 'Configuración',
      icon: Settings,
      path: '/settings',
      description: 'Ajustes de cuenta',
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-fr-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-fr-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-fr-primary to-fr-secondary rounded-fr flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-fr-gray-900">FinanceApp</h1>
            <p className="text-sm text-fr-gray-500">Tu resumen financiero</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'nav-link-active' : 'nav-link'
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-fr-gray-400">{item.description}</div>
              </div>
            </NavLink>
          );
        })}
      </nav>


    </div>
  );
};

export default Sidebar; 