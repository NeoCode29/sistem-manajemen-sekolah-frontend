import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  FileUp, 
  FileDown, 
  RefreshCw, 
  User, 
  UserCheck,
  Archive, 
  Eye, 
  Loader2, 
  Search, 
  Filter, 
  RotateCcw,
  Copy,
  MapPin,
  ShieldCheck,
  Home,
  Check
} from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { ImportStudentModal } from './ImportStudentModal';
import { useStudents } from '../../hooks/useStudents';
import { usePermissions } from '../../hooks/usePermissions';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { PageHeader, Modal, FormField, Badge, Select, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { notify } from '../../utils/feedback';
import { getAcademicYears, getSemesters, getClassrooms, getMajors, type AcademicYear, type Semester, type Classroom, type Major } from '../../api/academicService';
import { exportStudents, type Student } from '../../api/studentService';
import {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
  getOccupations,
  type Province,
  type Regency,
  type District,
  type Village,
  type Occupation,
} from '../../api/referenceService';

const RELIGIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const RESIDENCE_TYPES = [
  'Bersama Orang Tua',
  'Wali',
  'Kost',
  'Asrama',
  'Panti Asuhan',
  'Lainnya'
];
const TRANSPORT_MODES = [
  'Jalan Kaki',
  'Sepeda',
  'Sepeda Motor',
  'Mobil Pribadi',
  'Antar Jemput Sekolah',
  'Angkutan Umum',
  'Ojek',
  'Lainnya'
];

interface WizardForm {
  // Step 1: Data Pokok
  nis: string;
  nisn: string;
  fullName: string;
  nickname: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  nationality: string;
  status: string;
  phone: string;
  email: string;

  // Step 2: Kependudukan & Alamat Wilayah
  nationalId: string;
  familyCardNo: string;
  birthCertificateNo: string;
  birthOrder: string;
  siblingCount: string;
  address: string;
  subVillage: string;
  provinceCode: string;
  regencyCode: string;
  districtCode: string;
  villageCode: string;
  postalCode: string;
  residenceType: string;
  transportationMode: string;

  // Step 3: Data Wali
  guardianRel: string;
  guardianName: string;
  guardianNationalId: string;
  guardianOccupationId: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;

  // Step 4: Penempatan Kelas & Akun
  selectedAy: string;
  selectedSem: string;
  selectedClass: string;
  enrollmentDate: string;
  createUserAccount: boolean;
}

const DEFAULT_WIZARD_FORM: WizardForm = {
  nis: '', nisn: '', fullName: '', nickname: '', gender: 'Laki-laki',
  birthPlace: '', birthDate: '', religion: 'Islam', nationality: 'Indonesia',
  status: 'ACTIVE', phone: '', email: '',
  nationalId: '', familyCardNo: '', birthCertificateNo: '', birthOrder: '', siblingCount: '',
  address: '', subVillage: '', provinceCode: '', regencyCode: '', districtCode: '', villageCode: '', postalCode: '',
  residenceType: 'Bersama Orang Tua', transportationMode: 'Sepeda Motor',
  guardianRel: 'Ayah', guardianName: '', guardianNationalId: '', guardianOccupationId: '', guardianPhone: '', guardianEmail: '', guardianAddress: '',
  selectedAy: '', selectedSem: '', selectedClass: '', enrollmentDate: new Date().toISOString().split('T')[0], createUserAccount: true
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

  // Region and Reference States
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    onConfirm: () => {}
  });

  const [masterData, setMasterData] = useState<{
    academicYears: AcademicYear[];
    semesters: Semester[];
    classrooms: Classroom[];
    majors: Major[];
  }>({ academicYears: [], semesters: [], classrooms: [], majors: [] });

  const activeAyId = useMemo(() => {
    return masterData.academicYears.find(ay => ay.isActive)?.id || '';
  }, [masterData.academicYears]);

  const activeSemId = useMemo(() => {
    return masterData.semesters.find(s => s.isActive && s.academicYearId === activeAyId)?.id || '';
  }, [masterData.semesters, activeAyId]);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [ays, sems, cls, majs] = await Promise.all([
          getAcademicYears(),
          getSemesters(),
          getClassrooms(),
          getMajors()
        ]);
        setMasterData({
          academicYears: ays,
          semesters: sems,
          classrooms: cls,
          majors: majs
        });
      } catch (err) {
        console.error('Failed to load master data', err);
      }
    };
    fetchMaster();
  }, []);

  // Fetch provinces & occupations when wizard opens
  useEffect(() => {
    if (wizardModal.open) {
      if (provinces.length === 0) {
        setLoadingProvinces(true);
        getProvinces()
          .then(setProvinces)
          .catch((e) => console.error('Failed to load provinces', e))
          .finally(() => setLoadingProvinces(false));
      }
      if (occupations.length === 0) {
        getOccupations()
          .then(setOccupations)
          .catch((e) => console.error('Failed to load occupations', e));
      }
    }
  }, [wizardModal.open, provinces.length, occupations.length]);

  // Cascading Region: Province -> Regency
  useEffect(() => {
    if (!form.provinceCode) {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      return;
    }
    setLoadingRegencies(true);
    getRegencies(form.provinceCode)
      .then(setRegencies)
      .catch((e) => console.error('Failed to load regencies', e))
      .finally(() => setLoadingRegencies(false));
  }, [form.provinceCode]);

  // Cascading Region: Regency -> District
  useEffect(() => {
    if (!form.regencyCode) {
      setDistricts([]);
      setVillages([]);
      return;
    }
    setLoadingDistricts(true);
    getDistricts(form.regencyCode)
      .then(setDistricts)
      .catch((e) => console.error('Failed to load districts', e))
      .finally(() => setLoadingDistricts(false));
  }, [form.regencyCode]);

  // Cascading Region: District -> Village
  useEffect(() => {
    if (!form.districtCode) {
      setVillages([]);
      return;
    }
    setLoadingVillages(true);
    getVillages(form.districtCode)
      .then(setVillages)
      .catch((e) => console.error('Failed to load villages', e))
      .finally(() => setLoadingVillages(false));
  }, [form.districtCode]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      provinceCode: val,
      regencyCode: '',
      districtCode: '',
      villageCode: '',
    }));
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      regencyCode: val,
      districtCode: '',
      villageCode: '',
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      districtCode: val,
      villageCode: '',
    }));
  };

  const copyStudentAddressToGuardian = () => {
    let fullAddress = form.address;
    const parts = [];
    if (form.subVillage) parts.push(form.subVillage);
    const prov = provinces.find(p => p.code === form.provinceCode)?.name;
    const reg = regencies.find(r => r.code === form.regencyCode)?.name;
    const dist = districts.find(d => d.code === form.districtCode)?.name;
    const vil = villages.find(v => v.code === form.villageCode)?.name;
    if (vil) parts.push(`Desa/Kel. ${vil}`);
    if (dist) parts.push(`Kec. ${dist}`);
    if (reg) parts.push(reg);
    if (prov) parts.push(prov);
    if (form.postalCode) parts.push(form.postalCode);

    const combined = [fullAddress, parts.join(', ')].filter(Boolean).join(', ');
    setForm(prev => ({ ...prev, guardianAddress: combined || prev.address }));
    notify.info('Alamat domisili siswa berhasil disalin ke alamat wali.');
  };

  const handleOpenWizard = () => {
    setForm({
      ...DEFAULT_WIZARD_FORM,
      selectedAy: activeAyId,
      selectedSem: activeSemId,
      enrollmentDate: new Date().toISOString().split('T')[0],
    });
    setWizardModal({ open: true, step: 1 });
  };

  const handleRestore = (student: any) => {
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

  const handleNextStep = () => {
    if (wizardModal.step === 1) {
      if (!form.nis.trim() || !form.fullName.trim()) {
        notify.error('Mohon lengkapi NIS dan Nama Lengkap siswa terlebih dahulu.');
        return;
      }
    } else if (wizardModal.step === 2) {
      if (form.nationalId && form.nationalId.length > 0 && form.nationalId.length !== 16) {
        notify.warning('Nomor NIK KTP umumnya terdiri dari 16 digit angka.');
      }
    } else if (wizardModal.step === 3) {
      if (!form.guardianName.trim()) {
        notify.error('Mohon isi Nama Lengkap Wali.');
        return;
      }
    }
    setWizardModal(prev => ({ ...prev, step: prev.step + 1 }));
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
        nis: form.nis.trim(),
        nisn: form.nisn.trim() || undefined,
        fullName: form.fullName.trim(),
        nickname: form.nickname.trim() || undefined,
        gender: form.gender,
        birthPlace: form.birthPlace.trim() || undefined,
        birthDate: form.birthDate || undefined,
        religion: form.religion || undefined,
        nationality: form.nationality.trim() || undefined,
        status: form.status,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        nationalId: form.nationalId.trim() || undefined,
        familyCardNo: form.familyCardNo.trim() || undefined,
        birthCertificateNo: form.birthCertificateNo.trim() || undefined,
        birthOrder: form.birthOrder ? parseInt(form.birthOrder, 10) : undefined,
        siblingCount: form.siblingCount ? parseInt(form.siblingCount, 10) : undefined,
        address: form.address.trim() || undefined,
        subVillage: form.subVillage.trim() || undefined,
        provinceCode: form.provinceCode || undefined,
        regencyCode: form.regencyCode || undefined,
        districtCode: form.districtCode || undefined,
        villageCode: form.villageCode || undefined,
        postalCode: form.postalCode.trim() || undefined,
        residenceType: form.residenceType || undefined,
        transportationMode: form.transportationMode || undefined,
        guardians: [{
          relationship: form.guardianRel,
          fullName: form.guardianName.trim(),
          nationalId: form.guardianNationalId.trim() || undefined,
          occupationId: form.guardianOccupationId || undefined,
          phone: form.guardianPhone.trim() || undefined,
          email: form.guardianEmail.trim() || undefined,
          address: form.guardianAddress.trim() || undefined,
          isPrimary: true
        }],
        enrollment: {
          academicYearId: form.selectedAy,
          semesterId: form.selectedSem,
          classroomId: form.selectedClass || undefined,
          enrollmentDate: form.enrollmentDate || undefined,
        },
        createUserAccount: form.createUserAccount
      });
      notify.success(`Pendaftaran siswa baru "${form.fullName}" berhasil disimpan!`);
      closeWizard();
      load();
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
      notify.success('Data siswa berhasil diekspor ke Excel!');
    } catch (err: any) {
      notify.error(err, 'Gagal mengekspor data siswa');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      key: 'nis',
      header: 'NIS / NISN',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.nis}</span>
          <span className="text-xs text-gray-500">{row.nisn || '-'}</span>
        </div>
      ),
    },
    {
      key: 'fullName',
      header: 'Nama Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
            {row.fullName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 leading-tight">{row.fullName}</span>
            <span className="text-[11px] text-gray-400 capitalize">{row.gender}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'classroom',
      header: 'Jurusan / Kelas',
      render: (row: any) => {
        const activeEnrollment = row.enrollments?.find((e: any) => e.academicYear?.isActive && e.semester?.isActive) || row.enrollments?.[0];
        const className = activeEnrollment?.classroom?.name;
        const majorName = row.major?.name || activeEnrollment?.classroom?.major?.name;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-gray-800">{className || <span className="text-gray-400 italic">Belum Ada Kelas</span>}</span>
            {majorName && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit border border-indigo-100/50">{majorName}</span>}
          </div>
        );
      }
    },

    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const isStudentActive = row.status === 'ACTIVE' || row.status === 'Aktif';
        return (
          <Badge variant={isStudentActive ? 'success' : 'default'}>
            {isStudentActive ? 'Aktif' : row.status}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            onClick={() => navigate(`/entities/students/${row.id}`)}
            title="Lihat Detail Profil Siswa"
          >
            <Eye size={16} />
          </button>
          {activeTab === 'deleted' ? (
            <button
              type="button"
              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
              onClick={() => handleRestore(row)}
              title="Pulihkan dari Archive"
            >
              <RotateCcw size={16} />
            </button>
          ) : (
            canDeleteStudent && (
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => handleDelete(row)}
                title="Pindahkan ke Archive"
              >
                <Trash2 size={16} />
              </button>
            )
          )}
        </div>
      ),
    },
  ];

  const setField = (key: keyof WizardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Siswa & Wali Murid"
        subtitle="Pendaftaran, penempatan rombel, dan manajemen data pokok siswa terpadu."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            {canImportExport && (
              <>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-gray-700 text-xs md:text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Ekspor seluruh data siswa ke format Excel"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <FileDown size={15} className="text-gray-500" />}
                  <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-gray-700 text-xs md:text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs cursor-pointer"
                  title="Import data siswa massal melalui file Excel"
                >
                  <FileUp size={15} className="text-gray-500" />
                  <span>Import Excel</span>
                </button>
              </>
            )}

            {canCreateStudent && activeTab === 'active' && (
              <button
                type="button"
                onClick={handleOpenWizard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Pendaftaran Siswa Baru</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Tabs Navigation (Siswa Aktif vs Archive) */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'active'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
        >
          <UserCheck size={16} />
          <span>Siswa Aktif</span>
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        {canDeleteStudent && (
          <button
            type="button"
            className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${
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

      {/* 3. Filter Bar Pola Standar (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
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
          <div className="w-full sm:w-56 min-w-[190px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Status Kesiswaan
            </label>
            <div className="relative group">
              <Filter 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
                size={16} 
              />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-900 font-medium"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
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
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}

        <div className="flex items-center ml-auto">
          <button
            type="button"
            onClick={() => load()}
            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4. Data Table & Pagination Card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage={
            activeTab === 'deleted' 
              ? 'Tidak ada data siswa di dalam archive.' 
              : 'Tidak ada data siswa yang ditemukan.'
          }
        />

        {meta && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={meta.total}
            />
          </div>
        )}
      </div>

      {/* 5. 4-Step Wizard Pendaftaran Siswa Baru */}
      <Modal 
        open={wizardModal.open} 
        onClose={closeWizard} 
        title="Pendaftaran Siswa Baru" 
        size="xl"
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
              onClick={(e) => wizardModal.step === 4 ? submitWizard(e) : handleNextStep()}
              disabled={submittingWizard}
            >
              {submittingWizard && <Loader2 size={16} className="animate-spin" />}
              {wizardModal.step < 4 ? <>Selanjutnya <ChevronRight size={16}/></> : submittingWizard ? 'Mendaftarkan...' : 'Selesaikan Pendaftaran'}
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6 p-6">
          {/* Stepper Indicator (4 Steps) */}
          <div className="px-2 pt-2 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-300" 
                style={{ 
                  width: wizardModal.step === 1 ? '12%' : wizardModal.step === 2 ? '38%' : wizardModal.step === 3 ? '68%' : '100%' 
                }} 
              />
              
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs transition-colors ${wizardModal.step >= 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>4</div>
            </div>
            <div className="grid grid-cols-4 mt-2 text-xs font-semibold text-gray-500 text-center">
              <span className={wizardModal.step >= 1 ? 'text-indigo-600 font-bold' : ''}>1. Data Pokok</span>
              <span className={wizardModal.step >= 2 ? 'text-indigo-600 font-bold' : ''}>2. Kependudukan & Wilayah</span>
              <span className={wizardModal.step >= 3 ? 'text-indigo-600 font-bold' : ''}>3. Data Wali</span>
              <span className={wizardModal.step >= 4 ? 'text-indigo-600 font-bold' : ''}>4. Penempatan</span>
            </div>
          </div>

          {/* STEP 1: Data Pokok Siswa */}
          {wizardModal.step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="NIS (Nomor Induk Siswa)" required>
                <input 
                  type="text" 
                  className="input-std" 
                  value={form.nis} 
                  onChange={setField('nis')} 
                  placeholder="Contoh: 20260001" 
                  required 
                />
              </FormField>
              <FormField label="NISN (Nasional)" hint="(Opsional)">
                <input 
                  type="text" 
                  className="input-std" 
                  value={form.nisn} 
                  onChange={setField('nisn')} 
                  placeholder="Nomor Induk Siswa Nasional" 
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Nama Lengkap Siswa" required>
                  <input 
                    type="text" 
                    className="input-std" 
                    value={form.fullName} 
                    onChange={setField('fullName')} 
                    placeholder="Nama lengkap sesuai akta / ijazah" 
                    required 
                  />
                </FormField>
              </div>

              <FormField label="Nama Panggilan" hint="(Opsional)">
                <input 
                  type="text" 
                  className="input-std" 
                  value={form.nickname} 
                  onChange={setField('nickname')} 
                  placeholder="Nama panggilan akrab" 
                />
              </FormField>

              <FormField label="Jenis Kelamin" required>
                <select className="input-std" value={form.gender} onChange={setField('gender')}>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </FormField>

              <FormField label="Tempat Lahir">
                <input 
                  type="text" 
                  className="input-std" 
                  value={form.birthPlace} 
                  onChange={setField('birthPlace')} 
                  placeholder="Kota / Kabupaten kelahiran" 
                />
              </FormField>

              <FormField label="Tanggal Lahir">
                <input 
                  type="date" 
                  className="input-std" 
                  value={form.birthDate} 
                  onChange={setField('birthDate')} 
                />
              </FormField>

              <FormField label="Agama">
                <select className="input-std" value={form.religion} onChange={setField('religion')}>
                  {RELIGIONS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Kewarganegaraan">
                <input 
                  type="text" 
                  className="input-std" 
                  value={form.nationality} 
                  onChange={setField('nationality')} 
                  placeholder="Indonesia" 
                />
              </FormField>

              <FormField label="Status Masuk">
                <select className="input-std" value={form.status} onChange={setField('status')}>
                  <option value="ACTIVE">Siswa Baru (Aktif)</option>
                  <option value="TRANSFER">Siswa Pindahan</option>
                </select>
              </FormField>

              <FormField label="No. Telepon / WhatsApp Siswa">
                <input 
                  type="text" 
                  className="input-std" 
                  value={form.phone} 
                  onChange={setField('phone')} 
                  placeholder="08xxxxxxxxxx" 
                />
              </FormField>

              <FormField label="Email Siswa">
                <input 
                  type="email" 
                  className="input-std" 
                  value={form.email} 
                  onChange={setField('email')} 
                  placeholder="siswa@domain.com" 
                />
              </FormField>
            </div>
          )}

          {/* STEP 2: Kependudukan & Alamat Wilayah */}
          {wizardModal.step === 2 && (
            <div className="space-y-6">
              {/* Seksi Dokumen Kependudukan */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <ShieldCheck size={16} />
                  <span>Identitas Dokumen Kependudukan (Dapodik)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="NIK Siswa (No. KTP)" hint="16 Digit">
                    <input 
                      type="text" 
                      maxLength={16}
                      className="input-std" 
                      value={form.nationalId} 
                      onChange={setField('nationalId')} 
                      placeholder="Nomor Induk Kependudukan" 
                    />
                  </FormField>
                  <FormField label="Nomor Kartu Keluarga (KK)" hint="16 Digit">
                    <input 
                      type="text" 
                      maxLength={16}
                      className="input-std" 
                      value={form.familyCardNo} 
                      onChange={setField('familyCardNo')} 
                      placeholder="Nomor Kartu Keluarga" 
                    />
                  </FormField>
                  <FormField label="Nomor Akta Kelahiran">
                    <input 
                      type="text" 
                      className="input-std" 
                      value={form.birthCertificateNo} 
                      onChange={setField('birthCertificateNo')} 
                      placeholder="No. registrasi akta kelahiran" 
                    />
                  </FormField>
                  <FormField label="Anak Ke-">
                    <input 
                      type="number" 
                      min="1"
                      className="input-std" 
                      value={form.birthOrder} 
                      onChange={setField('birthOrder')} 
                      placeholder="1" 
                    />
                  </FormField>
                  <FormField label="Jumlah Saudara Kandung">
                    <input 
                      type="number" 
                      min="0"
                      className="input-std" 
                      value={form.siblingCount} 
                      onChange={setField('siblingCount')} 
                      placeholder="0" 
                    />
                  </FormField>
                </div>
              </div>

              {/* Seksi Alamat Domisili & Wilayah */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <MapPin size={16} />
                  <span>Alamat Domisili & Transportasi</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField label="Alamat Jalan / Rumah (Termasuk RT/RW)">
                      <textarea 
                        rows={2}
                        className="input-std" 
                        value={form.address} 
                        onChange={setField('address')} 
                        placeholder="Nama jalan, nomor rumah, RT/RW, gang, atau patokan domisili" 
                      />
                    </FormField>
                  </div>

                  <FormField label="Dusun / Lingkungan">
                    <input 
                      type="text" 
                      className="input-std" 
                      value={form.subVillage} 
                      onChange={setField('subVillage')} 
                      placeholder="Nama dusun / kampung / banjar" 
                    />
                  </FormField>

                  {/* Cascading Wilayah */}
                  <FormField label="Provinsi">
                    <select 
                      className="input-std" 
                      value={form.provinceCode} 
                      onChange={handleProvinceChange}
                      disabled={loadingProvinces}
                    >
                      <option value="">{loadingProvinces ? 'Memuat provinsi...' : '-- Pilih Provinsi --'}</option>
                      {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Kabupaten / Kota">
                    <select 
                      className="input-std" 
                      value={form.regencyCode} 
                      onChange={handleRegencyChange}
                      disabled={!form.provinceCode || loadingRegencies}
                    >
                      <option value="">
                        {!form.provinceCode 
                          ? '-- Pilih Provinsi Terlebih Dahulu --' 
                          : loadingRegencies 
                          ? 'Memuat kab/kota...' 
                          : '-- Pilih Kabupaten/Kota --'}
                      </option>
                      {regencies.map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Kecamatan">
                    <select 
                      className="input-std" 
                      value={form.districtCode} 
                      onChange={handleDistrictChange}
                      disabled={!form.regencyCode || loadingDistricts}
                    >
                      <option value="">
                        {!form.regencyCode 
                          ? '-- Pilih Kab/Kota Terlebih Dahulu --' 
                          : loadingDistricts 
                          ? 'Memuat kecamatan...' 
                          : '-- Pilih Kecamatan --'}
                      </option>
                      {districts.map(d => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Desa / Kelurahan">
                    <select 
                      className="input-std" 
                      value={form.villageCode} 
                      onChange={setField('villageCode')}
                      disabled={!form.districtCode || loadingVillages}
                    >
                      <option value="">
                        {!form.districtCode 
                          ? '-- Pilih Kecamatan Terlebih Dahulu --' 
                          : loadingVillages 
                          ? 'Memuat desa/kelurahan...' 
                          : '-- Pilih Desa/Kelurahan --'}
                      </option>
                      {villages.map(v => (
                        <option key={v.code} value={v.code}>{v.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Kode Pos">
                    <input 
                      type="text" 
                      maxLength={10}
                      className="input-std" 
                      value={form.postalCode} 
                      onChange={setField('postalCode')} 
                      placeholder="Kode pos domisili" 
                    />
                  </FormField>

                  <FormField label="Status Tempat Tinggal">
                    <select className="input-std" value={form.residenceType} onChange={setField('residenceType')}>
                      {RESIDENCE_TYPES.map(res => (
                        <option key={res} value={res}>{res}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Moda Transportasi">
                    <select className="input-std" value={form.transportationMode} onChange={setField('transportationMode')}>
                      {TRANSPORT_MODES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Data Orang Tua / Wali */}
          {wizardModal.step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField label="NIK Wali (No. KTP)" hint="16 Digit">
                  <input 
                    type="text" 
                    maxLength={16}
                    className="input-std" 
                    value={form.guardianNationalId} 
                    onChange={setField('guardianNationalId')} 
                    placeholder="Nomor KTP wali" 
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Nama Lengkap Wali" required>
                    <input 
                      type="text" 
                      className="input-std" 
                      value={form.guardianName} 
                      onChange={setField('guardianName')} 
                      placeholder="Nama lengkap wali / orang tua" 
                      required 
                    />
                  </FormField>
                </div>

                <FormField label="Pekerjaan Wali">
                  <select 
                    className="input-std" 
                    value={form.guardianOccupationId} 
                    onChange={setField('guardianOccupationId')}
                  >
                    <option value="">-- Pilih Pekerjaan --</option>
                    {occupations.map(occ => (
                      <option key={occ.id} value={occ.id}>{occ.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="No. Telepon / WhatsApp Wali">
                  <input 
                    type="text" 
                    className="input-std" 
                    value={form.guardianPhone} 
                    onChange={setField('guardianPhone')} 
                    placeholder="Nomor WhatsApp/HP aktif untuk kontak darurat" 
                  />
                </FormField>

                <FormField label="Email Wali">
                  <input 
                    type="email" 
                    className="input-std" 
                    value={form.guardianEmail} 
                    onChange={setField('guardianEmail')} 
                    placeholder="email@wali.com" 
                  />
                </FormField>

                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Alamat Wali</label>
                    <button
                      type="button"
                      onClick={copyStudentAddressToGuardian}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Salin dari Alamat Siswa</span>
                    </button>
                  </div>
                  <textarea 
                    rows={2}
                    className="input-std" 
                    value={form.guardianAddress} 
                    onChange={setField('guardianAddress')} 
                    placeholder="Alamat domisili lengkap wali" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Penempatan Kelas & Akun */}
          {wizardModal.step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="md:col-span-2">
                <FormField label="Tanggal Masuk / Terdaftar">
                  <input 
                    type="date" 
                    className="input-std" 
                    value={form.enrollmentDate} 
                    onChange={setField('enrollmentDate')} 
                  />
                </FormField>
              </div>

              <div className="md:col-span-2 mt-2 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
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
                    <p className="text-xs text-gray-600 mt-1">Otomatis membuat akun login untuk siswa ini. Username dan password default akan disamakan dengan NIS.</p>
                  </div>
                </label>
              </div>
            </div>
          )}
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

export default Students;
