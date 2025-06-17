import { io, Socket } from 'socket.io-client';
import { RemoteSession } from '../types';

interface RemoteServiceEvents {
  onSessionRequest: (session: RemoteSession) => void;
  onSessionAccepted: (session: RemoteSession) => void;
  onSessionStarted: (sessionId: string) => void;
  onSessionEnded: () => void;
  onError: (error: string) => void;
}

class RemoteService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    // URL del servidor - se adapta automáticamente al entorno
    const serverUrl = import.meta.env.VITE_API_URL || 
                     (import.meta.env.PROD 
                       ? 'wss://tu-backend.railway.app' // Cambiar por tu URL de Railway
                       : 'ws://localhost:3001');

    this.socket = io(serverUrl, {
      auth: {
        token: localStorage.getItem('access_token')
      },
      transports: ['websocket', 'polling'], // Fallback para Railway
      upgrade: true
    });

    this.socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error);
    });
  }

  // Solicitar acceso remoto a un ticket
  async requestRemoteAccess(ticketId: string): Promise<void> {
    if (!this.socket) return;

    this.socket.emit('request-remote-access', { ticketId });
  }

  // Aceptar solicitud de acceso remoto (cliente)
  async acceptRemoteAccess(sessionId: string): Promise<void> {
    if (!this.socket) return;

    try {
      // Capturar pantalla del cliente
      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      await this.initializePeerConnection();
      this.socket.emit('accept-remote-access', { sessionId });
    } catch (error) {
      console.error('Error al aceptar acceso remoto:', error);
    }
  }

  // Rechazar solicitud de acceso remoto
  rejectRemoteAccess(sessionId: string): void {
    if (!this.socket) return;
    this.socket.emit('reject-remote-access', { sessionId });
  }

  // Inicializar conexión WebRTC
  private async initializePeerConnection(): Promise<void> {
    // Configuración mejorada de ICE servers para Railway
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Para producción, considera agregar un servidor TURN
        // { 
        //   urls: 'turn:tu-servidor-turn.com:3478',
        //   username: 'usuario',
        //   credential: 'password'
        // }
      ],
      iceCandidatePoolSize: 10
    });

    // Añadir stream local a la conexión
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Manejar stream remoto
    this.peerConnection.ontrack = (event) => {
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = event.streams[0];
      }
    };

    // Manejar candidatos ICE
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', event.candidate);
      }
    };

    // Manejar estado de conexión
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Estado de conexión WebRTC:', this.peerConnection?.connectionState);
    };
  }

  // Configurar elemento de video remoto
  setRemoteVideoElement(videoElement: HTMLVideoElement): void {
    this.remoteVideoElement = videoElement;
  }

  // Finalizar sesión remota
  endRemoteSession(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket) {
      this.socket.emit('end-remote-session');
    }
  }

  // Configurar event listeners
  setupEventListeners(events: Partial<RemoteServiceEvents>): void {
    if (!this.socket) return;

    if (events.onSessionRequest) {
      this.socket.on('session-request', events.onSessionRequest);
    }

    if (events.onSessionAccepted) {
      this.socket.on('session-accepted', events.onSessionAccepted);
    }

    if (events.onSessionStarted) {
      this.socket.on('session-started', events.onSessionStarted);
    }

    if (events.onSessionEnded) {
      this.socket.on('session-ended', events.onSessionEnded);
    }

    if (events.onError) {
      this.socket.on('remote-error', events.onError);
    }

    // Manejar señalización WebRTC
    this.socket.on('offer', async (offer) => {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket!.emit('answer', answer);
      }
    });

    this.socket.on('answer', async (answer) => {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(answer);
      }
    });

    this.socket.on('ice-candidate', async (candidate) => {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(candidate);
      }
    });
  }

  // Desconectar socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const remoteService = new RemoteService(); 