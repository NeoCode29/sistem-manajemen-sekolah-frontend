import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, GraduationCap, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { generateUniqueCode } from '../../utils/codeGenerator';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useMajors } from '../../hooks/useMajors';
import { usePermissions } from '../../hooks/usePermissions';
import type { Major } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';

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
  const { canManageAcademic } = usePermissions();

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
      <span className="text-gray-700">
        {row.name}
      </span>
    )},
    { key: 'description', header: 'Deskripsi', render: (row) => row.description || '-' },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: (row) => (
        <button onClick={() => canManageAcademic ? handleToggleStatus(row.id) : undefined} className={!canManageAcademic ? "cursor-default" : ""}>
          <Badge variant={row.isActive ? 'success' : 'danger'}>
            <span className="flex items-center gap-1">
              {row.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {row.isActive ? 'Aktif' : 'Non-Aktif'}
            </span>
          </Badge>
        </button>
      )
    }
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
        title="Jurusan"
        subtitle="Kelola master data Jurusan (Program Keahlian)"
{canManageAcademic && (
  <button className="btn-std-primary" onClick={() => { setCode(generateUniqueCode('JUR')); setShowModal(true); }}>
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
          data={majors} 
          loading={loading}
          emptyMessage="Belum ada data Jurusan."
        />
      </div>

      <Modal 
        open={showModal} 
        onClose={handleCloseModal} 
        title={isEditing ? 'Edit Jurusan' : 'Tambah Jurusan'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={handleCloseModal}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleSubmit}>Simpan</button>
          </div>
        }
      >
        <form id="major-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Kode" required>
            <div className="flex gap-2">
              <input type="text" className="input-std flex-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: IPA" required />
              <button 
                type="button" 
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors whitespace-nowrap"
                onClick={() => setCode(generateUniqueCode('JUR'))}
                title="Buat kode acak otomatis"
              >
                Buat Otomatis
              </button>
            </div>
          </FormField>
          <FormField label="Nama Jurusan" required>
            <input type="text" className="input-std" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Ilmu Pengetahuan Alam" required />
          </FormField>
          <FormField label="Deskripsi">
            <textarea 
              className="input-std" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Keterangan opsional mengenai jurusan ini"
              rows={3}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
