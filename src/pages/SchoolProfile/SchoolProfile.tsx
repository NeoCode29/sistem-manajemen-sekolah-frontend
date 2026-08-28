import React, { useEffect, useState, useRef } from 'react';
import { getSchoolProfile, updateSchoolProfile, uploadSchoolLogo, downloadTemplateDocx } from '../../api/schoolProfileService';
import type { SchoolProfile } from '../../api/schoolProfileService';
import { Save, Building2, UploadCloud, MapPin, Phone, Download, FileText } from 'lucide-react';
import '../Academic/Academic.css';
import './SchoolProfile.css';

export const SchoolProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profile, setProfile] = useState<Partial<SchoolProfile>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getSchoolProfile();
      if (data) {
        setProfile(data);
        if (data.logoUrl) {
          setLogoPreview(`http://localhost:3000${data.logoUrl}`);
        }
      }
      setError('');
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Gagal memuat profil sekolah');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const response = await uploadSchoolLogo(file);
      if (response && response.logoUrl) {
        setProfile(prev => ({ ...prev, logoUrl: response.logoUrl }));
        setLogoPreview(`http://localhost:3000${response.logoUrl}`);
        setSuccess('Logo berhasil diunggah!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengunggah logo');
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { logoUrl, id, createdAt, updatedAt, ...payload } = profile as any;
      await updateSchoolProfile(payload);
      setSuccess('Profil sekolah berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const data = await downloadTemplateDocx();
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Template_Kop_Surat_${profile.name?.replace(/\s+/g, '_') || 'Sekolah'}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Template berhasil diunduh!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Gagal mengunduh template docx');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profil Sekolah</h1>
          <p className="page-subtitle">Kelola informasi dan identitas utama sekolah</p>
        </div>
      </div>

      {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      {success && <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">{success}</div>}

      <div className="glass-panel overflow-hidden">
        {/* Banner */}
        <div className="profile-banner premium-banner">
          <div className="texture"></div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat profil sekolah...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header Flex */}
            <div className="profile-header-container">
              <div className="profile-header-flex">
                {/* Logo */}
                <div className="profile-avatar-wrapper premium-avatar group">
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="avatar-img" />
                  ) : (
                    <div className="avatar-empty">
                      <Building2 size={48} className="opacity-20" />
                    </div>
                  )}
                  <div className="avatar-overlay" onClick={() => fileInputRef.current?.click()}>
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

                {/* Title & Info */}
                <div className="flex-1">
                  <h2 className="profile-title">{profile.name || 'Nama Sekolah'}</h2>
                  <p className="profile-subtitle">NPSN: {profile.code || '-'}</p>
                </div>
                
                {/* Action button in header */}
                <div className="profile-actions flex gap-3">
                  <button type="button" onClick={handleDownloadTemplate} className="btn-secondary" disabled={downloading}>
                    <Download size={18} />
                    {downloading ? 'Mengunduh...' : 'Download Kop Surat'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save size={18} />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>

              {/* Form Sections */}
              <div className="flex flex-col gap-6 p-6">
                
                {/* Identitas Utama */}
                <div className="premium-glass-card p-6 relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 pb-5 border-b border-blue-200/60">
                    <div className="premium-icon-box p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 tracking-tight">Identitas Utama</h3>
                      <p className="text-sm text-gray-500 mt-1">Informasi dasar mengenai institusi pendidikan</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="form-group">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Nama Sekolah <span className="text-red-500">*</span></label>
                      <input type="text" className="input-field premium-input" name="name" value={profile.name || ''} onChange={handleChange} required placeholder="Contoh: SMA Negeri 1 Jakarta" />
                    </div>
                    <div className="form-group">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">NPSN</label>
                      <input type="text" className="input-field premium-input" name="code" value={profile.code || ''} onChange={handleChange} required placeholder="Nomor Pokok Sekolah Nasional" />
                    </div>
                    <div className="form-group">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Nama Kepala Sekolah</label>
                      <input type="text" className="input-field premium-input" name="principalName" value={profile.principalName || ''} onChange={handleChange} placeholder="Nama lengkap beserta gelar" />
                    </div>
                    <div className="form-group">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">NIP Kepala Sekolah</label>
                      <input type="text" className="input-field premium-input" name="principalNip" value={profile.principalNip || ''} onChange={handleChange} placeholder="NIP (jika ada)" />
                    </div>
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Kontak & Digital */}
                  <div className="premium-glass-card p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 pb-5 border-b border-green-200/60">
                      <div className="premium-icon-box p-3 bg-green-100 text-green-600 rounded-xl shadow-sm">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 tracking-tight">Kontak & Digital</h3>
                        <p className="text-sm text-gray-500 mt-1">Saluran komunikasi resmi sekolah</p>
                      </div>
                    </div>
                    
                    <div className="form-grid gap-6">
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Nomor Telepon</label>
                        <input type="text" className="input-field premium-input" name="phone" value={profile.phone || ''} onChange={handleChange} placeholder="(021) XXXXXXX" />
                      </div>
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Email Resmi</label>
                        <input type="email" className="input-field premium-input" name="email" value={profile.email || ''} onChange={handleChange} placeholder="info@sekolah.sch.id" />
                      </div>
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Website</label>
                        <input type="url" className="input-field premium-input" name="website" value={profile.website || ''} onChange={handleChange} placeholder="https://www.sekolah.sch.id" />
                      </div>
                    </div>
                  </div>

                  {/* Alamat & Lokasi */}
                  <div className="premium-glass-card p-6 relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4 mb-8 pb-5 border-b border-orange-200/60">
                      <div className="premium-icon-box p-3 bg-orange-100 text-orange-600 rounded-xl shadow-sm">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 tracking-tight">Alamat & Lokasi</h3>
                        <p className="text-sm text-gray-500 mt-1">Titik lokasi fisik institusi</p>
                      </div>
                    </div>
                    
                    <div className="form-grid gap-6 flex-1 flex flex-col">
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Kota / Kabupaten <span className="text-red-500">*</span></label>
                        <input type="text" className="input-field premium-input" name="city" value={profile.city || ''} onChange={handleChange} required placeholder="Contoh: Tasikmalaya" />
                        <p className="text-xs text-gray-500 mt-1">Digunakan untuk lokasi tanggal tanda tangan (misal: Tasikmalaya, 27 Agustus 2026)</p>
                      </div>
                      <div className="form-group h-full flex flex-col pt-1">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Alamat Lengkap</label>
                        <textarea className="input-field premium-input flex-1 resize-none" style={{ minHeight: '110px' }} name="address" value={profile.address || ''} onChange={handleChange} placeholder="Masukkan alamat lengkap sekolah, termasuk jalan, RT/RW, dan kode pos di sini..."></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kop Surat & Cetakan */}
                <div className="premium-glass-card p-6 relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 pb-5 border-b border-purple-200/60">
                    <div className="premium-icon-box p-3 bg-purple-100 text-purple-600 rounded-xl shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 tracking-tight">Kop Surat & Cetakan</h3>
                      <p className="text-sm text-gray-500 mt-1">Pengaturan teks untuk cetakan rapor dan surat resmi</p>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-2">Teks Header Kop Surat</label>
                    <textarea className="input-field premium-input resize-none w-full" style={{ minHeight: '120px' }} name="headerText" value={profile.headerText || ''} onChange={handleChange} placeholder={"PEMERINTAH KABUPATEN TASIKMALAYA\nDINAS PENDIDIKAN\nYAYASAN BINA UMMAT AL-QOMARIYAH\nSMK YASBU AL-QOMARIYAH"}></textarea>
                    <p className="text-xs text-gray-500 mt-2">Masukkan setiap baris dengan menekan Enter. Teks ini akan otomatis dicetak rata tengah (center) pada bagian atas PDF Rapor. Kosongkan jika ingin menggunakan bawaan sistem.</p>
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
