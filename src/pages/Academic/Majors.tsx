import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, GraduationCap, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useMajors } from '../../hooks/useMajors';
import type { Major } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const Majors: React.FC = () => {
  const {
    majors,
    loading,
    error: fetchError,
    createMajor,
    updateMajor,
    toggleActive,
    deleteMajor
  } = useMajors();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const { showConfirm } = useDialog();

  const error = formError || fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setDescription('');
    setFormError('');
  };

  const handleEdit = (major: Major) => {
    setIsEditing(true);
    setEditId(major.id);
    setCode(major.code);
    setName(major.name);
    setDescription(major.description || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this major?', async () => {
      setFormError('');
      try {
        await deleteMajor(id);
      } catch (err: any) {
        setFormError(err.message || 'Gagal menghapus jurusan');
      }
    });
  };

  const handleToggleStatus = async (id: string) => {
    showConfirm('Are you sure you want to change the status of this major?', async () => {
      await toggleActive(id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        code,
        name,
        description
      };

      if (isEditing) {
        await updateMajor(editId, payload);
      } else {
        await createMajor(payload);
      }
      
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan jurusan');
    }
  };

  const columns: Column<Major>[] = [
    { key: 'code', header: 'Kode', render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: 'name', header: 'Nama Jurusan', render: (row) => (
      <div className="capacity-info" style={{ color: '#0ea5e9' }}>
        <GraduationCap size={16} />
        {row.name}
      </div>
    )},
    { key: 'description', header: 'Deskripsi', render: (row) => row.description || '-' },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: (row) => (
        <button 
          onClick={() => handleToggleStatus(row.id)}
          className={`status-badge ${row.isActive ? 'active' : 'inactive'} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
          title="Klik untuk mengubah status"
        >
          {row.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {row.isActive ? 'Aktif' : 'Non-Aktif'}
        </button>
      )
    },
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
          <h1 className="page-title">Jurusan</h1>
          <p className="page-subtitle">Kelola master data Jurusan (Program Keahlian)</p>
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
          data={majors} 
          loading={loading}
          emptyMessage="Belum ada data Jurusan."
        />
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4">
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Jurusan' : 'Tambah Jurusan'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Kode <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: IPA" required />
              </div>
              <div className="form-group">
                <label>Nama Jurusan <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ilmu Pengetahuan Alam" required />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Deskripsi</label>
                <textarea 
                  className="input-field" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Keterangan opsional mengenai jurusan ini"
                  rows={3}
                />
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
