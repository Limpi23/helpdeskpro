import React, { useState, useEffect, useCallback } from 'react';
import { remoteControlService, RemoteSession, ScreenshotResponse, SystemInfo } from '../../services/remoteControlService';
import { useAuth } from '../../contexts/AuthContext';

interface RemoteClientProps {
  ticketId: string;
  onSessionStart?: (session: RemoteSession) => void;
  onSessionEnd?: () => void;
}

const RemoteClient: React.FC<RemoteClientProps> = ({
  ticketId,
  onSessionStart,
  onSessionEnd,
}) => {
  const { user } = useAuth();
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionCode, setConnectionCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState<ScreenshotResponse | null>(null);

  // 📊 Obtener información del sistema al cargar
  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await remoteControlService.getSystemInfo();
      setSystemInfo(info);
      console.log('💻 Información del sistema cargada:', info);
    } catch (error) {
      console.error('❌ Error cargando información del sistema:', error);
      setError('Error obteniendo información del sistema');
    }
  };

  // 🔗 Iniciar sesión remota
  const startRemoteSession = async (adminId: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔗 Iniciando sesión remota...');
      
      // Crear sesión
      const newSession = await remoteControlService.createSession(user.id, adminId);
      setSession(newSession);
      setIsConnected(true);

      // Generar código de conexión simple
      const code = newSession.id.substring(0, 8).toUpperCase();
      setConnectionCode(code);

      console.log('✅ Sesión remota iniciada:', newSession.id);
      console.log('🔑 Código de conexión:', code);

      if (onSessionStart) {
        onSessionStart(newSession);
      }

      // Iniciar captura automática de pantalla
      startScreenCapture();
      
    } catch (error) {
      console.error('❌ Error iniciando sesión remota:', error);
      setError(`Error iniciando sesión: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 📸 Iniciar captura de pantalla
  const startScreenCapture = () => {
    console.log('📸 Iniciando captura de pantalla...');
    setIsCapturing(true);

    remoteControlService.startAutomaticCapture(2000, (screenshot) => {
      setLastScreenshot(screenshot);
      console.log('📸 Screenshot actualizado:', new Date().toLocaleTimeString());
    });
  };

  // ⏹️ Detener captura de pantalla
  const stopScreenCapture = () => {
    console.log('⏹️ Deteniendo captura de pantalla...');
    setIsCapturing(false);
    remoteControlService.stopAutomaticCapture();
    setLastScreenshot(null);
  };

  // 🔚 Terminar sesión remota
  const endRemoteSession = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      await remoteControlService.endSession(session.id);
      
      // Detener captura
      stopScreenCapture();
      
      // Limpiar estado
      setSession(null);
      setIsConnected(false);
      setConnectionCode('');
      setError(null);

      console.log('✅ Sesión remota terminada');

      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (error) {
      console.error('❌ Error terminando sesión:', error);
      setError(`Error terminando sesión: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Captura manual de pantalla
  const captureScreenManually = async () => {
    try {
      const screenshot = await remoteControlService.captureScreen();
      setLastScreenshot(screenshot);
      console.log('📸 Captura manual realizada');
    } catch (error) {
      console.error('❌ Error en captura manual:', error);
      setError('Error capturando pantalla');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          🖥️ Control Remoto - Cliente
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium text-gray-600">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      {systemInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">📊 Información del Sistema</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Plataforma:</span>
              <span className="ml-2 font-medium">{systemInfo.platform}</span>
            </div>
            <div>
              <span className="text-gray-600">Pantallas:</span>
              <span className="ml-2 font-medium">{systemInfo.screens.length}</span>
            </div>
          </div>
          
          {/* Screen Details */}
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-1">Resoluciones:</p>
            {systemInfo.screens.map((screen, index) => (
              <div key={index} className="text-xs text-gray-700">
                Pantalla {index + 1}: {screen.width}x{screen.height} {screen.is_primary && '(Principal)'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Section */}
      {!isConnected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID del Administrador
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ingresa el ID del administrador..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      startRemoteSession(target.value.trim());
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="administrador"]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    startRemoteSession(input.value.trim());
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '🚀 Conectar'
                )}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>💡 <strong>Instrucciones:</strong></p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Solicita al administrador su ID de usuario</li>
              <li>Ingresa el ID y presiona "Conectar"</li>
              <li>Comparte el código de conexión que aparecerá</li>
              <li>El administrador podrá ver y controlar tu pantalla</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Code */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-green-900">
                  🔑 Código de Conexión
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Comparte este código con el administrador
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-green-900 bg-white px-4 py-2 rounded border">
                  {connectionCode}
                </div>
                <p className="text-xs text-green-600 mt-1">Sesión: {session?.id.substring(0, 8)}</p>
              </div>
            </div>
          </div>

          {/* Screen Capture Status */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  📸 Captura de Pantalla
                </h4>
                <p className="text-xs text-blue-700">
                  {isCapturing ? 
                    `Capturando automáticamente... ${lastScreenshot ? `(Última: ${new Date(lastScreenshot.timestamp).toLocaleTimeString()})` : ''}` :
                    'Captura detenida'
                  }
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={captureScreenManually}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  📷 Capturar
                </button>
                <button
                  onClick={isCapturing ? stopScreenCapture : startScreenCapture}
                  disabled={isLoading}
                  className={`px-3 py-1 text-xs rounded focus:ring-2 disabled:opacity-50 ${
                    isCapturing
                      ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isCapturing ? '⏹️ Detener' : '▶️ Iniciar'}
                </button>
              </div>
            </div>
          </div>

          {/* Last Screenshot Preview */}
          {lastScreenshot && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                🖼️ Última Captura ({lastScreenshot.width}x{lastScreenshot.height})
              </h4>
              <div className="relative">
                <img
                  src={`data:image/png;base64,${lastScreenshot.image_data}`}
                  alt="Screen capture"
                  className="w-full max-w-md mx-auto border border-gray-300 rounded shadow-sm"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {new Date(lastScreenshot.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Session Controls */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={endRemoteSession}
              disabled={isLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '🔚 Terminar Sesión'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoteClient; 