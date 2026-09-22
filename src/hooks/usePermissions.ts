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
    if (resource === 'schedules' && permissions.includes('employees.assign_subjects')) {
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
    canManageGrades: hasPermission('grades.create') || hasPermission('grades.update') || hasPermission('grades.delete') || hasPermission('grades.manage'),
    canCreateGrade: hasPermission('grades.create') || hasPermission('grades.manage'),
    canUpdateGrade: hasPermission('grades.update') || hasPermission('grades.manage'),
    canDeleteGrade: hasPermission('grades.delete') || hasPermission('grades.manage'),

    canManageMajors: hasPermission('majors.create') || hasPermission('majors.update') || hasPermission('majors.delete') || hasPermission('majors.manage'),
    canCreateMajor: hasPermission('majors.create') || hasPermission('majors.manage'),
    canUpdateMajor: hasPermission('majors.update') || hasPermission('majors.manage'),
    canDeleteMajor: hasPermission('majors.delete') || hasPermission('majors.manage'),
    canToggleMajor: hasPermission('majors.toggle_active') || hasPermission('majors.update') || hasPermission('majors.manage'),

    canManageAcademicYears: hasPermission('academic_years.create') || hasPermission('academic_years.update') || hasPermission('academic_years.delete') || hasPermission('academic_years.manage'),
    canCreateAcademicYear: hasPermission('academic_years.create') || hasPermission('academic_years.manage'),
    canUpdateAcademicYear: hasPermission('academic_years.update') || hasPermission('academic_years.manage'),
    canDeleteAcademicYear: hasPermission('academic_years.delete') || hasPermission('academic_years.manage'),
    canToggleAcademicYear: hasPermission('academic_years.toggle_active') || hasPermission('academic_years.update') || hasPermission('academic_years.manage'),

    canManageSemesters: hasPermission('semesters.create') || hasPermission('semesters.update') || hasPermission('semesters.delete') || hasPermission('semesters.manage'),
    canCreateSemester: hasPermission('semesters.create') || hasPermission('semesters.manage'),
    canUpdateSemester: hasPermission('semesters.update') || hasPermission('semesters.manage'),
    canDeleteSemester: hasPermission('semesters.delete') || hasPermission('semesters.manage'),
    canToggleSemester: hasPermission('semesters.toggle_active') || hasPermission('semesters.update') || hasPermission('semesters.manage'),

    canManageClassrooms: hasPermission('classrooms.create') || hasPermission('classrooms.update') || hasPermission('classrooms.delete') || hasPermission('classrooms.manage'),
    canCreateClassroom: hasPermission('classrooms.create') || hasPermission('classrooms.manage'),
    canUpdateClassroom: hasPermission('classrooms.update') || hasPermission('classrooms.manage'),
    canDeleteClassroom: hasPermission('classrooms.delete') || hasPermission('classrooms.manage'),
    canManageHomeroom: hasPermission('classrooms.manage_homeroom') || hasPermission('classrooms.manage'),
    canManageClassroomStudents: hasPermission('classrooms.manage_students') || hasPermission('classrooms.manage'),
    canManageStudents: hasPermission('students.create') || hasPermission('students.update') || hasPermission('students.delete') || hasPermission('students.manage'),
    canCreateStudent: hasPermission('students.create') || hasPermission('students.manage'),
    canUpdateStudent: hasPermission('students.update') || hasPermission('students.manage'),
    canDeleteStudent: hasPermission('students.delete') || hasPermission('students.manage'),
    canImportExportStudent: hasPermission('students.export_import') || hasPermission('students.manage'),
    canManageGuardians: hasPermission('students.manage_guardians') || hasPermission('students.manage'),
    canManageEnrollment: hasPermission('classrooms.manage_students') || hasPermission('students.manage'),

    canManageSubjects: hasPermission('subjects.create') || hasPermission('subjects.update') || hasPermission('subjects.delete') || hasPermission('subjects.manage'),
    canCreateSubject: hasPermission('subjects.create') || hasPermission('subjects.manage'),
    canUpdateSubject: hasPermission('subjects.update') || hasPermission('subjects.manage'),
    canDeleteSubject: hasPermission('subjects.delete') || hasPermission('subjects.manage'),

    canManageClassPeriods: hasPermission('class_periods.create') || hasPermission('class_periods.update') || hasPermission('class_periods.delete') || hasPermission('class_periods.manage'),
    canCreateClassPeriod: hasPermission('class_periods.create') || hasPermission('class_periods.manage'),
    canUpdateClassPeriod: hasPermission('class_periods.update') || hasPermission('class_periods.manage'),
    canDeleteClassPeriod: hasPermission('class_periods.delete') || hasPermission('class_periods.manage'),

    canManagePositions: hasPermission('positions.create') || hasPermission('positions.update') || hasPermission('positions.delete') || hasPermission('positions.manage'),
    canCreatePosition: hasPermission('positions.create') || hasPermission('positions.manage'),
    canUpdatePosition: hasPermission('positions.update') || hasPermission('positions.manage'),
    canDeletePosition: hasPermission('positions.delete') || hasPermission('positions.manage'),
    canManageEmployees: hasPermission('employees.create') || hasPermission('employees.update') || hasPermission('employees.delete') || hasPermission('employees.manage'),
    canCreateEmployee: hasPermission('employees.create') || hasPermission('employees.manage'),
    canUpdateEmployee: hasPermission('employees.update') || hasPermission('employees.manage'),
    canDeleteEmployee: hasPermission('employees.delete') || hasPermission('employees.manage'),
    canManageAttendance: hasPermission('attendance_settings.manage') || hasPermission('student_attendance.record'),
    canManageUsers: hasPermission('users.create') || hasPermission('users.update') || hasPermission('users.assign_roles'),
    canManageRbac: hasPermission('roles.manage') || hasPermission('roles.assign_permissions'),
    canManageAssessment: hasPermission('assessment_components.manage') || hasPermission('assessments.input') || hasPermission('assessments.manage'),
    canManageAssessments: hasPermission('assessments.input') || hasPermission('assessments.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage'),
    canInputScores: hasPermission('assessments.input') || hasPermission('assessments.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage'),
    canDeleteAssessment: hasPermission('assessments.delete') || hasPermission('assessments.manage') || hasPermission('assessment.manage'),
    canReadAssessments: hasPermission('assessments.read') || hasPermission('assessments.input') || hasPermission('assessments.manage') || hasPermission('assessment.read'),
    canManageScoreValidation: hasPermission('score_validations.validate') || hasPermission('score_validations.principal_approve'),
    canManageReportCards: hasPermission('report_cards.generate') || hasPermission('report_cards.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage'),
    canGenerateReportCards: hasPermission('report_cards.generate') || hasPermission('report_cards.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage'),
    canManagePromotions: hasPermission('promotions.execute') || hasPermission('promotions.manage'),
    canExecutePromotions: hasPermission('promotions.execute') || hasPermission('promotions.manage'),
    canRevertPromotions: hasPermission('promotions.revert') || hasPermission('promotions.manage'),
    canManageGraduations: hasPermission('graduations.execute') || hasPermission('graduations.manage'),
    canExecuteGraduations: hasPermission('graduations.execute') || hasPermission('graduations.manage'),
    canRevertGraduations: hasPermission('graduations.revert') || hasPermission('graduations.manage'),
    canManageSchedule: hasPermission('schedules.manage'),
    canManageSubjectAssignments: hasPermission('employees.assign_subjects') || hasPermission('schedules.manage'),
    canRecordStudentAttendance: hasPermission('student_attendance.record') || hasPermission('student_attendance.batch') || hasPermission('attendance.write'),
    canRecordEmployeeAttendance: hasPermission('employee_attendance.record') || hasPermission('attendance.write'),
    canManageAttendanceSettings: hasPermission('attendance_settings.manage') || hasPermission('attendance.write'),
    canUpdateAttendanceSettings: hasPermission('attendance_settings.manage') || hasPermission('attendance.write'),
    canReadAttendanceSettings: hasPermission('attendance_settings.read') || hasPermission('attendance_settings.manage') || hasPermission('attendance.read'),

    canManageAchievements: hasPermission('achievements.create_all') || hasPermission('achievements.create') || hasPermission('achievements.manage') || hasPermission('student_affairs.write'),
    canCreateAchievement: hasPermission('achievements.create_all') || hasPermission('achievements.create_assigned') || hasPermission('achievements.create') || hasPermission('achievements.manage') || hasPermission('student_affairs.write'),
    canUpdateAchievement: hasPermission('achievements.update') || hasPermission('achievements.create_all') || hasPermission('achievements.manage') || hasPermission('student_affairs.write'),
    canDeleteAchievement: hasPermission('achievements.delete') || hasPermission('achievements.manage') || hasPermission('student_affairs.write'),
    canReadAchievements: hasPermission('achievements.read') || hasPermission('achievements.manage') || hasPermission('student_affairs.read'),

    canManageViolations: hasPermission('violations.create_all') || hasPermission('violations.create') || hasPermission('violations.manage') || hasPermission('student_affairs.write'),
    canCreateViolation: hasPermission('violations.create_all') || hasPermission('violations.create_assigned') || hasPermission('violations.create') || hasPermission('violations.manage') || hasPermission('student_affairs.write'),
    canUpdateViolation: hasPermission('violations.update') || hasPermission('violations.create_all') || hasPermission('violations.manage') || hasPermission('student_affairs.write'),
    canDeleteViolation: hasPermission('violations.delete') || hasPermission('violations.manage') || hasPermission('student_affairs.write'),
    canReadViolations: hasPermission('violations.read') || hasPermission('violations.manage') || hasPermission('student_affairs.read'),

    // Pengumuman
    canManageAnnouncements: hasPermission('announcements.manage') || hasPermission('announcements.create') || hasPermission('announcements.write'),
    canCreateAnnouncement: hasPermission('announcements.create') || hasPermission('announcements.write') || hasPermission('announcements.manage'),
    canUpdateAnnouncement: hasPermission('announcements.update') || hasPermission('announcements.write') || hasPermission('announcements.manage'),
    canDeleteAnnouncement: hasPermission('announcements.delete') || hasPermission('announcements.manage'),
    canReadAnnouncements: hasPermission('announcements.read') || hasPermission('announcements.manage') || hasPermission('announcements.create'),

    // Surat Masuk
    canManageIncomingLetters: hasPermission('incoming_letters.manage') || hasPermission('incoming_letters.create') || hasPermission('letters.manage') || hasPermission('letters.write'),
    canCreateIncomingLetter: hasPermission('incoming_letters.create') || hasPermission('incoming_letters.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canUpdateIncomingLetter: hasPermission('incoming_letters.update') || hasPermission('incoming_letters.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canDeleteIncomingLetter: hasPermission('incoming_letters.delete') || hasPermission('incoming_letters.manage') || hasPermission('letters.manage'),
    canReadIncomingLetters: hasPermission('incoming_letters.read') || hasPermission('incoming_letters.manage') || hasPermission('letters.read') || hasPermission('letters.manage'),

    // Surat Keluar
    canManageOutgoingLetters: hasPermission('outgoing_letters.manage') || hasPermission('outgoing_letters.create') || hasPermission('letters.manage') || hasPermission('letters.write'),
    canCreateOutgoingLetter: hasPermission('outgoing_letters.create') || hasPermission('outgoing_letters.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canUpdateOutgoingLetter: hasPermission('outgoing_letters.update') || hasPermission('outgoing_letters.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canDeleteOutgoingLetter: hasPermission('outgoing_letters.delete') || hasPermission('outgoing_letters.manage') || hasPermission('letters.manage'),
    canReadOutgoingLetters: hasPermission('outgoing_letters.read') || hasPermission('outgoing_letters.manage') || hasPermission('letters.read') || hasPermission('letters.manage'),

    // Template Surat & Kop Surat
    canManageLetterTemplates: hasPermission('letter_templates.manage') || hasPermission('letter_templates.create') || hasPermission('letters.manage') || hasPermission('letters.write'),
    canCreateLetterTemplate: hasPermission('letter_templates.create') || hasPermission('letter_templates.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canUpdateLetterTemplate: hasPermission('letter_templates.update') || hasPermission('letter_templates.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canDeleteLetterTemplate: hasPermission('letter_templates.delete') || hasPermission('letter_templates.manage') || hasPermission('letters.manage'),
    canReadLetterTemplates: hasPermission('letter_templates.read') || hasPermission('letter_templates.manage') || hasPermission('letters.read') || hasPermission('letters.manage'),
    canUpdateSchoolProfile: hasPermission('school_profile.update') || hasPermission('school_profile.manage') || hasPermission('letters.write') || hasPermission('letters.manage'),
    canReadSchoolProfile: hasPermission('school_profile.read') || hasPermission('school_profile.update') || hasPermission('school_profile.manage') || hasPermission('letters.read'),

    // Perangkat Keras / Hardware
    canManageHardware: hasPermission('hardware.manage') || hasPermission('hardware.assign_card') || hasPermission('hardware.read_logs') || hasPermission('attendance.write'),
    canReadHardwareLogs: hasPermission('hardware.read_logs') || hasPermission('hardware.manage') || hasPermission('attendance.read'),
    canAssignHardwareCard: hasPermission('hardware.assign_card') || hasPermission('hardware.register_identity') || hasPermission('hardware.manage') || hasPermission('attendance.write') || hasPermission('attendance_settings.manage'),
    
    // Read Permissions
    canReadAcademic: hasPermission('academic_years.read') || hasPermission('semesters.read') || hasPermission('grades.read'),
    canReadAcademicYears: hasPermission('academic_years.read') || hasPermission('academic_years.manage'),
    canReadSemesters: hasPermission('semesters.read') || hasPermission('semesters.manage'),
    canReadMajors: hasPermission('majors.read') || hasPermission('majors.manage'),
    canReadGrades: hasPermission('grades.read') || hasPermission('grades.manage'),
    canReadSubjects: hasPermission('subjects.read') || hasPermission('subjects.manage'),
    canReadClassPeriods: hasPermission('class_periods.read') || hasPermission('class_periods.manage'),
    canReadClassrooms: hasPermission('classrooms.read') || hasPermission('classrooms.manage'),
    canReadStudents: hasPermission('students.read') || hasPermission('students.manage'),
    canReadPositions: hasPermission('positions.read') || hasPermission('positions.manage'),
    canReadEmployees: hasPermission('employees.read') || hasPermission('employees.manage'),
    canReadAttendance: hasPermission('student_attendance.read') || hasPermission('employee_attendance.read') || hasPermission('attendance.read'),
    canReadStudentAttendance: hasPermission('student_attendance.read') || hasPermission('student_attendance.record') || hasPermission('student_attendance.batch') || hasPermission('attendance.read'),
    canReadEmployeeAttendance: hasPermission('employee_attendance.read') || hasPermission('employee_attendance.record') || hasPermission('attendance.read'),
    canReadFinance: true,
    canReadAssessment: hasPermission('assessments.read') || hasPermission('assessment_components.read'),
    canReadScoreValidation: hasPermission('score_validations.read'),
    canReadPrincipalApproval: hasPermission('score_validations.read'),
    canReadReportCards: hasPermission('report_cards.read') || hasPermission('report_cards.generate') || hasPermission('report_cards.manage') || hasPermission('assessment.read'),
    canReadPromotions: hasPermission('promotions.read') || hasPermission('promotions.manage') || hasPermission('promotions.execute'),
    canReadGraduations: hasPermission('graduations.read') || hasPermission('graduations.manage') || hasPermission('graduations.execute'),
    canReadSchedule: hasPermission('schedules.read') || hasPermission('schedules.manage') || hasPermission('employees.assign_subjects'),
  };
};
