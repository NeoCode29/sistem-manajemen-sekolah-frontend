import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import type { AcademicYear } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const AcademicYears: React.FC = () => {
  const {
    years,
    loading,
    error: fetchError,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    toggleAcademicYearActive
  } = useAcademicYears();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
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

  const handleEdit = (year: AcademicYear) => {
    setIsEditing(true);
    setEditId(year.id);
    setName(year.name);
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    setFormError('');
    try {
      await toggleAcademicYearActive(id);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this academic year?', async () => {
      setFormError('');
      try {
        await deleteAcademicYear(id);
      } catch (err: any) {
        setFormError(err.message || 'Gagal menghapus tahun ajaran');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { name };
      if (isEditing) {
        await updateAcademicYear(editId, payload);
      } else {
        await createAcademicYear(payload);
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan tahun ajaran');
    }
  };

  const columns: Column<AcademicYear>[] = [
    { key: 'name', header: 'Nama', render: (row) => <span className="font-semibold">{row.name}</span> },
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
        {row.isActive ? 'Aktif' : 'Tidak Aktif'}
      </span>
    )},
    { key: 'actions', header: 'Aksi', render: (row) => (
      <div className="action-buttons-group">
        <button 
          className={`action-btn ${row.isActive ? 'text-red-400' : 'text-green-400'}`}
          onClick={() => handleToggle(row.id)}
          title={row.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {row.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
        </button>
        <ActionButtons 
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDelete(row.id)}
        />
      </div>
    )}
  ];

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
        <DataTable 
          columns={columns} 
          data={years} 
          loading={loading}
          emptyMessage="Belum ada data Tahun Ajaran."
        />
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
