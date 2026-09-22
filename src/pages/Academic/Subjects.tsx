import React, { useState, useMemo } from 'react';
import { Plus, BookOpen, Loader2, Search, RotateCcw } from 'lucide-react';
import { generateSubjectCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { PageHeader, Modal, FormField, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { useSubjects } from '../../hooks/useSubjects';
import { usePermissions } from '../../hooks/usePermissions';
import type { Subject } from '../../api/academicService';
import { notify } from '../../utils/feedback';

export const Subjects: React.FC = () => {
  const {
    subjects,
    loading,
    createSubject,
    updateSubject,
    deleteSubject
  } = useSubjects();

  const { 
    canCreateSubject, 
    canUpdateSubject, 
    canDeleteSubject 
  } = usePermissions();
  const canEditSubject = canUpdateSubject;
  const hasActions = canEditSubject || canDeleteSubject;

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [minimumPassingGrade, setMinimumPassingGrade] = useState<number | string>(75);

  // ConfirmDialog state
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
    if (!canCreateSubject) {
      notify.error('Anda tidak memiliki izin untuk menambah data mata pelajaran.');
      return;
    }
    setIsEditing(false);
    setEditId('');
    setCode(generateSubjectCode());
    setName('');
    setMinimumPassingGrade(75);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setMinimumPassingGrade(75);
    setSubmitting(false);
  };

  const handleEdit = (subject: Subject) => {
    if (!canEditSubject) {
      notify.error('Anda tidak memiliki izin untuk mengubah data mata pelajaran.');
      return;
    }
    setIsEditing(true);
    setEditId(subject.id);
    setCode(subject.code);
    setName(subject.name);
    setMinimumPassingGrade(subject.minimumPassingGrade ?? 75);
    setShowModal(true);
  };

  const handleDelete = (subject: Subject) => {
    if (!canDeleteSubject) {
      notify.error('Anda tidak memiliki izin untuk menghapus mata pelajaran.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Mata Pelajaran "${subject.name}"`,
      message: (
        <div>
          Apakah Anda yakin ingin menghapus mata pelajaran{' '}
          <strong className="text-gray-900 font-semibold">{subject.name}</strong>{' '}
          (Kode: <code className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-mono text-xs">{subject.code}</code>)?
          <p className="mt-2 text-xs text-gray-500">
            Perhatian: Menghapus mata pelajaran dapat memengaruhi jadwal pelajaran dan komponen nilai yang terhubung.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus Mata Pelajaran',
      onConfirm: async () => {
        try {
          await deleteSubject(subject.id);
          notify.success(`Mata pelajaran "${subject.name}" berhasil dihapus`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus mata pelajaran');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && !canEditSubject) {
      notify.error('Anda tidak memiliki izin untuk mengubah data mata pelajaran.');
      return;
    }
    if (!isEditing && !canCreateSubject) {
      notify.error('Anda tidak memiliki izin untuk menambah mata pelajaran baru.');
      return;
    }

    if (!name.trim()) {
      notify.warning('Nama mata pelajaran wajib diisi');
      return;
    }
    if (!code.trim()) {
      notify.warning('Kode mata pelajaran wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        minimumPassingGrade: Number(minimumPassingGrade) || 75
      };

      if (isEditing) {
        await updateSubject(editId, payload);
        notify.success(`Mata pelajaran "${payload.name}" berhasil diperbarui`);
      } else {
        await createSubject(payload);
        notify.success(`Mata pelajaran "${payload.name}" berhasil ditambahkan`);
      }
      
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Terjadi kesalahan saat menyimpan data mata pelajaran');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered data based on search
  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjects;
    const term = searchTerm.toLowerCase();
    return subjects.filter(sub => 
      sub.name.toLowerCase().includes(term) ||
      sub.code.toLowerCase().includes(term)
    );
  }, [subjects, searchTerm]);

  const columns: Column<Subject>[] = [
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
      key: 'name', 
      header: 'Nama Mata Pelajaran', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <span 
            className="font-semibold text-gray-900 block max-w-[280px] md:max-w-[360px] truncate"
            title={row.name}
          >
            {row.name}
          </span>
        </div>
      )
    },
    { 
      key: 'minimumPassingGrade', 
      header: 'KKM (Nilai Lulus)', 
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          KKM: {row.minimumPassingGrade ?? '-'}
        </span>
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
            onEdit={canEditSubject ? () => handleEdit(row) : undefined}
            onDelete={canDeleteSubject ? () => handleDelete(row) : undefined}
          />
        </div>
      )
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Mata Pelajaran" 
        subtitle="Kelola master data mata pelajaran dan KKM kelulusan akademik"
        action={
          canCreateSubject ? (
            <button 
              type="button" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors" 
              onClick={handleOpenAdd}
            >
              <Plus size={16} /> Tambah Mata Pelajaran
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Mata Pelajaran
          </label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari kode atau nama mata pelajaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end mb-1">
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5">
            <BookOpen size={14} className="text-gray-400" />
            Total: {filteredSubjects.length} {filteredSubjects.length !== subjects.length ? `(dari ${subjects.length})` : ''} Mapel
          </span>
        </div>

        {Boolean(searchTerm) && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
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
          data={filteredSubjects} 
          loading={loading}
          emptyMessage={
            searchTerm 
              ? 'Tidak ada mata pelajaran yang sesuai dengan kata kunci pencarian.' 
              : 'Belum ada data mata pelajaran.'
          }
        />
      </div>

      {/* 4. Modal Tambah / Edit Mata Pelajaran */}
      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
        size="md"
      >
        <form id="subject-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <FormField label="Kode Mata Pelajaran" required>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-gray-800" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())} 
                placeholder="Contoh: MAT-W-10" 
                required 
              />
              <button 
                type="button" 
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
                onClick={() => setCode(generateSubjectCode(name))}
                title="Buat kode acak otomatis"
              >
                Buat Otomatis
              </button>
            </div>
          </FormField>

          <FormField label="Nama Mata Pelajaran" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Matematika Wajib Kelas X" 
              required 
            />
          </FormField>

          <FormField 
            label="KKM / Batas Kelulusan Minimum" 
            hint="Nilai minimum standar kriteria ketuntasan minimal (skala 0 - 100)."
          >
            <input 
              type="number" 
              step="0.5" 
              min="0"
              max="100"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-gray-800" 
              value={minimumPassingGrade} 
              onChange={(e) => setMinimumPassingGrade(e.target.value)} 
              placeholder="75" 
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
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
