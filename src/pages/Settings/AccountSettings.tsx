import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Key, Save } from 'lucide-react';
import api from '../../api/axios';

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${user?.id}`, profileForm);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Konfirmasi password baru tidak cocok');
      return;
    }
    
    try {
      await api.put(`/users/${user?.id}`, { password: passwordForm.newPassword });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <span style={{ cursor: 'pointer' }}>Beranda</span>
        <span>›</span>
        <span style={{ fontWeight: 600, color: '#111827' }}>Pengaturan Akun</span>
      </div>

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>Pengaturan Akun</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Kelola informasi profil dan pengaturan keamanan akun Anda.</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Profil Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="#4b5563" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Informasi Profil</h2>
        </div>
        <form onSubmit={handleProfileSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Nama Lengkap</label>
            <input 
              type="text" 
              value={profileForm.name}
              onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} 
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              value={profileForm.username}
              onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1d4ed8', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              <Save size={16} /> Simpan Perubahan Profil
            </button>
            {profileSuccess && <span style={{ color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>Profil berhasil diperbarui!</span>}
          </div>
        </form>
      </div>

      {/* Keamanan Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} color="#4b5563" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Keamanan & Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Password Baru</label>
            <input 
              type="password" 
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              placeholder="Masukkan password baru (minimal 6 karakter)"
              minLength={6}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Konfirmasi Password Baru</label>
            <input 
              type="password" 
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              placeholder="Ketik ulang password baru"
              minLength={6}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111827', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              <Save size={16} /> Update Password
            </button>
            {passwordSuccess && <span style={{ color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>Password berhasil diperbarui!</span>}
          </div>
        </form>
      </div>

    </div>
  );
};
