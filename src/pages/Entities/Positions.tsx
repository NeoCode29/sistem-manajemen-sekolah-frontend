import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Loader2, 
  RefreshCw, 
  BadgeCheck, 
  Search, 
  Filter, 
  RotateCcw 
} from 'lucide-react';
import { generatePositionCode } from '../../utils/codeGenerator';
import { usePositions } from '../../hooks/usePositions';
import { usePermissions } from '../../hooks/usePermissions';
import { PageHeader, Modal, FormField, Badge, ConfirmDialog } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import type { Position } from '../../api/employeeService';
import { getRoles, type Role } from '../../api/rbacService';
import { notify } from '../../utils/feedback';

interface PositionForm {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  maxUsers: string;
  mappedRoleId: string;
}

const DEFAULT_FORM: PositionForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
  maxUsers: '',
  mappedRoleId: '',
};

export const Positions: React.FC = () => {
  const { items, loading, create, update, remove } = usePositions();
  const { 
    canCreatePosition, 
    canUpdatePosition, 
    canDeletePosition, 
    canReadPositions 
  } = usePermissions();
  const canEditPosition = canUpdatePosition;
  const canTogglePosition = canUpdatePosition;
  const hasActions = canUpdatePosition || canDeletePosition;

  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<PositionForm>(DEFAULT_FORM);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (canCreatePosition || canUpdatePosition) {
      getRoles()
        .then((data) => setRoles(data))
        .catch((err) => console.error('Gagal mengambil data roles:', err));
    }
  }, [canCreatePosition, canUpdatePosition]);

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const setField = (field: keyof PositionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openAdd = () => {
    if (!canCreatePosition) {
      notify.error('Anda tidak memiliki izin untuk membuat jabatan baru.');
      return;
    }
    setForm(DEFAULT_FORM);
    setModal({ open: true, editId: null });
  };

  const openEdit = (item: Position) => {
    if (!canUpdatePosition) {
      notify.error('Anda tidak memiliki izin untuk mengubah data jabatan.');
      return;
    }
    setForm({
      code: item.code,
      name: item.name,
      description: item.description || '',
      isActive: item.isActive,
      maxUsers: item.maxUsers !== null && item.maxUsers !== undefined ? String(item.maxUsers) : '',
      mappedRoleId: item.mappedRoleId || '',
    });
    setModal({ open: true, editId: item.id });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal({ open: false, editId: null });
    setForm(DEFAULT_FORM);
  };

  const handleDelete = (item: Position) => {
    if (!canDeletePosition) {
      notify.error('Anda tidak memiliki izin untuk menghapus jabatan.');
      return;
    }
    const isSystem = item.code === 'KEPSEK' || item.name.toLowerCase().includes('kepala sekolah');
    if (isSystem) {
      notify.error(`Jabatan "${item.name}" merupakan jabatan struktural inti sistem dan dilindungi dari penghapusan.`);
      return;
    }

    setConfirmConfig({
      open: true,
      title: 'Hapus Jabatan',
      message: `Apakah Anda yakin ingin menghapus jabatan "${item.name}" (${item.code})? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          await remove(item.id);
          notify.success(`Jabatan "${item.name}" berhasil dihapus`);
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus jabatan');
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.editId && !canUpdatePosition) {
      notify.error('Anda tidak memiliki izin untuk mengubah data jabatan.');
      return;
    }
    if (!modal.editId && !canCreatePosition) {
      notify.error('Anda tidak memiliki izin untuk membuat jabatan baru.');
      return;
    }
    if (!form.name.trim() || !form.code.trim()) {
      notify.error('Nama dan Kode Jabatan wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        code: form.code,
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        maxUsers: form.maxUsers.trim() ? parseInt(form.maxUsers, 10) : null,
        mappedRoleId: form.mappedRoleId ? form.mappedRoleId : null,
      };

      if (modal.editId) {
        await update(modal.editId, payload);
        notify.success('Data jabatan berhasil diperbarui');
      } else {
        await create(payload);
        notify.success('Jabatan baru berhasil ditambahkan');
      }
      closeModal();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan data jabatan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: Position) => {
    if (!canTogglePosition) {
      notify.error('Anda tidak memiliki izin untuk mengubah status aktif jabatan.');
      return;
    }
    try {
      const nextStatus = !item.isActive;
      await update(item.id, { isActive: nextStatus });
      notify.success(`Status jabatan "${item.name}" diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`);
    } catch (err: any) {
      notify.error(err, 'Gagal mengubah status jabatan');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || 
        i.name.toLowerCase().includes(query) || 
        i.code.toLowerCase().includes(query) ||
        (i.description && i.description.toLowerCase().includes(query));

      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && i.isActive) ||
        (statusFilter === 'INACTIVE' && !i.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const columns: Column<Position>[] = [
    { 
      key: 'code', 
      header: 'Kode', 
      render: row => (
        <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
          {row.code}
        </span>
      ) 
    },
    { 
      key: 'name', 
      header: 'Nama Jabatan', 
      render: row => {
        const isSystem = row.code === 'KEPSEK' || row.name.toLowerCase().includes('kepala sekolah');
        return (
          <div className="flex items-center gap-2 max-w-[200px] md:max-w-[250px]">
            <span 
              className="font-bold text-slate-900 truncate" 
              title={row.name}
            >
              {row.name}
            </span>
            {isSystem && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                System
              </span>
            )}
          </div>
        );
      } 
    },
    {
      key: 'mappedRole',
      header: 'Sinkronisasi Role',
      render: row => (
        row.mappedRole ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <BadgeCheck size={13} className="text-indigo-600" />
            {row.mappedRole.name}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
      )
    },
    {
      key: 'maxUsers',
      header: 'Batas Kuota',
      render: row => (
        row.maxUsers ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
            (row.activeEmployeeCount ?? 0) >= row.maxUsers
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {row.activeEmployeeCount ?? 0} / {row.maxUsers} Terisi
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Tanpa Batas</span>
        )
      )
    },
    { 
      key: 'description', 
      header: 'Deskripsi', 
      render: row => (
        <span 
          className="text-slate-500 text-xs block max-w-[200px] md:max-w-[260px] truncate" 
          title={row.description || '-'}
        >
          {row.description || '-'}
        </span>
      ) 
    },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: row => (
        <button 
          type="button" 
          onClick={() => canTogglePosition ? handleToggleActive(row) : undefined} 
          className={!canTogglePosition ? "cursor-default" : "hover:opacity-80 transition-opacity"}
          title={canTogglePosition ? "Klik untuk ubah status aktif" : undefined}
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
      render: row => {
        const isSystem = row.code === 'KEPSEK' || row.name.toLowerCase().includes('kepala sekolah');
        return (
          <ActionButtons 
            onEdit={canEditPosition ? () => openEdit(row) : undefined} 
            onDelete={canDeletePosition && !isSystem ? () => handleDelete(row) : undefined} 
          />
        );
      } 
    });
  }

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Data Jabatan"
        subtitle="Manajemen master data jabatan untuk pegawai dan tenaga pendidik"
        action={
          canCreatePosition ? (
            <button 
              type="button"
              onClick={openAdd} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus size={16} />
              <span>Tambah Jabatan</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Jabatan
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari kode, nama jabatan, atau deskripsi..."
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
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
              title="Reset seluruh filter"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Data Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable 
          columns={columns} 
          data={filteredItems} 
          loading={loading}
          emptyMessage={
            searchTerm || statusFilter !== 'ALL'
              ? 'Tidak ada data jabatan yang sesuai dengan filter pencarian.'
              : 'Belum ada master data jabatan terdaftar.'
          }
        />
      </div>

      {/* 5. Form Modal */}
      <Modal 
        open={modal.open} 
        onClose={closeModal} 
        title={modal.editId ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {(() => {
            const isSystemEdit = Boolean(modal.editId && (form.code === 'KEPSEK' || form.name.toLowerCase().includes('kepala sekolah')));
            return (
              <FormField 
                label="Kode Jabatan" 
                required 
                hint={isSystemEdit ? "Kode jabatan Kepala Sekolah dilindungi sistem dan tidak dapat diubah" : "Kode unik penanda jabatan (misal: GUR, KEP, TU)"}
              >
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    disabled={isSystemEdit}
                    className="input-std w-full px-4 py-2.5 uppercase font-mono font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed" 
                    value={form.code} 
                    onChange={setField('code')} 
                    placeholder="Contoh: KEP, WAK, GUR, STF" 
                    required 
                  />
                  {!isSystemEdit && (
                    <button 
                      type="button" 
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                      onClick={() => setForm(prev => ({ ...prev, code: generatePositionCode(prev.name) }))}
                      title="Generate kode unik otomatis dari nama"
                    >
                      <RefreshCw size={13} />
                      <span>Generate</span>
                    </button>
                  )}
                </div>
              </FormField>
            );
          })()}

          <FormField label="Nama Jabatan" required>
            <input 
              type="text" 
              className="input-std w-full px-4 py-2.5 font-bold text-slate-900" 
              value={form.name} 
              onChange={setField('name')} 
              placeholder="Contoh: Kepala Sekolah, Guru Mapel, Staf Tata Usaha" 
              required 
            />
          </FormField>

          <FormField label="Deskripsi">
            <textarea 
              className="input-std w-full px-4 py-2.5 resize-none min-h-[90px] text-slate-900" 
              value={form.description} 
              onChange={setField('description')} 
              placeholder="Tugas pokok atau deskripsi singkat jabatan..." 
            />
          </FormField>

          <FormField label="Sinkronkan dengan Role Pengguna (Mapped Role)" hint="Akun pengguna pegawai dengan jabatan ini akan otomatis disematkan role yang dipilih">
            <select
              className="input-std w-full px-4 py-2.5 text-slate-900 bg-white"
              value={form.mappedRoleId}
              onChange={setField('mappedRoleId')}
            >
              <option value="">-- Tidak Ada Sinkronisasi Role --</option>
              {roles.map((r) => (
                <option key={String(r.id)} value={String(r.id)}>
                  {r.name} ({r.guardName})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Batas Kuota Pemakai (Max Users)" hint="Batasan jumlah pegawai aktif yang boleh memegang jabatan ini. Contoh: 1 untuk Kepala Sekolah. Kosongkan untuk tanpa batas.">
            <input 
              type="number" 
              min="1"
              className="input-std w-full px-4 py-2.5 text-slate-900" 
              value={form.maxUsers} 
              onChange={setField('maxUsers')} 
              placeholder="Tanpa Batas Kuota (unlimited)" 
            />
          </FormField>

          <div className="pt-2">
            <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors w-full ${
              form.isActive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}>
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={setField('isActive')} 
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300" 
              />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-semibold ${form.isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                  Jabatan Aktif (Dapat dipilih pada entitas Pegawai)
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-slate-100">
            <button 
              type="button" 
              onClick={closeModal} 
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs md:text-sm"
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-xs md:text-sm flex items-center gap-2"
              disabled={submitting}
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              <span>{modal.editId ? 'Simpan Perubahan' : 'Tambah Jabatan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Confirm Dialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant="danger"
        onConfirm={async () => {
          await confirmConfig.onConfirm();
          setConfirmConfig(prev => ({ ...prev, open: false }));
        }}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};
