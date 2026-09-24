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
  Trash2,
  CheckCircle2,
  Clock,
  HelpCircle
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
        expireDate: '',
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

  const handleRemovePoster = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleRemoveAttachment = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

      {/* Modal Form Pembuatan & Edit — Layout 2-Panel Modern (size="xl") */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Megaphone size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </span>
              <p className="text-xs text-slate-500 font-normal">
                {editingId ? 'Perbarui konten, berkas, atau jadwal pengumuman' : 'Susun pesan dan publikasikan ke sivitas sekolah'}
              </p>
            </div>
          </div>
        }
        size="xl"
        footer={
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl">
            <p className="text-xs text-slate-400">
              * Bidang bertanda bintang wajib diisi
            </p>
            <div className="flex items-center gap-3">
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
                form="announcement-form"
                className="btn-std-primary px-6 flex items-center gap-2 shadow-sm shadow-indigo-600/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Sebarkan Pengumuman')}
              </button>
            </div>
          </div>
        }
      >
        <form id="announcement-form" onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* KOLOM KIRI: Konten Utama (7 Kolom) */}
            <div className="lg:col-span-7 space-y-4">
              <FormField label="Judul Pengumuman" required>
                <input
                  type="text"
                  name="title"
                  className="input-std font-medium py-2.5 text-sm"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Contoh: Libur Hari Raya Idul Fitri 1447 H"
                />
              </FormField>

              <FormField label="Isi Pesan Pengumuman" required>
                <textarea
                  name="content"
                  className="input-std text-sm leading-relaxed"
                  rows={6}
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  placeholder="Tuliskan isi pesan pengumuman secara rinci, jadwal, dan instruksi penting bagi penerima..."
                />
              </FormField>

              <FormField label="Target Audiens" required>
                <div className="relative">
                  <select
                    name="targetAudience"
                    className="input-std cursor-pointer py-2.5 pl-3 pr-8 font-medium text-slate-700 bg-white"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="SEMUA">🌐 Semua Sivitas (Siswa, Guru, Staf)</option>
                    <option value="SISWA">🎓 Khusus Siswa & Orang Tua/Wali</option>
                    <option value="GURU">👨‍🏫 Khusus Guru & Tenaga Pendidik</option>
                    <option value="STAFF">🏢 Khusus Staf Tata Usaha / Admin</option>
                  </select>
                </div>
              </FormField>
            </div>

            {/* KOLOM KANAN: Berkas Media & Konfigurasi (5 Kolom) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Panel 1: Media & Berkas Lampiran */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <UploadCloud size={15} className="text-indigo-600" />
                    Berkas & Media Lampiran
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Opsional</span>
                </div>

                {/* Upload Poster Banner */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <ImageIcon size={13} className="text-indigo-500" /> Poster Cover
                    </span>
                    <span className="text-[11px] text-slate-400">JPG/PNG ≤ 5MB</span>
                  </div>

                  {posterPreview && !removePoster ? (
                    <div className="p-2.5 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={posterPreview} 
                          alt="Poster Preview" 
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {posterFile ? posterFile.name : 'Poster Cover Aktif'}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <CheckCircle2 size={11} /> Siap ditayangkan
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePoster}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Hapus poster"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => posterInputRef.current?.click()}
                      className="group border border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                          <ImageIcon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            Pilih Poster Banner
                          </p>
                          <p className="text-[11px] text-slate-400">Gambar lanskap / vertikal</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Jelajah
                      </span>
                      <input
                        ref={posterInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePosterChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Upload Dokumen Resmi (SK/Berita Acara) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <FileText size={13} className="text-indigo-500" /> Dokumen Resmi (SK/Surat)
                    </span>
                    <span className="text-[11px] text-slate-400">PDF/DOCX ≤ 10MB</span>
                  </div>

                  {(attachmentFile || (existingAttachmentName && !removeAttachment)) ? (
                    <div className="p-2.5 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={attachmentFile?.name || existingAttachmentName || ''}>
                            {attachmentFile?.name || existingAttachmentName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {attachmentFile ? formatFileSize(attachmentFile.size) : 'Dokumen lampiran tersimpan'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Hapus lampiran dokumen"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => attachmentInputRef.current?.click()}
                      className="group border border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                          <Paperclip size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            Pilih Dokumen SK / Surat
                          </p>
                          <p className="text-[11px] text-slate-400">Format PDF, DOC, atau DOCX</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600 bg-slate-100 group-hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors">
                        Jelajah
                      </span>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Panel 2: Atribut & Penjadwalan Tayang */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Atribut & Penjadwalan
                </span>

                {/* Toggle Buttons: Pin & Status Aktif */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Sematkan di Atas Toggle */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                    className={`p-2.5 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      formData.isPinned 
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Pin size={15} className={formData.isPinned ? 'text-amber-600 fill-amber-500' : 'text-slate-400'} />
                      <span className="text-xs font-semibold">Sematkan</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${formData.isPinned ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                  </button>

                  {/* Status Aktif Toggle */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`p-2.5 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      formData.isActive 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      <span className="text-xs font-semibold">Status Aktif</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${formData.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {formData.isActive ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                {/* Periode Tanggal */}
                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">
                        Mulai Tayang
                      </label>
                      <input
                        type="date"
                        name="publishDate"
                        className="input-std py-1.5 text-xs"
                        value={formData.publishDate || ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">
                        Selesai (Opsional)
                      </label>
                      <input
                        type="date"
                        name="expireDate"
                        className="input-std py-1.5 text-xs"
                        value={formData.expireDate || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kosongkan tanggal selesai jika pengumuman berlaku seterusnya.
                  </p>
                </div>

              </div>

            </div>
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
