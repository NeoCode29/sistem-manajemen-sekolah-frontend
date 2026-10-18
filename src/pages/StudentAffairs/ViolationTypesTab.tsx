import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getViolationTypes, 
  createViolationType, 
  updateViolationType, 
  deleteViolationType, 
  type ViolationType 
} from '../../api/studentAffairsService';
import { Plus, Search, BookOpen, AlertTriangle, RotateCcw, Loader2, CheckCircle2, XCircle, Filter, RefreshCw, Sparkles } from 'lucide-react';
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

export interface ViolationTypesTabProps {
  openCreateModalTrigger?: number;
}

export const ViolationTypesTab: React.FC<ViolationTypesTabProps> = ({ openCreateModalTrigger }) => {
  const { user } = useAuth();
  const { 
    canCreateViolationType, 
    canUpdateViolationType, 
    canDeleteViolationType,
  } = usePermissions();

  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin') ?? false;

  const canCreate = isSuperAdmin || canCreateViolationType;
  const canEdit = isSuperAdmin || canUpdateViolationType;
  const canDelete = isSuperAdmin || canDeleteViolationType;
  const hasActions = canEdit || canDelete;

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

  const handleOpenModal = useCallback((item?: ViolationType) => {
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
  }, []);

  const handleCloseModal = () => {
    setModal({ open: false, editItem: null });
  };

  // Trigger modal dari PageHeader parent
  useEffect(() => {
    if (openCreateModalTrigger && openCreateModalTrigger > 0) {
      handleOpenModal();
    }
  }, [openCreateModalTrigger, handleOpenModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.editItem && !canEdit) {
      notify.error('Anda tidak memiliki izin untuk mengubah jenis pelanggaran.');
      return;
    }
    if (!modal.editItem && !canCreate) {
      notify.error('Anda tidak memiliki izin untuk menambah jenis pelanggaran.');
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

    const pointsNum = Math.max(0, Math.round(Number(form.points) || 0));

    try {
      setIsSubmitting(true);
      const payload = trimPayload({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        points: pointsNum,
        description: form.description?.trim() || undefined,
        isActive: Boolean(form.isActive),
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
    if (!canDelete) {
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
    if (!cat) return 'info';
    const lower = cat.toLowerCase();
    if (lower === 'berat') return 'danger';
    if (lower === 'sedang') return 'warning';
    return 'info';
  };

  const columns: Column<ViolationType>[] = [
    {
      key: 'code',
      header: 'Kode',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200 whitespace-nowrap inline-block">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Pelanggaran & Deskripsi',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{row.name}</span>
          {row.description ? (
            <span className="text-xs text-slate-500 truncate max-w-[420px] block" title={row.description}>
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
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center whitespace-nowrap',
      render: (row) => (
        <Badge variant={getCategoryBadgeVariant(row.category)}>
          {row.category || 'Ringan'}
        </Badge>
      ),
    },
    {
      key: 'points',
      header: 'Poin Penalti',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center whitespace-nowrap',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-2xs whitespace-nowrap">
          -{row.points || 0} Poin
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center whitespace-nowrap',
      render: (row) => (
        row.isActive !== false ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold whitespace-nowrap">
            <CheckCircle2 size={12} /> Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold whitespace-nowrap">
            <XCircle size={12} /> Nonaktif
          </span>
        )
      ),
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      sortable: false,
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (row: ViolationType) => (
        <div className="flex justify-end">
          <ActionButtons
            onEdit={canEdit ? () => handleOpenModal(row) : undefined}
            onDelete={canDelete ? () => handleDelete(row) : undefined}
          />
        </div>
      ),
    }] : []),
  ];

  // Filtering
  const filteredTypes = useMemo(() => {
    return types.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        item.code?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);

      const matchesCategory =
        !categoryFilter || item.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' ? item.isActive !== false : item.isActive === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [types, search, categoryFilter, statusFilter]);

  // Compound Client Pagination & Sorting terstandarisasi
  const { paginatedItems, pagination, sortConfig, onSortChange } = useClientPagination(
    filteredTypes,
    10,
    [search, categoryFilter, statusFilter],
    columns,
    { key: 'code', direction: 'asc' }
  );

  const hasActiveFilter = Boolean(search || categoryFilter || statusFilter);

  return (
    <div className="space-y-6">
      {/* Filter Bar Pola Standar (Students.tsx Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Aturan
          </label>
          <div className="relative group">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
              size={16}
            />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium placeholder:text-gray-400"
              placeholder="Cari kode aturan, nama, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-56 min-w-[190px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tingkat Kategori
          </label>
          <div className="relative group">
            <AlertTriangle
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
              size={16}
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

        <div className="w-full sm:w-48 min-w-[170px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Status Aturan
          </label>
          <div className="relative group">
            <Filter
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
              size={16}
            />
            <select
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Hanya Aktif</option>
              <option value="inactive">Hanya Nonaktif</option>
            </select>
          </div>
        </div>

        {hasActiveFilter && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm cursor-pointer"
              title="Reset seluruh filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}

        <div className="flex items-center ml-auto">
          <button
            type="button"
            onClick={() => fetchTypes()}
            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Muat Ulang Data Kamus"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* DataTable dengan Compound Pagination & Sorting */}
      <DataTable
        columns={columns}
        data={paginatedItems}
        loading={loading}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
        emptyMessage="Belum ada jenis pelanggaran terdaftar di kamus tata tertib yang sesuai filter."
        pagination={pagination}
      />

      {/* Modal Form Tambah / Edit Jenis Pelanggaran */}
      <Modal
        open={modal.open}
        onClose={handleCloseModal}
        title={modal.editItem ? 'Edit Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Live Preview Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs">
                {form.code.trim().toUpperCase() || 'KODE'}
              </span>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  {form.name.trim() || 'Nama Jenis Pelanggaran'}
                </span>
                <span className="text-xs text-slate-500">
                  {form.description?.trim() || 'Belum ada deskripsi aturan'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={getCategoryBadgeVariant(form.category)}>
                {form.category}
              </Badge>
              <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                -{form.points || 0} Poin
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kode Aturan" required>
              <input
                type="text"
                className="input-std font-mono uppercase font-bold"
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
                <option value="Ringan">Ringan (Pembinaan Dasar)</option>
                <option value="Sedang">Sedang (Peringatan Tertulis)</option>
                <option value="Berat">Berat (Penanganan Khusus / SP)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Nama Pelanggaran" required>
            <input
              type="text"
              className="input-std font-medium"
              placeholder="Misal: Terlambat Masuk Jam Pelajaran Pertama"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Poin Penalti Default" required>
            <input
              type="number"
              className="input-std font-bold text-rose-700"
              min={0}
              placeholder="Misal: 5"
              value={form.points}
              onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Poin ini akan otomatis menjadi nilai bawaan saat guru mencatat pelanggaran terkait.
            </span>
          </FormField>

          <FormField label="Deskripsi / Aturan Sanksi (Opsional)">
            <textarea
              className="input-std min-h-[75px]"
              rows={3}
              placeholder="Keterangan pasal tata tertib, batas toleransi, atau bentuk sanksi pendamping..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </FormField>

          {/* Modern Toggle Switch untuk Status Aturan */}
          <div 
            onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
            className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-all select-none"
          >
            <div>
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className={form.isActive ? 'text-emerald-500' : 'text-slate-400'} />
                <span>Status Aturan Kamus ({form.isActive ? 'Aktif' : 'Nonaktif'})</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {form.isActive 
                  ? 'Aturan ini aktif dan dapat dipilih oleh guru pada saat pencatatan pelanggaran siswa.' 
                  : 'Aturan ini dinonaktifkan sementara dan disembunyikan dari pilihan pencatatan.'}
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
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
