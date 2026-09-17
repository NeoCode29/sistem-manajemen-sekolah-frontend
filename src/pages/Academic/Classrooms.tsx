import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Loader2, Search, Filter, RotateCcw, Users, GraduationCap } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useClassrooms } from '../../hooks/useClassrooms';
import { usePermissions } from '../../hooks/usePermissions';
import type { Classroom } from '../../api/academicService';
import { PageHeader, Modal, FormField, Select, Badge, ConfirmDialog } from '../../components/ui';
import { generateUniqueCode } from '../../utils/codeGenerator';
import { notify } from '../../utils/feedback';

export const Classrooms: React.FC = () => {
  const navigate = useNavigate();
  const [filterGradeId, setFilterGradeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Hook for Data Layer
  const {
    classrooms,
    grades,
    majors,
    loading,
    createClassroom,
    updateClassroom,
    deleteClassroom
  } = useClassrooms(filterGradeId);

  const { hasPermission } = usePermissions();
  const canCreateClassroom = hasPermission('classrooms.create') || hasPermission('classrooms.manage');
  const canEditClassroom = hasPermission('classrooms.update') || hasPermission('classrooms.manage');
  const canDeleteClassroom = hasPermission('classrooms.delete') || hasPermission('classrooms.manage');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [gradeId, setGradeId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(30);

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setGradeId('');
    setMajorId('');
    setCode('');
    setName('');
    setCapacity(30);
  };

  const handleGenerateCode = () => {
    const selectedGrade = grades.find(g => String(g.id) === String(gradeId));
    const selectedMajor = majors.find(m => String(m.id) === String(majorId));

    const gradePart = selectedGrade ? (selectedGrade.code || selectedGrade.name).replace(/\s+/g, '') : 'KLS';
    const majorPart = selectedMajor ? `-${(selectedMajor.code || selectedMajor.name).replace(/\s+/g, '').toUpperCase()}` : '';
    const prefix = `${gradePart}${majorPart}`;

    setCode(generateUniqueCode(prefix));
  };

  const handleEdit = (classroom: Classroom) => {
    setIsEditing(true);
    setEditId(classroom.id);
    setGradeId(classroom.gradeId);
    setMajorId(classroom.majorId || '');
    setCode(classroom.code);
    setName(classroom.name);
    setCapacity(classroom.capacity || 30);
    setShowModal(true);
  };

  const handleDelete = (classroom: Classroom) => {
    setConfirmConfig({
      open: true,
      title: `Hapus Rombel "${classroom.name}"`,
      message: `Apakah Anda yakin ingin menghapus rombongan belajar "${classroom.name}" (Kode: ${classroom.code})? Data jadwal pelajaran dan penempatan siswa pada kelas ini dapat terpengaruh.`,
      onConfirm: async () => {
        try {
          await deleteClassroom(classroom.id);
          notify.success(`Rombel "${classroom.name}" berhasil dihapus!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          notify.error(error, 'Gagal menghapus rombel kelas');
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        gradeId: Number(gradeId),
        majorId: majorId ? Number(majorId) : null,
        code,
        name,
        capacity: Number(capacity)
      };

      if (isEditing) {
        await updateClassroom(editId, payload);
        notify.success('Data rombel berhasil diperbarui!');
      } else {
        await createClassroom(payload);
        notify.success('Rombel baru berhasil ditambahkan!');
      }
      
      handleCloseModal();
    } catch (error: any) {
      notify.error(error, 'Gagal menyimpan rombel kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    if (grades.length > 0 && !gradeId) {
      setGradeId(grades[0].id);
    }
    setShowModal(true);
  };

  const filteredClassrooms = useMemo(() => {
    if (!searchTerm.trim()) return classrooms;
    const q = searchTerm.toLowerCase();
    return classrooms.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) ||
      (c.major?.name && c.major.name.toLowerCase().includes(q))
    );
  }, [classrooms, searchTerm]);
  
  const paginatedClassrooms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClassrooms.slice(start, start + itemsPerPage);
  }, [filteredClassrooms, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage);

  const gradeOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Tingkat' },
      ...grades.map(g => ({ value: g.id, label: `${g.name} (${g.educationLevel})` }))
    ];
  }, [grades]);

  // DataTable Columns Configuration
  const classroomColumns: Column<Classroom>[] = [
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
      header: 'Nama Rombel',
      render: (row) => (
        <span 
          className="font-semibold text-gray-900 block max-w-[180px] md:max-w-[220px] truncate" 
          title={row.name}
        >
          {row.name}
        </span>
      )
    },
    { 
      key: 'grade', 
      header: 'Tingkat', 
      render: (row) => (
        <Badge variant="purple" className="max-w-[140px] truncate">
          {row.grade?.name || '-'}
        </Badge>
      ) 
    },
    { 
      key: 'major', 
      header: 'Jurusan', 
      render: (row) => {
        const majorName = row.major?.name || '-';
        return (
          <span 
            className="text-xs text-gray-600 font-medium block max-w-[180px] md:max-w-[240px] truncate" 
            title={majorName}
          >
            {majorName}
          </span>
        );
      } 
    },
    { 
      key: 'capacity', 
      header: 'Kapasitas', 
      render: (row) => (
        <span className="text-xs text-gray-700 font-medium">
          {row.capacity || 0} Siswa
        </span>
      ) 
    },
    { 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => (
        <ActionButtons 
          onView={() => navigate(`/academic/classrooms/${row.id}`)}
          onEdit={canEditClassroom ? () => handleEdit(row) : undefined}
          onDelete={canDeleteClassroom ? () => handleDelete(row) : undefined}
        />
      )
    }
  ];

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Rombongan Belajar (Kelas)"
        subtitle="Kelola master data Rombel, ruang kelas, dan kapasitas siswa"
        action={
          canCreateClassroom ? (
            <button 
              type="button"
              onClick={openAddModal} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus size={16} />
              <span>Tambah Rombel</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Rombel
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari kode, nama rombel, atau jurusan..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="w-full sm:w-52 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tingkat Kelas
          </label>
          <div className="relative group">
            <GraduationCap 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={filterGradeId}
              onChange={(e) => {
                setFilterGradeId(e.target.value);
                setCurrentPage(1);
              }}
            >
              {gradeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || filterGradeId) && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterGradeId('');
                setCurrentPage(1);
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
          columns={classroomColumns} 
          data={paginatedClassrooms} 
          loading={loading}
          emptyMessage={
            searchTerm || filterGradeId
              ? 'Tidak ada rombel yang cocok dengan kriteria filter.'
              : 'Belum ada data Rombel. Klik tombol Tambah Rombel untuk membuat baru.'
          }
          containerClassName="w-full overflow-x-auto"
        />
        
        {!loading && filteredClassrooms.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClassrooms.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Form Modal */}
      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Rombel / Kelas' : 'Tambah Rombel / Kelas Baru'}
      >
        <form id="classroom-form" onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <FormField label="Tingkat / Level" required>
            <Select
              wrapperClassName="w-full"
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Tingkat Kelas --' },
                ...grades.map(g => ({ value: g.id, label: `${g.name} (${g.educationLevel})` }))
              ]}
              required
            />
          </FormField>

          <FormField label="Jurusan (Opsional)">
            <Select
              wrapperClassName="w-full"
              value={majorId}
              onChange={(e) => setMajorId(e.target.value)}
              options={[
                { value: '', label: 'Umum / Tidak Ada Jurusan' },
                ...majors.map(m => ({ value: m.id, label: `${m.name} (${m.code})` }))
              ]}
            />
          </FormField>

          <FormField label="Kode Rombel" required>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Contoh: X-IPA-1" 
                required 
              />
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors whitespace-nowrap"
                onClick={handleGenerateCode}
                title="Generate kode unik otomatis"
              >
                <RefreshCw size={13} />
                Generate
              </button>
            </div>
          </FormField>

          <FormField label="Nama Rombel" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Kelas X MIPA 1" 
              required 
            />
          </FormField>

          <FormField label="Kapasitas Maksimal Siswa" required>
            <input 
              type="number" 
              min="1" 
              max="100" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={capacity} 
              onChange={(e) => setCapacity(Number(e.target.value))} 
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
        confirmText="Ya, Hapus Rombel"
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
