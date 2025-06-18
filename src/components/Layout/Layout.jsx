import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Mapeo de rutas a títulos y subtítulos
  const getPageTitle = (pathname) => {
    const routes = {
      '/dashboard': { 
        title: 'Dashboard', 
        subtitle: 'Resumen de tu actividad financiera' 
      },
      '/expenses': { 
        title: 'Gastos', 
        subtitle: 'Gestiona tus gastos y pagos pendientes' 
      },
      '/incomes': { 
        title: 'Ingresos', 
        subtitle: 'Registra y controla tus ingresos' 
      },
      '/categories': { 
        title: 'Categorías', 
        subtitle: 'Organiza tus transacciones' 
      },
      '/reports': { 
        title: 'Reportes', 
        subtitle: 'Análisis detallado de tus finanzas' 
      },
      '/settings': { 
        title: 'Configuración', 
        subtitle: 'Ajustes de tu cuenta' 
      },
    };
    return routes[pathname] || { 
      title: 'Financial Resume Engine', 
      subtitle: 'Gestión financiera inteligente' 
    };
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-fr-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-30 lg:z-auto`}>
        <Sidebar />
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 