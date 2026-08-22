import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Clock, Coffee, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useClassPeriods } from '../../hooks/useClassPeriods';
import type { ClassPeriod } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

export const ClassPeriods: React.FC = () => {
  const {
    periods,
    loading,
    error: fetchError,
    createClassPeriod,
    updateClassPeriod,
    deleteClassPeriod
  } = useClassPeriods();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const [code, setCode] = useState('');
  const [periodNumber, setPeriodNumber] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);
  const [formError, setFormError] = useState('');
  const { showConfirm, showAlert } = useDialog();

  const error = formError || fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setPeriodNumber(periods.length + 1);
    setStartTime('');
    setEndTime('');
    setIsBreak(false);
    setFormError('');
  };

  const handleEdit = (period: ClassPeriod) => {
    setIsEditing(true);
    setEditId(period.id);
    setCode(period.code);
    setPeriodNumber(period.periodNumber);
    setStartTime(period.startTime);
    setEndTime(period.endTime);
    setIsBreak(period.isBreak);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure you want to delete this class period?', async () => {
      setFormError('');
      try {
        await deleteClassPeriod(id);
      } catch (err: any) {
        setFormError(err.message || 'Gagal menghapus jam pelajaran');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        code,
        periodNumber: Number(periodNumber),
        startTime,
        endTime,
        isBreak
      };

      if (isEditing) {
        await updateClassPeriod(editId, payload);
      } else {
        await createClassPeriod(payload);
      }
      
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan jam pelajaran');
    }
  };

  const columns: Column<ClassPeriod>[] = [
    { key: 'periodNumber', header: 'Jam Ke-', render: (row) => <span className="font-semibold">{row.periodNumber}</span> },
    { key: 'code', header: 'Kode' },
    { key: 'time', header: 'Waktu', render: (row) => (
      <div className="capacity-info">
        <Clock size={14} />
        {row.startTime} - {row.endTime}
      </div>
    )},
    { key: 'status', header: 'Status', render: (row) => (
      row.isBreak ? (
        <span className="status-badge inactive flex items-center gap-1 w-max">
          <Coffee size={12} /> Istirahat
        </span>
      ) : (
        <span className="status-badge active">
          Pelajaran
        </span>
      )
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
          <h1 className="page-title">Jam Pelajaran</h1>
          <p className="page-subtitle">Kelola master data Waktu / Jam Pelajaran</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {error && !showModal && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="glass-panel">
        <DataTable 
          columns={columns} 
          data={periods} 
          loading={loading}
          emptyMessage="Belum ada data Jam Pelajaran."
        />
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4">
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && (
                <div className="alert alert-error mb-4 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              <div className="form-group">
                <label>Kode <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: JP-01" required />
              </div>
              <div className="form-group">
                <label>Jam Ke- (Angka) <span className="text-red-500">*</span></label>
                <input type="number" className="input-field" value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} required />
              </div>
              <div className="form-grid" style={{ flexDirection: 'row', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Waktu Mulai <span className="text-red-500">*</span></label>
                  <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Waktu Selesai <span className="text-red-500">*</span></label>
                  <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label className="filter-label cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={isBreak} onChange={(e) => setIsBreak(e.target.checked)} />
                  Tandai sebagai Jam Istirahat
                </label>
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
