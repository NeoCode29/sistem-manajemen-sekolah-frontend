import React, { useEffect, useState } from 'react';
import { type Employee, getPositions, type Position } from '../../api/employeeService';
import { getRoles, type Role } from '../../api/rbacService';
import { useEmployees } from '../../hooks/useEmployees';
import { usePermissions } from '../../hooks/usePermissions';
import { Plus, CheckCircle, XCircle, Search, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';

interface EmployeeForm {
  positionId: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  employmentStatus: string;
  signatureUrl: string;
  isActive: boolean;
  createAccount: boolean;
  username?: string;
  password?: string;
  roleId?: string;
}

const DEFAULT_FORM: EmployeeForm = {
  positionId: '', employeeNumber: '', fullName: '', email: '', phone: '',
  gender: 'Laki-laki', employmentStatus: 'Aktif', signatureUrl: '', isActive: true,
  createAccount: false, username: '', password: '', roleId: ''
};

export const Employees: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const { items, meta, loading, create, update, remove, restore } = useEmployees({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    positionId: filterPosition || undefined,
    isDeleted: activeTab === 'deleted'
  });
  const { canManageEmployees } = usePermissions();

  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const { showConfirm, showAlert } = useDialog();

  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<EmployeeForm>(DEFAULT_FORM);

  const setField = (field: keyof EmployeeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [posData, rolesData] = await Promise.all([getPositions(true), getRoles()]);
        setPositions(posData);
        setRoles(rolesData);
      } catch (err) {
        console.error('Failed to load master data', err);
      }
    };
    fetchMasterData();
  }, []);

  const openAdd = () => { setForm(DEFAULT_FORM); setModal({ open: true, editId: null }); };
  const openEdit = (emp: Employee) => {
    setForm({
      positionId: emp.positionId,
      employeeNumber: emp.employeeNumber,
      fullName: emp.fullName,
      email: emp.email || '',
      phone: emp.phone || '',
      gender: emp.gender || 'Laki-laki',
      employmentStatus: emp.employmentStatus || 'Aktif',
      signatureUrl: emp.signatureUrl || '',
      isActive: emp.isActive,
      createAccount: false,
      username: '', password: '', roleId: ''
    });
    setModal({ open: true, editId: emp.id });
  };
  const closeModal = () => setModal({ open: false, editId: null });

  const handleToggle = async (emp: Employee) => {
    try { await update(emp.id, { isActive: !emp.isActive }); } 
    catch (err: any) { showAlert(err.response?.data?.message || 'Gagal merubah status pegawai', 'Error'); }
  };

  const handleRestore = (id: string) => {
    showConfirm(
      'Apakah Anda yakin ingin memulihkan (restore) data pegawai ini?',
      async () => {
        try {
          await restore(id);
          showAlert('Pegawai berhasil dipulihkan', 'Sukses');
        } catch (err: any) {
          showAlert(err.response?.data?.message || 'Gagal memulihkan pegawai', 'Error');
        }
      },
      'Konfirmasi Pemulihan'
    );
  };

  const handleDelete = (id: string) => {
    showConfirm(
      'Apakah Anda yakin ingin memindahkan data pegawai ini ke tempat sampah?',
      async () => {
        try {
          await remove(id);
          showAlert('Pegawai berhasil dipindahkan ke tempat sampah', 'Sukses');
        } catch (err: any) {
          showAlert(err.response?.data?.message || 'Gagal menghapus pegawai', 'Peringatan');
        }
      },
      'Konfirmasi Hapus'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        positionId: form.positionId,
        employeeNumber: form.employeeNumber,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender,
        employmentStatus: form.employmentStatus,
        signatureUrl: form.signatureUrl || undefined,
        isActive: form.isActive,
      };

      if (!modal.editId && form.createAccount) {
        payload.createAccount = true;
        payload.username = form.username;
        payload.password = form.password;
        payload.roleId = form.roleId;
      }

      if (modal.editId) {
        await update(modal.editId, payload);
      } else {
        await create(payload);
      }
      closeModal();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data', 'Error');
    }
  };

  const columns: Column<Employee>[] = [
    { key: 'employeeNumber', header: 'NIP/NIK', render: (emp) => <span className="font-semibold text-gray-700">{emp.employeeNumber}</span> },
    { key: 'fullName', header: 'Nama Lengkap', render: (emp) => <span className="font-semibold text-gray-900">{emp.fullName}</span> },
    { key: 'position', header: 'Jabatan', render: (emp) => emp.position?.name || <span className="text-gray-400 italic">Tidak ada</span> },
    { key: 'contact', header: 'Kontak', render: (emp) => (
      <div className="flex flex-col">
        <span className="text-gray-900 font-medium">{emp.email || '-'}</span>
        <span className="text-gray-500 text-xs">{emp.phone || '-'}</span>
      </div>
    ) },
    { key: 'employmentStatus', header: 'Status Pegawai', render: (emp) => (
      <Badge variant={emp.employmentStatus === 'Aktif' ? 'success' : emp.employmentStatus === 'Resign' ? 'danger' : 'warning'}>
        {emp.employmentStatus || '-'}
      </Badge>
    ) },
    { key: 'isActive', header: 'Status Akun', render: (emp) => (
      <Badge variant={emp.isActive ? 'success' : 'default'}>{emp.isActive ? 'Aktif' : 'Tidak Aktif'}</Badge>
    ) }
  ];

  if (canManageEmployees) {
    columns.push({ key: 'actions', header: 'Aksi', render: (emp) => (
      <div className="flex items-center gap-1 justify-end">
        {activeTab === 'active' ? (
          <>
            <button 
              className={`p-1.5 rounded-lg transition-colors ${emp.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
              onClick={() => handleToggle(emp)}
              title={emp.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
            >
              {emp.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
            </button>
            <ActionButtons onEdit={() => openEdit(emp)} onDelete={() => handleDelete(emp.id)} />
          </>
        ) : (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            onClick={() => handleRestore(emp.id)}
            title="Pulihkan Pegawai"
          >
            <RefreshCw size={14} />
            <span>Pulihkan</span>
          </button>
        )}
      </div>
    ) });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <PageHeader title="Pegawai & Guru" subtitle="Manajemen data pegawai dan tenaga pendidik" />
        {canManageEmployees && activeTab === 'active' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={openAdd}>
            <Plus size={18} /> Tambah Data
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-100">
        <button
          type="button"
          className={`pb-3 px-1 font-semibold text-sm transition-colors relative ${
            activeTab === 'active'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
        >
          Pegawai Aktif
        </button>
        <button
          type="button"
          className={`pb-3 px-1 font-semibold text-sm transition-colors relative ${
            activeTab === 'deleted'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('deleted'); setCurrentPage(1); }}
        >
          Tempat Sampah
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Cari NIP, NIK, atau Nama Pegawai..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="w-full md:w-64 relative group">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors z-10" size={18} />
          <select className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer relative z-0" value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
            <option value="">Semua Jabatan</option>
            {positions.map(pos => <option key={pos.id} value={pos.id}>{pos.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 flex flex-col">
        <DataTable
          containerClassName="w-full overflow-x-auto"
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage={activeTab === 'active' ? 'Belum ada data pegawai.' : 'Tidak ada data pegawai di tempat sampah.'}
        />

        {!loading && meta?.totalPages > 0 && (
          <Pagination currentPage={currentPage} totalPages={meta.totalPages} totalItems={meta.total} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }} />
        )}
      </div>

      <Modal 
        open={modal.open} 
        onClose={closeModal} 
        title={modal.editId ? 'Edit Pegawai' : 'Tambah Pegawai'} 
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={closeModal}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleSubmit}>Simpan Data</button>
          </div>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FormField label="Jabatan Utama" required>
                <select className="input-std" value={form.positionId} onChange={setField('positionId')} required>
                  <option value="">-- Pilih Jabatan --</option>
                  {positions.map(pos => <option key={pos.id} value={pos.id}>{pos.name}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="NIP / NIK / No. Induk" required><input type="text" className="input-std" value={form.employeeNumber} onChange={setField('employeeNumber')} required /></FormField>
            <FormField label="Nama Lengkap" required><input type="text" className="input-std" value={form.fullName} onChange={setField('fullName')} required /></FormField>
            <FormField label="Email"><input type="email" className="input-std" value={form.email} onChange={setField('email')} /></FormField>
            <FormField label="No. HP / Telepon"><input type="text" className="input-std" value={form.phone} onChange={setField('phone')} /></FormField>
            <FormField label="Jenis Kelamin">
              <select className="input-std" value={form.gender} onChange={setField('gender')}>
                <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
              </select>
            </FormField>
            <FormField label="Status Kepegawaian">
              <select className="input-std" value={form.employmentStatus} onChange={setField('employmentStatus')}>
                <option value="Aktif">Aktif Bekerja</option><option value="Cuti">Sedang Cuti</option><option value="Resign">Resign</option><option value="Pensiun">Pensiun</option>
              </select>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="URL / Path Tanda Tangan (Opsional)">
                <input type="text" className="input-std" value={form.signatureUrl} onChange={setField('signatureUrl')} placeholder="Contoh: /uploads/signatures/guru1.png" />
                <p className="text-xs text-gray-500 mt-1.5">Digunakan untuk ttd otomatis di Raport jika bertugas sebagai Wali Kelas.</p>
              </FormField>
            </div>

            {!modal.editId ? (
              <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 mt-2">
                <label className="flex items-center gap-3 cursor-pointer font-medium text-gray-800 mb-4">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={form.createAccount} onChange={setField('createAccount')} />
                  Buat Akun Login untuk Pegawai Ini
                </label>
                {form.createAccount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <FormField label="Username" required><input type="text" className="input-std" value={form.username} onChange={setField('username')} required={form.createAccount} placeholder="Contoh: guru_budi" /></FormField>
                    <FormField label="Password" required><input type="password" className="input-std" value={form.password} onChange={setField('password')} required={form.createAccount} placeholder="Minimal 6 karakter" /></FormField>
                    <div className="md:col-span-2">
                      <FormField label="Peran (Role)" required>
                        <select className="input-std" value={form.roleId} onChange={setField('roleId')} required={form.createAccount}>
                          <option value="">-- Pilih Peran --</option>
                          {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                        </select>
                      </FormField>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={form.isActive} onChange={setField('isActive')} />
                  <span className="text-sm font-medium">Status Pegawai Aktif <span className="font-normal text-gray-500 block mt-0.5">(Menonaktifkan ini akan mematikan akun loginnya juga)</span></span>
                </label>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
