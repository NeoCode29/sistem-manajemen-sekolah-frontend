import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getGrades, createGrade, updateGrade, deleteGrade, type Grade } from '../../api/academicService';
import { Plus, Trash2, GraduationCap, Edit } from 'lucide-react';
import './Academic.css';

export const Grades: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState(10);
  const [educationLevel, setEducationLevel] = useState('SMA');

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

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await getGrades();
      setGrades(data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this grade level?')) {
      try {
        await deleteGrade(id);
        fetchGrades();
      } catch (error) {
        alert('Failed to delete grade level');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code,
        name,
        level: Number(level),
        educationLevel
      };
      
      if (isEditing) {
        await updateGrade(editId, payload);
      } else {
        await createGrade(payload);
      }
      
      handleCloseModal();
      fetchGrades();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save grade level');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tingkat Kelas</h1>
          <p className="page-subtitle">Kelola master data Tingkat/Level Kelas (misal: Kelas 10, 11, 12)</p>
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
                  <th>Kode</th>
                  <th>Nama Tingkat</th>
                  <th>Level (Angka)</th>
                  <th>Jenjang Pendidikan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  grades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="font-semibold">{grade.code}</td>
                      <td>{grade.name}</td>
                      <td>{grade.level}</td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-500">
                          <GraduationCap size={14} />
                          {grade.educationLevel}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(grade)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="btn-icon text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(grade.id)}
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
              <h2>{isEditing ? 'Edit Tingkat Kelas' : 'Tambah Tingkat Kelas'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Kode <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: KLS-10" required />
              </div>
              <div className="form-group">
                <label>Nama <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kelas 10" required />
              </div>
              <div className="form-group">
                <label>Level (Angka) <span className="text-red-500">*</span></label>
                <input type="number" className="input-field" value={level} onChange={(e) => setLevel(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Jenjang Pendidikan <span className="text-red-500">*</span></label>
                <select className="input-field" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
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
