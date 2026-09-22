import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, XCircle, Loader2, Search, Filter, RotateCcw, Calendar } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import { usePermissions } from '../../hooks/usePermissions';
import type { AcademicYear } from '../../api/academicService';
import { PageHeader, Modal, FormField, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { notify } from '../../utils/feedback';

export const AcademicYears: React.FC = () => {
  const {
    years,
    loading,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    toggleAcademicYearActive
  } = useAcademicYears();

  const {
    canCreateAcademicYear,
    canUpdateAcademicYear,
    canDeleteAcademicYear,
    canToggleAcademicYear,
    canReadAcademicYears
  } = usePermissions();
  const canCreate = canCreateAcademicYear;
  const canEdit = canUpdateAcademicYear;
  const canDelete = canDeleteAcademicYear;
  const canToggle = canToggleAcademicYear;
  const canManageAcademic = canCreate || canEdit || canDelete || canToggle;

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setName('');
  };

  const openAdd = () => {
    if (!canCreate) {
      notify.error('Anda tidak memiliki izin untuk menambah tahun ajaran baru.');
      return;
    }
    handleCloseModal();
    setShowModal(true);
  };

  const handleEdit = (year: AcademicYear) => {
    if (!canEdit) {
      notify.error('Anda tidak memiliki izin untuk mengubah data tahun ajaran.');
      return;
    }
    setIsEditing(true);
    setEditId(year.id);
    setName(year.name);
    setShowModal(true);
  };

  const handleToggle = (year: AcademicYear) => {
    if (!canToggle) {
      notify.error('Anda tidak memiliki izin untuk mengubah status aktif tahun ajaran.');
      return;
    }
    const nextStatus = !year.isActive;
    setConfirmConfig({
      open: true,
      variant: 'warning',
      title: `${nextStatus ? 'Aktifkan' : 'Nonaktifkan'} Tahun Ajaran "${year.name}"`,
      message: nextStatus
        ? `Mengaktifkan Tahun Ajaran "${year.name}" akan menjadikannya sebagai periode akademik aktif utama pada sistem sekolah.`
        : `Menonaktifkan Tahun Ajaran "${year.name}" akan membuat periode akademik ini tidak lagi aktif. Pastikan ada tahun ajaran lain yang disiapkan.`,
      confirmText: nextStatus ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
      onConfirm: async () => {
        try {
          await toggleAcademicYearActive(year.id);
          notify.success(`Status Tahun Ajaran "${year.name}" berhasil diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal mengubah status tahun ajaran');
        }
      }
    });
  };

  const handleDelete = (year: AcademicYear) => {
    if (!canDelete) {
      notify.error('Anda tidak memiliki izin untuk menghapus tahun ajaran.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Tahun Ajaran "${year.name}"`,
      message: `Apakah Anda yakin ingin menghapus Tahun Ajaran "${year.name}" beserta semester bawaannya? Tahun Ajaran hanya dapat dihapus jika belum ada data siswa, rombel, jadwal, atau nilai yang terikat.`,
      confirmText: 'Ya, Hapus Tahun Ajaran',
      onConfirm: async () => {
        try {
          await deleteAcademicYear(year.id);
          notify.success(`Tahun Ajaran "${year.name}" berhasil dihapus!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus tahun ajaran');
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && !canEdit) {
      notify.error('Anda tidak memiliki izin untuk mengubah data tahun ajaran.');
      return;
    }
    if (!isEditing && !canCreate) {
      notify.error('Anda tidak memiliki izin untuk menambah tahun ajaran baru.');
      return;
    }

    const match = name.trim().match(/^(\d{4})\/(\d{4})$/);
    if (!match) {
      notify.warning('Format Tahun Ajaran harus YYYY/YYYY (contoh: 2027/2028)');
      return;
    }
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);
    if (endYear !== startYear + 1) {
      notify.warning(`Tahun akhir harus tepat 1 tahun setelah tahun awal (contoh: ${startYear}/${startYear + 1})`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = { name: name.trim() };
      if (isEditing) {
        await updateAcademicYear(editId, payload);
        notify.success('Tahun Ajaran berhasil diperbarui!');
      } else {
        await createAcademicYear(payload);
        notify.success('Tahun Ajaran baru beserta semester Ganjil & Genap berhasil ditambahkan!');
      }
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan tahun ajaran');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredYears = useMemo(() => {
    return years.filter(y => {
      if (statusFilter === 'ACTIVE' && !y.isActive) return false;
      if (statusFilter === 'INACTIVE' && y.isActive) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!y.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [years, searchTerm, statusFilter]);

  const columns: Column<AcademicYear>[] = [
    { 
      key: 'name', 
      header: 'Nama Tahun Ajaran', 
      render: (row) => (
        <span 
          className="font-semibold text-gray-900 block max-w-[200px] md:max-w-[260px] truncate" 
          title={row.name}
        >
          {row.name}
        </span>
      ) 
    },
    {
      key: 'semesters',
      header: 'Semester Bawaan',
      render: (row) => (
        row.semesters && row.semesters.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {row.semesters.map((s: any) => (
              <span
                key={s.id}
                className={`text-xs px-2.5 py-0.5 rounded-md border font-medium ${
                  s.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {s.name} {s.isActive && '(Aktif)'}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">Otomatis (Ganjil & Genap)</span>
        )
      ),
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (row) => (
        <button
          type="button"
          onClick={() => canToggle ? handleToggle(row) : undefined}
          className={!canToggle ? "cursor-default" : "hover:opacity-80 transition-opacity"}
          title={canToggle ? "Klik untuk ubah status aktif" : undefined}
        >
          <Badge variant={row.isActive ? 'success' : 'default'}>
            {row.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </button>
      )
    }
  ];

  if (canManageAcademic) {
    columns.push({ 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => (
        <div className="flex items-center gap-2">
          {canToggle && (
            <button 
              type="button"
              className={`p-1.5 rounded-lg transition-colors ${
                row.isActive 
                  ? 'text-amber-600 hover:bg-amber-50' 
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => handleToggle(row)}
              title={row.isActive ? 'Nonaktifkan Tahun Ajaran' : 'Aktifkan Tahun Ajaran'}
            >
              {row.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
            </button>
          )}
          <ActionButtons 
            onEdit={canEdit ? () => handleEdit(row) : undefined}
            onDelete={canDelete ? () => handleDelete(row) : undefined}
          />
        </div>
      )
    });
  }

  const activeYear = years.find(y => y.isActive);

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Tahun Ajaran"
        subtitle="Kelola master data Tahun Ajaran dan periode semester akademik"
        action={
          canCreate ? (
            <button 
              type="button"
              onClick={openAdd} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Tambah Tahun Ajaran</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Tahun Ajaran
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari tahun ajaran (contoh: 2026/2027)..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-52 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Status Keaktifan
          </label>
          <div className="relative group">
            <Filter 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>
          </div>
        </div>

        {(searchTerm || statusFilter !== 'ALL') && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Data Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable 
          columns={columns} 
          data={filteredYears} 
          loading={loading}
          emptyMessage={
            searchTerm || statusFilter !== 'ALL'
              ? 'Tidak ada tahun ajaran yang sesuai dengan kriteria filter.'
              : 'Belum ada data Tahun Ajaran. Klik tombol Tambah Tahun Ajaran untuk membuat baru.'
          }
        />
      </div>

      {/* Modal Tambah / Edit */}
      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button 
              type="button" 
              className="btn-std-secondary" 
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="btn-std-primary" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Tahun Ajaran'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Nama Tahun Ajaran" required>
            <input
              type="text"
              className="input-std"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: 2027/2028"
              required
              disabled={submitting}
            />
            <span className="text-xs text-gray-500 mt-1.5 block leading-relaxed">
              Format wajib: <strong>YYYY/YYYY</strong> (contoh: 2027/2028). Semester Ganjil dan Genap akan otomatis dibuat oleh sistem saat Tahun Ajaran baru disimpan.
            </span>
          </FormField>
        </form>
      </Modal>

      {/* Modern Confirm Dialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};
