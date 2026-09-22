import React, { useEffect, useState } from 'react';
import { 
  getExams, 
  createExam, 
  updateExam, 
  deleteExam, 
  getAssessmentTypes, 
  getAssessmentComponents, 
  getAssessmentLockStatus,
  reopenAssessmentForRevision,
  type Exam, 
  type AssessmentType, 
  type AssessmentComponent,
  type AssessmentLockStatus
} from '../../api/assessmentService';
import { 
  getAcademicYears, 
  getSemesters, 
  getGrades, 
  getClassrooms, 
  getSubjects, 
  type AcademicYear, 
  type Semester, 
  type Grade, 
  type Classroom, 
  type Subject 
} from '../../api/academicService';
import { Plus, Search, Calendar, Users, BookOpen, Target, Lock, RotateCcw, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSubjectAssignments, type SubjectAssignment } from '../../api/schedulingService';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

interface ExamForm {
  academicYearId: string;
  semesterId: string;
  gradeId: string;
  classroomId: string;
  subjectId: string;
  title: string;
  typeId: string;
  componentId: string;
  examDate: string;
  maxScore: number;
  description: string;
}

const DEFAULT_FORM: ExamForm = {
  academicYearId: '',
  semesterId: '',
  gradeId: '',
  classroomId: '',
  subjectId: '',
  title: '',
  typeId: '',
  componentId: '',
  examDate: '',
  maxScore: 100,
  description: ''
};

export const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [filterClassrooms, setFilterClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [types, setTypes] = useState<AssessmentType[]>([]);
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah' || r.name === 'Kepala Sekolah') ?? false;
  const [classAssignments, setClassAssignments] = useState<SubjectAssignment[]>([]);
  
  const { hasPermission } = usePermissions();
  const canManageExams = hasPermission('assessments.input') || hasPermission('assessments.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage');
  const canReadScores = hasPermission('assessments.read') || hasPermission('assessments.input') || hasPermission('assessments.manage') || hasPermission('assessment.read') || canManageExams;
  const canDeleteAssessment = hasPermission('assessments.delete') || hasPermission('assessments.manage') || hasPermission('assessment.manage');
  
  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterClassroomId, setFilterClassroomId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [search, setSearch] = useState('');

  // Lock status & Reopen
  const [lockStatus, setLockStatus] = useState<AssessmentLockStatus | null>(null);
  const [reopenModal, setReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  
  // Modal State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<ExamForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalClassrooms, setModalClassrooms] = useState<Classroom[]>([]);
  
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
    action: async () => {}
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isFiltersComplete = Boolean(
    filterAcademicYearId && filterSemesterId && filterClassroomId && filterSubjectId
  );

  const currentAssignment = classAssignments.find(a => 
    a.subjectId === filterSubjectId &&
    (!filterAcademicYearId || a.academicYearId === filterAcademicYearId) &&
    (!filterSemesterId || a.semesterId === filterSemesterId)
  ) || classAssignments.find(a => a.subjectId === filterSubjectId);

  const assignedTeacher = currentAssignment?.employee;
  const isAssignedTeacher = Boolean(
    currentAssignment &&
    user?.employeeId &&
    String(currentAssignment.employeeId) === String(user.employeeId)
  );

  const isTeacherOrAdmin = isSuperAdmin || isAssignedTeacher;
  const canCreateExam = isTeacherOrAdmin && canManageExams && isFiltersComplete && !lockStatus?.isLocked;

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (filterClassroomId) {
      getSubjectAssignments(filterClassroomId)
        .then(setClassAssignments)
        .catch(err => {
          console.error('Failed to load assignments', err);
          setClassAssignments([]);
        });
    } else {
      setClassAssignments([]);
    }
  }, [filterClassroomId]);

  useEffect(() => {
    if (filterGradeId) {
      getClassrooms(filterGradeId).then(setFilterClassrooms).catch(console.error);
    } else {
      setFilterClassrooms([]);
    }
    setFilterClassroomId('');
  }, [filterGradeId]);

  useEffect(() => {
    if (form.gradeId) {
      getClassrooms(form.gradeId).then(setModalClassrooms).catch(console.error);
    } else {
      setModalClassrooms([]);
    }
  }, [form.gradeId]);

  useEffect(() => {
    setCurrentPage(1);
    if (isFiltersComplete) {
      fetchExams();
      fetchLockStatus();
      fetchComponents();
    } else {
      setExams([]);
      setLockStatus(null);
      setComponents([]);
    }
  }, [filterAcademicYearId, filterSemesterId, filterClassroomId, filterSubjectId, search]);

  const fetchDependencies = async () => {
    try {
      const [ayData, semData, grData, subjData, typesData, classroomsData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getGrades(),
        getSubjects(),
        getAssessmentTypes(),
        getClassrooms()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setGrades(grData);
      setSubjects(subjData);
      setTypes(typesData);
      setClassrooms(classroomsData);
      
      const activeAy = ayData.find(a => a.isActive);
      const activeSem = semData.find(s => s.isActive);
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
    } catch (err) {
      notify.error(err, 'Gagal memuat data referensi');
    }
  };

  const fetchComponents = async () => {
    if (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId) {
      setComponents([]);
      return;
    }
    try {
      const data = await getAssessmentComponents({
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
      });
      setComponents(data);
    } catch (err) {
      console.error('Failed to fetch components', err);
    }
  };

  const fetchLockStatus = async () => {
    if (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId) return;
    try {
      const status = await getAssessmentLockStatus({
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
      });
      setLockStatus(status);
    } catch (err) {
      console.error('Failed to fetch lock status', err);
    }
  };

  const fetchExams = async () => {
    if (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId) {
      setExams([]);
      return;
    }

    try {
      setLoading(true);
      const params: any = {
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
      };
      if (search) params.search = search;
      
      const data = await getExams(params);
      setExams(data);
    } catch (err: any) {
      notify.error(err, 'Gagal memuat agenda penilaian');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exam?: Exam) => {
    if (!canManageExams || !isTeacherOrAdmin) {
      notify.error(`Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) atau Administrator yang berwenang membuat atau mengedit agenda penilaian untuk mata pelajaran ini.`);
      return;
    }

    if (exam) {
      const classroom = classrooms.find(c => c.id === exam.classroomId);
      setForm({
        academicYearId: exam.academicYearId || '',
        semesterId: exam.semesterId || '',
        gradeId: classroom?.gradeId || filterGradeId || '',
        classroomId: exam.classroomId || '',
        subjectId: exam.subjectId || '',
        title: exam.title || '',
        typeId: exam.typeId || '',
        componentId: exam.componentId || '',
        examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
        maxScore: exam.maxScore || 100,
        description: exam.description || ''
      });
      setModal({ open: true, editId: exam.id });
    } else {
      setForm({
        ...DEFAULT_FORM,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        gradeId: filterGradeId,
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
      });
      setModal({ open: true, editId: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, editId: null });
  };

  const setField = (field: keyof ExamForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageExams || !isTeacherOrAdmin) {
      notify.error(`Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) atau Administrator yang berwenang menyimpan agenda penilaian.`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        title: form.title,
        componentId: form.componentId,
        assessmentDate: form.examDate ? new Date(form.examDate).toISOString() : null,
        maxScore: Number(form.maxScore),
        notes: form.description
      };

      if (modal.editId) {
        await updateExam(modal.editId, payload);
        notify.success('Agenda penilaian berhasil diperbarui');
      } else {
        await createExam(payload);
        notify.success('Agenda penilaian baru berhasil dibuat');
      }
      
      await fetchExams();
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan agenda penilaian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!canDeleteAssessment || !isTeacherOrAdmin) {
      notify.error(`Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) atau Administrator yang berwenang menghapus agenda penilaian.`);
      return;
    }

    if (lockStatus?.isLocked) {
      notify.error('Agenda penilaian tidak dapat dihapus karena nilai sudah divalidasi/disahkan');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Hapus Agenda Penilaian',
      message: 'Apakah Anda yakin ingin menghapus agenda penilaian ini? Semua nilai siswa yang sudah diinput untuk agenda ini akan ikut terhapus.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteExam(id);
          notify.success('Agenda penilaian berhasil dihapus');
          await fetchExams();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus agenda penilaian');
        }
      }
    });
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId || !reopenReason.trim()) return;

    try {
      setIsReopening(true);
      await reopenAssessmentForRevision({
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        reason: reopenReason.trim(),
      });
      notify.success('Kunci penilaian berhasil dibuka untuk revisi. Guru dapat mengedit nilai atau menambah agenda.');
      setReopenModal(false);
      setReopenReason('');
      await fetchExams();
      await fetchLockStatus();
    } catch (err: any) {
      notify.error(err, 'Gagal membuka kunci penilaian');
    } finally {
      setIsReopening(false);
    }
  };

  const columns: Column<Exam>[] = [
    { 
      key: 'title', 
      header: 'Judul Penilaian',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
            <Target size={18} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 truncate block max-w-[220px]" title={row.title}>
              {row.title}
            </div>
            <div className="text-xs text-gray-500">
              Maks: <span className="font-bold text-gray-700">{row.maxScore}</span> poin
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'type', 
      header: 'Jenis & Bobot',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="default">{row.examType || 'Ujian'}</Badge>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {row.component?.weight || 0}%
          </span>
        </div>
      )
    },
    { 
      key: 'class_subject', 
      header: 'Kelas & Mapel',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Users size={13} className="text-gray-400" />
            <span className="truncate block max-w-[160px]" title={row.classroom?.name || classrooms.find(c => c.id === row.classroomId)?.name || 'Unknown Class'}>
              {row.classroom?.name || classrooms.find(c => c.id === row.classroomId)?.name || 'Unknown Class'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen size={13} className="text-gray-400" />
            <span className="truncate block max-w-[160px]" title={row.subject?.name || subjects.find(s => s.id === row.subjectId)?.name || 'Unknown Subject'}>
              {row.subject?.name || subjects.find(s => s.id === row.subjectId)?.name || 'Unknown Subject'}
            </span>
          </div>
        </div>
      )
    },
    { 
      key: 'schedule', 
      header: 'Jadwal Penilaian',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          <Calendar size={13} className="text-indigo-500" />
          <span>{row.examDate ? new Date(row.examDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
        </div>
      )
    }
  ];

  if (canReadScores || canManageExams) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      render: (row) => {
        const isRowOwner = isSuperAdmin || Boolean(
          (row.employeeId && user?.employeeId && String(row.employeeId) === String(user.employeeId)) ||
          isAssignedTeacher
        );
        const canInputThisExam = isRowOwner && canManageExams && !lockStatus?.isLocked;

        return (
          <div className="flex justify-end items-center gap-2">
            <Link 
              to={`/assessment/exams/${row.id}/scores`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border shadow-sm ${
                canInputThisExam
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {canInputThisExam ? 'Input Nilai' : 'Lihat Nilai'}
            </Link>
            {canManageExams && (
              !lockStatus?.isLocked ? (
                isRowOwner ? (
                  <ActionButtons 
                    onEdit={() => handleOpenModal(row)} 
                    onDelete={canDeleteAssessment ? () => handleDelete(row.id) : undefined} 
                  />
                ) : null
              ) : (
                <Badge variant="warning">Terkunci</Badge>
              )
            )}
          </div>
        );
      }
    });
  }

  const filteredComponents = components.filter(c => 
    (!form.academicYearId || String(c.academicYearId) === String(form.academicYearId)) &&
    (!form.semesterId || String(c.semesterId) === String(form.semesterId)) &&
    (!form.classroomId || String(c.classroomId) === String(form.classroomId)) &&
    (!form.subjectId || String(c.subjectId) === String(form.subjectId)) &&
    (c.isActive !== false || c.id === form.componentId)
  );

  // Pagination Logic
  const totalPages = Math.ceil(exams.length / itemsPerPage);
  const paginatedExams = exams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader
        title="Agenda Penilaian"
        subtitle="Kelola agenda penilaian, ujian, dan tugas untuk setiap kelas dan mata pelajaran."
      />

      {/* Parameter Filter Bar (Glassmorphism Standard - No Header, Icon Group Focus) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tahun Ajaran</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate"
                value={filterAcademicYearId}
                onChange={e => setFilterAcademicYearId(e.target.value)}
              >
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}{ay.isActive ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Semester</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate disabled:opacity-50 disabled:cursor-not-allowed" 
                value={filterSemesterId} 
                onChange={e => setFilterSemesterId(e.target.value)}
                disabled={!filterAcademicYearId}
              >
                <option value="">Pilih Semester...</option>
                {semesters.filter(s => s.academicYearId === filterAcademicYearId).map(s => <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat Kelas</label>
            <div className="relative group">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate"
                value={filterGradeId}
                onChange={e => setFilterGradeId(e.target.value)}
              >
                <option value="">Pilih Tingkat...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Rombel / Kelas</label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate disabled:opacity-50 disabled:cursor-not-allowed"
                value={filterClassroomId}
                onChange={e => setFilterClassroomId(e.target.value)}
                disabled={!filterGradeId}
              >
                <option value="">Pilih Rombel...</option>
                {filterClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Mata Pelajaran</label>
            <div className="relative group">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate"
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
              >
                <option value="">Pilih Mapel...</option>
                {subjects.map(s => {
                  const isTaughtByMe = user?.employeeId && classAssignments.some(
                    a => a.subjectId === s.id && String(a.employeeId) === String(user.employeeId)
                  );
                  return (
                    <option key={s.id} value={s.id}>
                      {isTaughtByMe ? '★ ' : ''}{s.name} ({s.code}){isTaughtByMe ? ' [Mapel Anda]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 m-0">Daftar Agenda Penilaian</h3>
              {isFiltersComplete && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {classrooms.find(c => c.id === filterClassroomId)?.name || 'Kelas'} • {subjects.find(s => s.id === filterSubjectId)?.name || 'Mapel'}
                </span>
              )}
              {isFiltersComplete && lockStatus?.isLocked && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {lockStatus.lockReason === 'APPROVED_BY_PRINCIPAL' ? 'Terkunci KS' : 'Terkunci Wali Kelas'}
                </span>
              )}
              {isFiltersComplete && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAssignedTeacher 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : isSuperAdmin 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isAssignedTeacher 
                    ? 'Anda Guru Pengampu' 
                    : isSuperAdmin 
                    ? (user?.roles?.some(r => r.name === 'Kepala Sekolah') ? 'Akses Kepala Sekolah' : 'Akses Admin') 
                    : 'Mode Hanya-Baca'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lockStatus?.isLocked 
                ? 'Agenda ditutup karena nilai telah divalidasi/disahkan. Mode hanya-baca aktif.'
                : isAssignedTeacher 
                ? `Anda adalah Guru Pengampu mata pelajaran ini (${assignedTeacher?.fullName || 'Pengampu'}).`
                : assignedTeacher 
                ? `Diampu oleh ${assignedTeacher.fullName}${assignedTeacher.employeeNumber ? ` (${assignedTeacher.employeeNumber})` : ''}.`
                : 'Kelola agenda penilaian, ujian, dan tugas untuk kelas dan mata pelajaran terpilih.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            {lockStatus?.canUnlock && (
              <button
                type="button"
                onClick={() => setReopenModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-amber-900 border border-amber-300 hover:bg-amber-50 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw size={14} /> Buka Kunci (Revisi)
              </button>
            )}
            {canManageExams && isFiltersComplete && (
              <button 
                className={`btn-std-primary flex items-center gap-1.5 px-4 py-2 text-xs shadow-sm transition-all ${(!canCreateExam) ? 'opacity-50 cursor-not-allowed' : ''}`} 
                onClick={() => handleOpenModal()}
                disabled={!canCreateExam}
                title={
                  lockStatus?.isLocked 
                    ? 'Agenda ditutup karena nilai sudah disahkan' 
                    : !isTeacherOrAdmin
                    ? `Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) yang dapat membuat agenda`
                    : 'Buat Agenda Baru'
                }
              >
                {lockStatus?.isLocked ? <Lock size={15} /> : <Plus size={15} />}
                <span>{lockStatus?.isLocked ? 'Agenda Ditutup' : 'Buat Agenda Baru'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Count strip when filter complete */}
        {isFiltersComplete && (
          <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" 
                placeholder="Cari judul penilaian..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total <span className="font-bold text-slate-800">{exams.length}</span> Agenda Terdaftar
            </div>
          </div>
        )}
        {!isFiltersComplete ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4 shadow-sm text-indigo-600">
              <Target size={30} />
            </div>
            <div className="text-lg font-bold text-slate-800">Pilih Parameter Penilaian</div>
            <div className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
              Silakan pilih Tahun Ajaran, Semester, Tingkat, Rombel/Kelas, dan Mata Pelajaran terlebih dahulu untuk menampilkan atau mengelola agenda penilaian.
            </div>
          </div>
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={paginatedExams} 
              loading={loading} 
              emptyMessage="Belum ada agenda penilaian yang dibuat untuk kelas dan mata pelajaran ini." 
              hasPagination={exams.length > 0} 
            />
            
            {exams.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={exams.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Modal Buat / Edit Agenda */}
      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Agenda Penilaian' : 'Buat Agenda Penilaian'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormField label="Judul Agenda / Ujian" required>
            <input 
              type="text" 
              className="input-std" 
              placeholder="Contoh: Ulangan Harian 1, Tugas Mandiri Bab 2..." 
              value={form.title} 
              onChange={setField('title')} 
              required 
            />
          </FormField>

          <FormField label="Komponen Bobot Penilaian" required>
            <select 
              className="input-std cursor-pointer" 
              value={form.componentId} 
              onChange={setField('componentId')} 
              required
            >
              <option value="">Pilih Komponen Bobot...</option>
              {filteredComponents.map(c => (
                <option key={c.id} value={c.id}>
                  {c.type?.name} ({c.type?.code}) - Bobot: {c.weight}%
                </option>
              ))}
            </select>
            {filteredComponents.length === 0 && (
              <span className="text-xs text-rose-500 mt-1">
                Belum ada komponen penilaian untuk kelas & mapel ini. Silakan atur di menu Komponen Penilaian.
              </span>
            )}
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tanggal Pelaksanaan">
              <input 
                type="date" 
                className="input-std" 
                value={form.examDate} 
                onChange={setField('examDate')} 
              />
            </FormField>

            <FormField label="Nilai Maksimal (Skala)" required>
              <input 
                type="number" 
                className="input-std" 
                value={form.maxScore} 
                onChange={setField('maxScore')} 
                min={1} 
                max={1000} 
                required 
              />
            </FormField>
          </div>

          <FormField label="Catatan / Keterangan Tambahan">
            <textarea 
              className="input-std min-h-[80px]" 
              placeholder="Keterangan materi bab, instruksi pengerjaan..." 
              value={form.description} 
              onChange={setField('description')} 
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={handleCloseModal} className="btn-std-secondary" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn-std-primary" disabled={isSubmitting || filteredComponents.length === 0}>
              {isSubmitting ? 'Menyimpan...' : (modal.editId ? 'Simpan Perubahan' : 'Buat Agenda')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Buka Kunci / Revisi */}
      <Modal open={reopenModal} onClose={() => setReopenModal(false)} title="Buka Kunci Penilaian untuk Revisi">
        <form onSubmit={handleReopenSubmit} className="flex flex-col gap-4 p-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 leading-relaxed">
            Membuka kunci penilaian akan mengembalikan status validasi kelas & mata pelajaran ini agar guru dapat mengoreksi nilai, menginput nilai susulan, atau menambah agenda.
          </div>
          <FormField label="Alasan Pembukaan Kunci / Catatan Revisi" required>
            <textarea
              className="input-std min-h-[100px]"
              placeholder="Jelaskan alasan revisi (contoh: 'Ada nilai susulan siswa yang belum terinput')..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              required
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setReopenModal(false)} className="btn-std-secondary" disabled={isReopening}>
              Batal
            </button>
            <button 
              type="submit" 
              className="btn-std-primary bg-amber-600 hover:bg-amber-700 text-white" 
              disabled={isReopening || !reopenReason.trim()}
            >
              {isReopening ? 'Membuka Kunci...' : 'Konfirmasi Buka Kunci'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Terstandarisasi */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
};
export default Exams;
