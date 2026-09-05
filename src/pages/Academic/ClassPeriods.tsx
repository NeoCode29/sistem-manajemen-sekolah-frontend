import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { generateUniqueCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { useClassPeriods } from '../../hooks/useClassPeriods';
import type { ClassPeriod } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';

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
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:45');
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
    setStartTime('07:00');
    setEndTime('07:45');
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
    { key: 'code', header: 'Kode', render: (row) => <span className="text-gray-600">{row.code}</span> },
    { key: 'time', header: 'Waktu', render: (row) => (
      <span className="font-medium text-gray-900">
        {row.startTime} - {row.endTime}
      </span>
    )},
    { key: 'status', header: 'Status', render: (row) => (
      row.isBreak ? (
        <Badge variant="warning">Istirahat</Badge>
      ) : (
        <Badge variant="success">Pelajaran</Badge>
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
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Jam Pelajaran</h1>
          <p className="text-gray-500 mt-1">Kelola master data Waktu / Jam Pelajaran</p>
        </div>
        <button className="btn-std-primary" onClick={() => { setCode(generateUniqueCode('JAM')); setShowModal(true); }}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={periods} 
          loading={loading}
          emptyMessage="Belum ada data Jam Pelajaran."
        />
      </div>

      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="submit" form="period-form" className="btn-std-primary">Simpan</button>
          </div>
        }
      >
        <form id="period-form" onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-5">
            {error && showModal && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            
            <FormField label="Kode" required>
              <div className="flex gap-2">
                <input type="text" className="input-std flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: JP-01" required />
                <button 
                  type="button" 
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors whitespace-nowrap"
                  onClick={() => setCode(generateUniqueCode('JAM'))}
                  title="Buat kode acak otomatis"
                >
                  Buat Otomatis
                </button>
              </div>
            </FormField>
            
            <FormField label="Jam Ke- (Angka)" required>
              <input type="number" className="input-std" value={periodNumber} onChange={(e) => setPeriodNumber(Number(e.target.value))} required />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Waktu Mulai" required>
                <div className="flex gap-2 items-center">
                  <select 
                    className="input-std" 
                    value={startTime ? startTime.split(':')[0] : '07'}
                    onChange={(e) => setStartTime(`${e.target.value}:${startTime ? startTime.split(':')[1] : '00'}`)}
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="font-bold text-gray-500">:</span>
                  <select 
                    className="input-std"
                    value={startTime ? startTime.split(':')[1] : '00'}
                    onChange={(e) => setStartTime(`${startTime ? startTime.split(':')[0] : '07'}:${e.target.value}`)}
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </FormField>

              <FormField label="Waktu Selesai" required>
                <div className="flex gap-2 items-center">
                  <select 
                    className="input-std" 
                    value={endTime ? endTime.split(':')[0] : '07'}
                    onChange={(e) => setEndTime(`${e.target.value}:${endTime ? endTime.split(':')[1] : '45'}`)}
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="font-bold text-gray-500">:</span>
                  <select 
                    className="input-std"
                    value={endTime ? endTime.split(':')[1] : '45'}
                    onChange={(e) => setEndTime(`${endTime ? endTime.split(':')[0] : '07'}:${e.target.value}`)}
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </FormField>
            </div>

            <label className="flex items-center gap-3 cursor-pointer mt-2">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={isBreak} onChange={(e) => setIsBreak(e.target.checked)} />
              <span className="text-sm font-semibold text-gray-900">Tandai sebagai Jam Istirahat</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
