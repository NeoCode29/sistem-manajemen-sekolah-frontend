import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSubjects, createSubject, updateSubject, deleteSubject, type Subject } from '../../api/academicService';
import { Plus, Trash2, BookOpen, Edit } from 'lucide-react';
import './Academic.css';

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [minimumPassingGrade, setMinimumPassingGrade] = useState(75);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setMinimumPassingGrade(75);
  };

  const handleEdit = (subject: Subject) => {
    setIsEditing(true);
    setEditId(subject.id);
    setCode(subject.code);
    setName(subject.name);
    setMinimumPassingGrade(subject.minimumPassingGrade || 75);
    setShowModal(true);
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubject(id);
        fetchSubjects();
      } catch (error) {
        alert('Failed to delete subject');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code,
        name,
        minimumPassingGrade: Number(minimumPassingGrade)
      };

      if (isEditing) {
        await updateSubject(editId, payload);
      } else {
        await createSubject(payload);
      }
      
      handleCloseModal();
      fetchSubjects();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save subject');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mata Pelajaran</h1>
          <p className="page-subtitle">Kelola master data Mata Pelajaran</p>
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
                  <th>Mata Pelajaran</th>
                  <th>KKM (Nilai Lulus)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="font-semibold">{subject.code}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-blue-600" />
                          {subject.name}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600">
                          {subject.minimumPassingGrade || '-'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(subject)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="btn-icon text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(subject.id)}
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
              <h2>{isEditing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Kode <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: MAT-W-10" required />
              </div>
              <div className="form-group">
                <label>Nama Mata Pelajaran <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Matematika Wajib Kelas X" required />
              </div>
              <div className="form-group">
                <label>KKM / Batas Kelulusan Minimum</label>
                <input type="number" step="0.1" className="input-field" value={minimumPassingGrade} onChange={(e) => setMinimumPassingGrade(Number(e.target.value))} placeholder="75" />
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
