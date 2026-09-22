import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, ChevronRight, FileUp, FileDown, RefreshCw, User, Archive, Eye, Loader2, Search, Filter, RotateCcw } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { ImportStudentModal } from './ImportStudentModal';
import { useStudents } from '../../hooks/useStudents';
import { usePermissions } from '../../hooks/usePermissions';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { PageHeader, Modal, FormField, Badge, Select, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { notify } from '../../utils/feedback';
import { getAcademicYears, getSemesters, getClassrooms, getMajors, type AcademicYear, type Semester, type Classroom, type Major } from '../../api/academicService';
import { exportStudents } from '../../api/studentService';

interface WizardForm {
  nis: string;
  nisn: string;
  fullName: string;
  gender: string;
  status: string;
  majorId: string;
  guardianRel: string;
  guardianName: string;
  guardianPhone: string;
  selectedAy: string;
  selectedSem: string;
  selectedClass: string;
  createUserAccount: boolean;
}

const DEFAULT_WIZARD_FORM: WizardForm = {
  nis: '', nisn: '', fullName: '', gender: 'Laki-laki', status: 'ACTIVE', majorId: '',
  guardianRel: 'Ayah', guardianName: '', guardianPhone: '',
  selectedAy: '', selectedSem: '', selectedClass: '', createUserAccount: true
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'GRADUATED', label: 'Lulus' },
  { value: 'TRANSFER', label: 'Pindahan' },
  { value: 'DROPOUT', label: 'Keluar' }
];

export const Students: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { items, meta, loading, createWizard, restore, remove, load } = useStudents({
    page: currentPage, limit: itemsPerPage, search: searchTerm, 
    status: filterStatus || undefined, isDeleted: activeTab === 'deleted'
  });
  const { 
    canCreateStudent, 
    canDeleteStudent, 
    canImportExportStudent,
    canReadStudents 
  } = usePermissions();
  const canImportExport = canImportExportStudent;

  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [wizardModal, setWizardModal] = useState({ open: false, step: 1 });
  const [submittingWizard, setSubmittingWizard] = useState(false);
  const [form, setForm] = useState<WizardForm>(DEFAULT_WIZARD_FORM);

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: string;
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

  const setField = (field: keyof WizardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const [masterData, setMasterData] = useState({
    academicYears: [] as AcademicYear[],
    semesters: [] as Semester[],
    classrooms: [] as Classroom[],
    majors: [] as Major[]
  });
  const [activeAyId, setActiveAyId] = useState('');
  const [activeSemId, setActiveSemId] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [ayData, semData, classData, majorsData] = await Promise.all([
          getAcademicYears(), getSemesters(), getClassrooms(), getMajors()
        ]);
        setMasterData({ academicYears: ayData, semesters: semData, classrooms: classData, majors: majorsData });
        
        const activeAy = ayData.find(ay => ay.isActive);
        const activeSem = semData.find(sem => sem.isActive);
        
        if (activeAy) {
          setActiveAyId(activeAy.id);
          setForm(prev => ({ ...prev, selectedAy: activeAy.id }));
        }
        if (activeSem) {
          setActiveSemId(activeSem.id);
          setForm(prev => ({ ...prev, selectedSem: activeSem.id }));
        }
      } catch (err) {
        console.error("Failed to fetch wizard master data", err);
      }
    };
    fetchMasterData();
  }, []);

  const openWizard = () => {
    if (!canCreateStudent) {
      notify.error('Anda tidak memiliki izin untuk mendaftarkan siswa baru.');
      return;
    }
    setWizardModal({ open: true, step: 1 });
  };

  const openImport = () => {
    if (!canImportExport) {
      notify.error('Anda tidak memiliki izin untuk mengimpor data siswa.');
      return;
    }
    setIsImportModalOpen(true);
  };

  const handleRestore = (student: any) => {
    if (!canDeleteStudent) {
      notify.error('Anda tidak memiliki izin untuk memulihkan siswa dari Archive.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'warning',
      title: `Pulihkan Siswa "${student.fullName}"`,
      message: `Apakah Anda yakin ingin memulihkan (restore) data siswa "${student.fullName}" (NIS: ${student.nis}) dari Archive kembali ke daftar aktif?`,
      confirmText: 'Ya, Pulihkan Siswa',
      onConfirm: async () => {
        try {
          await restore(student.id);
          notify.success(`Data siswa "${student.fullName}" berhasil dipulihkan dari Archive!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal memulihkan data siswa');
        }
      }
    });
  };

  const handleDelete = (student: any) => {
    if (!canDeleteStudent) {
      notify.error('Anda tidak memiliki izin untuk mengarsipkan siswa.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Arsipkan Siswa "${student.fullName}"`,
      message: `Apakah Anda yakin ingin memindahkan data siswa "${student.fullName}" (NIS: ${student.nis}) ke dalam Archive? Data siswa tidak akan ditampilkan pada daftar aktif.`,
      confirmText: 'Ya, Arsipkan Siswa',
      onConfirm: async () => {
        try {
          await remove(student.id);
          notify.success(`Data siswa "${student.fullName}" berhasil dipindahkan ke Archive!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal mengarsipkan siswa');
        }
      }
    });
  };

  const closeWizard = () => {
    setWizardModal({ open: false, step: 1 });
    setForm({ ...DEFAULT_WIZARD_FORM, selectedAy: activeAyId, selectedSem: activeSemId });
  };

  const submitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateStudent) {
      notify.error('Anda tidak memiliki izin untuk mendaftarkan siswa baru.');
      return;
    }
    try {
      setSubmittingWizard(true);
      await createWizard({
        nis: form.nis,
        nisn: form.nisn || undefined,
        fullName: form.fullName,
        gender: form.gender,
        status: form.status,
        majorId: form.majorId || undefined,
        guardians: [{
          relationship: form.guardianRel,
          fullName: form.guardianName,
          phone: form.guardianPhone || undefined,
          isPrimary: true
        }],
        enrollment: {
          academicYearId: form.selectedAy,
          semesterId: form.selectedSem,
          classroomId: form.selectedClass || undefined,
        },
        createUserAccount: form.createUserAccount
      });
      notify.success(`Pendaftaran siswa baru "${form.fullName}" berhasil disimpan!`);
      closeWizard();
    } catch (err: any) {
      notify.error(err, 'Terjadi kesalahan saat mendaftar siswa');
    } finally {
      setSubmittingWizard(false);
    }
  };

  const handleExport = async () => {
    if (!canImportExport) {
      notify.error('Anda tidak memiliki izin untuk mengekspor data siswa.');
      return;
    }
    try {
      setIsExporting(true);
      const blob = await exportStudents({
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        isDeleted: activeTab === 'deleted',
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const todayStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `data-siswa-${todayStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notify.success('Data siswa berhasil diekspor ke Excel!');
    } catch (err: any) {
      notify.error(err, 'Gagal mengekspor data siswa');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<any>[] = [
    { 
      key: 'nis', 
      header: 'NIS / NISN', 
      render: (student) => (
        <div>
          <div className="font-mono text-xs font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 inline-block">
            {student.nis}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">{student.nisn || '-'}</div>
        </div>
      )
    },
    { 
      key: 'fullName', 
      header: 'Nama Lengkap', 
      render: (student) => (
        <div>
          <span 
            className="font-semibold text-gray-900 block max-w-[180px] md:max-w-[240px] truncate" 
            title={student.fullName}
          >
            {student.fullName}
          </span>
          <span className="text-xs text-gray-500 mt-0.5 block">
            {student.gender === 'Laki-laki' || student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
          </span>
        </div>
      )
    },
    { 
      key: 'major', 
      header: 'Jurusan', 
      render: (student) => (
        student.major?.name ? (
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs border border-indigo-100 max-w-[150px] truncate block"
            title={student.major.name}
          >
            {student.major.name}
          </span>
        ) : <span className="text-gray-400 text-xs">-</span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (student) => (
        <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'TRANSFER' ? 'info' : student.status === 'GRADUATED' ? 'purple' : 'danger'}>
          {student.status === 'ACTIVE' ? 'Aktif' : student.status === 'TRANSFER' ? 'Pindahan' : student.status === 'GRADUATED' ? 'Lulus' : student.status === 'DROPOUT' ? 'Keluar' : student.status}
        </Badge>
      )
    },
    { 
      key: 'class', 
      header: 'Kelas Saat Ini', 
      render: (student) => {
        const currentEnrollment = student.enrollments?.find((e: any) => e.academicYearId === activeAyId && e.semesterId === activeSemId);
        return currentEnrollment?.classroom?.name ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span 
              className="font-semibold text-gray-700 text-xs max-w-[140px] truncate block" 
              title={currentEnrollment.classroom.name}
            >
              {currentEnrollment.classroom.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0"></span>
            <span className="text-xs text-gray-400 italic">Belum Masuk</span>
          </div>
        );
      }
    },
    { 
      key: 'actions', 
      header: 'Aksi', 
      render: (student) => (
        <div className="flex items-center justify-end gap-1.5">
          {activeTab === 'active' ? (
            <>
              <button 
                type="button"
                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                onClick={() => navigate(`/entities/students/${student.id}`)} 
                title="Lihat Detail Siswa"
              >
                <Eye size={16} />
              </button>
              {canDeleteStudent && (
                <button 
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                  onClick={() => handleDelete(student)} 
                  title="Arsipkan Siswa"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </>
          ) : canDeleteStudent ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              onClick={() => handleRestore(student)}
              title="Pulihkan Siswa dari Archive"
            >
              <RefreshCw size={13} />
              <span>Pulihkan</span>
            </button>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Siswa & Wali Murid" 
        subtitle="Pendaftaran dan manajemen riwayat siswa terpadu"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {canImportExport && (
              <button 
                type="button"
                className="btn-std-secondary" 
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <FileDown size={18} />} 
                <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
              </button>
            )}
            {activeTab === 'active' && canImportExport && (
              <button 
                type="button"
                className="btn-std-secondary" 
                onClick={openImport}
              >
                <FileUp size={18} /> 
                <span>Import Excel</span>
              </button>
            )}
            {activeTab === 'active' && canCreateStudent && (
              <button 
                type="button"
                className="btn-std-primary" 
                onClick={openWizard}
              >
                <Plus size={18} /> 
                <span>Pendaftaran Siswa Baru</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Tabs Aktif vs Archive */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${activeTab === 'active' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
        >
          <User size={16} />
          <span>Siswa Aktif</span>
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        {canDeleteStudent && (
          <button
            type="button"
            className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${activeTab === 'deleted' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('deleted'); setCurrentPage(1); }}
          >
            <Archive size={16} />
            <span>Arsip / Terhapus</span>
            {activeTab === 'deleted' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
        )}
      </div>

      {/* 4. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Siswa
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari NIS, NISN, atau Nama Siswa..."
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
              Status Kesiswaan
            </label>
            <div className="relative group">
              <Filter 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
                size={16} 
              />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(searchTerm || filterStatus) && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
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

      {/* 5. DataTable Container with Pagination */}
      <div className="flex flex-col">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          hasPagination={!loading && meta?.totalPages > 0}
          emptyMessage={activeTab === 'deleted' ? 'Tidak ada data siswa dalam archive.' : 'Belum ada data siswa ditemukan.'}
        />

        {!loading && meta?.totalPages > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={meta.totalPages} 
            totalItems={meta.total} 
            itemsPerPage={itemsPerPage} 
            onPageChange={setCurrentPage} 
            onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }} 
          />
        )}
      </div>

      {/* Wizard Pendaftaran Siswa Baru */}
      <Modal 
        open={wizardModal.open} 
        onClose={closeWizard} 
        title="Pendaftaran Siswa Baru" 
        size="lg"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100 rounded-b-2xl">
            <button 
              type="button" 
              className="btn-std-secondary" 
              onClick={() => wizardModal.step > 1 ? setWizardModal(prev => ({ ...prev, step: prev.step - 1 })) : closeWizard()}
              disabled={submittingWizard}
            >
              {wizardModal.step > 1 ? <><ChevronLeft size={16}/> Kembali</> : 'Batal'}
            </button>
            <button 
              type="button" 
              className="btn-std-primary" 
              onClick={(e) => wizardModal.step === 3 ? submitWizard(e) : setWizardModal(prev => ({ ...prev, step: prev.step + 1 }))}
              disabled={submittingWizard}
            >
              {submittingWizard && <Loader2 size={16} className="animate-spin" />}
              {wizardModal.step < 3 ? <>Selanjutnya <ChevronRight size={16}/></> : submittingWizard ? 'Mendaftarkan...' : 'Selesaikan Pendaftaran'}
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6 p-6">
          <div className="px-2 pt-2 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-300" style={{ width: wizardModal.step === 1 ? '10%' : wizardModal.step === 2 ? '50%' : '100%' }} />
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500">
              <span className={wizardModal.step >= 1 ? 'text-indigo-600 font-bold' : ''}>Data Siswa</span>
              <span className={wizardModal.step >= 2 ? 'text-indigo-600 font-bold' : ''}>Data Wali</span>
              <span className={wizardModal.step >= 3 ? 'text-indigo-600 font-bold' : ''}>Penempatan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {wizardModal.step === 1 && (
              <>
                <FormField label="NIS" required>
                  <input type="text" className="input-std" value={form.nis} onChange={setField('nis')} placeholder="Nomor Induk Siswa" required />
                </FormField>
                <FormField label="NISN">
                  <input type="text" className="input-std" value={form.nisn} onChange={setField('nisn')} placeholder="NISN Nasional (Opsional)" />
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Nama Lengkap Siswa" required>
                    <input type="text" className="input-std" value={form.fullName} onChange={setField('fullName')} placeholder="Nama lengkap siswa" required />
                  </FormField>
                </div>
                <FormField label="Jenis Kelamin">
                  <select className="input-std" value={form.gender} onChange={setField('gender')}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </FormField>
                <FormField label="Jurusan" hint="(Opsional)">
                  <select className="input-std" value={form.majorId} onChange={setField('majorId')}>
                    <option value="">-- Tidak Ada Jurusan --</option>
                    {masterData.majors.filter(m => m.isActive).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Status Masuk">
                    <select className="input-std" value={form.status} onChange={setField('status')}>
                      <option value="ACTIVE">Siswa Baru (Aktif)</option>
                      <option value="TRANSFER">Siswa Pindahan</option>
                    </select>
                  </FormField>
                </div>
              </>
            )}
            {wizardModal.step === 2 && (
              <>
                <FormField label="Hubungan Wali" required>
                  <select className="input-std" value={form.guardianRel} onChange={setField('guardianRel')} required>
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Kakek">Kakek</option>
                    <option value="Nenek">Nenek</option>
                    <option value="Paman">Paman</option>
                    <option value="Bibi">Bibi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </FormField>
                <FormField label="Nomor Telepon">
                  <input type="text" className="input-std" value={form.guardianPhone} onChange={setField('guardianPhone')} placeholder="Nomor WhatsApp/HP aktif" />
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Nama Lengkap Wali" required>
                    <input type="text" className="input-std" value={form.guardianName} onChange={setField('guardianName')} placeholder="Nama wali/orang tua" required />
                  </FormField>
                </div>
              </>
            )}
            {wizardModal.step === 3 && (
              <>
                <FormField label="Tahun Ajaran" required>
                  <select className="input-std" value={form.selectedAy} onChange={setField('selectedAy')} required>
                    <option value="">-- Pilih Tahun Ajaran --</option>
                    {masterData.academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.name} {ay.isActive ? '(Aktif)' : ''}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Semester" required>
                  <select className="input-std" value={form.selectedSem} onChange={setField('selectedSem')} required>
                    <option value="">-- Pilih Semester --</option>
                    {masterData.semesters.filter(s => s.academicYearId === form.selectedAy).map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Aktif)' : ''}</option>
                    ))}
                  </select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Rombongan Belajar (Kelas)" hint="(Opsional)">
                    <select className="input-std" value={form.selectedClass} onChange={setField('selectedClass')}>
                      <option value="">-- Belum Masuk Kelas --</option>
                      {masterData.classrooms.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div className="md:col-span-2 mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="pt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                        checked={form.createUserAccount} 
                        onChange={setField('createUserAccount')} 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Buat Akun Akses Sistem</p>
                      <p className="text-xs text-gray-600 mt-1">Otomatis membuat akun login untuk siswa ini. Password default akan disamakan dengan NIS.</p>
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
        </form>
      </Modal>

      {/* Modern Confirm Dialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
      />

      <ImportStudentModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => { setIsImportModalOpen(false); load(); }} 
      />
    </div>
  );
};

