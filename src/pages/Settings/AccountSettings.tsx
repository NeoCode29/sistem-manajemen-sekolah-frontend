import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Key, Save, Eye, EyeOff, PenTool } from 'lucide-react';
import api from '../../api/axios';
import { uploadSignature } from '../../api/employeeService';
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

  // Signature States
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [isUploadingSig, setIsUploadingSig] = useState(false);
  const [sigMessage, setSigMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const employeeId = user?.employeeId;
  const isPrincipal = user?.roles?.some(r => r.name === 'Kepala Sekolah');

  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [isUploadingPrincipalSig, setIsUploadingPrincipalSig] = useState(false);
  const principalSigInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isPrincipal) {
      import('../../api/schoolProfileService').then(({ getSchoolProfile }) => {
        getSchoolProfile().then(data => {
          setSchoolProfile(data);
        }).catch(err => console.error(err));
      });
    }
  }, [isPrincipal]);

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

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setSigFile(selectedFile);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setSigPreview(objectUrl);
      setSigMessage(null);
    }
  };

  const handleSigUpload = async () => {
    if (!sigFile || !employeeId) return;

    setIsUploadingSig(true);
    try {
      await uploadSignature(employeeId.toString(), sigFile);
      setSigMessage({ type: 'success', text: 'Tanda tangan berhasil diunggah!' });
      setSigFile(null); // Clear selection after successful upload
    } catch (error: any) {
      console.error('Upload failed:', error);
      setSigMessage({ type: 'error', text: error.response?.data?.message || 'Gagal mengunggah tanda tangan' });
    } finally {
      setIsUploadingSig(false);
    }
  };

  const handleSigClear = () => {
    setSigFile(null);
    setSigPreview(null);
    if (sigInputRef.current) {
      sigInputRef.current.value = '';
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

        {/* Tanda Tangan Section (Hanya untuk Pegawai/Guru) */}
        {employeeId && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <PenTool size={24} strokeWidth={2.5} />
              </div>
              <h2 className="settings-card-title">Tanda Tangan Digital</h2>
            </div>
            <div className="settings-form">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Unggah tanda tangan digital Anda untuk pengesahan dokumen otomatis (seperti Rapor Siswa). Pastikan gambar (PNG/JPG) memiliki latar belakang transparan.
              </p>
              
              {sigMessage && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.875rem', 
                  marginBottom: '1.5rem',
                  backgroundColor: sigMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: sigMessage.type === 'success' ? '#059669' : '#b91c1c',
                  border: `1px solid ${sigMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                }}>
                  {sigMessage.text}
                </div>
              )}

              <div className="input-group">
                <label style={{ textAlign: 'left', display: 'block', width: '100%' }}>Pilih File</label>
                <input 
                  type="file" 
                  ref={sigInputRef}
                  accept=".png, .jpg, .jpeg"
                  onChange={handleSigChange}
                  style={{
                    display: 'block', width: '100%', fontSize: '0.875rem', color: '#64748b',
                    padding: '0.5rem 0', cursor: 'pointer'
                  }}
                />
              </div>

              {sigPreview && (
                <div className="input-group">
                  <label style={{ textAlign: 'left', display: 'block', width: '100%' }}>Pratinjau</label>
                  <div style={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '120px'
                  }}>
                    <img 
                      src={sigPreview} 
                      alt="Signature Preview" 
                      style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={handleSigUpload}
                  disabled={!sigFile || isUploadingSig}
                  className="btn-save btn-primary-gradient"
                  style={{ flex: 1, opacity: (!sigFile || isUploadingSig) ? 0.6 : 1 }}
                >
                  <Save size={18} /> {isUploadingSig ? 'Menyimpan...' : 'Simpan'}
                </button>
                
                <button
                  onClick={handleSigClear}
                  disabled={!sigFile}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: sigFile ? 'pointer' : 'not-allowed',
                    opacity: sigFile ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tanda Tangan Kepala Sekolah Section */}
        {isPrincipal && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <PenTool size={24} strokeWidth={2.5} />
              </div>
              <h2 className="settings-card-title">Tanda Tangan Kepala Sekolah</h2>
            </div>
            <div className="settings-form">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Unggah tanda tangan resmi Kepala Sekolah untuk pengesahan Rapor Siswa. Pastikan gambar (PNG/JPG) memiliki latar belakang transparan.
              </p>
              
              <div className="input-group">
                <label style={{ textAlign: 'left', display: 'block', width: '100%' }}>File Tanda Tangan Saat Ini</label>
                <div style={{
                  border: '2px dashed #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '120px',
                  position: 'relative'
                }}>
                  {schoolProfile?.principalSignatureUrl ? (
                    <img 
                      src={`http://localhost:3000${schoolProfile.principalSignatureUrl}`}
                      alt="Signature Preview" 
                      style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Belum ada tanda tangan</span>
                  )}
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label style={{ textAlign: 'left', display: 'block', width: '100%' }}>Unggah Baru</label>
                <input 
                  type="file" 
                  ref={principalSigInputRef}
                  accept=".png, .jpg, .jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploadingPrincipalSig(true);
                      const { uploadSchoolSignature } = await import('../../api/schoolProfileService');
                      const res = await uploadSchoolSignature(file);
                      if (res && res.principalSignatureUrl) {
                        setSchoolProfile((prev: any) => ({ ...prev, principalSignatureUrl: res.principalSignatureUrl }));
                        setProfileSuccess(true); // Reusing success toast
                        setTimeout(() => setProfileSuccess(false), 3000);
                      }
                    } catch (err: any) {
                      setError(err.response?.data?.message || 'Gagal mengunggah tanda tangan');
                    } finally {
                      setIsUploadingPrincipalSig(false);
                      if (principalSigInputRef.current) {
                        principalSigInputRef.current.value = '';
                      }
                    }
                  }}
                  style={{
                    display: 'block', width: '100%', fontSize: '0.875rem', color: '#64748b',
                    padding: '0.5rem 0', cursor: 'pointer'
                  }}
                />
                {isUploadingPrincipalSig && <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>Sedang mengunggah...</span>}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
