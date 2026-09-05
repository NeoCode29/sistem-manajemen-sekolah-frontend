import React, { useRef, useState, useEffect } from 'react';
import { Save, Building2, UploadCloud, MapPin, Phone, Download, FileText } from 'lucide-react';
import { PageHeader, FormField } from '../../components/ui';
import { useSchoolProfile } from '../../hooks/useSchoolProfile';

export const SchoolProfilePage: React.FC = () => {
  const {
    profile, setProfile, loading, saving, downloading, error, success,
    updateProfile, uploadLogo, downloadTemplate
  } = useSchoolProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Sync logo preview whenever profile.logoUrl changes
  useEffect(() => {
    if (profile.logoUrl) {
      setLogoPreview(`http://localhost:3000${profile.logoUrl}`);
    }
  }, [profile.logoUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadLogo(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { logoUrl, id, createdAt, updatedAt, principalSignatureUrl, ...payload } = profile as any;
    await updateProfile(payload);
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
        <div className="text-red-500 mt-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-red-800">Gagal menyimpan profil</h4>
          <div className="text-sm text-red-700 mt-1">
            {Array.isArray(error) ? (
              <ul className="list-disc pl-4 space-y-1">
                {error.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            ) : (
              <p>{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Profil Sekolah"
        subtitle="Kelola informasi dan identitas utama sekolah"
      />

      {renderError()}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <div className="text-emerald-500 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-800">Berhasil</h4>
            <p className="text-sm text-emerald-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-r from-blue-700 to-indigo-600 w-full relative">
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">Memuat profil sekolah...</div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8 relative">
            
            {/* Header Profil (Logo & Action) */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8 relative z-10">
              {/* Logo */}
              <div className="relative group w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden shrink-0 transition-transform hover:scale-105">
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={48} className="text-gray-300" />
                )}
                <div 
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="text-white" size={32} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleFileChange} 
                />
              </div>

              {/* Title */}
              <div className="flex-1 pb-2 md:pt-20">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name || 'Nama Sekolah'}</h2>
                <p className="text-gray-500 mt-1 font-medium">NPSN: {profile.code || '-'}</p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pb-2 w-full md:w-auto md:pt-20">
                <button type="submit" className="btn-std-primary flex-1 md:flex-none justify-center" disabled={saving}>
                  <Save size={18} />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>

            {/* Form Sections */}
            <div className="flex flex-col gap-8">
              
              {/* Identitas Utama */}
              <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200/60">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Identitas Utama</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Informasi dasar mengenai institusi pendidikan</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Nama Sekolah" required>
                    <input type="text" className="input-std" name="name" value={profile.name || ''} onChange={handleChange} required placeholder="Contoh: SMA Negeri 1 Jakarta" />
                  </FormField>
                  <FormField label="NPSN">
                    <input type="text" className="input-std" name="code" value={profile.code || ''} onChange={handleChange} placeholder="Nomor Pokok Sekolah Nasional" />
                  </FormField>
                  <FormField label="Nama Kepala Sekolah">
                    <input type="text" className="input-std" name="principalName" value={profile.principalName || ''} onChange={handleChange} placeholder="Nama lengkap beserta gelar" />
                  </FormField>
                  <FormField label="NIP Kepala Sekolah">
                    <input type="text" className="input-std" name="principalNip" value={profile.principalNip || ''} onChange={handleChange} placeholder="NIP (jika ada)" />
                  </FormField>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kontak & Digital */}
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200/60">
                    <div className="p-2.5 bg-green-100 text-green-700 rounded-lg">
                      <Phone size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Kontak & Digital</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Saluran komunikasi resmi sekolah</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-5">
                    <FormField label="Nomor Telepon">
                      <input type="text" className="input-std" name="phone" value={profile.phone || ''} onChange={handleChange} placeholder="(021) XXXXXXX" />
                    </FormField>
                    <FormField label="Email Resmi">
                      <input type="email" className="input-std" name="email" value={profile.email || ''} onChange={handleChange} placeholder="info@sekolah.sch.id" />
                    </FormField>
                    <FormField label="Website">
                      <input type="url" className="input-std" name="website" value={profile.website || ''} onChange={handleChange} placeholder="https://www.sekolah.sch.id" />
                    </FormField>
                  </div>
                </div>

                {/* Alamat & Lokasi */}
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200/60">
                    <div className="p-2.5 bg-orange-100 text-orange-700 rounded-lg">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Alamat & Lokasi</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Titik lokasi fisik institusi</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-5 flex-1">
                    <FormField label="Kota / Kabupaten" required hint="Digunakan untuk lokasi penandatanganan">
                      <input type="text" className="input-std" name="city" value={profile.city || ''} onChange={handleChange} required placeholder="Contoh: Tasikmalaya" />
                    </FormField>
                    <div className="flex-1 flex flex-col">
                      <FormField label="Alamat Lengkap">
                        <textarea className="input-std flex-1 resize-none min-h-[120px]" name="address" value={profile.address || ''} onChange={handleChange} placeholder="Masukkan alamat lengkap sekolah, termasuk jalan, RT/RW, dan kode pos..."></textarea>
                      </FormField>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
};
