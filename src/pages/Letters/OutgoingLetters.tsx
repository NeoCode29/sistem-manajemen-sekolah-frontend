import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getOutgoingLetters, createOutgoingLetter, updateOutgoingLetter, deleteOutgoingLetter } from '../../api/letterService';
import type { OutgoingLetter } from '../../api/letterService';
import api from '../../api/axios';
import { Send, Plus, Edit2, Trash2, X, Download, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const OutgoingLetters: React.FC = () => {
  const { user } = useAuth();
  const [letters, setLetters] = useState<OutgoingLetter[]>([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
  const [formData, setFormData] = useState<Partial<OutgoingLetter>>({
    letterNumber: '',
    recipient: '',
    subject: '',
    letterDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const lettersData = await getOutgoingLetters();
      setLetters(lettersData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data surat keluar');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (letter?: OutgoingLetter) => {
    if (letter) {
      setFormData({
        letterNumber: letter.letterNumber,
        recipient: letter.recipient,
        subject: letter.subject,
        letterDate: new Date(letter.letterDate).toISOString().split('T')[0],
        notes: letter.notes || '',
      });
      setEditingId(letter.id);
    } else {
      setFormData({
        letterNumber: '',
        recipient: '',
        subject: '',
        letterDate: new Date().toISOString().split('T')[0],
        notes: '',
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let savedLetter: any;
      const payload = {
        ...formData,
        letterDate: new Date(formData.letterDate as string).toISOString(),
      };
      
      if (editingId) {
        savedLetter = await updateOutgoingLetter(editingId, payload);
      } else {
        savedLetter = await createOutgoingLetter({ ...payload, issuedById: user?.id?.toString() || '1' });
      }

      const fileInput = document.getElementById('letterFile') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
         const file = fileInput.files[0];
         const fd = new FormData();
         fd.append('file', file);
         await api.post(`/letters/outgoing/${savedLetter.id}/attachment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Surat Keluar</h1>
          <p className="page-subtitle">Pembuatan dan arsip surat keluar sekolah</p>
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
                  <th>Tanggal Surat</th>
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
                          <p className="text-sm font-mono text-gray-500">{item.letterNumber || '(Belum ada nomor)'}</p>
                        </div>
                      </td>
                      <td>{item.recipient}</td>
                      <td>{new Date(item.letterDate).toLocaleDateString('id-ID')}</td>
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
                
                <div className="form-group mb-4">
                  <label className="text-sm font-medium text-gray-700">File Surat Final (Opsional)</label>
                  <input
                    type="file"
                    id="letterFile"
                    className="input-field mt-1 w-full"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload file surat yang sudah dicetak dan ditandatangani.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Nomor Surat *</label>
                    <input
                      type="text"
                      name="letterNumber"
                      className="input-field mt-1 w-full"
                      value={formData.letterNumber}
                      onChange={handleInputChange}
                      required
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tanggal Surat *</label>
                    <input
                      type="date"
                      name="letterDate"
                      className="input-field mt-1 w-full"
                      value={formData.letterDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Keterangan Tambahan</label>
                  <textarea
                    name="notes"
                    className="input-field mt-1 w-full"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>

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
