import React, { useEffect, useState, useRef } from 'react';
import { getFoundationProfile, updateFoundationProfile, uploadFoundationLogo } from '../../api/schoolProfileService';
import type { FoundationProfile } from '../../api/schoolProfileService';
import { Save, Landmark, UploadCloud, MapPin, Phone } from 'lucide-react';
import '../Academic/Academic.css';
import './SchoolProfile.css';

export const FoundationProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profile, setProfile] = useState<Partial<FoundationProfile>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getFoundationProfile();
      if (data) {
        setProfile(data);
        if (data.logoUrl) {
          setLogoPreview(`http://localhost:3000${data.logoUrl}`);
        }
      }
      setError('');
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Gagal memuat profil yayasan');
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
      const response = await uploadFoundationLogo(file);
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
      await updateFoundationProfile(payload);
      setSuccess('Profil yayasan berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profil Yayasan</h1>
          <p className="page-subtitle">Kelola informasi yayasan yang menaungi sekolah</p>
        </div>
      </div>

      {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      {success && <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">{success}</div>}

      <div className="glass-panel overflow-hidden">
        {/* Banner */}
        <div className="profile-banner premium-banner-emerald">
          <div className="texture"></div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat profil yayasan...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header Flex */}
            <div className="profile-header-container">
              <div className="profile-header-flex">
                {/* Logo */}
                <div className="profile-avatar-wrapper premium-avatar group">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Foundation Logo" className="avatar-img" />
                  ) : (
                    <div className="avatar-empty">
                      <Landmark size={48} className="opacity-20" />
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
                  <h2 className="profile-title">{profile.name || 'Nama Yayasan'}</h2>
                  <p className="profile-subtitle emerald">Profil Yayasan Utama</p>
                </div>
                
                {/* Action button in header */}
                <div className="profile-actions">
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
                  <div className="flex items-center gap-4 mb-8 pb-5 border-b border-green-200/60">
                    <div className="premium-icon-box p-3 bg-green-100 text-green-600 rounded-xl shadow-sm">
                      <Landmark size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 tracking-tight">Identitas Yayasan</h3>
                      <p className="text-sm text-gray-500 mt-1">Informasi dasar mengenai yayasan penaung</p>
                    </div>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Nama Yayasan <span className="text-red-500">*</span></label>
                      <input type="text" className="input-field premium-input max-w-2xl" name="name" value={profile.name || ''} onChange={handleChange} required placeholder="Contoh: Yayasan Pendidikan Indonesia" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Kontak & Digital */}
                  <div className="premium-glass-card p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 pb-5 border-b border-blue-200/60">
                      <div className="premium-icon-box p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 tracking-tight">Kontak & Digital</h3>
                        <p className="text-sm text-gray-500 mt-1">Saluran komunikasi resmi yayasan</p>
                      </div>
                    </div>
                    
                    <div className="form-grid gap-6">
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Nomor Telepon</label>
                        <input type="text" className="input-field premium-input" name="phone" value={profile.phone || ''} onChange={handleChange} placeholder="(021) XXXXXXX" />
                      </div>
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Email Resmi</label>
                        <input type="email" className="input-field premium-input" name="email" value={profile.email || ''} onChange={handleChange} placeholder="info@yayasan.org" />
                      </div>
                      <div className="form-group">
                        <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-1">Website</label>
                        <input type="url" className="input-field premium-input" name="website" value={profile.website || ''} onChange={handleChange} placeholder="https://www.yayasan.org" />
                      </div>
                    </div>
                  </div>

                  {/* Alamat & Lokasi */}
                  <div className="premium-glass-card p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 pb-5 border-b border-orange-200/60">
                      <div className="premium-icon-box p-3 bg-orange-100 text-orange-600 rounded-xl shadow-sm">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800 tracking-tight">Alamat & Lokasi</h3>
                        <p className="text-sm text-gray-500 mt-1">Titik lokasi fisik yayasan</p>
                      </div>
                    </div>
                    
                    <div className="form-group h-full flex flex-col pt-1">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-3">Alamat Lengkap</label>
                      <textarea className="input-field premium-input flex-1 resize-none" style={{ minHeight: '180px' }} name="address" value={profile.address || ''} onChange={handleChange} placeholder="Masukkan alamat lengkap yayasan di sini..."></textarea>
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
