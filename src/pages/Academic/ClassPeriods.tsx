import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getClassPeriods, createClassPeriod, updateClassPeriod, deleteClassPeriod, type ClassPeriod } from '../../api/academicService';
import { Plus, Trash2, Clock, Coffee, Edit } from 'lucide-react';
import './Academic.css';

export const ClassPeriods: React.FC = () => {
  const [periods, setPeriods] = useState<ClassPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [code, setCode] = useState('');
  const [periodNumber, setPeriodNumber] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setPeriodNumber(periods.length + 1);
    setStartTime('');
    setEndTime('');
    setIsBreak(false);
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

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await getClassPeriods();
      // Sort by start time or period number
      const sorted = data.sort((a, b) => a.periodNumber - b.periodNumber);
      setPeriods(sorted);
    } catch (error) {
      console.error('Failed to fetch class periods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this class period?')) {
      try {
        await deleteClassPeriod(id);
        fetchPeriods();
      } catch (error) {
        alert('Failed to delete class period');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      fetchPeriods();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save class period');
    }
  };

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

      <div className="glass-panel">
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jam Ke-</th>
                  <th>Kode</th>
                  <th>Waktu</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {periods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  periods.map((period) => (
                    <tr key={period.id}>
                      <td className="font-semibold">{period.periodNumber}</td>
                      <td>{period.code}</td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock size={14} />
                          {period.startTime} - {period.endTime}
                        </div>
                      </td>
                      <td>
                        {period.isBreak ? (
                          <span className="status-badge inactive flex items-center gap-1 w-max">
                            <Coffee size={12} /> Istirahat
                          </span>
                        ) : (
                          <span className="status-badge active">
                            Pelajaran
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(period)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="btn-icon text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(period.id)}
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
              <h2>{isEditing ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
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
                <label className="flex items-center gap-2 cursor-pointer">
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
