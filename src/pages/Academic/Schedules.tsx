import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  BookOpen, 
  MapPin, 
  Loader2, 
  UserCheck, 
  Sparkles, 
  Edit2, 
  Trash2,
  GraduationCap,
  Search,
  RotateCcw
} from 'lucide-react';
import { 
  PageHeader, 
  Modal, 
  FormField, 
  Select, 
  ConfirmDialog, 
  type ConfirmVariant 
} from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useSchedules } from '../../hooks/useSchedules';
import { usePermissions } from '../../hooks/usePermissions';
import type { Schedule, SubjectAssignment } from '../../api/schedulingService';
import { notify } from '../../utils/feedback';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
];

const SUBJECT_COLORS = [
  { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  { border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100' },
  { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' }
];

const getSubjectColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
};

export const Schedules: React.FC = () => {
  const { canManageSchedule, canManageSubjectAssignments } = usePermissions();
  const [activeTab, setActiveTab] = useState<'assignments' | 'schedule'>('assignments');
  const [assignmentSearch, setAssignmentSearch] = useState('');

  const {
    academicYears,
    semesters,
    classrooms,
    subjects,
    employees,
    classPeriods,
    schedules,
    subjectAssignments,
    loading,
    filterAcademicYearId,
    setFilterAcademicYearId,
    filterSemesterId,
    setFilterSemesterId,
    filterClassroomId,
    setFilterClassroomId,
    createSubjectAssignment,
    updateSubjectAssignment,
    deleteSubjectAssignment,
    createSchedule,
    updateSchedule,
    deleteSchedule
  } = useSchedules();

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<SubjectAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Schedule Form fields
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [classPeriodId, setClassPeriodId] = useState('');
  const [subjectAssignmentId, setSubjectAssignmentId] = useState('');
  const [room, setRoom] = useState('');
  
  // Assignment Form fields
  const [subjectId, setSubjectId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // ConfirmDialog state
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

  // Selected classroom object
  const selectedClassroom = useMemo(() => {
    return classrooms.find(c => c.id === filterClassroomId);
  }, [classrooms, filterClassroomId]);

  // Options for Dropdowns
  const academicYearOptions = useMemo(() => {
    return academicYears.map(ay => ({
      value: ay.id,
      label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}`
    }));
  }, [academicYears]);

  const filteredSemesters = useMemo(() => {
    return semesters.filter(sem => {
      const yearId = sem.academicYearId || sem.academicYear?.id;
      return !filterAcademicYearId || yearId === filterAcademicYearId;
    });
  }, [semesters, filterAcademicYearId]);

  const semesterOptions = useMemo(() => {
    return filteredSemesters.map(sem => ({
      value: sem.id,
      label: `${sem.name}${sem.isActive ? ' (Aktif)' : ''}`
    }));
  }, [filteredSemesters]);

  // Auto-synchronize semester when academic year changes
  React.useEffect(() => {
    if (!filterAcademicYearId || filteredSemesters.length === 0) return;
    const exists = filteredSemesters.some(sem => sem.id === filterSemesterId);
    if (!exists) {
      const activeOrFirst = filteredSemesters.find(s => s.isActive) || filteredSemesters[0];
      if (activeOrFirst) {
        setFilterSemesterId(activeOrFirst.id);
      }
    }
  }, [filterAcademicYearId, filteredSemesters, filterSemesterId, setFilterSemesterId]);

  const classroomOptions = useMemo(() => {
    return [
      { value: '', label: '-- Pilih Kelas / Rombel --' },
      ...classrooms.map(c => ({
        value: c.id,
        label: c.name
      }))
    ];
  }, [classrooms]);

  // Filtered Subject Assignments
  const filteredAssignments = useMemo(() => {
    if (!assignmentSearch.trim()) return subjectAssignments;
    const term = assignmentSearch.toLowerCase();
    return subjectAssignments.filter(item => 
      item.subject?.name?.toLowerCase().includes(term) ||
      item.subject?.code?.toLowerCase().includes(term) ||
      item.employee?.fullName?.toLowerCase().includes(term)
    );
  }, [subjectAssignments, assignmentSearch]);

  // Grouped Schedules per Day
  const groupedSchedules = useMemo(() => {
    return DAYS.map(day => ({
      ...day,
      schedules: schedules
        .filter(s => s.dayOfWeek === day.id)
        .sort((a, b) => {
          const periodA = a.classPeriod?.periodNumber || 0;
          const periodB = b.classPeriod?.periodNumber || 0;
          return periodA - periodB;
        })
    }));
  }, [schedules]);

  // ---- Assignment Actions ----
  const openAddAssignmentModal = () => {
    if (!canManageSubjectAssignments) {
      notify.error('Anda tidak memiliki izin untuk menambah penugasan guru.');
      return;
    }
    setEditingAssignment(null);
    setSubjectId('');
    setEmployeeId('');
    setIsAssignmentModalOpen(true);
  };

  const openEditAssignmentModal = (item: SubjectAssignment) => {
    if (!canManageSubjectAssignments) {
      notify.error('Anda tidak memiliki izin untuk mengubah penugasan guru.');
      return;
    }
    setEditingAssignment(item);
    setSubjectId(item.subjectId);
    setEmployeeId(item.employeeId);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSubjectAssignments) {
      notify.error('Anda tidak memiliki izin untuk menyimpan penugasan guru.');
      return;
    }
    if (!filterClassroomId) {
      notify.warning('Silakan pilih kelas terlebih dahulu');
      return;
    }
    if (!subjectId || !employeeId) {
      notify.warning('Mata pelajaran dan guru pengampu wajib dipilih');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        subjectId,
        employeeId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        isActive: true
      };
      
      if (editingAssignment) {
        await updateSubjectAssignment(editingAssignment.id, {
          subjectId,
          employeeId,
          isActive: true
        });
        notify.success('Penugasan guru berhasil diperbarui');
      } else {
        await createSubjectAssignment(payload);
        notify.success('Penugasan guru baru berhasil ditambahkan');
      }
      setIsAssignmentModalOpen(false);
    } catch (err: any) {
      notify.error(err, 'Terjadi kesalahan saat menyimpan penugasan guru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = (item: SubjectAssignment) => {
    if (!canManageSubjectAssignments) {
      notify.error('Anda tidak memiliki izin untuk menghapus penugasan guru.');
      return;
    }
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Penugasan "${item.subject?.name}"`,
      message: (
        <div>
          Apakah Anda yakin ingin menghapus penugasan mata pelajaran{' '}
          <strong className="text-gray-900 font-semibold">{item.subject?.name}</strong>{' '}
          dengan guru pengampu{' '}
          <strong className="text-gray-900 font-semibold">{item.employee?.fullName}</strong>?
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
            Peringatan: Menghapus penugasan ini dapat memengaruhi atau mengosongkan entri jadwal pelajaran yang telah menggunakan mata pelajaran ini di kelas terkait.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus Penugasan',
      onConfirm: async () => {
        try {
          await deleteSubjectAssignment(item.id);
          notify.success(`Penugasan "${item.subject?.name}" berhasil dihapus`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus penugasan guru');
        }
      }
    });
  };

  // ---- Schedule Actions ----
  const openAddScheduleModal = (defaultDay?: number) => {
    if (!canManageSchedule) {
      notify.error('Anda tidak memiliki izin untuk menambah jadwal pelajaran.');
      return;
    }
    setEditingSchedule(null);
    setDayOfWeek(defaultDay || 1);
    setClassPeriodId(classPeriods.length > 0 ? classPeriods[0].id : '');
    setSubjectAssignmentId(subjectAssignments.length > 0 ? subjectAssignments[0].id : '');
    setRoom('');
    setIsScheduleModalOpen(true);
  };

  const openEditScheduleModal = (item: Schedule) => {
    if (!canManageSchedule) {
      notify.error('Anda tidak memiliki izin untuk mengubah jadwal pelajaran.');
      return;
    }
    setEditingSchedule(item);
    setDayOfWeek(item.dayOfWeek);
    setClassPeriodId(item.classPeriodId);
    setSubjectAssignmentId(item.subjectAssignmentId);
    setRoom(item.room || '');
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSchedule) {
      notify.error('Anda tidak memiliki izin untuk menyimpan jadwal pelajaran.');
      return;
    }
    if (!filterClassroomId) {
      notify.warning('Silakan pilih kelas terlebih dahulu');
      return;
    }
    if (!classPeriodId || !subjectAssignmentId) {
      notify.warning('Jam pelajaran dan mata pelajaran pengampu wajib dipilih');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSchedule) {
        const updatePayload = {
          dayOfWeek: Number(dayOfWeek),
          classPeriodId,
          subjectAssignmentId,
          room: room.trim() || undefined
        };
        await updateSchedule(editingSchedule.id, updatePayload);
        notify.success('Jadwal pelajaran berhasil diperbarui');
      } else {
        const createPayload = {
          academicYearId: filterAcademicYearId,
          semesterId: filterSemesterId,
          dayOfWeek: Number(dayOfWeek),
          classPeriodId,
          subjectAssignmentId,
          room: room.trim() || undefined
        };
        await createSchedule(createPayload);
        notify.success('Jadwal pelajaran baru berhasil ditambahkan');
      }
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      notify.error(err, 'Terjadi kesalahan saat menyimpan jadwal pelajaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = (item: Schedule) => {
    if (!canManageSchedule) {
      notify.error('Anda tidak memiliki izin untuk menghapus jadwal pelajaran.');
      return;
    }
    const dayName = DAYS.find(d => d.id === item.dayOfWeek)?.name || 'Hari ini';
    const subjName = item.subjectAssignment?.subject?.name || 'Mata Pelajaran';
    const teacherName = item.subjectAssignment?.employee?.fullName || 'Guru';
    const periodTime = item.classPeriod ? `${item.classPeriod.startTime} - ${item.classPeriod.endTime}` : '';

    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Jadwal ${subjName} (${dayName})`,
      message: (
        <div>
          Apakah Anda yakin ingin menghapus jadwal{' '}
          <strong className="text-gray-900 font-semibold">{subjName}</strong>{' '}
          pada hari <strong className="text-gray-900 font-semibold">{dayName}</strong>{' '}
          {periodTime && `(Pukul ${periodTime})`} bersama{' '}
          <span className="text-gray-700">{teacherName}</span>?
        </div>
      ),
      confirmText: 'Ya, Hapus Jadwal',
      onConfirm: async () => {
        try {
          await deleteSchedule(item.id);
          notify.success(`Jadwal ${subjName} (${dayName}) berhasil dihapus`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus jadwal pelajaran');
        }
      }
    });
  };

  // Table Columns for Subject Assignments
  const assignmentColumns: Column<SubjectAssignment>[] = [
    { 
      key: 'subject', 
      header: 'Mata Pelajaran', 
      render: (row) => (
        <div className="flex flex-col">
          <span 
            className="font-semibold text-gray-900 block max-w-[240px] md:max-w-[320px] truncate"
            title={row.subject?.name}
          >
            {row.subject?.name || '-'}
          </span>
          {row.subject?.code && (
            <span className="font-mono text-xs text-gray-500">{row.subject.code}</span>
          )}
        </div>
      )
    },
    { 
      key: 'employee', 
      header: 'Guru Pengampu', 
      render: (row) => (
        <span 
          className="font-medium text-gray-800 block max-w-[200px] md:max-w-[280px] truncate"
          title={row.employee?.fullName}
        >
          {row.employee?.fullName || '-'}
        </span>
      ) 
    },
    ...(canManageSubjectAssignments ? [{
      key: 'actions',
      header: 'Aksi',
      render: (row: SubjectAssignment) => (
        <div className="flex items-center justify-end">
          <ActionButtons 
            onEdit={() => openEditAssignmentModal(row)}
            onDelete={() => handleDeleteAssignment(row)}
          />
        </div>
      )
    }] : [])
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Jadwal & Penugasan Pelajaran" 
        subtitle="Atur penugasan guru pengampu dan susun alokasi jadwal pelajaran per rombel kelas"
      />

      {/* 2. Control Filter Panel (Tahun Ajaran, Semester, Kelas) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end flex-1 min-w-[280px]">
          <div className="w-full sm:w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Tahun Ajaran
            </label>
            <div className="relative group">
              <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
              <select
                value={filterAcademicYearId}
                onChange={(e) => setFilterAcademicYearId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              >
                {academicYearOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full sm:w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Semester
            </label>
            <div className="relative group">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
              <select
                value={filterSemesterId}
                onChange={(e) => setFilterSemesterId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              >
                {semesterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full sm:w-[240px]">
            <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Pilih Rombel / Kelas</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
              <select
                value={filterClassroomId}
                onChange={(e) => setFilterClassroomId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-semibold"
              >
                {classroomOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedClassroom && (
          <div className="bg-indigo-50/80 border border-indigo-100 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 text-indigo-800 font-semibold self-end">
            <GraduationCap size={16} className="text-indigo-600" />
            <span>Kelas Terpilih: {selectedClassroom.name}</span>
          </div>
        )}
      </div>

      {/* 3. Empty State or Active Content */}
      {!filterClassroomId ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <CalendarDays size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">Silakan Pilih Kelas Terlebih Dahulu</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Pilih rombel kelas pada dropdown filter di atas untuk melihat daftar penugasan guru dan alokasi jadwal pelajaran harian.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4. Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              className={`pb-3 px-4 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === 'assignments'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('assignments')}
            >
              <UserCheck size={16} />
              <span>1. Penugasan Guru</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                {subjectAssignments.length}
              </span>
              {activeTab === 'assignments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              className={`pb-3 px-4 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('schedule')}
            >
              <CalendarDays size={16} />
              <span>2. Jadwal Pelajaran</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                {schedules.length}
              </span>
              {activeTab === 'schedule' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          </div>

          {/* 5. Tab 1: Penugasan Guru */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[240px]">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Pencarian Guru & Penugasan
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="Cari mapel atau guru pengampu di kelas ini..."
                      value={assignmentSearch}
                      onChange={(e) => setAssignmentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end mb-1">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-gray-400" />
                    Total: {filteredAssignments.length} Penugasan
                  </span>
                </div>

                {Boolean(assignmentSearch) && (
                  <button
                    type="button"
                    onClick={() => setAssignmentSearch('')}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}

                {canManageSubjectAssignments && (
                  <button 
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors shrink-0 ml-auto"
                    onClick={openAddAssignmentModal}
                  >
                    <Plus size={16} /> Tambah Penugasan
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <DataTable 
                  columns={assignmentColumns}
                  data={filteredAssignments}
                  loading={loading}
                  emptyMessage={
                    assignmentSearch
                      ? 'Tidak ada penugasan guru yang cocok dengan pencarian.'
                      : 'Belum ada guru pengampu mata pelajaran untuk kelas ini. Klik tombol "Tambah Penugasan" untuk memulai.'
                  }
                />
              </div>
            </div>
          )}

          {/* 6. Tab 2: Jadwal Pelajaran (Grid 6 Hari) */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Susunan Jadwal Mingguan</h3>
                  <p className="text-xs text-gray-500">Alokasi waktu dan mata pelajaran dari hari Senin hingga Sabtu</p>
                </div>
                {canManageSchedule && (
                  <button 
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors self-start sm:self-auto"
                    onClick={() => openAddScheduleModal()}
                  >
                    <Plus size={16} /> Tambah Jadwal Pelajaran
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  {DAYS.map(day => (
                    <div 
                      key={day.id} 
                      className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col"
                    >
                      {/* Day Header Skeleton */}
                      <div className="bg-gray-50/80 border-b border-gray-200 py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded skeleton-shimmer" />
                          <div className="h-4 w-16 rounded skeleton-shimmer" />
                        </div>
                        <div className="h-4 w-12 rounded-md skeleton-shimmer" />
                      </div>

                      {/* Day Schedules Body Skeleton */}
                      <div className="p-3 flex-1 flex flex-col gap-3 bg-gray-50/40 min-h-[220px]">
                        {[1, 2].map(idx => (
                          <div 
                            key={idx} 
                            className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5 border-t-4 border-t-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="w-8 h-8 rounded-lg skeleton-shimmer shrink-0" />
                              <div className="h-5 w-24 rounded-md skeleton-shimmer" />
                            </div>
                            <div className="space-y-1.5">
                              <div className={`h-4 ${idx === 1 ? 'w-3/4' : 'w-2/3'} rounded skeleton-shimmer`} />
                              <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedSchedules.map(day => (
                    <div 
                      key={day.id} 
                      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                    >
                      {/* Day Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                          <CalendarDays size={17} className="text-indigo-600" />
                          <span>{day.name}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                          {day.schedules.length} Sesi
                        </span>
                      </div>

                      {/* Day Schedules Body */}
                      <div className="p-3 flex-1 flex flex-col bg-gray-50/40 min-h-[220px]">
                        {day.schedules.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                            <span className="text-xs font-medium mb-3">Belum ada jadwal hari ini</span>
                            {canManageSchedule && (
                              <button 
                                type="button"
                                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => openAddScheduleModal(day.id)}
                              >
                                <Plus size={13} /> Tambah
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {day.schedules.map(item => {
                              const subjName = item.subjectAssignment?.subject?.name || 'Mata Pelajaran';
                              const color = getSubjectColor(subjName);
                              
                              return (
                                <div 
                                  key={item.id} 
                                  className={`group relative bg-white border border-gray-200 rounded-xl shadow-xs hover:shadow-md transition-all overflow-hidden border-t-4 ${color.border} p-3.5`}
                                >
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-lg ${color.bg} ${color.text} flex items-center justify-center shrink-0`}>
                                      <BookOpen size={16} />
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 font-mono">
                                        <Clock size={11} className="text-gray-500" />
                                        <span>{item.classPeriod?.startTime} - {item.classPeriod?.endTime}</span>
                                      </div>
                                      
                                      {canManageSchedule && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            type="button"
                                            className="text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors" 
                                            onClick={() => openEditScheduleModal(item)} 
                                            title="Edit Jadwal"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button 
                                            type="button"
                                            className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors" 
                                            onClick={() => handleDeleteSchedule(item)} 
                                            title="Hapus Jadwal"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate mb-0.5" title={item.subjectAssignment?.employee?.fullName}>
                                    {item.subjectAssignment?.employee?.fullName || 'Belum ada guru'}
                                  </div>
                                  
                                  <div className="text-sm font-bold text-gray-900 leading-snug truncate" title={subjName}>
                                    {subjName}
                                  </div>

                                  {item.room && (
                                    <div className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-2 border border-amber-100">
                                      <MapPin size={11} />
                                      <span>{item.room}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. Modal Penugasan Guru */}
      <Modal
        open={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title={editingAssignment ? 'Edit Penugasan Guru' : 'Tambah Penugasan Guru'}
        size="md"
      >
        <form id="assignment-form" onSubmit={handleAssignmentSubmit} className="p-6 flex flex-col gap-5">
          <FormField label="Mata Pelajaran" required>
            <Select
              wrapperClassName="w-full"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Mata Pelajaran --' },
                ...subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))
              ]}
              required
            />
          </FormField>
          
          <FormField label="Guru Pengampu" required>
            <Select
              wrapperClassName="w-full"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Guru Pengampu --' },
                ...employees.map(e => ({ value: e.id, label: e.fullName }))
              ]}
              required
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => setIsAssignmentModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
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

      {/* 8. Modal Jadwal Pelajaran */}
      <Modal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
        size="md"
      >
        <form id="schedule-form" onSubmit={handleScheduleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Hari" required>
              <Select
                wrapperClassName="w-full"
                value={String(dayOfWeek)}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                options={DAYS.map(d => ({ value: String(d.id), label: d.name }))}
                required
              />
            </FormField>

            <FormField label="Jam Pelajaran" required>
              <Select
                wrapperClassName="w-full"
                value={classPeriodId}
                onChange={(e) => setClassPeriodId(e.target.value)}
                options={classPeriods.map(p => ({
                  value: p.id,
                  label: `Jam ke-${p.periodNumber} (${p.startTime} - ${p.endTime})`
                }))}
                required
              />
            </FormField>
          </div>
          
          <FormField label="Mata Pelajaran & Guru Pengampu" required>
            <Select
              wrapperClassName="w-full"
              value={subjectAssignmentId}
              onChange={(e) => setSubjectAssignmentId(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Penugasan Guru --' },
                ...subjectAssignments.map(sa => ({
                  value: sa.id,
                  label: `${sa.subject?.name} — ${sa.employee?.fullName}`
                }))
              ]}
              required
            />
            {subjectAssignments.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                Belum ada penugasan guru di kelas ini. Silakan tambahkan penugasan guru terlebih dahulu pada tab "Penugasan Guru".
              </p>
            )}
          </FormField>

          <FormField label="Ruangan (Opsional)" hint="Kosongkan jika menggunakan ruang kelas utama.">
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={room} 
              onChange={(e) => setRoom(e.target.value)} 
              placeholder="Contoh: Lab Komputer 1, Lapangan Olahraga" 
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
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

      {/* 9. Standard ConfirmDialog */}
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
