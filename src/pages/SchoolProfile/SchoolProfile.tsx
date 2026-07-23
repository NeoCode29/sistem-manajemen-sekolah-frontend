import React, { useEffect, useState, useRef } from 'react';
import { getSchoolProfile, updateSchoolProfile, uploadSchoolLogo } from '../../api/schoolProfileService';
import type { SchoolProfile } from '../../api/schoolProfileService';
import { Save, Building2, UploadCloud } from 'lucide-react';
import '../Academic/Academic.css';

export const SchoolProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      await updateSchoolProfile(profile);
      setSuccess('Profil sekolah berhasil disimpan!');
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
          <h1 className="page-title">Profil Sekolah</h1>
          <p className="page-subtitle">Kelola informasi dan identitas utama sekolah</p>
        </div>
      </div>

      {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      {success && <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">{success}</div>}

      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-6 text-blue-600 border-b pb-3">
          <Building2 size={24} />
          <h2 className="text-xl font-semibold">Identitas Institusi</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat profil sekolah...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Logo Section */}
              <div className="flex flex-col items-center space-y-4 md:w-1/4">
                <div className="w-40 h-40 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden relative group">
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Building2 size={40} className="mb-2 opacity-50" />
                      <span className="text-xs">No Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="text-white" size={32} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleFileChange} 
                />
                <p className="text-xs text-gray-500 text-center">Klik pada area gambar untuk mengubah logo (Max 2MB, JPG/PNG)</p>
              </div>

              {/* Form Fields */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nama Sekolah *</label>
                  <input type="text" className="input-field mt-1 w-full" name="name" value={profile.name || ''} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">NPSN</label>
                  <input type="text" className="input-field mt-1 w-full" name="npsn" value={profile.npsn || ''} onChange={handleChange} />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                  <textarea className="input-field mt-1 w-full" name="address" rows={2} value={profile.address || ''} onChange={handleChange}></textarea>
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kelurahan / Desa</label>
                  <input type="text" className="input-field mt-1 w-full" name="village" value={profile.village || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kecamatan</label>
                  <input type="text" className="input-field mt-1 w-full" name="subDistrict" value={profile.subDistrict || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kabupaten / Kota</label>
                  <input type="text" className="input-field mt-1 w-full" name="district" value={profile.district || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Provinsi</label>
                  <input type="text" className="input-field mt-1 w-full" name="province" value={profile.province || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kode Pos</label>
                  <input type="text" className="input-field mt-1 w-full" name="postalCode" value={profile.postalCode || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Akreditasi</label>
                  <input type="text" className="input-field mt-1 w-full" name="accreditation" value={profile.accreditation || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
                  <input type="text" className="input-field mt-1 w-full" name="phone" value={profile.phone || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Email Resmi</label>
                  <input type="email" className="input-field mt-1 w-full" name="email" value={profile.email || ''} onChange={handleChange} />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Website</label>
                  <input type="url" className="input-field mt-1 w-full" name="website" value={profile.website || ''} onChange={handleChange} placeholder="https://..." />
                </div>
                
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nama Kepala Sekolah</label>
                  <input type="text" className="input-field mt-1 w-full" name="principalName" value={profile.principalName || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">NIP Kepala Sekolah</label>
                  <input type="text" className="input-field mt-1 w-full" name="principalNip" value={profile.principalNip || ''} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-end">
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
