import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface AdminLoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminForm, setAdminForm] = useState<AdminLoginForm>({ email: '', password: '' });
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  useEffect(() => {
    // Manejar callback de Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    console.log('🔍 LoginPage - URL actual:', window.location.href);
    console.log('🔍 LoginPage - Parámetros URL:', { token: token ? token.substring(0, 20) + '...' : null, error });
    
    if (error) {
      console.error('❌ Error en autenticación:', error);
      setAuthError('Error durante la autenticación. Por favor, intenta de nuevo.');
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (token && !isProcessingAuth) {
      console.log('✅ Token encontrado, iniciando login...');
      setIsProcessingAuth(true);
      setAuthError(null);
      
      login(token)
        .then(() => {
          console.log('✅ Login completado exitosamente');
          // Limpiar URL después del login exitoso
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error('❌ Error durante login:', error);
          setAuthError('Error al procesar la autenticación. Por favor, intenta de nuevo.');
          setIsProcessingAuth(false);
          // Limpiar URL en caso de error
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (!token) {
      console.log('ℹ️ No hay token en la URL');
    }
  }, [login, isProcessingAuth]);

  const handleGoogleLogin = () => {
    console.log('🚀 Iniciando login con Google...');
    setAuthError(null);
    window.location.href = authService.googleLogin();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    setAuthError(null);

    try {
      console.log('🔐 Iniciando login de administrador...');
      const response = await fetch('http://localhost:3001/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
      console.log('✅ Login de admin exitoso:', data.user.email);
      
      // Usar la función login del contexto
      await login(data.access_token);
      
    } catch (error: any) {
      console.error('❌ Error en login de admin:', error);
      setAuthError(error.message || 'Error al iniciar sesión como administrador');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const toggleAdminLogin = () => {
    setShowAdminLogin(!showAdminLogin);
    setAuthError(null);
    setAdminForm({ email: '', password: '' });
  };

  // Si el usuario está autenticado, no mostrar nada (será redirigido por el router)
  if (user) {
    console.log('✅ Usuario autenticado, será redirigido...');
    return null;
  }

  // Si está procesando autenticación, mostrar loading
  if (isProcessingAuth) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Procesando autenticación...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras verificamos tu cuenta
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 overflow-hidden">
      {/* Decoraciones de fondo optimizadas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header compacto */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform hover:scale-105 transition-transform duration-300">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
            HelpDesk Pro
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Sistema de Tickets de Atención
          </p>
          <p className="text-gray-500 text-sm">
            Gestión profesional de soporte técnico
          </p>
        </div>

        {/* Mostrar error si existe */}
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{authError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta principal optimizada */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 animate-tilt"></div>
          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Bienvenido de vuelta
                </h2>
                <p className="text-gray-600 text-sm">
                  Inicia sesión con tu cuenta de Google para acceder al panel de control
                </p>
              </div>

              {/* Botón de Google optimizado */}
              <button
                onClick={handleGoogleLogin}
                className="group relative w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-lg text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 hover:border-blue-300 hover:-translate-y-0.5"
              >
                {/* Icono de Google */}
                <div className="absolute left-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                
                <span className="font-semibold">Continuar con Google</span>
                
                {/* Flecha animada */}
                <div className="absolute right-4 transform group-hover:translate-x-1 transition-transform duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Login de Administrador */}
              {showAdminLogin && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500">Acceso de Administrador</span>
                    </div>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email de Administrador
                      </label>
                      <input
                        id="admin-email"
                        type="email"
                        required
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="admin@empresa.com"
                        disabled={isAdminLoading}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                      </label>
                      <input
                        id="admin-password"
                        type="password"
                        required
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Contraseña temporal"
                        disabled={isAdminLoading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAdminLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {isAdminLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verificando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.707 1.293l-1.414 1.414L16 20.707l-1.293-1.293a1 1 0 00-1.414 0l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 000-1.414l4-4a1 1 0 011.414 0L12 17.586l7.293-7.293a1 1 0 011.414 1.414z" />
                          </svg>
                          Acceder como Admin
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Botón para alternar modo admin */}
              <div className="text-center">
                <button
                  onClick={toggleAdminLogin}
                  className="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none"
                >
                  {showAdminLogin ? '← Volver al login normal' : '🔧 Acceso de Administrador'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Acceso seguro</span>
                </div>
              </div>

              {/* Características compactas */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  <span>Seguro SSL</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  <span>OAuth 2.0</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                  <span>Sin contraseñas</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="h-1.5 w-1.5 bg-orange-500 rounded-full"></div>
                  <span>Acceso rápido</span>
                </div>
              </div>

              {/* Footer de términos compacto */}
              <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p>
                  Al iniciar sesión, aceptas nuestros{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                    Términos de Servicio
                  </a>{' '}
                  y{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                    Política de Privacidad
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer compacto */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>24/7 Disponible</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Soporte Técnico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para animaciones optimizados */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes tilt {
          0%, 50%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(0.5deg); }
          75% { transform: rotate(-0.5deg); }
        }
        .animate-tilt {
          animation: tilt 10s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default LoginPage; 