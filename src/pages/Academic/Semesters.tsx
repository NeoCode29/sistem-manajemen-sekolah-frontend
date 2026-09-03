import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, XCircle, Library, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useSemesters } from '../../hooks/useSemesters';
import type { Semester } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';

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
      <span className="text-gray-700">
        {row.academicYear?.name || '-'}
      </span>
    )},
    { key: 'status', header: 'Status', render: (row) => (
      <Badge variant={row.isActive ? 'success' : 'secondary'}>
        {row.isActive ? 'Aktif' : 'Tidak Aktif'}
      </Badge>
    )},
    { key: 'actions', header: 'Aksi', render: (row) => {
      const activeYearId = academicYears.find(y => y.isActive)?.id;
      const isParentYearActive = row.academicYearId === activeYearId || row.academicYear?.isActive;

      return (
      <div className="flex items-center gap-2">
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
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Semester"
        subtitle="Kelola data Semester dan Tahun Ajaran"
        action={<button onClick={openAddModal} className="btn-std-primary"><Plus size={18} /> Tambah Data</button>}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 border border-red-200 rounded-xl flex items-center gap-3 mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6">
        <DataTable 
          columns={columns} 
          data={semesters} 
          loading={loading}
          emptyMessage="Belum ada data Semester."
        />
      </div>

      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Semester' : 'Tambah Semester'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleSubmit}>Simpan</button>
          </div>
        }
      >
        <form id="semester-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Tahun Ajaran Induk" required>
            <select className="input-std" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Nama Semester" required>
            <input type="text" className="input-std" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Semester Ganjil 2026/2027" required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
