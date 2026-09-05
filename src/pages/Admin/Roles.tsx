import React, { useEffect, useState } from 'react';
import { getRoles, createRole, deleteRole, assignPermissionsToRole, getPermissions, type Role, type Permission } from '../../api/rbacService';
import { Plus, UserCheck, Shield, Trash2 } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showAlert } = useDialog();
  
  const [showModal, setShowModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Create Role State
  const [name, setName] = useState('');
  const [guardName, setGuardName] = useState('jwt');
  
  // Assign Permissions State
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getPermissions()
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRole({ name, guardName });
      setShowModal(false);
      setName('');
      setGuardName('jwt');
      fetchData();
      showAlert('Peran berhasil ditambahkan', 'Berhasil');
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to create role', 'Gagal');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    showConfirm(
      `Apakah Anda yakin ingin menghapus peran "${role.name}"?`,
      async () => {
        try {
          await deleteRole(role.id);
          fetchData();
          showAlert('Peran berhasil dihapus', 'Berhasil');
        } catch (error: any) {
          showAlert(error.response?.data?.message || 'Gagal menghapus peran', 'Gagal');
        }
      },
      'Hapus Peran'
    );
  };

  const openAssignModal = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions?.map(p => p.id) || []);
    setShowPermModal(true);
  };

  const togglePermission = (permId: number) => {
    setSelectedPermIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await assignPermissionsToRole(selectedRole.id, selectedPermIds);
      setShowPermModal(false);
      fetchData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to assign permissions', 'Gagal');
    }
  };

  const columns: Column<Role>[] = [
    { key: 'id', header: 'ID', render: (role) => (
      <span className="font-semibold text-gray-500">#{role.id}</span>
    )},
    { key: 'name', header: 'Nama Peran', render: (role) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <UserCheck size={14} />
        </div>
        <span className="font-semibold text-gray-900">{role.name}</span>
      </div>
    )},
    { key: 'permissions', header: 'Hak Akses (Permissions)', render: (role) => (
      <div className="flex flex-wrap gap-1">
        {role.permissions && role.permissions.length > 0 ? (
          role.permissions.map(p => (
            <span key={p.id} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {p.name}
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-xs italic">Belum ada izin</span>
        )}
      </div>
    )},
    { key: 'actions', header: 'Aksi', render: (role) => {
      const SYSTEM_ROLES = [
        'Super Admin',
        'Admin Sekolah',
        'Kepala Sekolah',
        'Guru / Wali Kelas',
        'Siswa',
        'Orang Tua / Wali'
      ];
      const isSystemRole = SYSTEM_ROLES.includes(role.name);

      return (
        <div className="flex justify-end gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            onClick={() => openAssignModal(role)}
          >
            <Shield size={14} /> Atur Izin
          </button>
          {!isSystemRole && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              onClick={() => handleDeleteRole(role)}
            >
              <Trash2 size={14} /> Hapus
            </button>
          )}
        </div>
      );
    }}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Peran (Roles)" 
          subtitle="Kelola daftar Peran dan Hak Aksesnya"
        />
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      <DataTable 
        columns={columns}
        data={roles}
        loading={loading}
        emptyMessage="Belum ada data peran."
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Peran Baru"
      >
        <form onSubmit={handleCreateRole} className="flex flex-col gap-5 p-6">
          <FormField label="Nama Peran" required>
            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Guru" required />
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

      <Modal
        open={showPermModal}
        onClose={() => setShowPermModal(false)}
        title={`Atur Hak Akses: ${selectedRole?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleAssignPermissions} className="flex flex-col gap-4 p-6">
          <p className="text-sm text-gray-500 px-2">Pilih hak akses apa saja yang dimiliki oleh peran ini.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-2">
            {allPermissions.map(perm => (
              <label key={perm.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedPermIds.includes(perm.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={selectedPermIds.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                />
                <div className="flex items-center gap-2 overflow-hidden">
                  <Shield size={14} className={selectedPermIds.includes(perm.id) ? 'text-indigo-600 shrink-0' : 'text-gray-400 shrink-0'} />
                  <span className={`text-xs font-medium truncate ${selectedPermIds.includes(perm.id) ? 'text-indigo-900' : 'text-gray-700'}`} title={perm.name}>{perm.name}</span>
                </div>
              </label>
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={() => setShowPermModal(false)}>Batal</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan Perubahan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
