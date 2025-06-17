import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

export type Permission = 
  | 'VIEW_ALL_TICKETS'     // Ver todos los tickets (admin/operador)
  | 'MANAGE_TICKETS'       // Gestionar estados, asignar operadores
  | 'DELETE_TICKETS'       // Eliminar tickets
  | 'MANAGE_USERS'         // Gestionar usuarios
  | 'VIEW_STATISTICS'      // Ver estadísticas completas
  | 'ASSIGN_OPERATORS';    // Asignar operadores a tickets

const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  'admin': [
    'VIEW_ALL_TICKETS',
    'MANAGE_TICKETS', 
    'DELETE_TICKETS',
    'MANAGE_USERS',
    'VIEW_STATISTICS',
    'ASSIGN_OPERATORS'
  ],
  'operador': [
    'VIEW_ALL_TICKETS',
    'MANAGE_TICKETS',
    'VIEW_STATISTICS'
  ],
  'cliente': [
    // Los clientes solo pueden ver sus propios tickets y crear nuevos
  ]
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isOperator = (): boolean => {
    return user?.role === 'operador';
  };

  const isClient = (): boolean => {
    return user?.role === 'cliente';
  };

  const canManageTicket = (ticket?: { clienteId?: string, operadorId?: string }): boolean => {
    if (!user || !ticket) return false;
    
    // Admin puede gestionar cualquier ticket
    if (isAdmin()) return true;
    
    // Operador puede gestionar tickets que le están asignados
    if (isOperator() && ticket.operadorId === user.id) return true;
    
    // Cliente solo puede ver sus propios tickets (no gestionar)
    return false;
  };

  const canViewTicket = (ticket?: { clienteId?: string, operadorId?: string }): boolean => {
    if (!user || !ticket) return false;
    
    // Admin puede ver cualquier ticket
    if (isAdmin()) return true;
    
    // Operador puede ver cualquier ticket
    if (isOperator()) return true;
    
    // Cliente solo puede ver sus propios tickets
    if (isClient() && ticket.clienteId === user.id) return true;
    
    return false;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isOperator,
    isClient,
    canManageTicket,
    canViewTicket,
    userRole: user?.role
  };
}; 