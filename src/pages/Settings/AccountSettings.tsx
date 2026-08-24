import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Key, Save, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';
import './AccountSettings.css';

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

  // Show/hide password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="settings-container">
      
      {/* Premium Header */}
      <div className="settings-header">
        <div className="settings-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div>
          <h1 className="settings-title">Pengaturan Akun</h1>
          <p className="settings-subtitle">Personalisasikan profil Anda dan tingkatkan keamanan akun dengan mudah.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div className="settings-grid">
        {/* Profil Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon icon-blue">
              <User size={24} strokeWidth={2.5} />
            </div>
            <h2 className="settings-card-title">Informasi Profil</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="settings-form">
            
            <div className="input-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                className="premium-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                required
              />
            </div>

            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                className="premium-input"
                value={profileForm.username}
                onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button type="submit" className="btn-save btn-primary-gradient">
                <Save size={18} /> Simpan Profil
              </button>
              {profileSuccess && <div className="success-message">Profil berhasil diperbarui!</div>}
            </div>
          </form>
        </div>

        {/* Keamanan Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon icon-purple">
              <Key size={24} strokeWidth={2.5} />
            </div>
            <h2 className="settings-card-title">Keamanan Sandi</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            
            <div className="input-group">
              <label style={{ textAlign: 'left', display: 'block', width: '100%' }}>Password Baru</label>
              <div className="password-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="premium-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label style={{ textAlign: 'left', display: 'block', width: '100%' }}>Konfirmasi Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="premium-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Ketik ulang password baru"
                  minLength={6}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button type="submit" className="btn-save btn-dark-gradient">
                <Save size={18} /> Update Sandi
              </button>
              {passwordSuccess && <div className="success-message">Sandi berhasil diperbarui!</div>}
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};
