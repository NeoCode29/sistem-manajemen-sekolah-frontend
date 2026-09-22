import React, { useState, useMemo } from 'react';
import { Plus, RefreshCw, Loader2, Search, Filter, RotateCcw, Award } from 'lucide-react';
import { generateMajorCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useMajors } from '../../hooks/useMajors';
import { usePermissions } from '../../hooks/usePermissions';
import type { Major } from '../../api/academicService';
import { PageHeader, Modal, FormField, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { notify } from '../../utils/feedback';

export const Majors: React.FC = () => {
  const {
    majors,
    loading,
    createMajor,
    updateMajor,
    toggleActive,
    deleteMajor
  } = useMajors();

  const { 
    canCreateMajor, 
    canUpdateMajor, 
    canDeleteMajor, 
    canToggleMajor, 
    canReadMajors 
  } = usePermissions();
  const canEditMajor = canUpdateMajor;
  const hasActions = canEditMajor || canDeleteMajor;

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
    setCode('');
    setName('');
    setDescription('');
  };

  const handleEdit = (major: Major) => {
    if (!canEditMajor) {
      notify.error('Anda tidak memiliki izin untuk mengubah data jurusan.');
      return;
    }
    setIsEditing(true);
    setEditId(major.id);
    setCode(major.code);
    setName(major.name);
    setDescription(major.description || '');
    setShowModal(true);
  };

  const openAdd = () => {
    if (!canCreateMajor) {
      notify.error('Anda tidak memiliki izin untuk membuat jurusan baru.');
      return;
    }
    setCode(generateMajorCode());
    setShowModal(true);
  };

  const handleDelete = (major: Major) => {
    if (!canDeleteMajor) {
      notify.error('Anda tidak memiliki izin untuk menghapus jurusan.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Jurusan "${major.name}"`,
      message: `Apakah Anda yakin ingin menghapus data jurusan "${major.name}" (Kode: ${major.code})? Rombongan belajar dan mata pelajaran peminatan terkait mungkin akan terpengaruh.`,
      confirmText: 'Ya, Hapus Jurusan',
      onConfirm: async () => {
        try {
          await deleteMajor(major.id);
          notify.success(`Jurusan "${major.name}" berhasil dihapus!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus jurusan');
        }
      }
    });
  };

  const handleToggleStatus = (major: Major) => {
    if (!canToggleMajor) {
      notify.error('Anda tidak memiliki izin untuk mengubah status aktif jurusan.');
      return;
    }
    const nextStatus = !major.isActive;
    setConfirmConfig({
      open: true,
      variant: 'warning',
      title: `Ubah Status Jurusan "${major.name}"`,
      message: `Apakah Anda yakin ingin ${nextStatus ? 'mengaktifkan' : 'menonaktifkan'} jurusan "${major.name}"?`,
      confirmText: `Ya, ${nextStatus ? 'Aktifkan' : 'Nonaktifkan'}`,
      onConfirm: async () => {
        try {
          await toggleActive(major.id);
          notify.success(`Status jurusan "${major.name}" diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal mengubah status jurusan');
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && !canEditMajor) {
      notify.error('Anda tidak memiliki izin untuk mengubah data jurusan.');
      return;
    }
    if (!isEditing && !canCreateMajor) {
      notify.error('Anda tidak memiliki izin untuk membuat jurusan baru.');
      return;
    }
    if (!name.trim() || !code.trim()) {
      notify.error('Nama dan Kode Jurusan wajib diisi.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        code,
        name,
        description
      };

      if (isEditing) {
        await updateMajor(editId, payload);
        notify.success('Data jurusan berhasil diperbarui!');
      } else {
        await createMajor(payload);
        notify.success('Jurusan baru berhasil ditambahkan!');
      }
      
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan jurusan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMajors = useMemo(() => {
    return majors.filter(m => {
      if (statusFilter === 'ACTIVE' && !m.isActive) return false;
      if (statusFilter === 'INACTIVE' && m.isActive) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          m.name.toLowerCase().includes(q) || 
          m.code.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [majors, searchTerm, statusFilter]);

  const columns: Column<Major>[] = [
    { 
      key: 'code', 
      header: 'Kode', 
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          {row.code}
        </span>
      ) 
    },
    { 
      key: 'name', 
      header: 'Nama Jurusan', 
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
      key: 'description', 
      header: 'Deskripsi', 
      render: (row) => (
        <span 
          className="text-gray-600 text-xs block max-w-[260px] md:max-w-[360px] truncate" 
          title={row.description || '-'}
        >
          {row.description || '-'}
        </span>
      ) 
    },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: (row) => (
        <button 
          type="button"
          onClick={() => canToggleMajor ? handleToggleStatus(row) : undefined} 
          className={!canToggleMajor ? "cursor-default" : "hover:opacity-80 transition-opacity"}
          title={canToggleMajor ? "Klik untuk ubah status aktif" : undefined}
        >
          <Badge variant={row.isActive ? 'success' : 'danger'}>
            {row.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </button>
      )
    }
  ];

  if (hasActions) {
    columns.push({ 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => (
        <ActionButtons 
          onEdit={canEditMajor ? () => handleEdit(row) : undefined}
          onDelete={canDeleteMajor ? () => handleDelete(row) : undefined}
        />
      )
    });
  }

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Jurusan (Program Keahlian)"
        subtitle="Kelola master data program keahlian dan jurusan sekolah"
        action={
          canCreateMajor ? (
            <button 
              type="button"
              onClick={openAdd} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus size={16} />
              <span>Tambah Jurusan</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Jurusan
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari kode, nama jurusan, atau deskripsi..."
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
          data={filteredMajors} 
          loading={loading}
          emptyMessage={
            searchTerm || statusFilter !== 'ALL'
              ? 'Tidak ada jurusan yang sesuai dengan kriteria filter.'
              : 'Belum ada data Jurusan. Klik tombol Tambah Jurusan untuk membuat baru.'
          }
        />
      </div>

      {/* 4. Form Modal */}
      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}
      >
        <form id="major-form" onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <FormField label="Kode Jurusan" required>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Contoh: IPA, IPS, RPL" 
                required 
              />
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
                onClick={() => setCode(generateMajorCode(name))}
                title="Generate kode unik otomatis"
              >
                <RefreshCw size={13} />
                Generate
              </button>
            </div>
          </FormField>

          <FormField label="Nama Jurusan" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Ilmu Pengetahuan Alam" 
              required 
            />
          </FormField>

          <FormField label="Deskripsi">
            <textarea 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Keterangan opsional mengenai jurusan ini..."
              rows={3}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" 
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Standard ConfirmDialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
