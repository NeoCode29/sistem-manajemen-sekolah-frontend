import React, { useEffect, useState } from 'react';
import { getPositions, createPosition, updatePosition, deletePosition, type Position } from '../../api/employeeService';
import { Plus, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import '../Academic/Academic.css'; // Reuse existing styles

export const Positions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Status State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await getPositions();
      setPositions(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data jabatan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setCode('');
    setName('');
    setDescription('');
    setIsActive(true);
    setError('');
  };

  const handleEdit = (pos: Position) => {
    setIsEditing(true);
    setEditId(pos.id);
    setCode(pos.code);
    setName(pos.name);
    setDescription(pos.description || '');
    setIsActive(pos.isActive);
    setShowModal(true);
  };

  const handleToggle = async (pos: Position) => {
    try {
      await updatePosition(pos.id, { isActive: !pos.isActive });
      setSuccess(`Status jabatan ${pos.name} berhasil diubah!`);
      fetchPositions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal merubah status jabatan');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jabatan ini?')) {
      try {
        await deletePosition(id);
        setSuccess('Jabatan berhasil dihapus!');
        fetchPositions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal menghapus jabatan');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Position> = {
        code,
        name,
        description,
        isActive,
      };

      if (isEditing) {
        await updatePosition(editId, payload);
        setSuccess('Data jabatan berhasil diperbarui!');
      } else {
        await createPosition(payload);
        setSuccess('Jabatan baru berhasil ditambahkan!');
      }
      handleCloseModal();
      fetchPositions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jabatan / Posisi</h1>
          <p className="page-subtitle">Manajemen daftar jabatan pegawai</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Jabatan</th>
                <th>Deskripsi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Memuat data...</td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data jabatan.</td>
                </tr>
              ) : (
                positions.map((pos) => (
                  <tr key={pos.id}>
                    <td className="font-semibold text-gray-600">{pos.code}</td>
                    <td className="font-semibold">{pos.name}</td>
                    <td>{pos.description || '-'}</td>
                    <td>
                      <span className={`status-badge ${pos.isActive ? 'active' : 'inactive'}`}>
                        {pos.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className={`btn-icon ${pos.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                          onClick={() => handleToggle(pos)}
                          title={pos.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {pos.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button 
                          className="btn-icon text-blue-400 hover:bg-blue-400/10"
                          onClick={() => handleEdit(pos)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="btn-icon text-red-400 hover:bg-red-400/10"
                          onClick={() => handleDelete(pos.id)}
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4">
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Jabatan' : 'Tambah Jabatan'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="alert alert-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
                
                <div className="form-group">
                  <label>Kode Jabatan <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: KEPSEK, GURU" required />
                </div>
                <div className="form-group">
                  <label>Nama Jabatan <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kepala Sekolah" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Deskripsi Tugas</label>
                  <input type="text" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsional" />
                </div>
                <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Jabatan Aktif
                  </label>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
