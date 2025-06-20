import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PeriodProvider } from './contexts/PeriodContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';

// Páginas principales
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Páginas de autenticación
import Login from './pages/Login';
import Register from './pages/Register';

// Layout components
import Layout from './components/Layout/Layout';

// Estilos
import './index.css';

// Componente de rutas que usa los contexts
function AppContent() {
  console.log('🚀 AppContent rendering...');
  
  return (
    <Routes>
      {/* Rutas públicas (solo para usuarios NO autenticados) */}
      <Route 
        path="/login" 
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } 
      />

      {/* Rutas protegidas (requieren autenticación) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/expenses" 
        element={
          <ProtectedRoute>
            <Layout>
              <Expenses />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/incomes" 
        element={
          <ProtectedRoute>
            <Layout>
              <Incomes />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/categories" 
        element={
          <ProtectedRoute>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Ruta raíz - redirige según estado de autenticación */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />

      {/* Ruta 404 - página no encontrada */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-fr-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-fr-gray-900 mb-4">404</h1>
              <p className="text-fr-gray-600 mb-6">Página no encontrada</p>
              <a 
                href="/" 
                className="btn-primary"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  );
}

// Componente principal de la aplicación
function App() {
  console.log('🚀 App rendering...');
  
  return (
    <Router>
      <AuthProvider>
        <PeriodProvider>
          <AppContent />
        </PeriodProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 