import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { user } = useAuth();
  
  const userPermissions = user?.permissions?.map(p => p.name) || [];
  
  if (userPermissions.includes(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export const usePermission = (permission: string) => {
  const { user } = useAuth();
  const userPermissions = user?.permissions?.map(p => p.name) || [];
  return userPermissions.includes(permission);
};
