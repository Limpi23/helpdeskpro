import React from 'react';
import { usePermissions, Permission } from '../hooks/usePermissions';
import { User } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: User['role'][];
  permissions?: Permission[];
  requireAll?: boolean; // Si es true, requiere TODOS los permisos/roles
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  fallback = null
}) => {
  const { userRole, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Verificar roles
  let hasValidRole = true;
  if (roles.length > 0) {
    hasValidRole = roles.includes(userRole!);
  }

  // Verificar permisos
  let hasValidPermissions = true;
  if (permissions.length > 0) {
    hasValidPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Si no cumple con roles o permisos, mostrar fallback
  if (!hasValidRole || !hasValidPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Componente específico para mostrar solo a admins
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <RoleGuard roles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Componente específico para mostrar solo a operadores
export const OperatorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <RoleGuard roles={['operador']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Componente específico para mostrar solo a clientes
export const ClientOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <RoleGuard roles={['cliente']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Componente para mostrar solo a admins y operadores
export const StaffOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <RoleGuard roles={['admin', 'operador']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Componente para mostrar contenido basado en permisos
export const PermissionGuard: React.FC<{
  children: React.ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, permissions, requireAll = false, fallback = null }) => (
  <RoleGuard permissions={permissions} requireAll={requireAll} fallback={fallback}>
    {children}
  </RoleGuard>
); 