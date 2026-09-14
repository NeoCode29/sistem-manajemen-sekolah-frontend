import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface CanProps {
  permission?: string | string[];
  permissions?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const checkPermission = (user: any, permission: string | string[], requireAll = false): boolean => {
  if (!user) return false;
  if (user?.username === 'admin' || user?.roles?.some((r: any) => r.name === 'Super Admin')) {
    return true;
  }

  const userPermissions = user?.permissions?.map((p: any) => p.name) || [];
  const perms = Array.isArray(permission) ? permission : [permission];

  const hasPerm = (p: string): boolean => {
    if (userPermissions.includes(p)) return true;

    const [resource] = p.split('.');
    if (userPermissions.includes(`${resource}.manage`)) return true;
    
    // Academic fallback
    const academicResources = ['academic_years', 'semesters', 'grades', 'majors', 'class_periods', 'subjects', 'classrooms', 'schedules'];
    if (userPermissions.includes('academic.manage') && academicResources.includes(resource)) {
      return true;
    }
    if (userPermissions.includes('academic.write') && academicResources.includes(resource)) {
      return true;
    }

    // Student fallback
    const studentResources = ['students', 'achievements', 'violations'];
    if (userPermissions.includes('students.manage') && studentResources.includes(resource)) {
      return true;
    }
    if (userPermissions.includes('students.write') && studentResources.includes(resource)) {
      return true;
    }

    return false;
  };

  return requireAll ? perms.every(hasPerm) : perms.some(hasPerm);
};

export const Can: React.FC<CanProps> = ({ permission, permissions, children, fallback = null, requireAll = false }) => {
  const { user } = useAuth();
  const targetPermission = permission ?? permissions ?? [];
  
  if (checkPermission(user, targetPermission, requireAll)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export const usePermission = (permission: string | string[], requireAll = false) => {
  const { user } = useAuth();
  return checkPermission(user, permission, requireAll);
};
