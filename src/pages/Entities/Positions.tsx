import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { usePositions } from '../../hooks/usePositions';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import type { Position } from '../../api/employeeService';

interface PositionForm {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const DEFAULT_FORM: PositionForm = { code: '', name: '', description: '', isActive: true };

export const Positions: React.FC = () => {
  const { items, loading, create, update, remove } = usePositions();
  const { showConfirm, showAlert } = useDialog();

  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<PositionForm>(DEFAULT_FORM);
  const [searchTerm, setSearchTerm] = useState('');

  const setField = (field: keyof PositionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openAdd = () => { setForm(DEFAULT_FORM); setModal({ open: true, editId: null }); };
  const openEdit = (item: Position) => {
    setForm({ code: item.code, name: item.name, description: item.description || '', isActive: item.isActive });
    setModal({ open: true, editId: item.id });
  };
  const closeModal = () => setModal({ open: false, editId: null });

  const handleDelete = (id: string) => {
    showConfirm('Hapus data ini?', async () => {
      try { await remove(id); } catch { showAlert('Gagal menghapus data', 'Error'); }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modal.editId) { await update(modal.editId, form); }
      else { await create(form); }
      closeModal();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan data', 'Error');
    }
  };

  const handleToggleActive = async (item: Position) => {
    try {
      await update(item.id, { isActive: !item.isActive });
    } catch (err: any) {
      showAlert(err.message || 'Gagal merubah status', 'Error');
    }
  };

  const columns: Column<Position>[] = [
    { key: 'code', header: 'Kode', render: row => <span className="font-semibold text-gray-900">{row.code}</span> },
    { key: 'name', header: 'Nama' },
    { key: 'description', header: 'Deskripsi', render: row => row.description || '-' },
    { key: 'isActive', header: 'Status', render: row => (
        <button onClick={() => handleToggleActive(row)}>
          <Badge variant={row.isActive ? 'success' : 'danger'}>{row.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
        </button>
      )
    },
    { key: 'actions', header: 'Aksi', render: row => <ActionButtons onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Data Jabatan"
        subtitle="Manajemen master data jabatan untuk pegawai"
        action={<button onClick={openAdd} className="btn-std-primary"><Plus size={18} /> Tambah Data</button>}
      />

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Cari Kode atau Nama Jabatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-6">
        <DataTable columns={columns} data={items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.code.toLowerCase().includes(searchTerm.toLowerCase()))} loading={loading} emptyMessage="Belum ada data jabatan." />
      </div>

      <Modal 
        open={modal.open} 
        onClose={closeModal} 
        title={modal.editId ? 'Edit Jabatan' : 'Tambah Jabatan'}
        footer={
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" onClick={closeModal} className="btn-std-secondary">Batal</button>
            <button type="button" onClick={handleSubmit} className="btn-std-primary">Simpan</button>
          </div>
        }
      >
        <form id="position-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Kode Jabatan" required>
            <input type="text" className="input-std" value={form.code} onChange={setField('code')} required />
          </FormField>
          <FormField label="Nama Jabatan" required>
            <input type="text" className="input-std" value={form.name} onChange={setField('name')} required />
          </FormField>
          <FormField label="Deskripsi">
            <textarea className="input-std" value={form.description} onChange={setField('description')} rows={3} />
          </FormField>
          <FormField label="Status Aktif">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={form.isActive} onChange={setField('isActive')} />
              <span>{form.isActive ? 'Aktif' : 'Nonaktif'}</span>
            </label>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
