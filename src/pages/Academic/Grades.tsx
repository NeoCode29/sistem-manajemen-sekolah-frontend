import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, GraduationCap, AlertCircle } from 'lucide-react';
import { generateUniqueCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useGrades } from '../../hooks/useGrades';
import { usePermissions } from '../../hooks/usePermissions';
import type { Grade } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField } from '../../components/ui';

export const Grades: React.FC = () => {
  const {
    grades,
    loading,
    error: fetchError,
    createGrade,
    updateGrade,
    deleteGrade
  } = useGrades();
  const { canManageAcademic } = usePermissions();

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
      <span className="text-gray-700">
        {row.educationLevel}
      </span>
    )}
  ];

  if (canManageAcademic) {
    columns.push({ key: 'actions', header: 'Aksi', render: (row) => (
      <ActionButtons 
        onEdit={() => handleEdit(row)}
        onDelete={() => handleDelete(row.id)}
      />
    )});
  }

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Tingkat Kelas"
        subtitle="Kelola master data Tingkat/Level Kelas (misal: Kelas 10, 11, 12)"
{canManageAcademic && (
  <button className="btn-std-primary" onClick={() => { setCode(generateUniqueCode('TK')); setShowModal(true); }}>
    <Plus size={18} /> Tambah Data
  </button>
)}
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
          data={grades} 
          loading={loading}
          emptyMessage="Belum ada data Tingkat Kelas."
        />
      </div>

      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Tingkat Kelas' : 'Tambah Tingkat Kelas'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleSubmit}>Simpan</button>
          </div>
        }
      >
        <form id="grade-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Kode" required>
            <div className="flex gap-2">
              <input type="text" className="input-std flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: KLS-10" required />
              <button 
                type="button" 
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors whitespace-nowrap"
                onClick={() => setCode(generateUniqueCode('TK'))}
                title="Buat kode acak otomatis"
              >
                Buat Otomatis
              </button>
            </div>
          </FormField>
          <FormField label="Nama" required>
            <input type="text" className="input-std" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kelas 10" required />
          </FormField>
          <FormField label="Level (Angka)" required>
            <input type="number" className="input-std" value={level} onChange={(e) => setLevel(Number(e.target.value))} required />
          </FormField>
          <FormField label="Jenjang Pendidikan" required>
            <select className="input-std" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
            </select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
