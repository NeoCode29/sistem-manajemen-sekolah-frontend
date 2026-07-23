import React, { useEffect, useState } from 'react';
import { getRoles, createRole, assignPermissionsToRole, getPermissions, type Role, type Permission } from '../../api/rbacService';
import { Plus, UserCheck, Shield } from 'lucide-react';
import '../Academic/Academic.css';

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create role');
    }
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
      alert(error.response?.data?.message || 'Failed to assign permissions');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peran (Roles)</h1>
          <p className="page-subtitle">Kelola daftar Peran dan Hak Aksesnya</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
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
                  <th>ID</th>
                  <th>Nama Peran</th>
                  <th>Hak Akses (Permissions)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id}>
                      <td className="font-semibold">{role.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <UserCheck size={16} className="text-blue-600" />
                          {role.name}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map(p => (
                              <span key={p.id} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">
                                {p.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">Belum ada izin</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => openAssignModal(role)}
                        >
                          Atur Izin
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4 animate-fade-in">
            <div className="modal-header-v4">
              <h2>Tambah Peran Baru</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateRole} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Nama Peran <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Guru" required />
              </div>
              <div className="form-group">
                <label>Guard Name <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={guardName} onChange={(e) => setGuardName(e.target.value)} placeholder="jwt" required />
              </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermModal && selectedRole && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4 animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>Atur Hak Akses: {selectedRole.name}</h2>
              <button className="btn-close" onClick={() => setShowPermModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAssignPermissions} className="modal-form-v4">
              <div className="modal-body-v4">
              <p className="text-sm text-gray-500 mb-4">Pilih hak akses apa saja yang dimiliki oleh peran ini.</p>
              
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                {allPermissions.map(perm => (
                  <label key={perm.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-blue-50">
                    <input 
                      type="checkbox" 
                      checked={selectedPermIds.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                    />
                    <Shield size={14} className="text-blue-500" />
                    <span className="text-sm">{perm.name}</span>
                  </label>
                ))}
              </div>
              
              </div>
              
              <div className="modal-footer-v4" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPermModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};





