import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useClassrooms } from '../../hooks/useClassrooms';
import type { Classroom } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const Classrooms: React.FC = () => {
  const navigate = useNavigate();
  const [filterGradeId, setFilterGradeId] = useState('');
  
  // Custom Hook for Data Layer
  const {
    classrooms,
    grades,
    loading,
    createClassroom,
    updateClassroom,
    deleteClassroom
  } = useClassrooms(filterGradeId);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [gradeId, setGradeId] = useState('');
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
    setCode('');
    setName('');
    setCapacity(30);
  };

  const handleEdit = (classroom: Classroom) => {
    setIsEditing(true);
    setEditId(classroom.id);
    setGradeId(classroom.gradeId);
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

  const paginatedClassrooms = classrooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(classrooms.length / itemsPerPage);

  // DataTable Columns Configuration
  const classroomColumns: Column<Classroom>[] = [
    { key: 'code', header: 'Kode', render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: 'name', header: 'Nama Rombel' },
    { key: 'grade', header: 'Tingkat', render: (row) => <span className="grade-badge">{row.grade?.name || '-'}</span> },
    { key: 'capacity', header: 'Kapasitas', render: (row) => (
        <div className="capacity-info">
          <Users size={14} /> {row.capacity || 0} Siswa
        </div>
      ) 
    },
    { key: 'actions', header: 'Aksi', render: (row) => (
        <ActionButtons 
          onView={() => navigate(`/academic/classrooms/${row.id}`)}
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDelete(row.id)}
        />
      )
    }
  ];

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rombongan Belajar (Kelas)</h1>
          <p className="page-subtitle">Kelola master data Rombel/Ruang Kelas</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      <div className="glass-panel filter-bar">
        <span className="filter-label">Filter Tingkat:</span>
        <select 
          className="input-field filter-select" 
          value={filterGradeId} 
          onChange={(e) => {
            setFilterGradeId(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">-- Semua Tingkat --</option>
          {grades.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.educationLevel})</option>
          ))}
        </select>
      </div>

      <div className="glass-panel">
        <DataTable 
          columns={classroomColumns} 
          data={paginatedClassrooms} 
          loading={loading}
          emptyMessage="Belum ada data Rombel."
        />
        
        {!loading && classrooms.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={classrooms.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4">
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Rombel / Kelas' : 'Tambah Rombel / Kelas'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Tingkat / Level <span className="text-red-500">*</span></label>
                <select className="input-field" value={gradeId} onChange={(e) => setGradeId(e.target.value)} required>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.educationLevel})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Kode <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: 10-IPA-1" required />
              </div>
              <div className="form-group">
                <label>Nama Rombel <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: X MIPA 1" required />
              </div>
              <div className="form-group">
                <label>Kapasitas Maksimal Siswa</label>
                <input type="number" className="input-field" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    </div>
  );
};
