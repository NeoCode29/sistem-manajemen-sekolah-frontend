import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee, getPositions, type Position, type CreateEmployeePayload } from '../../api/employeeService';
import { getRoles, type Role } from '../../api/rbacService';
import { Plus, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import '../Academic/Academic.css'; // Reuse existing styles

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [positionId, setPositionId] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [employmentStatus, setEmploymentStatus] = useState('Aktif');
  const [isActive, setIsActive] = useState(true);
  
  // Account Form State (For Creation)
  const [roles, setRoles] = useState<Role[]>([]);
  const [createAccount, setCreateAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');

  // Status State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empData, posData, rolesData] = await Promise.all([
        getEmployees(),
        getPositions(true), // Get only active positions for dropdown
        getRoles()
      ]);
      setEmployees(empData);
      setPositions(posData);
      setRoles(rolesData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId('');
    setPositionId('');
    setEmployeeNumber('');
    setFullName('');
    setEmail('');
    setPhone('');
    setGender('Laki-laki');
    setEmploymentStatus('Aktif');
    setIsActive(true);
    setCreateAccount(false);
    setUsername('');
    setPassword('');
    setRoleId('');
    setError('');
  };

  const handleEdit = (emp: Employee) => {
    setIsEditing(true);
    setEditId(emp.id);
    setPositionId(emp.positionId);
    setEmployeeNumber(emp.employeeNumber);
    setFullName(emp.fullName);
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setGender(emp.gender || 'Laki-laki');
    setEmploymentStatus(emp.employmentStatus || 'Aktif');
    setIsActive(emp.isActive);
    setShowModal(true);
  };

  const handleToggle = async (emp: Employee) => {
    try {
      await updateEmployee(emp.id, { isActive: !emp.isActive });
      setSuccess(`Status pegawai ${emp.fullName} berhasil diubah!`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal merubah status pegawai');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      try {
        await deleteEmployee(id);
        setSuccess('Pegawai berhasil dihapus!');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal menghapus pegawai');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateEmployeePayload = {
        positionId,
        employeeNumber,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        gender,
        employmentStatus,
        isActive,
      };

      if (!isEditing && createAccount) {
        payload.createAccount = true;
        payload.username = username;
        payload.password = password;
        payload.roleId = roleId;
      }

      if (isEditing) {
        await updateEmployee(editId, payload);
        setSuccess('Data pegawai berhasil diperbarui!');
      } else {
        await createEmployee(payload);
        setSuccess('Pegawai baru berhasil ditambahkan!');
      }
      handleCloseModal();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pegawai / Guru</h1>
          <p className="page-subtitle">Manajemen data pegawai dan tenaga pendidik</p>
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
                <th>NIP/NIK</th>
                <th>Nama Lengkap</th>
                <th>Jabatan</th>
                <th>Kontak</th>
                <th>Status Pegawai</th>
                <th>Status Akun</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">Memuat data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">Belum ada data pegawai.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-semibold text-gray-600">{emp.employeeNumber}</td>
                    <td className="font-semibold">{emp.fullName}</td>
                    <td>{emp.position?.name || 'Tidak ada'}</td>
                    <td>
                      <div className="text-sm">
                        <div>{emp.email || '-'}</div>
                        <div className="text-gray-400">{emp.phone || '-'}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${emp.employmentStatus === 'Aktif' ? 'active' : 'inactive'}`}>
                        {emp.employmentStatus || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`}>
                        {emp.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className={`btn-icon ${emp.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                          onClick={() => handleToggle(emp)}
                          title={emp.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {emp.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button 
                          className="btn-icon text-blue-400 hover:bg-blue-400/10"
                          onClick={() => handleEdit(emp)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="btn-icon text-red-400 hover:bg-red-400/10"
                          onClick={() => handleDelete(emp.id)}
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
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>{isEditing ? 'Edit Pegawai' : 'Tambah Pegawai'}</h2>
              <button type="button" className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="alert alert-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Jabatan Utama <span className="text-red-500">*</span></label>
                  <select className="input-field" value={positionId} onChange={(e) => setPositionId(e.target.value)} required>
                    <option value="">-- Pilih Jabatan --</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>NIP / NIK / No. Induk <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>No. HP / Telepon</label>
                  <input type="text" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status Kepegawaian</label>
                  <select className="input-field" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                    <option value="Aktif">Aktif Bekerja</option>
                    <option value="Cuti">Sedang Cuti</option>
                    <option value="Resign">Resign</option>
                    <option value="Pensiun">Pensiun</option>
                  </select>
                </div>

                <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} disabled={isEditing} />
                    {isEditing ? 'Akun login dikelola melalui menu Pengaturan Admin' : 'Buat Akun Login untuk Pegawai Ini'}
                  </label>
                </div>

                {!isEditing && createAccount && (
                  <div className="form-grid" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Username <span className="text-red-500">*</span></label>
                      <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required={createAccount} placeholder="Contoh: guru_budi" />
                    </div>
                    <div className="form-group">
                      <label>Password <span className="text-red-500">*</span></label>
                      <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required={createAccount} placeholder="Minimal 8 karakter" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Peran (Role) <span className="text-red-500">*</span></label>
                      <select className="input-field" value={roleId} onChange={(e) => setRoleId(e.target.value)} required={createAccount}>
                        <option value="">-- Pilih Peran --</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                      Status Pegawai Aktif (menonaktifkan ini akan mematikan akun loginnya juga)
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
      )}
    </div>
  );
};
