import React, { useState, useEffect, useRef, useCallback } from 'react';
import { remoteControlService, RemoteSession, ScreenshotResponse } from '../../services/remoteControlService';
import { useAuth } from '../../contexts/AuthContext';

interface RemoteAdminProps {
  ticketId: string;
  sessionId?: string;
  onSessionEnd?: () => void;
}

const RemoteAdmin: React.FC<RemoteAdminProps> = ({
  ticketId,
  sessionId,
  onSessionEnd,
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenshotResponse | null>(null);
  const [isControlling, setIsControlling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string>('');
  const [controlMode, setControlMode] = useState<'view' | 'control'>('view');
  const [lastActivity, setLastActivity] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState<number>(2000);

  // 🔄 Cargar sesión si se proporciona sessionId
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // 📱 Cargar sesión remota
  const loadSession = async (id: string) => {
    try {
      setIsLoading(true);
      const sessionData = await remoteControlService.getSessionStatus(id);
      setSession(sessionData);
      setIsConnected(sessionData.active);
      setConnectionCode(id.substring(0, 8).toUpperCase());
      console.log('✅ Sesión cargada:', sessionData);
    } catch (error) {
      console.error('❌ Error cargando sesión:', error);
      setError(`Error cargando sesión: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔗 Conectar con código
  const connectWithCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔗 Conectando con código:', code);
      
      // Simular búsqueda de sesión (en realidad usarías una API)
      setConnectionCode(code);
      setIsConnected(true);
      
      // Iniciar visualización automática
      startScreenViewing();
      
    } catch (error) {
      console.error('❌ Error conectando:', error);
      setError(`Error conectando: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 📺 Iniciar visualización de pantalla
  const startScreenViewing = () => {
    console.log('📺 Iniciando visualización de pantalla...');
    
    const updateScreen = async () => {
      try {
        const screenshot = await remoteControlService.captureScreen();
        setCurrentScreen(screenshot);
        drawScreenOnCanvas(screenshot);
        setLastActivity(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('❌ Error obteniendo screenshot:', error);
      }
    };

    // Actualizar inmediatamente
    updateScreen();

    // Configurar actualización automática
    const interval = setInterval(updateScreen, refreshInterval);
    
    return () => clearInterval(interval);
  };

  // 🎨 Dibujar pantalla en canvas
  const drawScreenOnCanvas = (screenshot: ScreenshotResponse) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Calcular escala para ajustar al canvas
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imageAspect = img.width / img.height;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imageAspect > canvasAspect) {
        // Imagen más ancha, ajustar al ancho
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imageAspect;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        // Imagen más alta, ajustar a la altura
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imageAspect;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      }

      // Limpiar canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Dibujar imagen escalada
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    img.src = `data:image/png;base64,${screenshot.image_data}`;
  };

  // 🖱️ Manejar clicks en el canvas
  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== 'control' || !currentScreen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Convertir coordenadas del canvas a coordenadas de la pantalla real
    const scaleX = currentScreen.width / canvas.width;
    const scaleY = currentScreen.height / canvas.height;
    
    const realX = Math.round(canvasX * scaleX);
    const realY = Math.round(canvasY * scaleY);

    try {
      await remoteControlService.clickAt(realX, realY, 'left');
      console.log(`🖱️ Click enviado: ${realX}, ${realY}`);
      setLastActivity(`Click en (${realX}, ${realY}) - ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Error enviando click:', error);
      setError('Error enviando click');
    }
  };

  // ⌨️ Manejar entrada de teclado
  const handleKeyInput = async (key: string, modifiers: string[] = []) => {
    if (controlMode !== 'control') return;

    try {
      await remoteControlService.pressKey(key, modifiers);
      console.log(`⌨️ Tecla enviada: ${key} ${modifiers.join('+')}`);
      setLastActivity(`Tecla ${key} ${modifiers.join('+')} - ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Error enviando tecla:', error);
      setError('Error enviando tecla');
    }
  };

  // 📝 Escribir texto
  const handleTextInput = async (text: string) => {
    if (controlMode !== 'control') return;

    try {
      await remoteControlService.typeText(text);
      console.log(`📝 Texto enviado: ${text}`);
      setLastActivity(`Texto "${text}" - ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Error enviando texto:', error);
      setError('Error enviando texto');
    }
  };

  // 🔚 Terminar sesión
  const endSession = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      await remoteControlService.endSession(session.id);
      setSession(null);
      setIsConnected(false);
      setCurrentScreen(null);
      setControlMode('view');
      setError(null);

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          🎮 Control Remoto - Administrador
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium text-gray-600">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {isConnected && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Modo:</span>
              <select
                value={controlMode}
                onChange={(e) => setControlMode(e.target.value as 'view' | 'control')}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="view">👁️ Solo Ver</option>
                <option value="control">🎮 Controlar</option>
              </select>
            </div>
          )}
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

      {/* Connection Section */}
      {!isConnected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Conexión
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ingresa el código de 8 caracteres..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                maxLength={8}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim().length === 8) {
                      connectWithCode(target.value.trim().toUpperCase());
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="código"]') as HTMLInputElement;
                  if (input?.value.trim().length === 8) {
                    connectWithCode(input.value.trim().toUpperCase());
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '🔗 Conectar'
                )}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>💡 <strong>Instrucciones:</strong></p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Solicita al cliente que inicie la sesión remota</li>
              <li>Pide el código de conexión de 8 caracteres</li>
              <li>Ingresa el código y presiona "Conectar"</li>
              <li>Podrás ver y controlar la pantalla del cliente</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Session Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  📊 Información de Sesión
                </h4>
                <p className="text-xs text-blue-700">
                  Código: {connectionCode} | 
                  {currentScreen && ` Pantalla: ${currentScreen.width}x${currentScreen.height}`} |
                  Última actividad: {lastActivity || 'Ninguna'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={startScreenViewing}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🔄 Actualizar
                </button>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value={1000}>1s</option>
                  <option value={2000}>2s</option>
                  <option value={5000}>5s</option>
                </select>
              </div>
            </div>
          </div>

          {/* Screen Viewer */}
          <div className="bg-black rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white text-sm font-medium">
                🖥️ Pantalla del Cliente
              </h4>
              <div className="text-xs text-gray-300">
                {controlMode === 'control' ? '🎮 Control Activo' : '👁️ Solo Visualización'}
              </div>
            </div>
            
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              className={`border border-gray-600 rounded bg-gray-900 w-full max-w-4xl mx-auto ${
                controlMode === 'control' ? 'cursor-crosshair' : 'cursor-default'
              }`}
              style={{ aspectRatio: '4/3' }}
            />
            
            {!currentScreen && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p>Esperando pantalla del cliente...</p>
                </div>
              </div>
            )}
          </div>

          {/* Control Panel */}
          {controlMode === 'control' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mouse Controls */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">🖱️ Control de Mouse</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => remoteControlService.clickAt(400, 300, 'left')}
                    className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Click Izquierdo
                  </button>
                  <button
                    onClick={() => remoteControlService.clickAt(400, 300, 'right')}
                    className="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Click Derecho
                  </button>
                  <button
                    onClick={() => remoteControlService.doubleClickAt(400, 300)}
                    className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Doble Click
                  </button>
                </div>
              </div>

              {/* Keyboard Controls */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">⌨️ Control de Teclado</h4>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleKeyInput('c', ['ctrl'])}
                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Ctrl+C
                    </button>
                    <button
                      onClick={() => handleKeyInput('v', ['ctrl'])}
                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Ctrl+V
                    </button>
                    <button
                      onClick={() => handleKeyInput('z', ['ctrl'])}
                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Ctrl+Z
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Escribir texto..."
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            handleTextInput(target.value);
                            target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => handleKeyInput('Enter')}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session Controls */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setControlMode(controlMode === 'view' ? 'control' : 'view')}
              className={`px-4 py-2 rounded-lg focus:ring-2 ${
                controlMode === 'control'
                  ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {controlMode === 'control' ? '👁️ Solo Ver' : '🎮 Controlar'}
            </button>
            
            <button
              onClick={endSession}
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

export default RemoteAdmin; 