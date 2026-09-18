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
    canManageAcademic: hasPermission('academic_years.create') || hasPermission('semesters.create') || hasPermission('classrooms.create'),
    canManageStudents: hasPermission('students.create') || hasPermission('students.update'),
    canManagePositions: hasPermission('positions.create') || hasPermission('positions.update'),
    canManageEmployees: hasPermission('employees.create') || hasPermission('employees.update'),
    canManageAttendance: hasPermission('attendance_settings.manage') || hasPermission('student_attendance.record'),
    canManageUsers: hasPermission('users.create') || hasPermission('users.update') || hasPermission('users.assign_roles'),
    canManageRbac: hasPermission('roles.manage') || hasPermission('roles.assign_permissions'),
    canManageFinance: true,
    canManageAssessment: hasPermission('assessment_components.manage') || hasPermission('assessments.input'),
    canManageScoreValidation: hasPermission('score_validations.validate') || hasPermission('score_validations.principal_approve'),
    canManagePrincipalApproval: hasPermission('score_validations.principal_approve'),
    canManageReportCards: hasPermission('report_cards.generate'),
    canManagePromotions: hasPermission('promotions.execute'),
    canManageGraduations: hasPermission('graduations.execute'),
    canManageSchedule: hasPermission('schedules.manage') || hasPermission('academic.write'),
    
    // Read Permissions
    canReadAcademic: hasPermission('academic_years.read') || hasPermission('semesters.read') || hasPermission('grades.read'),
    canReadStudents: hasPermission('students.read'),
    canReadPositions: hasPermission('positions.read'),
    canReadEmployees: hasPermission('employees.read'),
    canReadAttendance: hasPermission('student_attendance.read') || hasPermission('employee_attendance.read'),
    canReadFinance: true,
    canReadAssessment: hasPermission('assessments.read') || hasPermission('assessment_components.read'),
    canReadScoreValidation: hasPermission('score_validations.read'),
    canReadPrincipalApproval: hasPermission('score_validations.read'),
    canReadReportCards: hasPermission('report_cards.read'),
    canReadPromotions: hasPermission('promotions.read'),
    canReadGraduations: hasPermission('graduations.read'),
    canReadSchedule: hasPermission('schedules.read'),
  };
};
