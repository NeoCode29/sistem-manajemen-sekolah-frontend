import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, assignRolesToUser, getRoles, type User, type Role } from '../../api/rbacService';
import { Plus, Users as UsersIcon, UserCheck, Edit, Shield } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission, canManageUsers } = usePermissions();
  const canCreateUser = hasPermission('users.create') || canManageUsers;
  const canUpdateUser = hasPermission('users.update') || canManageUsers;
  const canAssignRoles = hasPermission('users.assign_roles') || hasPermission('roles.assign') || canManageUsers;

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { showConfirm, showAlert } = useDialog();
  
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setUsername('');
    setName('');
    setPassword('');
    setIsActive(true);
  };

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setEditId(user.id);
    setUsername(user.username);
    setName(user.name);
    setPassword(''); // leave empty to not change
    setIsActive(user.isActive);
    setShowModal(true);
  };
  
  // Assign Roles State
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles()
      ]);
      setUsers(usersData);
      setAllRoles(rolesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { username, name, isActive };
      if (password) {
        payload.password = password;
      }

      if (isEditing) {
        await updateUser(editId, payload);
      } else {
        await createUser(payload);
      }
      
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to save user', 'Gagal');
    }
  };

  const openAssignModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles?.map(r => Number(r.id)) || []);
    setShowRoleModal(true);
  };

  const toggleRole = (roleId: any) => {
    const numId = Number(roleId);
    setSelectedRoleIds(prev => 
      prev.includes(numId) ? prev.filter(id => id !== numId) : [...prev, numId]
    );
  };

  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await assignRolesToUser(selectedUser.id, selectedRoleIds);
      setShowRoleModal(false);
      fetchData();
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to assign roles', 'Gagal');
    }
  };

  const currentUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username', render: (user) => (
      <span className="font-semibold text-gray-900">{user.username}</span>
    )},
    { key: 'name', header: 'Nama Lengkap', render: (user) => (
      <span className="font-medium text-gray-700">{user.name}</span>
    )},
    { key: 'status', header: 'Status', render: (user) => (
      <Badge variant={user.isActive ? 'success' : 'default'}>
        {user.isActive ? 'Aktif' : 'Nonaktif'}
      </Badge>
    )},
    { key: 'roles', header: 'Peran (Roles)', render: (user) => (
      <div className="flex flex-wrap gap-1">
        {user.roles && user.roles.length > 0 ? (
          user.roles.map(r => (
            <span key={r.id} className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              {r.name}
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-xs italic">Belum ada peran</span>
        )}
      </div>
    )}
  ];

  if (canAssignRoles || canUpdateUser) {
    columns.push({ key: 'actions', header: 'Aksi', render: (user) => (
      <div className="flex items-center gap-2 justify-end">
        {canAssignRoles && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            onClick={() => openAssignModal(user)}
          >
            <Shield size={14} /> Atur Peran
          </button>
        )}
        {canUpdateUser && (
          <button 
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            onClick={() => handleEdit(user)}
            title="Edit"
          >
            <Edit size={16} />
          </button>
        )}
      </div>
    ) });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Pengguna (Users)" 
          subtitle="Kelola akun pengguna dan peran (Role) mereka"
        />
        {canCreateUser && (
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Tambah Akun
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 flex flex-col">
        <DataTable 
          containerClassName="w-full overflow-x-auto"
          columns={columns}
          data={currentUsers}
          loading={loading}
          emptyMessage="Belum ada data pengguna."
        />

        {/* PAGINATION */}
        {!loading && users.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(users.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            hasNextPage={currentPage < Math.ceil(users.length / itemsPerPage)}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={() => {}}
          />
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-5 p-6">
          <FormField label="Username" required>
            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: joko_guru" required />
          </FormField>
          
          <FormField label="Nama Lengkap" required>
            <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Joko Anwar, S.Pd." required />
          </FormField>
          
          <FormField label="Password" hint={isEditing ? '(Kosongkan jika tidak diubah)' : ''} required={!isEditing}>
            <input type="password" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required={!isEditing} />
            <p className="text-xs text-gray-500 mt-1.5">Harus mengandung huruf besar, kecil, angka, dan karakter khusus.</p>
          </FormField>
          
          {isEditing && (
            <label className="flex items-center gap-3 cursor-pointer text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm font-medium">Akun Aktif (Dapat Login)</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={handleCloseModal}>Batal</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN ROLE MODAL */}
      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Atur Peran: ${selectedUser?.name || ''}`}
      >
        <form onSubmit={handleAssignRoles} className="flex flex-col gap-4 p-6">
          <p className="text-sm text-gray-500 px-2">Pilih peran apa saja yang dimiliki oleh pengguna ini.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-2">
            {allRoles.map(role => (
              <label key={role.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selectedRoleIds.includes(Number(role.id)) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={selectedRoleIds.includes(Number(role.id))}
                  onChange={() => toggleRole(role.id)}
                />
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className={selectedRoleIds.includes(Number(role.id)) ? 'text-indigo-600' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${selectedRoleIds.includes(Number(role.id)) ? 'text-indigo-900' : 'text-gray-700'}`}>{role.name}</span>
                </div>
              </label>
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={() => setShowRoleModal(false)}>Batal</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm">Simpan Perubahan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
