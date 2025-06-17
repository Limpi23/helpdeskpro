import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { remoteService } from '../services/remoteService';
import { ticketService } from '../services/ticketService';
import { Ticket, TicketMessage } from '../types';
import RemoteClient from '../components/RemoteControl/RemoteClient';
import RemoteAdmin from '../components/RemoteControl/RemoteAdmin';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteSessionRequested, setRemoteSessionRequested] = useState(false);
  const [remoteSessionActive, setRemoteSessionActive] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [solucion, setSolucion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchTicketData = async () => {
      if (!id) {
        setError('ID de ticket inválido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const [ticketData, ticketMessages] = await Promise.all([
          ticketService.getTicket(id),
          ticketService.getTicketMessages(id)
        ]);
        
        setTicket(ticketData);
        setMessages(ticketMessages);
      } catch (err) {
        console.error('Error al cargar ticket:', err);
        setError('Error al cargar el ticket. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [id]);

  useEffect(() => {
    // Configurar servicios de acceso remoto
    if (videoRef.current) {
      remoteService.setRemoteVideoElement(videoRef.current);
    }

    remoteService.setupEventListeners({
      onSessionRequest: (session) => {
        setRemoteSessionRequested(true);
      },
      onSessionAccepted: (session) => {
        setRemoteSessionActive(true);
      },
      onSessionEnded: () => {
        setRemoteSessionActive(false);
        setRemoteSessionRequested(false);
      },
      onError: (error) => {
        alert(`Error en sesión remota: ${error}`);
      }
    });

    return () => {
      remoteService.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    
    try {
      const message = await ticketService.addMessage(ticket.id, newMessage);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Por favor, inténtelo de nuevo.');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticket) return;
    
    try {
      const updatedTicket = await ticketService.updateTicketStatus(ticket.id, newStatus as any);
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado del ticket.');
    }
  };

  const handleResolveTicket = async () => {
    if (!ticket || !solucion.trim()) return;
    
    try {
      setSubmitting(true);
      const updatedTicket = await ticketService.resolveTicket(ticket.id, solucion);
      setTicket(updatedTicket);
      setShowResolveModal(false);
      setSolucion('');
      alert('Ticket marcado como resuelto exitosamente.');
    } catch (error) {
      console.error('Error al resolver ticket:', error);
      alert('Error al resolver el ticket. Por favor, inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkInProgress = () => {
    handleUpdateStatus('en_progreso');
  };

  const handleMarkClosed = () => {
    if (confirm('¿Está seguro de que desea cerrar este ticket?')) {
      handleUpdateStatus('cerrado');
    }
  };

  const handleReopenTicket = () => {
    handleUpdateStatus('abierto');
  };

  const handleRequestRemoteAccess = async () => {
    if (!ticket) return;
    
    try {
      await remoteService.requestRemoteAccess(ticket.id);
      setRemoteSessionRequested(true);
    } catch (error) {
      console.error('Error al solicitar acceso remoto:', error);
    }
  };

  const handleAcceptRemoteAccess = async () => {
    try {
      await remoteService.acceptRemoteAccess('session-123');
    } catch (error) {
      console.error('Error al aceptar acceso remoto:', error);
    }
  };

  const handleRejectRemoteAccess = () => {
    remoteService.rejectRemoteAccess('session-123');
    setRemoteSessionRequested(false);
  };

  const handleEndRemoteSession = () => {
    remoteService.endRemoteSession();
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-red-100 text-red-800';
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800';
      case 'resuelto': return 'bg-green-100 text-green-800';
      case 'cerrado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'text-red-600';
      case 'media': return 'text-yellow-600';
      case 'baja': return 'text-green-600';
      case 'critica': return 'text-red-800 font-bold';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar el ticket</h3>
            <div className="mt-2 text-sm text-red-700">{error || 'Ticket no encontrado'}</div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/tickets')}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Volver a tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/tickets')}
                className="text-gray-400 hover:text-gray-500"
              >
                Tickets
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">→</span>
                <span className="ml-4 text-sm font-medium text-gray-500">#{ticket.id.slice(0, 8)}</span>
              </div>
            </li>
          </ol>
        </nav>
        <div className="mt-4 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {ticket.titulo}
            </h2>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(ticket.estado)}`}>
                {ticket.estado.replace('_', ' ')}
              </span>
              <span className={`text-sm font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                Prioridad {ticket.prioridad}
              </span>
              <span className="text-sm text-gray-500">
                Creado {formatDate(ticket.createdAt)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            {user?.role === 'operador' && !remoteSessionActive && !remoteSessionRequested && (
              <button
                onClick={handleRequestRemoteAccess}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                💻 Solicitar Acceso Remoto
              </button>
            )}
            
            {(user?.role === 'operador' || user?.role === 'admin') && (
              <div className="flex space-x-2">
                {ticket.estado === 'abierto' && (
                  <button
                    onClick={handleMarkInProgress}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    📋 Tomar Ticket
                  </button>
                )}
                
                {['abierto', 'en_progreso'].includes(ticket.estado) && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    ✅ Resolver
                  </button>
                )}
                
                {ticket.estado === 'resuelto' && (
                  <button
                    onClick={handleMarkClosed}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    🔒 Cerrar
                  </button>
                )}
                
                {['resuelto', 'cerrado'].includes(ticket.estado) && (
                  <button
                    onClick={handleReopenTicket}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    🔄 Reabrir
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del ticket */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Ticket</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                  <dd className="mt-1 flex items-center">
                    <img className="h-6 w-6 rounded-full mr-2" src={ticket.cliente.avatar} alt="" />
                    <span className="text-sm text-gray-900">{ticket.cliente.name}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Operador Asignado</dt>
                  <dd className="mt-1 flex items-center">
                    {ticket.operador ? (
                      <>
                        <img className="h-6 w-6 rounded-full mr-2" src={ticket.operador.avatar} alt="" />
                        <span className="text-sm text-gray-900">{ticket.operador.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Sin asignar</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{ticket.categoria}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Solicitud de acceso remoto */}
          {remoteSessionRequested && user?.role === 'cliente' && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  🔐 Solicitud de Acceso Remoto
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  El operador ha solicitado acceso a tu pantalla para resolver el problema más rápidamente.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAcceptRemoteAccess}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={handleRejectRemoteAccess}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Control Remoto Tauri */}
          <div className="mt-6">
            {user?.role === 'cliente' ? (
              <RemoteClient 
                ticketId={ticket.id}
                onSessionStart={() => setRemoteSessionActive(true)}
                onSessionEnd={() => setRemoteSessionActive(false)}
              />
            ) : user?.role === 'operador' || user?.role === 'admin' ? (
              <RemoteAdmin 
                ticketId={ticket.id}
                onSessionEnd={() => setRemoteSessionActive(false)}
              />
            ) : null}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg flex flex-col h-96">
            {/* Header del chat */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Conversación</h3>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className={`flex ${mensaje.esOperador ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      mensaje.esOperador
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium opacity-75">
                        {typeof mensaje.autor === 'string' ? mensaje.autor : mensaje.autor?.name || 'Usuario'}
                      </span>
                      <span className="text-xs opacity-50 ml-2">
                        {new Date(mensaje.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{mensaje.contenido}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para nuevo mensaje */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>

          {/* Descripción del problema */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Descripción del Problema</h3>
              <p className="text-sm text-gray-700">{ticket.descripcion}</p>
            </div>
          </div>

          {/* Solución del problema (si existe) */}
          {ticket.solucion && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-green-900 mb-3">✅ Solución Aplicada</h3>
                <p className="text-sm text-green-700">{ticket.solucion}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para resolver ticket */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ✅ Resolver Ticket
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Describe la solución aplicada para resolver este problema:
              </p>
              <textarea
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                placeholder="Escribe la solución del problema..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                disabled={submitting}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSolucion('');
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResolveTicket}
                  disabled={!solucion.trim() || submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Resolviendo...' : 'Resolver Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage; 