import React, { useState, useEffect } from 'react';
import { FaUser, FaBell, FaLock, FaDownload, FaTrash, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import TwoFASetup from '../components/TwoFASetup';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Usar datos reales del usuario autenticado
  const [settings, setSettings] = useState({
    profile: {
      name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      expenseAlerts: true,
    },
  });

  // Actualizar settings cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        profile: {
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email || '',
          phone: user.phone || '',
        }
      }));
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: FaUser },
    { id: 'notifications', label: 'Notificaciones', icon: FaBell },
    { id: 'security', label: 'Seguridad', icon: FaLock },
  ];

  const handleSave = async () => {
    // Validación mínima
    if (!settings.profile.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setLoading(true);
    try {
      // Separar nombre completo en first_name y last_name
      const [first_name, ...rest] = settings.profile.name.trim().split(' ');
      const last_name = rest.join(' ');
      // Tomar datos actuales del usuario
      const profileData = {
        id: user?.id,
        email: user?.email,
        first_name,
        last_name,
        phone: settings.profile.phone,
      };
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Perfil actualizado');
      } else {
        toast.error(result.error || 'Error actualizando perfil');
      }
    } catch (e) {
      toast.error('Error actualizando perfil');
    } finally {
      setLoading(false);
    }
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
            <h3 className="text-lg font-semibold text-fr-gray-900 dark:text-gray-100">Información del Perfil</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-fr-gray-700 dark:text-gray-300 mb-2">
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
              <button onClick={handleSave} className="btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-fr-gray-900 dark:text-gray-100">Configuración de Notificaciones</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900 dark:text-gray-100">Notificaciones por email</h4>
                  <p className="text-sm text-fr-gray-500 dark:text-gray-300">Recibe actualizaciones por correo electrónico</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900 dark:text-gray-100">Notificaciones push</h4>
                  <p className="text-sm text-fr-gray-500 dark:text-gray-300">Recibe notificaciones en tiempo real</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900 dark:text-gray-100">Reportes semanales</h4>
                  <p className="text-sm text-fr-gray-500 dark:text-gray-300">Resumen semanal de tus finanzas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.weeklyReports}
                    onChange={(e) => updateSetting('notifications', 'weeklyReports', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-fr-gray-900 dark:text-gray-100">Alertas de gastos</h4>
                  <p className="text-sm text-fr-gray-500 dark:text-gray-300">Notificaciones cuando superes límites</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.expenseAlerts}
                    onChange={(e) => updateSetting('notifications', 'expenseAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fr-primary"></div>
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



        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-fr-gray-900 dark:text-gray-100">Seguridad y Privacidad</h3>
            
            <div className="space-y-6">
              <div className="border border-fr-gray-200 dark:border-gray-600 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-2">Cambiar contraseña</h4>
                <p className="text-sm text-fr-gray-500 dark:text-gray-300 mb-4">
                  Actualiza tu contraseña regularmente para mantener tu cuenta segura
                </p>
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="btn-outline"
                >
                  Cambiar Contraseña
                </button>
              </div>

              <div className="border border-fr-gray-200 dark:border-gray-600 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-2">Autenticación de dos factores</h4>
                <p className="text-sm text-fr-gray-500 dark:text-gray-300 mb-4">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
                <button 
                  onClick={() => setShow2FAModal(true)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <FaShieldAlt className="w-4 h-4" />
                  <span>Configurar 2FA</span>
                </button>
              </div>

              <div className="border border-fr-gray-200 dark:border-gray-600 rounded-fr p-4">
                <h4 className="font-medium text-fr-gray-900 dark:text-gray-100 mb-2">Exportar datos</h4>
                <p className="text-sm text-fr-gray-500 dark:text-gray-300 mb-4">
                  Descarga una copia de todos tus datos financieros
                </p>
                <button onClick={handleExportData} className="btn-outline flex items-center space-x-2">
                  <FaDownload className="w-4 h-4" />
                  <span>Exportar Datos</span>
                </button>
              </div>

              <div className="border border-red-200 dark:border-red-800 rounded-fr p-4 bg-red-50 dark:bg-red-900/20">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Zona de peligro</h4>
                <p className="text-sm text-red-700 dark:text-red-200 mb-4">
                  Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium py-2 px-4 rounded-fr transition-colors flex items-center space-x-2"
                >
                  <FaTrash className="w-4 h-4" />
                  <span>Eliminar Cuenta</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de configuración 2FA */}
      {show2FAModal && (
        <TwoFASetup
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
        />
      )}

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default Settings; 