import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { LayoutDashboard, Users, Settings, LogOut, BookOpen, Clock, Calendar, GraduationCap, Library, UserCog, ShieldCheck, UserCheck, Briefcase, User, BadgeCheck, CalendarDays, FileText, FileEdit, Award, AlertOctagon, Building2, Megaphone, Mail, Send, FileCode, TrendingUp, UserPlus, Monitor } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isSuperAdminOrAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah');
  const isTeacher = user?.roles?.some(r => r.name === 'Guru / Wali Kelas' || r.name === 'Wali Kelas' || r.name === 'Guru' || r.name?.toLowerCase().includes('guru') || r.name?.toLowerCase().includes('wali')) || Boolean(user?.employeeId && !isSuperAdminOrAdmin);

  const { hasPermission, canReadResource } = usePermissions();

  // Profil Institusi
  const canSchoolProfile = canReadResource('school_profile');

  // Data Master
  const canPositions = canReadResource('positions');
  const canClassrooms = canReadResource('classrooms');
  const canGrades = canReadResource('grades');
  const canMajors = canReadResource('majors');
  const canYears = canReadResource('academic_years');
  const canSemesters = canReadResource('semesters');

  // Sivitas Akademika
  const canStudents = canReadResource('students');
  const canEmployees = canReadResource('employees');

  // Akademik & Kurikulum
  const canSubjects = canReadResource('subjects');
  const canClassPeriods = canReadResource('class_periods');
  const canSchedules = canReadResource('schedules');
  const canPromotions = canReadResource('promotions');
  const canGraduations = canReadResource('graduations');

  // Kehadiran & Absensi
  const canAttendanceSettings = hasPermission('attendance_settings.manage') || hasPermission('attendance_settings.read');
  const canStudentAttendance = canReadResource('student_attendance');
  const canEmployeeAttendance = canReadResource('employee_attendance');

  // Penilaian & Ujian
  const canAssessmentComponents = canReadResource('assessment_components');
  const canAssessments = canReadResource('assessments');
  const canReportCards = canReadResource('report_cards');

  // Kesiswaan & Kedisiplinan
  const canAchievements = canReadResource('achievements');
  const canViolations = canReadResource('violations');

  // Komunikasi & Persuratan
  const canAnnouncements = canReadResource('announcements');
  const canIncomingLetters = canReadResource('incoming_letters');
  const canOutgoingLetters = canReadResource('outgoing_letters');
  const canLetterTemplates = canReadResource('letter_templates');

  // Sistem & Akses
  const canUsers = canReadResource('users');
  const canRoles = canReadResource('roles');
  const canPermissions = hasPermission('roles.assign_permissions') || hasPermission('roles.read') || hasPermission('roles.manage');

  // Perangkat Keras
  const canHardwareLogs = hasPermission('hardware.read_logs');
  const canHardwareRegistration = hasPermission('hardware.assign_card');

  // Group visibility
  const showInstitusi = canSchoolProfile;
  const showMasterData = canPositions || canClassrooms || canGrades || canMajors || canYears || canSemesters;
  const showSivitas = canStudents || canEmployees;
  const showAkademik = canSubjects || canClassPeriods || canSchedules || canPromotions || canGraduations;
  const showKehadiran = canAttendanceSettings || canStudentAttendance || canEmployeeAttendance;
  const showPenilaian = canAssessmentComponents || canAssessments || canReportCards;
  const showKesiswaan = canAchievements || canViolations;
  const showKomunikasi = canAnnouncements || canIncomingLetters || canOutgoingLetters || canLetterTemplates;
  const showSistem = canUsers || canRoles || canPermissions;
  const showPerangkat = canHardwareLogs || canHardwareRegistration;

  return (
    <div className="w-[260px] bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 flex items-center gap-3 border-b border-gray-200">
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-gray-200 p-1 flex items-center justify-center shadow-sm shrink-0">
          <img src="/icon.svg" alt="App Logo" className="w-full h-full object-contain" />
        </div>
        <div className="font-bold text-xl text-gray-900 tracking-tight">SekolahApp</div>
      </div>

      <div className="p-5 border-t border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{user?.name || 'Administrator'}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">@{user?.username || 'admin'}</p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {isTeacher && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Wali Kelas Portal
            </div>
            <NavLink to="/homeroom/dashboard" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
              <Users size={20} />
              <span>Kelas Diampu</span>
            </NavLink>
          </>
        )}
        
        {showInstitusi && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Profil Institusi
            </div>
            <NavLink to="/profile/school" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
              <Building2 size={20} />
              <span>Profil Sekolah</span>
            </NavLink>
          </>
        )}

        {showMasterData && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Master
            </div>
            {canPositions && (
              <NavLink to="/entities/positions" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <BadgeCheck size={20} />
                <span>Jabatan</span>
              </NavLink>
            )}
            {canClassrooms && (
              <NavLink to="/academic/classrooms" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Users size={20} />
                <span>Rombel / Kelas</span>
              </NavLink>
            )}
            {canGrades && (
              <NavLink to="/academic/grades" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <GraduationCap size={20} />
                <span>Tingkat Kelas</span>
              </NavLink>
            )}
            {canMajors && (
              <NavLink to="/academic/majors" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Award size={20} />
                <span>Jurusan</span>
              </NavLink>
            )}
            {canYears && (
              <NavLink to="/academic/years" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Calendar size={20} />
                <span>Tahun Ajaran</span>
              </NavLink>
            )}
            {canSemesters && (
              <NavLink to="/academic/semesters" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Library size={20} />
                <span>Semester</span>
              </NavLink>
            )}
          </>
        )}

        {showSivitas && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sivitas Akademika
            </div>
            {canStudents && (
              <NavLink to="/entities/students" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <User size={20} />
                <span>Siswa & Wali</span>
              </NavLink>
            )}
            {canEmployees && (
              <NavLink to="/entities/employees" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Briefcase size={20} />
                <span>Pegawai / Guru</span>
              </NavLink>
            )}
          </>
        )}

        {showAkademik && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Akademik & Kurikulum
            </div>
            {canSubjects && (
              <NavLink to="/academic/subjects" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <BookOpen size={20} />
                <span>Mata Pelajaran</span>
              </NavLink>
            )}
            {canClassPeriods && (
              <NavLink to="/academic/class-periods" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Clock size={20} />
                <span>Jam Pelajaran</span>
              </NavLink>
            )}
            {canSchedules && (
              <NavLink to="/academic/schedules" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <CalendarDays size={20} />
                <span>Jadwal Pelajaran</span>
              </NavLink>
            )}
            {canPromotions && (
              <NavLink to="/academic/promotions" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <TrendingUp size={20} />
                <span>Kenaikan Kelas</span>
              </NavLink>
            )}
            {canGraduations && (
              <NavLink to="/academic/graduations" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Award size={20} />
                <span>Kelulusan</span>
              </NavLink>
            )}
          </>
        )}

        {showKehadiran && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kehadiran & Absensi
            </div>
            {canAttendanceSettings && (
              <NavLink to="/attendance/settings" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Settings size={20} />
                <span>Pengaturan Absensi</span>
              </NavLink>
            )}
            {canStudentAttendance && (
              <NavLink to="/attendance/students" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <UserCheck size={20} />
                <span>Absensi Siswa</span>
              </NavLink>
            )}
            {canEmployeeAttendance && (
              <NavLink to="/attendance/employees" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Briefcase size={20} />
                <span>Absensi Pegawai</span>
              </NavLink>
            )}
          </>
        )}

        {showPenilaian && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Penilaian & Ujian
            </div>
            {canAssessmentComponents && (
              <NavLink to="/assessment/components" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Settings size={20} />
                <span>Komponen Penilaian</span>
              </NavLink>
            )}
            {canAssessments && (
              <NavLink to="/assessment/exams" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <FileEdit size={20} />
                <span>Agenda Penilaian</span>
              </NavLink>
            )}
            {canReportCards && (
              <NavLink to="/assessment/report-cards" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <FileText size={20} />
                <span>Cetak Rapor</span>
              </NavLink>
            )}
          </>
        )}

        {showKesiswaan && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kesiswaan
            </div>
            {canAchievements && (
              <NavLink to="/student-affairs/achievements" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Award size={20} />
                <span>Prestasi Siswa</span>
              </NavLink>
            )}
            {canViolations && (
              <NavLink to="/student-affairs/violations" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <AlertOctagon size={20} />
                <span>Pelanggaran (Kasus)</span>
              </NavLink>
            )}
          </>
        )}

        {showKomunikasi && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Komunikasi
            </div>
            {canAnnouncements && (
              <NavLink to="/announcements" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Megaphone size={20} />
                <span>Pengumuman</span>
              </NavLink>
            )}
            {canIncomingLetters && (
              <NavLink to="/letters/incoming" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Mail size={20} />
                <span>Surat Masuk</span>
              </NavLink>
            )}
            {canOutgoingLetters && (
              <NavLink to="/letters/outgoing" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Send size={20} />
                <span>Surat Keluar</span>
              </NavLink>
            )}
            {canLetterTemplates && (
              <NavLink to="/letters/templates" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <FileCode size={20} />
                <span>Template Surat</span>
              </NavLink>
            )}
          </>
        )}

        {showSistem && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sistem & Akses
            </div>
            {canUsers && (
              <NavLink to="/admin/users" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <UserCog size={20} />
                <span>Pengguna</span>
              </NavLink>
            )}
            {canRoles && (
              <NavLink to="/admin/roles" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <UserCheck size={20} />
                <span>Peran (Roles)</span>
              </NavLink>
            )}
            {canPermissions && (
              <NavLink to="/admin/permissions" className={({isActive}) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <ShieldCheck size={20} />
                <span>Hak Akses</span>
              </NavLink>
            )}
          </>
        )}
        
        {showPerangkat && (
          <>
            <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Perangkat
            </div>
            {canHardwareLogs && (
              <NavLink to="/hardware/logs" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <Monitor size={20} />
                <span>Log Mesin Absensi</span>
              </NavLink>
            )}
            {canHardwareRegistration && (
              <NavLink to="/hardware/registration" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
                <UserPlus size={20} />
                <span>Registrasi Biometrik</span>
              </NavLink>
            )}
          </>
        )}

        <div className="px-6 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Lainnya
        </div>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "flex items-center gap-3 px-6 py-3 text-blue-700 bg-blue-50 font-medium border-l-4 border-blue-700 transition-colors" : "flex items-center gap-3 px-6 py-3 text-gray-600 font-medium border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-colors"}>
          <Settings size={20} />
          <span>Pengaturan</span>
        </NavLink>
      </nav>

      <div className="px-6 pb-6">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
