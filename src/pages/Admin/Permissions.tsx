import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPermissions, createPermission, type Permission } from '../../api/rbacService';
import { Plus, Shield } from 'lucide-react';
import '../Academic/Academic.css';

export const Permissions: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
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
      alert(error.response?.data?.message || 'Failed to create permission');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hak Akses (Permissions)</h1>
          <p className="page-subtitle">Kelola daftar hak akses sistem (RBAC)</p>
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
                  <th>Nama Hak Akses</th>
                  <th>Guard Name</th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">Belum ada data.</td>
                  </tr>
                ) : (
                  permissions.map((perm) => (
                    <tr key={perm.id}>
                      <td className="font-semibold">{perm.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-blue-600" />
                          {perm.name}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm px-2 py-1 rounded bg-blue-50 text-blue-600">
                          {perm.guardName}
                        </span>
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
          <div className="modal-content-v4 animate-fade-in">
            <div className="modal-header-v4">
              <h2>Tambah Hak Akses</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              <div className="form-group">
                <label>Nama Hak Akses (Permission) <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: academic.read" required />
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
      ,
        document.body
      )}
    </div>
  );
};
