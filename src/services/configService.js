/**
 * Servicio para cargar configuración dinámica desde el backend
 */
class ConfigService {
  constructor() {
    this.config = null;
    this.loading = false;
    this.error = null;
  }

  /**
   * Carga la configuración desde el backend
   * @param {string} fallbackUrl - URL de fallback si no se puede cargar la configuración
   * @returns {Promise<Object>} - Configuración cargada
   */
  async loadConfig(fallbackUrl = null) {
    if (this.loading) {
      // Si ya está cargando, esperar a que termine
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.loading) {
            resolve(this.config);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    if (this.config) {
      return this.config;
    }

    this.loading = true;
    this.error = null;

    try {
      // Intentar cargar desde diferentes URLs posibles
      // Importar configuración dinámica
      const envConfig = (await import('../config/environments')).default;
      
      const possibleUrls = [
        // URL del ambiente actual (prioritaria)
        envConfig.API_BASE_URL,
        // URL del backend desde variable de entorno
        process.env.REACT_APP_API_URL || '',
        // URLs específicas por ambiente
        'https://financial-resume-engine.onrender.com/api/v1',  // Render
        'https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/api/v1'  // GCP
      ].filter(Boolean);

      let config = null;
      let lastError = null;

      for (const baseUrl of possibleUrls) {
        try {
          console.log(`🔄 Intentando cargar configuración desde: ${baseUrl}/config`);
          
          const response = await fetch(`${baseUrl}/config`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.success && data.data) {
            config = data.data;
            console.log('✅ Configuración cargada exitosamente:', config);
            break;
          } else {
            throw new Error('Respuesta inválida del servidor');
          }
        } catch (error) {
          console.warn(`⚠️ Error cargando configuración desde ${baseUrl}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!config) {
        // Si no se pudo cargar desde ninguna URL, usar configuración de fallback
        console.warn('⚠️ No se pudo cargar configuración, usando fallback');
        
        // Determinar URL de fallback basada en ambiente
        const hostname = window.location.hostname;
        let fallbackApiUrl;
        let environment = 'development';
        
        if (hostname.includes('onrender.com') || hostname === 'financial.niloft.com') {
          fallbackApiUrl = 'https://financial-resume-engine.onrender.com/api/v1';
          environment = 'render';
        } else if (hostname.includes('run.app')) {
          fallbackApiUrl = 'https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/api/v1';
          environment = 'gcp';
        } else {
          fallbackApiUrl = fallbackUrl || 'http://localhost:8080/api/v1';
          environment = 'development';
        }
        
        config = {
          api_base_url: fallbackApiUrl,
          environment: environment,
          version: '1.0.0'
        };
      }

      this.config = config;
      return config;

    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      this.error = error;
      
      // Usar configuración de fallback en caso de error
      const fallbackConfig = {
        api_base_url: fallbackUrl,
        environment: 'development',
        version: '1.0.0'
      };
      
      this.config = fallbackConfig;
      return fallbackConfig;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Obtiene la URL base del API
   * @returns {string} - URL base del API
   */
  getApiBaseUrl() {
    // Si ya hay configuración cargada, usarla
    if (this.config?.api_base_url) {
      return this.config.api_base_url;
    }
    
    // Si hay variable de entorno, usarla
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // Fallback basado en detección de ambiente
    const hostname = window.location.hostname;
    if (hostname.includes('onrender.com') || hostname === 'financial.niloft.com') {
      return 'https://financial-resume-engine.onrender.com/api/v1';  // Render
    } else if (hostname.includes('run.app')) {
      return 'https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/api/v1';  // GCP
    } else {
      return 'http://localhost:8080/api/v1';  // Development
    }
  }

  /**
   * Obtiene el entorno actual
   * @returns {string} - Entorno (development, production, etc.)
   */
  getEnvironment() {
    return this.config?.environment || 'development';
  }

  /**
   * Obtiene la versión de la aplicación
   * @returns {string} - Versión
   */
  getVersion() {
    return this.config?.version || '1.0.0';
  }

  /**
   * Limpia la configuración cargada (útil para testing)
   */
  clearConfig() {
    this.config = null;
    this.loading = false;
    this.error = null;
  }
}

// Crear instancia singleton
const configService = new ConfigService();

export default configService; 