import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAcademicYears, createAcademicYear, updateAcademicYear, toggleAcademicYearActive, deleteAcademicYear, type AcademicYear } from '../../api/academicService';
import { Plus, CheckCircle, XCircle, Trash2, Edit, AlertCircle } from 'lucide-react';
import './Academic.css';

export const AcademicYears: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [name, setName] = useState('');

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setName('');
    setError('');
  };

  const handleEdit = (year: AcademicYear) => {
    setIsEditing(true);
    setEditId(year.id);
    setName(year.name);
    setShowModal(true);
  };

  const fetchYears = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAcademicYears();
      setYears(data);
    } catch (error: any) {
      console.error('Failed to fetch academic years:', error);
      setError(error.response?.data?.message || 'Gagal memuat data tahun ajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      setError('');
      await toggleAcademicYearActive(id);
      fetchYears();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      try {
        setError('');
        await deleteAcademicYear(id);
        fetchYears();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Gagal menghapus tahun ajaran');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SUBMIT_CLICKED', { name, isEditing, editId });
    try {
      setError('');
      const payload = {
        name,
      };
      
      if (isEditing) {
        await updateAcademicYear(editId, payload);
      } else {
        await createAcademicYear(payload);
      }
      
      handleCloseModal();
      fetchYears();
    } catch (error: any) {
      console.error('HANDLE_SUBMIT_ERROR:', error);
      console.error('RESPONSE_DATA:', error.response?.data);
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Gagal menyimpan tahun ajaran');
      }
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tahun Ajaran</h1>
          <p className="page-subtitle">Kelola master data Tahun Ajaran akademik</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="glass-panel">
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {years.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  years.map((year) => (
                    <tr key={year.id}>
                      <td className="font-semibold">{year.name}</td>
                      <td>
                        <span className={`status-badge ${year.isActive ? 'active' : 'inactive'}`}>
                          {year.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className={`btn-icon ${year.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                            onClick={() => handleToggle(year.id)}
                            title={year.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {year.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                          </button>
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(year)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="btn-icon text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(year.id)}
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
              <h2>{isEditing ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Nama Tahun Ajaran <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: 2026/2027" required />
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





