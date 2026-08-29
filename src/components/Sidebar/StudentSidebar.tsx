import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, BookOpen, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    color: isActive ? '#1d4ed8' : '#4b5563',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    borderRight: isActive ? '3px solid #1d4ed8' : '3px solid transparent',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s'
  });

  return (
    <aside style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', height: '100vh', position: 'fixed', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={18} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.025em' }}>Portal Siswa</h1>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/student/dashboard" style={({ isActive }) => navItemStyle(isActive)}>
          <Home size={18} style={{ marginRight: '0.75rem' }} /> Dashboard
        </NavLink>
        <NavLink to="/student/profile" style={({ isActive }) => navItemStyle(isActive)}>
          <User size={18} style={{ marginRight: '0.75rem' }} /> Profil Saya
        </NavLink>
        <NavLink to="/student/grades" style={({ isActive }) => navItemStyle(isActive)}>
          <BookOpen size={18} style={{ marginRight: '0.75rem' }} /> Nilai & Rapor
        </NavLink>
        <NavLink to="/student/discipline" style={({ isActive }) => navItemStyle(isActive)}>
          <AlertTriangle size={18} style={{ marginRight: '0.75rem' }} /> Kedisiplinan
        </NavLink>
      </nav>
      <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
        <button 
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </aside>
  );
};
