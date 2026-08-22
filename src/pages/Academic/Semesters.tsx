import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, XCircle, Library, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useSemesters } from '../../hooks/useSemesters';
import type { Semester } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const Semesters: React.FC = () => {
  const {
    semesters,
    academicYears,
    loading,
    error: fetchError,
    createSemester,
    updateSemester,
    deleteSemester,
    toggleSemesterActive
  } = useSemesters();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [academicYearId, setAcademicYearId] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const { showConfirm, showAlert } = useDialog();

  const error = formError || fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setName('');
    setFormError('');
  };

  const handleEdit = (semester: Semester) => {
    setIsEditing(true);
    setEditId(semester.id);
    setAcademicYearId(semester.academicYearId);
    setName(semester.name);
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    setFormError('');
    try {
      await toggleSemesterActive(id);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this semester?', async () => {
      setFormError('');
      try {
        await deleteSemester(id);
      } catch (err: any) {
        setFormError(err.message || 'Gagal menghapus semester');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
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
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan semester');
    }
  };

  const openAddModal = () => {
    if (academicYears.length > 0 && !academicYearId) {
      setAcademicYearId(academicYears.find(y => y.isActive)?.id || academicYears[0].id);
    }
    setShowModal(true);
  };

  const columns: Column<Semester>[] = [
    { key: 'name', header: 'Nama Semester', render: (row) => <span className="font-semibold">{row.name}</span> },
    { key: 'academicYear', header: 'Tahun Ajaran', render: (row) => (
      <div className="capacity-info">
        <Library size={14} />
        {row.academicYear?.name || '-'}
      </div>
    )},
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
        {row.isActive ? 'Aktif' : 'Tidak Aktif'}
      </span>
    )},
    { key: 'actions', header: 'Aksi', render: (row) => {
      const activeYearId = academicYears.find(y => y.isActive)?.id;
      const isParentYearActive = row.academicYearId === activeYearId || row.academicYear?.isActive;

      return (
      <div className="action-buttons-group">
        {isParentYearActive && (
          <button 
            className={`action-btn ${row.isActive ? 'text-red-400' : 'text-green-400'}`}
            onClick={() => handleToggle(row.id)}
            title={row.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {row.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
          </button>
        )}
        <ActionButtons 
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDelete(row.id)}
        />
      </div>
      );
    }}
  ];

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Semester</h1>
          <p className="page-subtitle">Kelola data Semester dan Tahun Ajaran</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
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
        <DataTable 
          columns={columns} 
          data={semesters} 
          loading={loading}
          emptyMessage="Belum ada data Semester."
        />
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
