import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  PenTool, 
  ShieldCheck, 
  UploadCloud, 
  Trash2, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import api from '../../api/axios';
import { uploadSignature } from '../../api/employeeService';
import { PageHeader } from '../../components/ui/PageHeader';
import { FormField } from '../../components/ui/FormField';
import { notify } from '../../utils/feedback';

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

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Signature States
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [currentSigUrl, setCurrentSigUrl] = useState<string | null>(null);
  const [isUploadingSig, setIsUploadingSig] = useState(false);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const employeeId = user?.employeeId;
  const isPrincipal = user?.roles?.some(r => r.name === 'Kepala Sekolah');

  useEffect(() => {
    if (isPrincipal) {
      import('../../api/schoolProfileService').then(({ getSchoolProfile }) => {
        getSchoolProfile().then(data => {
          if (data?.principalSignatureUrl) {
            setCurrentSigUrl(data.principalSignatureUrl);
          }
        }).catch(err => console.error(err));
      });
    } else if (employeeId) {
      api.get(`/employees/${employeeId}`).then(res => {
        const emp = res.data?.data || res.data;
        if (emp?.signatureUrl) {
          setCurrentSigUrl(emp.signatureUrl);
        }
      }).catch(err => {
        console.warn('Could not fetch employee signature', err);
      });
    }
  }, [isPrincipal, employeeId]);

  // Show/hide password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await api.put(`/users/${user?.id}`, profileForm);
      notify.success('Informasi profil berhasil diperbarui!');
    } catch (err: any) {
      notify.error(err, 'Gagal memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify.error(new Error('Konfirmasi kata sandi baru tidak cocok'), 'Validasi Sandi Gagal');
      return;
    }
    
    try {
      setIsSavingPassword(true);
      await api.put(`/users/${user?.id}`, { password: passwordForm.newPassword });
      notify.success('Kata sandi akun berhasil diubah!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      notify.error(err, 'Gagal mengubah kata sandi');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setSigFile(selectedFile);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setSigPreview(objectUrl);
    }
  };

  const handleSigUpload = async () => {
    if (!sigFile) return;

    setIsUploadingSig(true);
    try {
      if (isPrincipal) {
        // 1. Upload ke Profil Sekolah (untuk pengesahan resmi Rapor & dokumen institusi)
        const { uploadSchoolSignature } = await import('../../api/schoolProfileService');
        const res = await uploadSchoolSignature(sigFile);
        if (res && res.principalSignatureUrl) {
          setCurrentSigUrl(res.principalSignatureUrl);
        }

        // 2. Otomatis sinkronkan ke profil pegawai jika akun terhubung dengan data pegawai
        if (employeeId) {
          try {
            await uploadSignature(employeeId.toString(), sigFile);
          } catch (syncErr) {
            console.warn('Sync to employee signature failed', syncErr);
          }
        }
        notify.success('Tanda tangan resmi Kepala Sekolah berhasil disimpan dan disinkronkan!');
      } else if (employeeId) {
        const res = await uploadSignature(employeeId.toString(), sigFile);
        if (res && res.signatureUrl) {
          setCurrentSigUrl(res.signatureUrl);
        }
        notify.success('Tanda tangan digital berhasil disimpan!');
      }

      setSigFile(null);
      setSigPreview(null);
      if (sigInputRef.current) {
        sigInputRef.current.value = '';
      }
    } catch (error: any) {
      notify.error(error, 'Gagal mengunggah tanda tangan digital');
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
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. PageHeader */}
      <PageHeader 
        title="Pengaturan Akun" 
        subtitle="Personalisasikan profil Anda dan tingkatkan keamanan akun dengan mudah"
      />

      {/* 2. Form Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Card 1: Profil Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Informasi Profil</h2>
              <p className="text-xs text-slate-500 mt-0.5">Nama tampilan dan username login</p>
            </div>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="p-6 flex flex-col gap-5 flex-1">
            <FormField label="Nama Lengkap" required>
              <input 
                type="text" 
                className="input-std w-full px-4 py-2.5 text-sm font-semibold text-slate-900"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Username Login" required>
              <input 
                type="text" 
                className="input-std w-full px-4 py-2.5 text-sm font-mono text-slate-900"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                required
              />
            </FormField>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm transition-all"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Keamanan Sandi */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Keamanan Sandi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Perbarui kata sandi akun secara berkala</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-6 flex flex-col gap-5 flex-1">
            <FormField label="Password Baru" required>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="input-std w-full px-4 py-2.5 pr-11 text-sm text-slate-900"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" 
                  onClick={() => setShowNewPassword(v => !v)} 
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="Konfirmasi Password Baru" required>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-std w-full px-4 py-2.5 pr-11 text-sm text-slate-900"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Ulangi password baru"
                  minLength={6}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" 
                  onClick={() => setShowConfirmPassword(v => !v)} 
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm transition-all"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                <span>{isSavingPassword ? 'Memproses...' : 'Ubah Kata Sandi'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 3: Tanda Tangan Digital Resmi */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <PenTool size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Tanda Tangan Digital</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pengesahan resmi e-Rapor & dokumen</p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5 flex-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              {isPrincipal 
                ? 'Tanda tangan resmi Kepala Sekolah digunakan pada halaman pengesahan Rapor siswa dan dokumen dinas lainnya.' 
                : 'Tanda tangan digital digunakan pada dokumen cetak absensi dan catatan dinas Anda.'}
            </p>

            {/* Preview Box */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center min-h-[140px] text-center relative overflow-hidden">
              {sigPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Pratinjau Baru</span>
                  <img src={sigPreview} alt="Pratinjau TTD" className="max-h-24 max-w-full object-contain" />
                </div>
              ) : currentSigUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">TTD Tersimpan Aktif</span>
                  <img src={`http://localhost:3000${currentSigUrl}`} alt="Tanda Tangan Aktif" className="max-h-24 max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <PenTool size={28} className="text-slate-300" />
                  <p className="text-xs font-medium">Belum ada tanda tangan digital</p>
                  <p className="text-[10px] text-slate-400">Format PNG transparan disarankan (Maks 1MB)</p>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={sigInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleSigChange} 
            />

            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
              {!sigFile ? (
                <button 
                  type="button" 
                  onClick={() => sigInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-semibold rounded-xl transition-all border border-slate-200 shadow-xs"
                >
                  <UploadCloud size={16} />
                  <span>{currentSigUrl ? 'Ganti Tanda Tangan' : 'Unggah File TTD'}</span>
                </button>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={handleSigUpload}
                    disabled={isUploadingSig}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm transition-all"
                  >
                    {isUploadingSig ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    <span>{isUploadingSig ? 'Menyimpan...' : 'Simpan TTD'}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSigClear}
                    disabled={isUploadingSig}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors border border-rose-200"
                    title="Batal pilih file"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
