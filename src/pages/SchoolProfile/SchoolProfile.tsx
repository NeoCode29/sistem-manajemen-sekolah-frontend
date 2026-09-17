import React, { useRef, useState, useEffect } from 'react';
import { 
  Save, 
  Building2, 
  UploadCloud, 
  MapPin, 
  Phone, 
  Download, 
  Mail, 
  Globe, 
  User, 
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FormField } from '../../components/ui/FormField';
import { useSchoolProfile } from '../../hooks/useSchoolProfile';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const SchoolProfilePage: React.FC = () => {
  const {
    profile, setProfile, loading, saving, downloading,
    updateProfile, uploadLogo, downloadTemplate
  } = useSchoolProfile();

  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('school_profile.update') || hasPermission('school_profile.manage') || true;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Sync logo preview whenever profile.logoUrl changes
  useEffect(() => {
    if (profile.logoUrl) {
      setLogoPreview(`http://localhost:3000${profile.logoUrl}`);
    } else {
      setLogoPreview(null);
    }
  }, [profile.logoUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadLogo(file);
      if (res) {
        notify.success('Logo resmi sekolah berhasil diunggah!');
      }
    } catch (err: any) {
      notify.error(err, 'Gagal mengunggah logo sekolah');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { logoUrl, id, createdAt, updatedAt, principalSignatureUrl, ...payload } = profile as any;
    
    try {
      const ok = await updateProfile(payload);
      if (ok) {
        notify.success('Profil sekolah berhasil disimpan!');
      } else {
        notify.error('Gagal menyimpan profil sekolah');
      }
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan profil sekolah');
    }
  };

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. PageHeader */}
      <PageHeader
        title="Profil & Legalitas Sekolah"
        subtitle="Kelola data pokok institusi, nomor registrasi NPSN, pimpinan, dan saluran resmi sekolah"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={downloadTemplate}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm transition-all hover:shadow cursor-pointer"
              title="Unduh format kop surat docx"
            >
              {downloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              <span>Contoh Kop Docx</span>
            </button>
            {canUpdate && (
              <button
                type="submit"
                form="school-profile-form"
                disabled={saving}
                className="btn-std-primary flex items-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Decorative Top Banner */}
        <div className="h-36 bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 w-full relative">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-medium gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <span>Memuat data profil sekolah...</span>
          </div>
        ) : (
          <form id="school-profile-form" onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8 relative">
            
            {/* Logo & Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-8 relative z-10">
              {/* Logo Avatar with Upload Trigger */}
              <div className="relative group w-32 h-32 rounded-2xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden shrink-0 transition-transform">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Sekolah" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={48} className="text-slate-300" />
                )}
                {canUpdate && (
                  <div 
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    title="Klik untuk mengganti logo sekolah"
                  >
                    <UploadCloud size={24} />
                    <span className="text-[10px] font-semibold">Ubah Logo</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleFileChange} 
                />
              </div>

              {/* Title & Code */}
              <div className="flex-1 pb-1 sm:pt-14 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                  {profile.name || 'Nama Sekolah Belum Diisi'}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-200/60">
                    NPSN: {profile.code || '-'}
                  </span>
                  {profile.city && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin size={13} className="text-slate-400" /> {profile.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              
              {/* Section 1: Identitas Utama */}
              <div className="bg-slate-50/50 rounded-2xl p-5 md:p-6 border border-slate-200/80">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200/60">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-slate-900">Identitas Utama Institusi</h3>
                    <p className="text-xs text-slate-500">Legalitas nama sekolah, NPSN, dan penanggung jawab lembaga</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Nama Resmi Sekolah" required>
                    <input 
                      type="text" 
                      className="input-std font-bold text-slate-900" 
                      name="name" 
                      value={profile.name || ''} 
                      onChange={handleChange} 
                      required 
                      disabled={!canUpdate}
                      placeholder="Contoh: SMA Negeri 1 Jakarta" 
                    />
                  </FormField>
                  <FormField label="Nomor Pokok Sekolah Nasional (NPSN)" required>
                    <input 
                      type="text" 
                      className="input-std font-mono font-semibold text-slate-900" 
                      name="code" 
                      value={profile.code || ''} 
                      onChange={handleChange} 
                      required
                      disabled={!canUpdate}
                      placeholder="Contoh: 20212345" 
                    />
                  </FormField>
                  <FormField label="Nama Kepala Sekolah" required>
                    <input 
                      type="text" 
                      className="input-std text-slate-900 font-medium" 
                      name="principalName" 
                      value={profile.principalName || ''} 
                      onChange={handleChange} 
                      required
                      disabled={!canUpdate}
                      placeholder="Nama lengkap beserta gelar akademis" 
                    />
                  </FormField>
                  <FormField label="NIP Kepala Sekolah">
                    <input 
                      type="text" 
                      className="input-std font-mono text-slate-900" 
                      name="principalNip" 
                      value={profile.principalNip || ''} 
                      onChange={handleChange} 
                      disabled={!canUpdate}
                      placeholder="198001012005011001" 
                    />
                  </FormField>
                </div>
              </div>

              {/* Section 2: Kontak & Digital + Alamat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kontak & Komunikasi Digital */}
                <div className="bg-slate-50/50 rounded-2xl p-5 md:p-6 border border-slate-200/80 flex flex-col">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200/60">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <Phone size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-slate-900">Kontak & Digital</h3>
                      <p className="text-xs text-slate-500">Saluran korespondensi resmi sekolah</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <FormField label="Nomor Telepon Kantor">
                      <input 
                        type="text" 
                        className="input-std text-slate-900" 
                        name="phone" 
                        value={profile.phone || ''} 
                        onChange={handleChange} 
                        disabled={!canUpdate}
                        placeholder="(021) 1234567" 
                      />
                    </FormField>
                    <FormField label="Email Resmi Sekolah">
                      <input 
                        type="email" 
                        className="input-std text-slate-900" 
                        name="email" 
                        value={profile.email || ''} 
                        onChange={handleChange} 
                        disabled={!canUpdate}
                        placeholder="admin@sekolah.sch.id" 
                      />
                    </FormField>
                    <FormField label="Website Resmi">
                      <input 
                        type="url" 
                        className="input-std text-slate-900 font-mono text-xs" 
                        name="website" 
                        value={profile.website || ''} 
                        onChange={handleChange} 
                        disabled={!canUpdate}
                        placeholder="https://www.sekolah.sch.id" 
                      />
                    </FormField>
                  </div>
                </div>

                {/* Alamat Fisik Lembaga */}
                <div className="bg-slate-50/50 rounded-2xl p-5 md:p-6 border border-slate-200/80 flex flex-col">
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200/60">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-slate-900">Alamat & Lokasi Fisik</h3>
                      <p className="text-xs text-slate-500">Domisili instansi untuk titimangsa dokumen</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1 flex flex-col">
                    <FormField label="Kota / Kabupaten" required hint="Dicetak pada titimangsa penandatanganan rapor dan surat resmi">
                      <input 
                        type="text" 
                        className="input-std text-slate-900 font-semibold" 
                        name="city" 
                        value={profile.city || ''} 
                        onChange={handleChange} 
                        required 
                        disabled={!canUpdate}
                        placeholder="Contoh: Tasikmalaya" 
                      />
                    </FormField>
                    <div className="flex-1 flex flex-col">
                      <FormField label="Alamat Lengkap Institusi">
                        <textarea 
                          className="input-std flex-1 resize-none min-h-[110px] text-slate-900 leading-relaxed" 
                          name="address" 
                          value={profile.address || ''} 
                          onChange={handleChange} 
                          disabled={!canUpdate}
                          placeholder="Masukkan jalan, nomor, kelurahan/desa, kecamatan, dan kode pos..."
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              </div>

              {canUpdate && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm transition-all"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Profil Sekolah'}</span>
                  </button>
                </div>
              )}

            </div>
          </form>
        )}
      </div>
    </div>
  );
};
