import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUsers, createUser, updateUser, assignRolesToUser, getRoles, type User, type Role } from '../../api/rbacService';
import { Plus, Users as UsersIcon, UserCheck, Edit } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengguna (Users)</h1>
          <p className="page-subtitle">Kelola akun pengguna dan peran (Role) mereka</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Akun
        </button>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Nama Lengkap</th>
                  <th>Status</th>
                  <th>Peran (Roles)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="font-semibold">{user.username}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <UsersIcon size={16} className="text-blue-600" />
                          {user.name}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map(r => (
                              <span key={r.id} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">
                                {r.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">Belum ada peran</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            onClick={() => openAssignModal(user)}
                          >
                            Atur Peran
                          </button>
                          <button 
                            className="btn-icon text-blue-400 hover:bg-blue-400/10"
                            onClick={() => handleEdit(user)}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4">
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Username <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: joko_guru" required />
              </div>
              <div className="form-group">
                <label>Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Joko Anwar, S.Pd." required />
              </div>
              <div className="form-group">
                <label>Password {isEditing ? '(Kosongkan jika tidak diubah)' : '<span className="text-red-500">*</span>'}</label>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required={!isEditing} />
                <span className="text-xs text-gray-500 mt-1">Harus mengandung huruf besar, kecil, angka, dan karakter khusus.</span>
              </div>
              {isEditing && (
                <div className="form-group checkbox-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Akun Aktif (Dapat Login)
                  </label>
                </div>
              )}
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {showRoleModal && selectedUser && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4 animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>Atur Peran: {selectedUser.name}</h2>
              <button className="btn-close" onClick={() => setShowRoleModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAssignRoles} className="modal-form-v4">
              <div className="modal-body-v4">
              <p className="text-sm text-gray-500 mb-4">Pilih peran apa saja yang dimiliki oleh pengguna ini.</p>
              
              <div className="form-grid" style={{ gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                {allRoles.map(role => (
                  <label key={role.id} className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-blue-50">
                    <input 
                      type="checkbox" 
                      checked={selectedRoleIds.includes(Number(role.id))}
                      onChange={() => toggleRole(role.id)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <UserCheck size={18} className="text-blue-500" />
                    <span className="font-medium text-gray-700">{role.name}</span>
                  </label>
                ))}
              </div>
              
              </div>
              
              <div className="modal-footer-v4" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    </div>
  );
};
