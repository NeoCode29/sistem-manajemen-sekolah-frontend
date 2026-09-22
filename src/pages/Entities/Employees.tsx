import React, { useEffect, useState, useMemo } from 'react';
import { type Employee, getPositions, type Position } from '../../api/employeeService';
import { getRoles, type Role } from '../../api/rbacService';
import { useEmployees } from '../../hooks/useEmployees';
import { usePermissions } from '../../hooks/usePermissions';
import { Plus, CheckCircle, XCircle, RefreshCw, Archive, UserCheck, Loader2, Search, Filter, RotateCcw, Briefcase } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { PageHeader, Modal, FormField, Badge, Select, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { notify } from '../../utils/feedback';

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
  const [submitting, setSubmitting] = useState(false);

  const { items, meta, loading, create, update, remove, restore } = useEmployees({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    positionId: filterPosition || undefined,
    isDeleted: activeTab === 'deleted'
  });

  const { canCreateEmployee, canUpdateEmployee, canDeleteEmployee } = usePermissions();
  const canEditEmployee = canUpdateEmployee;
  const hasActions = canEditEmployee || canDeleteEmployee;

  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<EmployeeForm>(DEFAULT_FORM);

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  const setField = (field: keyof EmployeeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPosId = e.target.value;
    const selectedPos = positions.find(p => String(p.id) === String(newPosId));
    setForm(prev => {
      const updated = { ...prev, positionId: newPosId };
      if (selectedPos && selectedPos.mappedRoleId) {
        updated.roleId = String(selectedPos.mappedRoleId);
      }
      return updated;
    });
  };

  const handleCreateAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setForm(prev => {
      const updated = { ...prev, createAccount: checked };
      if (checked && !prev.roleId && prev.positionId) {
        const selectedPos = positions.find(p => String(p.id) === String(prev.positionId));
        if (selectedPos && selectedPos.mappedRoleId) {
          updated.roleId = String(selectedPos.mappedRoleId);
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      // 1. Fetch positions safely
      try {
        const posData = await getPositions(true);
        setPositions(posData);
      } catch (err) {
        console.error('Failed to load positions', err);
      }

      // 2. Only fetch roles if user has permission to create employee / assign roles
      if (canCreateEmployee) {
        try {
          const rolesData = await getRoles();
          setRoles(rolesData);
        } catch (err) {
          console.error('Failed to load roles for employee creation', err);
        }
      }
    };
    fetchMasterData();
  }, [canCreateEmployee]);

  useEffect(() => {
    if (!canDeleteEmployee && activeTab === 'deleted') {
      setActiveTab('active');
    }
  }, [canDeleteEmployee, activeTab]);

  const openAdd = () => {
    if (!canCreateEmployee) {
      notify.error('Anda tidak memiliki izin untuk menambah data pegawai.');
      return;
    }
    setForm(DEFAULT_FORM);
    setModal({ open: true, editId: null });
  };

  const openEdit = (emp: Employee) => {
    if (!canEditEmployee) {
      notify.error('Anda tidak memiliki izin untuk mengubah data pegawai.');
      return;
    }
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
    if (!canEditEmployee) {
      notify.error('Anda tidak memiliki izin untuk mengubah status aktif pegawai.');
      return;
    }
    try { 
      const nextStatus = !emp.isActive;
      await update(emp.id, { isActive: nextStatus }); 
      notify.success(`Status akun "${emp.fullName}" berhasil diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`);
    } 
    catch (err: any) { 
      notify.error(err, 'Gagal mengubah status pegawai'); 
    }
  };

  const handleRestore = (emp: Employee) => {
    if (!canDeleteEmployee) {
      notify.error('Anda tidak memiliki izin untuk memulihkan pegawai dari Archive.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'info',
      title: `Pulihkan Pegawai "${emp.fullName}"`,
      message: `Apakah Anda yakin ingin memulihkan data pegawai "${emp.fullName}" (NIP: ${emp.employeeNumber}) dari Archive kembali ke daftar Pegawai Aktif?`,
      confirmText: 'Ya, Pulihkan Pegawai',
      onConfirm: async () => {
        try {
          await restore(emp.id);
          notify.success(`Data pegawai "${emp.fullName}" berhasil dipulihkan dari Archive!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal memulihkan data pegawai');
        }
      },
    });
  };

  const handleDelete = (emp: Employee) => {
    if (!canDeleteEmployee) {
      notify.error('Anda tidak memiliki izin untuk mengarsipkan data pegawai.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Arsipkan Pegawai "${emp.fullName}"`,
      message: `Apakah Anda yakin ingin memindahkan pegawai "${emp.fullName}" (NIP: ${emp.employeeNumber}) ke dalam Archive? Pegawai tidak akan muncul pada daftar operasional harian.`,
      confirmText: 'Ya, Arsipkan Data',
      onConfirm: async () => {
        try {
          await remove(emp.id);
          notify.success(`Pegawai "${emp.fullName}" berhasil dipindahkan ke Archive!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal mengarsipkan data pegawai');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.editId && !canEditEmployee) {
      notify.error('Anda tidak memiliki izin untuk memperbarui data pegawai.');
      return;
    }
    if (!modal.editId && !canCreateEmployee) {
      notify.error('Anda tidak memiliki izin untuk menambahkan pegawai baru.');
      return;
    }

    try {
      setSubmitting(true);
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
        notify.success('Berhasil memperbarui data pegawai!');
      } else {
        await create(payload);
        notify.success('Berhasil menambahkan pegawai baru!');
      }
      closeModal();
    } catch (err: any) {
      notify.error(err, 'Terjadi kesalahan saat menyimpan data pegawai');
    } finally {
      setSubmitting(false);
    }
  };

  const positionOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Jabatan' },
      ...positions.map(pos => ({ value: pos.id, label: pos.name }))
    ];
  }, [positions]);

  const columns: Column<Employee>[] = [
    { 
      key: 'employeeNumber', 
      header: 'NIP / NIK', 
      render: (emp) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          {emp.employeeNumber}
        </span>
      ) 
    },
    { 
      key: 'fullName', 
      header: 'Nama Lengkap', 
      render: (emp) => (
        <div className="flex flex-col">
          <span 
            className="font-semibold text-gray-900 block max-w-[180px] md:max-w-[220px] truncate" 
            title={emp.fullName}
          >
            {emp.fullName}
          </span>
          <span className="text-xs text-gray-400">{emp.gender || '-'}</span>
        </div>
      ) 
    },
    { 
      key: 'position', 
      header: 'Jabatan', 
      render: (emp) => (
        emp.position?.name ? (
          <span 
            className="text-gray-700 font-medium block max-w-[150px] md:max-w-[180px] truncate" 
            title={emp.position.name}
          >
            {emp.position.name}
          </span>
        ) : (
          <span className="text-gray-400 italic text-xs">Belum ada jabatan</span>
        )
      )
    },
    { 
      key: 'contact', 
      header: 'Kontak', 
      render: (emp) => (
        <div className="flex flex-col text-xs">
          <span 
            className="text-gray-900 font-medium block max-w-[160px] md:max-w-[200px] truncate" 
            title={emp.email || ''}
          >
            {emp.email || '-'}
          </span>
          <span className="text-gray-500">{emp.phone || '-'}</span>
        </div>
      ) 
    },
    { 
      key: 'employmentStatus', 
      header: 'Status Pegawai', 
      render: (emp) => (
        <Badge variant={emp.employmentStatus === 'Aktif' ? 'success' : emp.employmentStatus === 'Resign' ? 'danger' : 'warning'}>
          {emp.employmentStatus || '-'}
        </Badge>
      ) 
    },
    { 
      key: 'isActive', 
      header: 'Status Akun', 
      render: (emp) => (
        <Badge variant={emp.isActive ? 'success' : 'default'}>
          {emp.isActive ? 'Aktif' : 'Tidak Aktif'}
        </Badge>
      ) 
    }
  ];

  if (hasActions) {
    columns.push({ 
      key: 'actions', 
      header: 'Aksi', 
      render: (emp) => (
        <div className="flex items-center gap-1.5 justify-end">
          {activeTab === 'active' ? (
            <>
              {canEditEmployee && (
                <button 
                  type="button"
                  className={`p-1.5 rounded-xl transition-colors ${
                    emp.isActive ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  onClick={() => handleToggle(emp)}
                  title={emp.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                >
                  {emp.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                </button>
              )}
              <ActionButtons 
                onEdit={canEditEmployee ? () => openEdit(emp) : undefined} 
                onDelete={canDeleteEmployee ? () => handleDelete(emp) : undefined} 
              />
            </>
          ) : canDeleteEmployee ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              onClick={() => handleRestore(emp)}
              title="Pulihkan Pegawai dari Archive"
            >
              <RefreshCw size={13} />
              <span>Pulihkan</span>
            </button>
          ) : null}
        </div>
      ) 
    });
  }

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Pegawai & Guru" 
        subtitle="Manajemen data pegawai, tenaga pendidik, dan akun sistem sekolah"
        action={
          canCreateEmployee && activeTab === 'active' ? (
            <button 
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors" 
              onClick={openAdd}
            >
              <Plus size={16} /> 
              <span>Tambah Pegawai Baru</span>
            </button>
          ) : undefined
        }
      />

      {/* 2. Tabs Navigation (Aktif vs Archive) */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'active'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
        >
          <UserCheck size={16} />
          <span>Pegawai Aktif</span>
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        {canDeleteEmployee && (
          <button
            type="button"
            className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
              activeTab === 'deleted'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setActiveTab('deleted'); setCurrentPage(1); }}
          >
            <Archive size={16} />
            <span>Archive</span>
            {activeTab === 'deleted' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
        )}
      </div>

      {/* 4. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Pegawai
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari NIP, NIK, atau Nama Pegawai..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {activeTab === 'active' && (
          <div className="w-full sm:w-52 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Jabatan / Posisi
            </label>
            <div className="relative group">
              <Briefcase 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
                size={16} 
              />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={filterPosition}
                onChange={(e) => {
                  setFilterPosition(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {positionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(searchTerm || filterPosition) && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterPosition('');
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Data Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage={
            activeTab === 'active' 
              ? (searchTerm || filterPosition ? 'Tidak ada pegawai yang cocok dengan kriteria filter.' : 'Belum ada data pegawai.')
              : 'Tidak ada data pegawai dalam archive.'
          }
        />

        {!loading && meta?.totalPages > 0 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination 
              currentPage={currentPage} 
              totalPages={meta.totalPages} 
              totalItems={meta.total} 
              itemsPerPage={itemsPerPage} 
              onPageChange={setCurrentPage} 
              onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }} 
            />
          </div>
        )}
      </div>

      {/* 5. Modal Tambah / Edit Pegawai */}
      <Modal 
        open={modal.open} 
        onClose={closeModal} 
        title={modal.editId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'} 
        size="lg"
      >
        <form id="employee-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FormField label="Jabatan Utama" required>
                <Select
                  wrapperClassName="w-full"
                  value={form.positionId}
                  onChange={handlePositionChange}
                  options={[
                    { value: '', label: '-- Pilih Jabatan --' },
                    ...positions.map(pos => ({ value: pos.id, label: pos.name }))
                  ]}
                  required
                />
              </FormField>
            </div>
            
            <FormField label="NIP / NIK / No. Induk" required>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" 
                value={form.employeeNumber} 
                onChange={setField('employeeNumber')} 
                placeholder="Contoh: 198501012010011001"
                required 
              />
            </FormField>

            <FormField label="Nama Lengkap" required>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
                value={form.fullName} 
                onChange={setField('fullName')} 
                placeholder="Nama lengkap beserta gelar"
                required 
              />
            </FormField>

            <FormField label="Email">
              <input 
                type="email" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
                value={form.email} 
                onChange={setField('email')} 
                placeholder="email@sekolah.sch.id"
              />
            </FormField>

            <FormField label="No. HP / WhatsApp">
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
                value={form.phone} 
                onChange={setField('phone')} 
                placeholder="08123456789"
              />
            </FormField>

            <FormField label="Jenis Kelamin">
              <Select
                wrapperClassName="w-full"
                value={form.gender}
                onChange={setField('gender')}
                options={[
                  { value: 'Laki-laki', label: 'Laki-laki' },
                  { value: 'Perempuan', label: 'Perempuan' }
                ]}
              />
            </FormField>

            <FormField label="Status Kepegawaian">
              <Select
                wrapperClassName="w-full"
                value={form.employmentStatus}
                onChange={setField('employmentStatus')}
                options={[
                  { value: 'Aktif', label: 'Aktif Bekerja' },
                  { value: 'Cuti', label: 'Sedang Cuti' },
                  { value: 'Resign', label: 'Resign' },
                  { value: 'Pensiun', label: 'Pensiun' }
                ]}
              />
            </FormField>

            {!modal.editId ? (
              <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mt-2">
                <label className="flex items-center gap-3 cursor-pointer font-semibold text-gray-900 mb-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                    checked={form.createAccount} 
                    onChange={handleCreateAccountChange} 
                  />
                  Buat Akun Login untuk Pegawai Ini
                </label>
                {form.createAccount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <FormField label="Username" required>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
                        value={form.username} 
                        onChange={setField('username')} 
                        required={form.createAccount} 
                        placeholder="Contoh: guru_budi" 
                      />
                    </FormField>
                    <FormField label="Password" required>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
                        value={form.password} 
                        onChange={setField('password')} 
                        required={form.createAccount} 
                        placeholder="Minimal 6 karakter" 
                      />
                    </FormField>
                    {(() => {
                      const selectedPos = positions.find(p => String(p.id) === String(form.positionId));
                      const isAutoSynced = Boolean(selectedPos?.mappedRoleId && String(form.roleId) === String(selectedPos.mappedRoleId));
                      return (
                        <div className="md:col-span-2">
                          <FormField 
                            label="Peran Akun (Role)" 
                            required 
                            hint={isAutoSynced ? `Otomatis disinkronkan dengan jabatan "${selectedPos?.name}"` : undefined}
                          >
                            <Select
                              wrapperClassName="w-full"
                              value={form.roleId}
                              onChange={setField('roleId')}
                              options={[
                                { value: '', label: '-- Pilih Peran Akun --' },
                                ...roles.map(role => ({ value: role.id, label: role.name }))
                              ]}
                              required={form.createAccount}
                            />
                          </FormField>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                    checked={form.isActive} 
                    onChange={setField('isActive')} 
                  />
                  <span className="text-sm font-medium">
                    Status Pegawai Aktif 
                    <span className="font-normal text-gray-500 block mt-0.5">
                      (Menonaktifkan ini akan menonaktifkan akun login terkait)
                    </span>
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={closeModal}
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
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Standard ConfirmDialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
