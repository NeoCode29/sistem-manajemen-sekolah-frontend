import React, { useState, useMemo } from 'react';
import { Plus, Clock, Loader2, Search, RotateCcw } from 'lucide-react';
import { generatePeriodCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { PageHeader, Modal, FormField, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { useClassPeriods } from '../../hooks/useClassPeriods';
import { usePermissions } from '../../hooks/usePermissions';
import type { ClassPeriod } from '../../api/academicService';
import { notify } from '../../utils/feedback';

export const ClassPeriods: React.FC = () => {
  const {
    periods,
    loading,
    createClassPeriod,
    updateClassPeriod,
    deleteClassPeriod
  } = useClassPeriods();

  const { hasPermission } = usePermissions();
  const canCreatePeriod = hasPermission('class_periods.create') || hasPermission('academic.write');
  const canEditPeriod = hasPermission('class_periods.update') || hasPermission('academic.write');
  const canDeletePeriod = hasPermission('class_periods.delete') || hasPermission('academic.write');
  const hasActions = canEditPeriod || canDeletePeriod;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lesson' | 'break'>('all');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [code, setCode] = useState('');
  const [periodNumber, setPeriodNumber] = useState<number | string>(1);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:45');
  const [isBreak, setIsBreak] = useState(false);

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: React.ReactNode;
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

  const handleOpenAdd = () => {
    const nextNumber = periods.length + 1;
    setIsEditing(false);
    setEditId('');
    setPeriodNumber(nextNumber);
    setCode(generatePeriodCode(nextNumber, false));
    setStartTime('07:00');
    setEndTime('07:45');
    setIsBreak(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setPeriodNumber(1);
    setStartTime('07:00');
    setEndTime('07:45');
    setIsBreak(false);
    setSubmitting(false);
  };

  const handleEdit = (period: ClassPeriod) => {
    setIsEditing(true);
    setEditId(period.id);
    setCode(period.code);
    setPeriodNumber(period.periodNumber);
    setStartTime(period.startTime);
    setEndTime(period.endTime);
    setIsBreak(period.isBreak);
    setShowModal(true);
  };

  const handleDelete = (period: ClassPeriod) => {
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Jam Pelajaran (Jam Ke-${period.periodNumber})`,
      message: (
        <div>
          Apakah Anda yakin ingin menghapus alokasi{' '}
          <strong className="text-gray-900 font-semibold">Jam Ke-{period.periodNumber}</strong>{' '}
          (Kode: <code className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-mono text-xs">{period.code}</code>, Waktu: {period.startTime} - {period.endTime})?
          <p className="mt-2 text-xs text-gray-500">
            Perhatian: Menghapus jam pelajaran dapat mengosongkan slot pada jadwal pelajaran aktif.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus Jam Pelajaran',
      onConfirm: async () => {
        try {
          await deleteClassPeriod(period.id);
          notify.success(`Jam Pelajaran Ke-${period.periodNumber} berhasil dihapus`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus jam pelajaran');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      notify.warning('Kode jam pelajaran wajib diisi');
      return;
    }
    if (!startTime || !endTime) {
      notify.warning('Waktu mulai dan selesai wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: code.trim().toUpperCase(),
        periodNumber: Number(periodNumber),
        startTime,
        endTime,
        isBreak
      };

      if (isEditing) {
        await updateClassPeriod(editId, payload);
        notify.success(`Jam Pelajaran Ke-${payload.periodNumber} berhasil diperbarui`);
      } else {
        await createClassPeriod(payload);
        notify.success(`Jam Pelajaran Ke-${payload.periodNumber} berhasil ditambahkan`);
      }
      
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Terjadi kesalahan saat menyimpan jam pelajaran');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered periods
  const filteredPeriods = useMemo(() => {
    return periods.filter(p => {
      const matchSearch = !searchTerm.trim() || 
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.periodNumber).includes(searchTerm.trim()) ||
        `${p.startTime} - ${p.endTime}`.includes(searchTerm.trim());

      const matchType = 
        filterType === 'all' ||
        (filterType === 'break' && p.isBreak) ||
        (filterType === 'lesson' && !p.isBreak);

      return matchSearch && matchType;
    });
  }, [periods, searchTerm, filterType]);

  const columns: Column<ClassPeriod>[] = [
    { 
      key: 'periodNumber', 
      header: 'Jam Ke-', 
      render: (row) => (
        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
          #{row.periodNumber}
        </span>
      ) 
    },
    { 
      key: 'code', 
      header: 'Kode', 
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
          {row.code}
        </span>
      ) 
    },
    { 
      key: 'time', 
      header: 'Rentang Waktu', 
      render: (row) => (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Clock size={15} className="text-gray-400" />
          <span>{row.startTime} – {row.endTime} WIB</span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Tipe Sesi', 
      render: (row) => (
        row.isBreak ? (
          <Badge variant="warning">Istirahat</Badge>
        ) : (
          <Badge variant="success">Pelajaran</Badge>
        )
      )
    }
  ];

  if (hasActions) {
    columns.push({ 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => (
        <div className="flex items-center justify-end">
          <ActionButtons 
            onEdit={canEditPeriod ? () => handleEdit(row) : undefined}
            onDelete={canDeletePeriod ? () => handleDelete(row) : undefined}
          />
        </div>
      )
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Jam Pelajaran" 
        subtitle="Kelola alokasi waktu dan jadwal sesi pelajaran harian"
        action={
          canCreatePeriod ? (
            <button 
              type="button" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors" 
              onClick={handleOpenAdd}
            >
              <Plus size={16} /> Tambah Jam Pelajaran
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Sesi / Waktu
          </label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari jam ke-, kode, atau waktu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tipe Sesi
          </label>
          <div className="relative group">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
            >
              <option value="all">Semua Tipe Sesi</option>
              <option value="lesson">Sesi Pelajaran</option>
              <option value="break">Sesi Istirahat</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end mb-1">
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5">
            <Clock size={14} className="text-gray-400" />
            Total: {filteredPeriods.length} Sesi
          </span>
        </div>

        {Boolean(searchTerm || filterType !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
            }}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable 
          columns={columns} 
          data={filteredPeriods} 
          loading={loading}
          emptyMessage={
            searchTerm || filterType !== 'all' 
              ? 'Tidak ada jam pelajaran yang sesuai dengan kriteria filter.' 
              : 'Belum ada data jam pelajaran.'
          }
        />
      </div>

      {/* 4. Modal Tambah / Edit Jam Pelajaran */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran Baru'}
        size="lg"
      >
        <form id="period-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Jam Ke-" required>
              <input 
                type="number" 
                min="1" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-gray-800" 
                value={periodNumber} 
                onChange={(e) => {
                  const val = e.target.value;
                  setPeriodNumber(val);
                  if (!isEditing) {
                    setCode(generatePeriodCode(val, isBreak));
                  }
                }} 
                placeholder="Contoh: 1" 
                required 
              />
            </FormField>

            <FormField label="Kode Jam Pelajaran" required>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-gray-800" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  placeholder="Contoh: JP-01-A1B2" 
                  required 
                />
                <button 
                  type="button" 
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
                  onClick={() => setCode(generatePeriodCode(periodNumber, isBreak))}
                  title="Buat kode otomatis"
                >
                  Generate
                </button>
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Waktu Mulai" required>
              <input 
                type="time" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-mono" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                required 
              />
            </FormField>
            
            <FormField label="Waktu Selesai" required>
              <input 
                type="time" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-mono" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                required 
              />
            </FormField>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                checked={isBreak} 
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsBreak(val);
                  if (!isEditing) {
                    setCode(generatePeriodCode(periodNumber, val));
                  }
                }} 
              />
              <div>
                <span className="text-sm font-semibold text-gray-900 block">
                  Tandai sebagai Jam Istirahat
                </span>
                <span className="text-xs text-gray-500 block">
                  Sesi ini tidak akan dialokasikan untuk mata pelajaran di jadwal harian.
                </span>
              </div>
            </label>
          </div>

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
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
