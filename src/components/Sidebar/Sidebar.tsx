import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Settings, LogOut, BookOpen, Clock, Calendar, GraduationCap, Library, UserCog, ShieldCheck, UserCheck, Briefcase, User, BadgeCheck, Wallet, CalendarDays, FileText, ShoppingCart, Receipt, FileEdit, Award, AlertOctagon, Box, Monitor, Building2, Landmark, Megaphone, Mail, Send, FileCode, TrendingUp, UserPlus } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isSuperAdminOrAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah');
  const isTeacher = user?.roles?.some(r => r.name === 'Guru / Wali Kelas');
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin');

  const canManageMaster = isSuperAdminOrAdmin || isTeacher;
  const canManageSivitas = isSuperAdminOrAdmin || isTeacher;
  const canManageRBAC = isSuperAdmin;

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
        
        {canManageMaster && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Profil Institusi
            </div>
            <NavLink to="/profile/school" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Building2 size={20} />
              <span>Profil Sekolah</span>
            </NavLink>
            <NavLink to="/profile/foundation" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Landmark size={20} />
              <span>Profil Yayasan</span>
            </NavLink>

            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Master
            </div>
            <NavLink to="/academic/years" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Calendar size={20} />
              <span>Tahun Ajaran</span>
            </NavLink>
            <NavLink to="/academic/semesters" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Library size={20} />
              <span>Semester</span>
            </NavLink>
            <NavLink to="/academic/grades" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <GraduationCap size={20} />
              <span>Tingkat Kelas</span>
            </NavLink>
            <NavLink to="/academic/classrooms" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={20} />
              <span>Rombel / Kelas</span>
            </NavLink>
            <NavLink to="/academic/subjects" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <BookOpen size={20} />
              <span>Mata Pelajaran</span>
            </NavLink>
            <NavLink to="/academic/schedules" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <CalendarDays size={20} />
              <span>Jadwal Pelajaran</span>
            </NavLink>
            <NavLink to="/academic/class-periods" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Clock size={20} />
              <span>Jam Pelajaran</span>
            </NavLink>
            <NavLink to="/academic/promotions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <TrendingUp size={20} />
              <span>Kenaikan Kelas</span>
            </NavLink>
            <NavLink to="/academic/graduations" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Award size={20} />
              <span>Kelulusan</span>
            </NavLink>

            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Penilaian & Ujian
            </div>
            <NavLink to="/assessment/exams" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileEdit size={20} />
              <span>Agenda Penilaian</span>
            </NavLink>
          </>
        )}

        {canManageSivitas && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sivitas Akademika
            </div>
            <NavLink to="/entities/positions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <BadgeCheck size={20} />
              <span>Jabatan</span>
            </NavLink>
            <NavLink to="/entities/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Briefcase size={20} />
              <span>Pegawai / Guru</span>
            </NavLink>
            <NavLink to="/entities/students" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <User size={20} />
              <span>Siswa & Wali</span>
            </NavLink>
          </>
        )}

        {canManageSivitas && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kehadiran & Absensi
            </div>
            <NavLink to="/attendance/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Settings size={20} />
              <span>Pengaturan Absensi</span>
            </NavLink>
            <NavLink to="/attendance/students" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <UserCheck size={20} />
              <span>Absensi Siswa</span>
            </NavLink>
            <NavLink to="/attendance/employees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Briefcase size={20} />
              <span>Absensi Pegawai</span>
            </NavLink>
          </>
        )}

        {canManageSivitas && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Keuangan & Pembayaran
            </div>
            <NavLink to="/finance/payment-types" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Wallet size={20} />
              <span>Jenis Tagihan</span>
            </NavLink>
            <NavLink to="/finance/payment-periods" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <CalendarDays size={20} />
              <span>Periode Pembayaran</span>
            </NavLink>
            <NavLink to="/finance/billings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileText size={20} />
              <span>Manajemen Tagihan</span>
            </NavLink>
            <NavLink to="/finance/cashier" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <ShoppingCart size={20} />
              <span>Kasir (Checkout)</span>
            </NavLink>
            <NavLink to="/finance/receipts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Receipt size={20} />
              <span>Riwayat Kuitansi</span>
            </NavLink>
            
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

            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sarana & Prasarana
            </div>
            <NavLink to="/inventory/rooms" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Box size={20} />
              <span>Ruangan & Gedung</span>
            </NavLink>
            <NavLink to="/inventory/items" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Monitor size={20} />
              <span>Inventaris Barang</span>
            </NavLink>
          </>
        )}

        {canManageRBAC && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pengaturan Admin
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

        {canManageMaster && (
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

        {canManageMaster && (
          <>
            <div className="nav-section-title" style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Perangkat & Sistem
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
