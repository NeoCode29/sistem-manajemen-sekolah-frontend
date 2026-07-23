import React, { useEffect, useState } from 'react';
import { getLetterTemplates, createLetterTemplate, updateLetterTemplate, deleteLetterTemplate } from '../../api/letterService';
import type { LetterTemplate } from '../../api/letterService';
import { FileCode, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Academic/Academic.css';

export const LetterTemplates: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
    if (window.confirm('Yakin ingin menghapus template ini?')) {
      try {
        await deleteLetterTemplate(id);
        fetchTemplates();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus template');
      }
    }
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileCode size={20} className="text-blue-600" />
                {editingId ? 'Edit Template Surat' : 'Buat Template Baru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              
              <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    <span>Isi Surat (Template) *</span>
                    <span className="text-xs text-blue-600">Gunakan {"{{nama_variabel}}"} untuk data dinamis.</span>
                  </label>
                  <textarea
                    name="content"
                    className="input-field mt-1 w-full font-mono text-sm"
                    rows={12}
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    placeholder={`Yang bertanda tangan di bawah ini:\nNama: Kepala Sekolah\n\nMenerangkan bahwa:\nNama: {{nama_siswa}}\nNISN: {{nisn}}\n\nAdalah benar siswa aktif di sekolah kami...`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Variabel umum yang didukung: <code>{"{{nama_siswa}}"}</code>, <code>{"{{nisn}}"}</code>, <code>{"{{kelas}}"}</code>, <code>{"{{tanggal_surat}}"}</code></p>
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
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="template-form"
                className="btn-primary"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
