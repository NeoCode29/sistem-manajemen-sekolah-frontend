import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '72px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder="Cari data..." 
              style={{
                width: '100%',
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#111827',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#6b7280" />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
            </div>
            <div style={{ cursor: 'pointer' }}>
              <HelpCircle size={20} color="#6b7280" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{user?.name || 'Admin Utama'}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SUPER ADMINISTRATOR</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
