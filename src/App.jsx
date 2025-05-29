import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = (pathname) => {
    const routes = {
      '/': { title: 'Dashboard', subtitle: 'Resumen de tu actividad financiera' },
      '/gastos': { title: 'Gastos', subtitle: 'Gestiona tus gastos y pagos pendientes' },
      '/ingresos': { title: 'Ingresos', subtitle: 'Registra y controla tus ingresos' },
      '/categorias': { title: 'Categorías', subtitle: 'Organiza tus transacciones' },
      '/reportes': { title: 'Reportes', subtitle: 'Análisis detallado de tus finanzas' },
      '/configuracion': { title: 'Configuración', subtitle: 'Ajustes de tu cuenta' },
    };
    return routes[pathname] || { title: 'FinanceApp', subtitle: '' };
  };

  return (
    <Router>
      <div className="flex h-screen bg-mp-gray-50">
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
          <Routes>
            <Route path="*" element={
              <>
                <Header 
                  {...getPageTitle(window.location.pathname)}
                  onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className="flex-1 overflow-y-auto p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/gastos" element={<Expenses />} />
                    <Route path="/ingresos" element={<Incomes />} />
                    <Route path="/categorias" element={<Categories />} />
                    <Route path="/reportes" element={<Reports />} />
                    <Route path="/configuracion" element={<Settings />} />
                  </Routes>
                </main>
              </>
            } />
          </Routes>
        </div>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#00a650',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#e53e3e',
                secondary: 'white',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App; 