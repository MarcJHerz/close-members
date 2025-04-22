// Configuración de entornos
const ENV = {
  DEV: 'development',
  PROD: 'production'
};

// Configuración de API
const API_CONFIG = {
  [ENV.DEV]: {
    URL: 'http://192.168.1.87:5000',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
  },
  [ENV.PROD]: {
    URL: 'https://tu-dominio.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
  }
};

// Configuración de AsyncStorage
const STORAGE_CONFIG = {
  TOKEN_KEY: '@auth_token',
  USER_KEY: '@user_data',
  EXPIRATION_KEY: '@token_expiration'
};

// Determinar el entorno actual
const currentEnv = __DEV__ ? ENV.DEV : ENV.PROD;

// Exportar configuraciones
export const API_URL = API_CONFIG[currentEnv].URL;
export const API_TIMEOUT = API_CONFIG[currentEnv].TIMEOUT;
export const API_RETRY_ATTEMPTS = API_CONFIG[currentEnv].RETRY_ATTEMPTS;
export { STORAGE_CONFIG }; 