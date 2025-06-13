import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      name: 'Usuario Demo',
      email: 'user123@example.com',
      phone: '+54 11 1234-5678',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      expenseAlerts: true,
    },
    preferences: {
      currency: 'ARS',
      language: 'es',
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
    },
  });

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'preferences', label: 'Preferencias', icon: Palette },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  const handleSave = () => {
    toast.success('Configuración guardada correctamente');
  };

  const handleExportData = () => {
    toast.success('Exportación iniciada. Recibirás un email con tus datos.');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      toast.error('Funcionalidad no implementada en demo');
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-fr transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-fr-primary text-white'
                    : 'text-fr-gray-600 hover:bg-fr-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="card">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-fr-gray-900">Información del Perfil</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={settings.profile.phone}
                  onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} className="btn-primary">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-fr-gray-900">Configuración de Notificaciones</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900">Notificaciones por email</h4>
                  <p className="text-sm text-fr-gray-500">Recibe actualizaciones por correo electrónico</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900">Notificaciones push</h4>
                  <p className="text-sm text-fr-gray-500">Recibe notificaciones en tiempo real</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900">Reportes semanales</h4>
                  <p className="text-sm text-fr-gray-500">Resumen semanal de tus finanzas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.weeklyReports}
                    onChange={(e) => updateSetting('notifications', 'weeklyReports', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900">Alertas de gastos</h4>
                  <p className="text-sm text-fr-gray-500">Notificaciones cuando superes límites</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.expenseAlerts}
                    onChange={(e) => updateSetting('notifications', 'expenseAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} className="btn-primary">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-fr-gray-900">Preferencias de la Aplicación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={settings.preferences.currency}
                  onChange={(e) => updateSetting('preferences', 'currency', e.target.value)}
                  className="input"
                >
                  <option value="ARS">Peso Argentino (ARS)</option>
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                  className="input"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Tema
                </label>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                  className="input"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-fr-gray-700 mb-2">
                  Formato de fecha
                </label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => updateSetting('preferences', 'dateFormat', e.target.value)}
                  className="input"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} className="btn-primary">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-fr-gray-900">Seguridad y Privacidad</h3>
            
            <div className="space-y-6">
              <div className="border border-fr-gray-200 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 mb-2">Cambiar contraseña</h4>
                <p className="text-sm text-fr-gray-500 mb-4">
                  Actualiza tu contraseña regularmente para mantener tu cuenta segura
                </p>
                <button className="btn-outline">
                  Cambiar Contraseña
                </button>
              </div>

              <div className="border border-fr-gray-200 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 mb-2">Autenticación de dos factores</h4>
                <p className="text-sm text-fr-gray-500 mb-4">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
                <button className="btn-outline">
                  Configurar 2FA
                </button>
              </div>

              <div className="border border-fr-gray-200 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 mb-2">Exportar datos</h4>
                <p className="text-sm text-fr-gray-500 mb-4">
                  Descarga una copia de todos tus datos financieros
                </p>
                <button onClick={handleExportData} className="btn-outline flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Exportar Datos</span>
                </button>
              </div>

              <div className="border border-red-200 rounded-fr p-4 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2">Zona de peligro</h4>
                <p className="text-sm text-red-700 mb-4">
                  Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-fr transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Cuenta</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 