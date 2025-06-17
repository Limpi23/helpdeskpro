import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider - Inicializando...');
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('🔍 AuthProvider - Verificando autenticación existente...');
    try {
      // Verificar si hay token guardado
      if (authService.isAuthenticated()) {
        console.log('🎫 AuthProvider - Token encontrado en localStorage');
        // Verificar si el token es válido
        const isValid = await authService.verifyCurrentToken();
        if (isValid) {
          console.log('✅ AuthProvider - Token válido, obteniendo perfil...');
          // Obtener datos del usuario
          const userData = await authService.getProfile();
          console.log('👤 AuthProvider - Perfil obtenido:', userData);
          setUser(userData);
        } else {
          console.log('❌ AuthProvider - Token inválido, limpiando...');
          // Token inválido, limpiar
          await authService.logout();
        }
      } else {
        console.log('ℹ️ AuthProvider - No hay token en localStorage');
      }
    } catch (error) {
      console.error('❌ AuthProvider - Error inicializando autenticación:', error);
      await authService.logout();
    } finally {
      console.log('🏁 AuthProvider - Inicialización completada');
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    console.log('🔑 AuthContext - Iniciando login con token:', token.substring(0, 20) + '...');
    setLoading(true);
    try {
      const userData = await authService.validateToken(token);
      console.log('👤 AuthContext - Usuario autenticado:', userData);
      setUser(userData);
      console.log('✅ AuthContext - Login completado, usuario establecido');
    } catch (error) {
      console.error('❌ AuthContext - Error durante login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('👋 AuthContext - Iniciando logout...');
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      console.log('✅ AuthContext - Logout completado');
    } catch (error) {
      console.error('❌ AuthContext - Error durante logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  console.log('🔍 AuthContext - Estado actual:', {
    user: user ? `${user.name} (${user.email})` : null,
    loading,
    isAuthenticated: !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 