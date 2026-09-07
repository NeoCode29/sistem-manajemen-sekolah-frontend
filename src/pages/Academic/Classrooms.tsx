import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, Filter, ChevronDown } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useClassrooms } from '../../hooks/useClassrooms';
import { usePermissions } from '../../hooks/usePermissions';
import type { Classroom } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField } from '../../components/ui';

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
  const { canManageAcademic } = usePermissions();

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [gradeId, setGradeId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(30);
  const { showConfirm, showAlert } = useDialog();

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

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this classroom?', async () => {
      try {
        await deleteClassroom(id);
      } catch (error) {
        showAlert('Failed to delete classroom', 'Gagal');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        gradeId: Number(gradeId),
        majorId: majorId ? Number(majorId) : null,
        code,
        name,
        capacity: Number(capacity)
      };

      if (isEditing) {
        await updateClassroom(editId, payload);
      } else {
        await createClassroom(payload);
      }
      
      handleCloseModal();
    } catch (error: any) {
      showAlert(error.message || 'Failed to save classroom', 'Gagal');
    }
  };

  const openAddModal = () => {
    if (grades.length > 0 && !gradeId) {
      setGradeId(grades[0].id);
    }
    setShowModal(true);
  };

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paginatedClassrooms = filteredClassrooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage);

  // DataTable Columns Configuration
  const classroomColumns: Column<Classroom>[] = [
    { key: 'code', header: 'Kode', render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: 'name', header: 'Nama Rombel' },
    { key: 'major', header: 'Jurusan', render: (row) => row.major?.name || '-' },
    { key: 'grade', header: 'Tingkat', render: (row) => <span className="grade-badge">{row.grade?.name || '-'}</span> },
    { key: 'capacity', header: 'Kapasitas', render: (row) => (
        <span className="text-gray-700">
          {row.capacity || 0} Siswa
        </span>
      ) 
    }
  ];

  if (canManageAcademic) {
    classroomColumns.push({ key: 'actions', header: 'Aksi', render: (row) => (
        <ActionButtons 
          onView={() => navigate(`/academic/classrooms/${row.id}`)}
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDelete(row.id)}
        />
      )
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Rombongan Belajar (Kelas)"
        subtitle="Kelola master data Rombel/Ruang Kelas"
        action={canManageAcademic ? <button onClick={openAddModal} className="btn-std-primary"><Plus size={18} /> Tambah Data</button> : undefined}
      />

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mt-6 mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Cari Kode atau Nama Rombel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="w-full md:w-64 relative group">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors z-10" size={18} />
          <select className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer relative z-0" value={filterGradeId} onChange={(e) => { setFilterGradeId(e.target.value); setCurrentPage(1); }}>
            <option value="">Semua Tingkat</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.educationLevel})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 flex flex-col">
        <DataTable 
          columns={classroomColumns} 
          data={paginatedClassrooms} 
          loading={loading}
          emptyMessage="Belum ada data Rombel."
          containerClassName="w-full overflow-x-auto"
        />
        
        {!loading && filteredClassrooms.length > 0 && (
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
        )}
      </div>

      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Rombel / Kelas' : 'Tambah Rombel / Kelas'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleSubmit}>Simpan</button>
          </div>
        }
      >
        <form id="classroom-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Tingkat / Level" required>
            <select className="input-std" value={gradeId} onChange={(e) => setGradeId(e.target.value)} required>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.educationLevel})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Jurusan">
            <select className="input-std" value={majorId} onChange={(e) => setMajorId(e.target.value)}>
              <option value="">-- Tidak Ada Jurusan --</option>
              {majors.filter(m => m.isActive).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Kode" required>
            <input type="text" className="input-std" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: 10-IPA-1" required />
          </FormField>
          <FormField label="Nama Rombel" required>
            <input type="text" className="input-std" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: X MIPA 1" required />
          </FormField>
          <FormField label="Kapasitas Maksimal Siswa">
            <input type="number" className="input-std" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
