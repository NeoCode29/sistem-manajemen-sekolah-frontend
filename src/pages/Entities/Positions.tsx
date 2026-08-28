import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPositions, createPosition, updatePosition, deletePosition, type Position } from '../../api/employeeService';
import { Plus, CheckCircle, XCircle, Trash2, Edit, Search } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

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
  const { showConfirm, showAlert } = useDialog();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    showConfirm('Apakah Anda yakin ingin menghapus jabatan ini?', async () => {
      try {
        await deletePosition(id);
        setSuccess('Jabatan berhasil dihapus!');
        fetchPositions();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus jabatan', 'Gagal');
      }
    });
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

      {/* Modern Filter Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} style={{ color: '#4f46e5' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Pencarian Data Jabatan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Cari Kode atau Nama</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                placeholder="Ketik kata kunci pencarian..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
          
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Filter Status</label>
            <select 
              className="input-field" 
              style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Jabatan Pegawai</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Seluruh jabatan yang terdaftar dalam sistem.</p>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode</th>
                <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Jabatan</th>
                <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deskripsi</th>
                <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
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
                positions
                  .filter(pos => 
                    (filterStatus === '' || (filterStatus === 'ACTIVE' && pos.isActive) || (filterStatus === 'INACTIVE' && !pos.isActive)) &&
                    (pos.code.toLowerCase().includes(searchTerm.toLowerCase()) || pos.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((pos) => (
                  <tr key={pos.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem', backgroundColor: '#e0e7ff', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>{pos.code}</span>
                    </td>
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle', fontWeight: 700, color: '#1e293b' }}>
                      {pos.name}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle', color: '#64748b', fontSize: '0.9rem' }}>
                      {pos.description || '-'}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: pos.isActive ? '#ecfdf5' : '#fef2f2', color: pos.isActive ? '#059669' : '#dc2626', border: `1px solid ${pos.isActive ? '#a7f3d0' : '#fecaca'}`, display: 'inline-block' }}>
                        {pos.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleToggle(pos)}
                          style={{ padding: '0.5rem', color: pos.isActive ? '#ef4444' : '#10b981', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = pos.isActive ? '#fef2f2' : '#ecfdf5'; }} 
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title={pos.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {pos.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button 
                          onClick={() => handleEdit(pos)}
                          style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }} 
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(pos.id)}
                          style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }} 
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
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

      {showModal && createPortal(
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
      ,
        document.body
      )}
    </div>
  );
};
