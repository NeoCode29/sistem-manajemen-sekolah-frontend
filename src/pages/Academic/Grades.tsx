import React, { useState, useMemo } from 'react';
import { Plus, RefreshCw, Loader2, Search, Filter, RotateCcw, GraduationCap, Layers } from 'lucide-react';
import { generateGradeCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useGrades } from '../../hooks/useGrades';
import { usePermissions } from '../../hooks/usePermissions';
import type { Grade } from '../../api/academicService';
import { PageHeader, Modal, FormField, Select, Badge, ConfirmDialog } from '../../components/ui';
import { notify } from '../../utils/feedback';

export const Grades: React.FC = () => {
  const {
    grades,
    loading,
    createGrade,
    updateGrade,
    deleteGrade
  } = useGrades();

  const { hasPermission } = usePermissions();
  const canCreateGrade = hasPermission('grades.create') || hasPermission('academic.write');
  const canEditGrade = hasPermission('grades.update') || hasPermission('academic.write');
  const canDeleteGrade = hasPermission('grades.delete') || hasPermission('academic.write');
  const hasActions = canEditGrade || canDeleteGrade;

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState(10);
  const [educationLevel, setEducationLevel] = useState('SMA');
  const [searchTerm, setSearchTerm] = useState('');
  const [educationFilter, setEducationFilter] = useState<string>('ALL');

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

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setLevel(10);
    setEducationLevel('SMA');
  };

  const handleEdit = (grade: Grade) => {
    setIsEditing(true);
    setEditId(grade.id);
    setCode(grade.code);
    setName(grade.name);
    setLevel(grade.level);
    setEducationLevel(grade.educationLevel);
    setShowModal(true);
  };

  const openAdd = () => {
    setCode(generateGradeCode(educationLevel, level, name));
    setShowModal(true);
  };

  const handleDelete = (grade: Grade) => {
    setConfirmConfig({
      open: true,
      title: `Hapus Tingkat Kelas "${grade.name}"`,
      message: `Apakah Anda yakin ingin menghapus data tingkat kelas "${grade.name}" (Kode: ${grade.code})? Rombongan belajar yang terikat pada tingkat ini dapat terpengaruh.`,
      onConfirm: async () => {
        try {
          await deleteGrade(grade.id);
          notify.success(`Tingkat kelas "${grade.name}" berhasil dihapus!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus tingkat kelas');
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        code,
        name,
        level: Number(level),
        educationLevel
      };
      
      if (isEditing) {
        await updateGrade(editId, payload);
        notify.success('Data tingkat kelas berhasil diperbarui!');
      } else {
        await createGrade(payload);
        notify.success('Tingkat kelas baru berhasil ditambahkan!');
      }
      
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan tingkat kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      if (educationFilter !== 'ALL' && g.educationLevel !== educationFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          g.name.toLowerCase().includes(q) || 
          g.code.toLowerCase().includes(q) ||
          g.educationLevel.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [grades, searchTerm, educationFilter]);

  const columns: Column<Grade>[] = [
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
      header: 'Nama Tingkat', 
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
      key: 'level', 
      header: 'Level (Angka)',
      render: (row) => <span className="font-semibold text-gray-700 text-xs">Level {row.level}</span>
    },
    { 
      key: 'educationLevel', 
      header: 'Jenjang Pendidikan', 
      render: (row) => (
        <Badge variant={row.educationLevel === 'SMA' || row.educationLevel === 'SMK' ? 'purple' : 'info'}>
          {row.educationLevel}
        </Badge>
      )
    }
  ];

  if (hasActions) {
    columns.push({ 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => (
        <ActionButtons 
          onEdit={canEditGrade ? () => handleEdit(row) : undefined}
          onDelete={canDeleteGrade ? () => handleDelete(row) : undefined}
        />
      )
    });
  }

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Tingkat Kelas"
        subtitle="Kelola master data jenjang dan tingkat kelas (misal: Kelas 10, 11, 12)"
        action={
          canCreateGrade ? (
            <button 
              type="button"
              onClick={openAdd} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus size={16} />
              <span>Tambah Tingkat Baru</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Tingkat
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari kode, nama tingkat, atau jenjang..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-52 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Jenjang Pendidikan
          </label>
          <div className="relative group">
            <Layers 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
            </select>
          </div>
        </div>

        {(searchTerm || educationFilter !== 'ALL') && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setEducationFilter('ALL');
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
          data={filteredGrades} 
          loading={loading}
          emptyMessage={
            searchTerm || educationFilter !== 'ALL'
              ? 'Tidak ada tingkat kelas yang sesuai dengan kriteria filter.'
              : 'Belum ada data Tingkat Kelas. Klik tombol Tambah Tingkat Baru untuk membuat.'
          }
        />
      </div>

      {/* 4. Form Modal */}
      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Tingkat Kelas' : 'Tambah Tingkat Kelas Baru'}
      >
        <form id="grade-form" onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <FormField label="Kode Tingkat" required>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Contoh: KLS-10" 
                required 
              />
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
                onClick={() => setCode(generateGradeCode(educationLevel, level, name))}
                title="Generate kode unik otomatis"
              >
                <RefreshCw size={13} />
                Generate
              </button>
            </div>
          </FormField>

          <FormField label="Nama Tingkat" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Kelas 10, Kelas X" 
              required 
            />
          </FormField>

          <FormField label="Level Urutan (Angka)" required>
            <input 
              type="number" 
              min="1" 
              max="20"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))} 
              required 
            />
          </FormField>

          <FormField label="Jenjang Pendidikan" required>
            <Select
              wrapperClassName="w-full"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              options={[
                { value: 'SD', label: 'SD (Sekolah Dasar)' },
                { value: 'SMP', label: 'SMP (Sekolah Menengah Pertama)' },
                { value: 'SMA', label: 'SMA (Sekolah Menengah Atas)' },
                { value: 'SMK', label: 'SMK (Sekolah Menengah Kejuruan)' }
              ]}
              required
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
        variant="danger"
        confirmText="Ya, Hapus Tingkat"
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
