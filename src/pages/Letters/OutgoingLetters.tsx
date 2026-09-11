import React, { useEffect, useState } from 'react';
import { getOutgoingLetters, createOutgoingLetter, updateOutgoingLetter, deleteOutgoingLetter } from '../../api/letterService';
import type { OutgoingLetter } from '../../api/letterService';
import api from '../../api/axios';
import { Send, Plus, Edit2, Trash2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { getErrorMessage } from '../../utils/errorHandler';

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
      setError(getErrorMessage(err, 'Gagal memuat data surat keluar'));
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
      showAlert(getErrorMessage(err, 'Gagal menyimpan surat keluar. Pastikan nomor surat, tujuan, dan perihal telah diisi.'), 'Gagal');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus surat keluar ini? File lampiran terkait juga akan ikut terhapus.', async () => {
      try {
        await deleteOutgoingLetter(id);
        fetchData();
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus surat keluar.'), 'Gagal');
      }
    });
  };

  const columns: Column<OutgoingLetter>[] = [
    { key: 'subject', header: 'No. Surat & Perihal', render: (item) => (
      <div>
        <p className="font-bold text-gray-900">{item.subject}</p>
        <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-max mt-1 border border-indigo-100">{item.letterNumber || '(Belum ada nomor)'}</p>
      </div>
    )},
    { key: 'recipient', header: 'Tujuan (Penerima)', render: (item) => (
      <span className="text-sm font-medium text-gray-700">{item.recipient}</span>
    )},
    { key: 'date', header: 'Tanggal Surat', render: (item) => (
      <span className="text-sm font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
        {new Date(item.letterDate).toLocaleDateString('id-ID')}
      </span>
    )},
    { key: 'attachment', header: 'Dokumen', render: (item) => (
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Surat Keluar" 
          subtitle="Pembuatan dan arsip surat keluar sekolah"
        />
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Buat Surat Keluar</span>
        </button>
      </div>

      <DataTable 
        columns={columns}
        data={letters}
        loading={loading}
        emptyMessage="Belum ada surat keluar"
      />

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Surat Keluar' : 'Buat Surat Keluar Baru'}
        size="lg"
      >
        <div className="p-6">
          <form id="outgoing-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && <div className="mb-2 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-medium">{error}</div>}
            
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <FormField label="File Surat Final (Opsional)" hint="Upload file surat yang sudah dicetak dan ditandatangani.">
                <input
                  type="file"
                  id="letterFile"
                  className="w-full text-sm mt-2 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nomor Surat" required>
                <input
                  type="text"
                  name="letterNumber"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  value={formData.letterNumber}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField label="Penerima (Tujuan)" required>
                <input
                  type="text"
                  name="recipient"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Perihal" required>
                <input
                  type="text"
                  name="subject"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField label="Tanggal Surat" required>
                <input
                  type="date"
                  name="letterDate"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  value={formData.letterDate}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
            </div>

            <FormField label="Keterangan Tambahan">
              <textarea
                name="notes"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={closeModal}>Batal</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan Surat Keluar</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
