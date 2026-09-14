import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import { usePermission } from '../../components/Common/Can';
import type { AcademicYear } from '../../api/academicService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';

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
  const canCreate = usePermission(['academic_years.create', 'academic_years.update', 'academic.write']);
  const canEdit = usePermission(['academic_years.update', 'academic.write']);
  const canDelete = usePermission(['academic_years.delete', 'academic.write']);
  const canToggle = usePermission(['academic_years.toggle_active', 'academic_years.update', 'academic.write']);
  const canManageAcademic = canCreate || canEdit || canDelete || canToggle;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
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

  const handleEdit = (year: AcademicYear) => {
    setIsEditing(true);
    setEditId(year.id);
    setName(year.name);
    setFormError('');
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    setFormError('');
    try {
      await toggleAcademicYearActive(id);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Apakah Anda yakin ingin menghapus Tahun Ajaran ini beserta semester bawaannya? (Tahun Ajaran hanya dapat dihapus jika tidak ada data siswa, jadwal, nilai, atau absensi yang terikat)',
      async () => {
        setFormError('');
        try {
          await deleteAcademicYear(id);
        } catch (err: any) {
          setFormError(err.message || 'Gagal menghapus tahun ajaran');
        }
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const match = name.trim().match(/^(\d{4})\/(\d{4})$/);
    if (!match) {
      setFormError('Format Tahun Ajaran harus YYYY/YYYY (contoh: 2027/2028)');
      return;
    }
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);
    if (endYear !== startYear + 1) {
      setFormError(`Tahun akhir harus tepat 1 tahun setelah tahun awal (contoh: ${startYear}/${startYear + 1})`);
      return;
    }

    try {
      const payload = { name: name.trim() };
      if (isEditing) {
        await updateAcademicYear(editId, payload);
      } else {
        await createAcademicYear(payload);
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan tahun ajaran');
    }
  };

  const columns: Column<AcademicYear>[] = [
    { key: 'name', header: 'Nama', render: (row) => <span className="font-semibold">{row.name}</span> },
    {
      key: 'semesters',
      header: 'Semester Bawaan',
      render: (row) => (
        row.semesters && row.semesters.length > 0 ? (
          <div className="flex gap-1.5">
            {row.semesters.map((s: any) => (
              <span
                key={s.id}
                className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                  s.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {s.name} {s.isActive && '(Aktif)'}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Otomatis (Ganjil & Genap)</span>
        )
      ),
    },
    { key: 'status', header: 'Status', render: (row) => (
      <Badge variant={row.isActive ? 'success' : 'default'}>
        {row.isActive ? 'Aktif' : 'Nonaktif'}
      </Badge>
    )}
  ];

  if (canManageAcademic) {
    columns.push({ key: 'actions', header: 'Aksi', render: (row) => (
      <div className="flex items-center gap-2">
        {canToggle && (
          <button 
            className={`action-btn ${row.isActive ? 'text-red-400' : 'text-green-400'}`}
            onClick={() => handleToggle(row.id)}
            title={row.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {row.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
          </button>
        )}
        <ActionButtons 
          onEdit={canEdit ? () => handleEdit(row) : undefined}
          onDelete={canDelete ? () => handleDelete(row.id) : undefined}
        />
      </div>
    )});
  }

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Tahun Ajaran"
        subtitle="Kelola master data Tahun Ajaran akademik"
        action={canCreate ? <button onClick={() => { setFormError(''); setShowModal(true); }} className="btn-std-primary"><Plus size={18} /> Tambah Data</button> : undefined}
      />

      {error && !showModal && (
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
          {error && showModal && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-medium">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <FormField label="Nama Tahun Ajaran" required>
            <input
              type="text"
              className="input-std"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: 2027/2028"
              required
            />
            <span className="text-xs text-gray-500 mt-1.5 block">
              Format wajib: <strong>YYYY/YYYY</strong> (contoh: 2027/2028). Semester Ganjil dan Genap akan otomatis dibuat saat Tahun Ajaran baru disimpan.
            </span>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
