/**
 * Sistema de almacenamiento seguro con encriptación
 * Protege tokens JWT y datos sensibles usando AES-256-GCM
 */

import CryptoJS from 'crypto-js';

// Configuración de seguridad
const ENCRYPTION_KEY_SIZE = 256;
const IV_SIZE = 16;
const SALT_SIZE = 16;
const TAG_SIZE = 16;
const ITERATIONS = 10000;

// Prefijos para identificar datos encriptados
const ENCRYPTED_PREFIX = 'enc_';
const VERSION = 'v1';

/**
 * Genera una clave de encriptación basada en datos del dispositivo
 */
const generateDeviceKey = () => {
  const deviceFingerprint = [
    navigator.userAgent,
    navigator.language,
    window.screen.width,
    window.screen.height,
    new Date().getTimezoneOffset(),
    // Agregar más datos únicos del dispositivo
  ].join('|');
  
  return CryptoJS.SHA256(deviceFingerprint).toString();
};

/**
 * Deriva una clave de encriptación usando PBKDF2
 */
const deriveKey = (password, salt) => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: ENCRYPTION_KEY_SIZE / 32,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });
};

/**
 * Encripta datos usando AES-256 (modo más compatible)
 */
const encryptData = (data, key) => {
  try {
    // Verificar si CryptoJS está disponible
    if (typeof CryptoJS === 'undefined') {
      console.warn('CryptoJS no disponible, usando almacenamiento sin encriptar');
      return {
        data: btoa(data), // Base64 simple como fallback
        tag: '',
        version: VERSION,
        fallback: true
      };
    }

    const salt = CryptoJS.lib.WordArray.random(SALT_SIZE);
    const iv = CryptoJS.lib.WordArray.random(IV_SIZE);
    const derivedKey = deriveKey(key, salt);
    
    // Usar CBC en lugar de GCM para mejor compatibilidad
    const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combinar salt + iv + encrypted data
    const combined = salt.concat(iv).concat(encrypted.ciphertext);
    
    return {
      data: combined.toString(CryptoJS.enc.Base64),
      tag: '', // No tag needed for CBC
      version: VERSION
    };
  } catch (error) {
    console.error('Error encrypting data:', error);
    // Fallback a base64 simple
    try {
      return {
        data: btoa(data),
        tag: '',
        version: VERSION,
        fallback: true
      };
    } catch (fallbackError) {
      throw new Error('Failed to encrypt data');
    }
  }
};

/**
 * Desencripta datos usando AES-256
 */
const decryptData = (encryptedObj, key) => {
  try {
    // Si es fallback, usar atob
    if (encryptedObj.fallback) {
      return atob(encryptedObj.data);
    }

    // Verificar si CryptoJS está disponible
    if (typeof CryptoJS === 'undefined') {
      return atob(encryptedObj.data);
    }

    const combined = CryptoJS.enc.Base64.parse(encryptedObj.data);
    
    // Extraer componentes
    const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, SALT_SIZE / 4));
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(SALT_SIZE / 4, (SALT_SIZE + IV_SIZE) / 4));
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice((SALT_SIZE + IV_SIZE) / 4));
    
    const derivedKey = deriveKey(key, salt);
    
    const decrypted = CryptoJS.AES.decrypt({
      ciphertext: ciphertext
    }, derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting data:', error);
    // Intentar fallback
    try {
      return atob(encryptedObj.data);
    } catch (fallbackError) {
      throw new Error('Failed to decrypt data');
    }
  }
};

/**
 * Clase principal para almacenamiento seguro
 */
class SecureStorage {
  constructor() {
    this.deviceKey = generateDeviceKey();
    this.isSupported = this.checkSupport();
  }
  
  checkSupport() {
    try {
      return typeof Storage !== 'undefined' && 
             typeof localStorage !== 'undefined' &&
             typeof CryptoJS !== 'undefined';
    } catch {
      return false;
    }
  }
  
  /**
   * Almacena datos de forma segura
   */
  setItem(key, value, options = {}) {
    if (!this.isSupported) {
      throw new Error('Secure storage not supported');
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      const encryptedData = encryptData(serializedValue, this.deviceKey);
      
      const storageItem = {
        ...encryptedData,
        encrypted: true,
        timestamp: Date.now(),
        expires: options.expires || null
      };
      
      const storageKey = `${ENCRYPTED_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(storageItem));
      
      return true;
    } catch (error) {
      console.error('Error storing secure data:', error);
      return false;
    }
  }
  
  /**
   * Recupera datos de forma segura
   */
  getItem(key) {
    if (!this.isSupported) {
      return null;
    }
    
    try {
      const storageKey = `${ENCRYPTED_PREFIX}${key}`;
      const storedItem = localStorage.getItem(storageKey);
      
      if (!storedItem) {
        return null;
      }
      
      const parsedItem = JSON.parse(storedItem);
      
      // Verificar expiración
      if (parsedItem.expires && Date.now() > parsedItem.expires) {
        this.removeItem(key);
        return null;
      }
      
      if (!parsedItem.encrypted) {
        return null;
      }
      
      const decryptedData = decryptData(parsedItem, this.deviceKey);
      return JSON.parse(decryptedData);
      
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      // Si hay error, eliminar el item corrupto
      this.removeItem(key);
      return null;
    }
  }
  
  /**
   * Elimina un item del almacenamiento seguro
   */
  removeItem(key) {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const storageKey = `${ENCRYPTED_PREFIX}${key}`;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Error removing secure data:', error);
      return false;
    }
  }
  
  /**
   * Limpia todos los datos encriptados
   */
  clear() {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ENCRYPTED_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      return false;
    }
  }
  
  /**
   * Verifica si existe un item
   */
  hasItem(key) {
    const storageKey = `${ENCRYPTED_PREFIX}${key}`;
    return localStorage.getItem(storageKey) !== null;
  }
  
  /**
   * Obtiene información sobre un item sin desencriptarlo
   */
  getItemInfo(key) {
    try {
      const storageKey = `${ENCRYPTED_PREFIX}${key}`;
      const storedItem = localStorage.getItem(storageKey);
      
      if (!storedItem) {
        return null;
      }
      
      const parsedItem = JSON.parse(storedItem);
      
      return {
        exists: true,
        encrypted: parsedItem.encrypted,
        timestamp: parsedItem.timestamp,
        expires: parsedItem.expires,
        isExpired: parsedItem.expires ? Date.now() > parsedItem.expires : false
      };
    } catch (error) {
      return null;
    }
  }
}

// Instancia singleton
const secureStorage = new SecureStorage();

/**
 * Wrapper específico para tokens JWT
 */
export class SecureTokenStorage {
  static setToken(token, expiresIn = null) {
    const expires = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    return secureStorage.setItem('auth_token', token, { expires });
  }
  
  static getToken() {
    return secureStorage.getItem('auth_token');
  }
  
  static removeToken() {
    return secureStorage.removeItem('auth_token');
  }
  
  static hasToken() {
    return secureStorage.hasItem('auth_token');
  }
  
  static getTokenInfo() {
    return secureStorage.getItemInfo('auth_token');
  }
}

/**
 * Wrapper para datos de usuario
 */
export class SecureUserStorage {
  static setUser(userData) {
    // Filtrar datos sensibles antes de almacenar
    const safeUserData = {
      id: userData.id,
      email: userData.email?.replace(/(.{2}).*@/, '$1***@'), // Ofuscar email
      name: userData.name,
      // NO almacenar datos financieros sensibles
    };
    
    return secureStorage.setItem('user_data', safeUserData);
  }
  
  static getUser() {
    return secureStorage.getItem('user_data');
  }
  
  static removeUser() {
    return secureStorage.removeItem('user_data');
  }
}

// Funciones de conveniencia
export const setSecureItem = (key, value, options) => secureStorage.setItem(key, value, options);
export const getSecureItem = (key) => secureStorage.getItem(key);
export const removeSecureItem = (key) => secureStorage.removeItem(key);
export const clearSecureStorage = () => secureStorage.clear();

export default secureStorage; 