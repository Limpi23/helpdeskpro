export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'cliente' | 'operador' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  categoria: 'tecnico' | 'software' | 'hardware' | 'red' | 'otro';
  clienteId: string;
  cliente: User;
  operadorId?: string;
  operador?: User;
  solucion?: string;
  mensajes: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: string;
  contenido: string;
  ticketId: string;
  autorId: string;
  autor: User;
  esOperador: boolean;
  createdAt: Date;
}

export interface RemoteSession {
  id: string;
  ticketId: string;
  operadorId: string;
  clienteId: string;
  estado: 'solicitada' | 'aceptada' | 'activa' | 'finalizada';
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketData {
  titulo: string;
  descripcion: string;
  categoria: Ticket['categoria'];
  prioridad: Ticket['prioridad'];
}

export interface LoginResponse {
  user: User;
  access_token: string;
} 