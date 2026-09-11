import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { generateSubjectCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField } from '../../components/ui';
import { getErrorMessage } from '../../utils/errorHandler';
import { useSubjects } from '../../hooks/useSubjects';
import type { Subject } from '../../api/academicService';

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
  const { showConfirm, showAlert } = useDialog();

  const error = fetchError;

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setMinimumPassingGrade(75);
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
    showConfirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?', async () => {
      try {
        await deleteSubject(id);
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus mata pelajaran. Data tidak dapat dihapus jika masih digunakan dalam jadwal atau penilaian.'), 'Gagal');
      }
    }, 'Hapus Mata Pelajaran');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      showAlert(getErrorMessage(err, 'Gagal menyimpan data mata pelajaran'), 'Gagal');
    }
  };

  const columns: Column<Subject>[] = [
    { key: 'code', header: 'Kode', render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: 'name', header: 'Mata Pelajaran', render: (row) => (
      <span className="font-medium text-gray-900">{row.name}</span>
    )},
    { key: 'minimumPassingGrade', header: 'KKM (Nilai Lulus)', render: (row) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
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
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mata Pelajaran</h1>
          <p className="text-gray-500 mt-1">Kelola master data Mata Pelajaran</p>
        </div>
        <button className="btn-std-primary" onClick={() => { setCode(generateSubjectCode()); setShowModal(true); }}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={subjects} 
          loading={loading}
          emptyMessage="Belum ada data Mata Pelajaran."
        />
      </div>

      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="submit" form="subject-form" className="btn-std-primary">Simpan</button>
          </div>
        }
      >
        <form id="subject-form" onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-5">
            <FormField label="Kode" required>
              <div className="flex gap-2">
                <input type="text" className="input-std flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: MAT-W-10" required />
                <button 
                  type="button" 
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors whitespace-nowrap"
                  onClick={() => setCode(generateSubjectCode(name))}
                  title="Buat kode acak otomatis"
                >
                  Buat Otomatis
                </button>
              </div>
            </FormField>
            <FormField label="Nama Mata Pelajaran" required>
              <input type="text" className="input-std" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Matematika Wajib Kelas X" required />
            </FormField>
            <FormField label="KKM / Batas Kelulusan Minimum">
              <input type="number" step="0.1" className="input-std" value={minimumPassingGrade} onChange={(e) => setMinimumPassingGrade(Number(e.target.value))} placeholder="75" />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
