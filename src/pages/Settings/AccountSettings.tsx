import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Key, Save, Eye, EyeOff, PenTool, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import { uploadSignature } from '../../api/employeeService';
import { PageHeader } from '../../components/ui/PageHeader';
import { FormField } from '../../components/ui/FormField';

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
    <div className="p-6 max-w-4xl mx-auto page-enter">
      
      {/* Premium Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1">
          <PageHeader 
            title="Pengaturan Akun" 
            subtitle="Personalisasikan profil Anda dan tingkatkan keamanan akun dengan mudah."
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profil Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <User size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 m-0">Informasi Profil</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-8 flex flex-col gap-6 h-full">
            
            <FormField label="Nama Lengkap" required>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                required
              />
            </FormField>

            <FormField label="Username" required>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white"
                value={profileForm.username}
                onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                required
              />
            </FormField>

            <div className="flex flex-col gap-3 mt-auto">
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-md transition-all mt-2">
                <Save size={18} /> Simpan Profil
              </button>
              {profileSuccess && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 py-2.5 rounded-xl animate-in fade-in border border-emerald-100">
                  <CheckCircle size={18} /> Profil berhasil diperbarui!
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Keamanan Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
              <Key size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 m-0">Keamanan Sandi</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-8 flex flex-col gap-6">
            
            <FormField label="Password Baru" required>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white pr-12"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>

            <FormField label="Konfirmasi Password" required>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all focus:bg-white pr-12"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Ketik ulang password baru"
                  minLength={6}
                  required
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>

            <div className="flex flex-col gap-3 mt-auto">
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold rounded-xl hover:from-black hover:to-gray-800 shadow-md transition-all mt-2">
                <Save size={18} /> Update Sandi
              </button>
              {passwordSuccess && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 py-2.5 rounded-xl animate-in fade-in border border-emerald-100">
                  <CheckCircle size={18} /> Sandi berhasil diperbarui!
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Tanda Tangan Section (Hanya untuk Pegawai/Guru) */}
        {employeeId && (
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <PenTool size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 m-0">Tanda Tangan Digital</h2>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                Unggah tanda tangan digital Anda untuk pengesahan dokumen otomatis (seperti Rapor Siswa). Pastikan gambar (PNG/JPG) memiliki latar belakang transparan.
              </p>
              
              {sigMessage && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${sigMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {sigMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {sigMessage.text}
                </div>
              )}

              <FormField label="Pilih File Gambar (PNG/JPG)">
                <input 
                  type="file" 
                  ref={sigInputRef}
                  accept=".png, .jpg, .jpeg"
                  onChange={handleSigChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors cursor-pointer"
                />
              </FormField>

              {sigPreview && (
                <FormField label="Pratinjau">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 flex justify-center items-center min-h-[160px]">
                    <img 
                      src={sigPreview} 
                      alt="Signature Preview" 
                      className="max-h-[150px] max-w-full object-contain drop-shadow-sm" 
                    />
                  </div>
                </FormField>
              )}

              <div className="flex gap-4 mt-2">
                <button
                  onClick={handleSigUpload}
                  disabled={!sigFile || isUploadingSig}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} /> {isUploadingSig ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                </button>
                
                <button
                  onClick={handleSigClear}
                  disabled={!sigFile}
                  className="px-6 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tanda Tangan Kepala Sekolah Section */}
        {isPrincipal && (
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <PenTool size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 m-0">Tanda Tangan Kepala Sekolah</h2>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                Unggah tanda tangan resmi Kepala Sekolah untuk pengesahan Rapor Siswa. Pastikan gambar (PNG/JPG) memiliki latar belakang transparan.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="File Tanda Tangan Saat Ini">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 flex justify-center items-center min-h-[160px] relative">
                    {schoolProfile?.principalSignatureUrl ? (
                      <img 
                        src={`http://localhost:3000${schoolProfile.principalSignatureUrl}`}
                        alt="Signature Preview" 
                        className="max-h-[150px] max-w-full object-contain drop-shadow-sm" 
                      />
                    ) : (
                      <span className="text-gray-400 text-sm font-medium flex items-center gap-2">
                        <AlertCircle size={16} /> Belum ada tanda tangan
                      </span>
                    )}
                  </div>
                </FormField>

                <FormField label="Unggah Baru">
                  <div className="flex flex-col gap-3">
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
                            setProfileSuccess(true);
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
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                    />
                    {isUploadingPrincipalSig && (
                      <span className="text-sm font-medium text-blue-600 animate-pulse flex items-center gap-2">
                        Sedang mengunggah...
                      </span>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
