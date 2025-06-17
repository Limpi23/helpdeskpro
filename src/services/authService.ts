import axios from 'axios';
import { User, LoginResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 
                (import.meta.env.PROD 
                  ? 'https://tu-backend.railway.app/api' // Cambiar por tu URL de Railway
                  : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para añadir el token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  // Iniciar login con Google - redirige a Google OAuth
  googleLogin: (): string => {
    return `${API_URL}/auth/google`;
  },

  // Validar token recibido del callback de Google
  validateToken: async (token: string): Promise<User> => {
    console.log('🔐 AuthService - Validando token...');
    // Guardar token en localStorage
    localStorage.setItem('access_token', token);
    console.log('💾 AuthService - Token guardado en localStorage');
    
    // Obtener datos del usuario con el token
    try {
      console.log('📡 AuthService - Solicitando perfil del usuario...');
      const response = await api.get('/auth/profile');
      console.log('👤 AuthService - Perfil recibido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ AuthService - Error al obtener perfil:', error);
      // Si hay error, remover token inválido
      localStorage.removeItem('access_token');
      throw error;
    }
  },

  // Obtener perfil del usuario actual
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  // Obtener token actual
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Error durante logout:', error);
    } finally {
      localStorage.removeItem('access_token');
    }
  },

  // Validar token actual con el servidor
  verifyCurrentToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      await api.post('/auth/validate');
      return true;
    } catch (error) {
      localStorage.removeItem('access_token');
      return false;
    }
  }
}; 