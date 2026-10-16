import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getViolationTypes, 
  createViolationType, 
  updateViolationType, 
  deleteViolationType, 
  type ViolationType 
} from '../../api/studentAffairsService';
import { Plus, Search, BookOpen, AlertTriangle, RotateCcw, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, FormField, Badge, type BadgeVariant } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { useClientPagination } from '../../hooks/useClientPagination';
import { notify } from '../../utils/feedback';
import { trimPayload } from '../../utils/formSanitizer';

interface ViolationTypeForm {
  code: string;
  name: string;
  category: string;
  points: number | string;
  description: string;
  isActive: boolean;
}

const DEFAULT_FORM: ViolationTypeForm = {
  code: '',
  name: '',
  category: 'Ringan',
  points: 5,
  description: '',
  isActive: true,
};

export const ViolationTypesTab: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const isSuperAdmin = user?.roles?.some(r => 
    r.name === 'Super Admin' || r.name === 'Admin Sekolah' || r.name === 'Kepala Sekolah' || r.name === 'Staf Kesiswaan'
  ) ?? false;

  const canManage = isSuperAdmin || hasPermission('violation_types.manage') || hasPermission('violations.manage');

  const [types, setTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modal, setModal] = useState<{ open: boolean; editItem: ViolationType | null }>({
    open: false,
    editItem: null,
  });
  const [form, setForm] = useState<ViolationTypeForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    action: async () => {},
  });

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getViolationTypes();
      setTypes(data);
    } catch (err: any) {
      notify.error(err, 'Gagal memuat kamus tata tertib pelanggaran');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Filtering
  const filteredTypes = useMemo(() => {
    return types.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        item.code?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);

      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' ? item.isActive !== false : item.isActive === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [types, search, categoryFilter, statusFilter]);

  // Compound Pagination
  const { paginatedItems, pagination } = useClientPagination(filteredTypes, 10, [search, categoryFilter, statusFilter]);

  const handleOpenModal = (item?: ViolationType) => {
    if (item) {
      setForm({
        code: item.code || '',
        name: item.name || '',
        category: item.category || 'Ringan',
        points: item.points ?? 5,
        description: item.description || '',
        isActive: item.isActive !== false,
      });
      setModal({ open: true, editItem: item });
    } else {
      setForm(DEFAULT_FORM);
      setModal({ open: true, editItem: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, editItem: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      notify.error('Anda tidak memiliki izin untuk mengelola kamus jenis pelanggaran.');
      return;
    }

    if (!form.code.trim()) {
      notify.warning('Kode jenis pelanggaran wajib diisi.');
      return;
    }

    if (!form.name.trim()) {
      notify.warning('Nama jenis pelanggaran wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = trimPayload({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        points: Number(form.points) || 0,
        description: form.description?.trim() || null,
        isActive: form.isActive,
      });

      if (modal.editItem) {
        await updateViolationType(modal.editItem.id, payload);
        notify.success('Jenis pelanggaran berhasil diperbarui');
      } else {
        await createViolationType(payload);
        notify.success('Jenis pelanggaran baru berhasil ditambahkan');
      }

      handleCloseModal();
      fetchTypes();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan jenis pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: ViolationType) => {
    if (!canManage) {
      notify.error('Anda tidak memiliki izin untuk menghapus jenis pelanggaran.');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Hapus Jenis Pelanggaran',
      message: `Apakah Anda yakin ingin menghapus aturan "${item.code} - ${item.name}"? Pastikan tidak ada data pelanggaran siswa yang terkait.`,
      variant: 'danger',
      action: async () => {
        try {
          await deleteViolationType(item.id);
          notify.success('Jenis pelanggaran berhasil dihapus');
          fetchTypes();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus jenis pelanggaran');
        }
      },
    });
  };

  const getCategoryBadgeVariant = (cat?: string): BadgeVariant => {
    if (!cat) return 'default';
    if (cat.toLowerCase() === 'berat') return 'danger';
    if (cat.toLowerCase() === 'sedang') return 'warning';
    return 'default';
  };

  const columns: Column<ViolationType>[] = [
    {
      key: 'code',
      header: 'Kode',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Pelanggaran & Deskripsi',
      render: (row) => (
        <div className="flex flex-col gap-0.5 max-w-[320px]">
          <span className="font-bold text-slate-900 text-sm">{row.name}</span>
          {row.description ? (
            <span className="text-xs text-slate-500 truncate" title={row.description}>
              {row.description}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Tidak ada deskripsi</span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Tingkat Kategori',
      render: (row) => (
        <Badge variant={getCategoryBadgeVariant(row.category)}>
          {row.category || 'Ringan'}
        </Badge>
      ),
    },
    {
      key: 'points',
      header: 'Poin Penalti',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-2xs">
          -{row.points || 0} Poin
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        row.isActive !== false ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold">
            <XCircle size={12} /> Nonaktif
          </span>
        )
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      header: 'Aksi',
      render: (row: ViolationType) => (
        <div className="flex justify-end">
          <ActionButtons
            onEdit={() => handleOpenModal(row)}
            onDelete={() => handleDelete(row)}
          />
        </div>
      ),
    }] : []),
  ];

  const hasActiveFilter = Boolean(search || categoryFilter || statusFilter);

  return (
    <div className="space-y-6">
      {/* Header Info & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-md border border-gray-100 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Kamus Tata Tertib & Standar Poin</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar acuan resmi jenis pelanggaran dan bobot poin penalti yang berlaku di sekolah
            </p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn-std-primary flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => handleOpenModal()}
          >
            <Plus size={16} /> Tambah Jenis Pelanggaran
          </button>
        )}
      </div>

      {/* Hardware Logs Filter Pattern */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Pencarian Aturan
            </label>
            <div className="relative group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors"
                size={17}
              />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                placeholder="Cari kode aturan, nama pelanggaran, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Kategori
            </label>
            <div className="relative group">
              <AlertTriangle
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors"
                size={17}
              />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                <option value="Ringan">Pelanggaran Ringan</option>
                <option value="Sedang">Pelanggaran Sedang</option>
                <option value="Berat">Pelanggaran Berat</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Status Aturan
            </label>
            <select
              className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Hanya Aktif</option>
              <option value="inactive">Hanya Nonaktif</option>
            </select>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm self-stretch md:self-end cursor-pointer shrink-0"
              title="Reset seluruh filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* DataTable dengan Compound Pagination */}
      <DataTable
        columns={columns}
        data={paginatedItems}
        loading={loading}
        emptyMessage="Belum ada jenis pelanggaran terdaftar di kamus tata tertib."
        pagination={pagination}
      />

      {/* Modal Form Tambah / Edit */}
      <Modal
        open={modal.open}
        onClose={handleCloseModal}
        title={modal.editItem ? 'Edit Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kode Aturan" required>
              <input
                type="text"
                className="input-std font-mono uppercase"
                placeholder="Misal: TTR-01"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Tingkat Kategori" required>
              <select
                className="input-std cursor-pointer"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
              </select>
            </FormField>
          </div>

          <FormField label="Nama Pelanggaran" required>
            <input
              type="text"
              className="input-std"
              placeholder="Misal: Terlambat Masuk Jam Pelajaran Pertama"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Poin Penalti Default" required>
            <input
              type="number"
              className="input-std font-semibold"
              min={0}
              placeholder="Misal: 5"
              value={form.points}
              onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Deskripsi / Aturan Sanksi (Opsional)">
            <textarea
              className="input-std min-h-[75px]"
              rows={3}
              placeholder="Keterangan pasal, batas toleransi, atau sanksi pendamping..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </FormField>

          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              id="isActiveToggle"
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
              Status Aturan Aktif (Bisa dipilih pada saat pencatatan pelanggaran siswa)
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="btn-std-secondary px-5"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-std-primary px-6 flex items-center gap-2 cursor-pointer"
              disabled={isSubmitting || !form.code.trim() || !form.name.trim()}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Menyimpan...' : modal.editItem ? 'Simpan Perubahan' : 'Tambah Jenis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ConfirmDialog Hapus */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onClose={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
};
