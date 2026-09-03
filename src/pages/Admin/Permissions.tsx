import React, { useEffect, useState } from 'react';
import { getPermissions, createPermission, type Permission } from '../../api/rbacService';
import { Plus, Shield } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';

export const Permissions: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { showAlert } = useDialog();
  
  // Form State
  const [name, setName] = useState('');
  const [guardName, setGuardName] = useState('jwt');

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPermission({ name, guardName });
      setShowModal(false);
      setName('');
      setGuardName('jwt');
      fetchPermissions();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to create permission', 'Gagal');
    }
  };

  const columns: Column<Permission>[] = [
    { key: 'id', header: 'ID', render: (perm) => (
      <span className="font-semibold text-gray-500">#{perm.id}</span>
    )},
    { key: 'name', header: 'Nama Hak Akses', render: (perm) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <Shield size={14} />
        </div>
        <span className="font-semibold text-gray-900">{perm.name}</span>
      </div>
    )},
    { key: 'guardName', header: 'Guard Name', render: (perm) => (
      <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
        {perm.guardName}
      </span>
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Hak Akses (Permissions)" 
          subtitle="Kelola daftar hak akses sistem (RBAC)"
        />
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      <DataTable 
        columns={columns}
        data={permissions}
        loading={loading}
        emptyMessage="Belum ada data hak akses."
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Hak Akses"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <FormField label="Nama Hak Akses (Permission)" required>
            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: academic.read" required />
          </FormField>
          
          <FormField label="Guard Name" required>
            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={guardName} onChange={(e) => setGuardName(e.target.value)} placeholder="jwt" required />
          </FormField>
          
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={() => setShowModal(false)}>Batal</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
