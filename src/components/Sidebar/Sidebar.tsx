import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Settings, LogOut, BookOpen, Clock, Calendar, GraduationCap, Library, UserCog, ShieldCheck, UserCheck, Briefcase, User, BadgeCheck, CalendarDays, FileText, FileEdit, Award, AlertOctagon, Building2, Megaphone, Mail, Send, FileCode, TrendingUp, UserPlus, Monitor } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isSuperAdminOrAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah');
  const isTeacher = user?.roles?.some(r => r.name === 'Guru / Wali Kelas');
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin');
  const isPrincipal = user?.roles?.some(r => r.name === 'Kepala Sekolah');

  const canManageMaster = isSuperAdminOrAdmin || isPrincipal;
  const canManageSivitas = isSuperAdminOrAdmin || isPrincipal;
  const canManageAssessment = isSuperAdminOrAdmin || isTeacher || isPrincipal;
  const canManageStudentAffairs = isSuperAdminOrAdmin || isTeacher || isPrincipal;
  const canManageRBAC = isSuperAdmin;
  const canManageCommunication = isSuperAdminOrAdmin || isPrincipal;
  const canManageHardware = isSuperAdminOrAdmin;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder small">SMS</div>
        <div className="brand-name">SekolahApp</div>
      </div>
      
      <div className="sidebar-user">
        <div className="avatar">{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</div>
        <div className="user-info">
          <p className="user-name">{user?.name || 'Administrator'}</p>
          <p className="user-email">@{user?.username || 'admin'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {isTeacher && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Wali Kelas Portal
            </div>
            <NavLink to="/homeroom/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={20} />
              <span>Kelas Binaan</span>
            </NavLink>
          </>
        )}
        
        {canManageMaster && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Profil Institusi
            </div>
            <NavLink to="/profile/school" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Building2 size={20} />
              <span>Profil Sekolah</span>
            </NavLink>
          </>
        )}

        {canManageMaster && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Master
            </div>
            <NavLink to="/entities/positions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <BadgeCheck size={20} />
              <span>Jabatan</span>
            </NavLink>
            <NavLink to="/academic/classrooms" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={20} />
              <span>Rombel / Kelas</span>
            </NavLink>
            <NavLink to="/academic/grades" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <GraduationCap size={20} />
              <span>Tingkat Kelas</span>
            </NavLink>
            <NavLink to="/academic/majors" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Award size={20} />
              <span>Jurusan</span>
            </NavLink>
            <NavLink to="/academic/years" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Calendar size={20} />
              <span>Tahun Ajaran</span>
            </NavLink>
            <NavLink to="/academic/semesters" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Library size={20} />
              <span>Semester</span>
            </NavLink>
          </>
        )}

        {canManageSivitas && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sivitas Akademika
            </div>
            <NavLink to="/entities/students" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <User size={20} />
              <span>Siswa & Wali</span>
            </NavLink>
            <NavLink to="/entities/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Briefcase size={20} />
              <span>Pegawai / Guru</span>
            </NavLink>
          </>
        )}

        {canManageMaster && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Akademik & Kurikulum
            </div>
            <NavLink to="/academic/subjects" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <BookOpen size={20} />
              <span>Mata Pelajaran</span>
            </NavLink>
            <NavLink to="/academic/class-periods" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Clock size={20} />
              <span>Jam Pelajaran</span>
            </NavLink>
            <NavLink to="/academic/schedules" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <CalendarDays size={20} />
              <span>Jadwal Pelajaran</span>
            </NavLink>
            <NavLink to="/academic/promotions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <TrendingUp size={20} />
              <span>Kenaikan Kelas</span>
            </NavLink>
            <NavLink to="/academic/graduations" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Award size={20} />
              <span>Kelulusan</span>
            </NavLink>
          </>
        )}

        {(canManageMaster || canManageStudentAffairs) && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kehadiran & Absensi
            </div>
            {canManageMaster && (
              <NavLink to="/attendance/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                <Settings size={20} />
                <span>Pengaturan Absensi</span>
              </NavLink>
            )}
            {(canManageStudentAffairs) && (
              <NavLink to="/attendance/students" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                <UserCheck size={20} />
                <span>Absensi Siswa</span>
              </NavLink>
            )}
            {canManageMaster && (
              <NavLink to="/attendance/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                <Briefcase size={20} />
                <span>Absensi Pegawai</span>
              </NavLink>
            )}
          </>
        )}

        {canManageAssessment && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Penilaian & Ujian
            </div>
            {canManageMaster && (
              <NavLink to="/assessment/components" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                <Settings size={20} />
                <span>Komponen Penilaian</span>
              </NavLink>
            )}
            <NavLink to="/assessment/exams" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileEdit size={20} />
              <span>Agenda Penilaian</span>
            </NavLink>
            <NavLink to="/assessment/report-cards" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileText size={20} />
              <span>Cetak Rapor</span>
            </NavLink>
          </>
        )}

        {canManageStudentAffairs && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kesiswaan
            </div>
            <NavLink to="/student-affairs/achievements" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Award size={20} />
              <span>Prestasi Siswa</span>
            </NavLink>
            <NavLink to="/student-affairs/violations" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <AlertOctagon size={20} />
              <span>Pelanggaran (Kasus)</span>
            </NavLink>
          </>
        )}

        {canManageCommunication && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Komunikasi
            </div>
            <NavLink to="/announcements" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Megaphone size={20} />
              <span>Pengumuman</span>
            </NavLink>
            <NavLink to="/letters/incoming" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Mail size={20} />
              <span>Surat Masuk</span>
            </NavLink>
            <NavLink to="/letters/outgoing" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Send size={20} />
              <span>Surat Keluar</span>
            </NavLink>
            <NavLink to="/letters/templates" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileCode size={20} />
              <span>Template Surat</span>
            </NavLink>
          </>
        )}

        {canManageRBAC && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sistem & Akses
            </div>
            <NavLink to="/admin/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <UserCog size={20} />
              <span>Pengguna</span>
            </NavLink>
            <NavLink to="/admin/roles" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <UserCheck size={20} />
              <span>Peran (Roles)</span>
            </NavLink>
            <NavLink to="/admin/permissions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <ShieldCheck size={20} />
              <span>Hak Akses</span>
            </NavLink>
          </>
        )}
        
        {canManageHardware && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Perangkat
            </div>
            <NavLink to="/hardware/logs" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Monitor size={20} />
              <span>Log Mesin Absensi</span>
            </NavLink>
            <NavLink to="/hardware/registration" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <UserPlus size={20} />
              <span>Registrasi Biometrik</span>
            </NavLink>
          </>
        )}

        <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Lainnya
        </div>
        <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Settings size={20} />
          <span>Pengaturan</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
