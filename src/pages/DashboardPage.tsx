import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { AdminOnly, StaffOnly, ClientOnly } from '../components/RoleGuard';
import { ticketService, DashboardStats } from '../services/ticketService';
import { Ticket } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isOperator, isClient } = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [dashboardStats, tickets] = await Promise.all([
          ticketService.getDashboardStats(),
          ticketService.getTickets()
        ]);
        
        setStats(dashboardStats);
        // Obtener solo los 5 tickets más recientes
        setRecentTickets(tickets.slice(0, 5));
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
        setError('Error al cargar los datos. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Función para obtener mensaje de bienvenida personalizado por rol
  const getWelcomeMessage = () => {
    if (isAdmin()) {
      return {
        title: `¡Bienvenido al Panel de Administración, ${user?.name}! 👑`,
        subtitle: 'Gestiona el sistema y supervisa todas las operaciones',
        description: 'Panel de control completo para administradores'
      };
    } else if (isOperator()) {
      return {
        title: `¡Hola ${user?.name}! Listo para ayudar 💼`,
        subtitle: 'Administra y resuelve tickets de soporte',
        description: 'Panel operativo para técnicos de soporte'
      };
    } else {
      return {
        title: `¡Bienvenido ${user?.name}! 👋`,
        subtitle: 'Solicita soporte y gestiona tus tickets',
        description: 'Portal de cliente para soporte técnico'
      };
    }
  };

  // Función para calcular estadísticas de cambio (simulada por ahora)
  const getChangePercentage = (current: number, type: 'abiertos' | 'progreso' | 'resueltos' | 'tiempo') => {
    // Por ahora simulamos los cambios, en el futuro esto vendría del backend
    const changes = {
      abiertos: '+4.75%',
      progreso: '+54.02%',
      resueltos: '-1.39%',
      tiempo: '-10.18%'
    };
    return changes[type];
  };

  const getChangeType = (change: string): 'positive' | 'negative' => {
    return change.startsWith('+') ? 'positive' : 'negative';
  };

  // Configuración de estadísticas dinámicas según rol
  const getStatItems = () => {
    if (!stats) return [];
    
    const baseStats = [
      { 
        name: 'Tickets Abiertos', 
        value: stats.ticketsAbiertos.toString(), 
        change: getChangePercentage(stats.ticketsAbiertos, 'abiertos'), 
        changeType: getChangeType(getChangePercentage(stats.ticketsAbiertos, 'abiertos')),
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        gradient: 'from-red-500 to-pink-500',
        roles: ['admin', 'operador', 'cliente']
      },
      { 
        name: 'En Progreso', 
        value: stats.ticketsEnProgreso.toString(), 
        change: getChangePercentage(stats.ticketsEnProgreso, 'progreso'), 
        changeType: getChangeType(getChangePercentage(stats.ticketsEnProgreso, 'progreso')),
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: 'from-yellow-500 to-orange-500',
        roles: ['admin', 'operador', 'cliente']
      },
      { 
        name: 'Resueltos Hoy', 
        value: stats.ticketsResueltosHoy.toString(), 
        change: getChangePercentage(stats.ticketsResueltosHoy, 'resueltos'), 
        changeType: getChangeType(getChangePercentage(stats.ticketsResueltosHoy, 'resueltos')),
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        gradient: 'from-green-500 to-emerald-500',
        roles: ['admin', 'operador']
      },
      { 
        name: 'Total Tickets', 
        value: stats.totalTickets.toString(), 
        change: getChangePercentage(stats.totalTickets, 'tiempo'), 
        changeType: getChangeType(getChangePercentage(stats.totalTickets, 'tiempo')),
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        gradient: 'from-blue-500 to-indigo-500',
        roles: ['admin', 'operador']
      },
    ];

    // Filtrar estadísticas según rol
    return baseStats.filter(stat => stat.roles.includes(user?.role || ''));
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'abierto': return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' };
      case 'en_progreso': return { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' };
      case 'resuelto': return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' };
      case 'cerrado': return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
    }
  };

  const getPrioridadConfig = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
      case 'critica': return { color: 'text-red-800', bg: 'bg-red-200', border: 'border-red-300' };
      case 'media': return { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
      case 'baja': return { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
          </div>
        </div>
      </div>
    );
  }

  const statItems = getStatItems();

  return (
    <div className="space-y-8">
      {/* Header con bienvenida */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {getWelcomeMessage().title}
              </h1>
              <p className="mt-2 text-blue-100 text-lg">
                {getWelcomeMessage().subtitle}
              </p>
              <p className="mt-1 text-blue-200">
                {getWelcomeMessage().description}
              </p>
            </div>
            {/* Botón de acción contextual según rol */}
            <ClientOnly>
              <Link
                to="/tickets/new"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Ticket
              </Link>
            </ClientOnly>
            
            <StaffOnly>
              <Link
                to="/tickets"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Gestionar Tickets
              </Link>
            </StaffOnly>
          </div>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <div key={item.name} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {item.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {item.value}
                  </p>
                  <div className="flex items-center mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.changeType === 'positive' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.changeType === 'positive' ? '↗' : '↘'} {item.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">desde ayer</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets Recientes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Tickets Recientes
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Tus tickets más recientes y su estado actual
                  </p>
                </div>
                <Link
                  to="/tickets"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  Ver todos
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket) => {
                  const estadoConfig = getEstadoConfig(ticket.estado);
                  const prioridadConfig = getPrioridadConfig(ticket.prioridad);
                  return (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="block p-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className={`h-3 w-3 rounded-full ${estadoConfig.dot}`}></div>
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {ticket.titulo}
                            </h4>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>{ticket.cliente?.name || 'Cliente no disponible'}</span>
                            <span>•</span>
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prioridadConfig.bg} ${prioridadConfig.color} ${prioridadConfig.border} border`}>
                            {ticket.prioridad}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                            {ticket.estado.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tickets</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer ticket de soporte.</p>
                  <div className="mt-6">
                    <Link
                      to="/tickets/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nuevo Ticket
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Panel de operador */}
          {user?.role === 'operador' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel de Operador
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-white border-2 border-blue-200 rounded-xl p-4 text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-blue-900">Tickets Pendientes</p>
                      <p className="text-sm text-blue-700">Revisar tickets sin asignar</p>
                    </div>
                  </div>
                </button>
                <button className="w-full bg-white border-2 border-blue-200 rounded-xl p-4 text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-blue-900">Sesiones Remotas</p>
                      <p className="text-sm text-blue-700">Administrar conexiones activas</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Accesos rápidos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Accesos Rápidos</h3>
            <div className="space-y-3">
              <Link 
                to="/tickets" 
                className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="ml-3 font-medium text-gray-900">Ver todos los tickets</span>
              </Link>
              <Link 
                to="/tickets/new" 
                className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="ml-3 font-medium text-gray-900">Crear nuevo ticket</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 