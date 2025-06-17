import axios from 'axios';
import { Ticket, CreateTicketData, TicketMessage } from '../types';

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

export interface DashboardStats {
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsEnProgreso: number;
  ticketsResueltos: number;
  ticketsResueltosHoy: number;
}

export const ticketService = {
  // Obtener todos los tickets del usuario
  getTickets: async (estado?: string): Promise<Ticket[]> => {
    const params = estado ? { estado } : {};
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  // Obtener un ticket específico
  getTicket: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Crear un nuevo ticket
  createTicket: async (ticketData: CreateTicketData): Promise<Ticket> => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  // Actualizar ticket completo
  updateTicket: async (id: string, ticketData: Partial<CreateTicketData>): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  // Eliminar ticket
  deleteTicket: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },

  // Actualizar estado del ticket
  updateTicketStatus: async (id: string, estado: Ticket['estado']): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}/status`, { estado });
    return response.data;
  },

  // Resolver ticket con solución
  resolveTicket: async (id: string, solucion: string): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}/resolve`, { solucion });
    return response.data;
  },

  // Asignar operador al ticket
  assignOperator: async (ticketId: string, operadorId: string): Promise<Ticket> => {
    const response = await api.put(`/tickets/${ticketId}/assign`, { operadorId });
    return response.data;
  },

  // Añadir mensaje al ticket
  addMessage: async (ticketId: string, contenido: string): Promise<TicketMessage> => {
    const response = await api.post(`/tickets/${ticketId}/messages`, { contenido });
    return response.data;
  },

  // Obtener mensajes del ticket
  getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    const response = await api.get(`/tickets/${ticketId}/messages`);
    return response.data;
  },

  // Obtener estadísticas del dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/tickets/stats/dashboard');
    return response.data;
  }
}; 