import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  getIncomingLetters, 
  createIncomingLetter, 
  updateIncomingLetter, 
  deleteIncomingLetter, 
  uploadIncomingLetterFile,
  type IncomingLetter 
} from '../../api/letterService';
import { Plus, Search, Download, Loader2, FileText, Upload, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Modal, FormField } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const IncomingLetters: React.FC = () => {
  const { user } = useAuth();
  const {
    canCreateIncomingLetter,
    canUpdateIncomingLetter,
    canDeleteIncomingLetter,
    hasPermission,
  } = usePermissions();

  const isManagementRole = user?.roles?.some((r) =>
    ['Super Admin', 'Admin Sekolah', 'Kepala Sekolah', 'Staf TU'].includes(r.name),
  );

  const canCreate =
    canCreateIncomingLetter ||
    isManagementRole ||
    hasPermission('incoming_letters.create') ||
    hasPermission('letters.write') ||
    hasPermission('incoming_letters.manage') ||
    hasPermission('letters.manage');
  const canUpdate =
    canUpdateIncomingLetter ||
    isManagementRole ||
    hasPermission('incoming_letters.update') ||
    hasPermission('letters.write') ||
    hasPermission('incoming_letters.manage') ||
    hasPermission('letters.manage');
  const canDelete =
    canDeleteIncomingLetter ||
    isManagementRole ||
    hasPermission('incoming_letters.delete') ||
    hasPermission('letters.manage') ||
    hasPermission('incoming_letters.manage');
  const hasActions = canUpdate || canDelete;

  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    action: async () => {}
  });
  
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
      notify.error(err, 'Gagal memuat surat masuk');
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
        receivedDate: letter.receivedDate ? new Date(letter.receivedDate).toISOString().split('T')[0] : '',
        letterDate: letter.letterDate ? new Date(letter.letterDate).toISOString().split('T')[0] : '',
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
    if (editingId && !canUpdate) {
      notify.error(null, 'Anda tidak memiliki izin untuk mengubah data surat masuk');
      return;
    }
    if (!editingId && !canCreate) {
      notify.error(null, 'Anda tidak memiliki izin untuk mencatat surat masuk');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        receivedDate: new Date(formData.receivedDate as string).toISOString(),
        letterDate: new Date(formData.letterDate as string).toISOString(),
      };

      let letterId = editingId;

      if (editingId) {
        await updateIncomingLetter(editingId, payload);
      } else {
        const newLetter = await createIncomingLetter({ ...payload, recordedById: user?.employeeId?.toString() || '1' });
        letterId = newLetter.id;
      }

      if (selectedFile && letterId) {
        await uploadIncomingLetterFile(letterId, selectedFile);
      }
      
      notify.success(editingId ? 'Surat masuk berhasil diperbarui' : 'Surat masuk baru berhasil dicatat');
      closeModal();
      fetchLetters();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan surat masuk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      notify.error(null, 'Anda tidak memiliki izin untuk menghapus surat masuk');
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'Hapus Surat Masuk',
      message: 'Apakah Anda yakin ingin menghapus data surat masuk ini? Berkas lampiran dan riwayatnya akan ikut dihapus.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteIncomingLetter(id);
          notify.success('Surat masuk berhasil dihapus');
          fetchLetters();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus surat masuk');
        }
      }
    });
  };

  // Filtered & Paginated Letters
  const filteredLetters = useMemo(() => {
    if (!search.trim()) return letters;
    const q = search.toLowerCase();
    return letters.filter(l => 
      l.subject.toLowerCase().includes(q) ||
      l.letterNumber.toLowerCase().includes(q) ||
      l.sender.toLowerCase().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  }, [letters, search]);

  const totalPages = Math.ceil(filteredLetters.length / itemsPerPage);
  const paginatedLetters = useMemo(() => {
    return filteredLetters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLetters, currentPage, itemsPerPage]);

  const columns: Column<IncomingLetter>[] = [
    { 
      key: 'subject', 
      header: 'No. Surat & Perihal', 
      render: (item) => (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
            <FileText size={17} />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 truncate" title={item.subject}>{item.subject}</p>
            <p className="text-xs font-mono text-indigo-700 bg-indigo-50/70 border border-indigo-200/60 px-2 py-0.5 rounded-md w-max mt-1">
              {item.letterNumber}
            </p>
          </div>
        </div>
      )
    },
    { 
      key: 'sender', 
      header: 'Pengirim', 
      render: (item) => (
        <span className="text-sm font-medium text-slate-700">{item.sender}</span>
      )
    },
    { 
      key: 'dates', 
      header: 'Tanggal', 
      render: (item) => (
        <div className="flex flex-col text-xs font-medium gap-1 text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-700">
            Diterima: {new Date(item.receivedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            Tgl Surat: {new Date(item.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    { 
      key: 'attachment', 
      header: 'Lampiran', 
      render: (item) => (
        item.attachmentUrl ? (
          <a 
            href={`http://localhost:3000${item.attachmentUrl}`} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all border border-indigo-200"
          >
            <Download size={13} /> Unduh File
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 w-max inline-block">
            Belum ada berkas
          </span>
        )
      )
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      render: (item: IncomingLetter) => (
        <div className="flex justify-end">
          <ActionButtons 
            onEdit={canUpdate ? () => openModal(item) : undefined}
            onDelete={canDelete ? () => handleDelete(item.id) : undefined}
          />
        </div>
      )
    }] : [])
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader 
        title="Surat Masuk" 
        subtitle="Pencatatan, pengarsipan, dan digitalisasi surat yang diterima sekolah."
        action={canCreate ? (
          <button className="btn-std-primary flex items-center gap-2" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Catat Surat Masuk</span>
          </button>
        ) : undefined}
      />

      {/* Filter / Search Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="flex-1 max-w-lg">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Pencarian Surat Masuk
            </label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={17} />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" 
                placeholder="Cari nomor surat, perihal, atau pengirim..." 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }} 
              />
            </div>
          </div>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm self-stretch sm:self-end cursor-pointer shrink-0"
              title="Reset pencarian"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <DataTable 
          columns={columns}
          data={paginatedLetters}
          loading={loading}
          emptyMessage="Belum ada data surat masuk. Klik 'Catat Surat Masuk' untuk menambahkan."
          hasPagination={filteredLetters.length > 0}
        />

        {filteredLetters.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLetters.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Modal Form */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Surat Masuk' : 'Catat Surat Masuk Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nomor Surat" required>
              <input
                type="text"
                name="letterNumber"
                className="input-std font-mono"
                value={formData.letterNumber}
                onChange={handleInputChange}
                required
                placeholder="Misal: 421.2/105/Disdik/2026"
              />
            </FormField>

            <FormField label="Instansi / Pengirim" required>
              <input
                type="text"
                name="sender"
                className="input-std"
                value={formData.sender}
                onChange={handleInputChange}
                required
                placeholder="Misal: Dinas Pendidikan Kab. Sleman"
              />
            </FormField>
          </div>

          <FormField label="Perihal Surat" required>
            <input
              type="text"
              name="subject"
              className="input-std"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="Misal: Undangan Sosialisasi Kurikulum Nasional"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tanggal Surat" required>
              <input
                type="date"
                name="letterDate"
                className="input-std"
                value={formData.letterDate}
                onChange={handleInputChange}
                required
              />
            </FormField>

            <FormField label="Tanggal Diterima" required>
              <input
                type="date"
                name="receivedDate"
                className="input-std"
                value={formData.receivedDate}
                onChange={handleInputChange}
                required
              />
            </FormField>
          </div>

          <FormField label="Catatan / Disposisi Awal (Opsional)">
            <textarea
              name="notes"
              className="input-std min-h-[75px]"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Catatan isi ringkas atau disposisi pimpinan..."
            />
          </FormField>

          <FormField label="Berkas Dokumen Lampiran (PDF / Gambar)">
            <div className="flex items-center gap-3">
              <label className="btn-std-secondary flex items-center gap-2 cursor-pointer text-xs py-2 px-3">
                <Upload size={14} /> Pilih Berkas
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
              <span className="text-xs text-slate-500 truncate max-w-xs">
                {selectedFile ? selectedFile.name : (editingId ? 'Pilih berkas baru jika ingin mengganti lampiran' : 'Belum ada berkas dipilih')}
              </span>
            </div>
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={closeModal}
              className="btn-std-secondary px-5"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-std-primary px-6 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Surat Masuk')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
};
