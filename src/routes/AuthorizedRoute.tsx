import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface AuthorizedRouteProps {
  requiredPermissions?: string[];
  requireAll?: boolean;
  disallowedRoles?: string[];
}

export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ 
  requiredPermissions = [], 
  requireAll = false,
  disallowedRoles = []
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (disallowedRoles.length > 0 && user.roles) {
    const hasDisallowed = user.roles.some(r => disallowedRoles.includes(r.name));
    if (hasDisallowed) {
      return <Navigate to="/403" replace />;
    }
  }

  const isSuperAdminOrAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah') || user?.username === 'admin';
  if (isSuperAdminOrAdmin) {
    return <Outlet />;
  }

  const isAuthorized = requireAll 
    ? requiredPermissions.every(p => hasPermission(p))
    : requiredPermissions.some(p => hasPermission(p));

  if (!isAuthorized) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
