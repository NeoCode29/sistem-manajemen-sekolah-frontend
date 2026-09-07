import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permissionName: string) => {
    // Super Admin bypass
    if (user?.username === 'admin' || user?.roles?.some(r => r.name === 'Super Admin')) {
      return true;
    }
    
    // Check specific permission
    return user?.permissions?.some(p => p.name === permissionName) || false;
  };

  return {
    hasPermission,
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
