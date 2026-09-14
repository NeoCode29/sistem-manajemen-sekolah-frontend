import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName: string) => {
    // Super Admin & Admin Sekolah bypass
    if (user?.username === 'admin' || user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah')) {
      return true;
    }
    
    const permissions = user?.permissions?.map(p => p.name) || [];
    if (permissions.includes(permissionName)) {
      return true;
    }

    // Fallback logic
    const [resource] = permissionName.split('.');
    if (permissions.includes(`${resource}.manage`)) return true;
    const academicResources = ['academic_years', 'semesters', 'grades', 'majors', 'class_periods', 'subjects', 'classrooms', 'schedules'];
    if ((permissions.includes('academic.manage') || permissions.includes('academic.read')) && academicResources.includes(resource)) {
      return true;
    }

    return false;
  };

  const canReadResource = (resource: string) => {
    if (user?.username === 'admin' || user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah')) {
      return true;
    }
    const permissions = user?.permissions?.map(p => p.name) || [];
    if (permissions.includes(`${resource}.read`) || permissions.includes(`${resource}.manage`)) {
      return true;
    }
    if (permissions.some(p => p.startsWith(`${resource}.`))) {
      return true;
    }
    const academicResources = ['academic_years', 'semesters', 'grades', 'majors', 'class_periods', 'subjects', 'classrooms', 'schedules'];
    if ((permissions.includes('academic.manage') || permissions.includes('academic.read')) && academicResources.includes(resource)) {
      return true;
    }
    return false;
  };

  const hasAnyPermission = (permissionNames: string[]) => {
    return permissionNames.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissionNames: string[]) => {
    return permissionNames.every(p => hasPermission(p));
  };

  return {
    hasPermission,
    canReadResource,
    hasAnyPermission,
    hasAllPermissions,
    canManageAcademic: hasPermission('academic.manage'),
    canManageStudents: hasPermission('students.manage'),
    canManagePositions: hasPermission('positions.manage'),
    canManageEmployees: hasPermission('employees.manage'),
    canManageAttendance: hasPermission('attendance.write'),
    canManageUsers: hasPermission('users.manage'),
    canManageRbac: hasPermission('rbac.manage'),
    canManageFinance: hasPermission('finance.manage'),
    canManageAssessment: hasPermission('assessment.manage'),
    canManageScoreValidation: hasPermission('score_validation.manage'),
    canManagePrincipalApproval: hasPermission('principal_approval.manage'),
    canManageReportCards: hasPermission('report_cards.manage'),
    canManagePromotions: hasPermission('promotions.manage'),
    canManageGraduations: hasPermission('graduations.manage'),
    
    // Read Permissions
    canReadAcademic: hasPermission('academic.read'),
    canReadStudents: hasPermission('students.read'),
    canReadPositions: hasPermission('positions.read'),
    canReadEmployees: hasPermission('employees.read'),
    canReadAttendance: hasPermission('attendance.read'),
    canReadFinance: hasPermission('finance.read'),
    canReadAssessment: hasPermission('assessment.read'),
    canReadScoreValidation: hasPermission('score_validation.read'),
    canReadPrincipalApproval: hasPermission('principal_approval.read'),
    canReadReportCards: hasPermission('report_cards.read'),
    canReadPromotions: hasPermission('promotions.read'),
    canReadGraduations: hasPermission('graduations.read'),
  };
};
