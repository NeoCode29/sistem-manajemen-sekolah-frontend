import React, { useEffect, useState, useMemo } from 'react';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  assignRolesToUser, 
  getRoles, 
  type User, 
  type Role 
} from '../../api/rbacService';
import { Plus, UserCheck, Edit, Shield, Loader2, Search, Filter, RotateCcw, Trash2, Eye, EyeOff } from 'lucide-react';
import { PageHeader, Modal, FormField, Badge, ConfirmDialog } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { useClientPagination } from '../../hooks/useClientPagination';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/feedback';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  const { hasPermission, canManageUsers } = usePermissions();
  const canCreateUser = hasPermission('users.create') || canManageUsers;
  const canUpdateUser = hasPermission('users.update') || canManageUsers;
  const canAssignRoles = hasPermission('users.assign_roles') || hasPermission('roles.assign') || canManageUsers;
  const canDeleteUser = hasPermission('users.delete') || canManageUsers;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Assign Roles State
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setUsername('');
    setName('');
    setPassword('');
    setShowPassword(false);
    setIsActive(true);
  };

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setEditId(user.id);
    setUsername(user.username);
    setName(user.name);
    setPassword(''); // leave empty to not change
    setShowPassword(false);
    setIsActive(user.isActive);
    setShowModal(true);
  };

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
      notify.error(error, 'Gagal memuat daftar pengguna');
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
      setSubmitting(true);
      const payload: any = { username, name, isActive };
      if (password) {
        payload.password = password;
      }

      if (isEditing) {
        await updateUser(editId, payload);
        notify.success('Data pengguna berhasil diperbarui!');
      } else {
        await createUser(payload);
        notify.success('Akun pengguna baru berhasil ditambahkan!');
      }
      
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      notify.error(error, isEditing ? 'Gagal memperbarui pengguna' : 'Gagal membuat pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles?.map(r => String(r.id)) || []);
    setShowRoleModal(true);
  };

  const toggleRole = (roleId: any) => {
    const strId = String(roleId);
    setSelectedRoleIds(prev => 
      prev.includes(strId) ? prev.filter(id => id !== strId) : [...prev, strId]
    );
  };

  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      await assignRolesToUser(selectedUser.id, selectedRoleIds);
      notify.success(`Peran untuk "${selectedUser.name}" berhasil disimpan!`);
      setShowRoleModal(false);
      fetchData();
    } catch (error: any) {
      notify.error(error, 'Gagal menetapkan peran pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (targetUser: User) => {
    setUserToDelete(targetUser);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await deleteUser(userToDelete.id);
      notify.success(`Akun "${userToDelete.name}" (@${userToDelete.username}) berhasil dinonaktifkan/dihapus.`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchData();
    } catch (error: any) {
      notify.error(error, 'Gagal menghapus pengguna');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = searchQuery.trim() === '' || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === '' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      const matchRole = roleFilter === '' ||
        user.roles?.some(r => r.name.toLowerCase() === roleFilter.toLowerCase());

      return matchSearch && matchStatus && matchRole;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const { paginatedItems, pagination } = useClientPagination(filteredUsers, 10, [searchQuery, statusFilter, roleFilter]);

  const columns: Column<User>[] = [
    { 
      key: 'username', 
      header: 'Username', 
      render: (user) => (
        <span 
          className="font-semibold text-gray-900 block max-w-[160px] md:max-w-[200px] truncate" 
          title={user.username}
        >
          {user.username}
        </span>
      )
    },
    { 
      key: 'name', 
      header: 'Nama Lengkap', 
      render: (user) => (
        <span 
          className="font-medium text-gray-700 block max-w-[180px] md:max-w-[240px] truncate" 
          title={user.name}
        >
          {user.name}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'default'}>
          {user.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      )
    },
    { 
      key: 'roles', 
      header: 'Peran (Roles)', 
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map(r => (
              <span key={r.id} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                {r.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">Belum ada peran</span>
          )}
        </div>
      )
    }
  ];

  if (canAssignRoles || canUpdateUser || canDeleteUser) {
    columns.push({ 
      key: 'actions', 
      header: 'Aksi', 
      render: (user) => {
        const isSelf = String(user.id) === String(currentUser?.id);
        return (
          <div className="flex items-center gap-2 justify-end">
            {canAssignRoles && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                onClick={() => openAssignModal(user)}
              >
                <Shield size={14} /> Atur Peran
              </button>
            )}
            {canUpdateUser && (
              <button 
                type="button"
                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                onClick={() => handleEdit(user)}
                title="Edit Akun"
              >
                <Edit size={16} />
              </button>
            )}
            {canDeleteUser && (
              <button
                type="button"
                disabled={isSelf}
                className={`p-1.5 rounded-xl transition-colors ${
                  isSelf
                    ? 'text-gray-300 cursor-not-allowed opacity-50'
                    : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                }`}
                onClick={() => handleDeleteClick(user)}
                title={
                  isSelf
                    ? 'Anda tidak dapat menghapus akun Anda sendiri'
                    : 'Hapus Akun Pengguna'
                }
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      } 
    });
  }

  const hasActiveFilter = Boolean(searchQuery || statusFilter || roleFilter);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      {/* 1. Page Header */}
      <PageHeader 
        title="Pengguna (Users)" 
        subtitle="Kelola akun pengguna, kredensial login, dan penetapan peran (Role)"
        action={
          canCreateUser ? (
            <button 
              type="button"
              className="btn-std-primary flex items-center gap-2" 
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} /> Tambah Akun
            </button>
          ) : undefined
        }
      />

      {/* 2. Filter Bar (Glassmorphism Standard - No Header, Icon Group Focus) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Pencarian Pengguna</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" 
                placeholder="Cari nama atau username..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          <div className="w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status Akun</label>
            <div className="relative group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Peran (Role)</label>
            <div className="relative group">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Semua Peran</option>
                {allRoles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setRoleFilter('');
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm self-stretch md:self-end cursor-pointer shrink-0"
              title="Reset seluruh filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Data Table */}
      <DataTable 
        columns={columns}
        data={paginatedItems}
        loading={loading}
        pagination={pagination}
        emptyMessage={
          searchQuery || statusFilter || roleFilter
            ? 'Tidak ada pengguna yang cocok dengan kriteria pencarian.'
            : 'Belum ada data pengguna.'
        }
      />

      {/* CREATE/EDIT MODAL */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-5 p-6">
          <FormField label="Username" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Contoh: joko_guru" 
              required 
            />
          </FormField>
          
          <FormField label="Nama Lengkap" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Joko Anwar, S.Pd." 
              required 
            />
          </FormField>
          
          <FormField 
            label="Password" 
            hint={isEditing ? '(Kosongkan jika tidak diubah)' : 'Minimal 8 karakter'} 
            required={!isEditing}
          >
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={isEditing ? '••••••••' : 'Password aman'} 
                required={!isEditing} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FormField>
          
          {isEditing && (
            <label className="flex items-center gap-3 cursor-pointer text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
              />
              <span className="text-sm font-medium">Akun Aktif (Dapat Login)</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" 
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Akun'
              )}
            </button>
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
          <p className="text-sm text-gray-500">Pilih peran apa saja yang dimiliki oleh pengguna ini.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto p-1">
            {allRoles.map(role => {
              const isChecked = selectedRoleIds.includes(String(role.id));
              return (
                <label 
                  key={role.id} 
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked ? 'bg-indigo-50/70 border-indigo-200 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={isChecked}
                    onChange={() => toggleRole(role.id)}
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck size={16} className={isChecked ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium truncate ${isChecked ? 'text-indigo-900' : 'text-gray-700'}`}>
                      {role.name}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" 
              onClick={() => setShowRoleModal(false)}
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal Konfirmasi Hapus Akun */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${userToDelete?.name}" (@${userToDelete?.username})? Akun ini akan dinonaktifkan dari sistem dan pengguna tidak dapat login kembali.`}
        confirmText="Hapus Akun"
        cancelText="Batal"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
};
