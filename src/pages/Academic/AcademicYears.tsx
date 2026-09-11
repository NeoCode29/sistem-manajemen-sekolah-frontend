import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import type { AcademicYear } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { getErrorMessage } from '../../utils/errorHandler';

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
  const { showConfirm, showAlert } = useDialog();

  const error = fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setName('');
  };

  const handleEdit = (year: AcademicYear) => {
    setIsEditing(true);
    setEditId(year.id);
    setName(year.name);
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAcademicYearActive(id);
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Gagal mengubah status aktif tahun ajaran'), 'Gagal');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus tahun ajaran ini?', async () => {
      try {
        await deleteAcademicYear(id);
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus tahun ajaran. Data tidak dapat dihapus jika masih terhubung dengan data akademik lainnya.'), 'Gagal');
      }
    }, 'Hapus Tahun Ajaran');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name };
      if (isEditing) {
        await updateAcademicYear(editId, payload);
      } else {
        await createAcademicYear(payload);
      }
      handleCloseModal();
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Gagal menyimpan tahun ajaran'), 'Gagal');
    }
  };

  const columns: Column<AcademicYear>[] = [
    { key: 'name', header: 'Nama', render: (row) => <span className="font-semibold">{row.name}</span> },
    { key: 'status', header: 'Status', render: (row) => (
      <Badge variant={row.isActive ? 'success' : 'default'}>
        {row.isActive ? 'Aktif' : 'Nonaktif'}
      </Badge>
    )},
    { key: 'actions', header: 'Aksi', render: (row) => (
      <div className="flex items-center gap-2">
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
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Tahun Ajaran"
        subtitle="Kelola master data Tahun Ajaran akademik"
        action={<button onClick={() => setShowModal(true)} className="btn-std-primary"><Plus size={18} /> Tambah Data</button>}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6">
        <DataTable 
          columns={columns} 
          data={years} 
          loading={loading}
          emptyMessage="Belum ada data Tahun Ajaran."
        />
      </div>

      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleSubmit}>Simpan</button>
          </div>
        }
      >
        <form id="ay-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Nama Tahun Ajaran" required>
            <input type="text" className="input-std" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: 2026/2027" required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
