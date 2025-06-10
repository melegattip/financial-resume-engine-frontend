import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PeriodProvider } from './contexts/PeriodContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// Lazy loading de todas las páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Incomes = lazy(() => import('./pages/Incomes'));
const Reports = lazy(() => import('./pages/Reports'));
const Categories = lazy(() => import('./pages/Categories'));
const Settings = lazy(() => import('./pages/Settings'));

// Componente de loading mejorado
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mp-primary"></div>
      <p className="text-mp-gray-600 text-sm">Cargando página...</p>
    </div>
  </div>
);

// Hook personalizado para el estado del sidebar
function useSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return { isSidebarOpen, toggleSidebar, closeSidebar };
}

function App() {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  return (
    <PeriodProvider>
      <Router>
        <div className="flex h-screen bg-mp-gray-50">
          {/* Sidebar Desktop */}
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          {/* Sidebar Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Sidebar Mobile */}
          <div className={`
            fixed left-0 top-0 z-50 lg:hidden transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuClick={toggleSidebar} />
            
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/gastos" element={<Expenses />} />
                  <Route path="/ingresos" element={<Incomes />} />
                  <Route path="/categorias" element={<Categories />} />
                  <Route path="/reportes" element={<Reports />} />
                  <Route path="/configuracion" element={<Settings />} />
                </Routes>
              </Suspense>
            </main>
          </div>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </PeriodProvider>
  );
}

export default App; 