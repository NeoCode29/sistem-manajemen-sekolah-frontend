import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLetterTemplates, createLetterTemplate, updateLetterTemplate, deleteLetterTemplate, uploadTemplateAttachment } from '../../api/letterService';
import type { LetterTemplate } from '../../api/letterService';
import { getSchoolProfile, updateSchoolProfile, uploadSchoolLogo } from '../../api/schoolProfileService';
import { FileCode, Plus, Edit2, Trash2, X, Download, Settings, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const LetterTemplates: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'KOP_SURAT' | 'TEMPLATE'>('KOP_SURAT');
  
  // Tab: KOP_SURAT
  const [profile, setProfile] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Tab: TEMPLATE
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
  const [formData, setFormData] = useState<Partial<LetterTemplate>>({
    name: '',
    code: '',
    category: 'UMUM',
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'KOP_SURAT') {
        const data = await getSchoolProfile();
        setProfile(data);
      } else {
        const data = await getLetterTemplates();
        setTemplates(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // --- KOP_SURAT HANDLERS ---
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setProfileSaving(true);
      await updateSchoolProfile({
        code: profile.code || 'SCH001',
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
      });

      if (logoFile) {
        await uploadSchoolLogo(logoFile);
      }
      
      showAlert('Pengaturan Kop Surat berhasil disimpan', 'Berhasil');
      fetchData();
      setLogoFile(null);
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Gagal menyimpan profil', 'Gagal');
    } finally {
      setProfileSaving(false);
    }
  };

  // --- TEMPLATE HANDLERS ---
  const openModal = (template?: LetterTemplate) => {
    if (template) {
      setFormData({
        name: template.name,
        code: template.code,
        category: template.category,
        isActive: template.isActive,
      });
      setEditingId(template.id);
    } else {
      setFormData({
        name: '',
        code: '',
        category: 'UMUM',
        isActive: true,
      });
      setEditingId(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let savedTemplate: any;
      if (editingId) {
        savedTemplate = await updateLetterTemplate(editingId, formData);
      } else {
        savedTemplate = await createLetterTemplate(formData);
      }

      if (selectedFile) {
        await uploadTemplateAttachment(savedTemplate.id, selectedFile);
      }
      
      closeModal();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan template surat');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const blob = await import('../../api/schoolProfileService').then(m => m.downloadTemplateDocx());
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_surat_kosong.docx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      showAlert('Gagal mengunduh template docx', 'Gagal');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus template ini?', async () => {
      try {
        await deleteLetterTemplate(id);
        fetchData();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus template');
      }
    });
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Template Surat</h1>
          <p className="page-subtitle">Kelola Kop Surat dan Bank File Template</p>
        </div>
        {activeTab === 'TEMPLATE' && (
          <div className="header-actions">
            <button className="btn-primary" onClick={() => openModal()}>
              <Plus size={18} />
              <span>Upload Template Baru</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 border-b border-gray-200 mt-6 px-1">
        <button
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'KOP_SURAT' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('KOP_SURAT')}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} /> Pengaturan Kop Surat
          </div>
        </button>
        <button
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'TEMPLATE' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('TEMPLATE')}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} /> Bank File Template
          </div>
        </button>
      </div>

      <div className="glass-panel mt-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : activeTab === 'KOP_SURAT' && profile ? (
          <div className="p-6 max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Informasi Kop Surat Sekolah</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nama Sekolah</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name || ''}
                    onChange={handleProfileChange}
                    className="input-field mt-1 w-full"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Logo Sekolah (PNG/JPG)</label>
                  <div className="mt-1 flex items-center gap-4">
                    {profile.logoUrl && !logoFile && (
                      <img src={`http://localhost:3000${profile.logoUrl}`} alt="Logo" className="h-12 w-12 object-contain bg-gray-50 rounded border" />
                    )}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                <textarea
                  name="address"
                  value={profile.address || ''}
                  onChange={handleProfileChange}
                  className="input-field mt-1 w-full"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Telepon / Fax</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleProfileChange}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email || ''}
                    onChange={handleProfileChange}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="text"
                    name="website"
                    value={profile.website || ''}
                    onChange={handleProfileChange}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex gap-4">
                <button type="submit" className="btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Menyimpan...' : 'Simpan Pengaturan Kop'}
                </button>
                <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-gray-300" onClick={handleDownloadDocx}>
                  <Download size={16} /> Unduh Contoh Kop (DOCX)
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Template</th>
                  <th>Kategori</th>
                  <th>Kode</th>
                  <th>Status</th>
                  <th>File Master</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      Belum ada template surat
                    </td>
                  </tr>
                ) : (
                  templates.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FileCode size={18} />
                          </div>
                          <span className="font-semibold text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-mono text-sm border">
                          {item.code}
                        </span>
                      </td>
                      <td>
                        {item.isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Aktif</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Nonaktif</span>
                        )}
                      </td>
                      <td>
                        {item.attachmentUrl ? (
                          <a href={`http://localhost:3000${item.attachmentUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                            <Download size={14} /> Unduh
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">Belum ada file</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Template */}
      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2">
                <FileCode size={20} className="text-blue-600" />
                {editingId ? 'Edit Template Surat' : 'Upload Template Baru'}
              </h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form id="template-form" onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nama Template *</label>
                  <input
                    type="text"
                    name="name"
                    className="input-field mt-1 w-full"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Misal: Surat Keterangan Aktif"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Kode Unik *</label>
                    <input
                      type="text"
                      name="code"
                      className="input-field mt-1 w-full uppercase"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="Misal: SK-AKTIF-01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Kategori</label>
                    <select
                      name="category"
                      className="input-field mt-1 w-full"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="UMUM">UMUM</option>
                      <option value="PANGGILAN">PANGGILAN</option>
                      <option value="UNDANGAN">UNDANGAN</option>
                      <option value="KETERANGAN">KETERANGAN</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">File Master (.docx / .pdf)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="input-field mt-1 w-full"
                    required={!editingId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload file surat master yang sudah terdapat layout kop/isi standar.
                  </p>
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Template Aktif (Dapat digunakan)
                  </label>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Template</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
