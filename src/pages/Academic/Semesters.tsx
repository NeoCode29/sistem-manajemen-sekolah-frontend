import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSemesters, createSemester, updateSemester, toggleSemesterActive, deleteSemester, type Semester, getAcademicYears, type AcademicYear } from '../../api/academicService';
import { Plus, CheckCircle, XCircle, Trash2, Library, Edit } from 'lucide-react';
import './Academic.css';

export const Semesters: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [academicYearId, setAcademicYearId] = useState('');
  const [name, setName] = useState('');

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setName('');
  };

  const handleEdit = (semester: Semester) => {
    setIsEditing(true);
    setEditId(semester.id);
    setAcademicYearId(semester.academicYearId);
    setName(semester.name);
    setShowModal(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [semestersData, yearsData] = await Promise.all([
        getSemesters(),
        getAcademicYears()
      ]);
      setSemesters(semestersData);
      setAcademicYears(yearsData);
      if (yearsData.length > 0 && !academicYearId) {
        setAcademicYearId(yearsData.find(y => y.isActive)?.id || yearsData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await toggleSemesterActive(id);
      fetchData();
    } catch (error) {
      alert('Failed to toggle status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
      try {
        await deleteSemester(id);
        fetchData();
      } catch (error) {
        alert('Failed to delete semester');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        academicYearId: Number(academicYearId),
        name,
      };
      if (isEditing) {
        await updateSemester(editId, payload);
      } else {
        await createSemester(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save semester');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Semester</h1>
          <p className="page-subtitle">Kelola data Semester dan Tahun Ajaran</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Semester</th>
                  <th>Tahun Ajaran</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {semesters.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  semesters.map((semester) => (
                    <tr key={semester.id}>
                      <td>{semester.name}</td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Library size={14} />
                          {semester.academicYear?.name || '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${semester.isActive ? 'active' : 'inactive'}`}>
                          {semester.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className={`btn-icon ${semester.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                            onClick={() => handleToggle(semester.id)}
                            title={semester.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {semester.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                          </button>
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(semester)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="btn-icon text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(semester.id)}
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
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4">
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Semester' : 'Tambah Semester'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Tahun Ajaran Induk <span className="text-red-500">*</span></label>
                <select className="input-field" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nama <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Semester Ganjil 2026/2027" required />
              </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};





