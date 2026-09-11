import React, { useEffect, useState } from 'react';
import { getLetterTemplates, createLetterTemplate, updateLetterTemplate, deleteLetterTemplate, uploadTemplateAttachment } from '../../api/letterService';
import type { LetterTemplate } from '../../api/letterService';
import { getSchoolProfile, updateSchoolProfile, uploadSchoolLogo } from '../../api/schoolProfileService';
import { FileCode, Plus, Edit2, Trash2, Download, Settings, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { generateLetterTemplateCode } from '../../utils/codeGenerator';
import { getErrorMessage } from '../../utils/errorHandler';

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
      setError(getErrorMessage(err, 'Gagal memuat data kop surat dan template'));
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
        headerText: profile.headerText,
      });

      if (logoFile) {
        await uploadSchoolLogo(logoFile);
      }
      
      showAlert('Pengaturan Kop Surat berhasil disimpan', 'Berhasil');
      fetchData();
      setLogoFile(null);
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Gagal menyimpan profil kop surat sekolah.'), 'Gagal');
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
      showAlert(getErrorMessage(err, 'Gagal menyimpan template surat. Pastikan kode template belum pernah digunakan.'), 'Gagal');
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
      showAlert('Gagal mengunduh template docx. File template belum tersedia di server.', 'Gagal');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus template surat ini?', async () => {
      try {
        await deleteLetterTemplate(id);
        fetchData();
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus template surat.'), 'Gagal');
      }
    });
  };

  const columns: Column<LetterTemplate>[] = [
    { key: 'name', header: 'Nama Template', render: (item) => (
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <FileCode size={18} />
        </div>
        <span className="font-bold text-gray-900">{item.name}</span>
      </div>
    )},
    { key: 'category', header: 'Kategori', render: (item) => (
      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
        {item.category}
      </span>
    )},
    { key: 'code', header: 'Kode', render: (item) => (
      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-mono text-sm border border-indigo-100 font-semibold">
        {item.code}
      </span>
    )},
    { key: 'status', header: 'Status', render: (item) => (
      <Badge variant={item.isActive ? 'success' : 'default'}>
        {item.isActive ? 'Aktif' : 'Nonaktif'}
      </Badge>
    )},
    { key: 'file', header: 'File Master', render: (item) => (
      item.attachmentUrl ? (
        <a href={`http://localhost:3000${item.attachmentUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors w-max border border-blue-100">
          <Download size={14} /> Unduh
        </a>
      ) : (
        <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-max inline-block">Belum ada file</span>
      )
    )},
    { key: 'actions', header: 'Aksi', render: (item) => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
          <Edit2 size={16} />
        </button>
        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
          <Trash2 size={16} />
        </button>
      </div>
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <PageHeader 
          title="Template Surat" 
          subtitle="Kelola Kop Surat dan Bank File Template"
        />
        {activeTab === 'TEMPLATE' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Upload Template Baru</span>
          </button>
        )}
      </div>

      <div className="flex bg-gray-100/80 p-1 rounded-xl w-max mb-6 border border-gray-200/50">
        <button
          className={`px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'KOP_SURAT' 
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('KOP_SURAT')}
        >
          <Settings size={16} /> Pengaturan Kop Surat
        </button>
        <button
          className={`px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'TEMPLATE' 
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('TEMPLATE')}
        >
          <FileText size={16} /> Bank File Template
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Memuat data...</div>
        ) : activeTab === 'KOP_SURAT' && profile ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 md:px-8 md:py-6 bg-indigo-50/50 border-b border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Informasi Kop Surat Sekolah</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Data ini akan digunakan sebagai header pada setiap template surat keluar.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Logo Sekolah (PNG/JPG)">
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    {profile.logoUrl && !logoFile && (
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={`http://localhost:3000${profile.logoUrl}`} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer w-full"
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Teks Header Kop Surat" hint="Teks ini otomatis dicetak rata tengah (center) pada kop surat PDF. Kosongkan jika menggunakan sistem bawaan.">
                <textarea
                  name="headerText"
                  value={profile.headerText || ''}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 min-h-[140px] resize-none"
                  placeholder={"PEMERINTAH KABUPATEN TASIKMALAYA\nDINAS PENDIDIKAN\nYAYASAN BINA UMMAT AL-QOMARIYAH\nSMK YASBU AL-QOMARIYAH"}
                />
              </FormField>

              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-4">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm w-full sm:w-auto" disabled={profileSaving}>
                  {profileSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
                <button type="button" className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-gray-200 shadow-sm" onClick={handleDownloadDocx}>
                  <Download size={16} /> Unduh Contoh Kop
                </button>
              </div>
            </form>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={templates}
            loading={loading}
            emptyMessage="Belum ada template surat"
          />
        )}
      </div>

      {/* Modal Form Template */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Template Surat' : 'Upload Template Baru'}
        size="lg"
      >
        <div className="p-6">
          <form id="template-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && <div className="mb-2 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-medium">{error}</div>}
            
            <FormField label="Nama Template" required>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-bold"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Misal: Surat Keterangan Aktif"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Kategori">
                <select
                  name="category"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium text-gray-900"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="UMUM">UMUM</option>
                  <option value="PANGGILAN">PANGGILAN</option>
                  <option value="UNDANGAN">UNDANGAN</option>
                  <option value="KETERANGAN">KETERANGAN</option>
                </select>
              </FormField>

              <FormField label="Kode Unik" required>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="code"
                    className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase font-mono font-semibold"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="Misal: SK-AKTIF-01"
                  />
                  <button
                    type="button"
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors whitespace-nowrap shrink-0"
                    onClick={() => setFormData(prev => ({ ...prev, code: generateLetterTemplateCode(prev.category, prev.name) }))}
                    title="Buat kode acak otomatis"
                  >
                    Buat Otomatis
                  </button>
                </div>
              </FormField>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <FormField label="File Master (.docx / .pdf)" hint="Upload file surat master yang sudah terdapat layout kop/isi standar." required={!editingId}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-sm mt-2 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors w-full bg-white p-1 rounded-xl border border-gray-200"
                  required={!editingId}
                />
              </FormField>
            </div>

            <div className="pt-2">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors w-full ${formData.isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm font-semibold ${formData.isActive ? 'text-emerald-900' : 'text-gray-700'}`}>Template Aktif (Dapat digunakan)</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={closeModal}>Batal</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan Template</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
