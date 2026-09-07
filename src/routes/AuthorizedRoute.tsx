import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthorizedRouteProps {
  requiredPermissions?: string[];
  requireAll?: boolean;
}

export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ 
  requiredPermissions = [], 
  requireAll = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions.length === 0) {
    return <Outlet />;
  }

  const userPermissions = user.permissions?.map(p => p.name) || [];

  const hasPermission = requireAll 
    ? requiredPermissions.every(p => userPermissions.includes(p))
    : requiredPermissions.some(p => userPermissions.includes(p));

  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
