import React, { useEffect, useState } from 'react';
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom, type Classroom, getGrades, type Grade } from '../../api/academicService';
import { Plus, Trash2, Users, Edit } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import './Academic.css';

export const Classrooms: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Filter
  const [filterGradeId, setFilterGradeId] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [gradeId, setGradeId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(30);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classroomsData, gradesData] = await Promise.all([
        getClassrooms(filterGradeId || undefined),
        getGrades()
      ]);
      setClassrooms(classroomsData);
      setGrades(gradesData);
      
      if (gradesData.length > 0 && !gradeId) {
        setGradeId(gradesData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterGradeId]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await deleteClassroom(id);
        fetchData();
      } catch (error) {
        alert('Failed to delete classroom');
      }
    }
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
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save classroom');
    }
  };

  const paginatedClassrooms = classrooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(classrooms.length / itemsPerPage);

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rombongan Belajar (Kelas)</h1>
          <p className="page-subtitle">Kelola master data Rombel/Ruang Kelas</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      <div className="glass-panel" style={{ marginBottom: '1rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span className="text-gray-500 font-medium">Filter Tingkat:</span>
        <select 
          className="input-field" 
          style={{ width: 'auto' }} 
          value={filterGradeId} 
          onChange={(e) => setFilterGradeId(e.target.value)}
        >
          <option value="">-- Semua Tingkat --</option>
          {grades.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.educationLevel})</option>
          ))}
        </select>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Rombel</th>
                  <th>Tingkat</th>
                  <th>Kapasitas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  paginatedClassrooms.map((classroom) => (
                    <tr key={classroom.id}>
                      <td className="font-semibold">{classroom.code}</td>
                      <td>{classroom.name}</td>
                      <td>
                        <span className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600">
                          {classroom.grade?.name || '-'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users size={14} />
                          {classroom.capacity || 0} Siswa
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(classroom)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="btn-icon text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(classroom.id)}
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
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

      {showModal && (
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
      )}
    </div>
  );
};





