import React, { useEffect, useState, useRef } from 'react';
import { getIncomingLetters, createIncomingLetter, updateIncomingLetter, deleteIncomingLetter, uploadIncomingLetterFile } from '../../api/letterService';
import type { IncomingLetter } from '../../api/letterService';
import { Mail, Plus, Edit2, Trash2, X, Paperclip, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Academic/Academic.css';

export const IncomingLetters: React.FC = () => {
  const { user } = useAuth();
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<IncomingLetter>>({
    referenceNumber: '',
    sender: '',
    subject: '',
    receivedDate: new Date().toISOString().split('T')[0],
    letterDate: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const data = await getIncomingLetters();
      setLetters(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat surat masuk');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (letter?: IncomingLetter) => {
    if (letter) {
      setFormData({
        referenceNumber: letter.referenceNumber,
        sender: letter.sender,
        subject: letter.subject,
        receivedDate: new Date(letter.receivedDate).toISOString().split('T')[0],
        letterDate: new Date(letter.letterDate).toISOString().split('T')[0],
        description: letter.description || '',
      });
      setEditingId(letter.id);
    } else {
      setFormData({
        referenceNumber: '',
        sender: '',
        subject: '',
        receivedDate: new Date().toISOString().split('T')[0],
        letterDate: new Date().toISOString().split('T')[0],
        description: '',
      });
      setEditingId(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        receivedDate: new Date(formData.receivedDate as string).toISOString(),
        letterDate: new Date(formData.letterDate as string).toISOString(),
      };

      let letterId = editingId;

      if (editingId) {
        await updateIncomingLetter(editingId, payload);
      } else {
        const newLetter = await createIncomingLetter({ ...payload, createdById: user?.id?.toString() || '1' });
        letterId = newLetter.id;
      }

      if (selectedFile && letterId) {
        await uploadIncomingLetterFile(letterId, selectedFile);
      }
      
      closeModal();
      fetchLetters();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan surat masuk');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus data surat masuk ini?')) {
      try {
        await deleteIncomingLetter(id);
        fetchLetters();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus surat');
      }
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Surat Masuk</h1>
          <p className="page-subtitle">Pencatatan dan arsip surat yang diterima sekolah</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Catat Surat Masuk</span>
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
                  <th>Pengirim</th>
                  <th>Tanggal Terima</th>
                  <th>Lampiran</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {letters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Belum ada catatan surat masuk
                    </td>
                  </tr>
                ) : (
                  letters.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-gray-900">{item.subject}</p>
                          <p className="text-sm font-mono text-gray-500">{item.referenceNumber}</p>
                        </div>
                      </td>
                      <td>{item.sender}</td>
                      <td>
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-900">Diterima: {new Date(item.receivedDate).toLocaleDateString('id-ID')}</span>
                          <span className="text-gray-500 flex items-center gap-1">Tgl Surat: {new Date(item.letterDate).toLocaleDateString('id-ID')}</span>
                        </div>
                      </td>
                      <td>
                        {item.fileUrl ? (
                          <a href={`http://localhost:3000${item.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                            <Download size={14} /> Unduh
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Tidak ada lampiran</span>
                        )}
                      </td>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Mail size={20} className="text-blue-600" />
                {editingId ? 'Edit Surat Masuk' : 'Catat Surat Masuk Baru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              
              <form id="incoming-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Nomor Surat *</label>
                    <input
                      type="text"
                      name="referenceNumber"
                      className="input-field mt-1 w-full"
                      value={formData.referenceNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Pengirim Instansi/Personal *</label>
                    <input
                      type="text"
                      name="sender"
                      className="input-field mt-1 w-full"
                      value={formData.sender}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tanggal Surat Diterima *</label>
                    <input
                      type="date"
                      name="receivedDate"
                      className="input-field mt-1 w-full"
                      value={formData.receivedDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tanggal Tertulis di Surat *</label>
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
                  <label className="text-sm font-medium text-gray-700">Keterangan Tambahan / Disposisi</label>
                  <textarea
                    name="description"
                    className="input-field mt-1 w-full"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Unggah File Scan Surat (PDF/JPG)</label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Paperclip size={16} /> Pilih File
                    </button>
                    <span className="text-sm text-gray-500">
                      {selectedFile ? selectedFile.name : editingId ? '(File sudah diunggah, pilih untuk mengganti)' : 'Tidak ada file terpilih'}
                    </span>
                  </div>
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
                form="incoming-form"
                className="btn-primary"
              >
                Simpan Surat Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
