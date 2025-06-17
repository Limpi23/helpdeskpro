import { invoke } from '@tauri-apps/api/tauri';

// Interfaces para los comandos remotos
export interface MouseCommand {
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle';
  action: 'click' | 'double_click' | 'press' | 'release';
}

export interface KeyboardCommand {
  key: string;
  action: 'press' | 'release' | 'type';
  modifiers: string[];
}

export interface ScreenshotResponse {
  image_data: string; // Base64 encoded
  width: number;
  height: number;
  timestamp: string;
}

export interface RemoteSession {
  id: string;
  active: boolean;
  client_id: string;
  admin_id: string;
  started_at: string;
}

export interface SystemInfo {
  screens: ScreenInfo[];
  timestamp: string;
  platform: string;
}

export interface ScreenInfo {
  id: number;
  width: number;
  height: number;
  x: number;
  y: number;
  is_primary: boolean;
}

class RemoteControlService {
  private sessionId: string | null = null;
  private isCapturing: boolean = false;
  private captureInterval: number | null = null;
  private onScreenshotCallback: ((screenshot: ScreenshotResponse) => void) | null = null;

  // 📸 Capturar pantalla
  async captureScreen(): Promise<ScreenshotResponse> {
    console.log('📸 RemoteControl - Capturando pantalla...');
    try {
      const screenshot = await invoke<ScreenshotResponse>('capture_screen');
      console.log('✅ RemoteControl - Pantalla capturada:', screenshot.width + 'x' + screenshot.height);
      return screenshot;
    } catch (error) {
      console.error('❌ RemoteControl - Error capturando pantalla:', error);
      throw new Error(`Error capturando pantalla: ${error}`);
    }
  }

  // 🖱️ Ejecutar comando de mouse
  async executeMouseCommand(command: MouseCommand): Promise<string> {
    console.log('🖱️ RemoteControl - Ejecutando comando de mouse:', command);
    try {
      const result = await invoke<string>('execute_mouse_command', { command });
      console.log('✅ RemoteControl - Comando de mouse ejecutado');
      return result;
    } catch (error) {
      console.error('❌ RemoteControl - Error ejecutando comando de mouse:', error);
      throw new Error(`Error ejecutando comando de mouse: ${error}`);
    }
  }

  // ⌨️ Ejecutar comando de teclado
  async executeKeyboardCommand(command: KeyboardCommand): Promise<string> {
    console.log('⌨️ RemoteControl - Ejecutando comando de teclado:', command);
    try {
      const result = await invoke<string>('execute_keyboard_command', { command });
      console.log('✅ RemoteControl - Comando de teclado ejecutado');
      return result;
    } catch (error) {
      console.error('❌ RemoteControl - Error ejecutando comando de teclado:', error);
      throw new Error(`Error ejecutando comando de teclado: ${error}`);
    }
  }

  // 🔗 Crear sesión remota
  async createSession(clientId: string, adminId: string): Promise<RemoteSession> {
    console.log('🔗 RemoteControl - Creando sesión remota...');
    try {
      const session = await invoke<RemoteSession>('create_remote_session', {
        clientId,
        adminId,
      });
      this.sessionId = session.id;
      console.log('✅ RemoteControl - Sesión creada:', session.id);
      return session;
    } catch (error) {
      console.error('❌ RemoteControl - Error creando sesión:', error);
      throw new Error(`Error creando sesión: ${error}`);
    }
  }

  // 🔚 Terminar sesión remota
  async endSession(sessionId?: string): Promise<string> {
    const targetSessionId = sessionId || this.sessionId;
    if (!targetSessionId) {
      throw new Error('No hay sesión activa para terminar');
    }

    console.log('🔚 RemoteControl - Terminando sesión:', targetSessionId);
    try {
      const result = await invoke<string>('end_remote_session', {
        sessionId: targetSessionId,
      });
      
      // Detener captura automática si está activa
      this.stopAutomaticCapture();
      
      this.sessionId = null;
      console.log('✅ RemoteControl - Sesión terminada');
      return result;
    } catch (error) {
      console.error('❌ RemoteControl - Error terminando sesión:', error);
      throw new Error(`Error terminando sesión: ${error}`);
    }
  }

  // 📊 Obtener estado de sesión
  async getSessionStatus(sessionId?: string): Promise<RemoteSession> {
    const targetSessionId = sessionId || this.sessionId;
    if (!targetSessionId) {
      throw new Error('No hay sesión especificada');
    }

    try {
      const session = await invoke<RemoteSession>('get_session_status', {
        sessionId: targetSessionId,
      });
      return session;
    } catch (error) {
      console.error('❌ RemoteControl - Error obteniendo estado de sesión:', error);
      throw new Error(`Error obteniendo estado de sesión: ${error}`);
    }
  }

  // 💻 Obtener información del sistema
  async getSystemInfo(): Promise<SystemInfo> {
    console.log('💻 RemoteControl - Obteniendo información del sistema...');
    try {
      const systemInfo = await invoke<SystemInfo>('get_system_info');
      console.log('✅ RemoteControl - Información del sistema obtenida');
      return systemInfo;
    } catch (error) {
      console.error('❌ RemoteControl - Error obteniendo información del sistema:', error);
      throw new Error(`Error obteniendo información del sistema: ${error}`);
    }
  }

  // 🔄 Captura automática de pantalla
  startAutomaticCapture(intervalMs: number = 1000, callback?: (screenshot: ScreenshotResponse) => void): void {
    if (this.isCapturing) {
      console.log('⚠️ RemoteControl - Ya hay una captura automática en progreso');
      return;
    }

    console.log('🔄 RemoteControl - Iniciando captura automática cada', intervalMs, 'ms');
    this.isCapturing = true;
    this.onScreenshotCallback = callback || null;

    this.captureInterval = window.setInterval(async () => {
      try {
        const screenshot = await this.captureScreen();
        if (this.onScreenshotCallback) {
          this.onScreenshotCallback(screenshot);
        }
      } catch (error) {
        console.error('❌ RemoteControl - Error en captura automática:', error);
      }
    }, intervalMs);
  }

  // ⏹️ Detener captura automática
  stopAutomaticCapture(): void {
    if (!this.isCapturing) {
      return;
    }

    console.log('⏹️ RemoteControl - Deteniendo captura automática');
    this.isCapturing = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    this.onScreenshotCallback = null;
  }

  // 📡 Métodos auxiliares para control desde el navegador
  
  // Simular click en coordenadas específicas
  async clickAt(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await this.executeMouseCommand({
      x,
      y,
      button,
      action: 'click',
    });
  }

  // Simular doble click
  async doubleClickAt(x: number, y: number): Promise<void> {
    await this.executeMouseCommand({
      x,
      y,
      button: 'left',
      action: 'double_click',
    });
  }

  // Escribir texto
  async typeText(text: string): Promise<void> {
    await this.executeKeyboardCommand({
      key: text,
      action: 'type',
      modifiers: [],
    });
  }

  // Presionar tecla especial
  async pressKey(key: string, modifiers: string[] = []): Promise<void> {
    await this.executeKeyboardCommand({
      key,
      action: 'press',
      modifiers,
    });
  }

  // Combinaciones de teclas comunes
  async pressCtrlC(): Promise<void> {
    await this.pressKey('c', ['ctrl']);
  }

  async pressCtrlV(): Promise<void> {
    await this.pressKey('v', ['ctrl']);
  }

  async pressCtrlZ(): Promise<void> {
    await this.pressKey('z', ['ctrl']);
  }

  async pressAltTab(): Promise<void> {
    await this.pressKey('Tab', ['alt']);
  }

  async pressEnter(): Promise<void> {
    await this.pressKey('Enter');
  }

  async pressEscape(): Promise<void> {
    await this.pressKey('Escape');
  }

  // Estado de la sesión
  get currentSessionId(): string | null {
    return this.sessionId;
  }

  get isCapturingScreen(): boolean {
    return this.isCapturing;
  }
}

// Crear una instancia única del servicio
export const remoteControlService = new RemoteControlService();

export default remoteControlService; 