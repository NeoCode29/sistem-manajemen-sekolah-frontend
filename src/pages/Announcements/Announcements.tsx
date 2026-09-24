import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  type Announcement 
} from '../../api/announcementService';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Pin, 
  Calendar, 
  Users, 
  Loader2, 
  RotateCcw,
  Paperclip,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Modal, FormField, Badge, type BadgeVariant } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const {
    canCreateAnnouncement,
    canUpdateAnnouncement,
    canDeleteAnnouncement,
    hasPermission,
  } = usePermissions();

  const isManagementRole = user?.roles?.some((r) =>
    ['Super Admin', 'Admin Sekolah', 'Kepala Sekolah', 'Staf TU'].includes(r.name),
  );

  const canCreate =
    canCreateAnnouncement ||
    isManagementRole ||
    hasPermission('announcements.create') ||
    hasPermission('announcements.write');
  const canUpdate =
    canUpdateAnnouncement ||
    isManagementRole ||
    hasPermission('announcements.update') ||
    hasPermission('announcements.write');
  const canDelete =
    canDeleteAnnouncement ||
    isManagementRole ||
    hasPermission('announcements.delete');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Detail Modal State
  const [selectedAnnouncementForDetail, setSelectedAnnouncementForDetail] = useState<Announcement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // File Upload State
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState<string | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  const posterInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

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

  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    targetAudience: 'SEMUA',
    isPinned: false,
    isActive: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      notify.error(err, 'Gagal memuat pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (announcement?: Announcement) => {
    // Reset file states
    setPosterFile(null);
    setAttachmentFile(null);
    setRemovePoster(false);
    setRemoveAttachment(false);

    if (posterPreview && !posterPreview.startsWith('http')) {
      URL.revokeObjectURL(posterPreview);
    }

    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        targetAudience: announcement.targetAudience,
        isPinned: announcement.isPinned,
        isActive: announcement.isActive,
        publishDate: announcement.publishDate ? new Date(announcement.publishDate).toISOString().split('T')[0] : '',
        expireDate: announcement.expireDate ? new Date(announcement.expireDate).toISOString().split('T')[0] : '',
      });
      setEditingId(announcement.id);
      setExistingPosterUrl(announcement.posterUrl ? `${apiBaseUrl}${announcement.posterUrl}` : null);
      setPosterPreview(announcement.posterUrl ? `${apiBaseUrl}${announcement.posterUrl}` : null);
      setExistingAttachmentName(announcement.attachmentName || null);
    } else {
      setFormData({
        title: '',
        content: '',
        targetAudience: 'SEMUA',
        isPinned: false,
        isActive: true,
        publishDate: new Date().toISOString().split('T')[0],
      });
      setEditingId(null);
      setExistingPosterUrl(null);
      setPosterPreview(null);
      setExistingAttachmentName(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    if (posterPreview && !posterPreview.startsWith('http')) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterPreview(null);
    setPosterFile(null);
    setAttachmentFile(null);
    setExistingPosterUrl(null);
    setExistingAttachmentName(null);
    setRemovePoster(false);
    setRemoveAttachment(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe berkas
    if (!file.type.match(/image\/(jpeg|png|webp)/i)) {
      notify.error(null, 'Format poster harus berupa gambar (JPG, PNG, atau WEBP)');
      return;
    }

    // Validasi ukuran berkas (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify.error(null, 'Ukuran poster tidak boleh melebihi 5 MB');
      return;
    }

    setPosterFile(file);
    setRemovePoster(false);
    if (posterPreview && !posterPreview.startsWith('http')) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleRemovePoster = () => {
    if (posterPreview && !posterPreview.startsWith('http')) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterFile(null);
    setPosterPreview(null);
    setRemovePoster(true);
    if (posterInputRef.current) {
      posterInputRef.current.value = '';
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ekstensi
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      notify.error(null, 'Format dokumen lampiran harus berupa PDF, DOC, atau DOCX');
      return;
    }

    // Validasi ukuran berkas (maks 10MB)
    if (file.size > 10 * 1024 * 1024) {
      notify.error(null, 'Ukuran dokumen lampiran tidak boleh melebihi 10 MB');
      return;
    }

    setAttachmentFile(file);
    setRemoveAttachment(false);
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setRemoveAttachment(true);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !canUpdate) {
      notify.error(null, 'Anda tidak memiliki izin untuk mengubah pengumuman');
      return;
    }
    if (!editingId && !canCreate) {
      notify.error(null, 'Anda tidak memiliki izin untuk membuat pengumuman');
      return;
    }

    try {
      setIsSubmitting(true);
      const dataPayload = new FormData();
      dataPayload.append('title', formData.title || '');
      dataPayload.append('content', formData.content || '');
      dataPayload.append('targetAudience', formData.targetAudience || 'SEMUA');
      dataPayload.append('isPinned', String(!!formData.isPinned));
      dataPayload.append('isActive', String(formData.isActive !== undefined ? formData.isActive : true));

      if (formData.publishDate) {
        dataPayload.append('publishDate', new Date(formData.publishDate).toISOString());
      }
      if (formData.expireDate) {
        dataPayload.append('expireDate', new Date(formData.expireDate).toISOString());
      }

      if (posterFile) {
        dataPayload.append('poster', posterFile);
      }
      if (attachmentFile) {
        dataPayload.append('attachment', attachmentFile);
      }

      if (editingId) {
        if (removePoster) {
          dataPayload.append('removePoster', 'true');
        }
        if (removeAttachment) {
          dataPayload.append('removeAttachment', 'true');
        }
        await updateAnnouncement(editingId, dataPayload);
        notify.success('Pengumuman berhasil diperbarui');
      } else {
        dataPayload.append('createdById', user?.employeeId?.toString() || '1');
        await createAnnouncement(dataPayload);
        notify.success('Pengumuman baru berhasil disebarkan');
      }
      
      closeModal();
      fetchAnnouncements();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan pengumuman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      notify.error(null, 'Anda tidak memiliki izin untuk menghapus pengumuman');
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'Hapus Pengumuman',
      message: 'Apakah Anda yakin ingin menghapus pengumuman ini? Berkas poster dan lampiran terkait juga akan dihapus permanen.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteAnnouncement(id);
          notify.success('Pengumuman berhasil dihapus');
          fetchAnnouncements();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus pengumuman');
        }
      }
    });
  };

  // Filtered & Paginated Announcements
  const filteredAnnouncements = useMemo(() => {
    if (!search.trim()) return announcements;
    const q = search.toLowerCase();
    return announcements.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.targetAudience && a.targetAudience.toLowerCase().includes(q))
    );
  }, [announcements, search]);

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = useMemo(() => {
    return filteredAnnouncements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredAnnouncements, currentPage, itemsPerPage]);

  const getTargetBadgeVariant = (target?: string): BadgeVariant => {
    switch (target) {
      case 'SISWA': return 'success';
      case 'GURU': return 'info';
      case 'STAFF': return 'warning';
      default: return 'default';
    }
  };

  const columns: Column<Announcement>[] = [
    { 
      key: 'announcement', 
      header: 'Pengumuman', 
      render: (item) => (
        <div className="flex items-start gap-3">
          {item.posterUrl ? (
            <img 
              src={`${apiBaseUrl}${item.posterUrl}`} 
              alt={item.title} 
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
            />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              item.isPinned 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              <Megaphone size={18} />
            </div>
          )}

          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="truncate">{item.title}</span>
              {item.isPinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                  <Pin size={10} className="fill-amber-500 text-amber-500" /> Semat
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm" title={item.content}>
              {item.content}
            </p>
            {item.attachmentUrl && (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                  <Paperclip size={10} className="text-indigo-500" />
                  <span className="truncate max-w-[200px]">{item.attachmentName || 'Lampiran Dokumen'}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'target', 
      header: 'Target Audiens', 
      render: (item) => (
        <Badge variant={getTargetBadgeVariant(item.targetAudience)}>
          {item.targetAudience || 'SEMUA'}
        </Badge>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'default'}>
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      )
    },
    { 
      key: 'date', 
      header: 'Periode Tayang', 
      render: (item) => (
        <div className="flex flex-col text-xs font-medium text-slate-600 gap-1">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Calendar size={12} className="text-slate-400" /> Mulai: {item.publishDate ? new Date(item.publishDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </span>
          {item.expireDate && (
            <span className="flex items-center gap-1.5 text-rose-600">
              <Calendar size={12} /> Berakhir: {new Date(item.expireDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions', 
      header: 'Aksi', 
      render: (item: Announcement) => (
        <div className="flex justify-end">
          <ActionButtons 
            onView={() => {
              setSelectedAnnouncementForDetail(item);
              setIsDetailModalOpen(true);
            }}
            onEdit={canUpdate ? () => openModal(item) : undefined}
            onDelete={canDelete ? () => handleDelete(item.id) : undefined}
          />
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      {/* PageHeader Standar */}
      <PageHeader
        title="Pengumuman Sekolah"
        subtitle="Publikasikan informasi penting, surat edaran, dan agenda kegiatan sekolah untuk siswa, guru, maupun staf."
        action={
          canCreate ? (
            <button
              onClick={() => openModal()}
              className="btn-std-primary flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Buat Pengumuman</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Bar Bergaya Hardware Logs Filter Pattern */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Pengumuman
          </label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Cari judul, konten, atau target..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
            />
          </div>
        </div>

        {search && (
          <button
            onClick={() => setSearch('')}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
          >
            <RotateCcw size={14} />
            <span>Reset Pencarian</span>
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <DataTable 
          columns={columns}
          data={paginatedAnnouncements}
          loading={loading}
          emptyMessage="Belum ada pengumuman. Klik 'Buat Pengumuman' untuk menambahkan."
          hasPagination={filteredAnnouncements.length > 0}
        />

        {filteredAnnouncements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAnnouncements.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Modal Form Pembuatan & Edit */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 max-h-[80vh] overflow-y-auto">
          <FormField label="Judul Pengumuman" required>
            <input
              type="text"
              name="title"
              className="input-std font-medium"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Contoh: Libur Hari Raya Idul Fitri 1447 H"
            />
          </FormField>

          <FormField label="Isi Pesan Pengumuman" required>
            <textarea
              name="content"
              className="input-std min-h-[120px]"
              rows={4}
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Tuliskan pesan pengumuman secara lengkap dan jelas di sini..."
            />
          </FormField>

          {/* Bagian Unggah Berkas & Media */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud size={15} className="text-indigo-600" />
              Berkas & Media Lampiran (Opsional)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dropzone Upload Poster */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Poster / Gambar Cover</span>
                  <span className="text-[11px] text-slate-400 font-normal">Maks 5 MB (JPG/PNG/WEBP)</span>
                </label>

                {posterPreview && !removePoster ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img 
                      src={posterPreview} 
                      alt="Preview Poster" 
                      className="w-full h-32 object-cover" 
                    />
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors"
                      title="Hapus poster"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white transition-all text-center">
                    <ImageIcon size={24} className="text-slate-400" />
                    <span className="text-xs font-semibold text-indigo-600">Pilih Poster Gambar</span>
                    <span className="text-[11px] text-slate-400">Klik untuk menjelajah berkas</span>
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePosterChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Upload Dokumen SK / Berita Acara */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Lampiran Dokumen Resmi (SK/Berita Acara)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Maks 10 MB (PDF/DOCX)</span>
                </label>

                {(attachmentFile || (existingAttachmentName && !removeAttachment)) ? (
                  <div className="p-3 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={attachmentFile?.name || existingAttachmentName || ''}>
                          {attachmentFile?.name || existingAttachmentName}
                        </p>
                        {attachmentFile && (
                          <p className="text-[11px] text-slate-400">
                            {formatFileSize(attachmentFile.size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                      title="Hapus lampiran dokumen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white transition-all text-center">
                    <FileText size={24} className="text-slate-400" />
                    <span className="text-xs font-semibold text-indigo-600">Pilih Berkas Dokumen</span>
                    <span className="text-[11px] text-slate-400">PDF, DOC, atau DOCX</span>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleAttachmentChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Target Audiens" required>
              <div className="relative">
                <select
                  name="targetAudience"
                  className="input-std cursor-pointer"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  required
                >
                  <option value="SEMUA">Semua Sivitas (Siswa, Guru, Staf)</option>
                  <option value="SISWA">Hanya Siswa & Orang Tua/Wali</option>
                  <option value="GURU">Hanya Guru & Tenaga Pendidik</option>
                  <option value="STAFF">Hanya Staf Tata Usaha / Admin</option>
                </select>
              </div>
            </FormField>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Atribut Tambahan</label>
              <div className="flex items-center gap-3">
                <label className={`flex-1 flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${formData.isPinned ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <Pin size={15} className={formData.isPinned ? 'text-amber-600 fill-amber-600' : 'text-slate-400'} />
                    <span className={`text-xs font-semibold ${formData.isPinned ? 'text-amber-900' : 'text-slate-700'}`}>Sematkan di Atas</span>
                  </div>
                </label>

                <label className={`flex-1 flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${formData.isActive ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <span className={`text-xs font-semibold ${formData.isActive ? 'text-emerald-900' : 'text-slate-700'}`}>Status Aktif</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <FormField label="Tanggal Mulai Tayang">
              <input
                type="date"
                name="publishDate"
                className="input-std"
                value={formData.publishDate || ''}
                onChange={handleInputChange}
              />
            </FormField>
            
            <FormField label="Tanggal Selesai (Opsional)" hint="Kosongkan jika pengumuman berlaku seterusnya.">
              <input
                type="date"
                name="expireDate"
                className="input-std"
                value={formData.expireDate || ''}
                onChange={handleInputChange}
              />
            </FormField>
          </div>
          
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
              {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Sebarkan Pengumuman')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Pratinjau Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncementForDetail}
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAnnouncementForDetail(null);
        }}
      />

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
