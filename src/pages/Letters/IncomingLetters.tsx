import React, { useEffect, useState, useRef } from 'react';
import { getIncomingLetters, createIncomingLetter, updateIncomingLetter, deleteIncomingLetter, uploadIncomingLetterFile } from '../../api/letterService';
import type { IncomingLetter } from '../../api/letterService';
import { Mail, Plus, Edit2, Trash2, Paperclip, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { getErrorMessage } from '../../utils/errorHandler';

export const IncomingLetters: React.FC = () => {
  const { user } = useAuth();
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<IncomingLetter>>({
    letterNumber: '',
    sender: '',
    subject: '',
    receivedDate: new Date().toISOString().split('T')[0],
    letterDate: new Date().toISOString().split('T')[0],
    notes: '',
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
      setError(getErrorMessage(err, 'Gagal memuat daftar surat masuk'));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (letter?: IncomingLetter) => {
    if (letter) {
      setFormData({
        letterNumber: letter.letterNumber,
        sender: letter.sender,
        subject: letter.subject,
        receivedDate: new Date(letter.receivedDate).toISOString().split('T')[0],
        letterDate: new Date(letter.letterDate).toISOString().split('T')[0],
        notes: letter.notes || '',
      });
      setEditingId(letter.id);
    } else {
      setFormData({
        letterNumber: '',
        sender: '',
        subject: '',
        receivedDate: new Date().toISOString().split('T')[0],
        letterDate: new Date().toISOString().split('T')[0],
        notes: '',
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
        const newLetter = await createIncomingLetter({ ...payload, recordedById: user?.id?.toString() || '1' });
        letterId = newLetter.id;
      }

      if (selectedFile && letterId) {
        await uploadIncomingLetterFile(letterId, selectedFile);
      }
      
      closeModal();
      fetchLetters();
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Gagal menyimpan surat masuk. Pastikan nomor surat dan data wajib lainnya telah diisi.'), 'Gagal');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus data surat masuk ini? File lampiran terkait juga akan dihapus.', async () => {
      try {
        await deleteIncomingLetter(id);
        fetchLetters();
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus data surat masuk.'), 'Gagal');
      }
    });
  };

  const columns: Column<IncomingLetter>[] = [
    { key: 'subject', header: 'No. Surat & Perihal', render: (item) => (
      <div>
        <p className="font-bold text-gray-900">{item.subject}</p>
        <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-max mt-1">{item.letterNumber}</p>
      </div>
    )},
    { key: 'sender', header: 'Pengirim', render: (item) => (
      <span className="text-sm font-medium text-gray-700">{item.sender}</span>
    )},
    { key: 'dates', header: 'Tanggal', render: (item) => (
      <div className="flex flex-col text-xs font-medium gap-1 text-gray-600">
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100 w-max">
          Diterima: {new Date(item.receivedDate).toLocaleDateString('id-ID')}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded w-max text-gray-500">
          Tgl Surat: {new Date(item.letterDate).toLocaleDateString('id-ID')}
        </span>
      </div>
    )},
    { key: 'attachment', header: 'Lampiran', render: (item) => (
      item.attachmentUrl ? (
        <a href={`http://localhost:3000${item.attachmentUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors w-max border border-blue-100">
          <Download size={14} /> Unduh File
        </a>
      ) : (
        <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-max inline-block">Kosong</span>
      )
    )},
    { key: 'actions', header: 'Aksi', render: (item) => (
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => openModal(item)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => handleDelete(item.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Hapus"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Surat Masuk" 
          subtitle="Pencatatan dan arsip surat yang diterima sekolah"
        />
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => openModal()}>
          <Plus size={18} />
          <span>Catat Surat Masuk</span>
        </button>
      </div>

      <DataTable 
        columns={columns}
        data={letters}
        loading={loading}
        emptyMessage="Belum ada catatan surat masuk"
      />

      {/* Modal Form */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Surat Masuk' : 'Catat Surat Masuk Baru'}
        size="lg"
      >
        <div className="p-6">
          <form id="incoming-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && <div className="mb-2 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-medium">{error}</div>}
            
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
              <FormField label="Pengirim Instansi/Personal" required>
                <input
                  type="text"
                  name="sender"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium"
                  value={formData.sender}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Tanggal Surat Diterima" required>
                <input
                  type="date"
                  name="receivedDate"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField label="Tanggal Tertulis di Surat" required>
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

            <FormField label="Keterangan Tambahan / Disposisi">
              <textarea
                name="notes"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Unggah File Scan Surat (PDF/JPG)">
              <div className="mt-1 flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
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
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Paperclip size={16} /> Pilih File
                </button>
                <span className="text-sm font-medium text-gray-500">
                  {selectedFile ? <span className="text-indigo-600">{selectedFile.name}</span> : editingId ? '(File sudah diunggah, pilih untuk mengganti)' : 'Tidak ada file terpilih'}
                </span>
              </div>
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
              <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={closeModal}>Batal</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan Surat Masuk</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
