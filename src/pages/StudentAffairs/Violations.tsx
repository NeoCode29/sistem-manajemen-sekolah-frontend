import React, { useEffect, useState, useCallback } from 'react';
import { 
  getViolations, 
  createViolation, 
  updateViolation, 
  deleteViolation, 
  getViolationTypes,
  type Violation, 
  type ViolationType 
} from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { getAcademicYears, getClassrooms, type AcademicYear, type Classroom } from '../../api/academicService';
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
  ArrowRightLeft
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
  const { hasPermission } = usePermissions();

  const isSuperAdmin = user?.roles?.some(r => 
    r.name === 'Super Admin' || r.name === 'Admin Sekolah' || r.name === 'Kepala Sekolah' || r.name === 'Staf Kesiswaan'
  ) ?? false;

  const canCreateAll = isSuperAdmin || hasPermission('violations.create_all') || hasPermission('violations.manage');
  const canCreateAssigned = hasPermission('violations.create_assigned') || hasPermission('violations.create') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const canCreate = canCreateAll || canCreateAssigned;
  const canEdit = isSuperAdmin || hasPermission('violations.update') || hasPermission('violations.manage');
  const canDelete = isSuperAdmin || hasPermission('violations.delete') || hasPermission('violations.manage') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const hasActions = canEdit || canDelete;

  // Tab State
  const [activeTab, setActiveTab] = useState<'records' | 'catalog'>('records');

  // Master References
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
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
          getClassrooms().catch(() => []),
          getViolationTypes({ isActive: true }).catch(() => []),
        ]);
        setAcademicYears(years);
        setClassrooms(crs);
        setViolationTypes(vTypes);

        const activeYear = years.find((y: any) => y.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        }
      } catch (err) {
        console.error('Gagal memuat referensi data', err);
      }
    };
    fetchReferences();
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
    }
  }, [fetchViolations, activeTab]);

  // Debounced student search in modal
  useEffect(() => {
    if (searchStudent.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const data = await getStudents({ search: searchStudent, limit: 30 });
          setStudents(data);
        } catch (err) {
          console.error(err);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
    }
  }, [searchStudent]);

  // Compound Client Pagination
  const { paginatedItems, pagination } = useClientPagination(
    violations,
    10,
    [search, selectedAcademicYear, selectedClassroom, categoryFilter]
  );

  const handleOpenModal = (item?: Violation) => {
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
        academicYearId: item.academicYear?.id || selectedAcademicYear,
      });
      setSelectedStudent((item.student as any) || null);
      setSearchStudent('');
      setModal({ open: true, editId: item.id });
    } else {
      setForm({
        ...DEFAULT_FORM,
        academicYearId: selectedAcademicYear,
        violationDate: new Date().toISOString().split('T')[0],
      });
      setSelectedStudent(null);
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

    try {
      setIsSubmitting(true);
      const payload = trimPayload({
        studentId: form.studentId,
        violationTypeId: form.isCustom ? null : form.violationTypeId || null,
        title: form.title.trim(),
        category: form.category,
        points: Number(form.points) || 0,
        actionTaken: form.actionTaken,
        notes: form.notes,
        violationDate: new Date(form.violationDate).toISOString(),
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
    if (!cat) return 'default';
    if (cat.toLowerCase() === 'berat') return 'danger';
    if (cat.toLowerCase() === 'sedang') return 'warning';
    return 'default';
  };

  const columns: Column<Violation>[] = [
    {
      key: 'student',
      header: 'Siswa & Rombel',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600 font-bold text-xs">
            {row.student?.fullName ? row.student.fullName.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{row.student?.fullName || '-'}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-mono">NIS: {row.student?.nis || '-'}</span>
              {row.student?.classroomName && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {row.student.classroomName}
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
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {row.violationType?.code && (
              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                {row.violationType.code}
              </span>
            )}
            <span className="font-semibold text-slate-800 text-sm">{row.title || row.violationType?.name}</span>
          </div>
          <div>
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
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
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
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-2xs">
          -{row.points || 0}
        </span>
      ),
    },
    {
      key: 'actionTaken',
      header: 'Tindakan & Sanksi',
      render: (row) => (
        <div className="flex flex-col gap-0.5 max-w-[220px]">
          <span className="text-xs font-semibold text-slate-800 truncate">{row.actionTaken || '-'}</span>
          {row.notes && (
            <span className="text-xs text-slate-400 truncate" title={row.notes}>
              {row.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'recordedBy',
      header: 'Dicatat Oleh',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-800">
            {row.recordedBy?.fullName || '-'}
          </span>
          {row.recordedBy?.employeeNumber && (
            <span className="text-[10px] text-slate-400 font-mono">
              NIP: {row.recordedBy.employeeNumber}
            </span>
          )}
        </div>
      ),
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      render: (row: Violation) => (
        <div className="flex justify-end">
          <ActionButtons
            onEdit={canEdit ? () => handleOpenModal(row) : undefined}
            onDelete={canDelete ? () => handleDelete(row.id) : undefined}
          />
        </div>
      ),
    }] : []),
  ];

  const hasActiveFilter = Boolean(search || categoryFilter || selectedClassroom);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader
        title="Pelanggaran Siswa & Tata Tertib"
        subtitle="Kelola pencatatan riwayat pelanggaran kedisiplinan dan kamus aturan tata tertib sekolah."
        action={
          activeTab === 'records' && canCreate ? (
            <button className="btn-std-primary flex items-center gap-2 cursor-pointer" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Tambah Pelanggaran
            </button>
          ) : undefined
        }
      />

      {/* Dual Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'records'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
          }`}
        >
          <ShieldAlert size={15} className={activeTab === 'records' ? 'text-rose-600' : 'text-slate-400'} />
          <span>Riwayat Pelanggaran Siswa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
          }`}
        >
          <BookOpen size={15} className={activeTab === 'catalog' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Kamus Tata Tertib / Standar Poin</span>
        </button>
      </div>

      {/* TAB 1: RIWAYAT PELANGGARAN SISWA */}
      {activeTab === 'records' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar (Hardware Logs Pattern) */}
          <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Pencarian Siswa / Catatan
                </label>
                <div className="relative group">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors"
                    size={17}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                    placeholder="Cari nama, NIS, judul, sanksi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Tahun Ajaran
                </label>
                <div className="relative group">
                  <Calendar
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors"
                    size={17}
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

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Rombel / Kelas
                </label>
                <div className="relative group">
                  <GraduationCap
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors"
                    size={17}
                  />
                  <select
                    className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                  >
                    <option value="">Semua Rombel</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Kategori
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">Semua Kategori</option>
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedClassroom('');
                      setCategoryFilter('');
                    }}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 border border-rose-200 shadow-sm shrink-0 cursor-pointer self-end"
                    title="Reset filter"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DataTable dengan Compound Pagination */}
          <DataTable
            columns={columns}
            data={paginatedItems}
            loading={loading}
            emptyMessage="Belum ada catatan pelanggaran siswa yang sesuai dengan filter."
            pagination={pagination}
          />
        </div>
      )}

      {/* TAB 2: KAMUS TATA TERTIB / JENIS PELANGGARAN */}
      {activeTab === 'catalog' && (
        <div className="animate-in fade-in duration-200">
          <ViolationTypesTab />
        </div>
      )}

      {/* Modal Form Tambah / Edit Pelanggaran Siswa */}
      <Modal
        open={modal.open}
        onClose={handleCloseModal}
        title={modal.editId ? 'Edit Data Pelanggaran Siswa' : 'Catat Pelanggaran Siswa Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Access Mode Indicator */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            {canCreateAll ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mode Akses: Seluruh Siswa (Akses Global / BK / Kesiswaan)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Mode Akses: Siswa Kelas yang Diampu / Diwalikan Saja
              </span>
            )}
          </div>

          <FormField label="Siswa Pelanggar" required>
            {!selectedStudent ? (
              <div className="relative">
                <input
                  type="text"
                  className="input-std pl-10"
                  placeholder="Ketik minimal 2 huruf nama atau NIS siswa..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={17} />

                {students.length > 0 && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {students.map((s) => {
                      const classroomName = s.enrollments?.[0]?.classroom?.name;
                      return (
                        <div
                          key={s.id}
                          className="p-3 hover:bg-rose-50/70 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{s.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">NIS: {s.nis}</div>
                          </div>
                          {classroomName && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-100 shrink-0">
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
              <div className="flex justify-between items-center bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-rose-600 shadow-2xs font-bold text-xs">
                    {selectedStudent.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{selectedStudent.fullName}</span>
                      {selectedStudent.enrollments?.[0]?.classroom?.name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                          Kelas {selectedStudent.enrollments[0].classroom.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedStudent.nis}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-600 font-semibold hover:bg-white px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
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

          {/* Pemilihan Jenis Pelanggaran (Standar vs Kustom) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 block">
                Jenis Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setForm((p) => ({
                    ...p,
                    isCustom: !p.isCustom,
                    violationTypeId: p.isCustom ? p.violationTypeId : '',
                    title: p.isCustom ? '' : p.title,
                  }));
                }}
              >
                <ArrowRightLeft size={13} />
                <span>{form.isCustom ? 'Pilih dari Kamus Tata Tertib' : '+ Pelanggaran Kustom'}</span>
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
                  placeholder="Ketik nama kejadian pelanggaran kustom..."
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
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
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

          <FormField label="Poin Penalti">
            <input
              type="number"
              className="input-std font-bold text-rose-700"
              value={form.points}
              onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
              min={0}
              placeholder="Jumlah poin pengurangan kedisiplinan..."
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Poin dapat disesuaikan jika terdapat pertimbangan kronologi khusus.
            </span>
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
