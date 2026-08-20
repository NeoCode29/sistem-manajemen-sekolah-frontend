import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useSubjects } from '../../hooks/useSubjects';
import type { Subject } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const Subjects: React.FC = () => {
  const {
    subjects,
    loading,
    error: fetchError,
    createSubject,
    updateSubject,
    deleteSubject
  } = useSubjects();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [minimumPassingGrade, setMinimumPassingGrade] = useState(75);
  const [formError, setFormError] = useState('');
  const { showConfirm, showAlert } = useDialog();

  const error = formError || fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setMinimumPassingGrade(75);
    setFormError('');
  };

  const handleEdit = (subject: Subject) => {
    setIsEditing(true);
    setEditId(subject.id);
    setCode(subject.code);
    setName(subject.name);
    setMinimumPassingGrade(subject.minimumPassingGrade || 75);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this subject?', async () => {
      setFormError('');
      try {
        await deleteSubject(id);
      } catch (err: any) {
        setFormError(err.message || 'Gagal menghapus mata pelajaran');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
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
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan mata pelajaran');
    }
  };

  const columns: Column<Subject>[] = [
    { key: 'code', header: 'Kode', render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: 'name', header: 'Mata Pelajaran', render: (row) => (
      <div className="capacity-info" style={{ color: '#2563eb' }}>
        <BookOpen size={16} />
        {row.name}
      </div>
    )},
    { key: 'minimumPassingGrade', header: 'KKM (Nilai Lulus)', render: (row) => (
      <span className="grade-badge">
        {row.minimumPassingGrade || '-'}
      </span>
    )},
    { key: 'actions', header: 'Aksi', render: (row) => (
      <ActionButtons 
        onEdit={() => handleEdit(row)}
        onDelete={() => handleDelete(row.id)}
      />
    )}
  ];

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

      {error && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="glass-panel">
        <DataTable 
          columns={columns} 
          data={subjects} 
          loading={loading}
          emptyMessage="Belum ada data Mata Pelajaran."
        />
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
