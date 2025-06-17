import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ClientOnly, StaffOnly } from '../components/RoleGuard';
import { ticketService } from '../services/ticketService';
import { Ticket } from '../types';

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isOperator, isClient } = usePermissions();
  const location = useLocation();
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determinar si estamos en vista administrativa
  const isAdminView = location.pathname.startsWith('/admin');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTickets = await ticketService.getTickets();
        setTickets(fetchedTickets);
      } catch (err) {
        console.error('Error al cargar tickets:', err);
        setError('Error al cargar los tickets. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Función para obtener título y descripción según rol y vista
  const getPageInfo = () => {
    if (isAdminView) {
      return {
        title: 'Gestión de Tickets',
        description: 'Administra y supervisa todos los tickets del sistema',
        showNewButton: false
      };
    } else if (isClient()) {
      return {
        title: 'Mis Tickets',
        description: 'Gestiona tus solicitudes de soporte',
        showNewButton: true
      };
    } else {
      return {
        title: 'Tickets Asignados',
        description: 'Tickets asignados para resolver',
        showNewButton: false
      };
    }
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

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'software': return '💻';
      case 'hardware': return '🖥️';
      case 'red': return '🌐';
      case 'tecnico': return '🔧';
      case 'otro': return '📋';
      default: return '📋';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filtrar tickets según rol
  const getFilteredTickets = () => {
    let filteredByRole = tickets;
    
    // Para clientes, mostrar solo sus tickets
    if (isClient()) {
      filteredByRole = tickets.filter(ticket => ticket.clienteId === user?.id);
    }
    // Para operadores, mostrar tickets asignados o sin asignar
    else if (isOperator() && !isAdminView) {
      filteredByRole = tickets.filter(ticket => 
        ticket.operadorId === user?.id || ticket.operadorId === null
      );
    }
    // Para admin en vista administrativa, mostrar todos

    // Aplicar filtros de búsqueda
    return filteredByRole.filter(ticket => {
      const matchesEstado = filterEstado === 'todos' || ticket.estado === filterEstado;
      const matchesPrioridad = filterPrioridad === 'todas' || ticket.prioridad === filterPrioridad;
      const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (ticket.cliente?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesEstado && matchesPrioridad && matchesSearch;
    });
  };

  const filteredTickets = getFilteredTickets();
  const pageInfo = getPageInfo();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Intentar de nuevo
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
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {pageInfo.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {pageInfo.description}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {pageInfo.showNewButton && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ➕ Nuevo Ticket
            </Link>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Búsqueda */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Buscar tickets
              </label>
              <input
                type="text"
                id="search"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar por título, descripción o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="estado"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="abierto">Abierto</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            {/* Filtro por prioridad */}
            <div>
              <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700">
                Prioridad
              </label>
              <select
                id="prioridad"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          {/* Estadísticas de filtros */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {filteredTickets.length} de {tickets.length} tickets
            </div>
            
            {/* Indicador de vista para staff */}
            <StaffOnly>
              <div className="flex items-center space-x-2">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isAdminView ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdminView ? 'Vista Administrativa' : 'Vista Operativa'}
                </div>
              </div>
            </StaffOnly>
          </div>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredTickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to={`/tickets/${ticket.id}`}
                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCategoriaIcon(ticket.categoria)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          #{ticket.id.slice(0, 8)} - {ticket.titulo}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {ticket.descripcion}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                          <span>Cliente: {ticket.cliente?.name || 'No disponible'}</span>
                          <span>•</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                          <span>•</span>
                          <span className="capitalize">{ticket.categoria.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(ticket.estado)}`}>
                      {ticket.estado.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                      {ticket.prioridad}
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {filteredTickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="text-4xl">🔍</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron tickets</h3>
            <p className="mt-1 text-sm text-gray-500">
              {tickets.length === 0 
                ? 'No tienes tickets aún. Crea tu primer ticket para comenzar.'
                : 'Intenta ajustar los filtros para encontrar tickets.'
              }
            </p>
            <div className="mt-6">
              <Link
                to="/tickets/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ➕ Crear Nuevo Ticket
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage; 