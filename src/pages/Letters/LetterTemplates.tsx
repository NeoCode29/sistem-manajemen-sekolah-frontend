import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLetterTemplates, createLetterTemplate, updateLetterTemplate, deleteLetterTemplate } from '../../api/letterService';
import type { LetterTemplate } from '../../api/letterService';
import { FileCode, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const LetterTemplates: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
  const [formData, setFormData] = useState<Partial<LetterTemplate>>({
    name: '',
    code: '',
    content: '',
    isActive: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getLetterTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat template surat');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (template?: LetterTemplate) => {
    if (template) {
      setFormData({
        name: template.name,
        code: template.code,
        content: template.content,
        isActive: template.isActive,
      });
      setEditingId(template.id);
    } else {
      setFormData({
        name: '',
        code: '',
        content: '',
        isActive: true,
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      if (editingId) {
        await updateLetterTemplate(editingId, formData);
      } else {
        await createLetterTemplate({ ...formData, createdById: user?.id?.toString() || '1' });
      }
      
      closeModal();
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan template surat');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus template ini?', async () => {
      try {
        await deleteLetterTemplate(id);
        fetchTemplates();
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
          <p className="page-subtitle">Kelola format baku untuk surat keluar otomatis</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Buat Template</span>
          </button>
        </div>
      </div>

      <div className="glass-panel mt-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Template</th>
                  <th>Kode</th>
                  <th>Status</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
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
                      <td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
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

      {/* Modal Form */}
      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '800px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2">
                <FileCode size={20} className="text-blue-600" />
                {editingId ? 'Edit Template Surat' : 'Buat Template Baru'}
              </h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form id="template-form" onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Isi Surat (Template) *
                  </label>
                  <div className="bg-white rounded-md border border-indigo-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm">
                    <ReactQuill 
                      theme="snow"
                      value={formData.content || ''}
                      onChange={(val) => handleInputChange({ target: { name: 'content', value: val } } as any)}
                      style={{ minHeight: '350px' }}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                  
                  <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-3 items-start">
                    <div className="mt-0.5 text-indigo-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900 mb-1">Panduan Variabel Dinamis</p>
                      <p className="text-xs text-indigo-700 mb-2">Ketik variabel dengan format kurung kurawal ganda untuk menyisipkan data otomatis saat dokumen di-generate.</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[11px] bg-white px-2 py-1 rounded-md border border-indigo-100 text-indigo-700 font-mono shadow-sm">{"{{nama_siswa}}"}</span>
                        <span className="text-[11px] bg-white px-2 py-1 rounded-md border border-indigo-100 text-indigo-700 font-mono shadow-sm">{"{{nisn}}"}</span>
                        <span className="text-[11px] bg-white px-2 py-1 rounded-md border border-indigo-100 text-indigo-700 font-mono shadow-sm">{"{{kelas}}"}</span>
                        <span className="text-[11px] bg-white px-2 py-1 rounded-md border border-indigo-100 text-indigo-700 font-mono shadow-sm">{"{{tanggal_surat}}"}</span>
                      </div>
                    </div>
                  </div>
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
