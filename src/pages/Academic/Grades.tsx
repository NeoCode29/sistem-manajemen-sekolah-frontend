import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, GraduationCap, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useGrades } from '../../hooks/useGrades';
import type { Grade } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const Grades: React.FC = () => {
  const {
    grades,
    loading,
    error: fetchError,
    createGrade,
    updateGrade,
    deleteGrade
  } = useGrades();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState(10);
  const [educationLevel, setEducationLevel] = useState('SMA');
  const [formError, setFormError] = useState('');
  const { showConfirm, showAlert } = useDialog();

  const error = formError || fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setLevel(10);
    setEducationLevel('SMA');
    setFormError('');
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

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this grade level?', async () => {
      setFormError('');
      try {
        await deleteGrade(id);
      } catch (err: any) {
        setFormError(err.message || 'Gagal menghapus tingkat kelas');
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
        level: Number(level),
        educationLevel
      };
      
      if (isEditing) {
        await updateGrade(editId, payload);
      } else {
        await createGrade(payload);
      }
      
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan tingkat kelas');
    }
  };

  const columns: Column<Grade>[] = [
    { key: 'code', header: 'Kode', render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: 'name', header: 'Nama Tingkat' },
    { key: 'level', header: 'Level (Angka)' },
    { key: 'educationLevel', header: 'Jenjang Pendidikan', render: (row) => (
      <div className="capacity-info">
        <GraduationCap size={14} />
        {row.educationLevel}
      </div>
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
          <h1 className="page-title">Tingkat Kelas</h1>
          <p className="page-subtitle">Kelola master data Tingkat/Level Kelas (misal: Kelas 10, 11, 12)</p>
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
          data={grades} 
          loading={loading}
          emptyMessage="Belum ada data Tingkat Kelas."
        />
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
