import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  getViolations, 
  createViolation, 
  updateViolation, 
  deleteViolation, 
  getViolationTypes,
  getMyViolationClassrooms,
  type Violation, 
  type ViolationType 
} from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { getAcademicYears, type AcademicYear, type Classroom } from '../../api/academicService';
import { 
  Plus, 
  Search, 
  User, 
  Loader2, 
  AlertTriangle, 
  RotateCcw, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  ShieldAlert, 
  Sparkles,
  PenLine,
  Filter,
  Users,
  RefreshCw
} from 'lucide-react';
import { PageHeader, Modal, FormField, Badge, type BadgeVariant } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { useClientPagination } from '../../hooks/useClientPagination';
import { notify } from '../../utils/feedback';
import { trimPayload } from '../../utils/formSanitizer';
import { ViolationTypesTab } from './ViolationTypesTab';

interface ViolationForm {
  studentId: string;
  violationTypeId: string;
  isCustom: boolean;
  title: string;
  category: string;
  points: number | string;
  actionTaken: string;
  notes: string;
  violationDate: string;
  academicYearId: string;
}

const DEFAULT_FORM: ViolationForm = {
  studentId: '',
  violationTypeId: '',
  isCustom: false,
  title: '',
  category: 'Ringan',
  points: 5,
  actionTaken: '',
  notes: '',
  violationDate: new Date().toISOString().split('T')[0],
  academicYearId: '',
};

export const Violations: React.FC = () => {
  const { user } = useAuth();
  const { 
    hasPermission,
    canCreateViolationType,
  } = usePermissions();

  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah' || r.name === 'Kepala Sekolah' || r.name === 'Staf Kesiswaan') ?? false;

  const canCreateAll = isSuperAdmin || hasPermission('violations.create_all') || hasPermission('violations.manage');
  const canCreateAssigned = hasPermission('violations.create_assigned') || hasPermission('violations.create') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const canCreate = canCreateAll || canCreateAssigned;
  const canEdit = isSuperAdmin || hasPermission('violations.update') || hasPermission('violations.manage');
  const canDelete = isSuperAdmin || hasPermission('violations.delete') || hasPermission('violations.manage') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const hasActions = canEdit || canDelete;

  // Tab State
  const [activeTab, setActiveTab] = useState<'records' | 'catalog'>('records');
  const [openViolationTypeModalTrigger, setOpenViolationTypeModalTrigger] = useState(0);

  // Master References
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [modalClassrooms, setModalClassrooms] = useState<Classroom[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);

  // Main Data & Filters
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Student Search in Modal
  const [students, setStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalClassroomId, setModalClassroomId] = useState('');

  // Modal & Form State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<ViolationForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    action: async () => {},
  });

  // Load References
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [years, crs, vTypes] = await Promise.all([
          getAcademicYears().catch(() => []),
          getMyViolationClassrooms().catch(() => []),
          getViolationTypes({ isActive: true }).catch(() => []),
        ]);
        setAcademicYears(years);
        setClassrooms(crs);
        setViolationTypes(vTypes);

        const activeYear = years.find((y: any) => y.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        }

        // If user is restricted to assigned rombel and only has 1 assigned classroom, auto-select it in filter
        if (!canCreateAll && crs.length === 1) {
          setSelectedClassroom(crs[0].id);
        }
      } catch (err) {
        console.error('Gagal memuat referensi data', err);
      }
    };
    fetchReferences();
  }, [canCreateAll]);

  // Synchronize main table classrooms filter when selectedAcademicYear changes
  useEffect(() => {
    if (selectedAcademicYear) {
      const targetYear = selectedAcademicYear === 'all' ? undefined : selectedAcademicYear;
      getMyViolationClassrooms(targetYear)
        .then((crs) => {
          setClassrooms(crs);
          if (!canCreateAll) {
            if (crs.length === 1) {
              setSelectedClassroom(crs[0].id);
            } else if (!crs.some((c: any) => c.id === selectedClassroom)) {
              setSelectedClassroom('');
            }
          }
        })
        .catch(() => setClassrooms([]));
    }
  }, [selectedAcademicYear, canCreateAll]);

  // Synchronize modal classrooms when modal is open and form.academicYearId changes
  useEffect(() => {
    if (modal.open && form.academicYearId) {
      getMyViolationClassrooms(form.academicYearId)
        .then((crs) => {
          setModalClassrooms(crs);
          if (!canCreateAll) {
            if (crs.length === 1) {
              setModalClassroomId(crs[0].id);
            } else if (!crs.some((c: any) => c.id === modalClassroomId)) {
              setModalClassroomId('');
            }
          }
        })
        .catch(() => setModalClassrooms([]));
    }
  }, [modal.open, form.academicYearId, canCreateAll]);

  const fetchActiveViolationTypes = useCallback(async () => {
    try {
      const vTypes = await getViolationTypes({ isActive: true });
      setViolationTypes(vTypes);
    } catch (err) {
      console.error('Gagal memperbarui kamus tata tertib', err);
    }
  }, []);

  // Fetch Violations from Backend with Filters
  const fetchViolations = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedAcademicYear) params.academicYearId = selectedAcademicYear;
      if (selectedClassroom) params.classroomId = selectedClassroom;
      if (categoryFilter) params.category = categoryFilter;

      const data = await getViolations(params);
      setViolations(data);
    } catch (err: any) {
      notify.error(err, 'Gagal memuat data pelanggaran siswa');
    } finally {
      setLoading(false);
    }
  }, [search, selectedAcademicYear, selectedClassroom, categoryFilter]);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchViolations();
      fetchActiveViolationTypes();
    }
  }, [fetchViolations, fetchActiveViolationTypes, activeTab]);

  // Debounced student search in modal with classroom scoping
  useEffect(() => {
    if (searchStudent.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const params: any = { search: searchStudent, limit: 30 };
          if (modalClassroomId) {
            params.classroomId = modalClassroomId;
          }
          const data = await getStudents(params);
          setStudents(data);
        } catch (err) {
          console.error(err);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
    }
  }, [searchStudent, modalClassroomId]);

  const handleOpenModal = (item?: Violation) => {
    fetchActiveViolationTypes();
    if (item) {
      const isCustomViolation = !item.violationTypeId;
      setForm({
        studentId: item.studentId || '',
        violationTypeId: item.violationTypeId || '',
        isCustom: isCustomViolation,
        title: item.title || '',
        category: item.category || 'Ringan',
        points: item.points ?? 0,
        actionTaken: item.actionTaken || '',
        notes: item.notes || '',
        violationDate: item.violationDate ? item.violationDate.split('T')[0] : '',
        academicYearId: item.academicYear?.id || (item as any).academicYearId || selectedAcademicYear,
      });
      setSelectedStudent((item.student as any) || null);
      setModalClassroomId('');
      setSearchStudent('');
      setModal({ open: true, editId: item.id });
    } else {
      const defaultYear = selectedAcademicYear && selectedAcademicYear !== 'all' 
        ? selectedAcademicYear 
        : (academicYears.find(y => y.isActive)?.id || '');
      setForm({
        ...DEFAULT_FORM,
        academicYearId: defaultYear,
        violationDate: new Date().toISOString().split('T')[0],
      });
      setSelectedStudent(null);
      // Auto-assign classroom in modal if teacher only has 1 assigned classroom or already filtered
      if (!canCreateAll && classrooms.length === 1) {
        setModalClassroomId(classrooms[0].id);
      } else if (selectedClassroom) {
        setModalClassroomId(selectedClassroom);
      } else {
        setModalClassroomId('');
      }
      setSearchStudent('');
      setModal({ open: true, editId: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, editId: null });
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setForm((prev) => ({ ...prev, studentId: s.id }));
    setSearchStudent('');
    setStudents([]);
  };

  const handleSelectViolationType = (typeId: string) => {
    const selected = violationTypes.find((vt) => vt.id === typeId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        violationTypeId: selected.id,
        title: selected.name,
        category: selected.category || 'Ringan',
        points: selected.points ?? 5,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        violationTypeId: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !modal.editId) {
      notify.error('Anda tidak memiliki izin untuk mencatat data pelanggaran siswa.');
      return;
    }
    if (!canEdit && modal.editId) {
      notify.error('Anda tidak memiliki izin untuk mengubah data pelanggaran siswa.');
      return;
    }

    if (!form.studentId) {
      notify.error('Siswa wajib dipilih.');
      return;
    }

    if (form.isCustom && !form.title.trim()) {
      notify.warning('Judul pelanggaran kustom wajib diisi.');
      return;
    }

    if (!form.isCustom && !form.violationTypeId && !form.title.trim()) {
      notify.warning('Pilih jenis pelanggaran dari kamus tata tertib atau gunakan opsi pelanggaran kustom.');
      return;
    }

    if (!form.violationDate) {
      notify.warning('Tanggal kejadian pelanggaran wajib diisi.');
      return;
    }

    const dateObj = new Date(form.violationDate);
    if (isNaN(dateObj.getTime())) {
      notify.warning('Format tanggal kejadian tidak valid.');
      return;
    }

    const pointsNum = Math.max(0, Math.round(Number(form.points) || 0));

    try {
      setIsSubmitting(true);
      const payload = trimPayload({
        studentId: form.studentId,
        violationTypeId: form.isCustom ? undefined : form.violationTypeId || undefined,
        title: form.title.trim(),
        category: form.category,
        points: pointsNum,
        actionTaken: form.actionTaken,
        notes: form.notes,
        violationDate: dateObj.toISOString(),
        academicYearId: form.academicYearId || undefined,
      });

      if (modal.editId) {
        await updateViolation(modal.editId, payload);
        notify.success('Data pelanggaran berhasil diperbarui');
      } else {
        await createViolation(payload);
        notify.success('Data pelanggaran baru berhasil dicatat');
      }

      handleCloseModal();
      fetchViolations();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan data pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      notify.error('Anda tidak memiliki izin untuk menghapus data pelanggaran siswa.');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Hapus Data Pelanggaran',
      message: 'Apakah Anda yakin ingin menghapus catatan pelanggaran ini? Poin penalti siswa akan dikurangi kembali.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteViolation(id);
          notify.success('Data pelanggaran berhasil dihapus');
          fetchViolations();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus data pelanggaran');
        }
      },
    });
  };

  const getCategoryBadgeVariant = (cat?: string): BadgeVariant => {
    if (!cat) return 'info';
    const lower = cat.toLowerCase();
    if (lower === 'berat') return 'danger';
    if (lower === 'sedang') return 'warning';
    return 'info';
  };

  const columns = useMemo<Column<Violation>[]>(() => [
    {
      key: 'student',
      header: 'Siswa & Rombel',
      sortable: true,
      className: 'whitespace-nowrap',
      sortValue: (r: Violation) => r.student?.fullName || '',
      render: (row: Violation) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold text-xs uppercase shadow-2xs">
            {row.student?.fullName ? row.student.fullName.charAt(0).toUpperCase() : <User size={15} />}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-tight whitespace-nowrap">{row.student?.fullName || '-'}</div>
            <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
              <span className="text-xs text-slate-500 font-mono">NIS: {row.student?.nis || '-'}</span>
              {row.student?.classroomName && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  Kelas {row.student.classroomName}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Pelanggaran & Kategori',
      sortable: true,
      className: 'whitespace-nowrap',
      sortValue: (r: Violation) => r.title || r.violationType?.name || '',
      render: (row: Violation) => (
        <div className="flex flex-col gap-1.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {row.violationType?.code && (
              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded shrink-0">
                {row.violationType.code}
              </span>
            )}
            <span className="font-semibold text-slate-800 text-sm leading-snug">
              {row.title || row.violationType?.name}
            </span>
          </div>
          <div className="flex items-center">
            <Badge variant={getCategoryBadgeVariant(row.category || row.violationType?.category)}>
              {row.category || row.violationType?.category || 'Ringan'}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      sortable: true,
      className: 'whitespace-nowrap',
      sortValue: (r: Violation) => r.violationDate || '',
      render: (row: Violation) => (
        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
          {new Date(row.violationDate || new Date()).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Poin Penalti',
      sortable: true,
      headerClassName: 'text-center',
      className: 'text-center whitespace-nowrap',
      sortValue: (r: Violation) => r.points || 0,
      render: (row: Violation) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-2xs whitespace-nowrap">
          -{row.points || 0}
        </span>
      ),
    },
    {
      key: 'actionTaken',
      header: 'Tindakan & Sanksi',
      sortable: false,
      render: (row: Violation) => (
        <div className="flex flex-col gap-0.5 max-w-[280px]">
          <span className="text-xs font-semibold text-slate-800 truncate block" title={row.actionTaken || undefined}>
            {row.actionTaken || '-'}
          </span>
          {row.notes && (
            <span className="text-xs text-slate-400 truncate block" title={row.notes}>
              {row.notes}
            </span>
          )}
        </div>
      ),
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      sortable: false,
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (row: Violation) => (
        <div className="flex justify-end">
          <ActionButtons
            onEdit={canEdit ? () => handleOpenModal(row) : undefined}
            onDelete={canDelete ? () => handleDelete(row.id) : undefined}
          />
        </div>
      ),
    }] : []),
  ], [canEdit, canDelete, hasActions]);

  // Compound Client Pagination & Sorting
  const { paginatedItems, pagination, sortConfig, onSortChange } = useClientPagination(
    violations,
    10,
    [search, selectedAcademicYear, selectedClassroom, categoryFilter],
    columns,
    { key: 'date', direction: 'desc' }
  );

  const hasActiveFilter = Boolean(search || categoryFilter || selectedClassroom || (selectedAcademicYear && selectedAcademicYear !== 'all'));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader
        title="Pelanggaran Siswa & Tata Tertib"
        subtitle="Kelola pencatatan riwayat pelanggaran kedisiplinan dan kamus aturan tata tertib sekolah."
        action={
          activeTab === 'records' ? (
            canCreate && (
              <button 
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors cursor-pointer" 
                onClick={() => handleOpenModal()}
              >
                <Plus size={16} />
                <span>Catat Pelanggaran</span>
              </button>
            )
          ) : (
            (canCreateViolationType || isSuperAdmin) && (
              <button 
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors cursor-pointer" 
                onClick={() => setOpenViolationTypeModalTrigger((c) => c + 1)}
              >
                <Plus size={16} />
                <span>Tambah Aturan Baru</span>
              </button>
            )
          )
        }
      />

      {/* Tabs Navigation Standar (Pola Students.tsx) */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'records'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('records')}
        >
          <ShieldAlert size={16} />
          <span>Riwayat Pelanggaran</span>
          {activeTab === 'records' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>

        <button
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('catalog')}
        >
          <BookOpen size={16} />
          <span>Kamus Tata Tertib</span>
          {activeTab === 'catalog' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      {/* TAB 1: RIWAYAT PELANGGARAN SISWA */}
      {activeTab === 'records' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar Standar (Students.tsx Pattern) */}
          <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Pencarian Siswa / Catatan
              </label>
              <div className="relative group">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
                  size={16}
                />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium placeholder:text-gray-400"
                  placeholder="Cari nama, NIS, judul pelanggaran, atau sanksi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full sm:w-56 min-w-[190px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Tahun Ajaran
              </label>
              <div className="relative group">
                <Calendar
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
                  size={16}
                />
                <select
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                >
                  <option value="all">Semua Tahun Ajaran</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} {ay.isActive ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full sm:w-52 min-w-[180px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Rombel / Kelas
              </label>
              <div className="relative group">
                <Users
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
                  size={16}
                />
                <select
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                >
                  <option value="">Semua Rombel</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {(c as any).majorName ? `(${(c as any).majorName})` : c.major?.name ? `(${c.major.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full sm:w-48 min-w-[170px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Kategori
              </label>
              <div className="relative group">
                <AlertTriangle
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
                  size={16}
                />
                <select
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  <option value="Ringan">Pelanggaran Ringan</option>
                  <option value="Sedang">Pelanggaran Sedang</option>
                  <option value="Berat">Pelanggaran Berat</option>
                </select>
              </div>
            </div>

            {hasActiveFilter && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedClassroom('');
                    setCategoryFilter('');
                    setSelectedAcademicYear('all');
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm cursor-pointer"
                  title="Reset seluruh filter"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              </div>
            )}

            <div className="flex items-center ml-auto">
              <button
                type="button"
                onClick={() => fetchViolations()}
                className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                title="Muat Ulang Data Pelanggaran"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* DataTable dengan Compound Pagination & Sorting */}
          <DataTable
            columns={columns}
            data={paginatedItems}
            loading={loading}
            sortConfig={sortConfig}
            onSortChange={onSortChange}
            emptyMessage="Belum ada catatan pelanggaran siswa yang sesuai dengan filter."
            pagination={pagination}
          />
        </div>
      )}

      {/* TAB 2: KAMUS TATA TERTIB / JENIS PELANGGARAN */}
      {activeTab === 'catalog' && (
        <div className="animate-in fade-in duration-200">
          <ViolationTypesTab openCreateModalTrigger={openViolationTypeModalTrigger} />
        </div>
      )}

      {/* Modal Form Tambah / Edit Pelanggaran Siswa */}
      <Modal
        open={modal.open}
        onClose={handleCloseModal}
        title={modal.editId ? 'Edit Catatan Pelanggaran Siswa' : 'Catat Pelanggaran Siswa Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Access Mode Indicator */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${canCreateAll ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <span>
              <strong>Mode Akses:</strong> {canCreateAll ? 'Seluruh Siswa (Akses Global / BK / Kesiswaan)' : 'Siswa Kelas yang Diampu / Diwalikan Saja'}
            </span>
          </div>

          <FormField label="Tahun Ajaran" required>
            <select
              className="input-std cursor-pointer"
              value={form.academicYearId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, academicYearId: e.target.value }));
                if (selectedStudent && !modal.editId) {
                  setSelectedStudent(null);
                  setForm(prev => ({ ...prev, studentId: '' }));
                }
              }}
              required
            >
              <option value="">Pilih Tahun Ajaran...</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField 
            label={canCreateAll ? "Rombel / Kelas (Opsional untuk menyaring siswa)" : "Rombel / Kelas Binaan"} 
            required={!canCreateAll && !modal.editId}
          >
            <select
              className="input-std cursor-pointer"
              value={modalClassroomId}
              onChange={(e) => {
                setModalClassroomId(e.target.value);
                if (selectedStudent && !modal.editId) {
                  setSelectedStudent(null);
                  setForm((prev) => ({ ...prev, studentId: '' }));
                }
              }}
              disabled={!!modal.editId}
              required={!canCreateAll && !modal.editId}
            >
              <option value="">
                {canCreateAll 
                  ? "Semua Kelas (Pencarian Siswa Bebas)" 
                  : modalClassrooms.length === 0 
                    ? "Tidak ada rombel binaan pada tahun ajaran ini" 
                    : "Pilih Rombel Binaan..."}
              </option>
              {modalClassrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {(c as any).majorName ? `(${(c as any).majorName})` : c.major?.name ? `(${c.major.name})` : ''}
                </option>
              ))}
            </select>
            {!canCreateAll && modalClassrooms.length > 0 && (
              <span className="text-[11px] text-indigo-600 mt-1 block">
                * Khusus mode rombel binaan: siswa yang dicari akan otomatis disaring sesuai kelas yang Anda pilih.
              </span>
            )}
            {!canCreateAll && modalClassrooms.length === 0 && (
              <span className="text-[11px] text-rose-600 font-medium mt-1 block">
                * Perhatian: Akun Anda tidak memiliki penugasan Wali Kelas atau Guru Mapel aktif pada tahun ajaran yang dipilih.
              </span>
            )}
          </FormField>

          <FormField label="Siswa Pelanggar" required>
            {!selectedStudent ? (
              <div className="relative">
                <input
                  type="text"
                  className="input-std pl-10"
                  placeholder={
                    !canCreateAll && modalClassrooms.length === 0
                      ? "Tidak ada rombel binaan pada tahun ajaran ini."
                      : !canCreateAll && !modalClassroomId && modalClassrooms.length > 1 
                        ? "Pilih Rombel Binaan di atas terlebih dahulu..." 
                        : "Ketik minimal 2 huruf nama atau NIS siswa..."
                  }
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  disabled={!canCreateAll && (modalClassrooms.length === 0 || (!modalClassroomId && modalClassrooms.length > 1))}
                />
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={17} />

                {students.length > 0 && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {students.map((s) => {
                      const classroomName = s.enrollments?.[0]?.classroom?.name;
                      return (
                        <div
                          key={s.id}
                          className="p-3 hover:bg-indigo-50/60 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{s.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">NIS: {s.nis}</div>
                          </div>
                          {classroomName && (
                            <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shrink-0">
                              Kelas {classroomName}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-700 shadow-2xs font-bold text-sm border border-indigo-100">
                    {selectedStudent.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{selectedStudent.fullName}</span>
                      {selectedStudent.enrollments?.[0]?.classroom?.name && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-800 font-semibold border border-indigo-200/60">
                          Kelas {selectedStudent.enrollments[0].classroom.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">NIS: {selectedStudent.nis}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-indigo-600 font-semibold hover:bg-white px-3 py-1.5 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                  onClick={() => {
                    setSelectedStudent(null);
                    setForm((prev) => ({ ...prev, studentId: '' }));
                  }}
                >
                  Ganti Siswa
                </button>
              </div>
            )}
          </FormField>

          {/* Segmented Switcher untuk Pemilihan Mode Pelanggaran */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 block">
              Sumber Jenis Pelanggaran <span className="text-rose-500">*</span>
            </label>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full select-none">
              <button
                type="button"
                onClick={() => {
                  if (form.isCustom) {
                    setForm((p) => ({ ...p, isCustom: false, title: '' }));
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !form.isCustom
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen size={14} />
                <span>Pilih dari Kamus Tata Tertib</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.isCustom) {
                    setForm((p) => ({ ...p, isCustom: true, violationTypeId: '' }));
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  form.isCustom
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenLine size={14} />
                <span>Catatan Kejadian Kustom</span>
              </button>
            </div>

            {!form.isCustom ? (
              <div className="relative">
                <select
                  className="input-std cursor-pointer text-slate-900 font-medium"
                  value={form.violationTypeId}
                  onChange={(e) => handleSelectViolationType(e.target.value)}
                >
                  <option value="">-- Pilih Aturan dari Kamus Tata Tertib Sekolah --</option>
                  {violationTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      [{vt.code}] {vt.name} (-{vt.points} Poin - {vt.category})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Kategori dan poin standar otomatis terisi berdasarkan jenis aturan yang dipilih.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  className="input-std"
                  placeholder="Ketik nama kejadian pelanggaran khusus..."
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
                <div className="text-[11px] text-amber-600 font-medium">
                  Mode Kustom: Catatan kejadian khusus yang belum terdaftar di kamus tata tertib resmi.
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Kategori Tingkat" required>
              <select
                className="input-std cursor-pointer"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="Ringan">Ringan (Pembinaan Dasar)</option>
                <option value="Sedang">Sedang (Peringatan Tertulis)</option>
                <option value="Berat">Berat (Penanganan Khusus / SP)</option>
              </select>
            </FormField>

            <FormField label="Tanggal Kejadian" required>
              <input
                type="date"
                className="input-std"
                value={form.violationDate}
                onChange={(e) => setForm((p) => ({ ...p, violationDate: e.target.value }))}
                required
              />
            </FormField>
          </div>

          <FormField label="Poin Pengurangan Kedisiplinan">
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input-std font-bold text-rose-700 w-36"
                value={form.points}
                onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
                min={0}
                placeholder="0"
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-2xs">
                  -{form.points || 0} Poin
                </span>
                <span className="text-xs text-slate-500">
                  {form.isCustom ? 'Nilai poin penalti' : 'Nilai bawaan aturan resmi'}
                </span>
              </div>
            </div>
          </FormField>

          <FormField label="Tindakan / Sanksi yang Diberikan">
            <input
              type="text"
              className="input-std"
              value={form.actionTaken}
              onChange={(e) => setForm((p) => ({ ...p, actionTaken: e.target.value }))}
              placeholder="Misal: Teguran lisan, Pembersihan perpustakaan, Pemanggilan orang tua..."
            />
          </FormField>

          <FormField label="Keterangan / Catatan Tambahan (Opsional)">
            <textarea
              className="input-std min-h-[75px]"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Catatan kronologi kejadian, saksi, atau penjelasan siswa..."
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="btn-std-secondary px-5"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-std-primary px-6 flex items-center gap-2 cursor-pointer"
              disabled={isSubmitting || !form.studentId}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Menyimpan...' : modal.editId ? 'Simpan Perubahan' : 'Catat Pelanggaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onClose={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
};
