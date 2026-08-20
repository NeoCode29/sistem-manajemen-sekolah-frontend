import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getOutgoingLetters, createOutgoingLetter, updateOutgoingLetter, deleteOutgoingLetter, updateOutgoingLetterStatus, generateOutgoingLetterDocument, getLetterTemplates } from '../../api/letterService';
import type { OutgoingLetter, LetterTemplate } from '../../api/letterService';
import { Send, Plus, Edit2, Trash2, X, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const OutgoingLetters: React.FC = () => {
  const { user } = useAuth();
  const [letters, setLetters] = useState<OutgoingLetter[]>([]);
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
  const [formData, setFormData] = useState<Partial<OutgoingLetter>>({
    referenceNumber: '',
    recipient: '',
    subject: '',
    status: 'DRAFT',
    templateId: '',
    variables: {},
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lettersData, templatesData] = await Promise.all([
        getOutgoingLetters(),
        getLetterTemplates()
      ]);
      setLetters(lettersData);
      setTemplates(templatesData.filter((t: LetterTemplate) => t.isActive));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data surat keluar');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (letter?: OutgoingLetter) => {
    if (letter) {
      setFormData({
        referenceNumber: letter.referenceNumber,
        recipient: letter.recipient,
        subject: letter.subject,
        status: letter.status,
        templateId: letter.templateId || '',
        variables: letter.variables || {},
      });
      setEditingId(letter.id);
    } else {
      setFormData({
        referenceNumber: '',
        recipient: '',
        subject: '',
        status: 'DRAFT',
        templateId: '',
        variables: {},
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariableChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...(prev.variables || {}),
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateOutgoingLetter(editingId, formData);
      } else {
        await createOutgoingLetter({ ...formData, createdById: user?.id?.toString() || '1' });
      }
      
      closeModal();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan surat keluar');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus surat keluar ini?', async () => {
      try {
        await deleteOutgoingLetter(id);
        fetchData();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus surat');
      }
    });
  };

  const handleGenerateDocument = async (id: string) => {
    try {
      await generateOutgoingLetterDocument(id);
      showAlert('Dokumen berhasil digenerate', 'Berhasil');
      fetchData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Gagal generate dokumen', 'Gagal');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOutgoingLetterStatus(id, status);
      fetchData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Gagal mengubah status', 'Gagal');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border">Draft</span>;
      case 'PENDING_APPROVAL': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Menunggu Approval</span>;
      case 'APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Disetujui</span>;
      case 'SENT': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Send size={12}/> Terkirim</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Ditolak</span>;
      default: return <span>{status}</span>;
    }
  };

  // Helper to extract variables from template content
  const extractVariables = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return [];
    const matches = template.content.match(/{{(.*?)}}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/{{|}}/g, '').trim())));
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Surat Keluar</h1>
          <p className="page-subtitle">Pembuatan, persetujuan, dan arsip surat keluar</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Buat Surat Keluar</span>
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
                  <th>No. Surat & Perihal</th>
                  <th>Tujuan (Penerima)</th>
                  <th>Status</th>
                  <th>Dokumen</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {letters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Belum ada surat keluar
                    </td>
                  </tr>
                ) : (
                  letters.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-gray-900">{item.subject}</p>
                          <p className="text-sm font-mono text-gray-500">{item.referenceNumber || '(Belum ada nomor)'}</p>
                          <p className="text-xs text-blue-600 mt-1">{item.template?.name || 'Tanpa Template'}</p>
                        </div>
                      </td>
                      <td>{item.recipient}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        {item.fileUrl ? (
                          <a href={`http://localhost:3000${item.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                            <Download size={14} /> Unduh
                          </a>
                        ) : (
                          <button 
                            onClick={() => handleGenerateDocument(item.id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded flex items-center gap-1"
                          >
                            <FileText size={12} /> Generate
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <button onClick={() => openModal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {item.status === 'DRAFT' && (
                            <button onClick={() => handleStatusChange(item.id, 'PENDING_APPROVAL')} className="text-[10px] text-yellow-700 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-200 w-max mt-1">
                              Ajukan Approval
                            </button>
                          )}
                          {item.status === 'PENDING_APPROVAL' && (
                            <button onClick={() => handleStatusChange(item.id, 'APPROVED')} className="text-[10px] text-green-700 bg-green-50 px-1 py-0.5 rounded border border-green-200 w-max mt-1">
                              Setujui
                            </button>
                          )}
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
          <div className="modal-content-v4" style={{ maxWidth: '700px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2">
                <Send size={20} className="text-blue-600" />
                {editingId ? 'Edit Surat Keluar' : 'Buat Surat Keluar Baru'}
              </h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form id="outgoing-form" onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Gunakan Template</label>
                  <select
                    name="templateId"
                    className="input-field mt-1 w-full"
                    value={formData.templateId || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Pilih Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Nomor Surat (Opsional)</label>
                    <input
                      type="text"
                      name="referenceNumber"
                      className="input-field mt-1 w-full"
                      value={formData.referenceNumber}
                      onChange={handleInputChange}
                      placeholder="Dikosongkan jika digenerate otomatis"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Penerima (Tujuan) *</label>
                    <input
                      type="text"
                      name="recipient"
                      className="input-field mt-1 w-full"
                      value={formData.recipient}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Perihal *</label>
                  <input
                    type="text"
                    name="subject"
                    className="input-field mt-1 w-full"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {formData.templateId && extractVariables(formData.templateId).length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Isi Variabel Template</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {extractVariables(formData.templateId).map(variable => (
                        <div key={variable} className="form-group">
                          <label className="text-xs font-medium text-gray-700 capitalize">{variable.replace(/_/g, ' ')}</label>
                          <input
                            type="text"
                            className="input-field mt-1 w-full text-sm py-1.5"
                            value={(formData.variables as any)?.[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Surat Keluar</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
