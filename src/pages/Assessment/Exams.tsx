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
import { Plus, Search, Calendar, Users, BookOpen, Target, Settings, Lock, RotateCcw, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSubjectAssignments, type SubjectAssignment } from '../../api/schedulingService';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';

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
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah') ?? false;
  const [classAssignments, setClassAssignments] = useState<SubjectAssignment[]>([]);
  
  const { hasPermission } = usePermissions();
  const canManageExams = hasPermission('assessments.input') || hasPermission('assessment.write');
  const canReadScores = hasPermission('assessments.read') || hasPermission('assessment.read') || canManageExams;
  const { showConfirm, showAlert } = useDialog();
  
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
    } else {
      setExams([]);
      setLockStatus(null);
    }
  }, [filterAcademicYearId, filterSemesterId, filterClassroomId, filterSubjectId, search]);

  const fetchDependencies = async () => {
    try {
      const [ayData, semData, grData, subjData, typesData, compData, classroomsData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getGrades(),
        getSubjects(),
        getAssessmentTypes(),
        getAssessmentComponents(),
        getClassrooms()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setGrades(grData);
      setSubjects(subjData);
      setTypes(typesData);
      setComponents(compData);
      setClassrooms(classroomsData);
      
      const activeAy = ayData.find(a => a.isActive);
      const activeSem = semData.find(s => s.isActive);
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
    } catch (err) {
      console.error(err);
      showAlert('Gagal memuat data referensi', 'Error');
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
      showAlert(err.response?.data?.message || 'Gagal memuat agenda penilaian', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exam?: Exam) => {
    if (!isTeacherOrAdmin) {
      showAlert(`Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) atau Administrator yang berwenang membuat atau mengedit agenda penilaian untuk mata pelajaran ini.`, 'Akses Ditolak');
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
    if (!isTeacherOrAdmin) {
      showAlert(`Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) atau Administrator yang berwenang menyimpan agenda penilaian.`, 'Akses Ditolak');
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
      } else {
        await createExam(payload);
      }
      
      await fetchExams();
      handleCloseModal();
    } catch (err: any) {
      const message = err.response?.data?.message;
      showAlert(Array.isArray(message) ? message.join(', ') : (message || 'Gagal menyimpan agenda penilaian'), 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isTeacherOrAdmin) {
      showAlert(`Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) atau Administrator yang berwenang menghapus agenda penilaian.`, 'Akses Ditolak');
      return;
    }

    if (lockStatus?.isLocked) {
      showAlert('Agenda penilaian tidak dapat dihapus karena nilai sudah divalidasi/disahkan', 'Peringatan');
      return;
    }

    showConfirm('Yakin ingin menghapus agenda penilaian ini? Semua nilai yang sudah diinput akan ikut terhapus.', async () => {
      try {
        await deleteExam(id);
        await fetchExams();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus agenda penilaian', 'Error');
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
      showAlert('Kunci penilaian berhasil dibuka untuk revisi. Guru dapat mengedit nilai atau menambah agenda.', 'Berhasil');
      setReopenModal(false);
      setReopenReason('');
      await fetchExams();
      await fetchLockStatus();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      showAlert(Array.isArray(msg) ? msg.join(', ') : (msg || 'Gagal membuka kunci penilaian'), 'Error');
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
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Target size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.title}</div>
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
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {row.component?.weight || 0}%
          </span>
        </div>
      )
    },
    { 
      key: 'class_subject', 
      header: 'Kelas & Mapel',
      render: (row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Users size={14} className="text-gray-400" />
            <span className="font-medium">{row.classroom?.name || classrooms.find(c => c.id === row.classroomId)?.name || 'Unknown Class'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen size={14} className="text-gray-400" />
            <span>{row.subject?.name || subjects.find(s => s.id === row.subjectId)?.name || 'Unknown Subject'}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'schedule', 
      header: 'Jadwal Penilaian',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <Calendar size={14} className="text-indigo-500" />
          <span>{row.examDate ? new Date(row.examDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                canInputThisExam
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {canInputThisExam ? 'Input Nilai' : 'Lihat Nilai'}
            </Link>
            {canManageExams && (
              !lockStatus?.isLocked ? (
                isRowOwner ? (
                  <ActionButtons onEdit={() => handleOpenModal(row)} onDelete={() => handleDelete(row.id)} />
                ) : null
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 border border-slate-200">
                  Terkunci
                </span>
              )
            )}
          </div>
        );
      }
    });
  }

  const filteredComponents = components.filter(c => 
    (!form.classroomId || c.classroomId === form.classroomId) &&
    (!form.subjectId || c.subjectId === form.subjectId)
  );

  // Pagination Logic
  const totalPages = Math.ceil(exams.length / itemsPerPage);
  const paginatedExams = exams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Agenda Penilaian"
        subtitle="Kelola agenda penilaian, ujian, dan tugas untuk setiap kelas dan mata pelajaran."
        action={
          canManageExams ? (
            <button 
              className={`btn-std-primary ${(!canCreateExam) ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={() => handleOpenModal()}
              disabled={!canCreateExam}
              title={
                !isFiltersComplete 
                  ? 'Pilih filter terlebih dahulu' 
                  : lockStatus?.isLocked 
                  ? 'Agenda ditutup karena nilai sudah disahkan' 
                  : !isTeacherOrAdmin
                  ? `Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) yang dapat membuat agenda`
                  : 'Buat Agenda Baru'
              }
            >
              {lockStatus?.isLocked ? <Lock size={18} /> : <Plus size={20} />}
              <span>{lockStatus?.isLocked ? 'Agenda Ditutup' : 'Buat Agenda Baru'}</span>
            </button>
          ) : undefined
        }
      />

      {/* Modern Filter Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Parameter Agenda Penilaian</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun Ajaran</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterAcademicYearId} onChange={e => setFilterAcademicYearId(e.target.value)}>
              <option value="">Pilih Tahun Ajaran...</option>
              {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</label>
            <select 
              className="input-std bg-slate-50 border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              value={filterSemesterId} 
              onChange={e => setFilterSemesterId(e.target.value)}
              disabled={!filterAcademicYearId}
            >
              <option value="">Pilih Semester...</option>
              {semesters.filter(s => s.academicYearId === filterAcademicYearId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tingkat Kelas</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterGradeId} onChange={e => setFilterGradeId(e.target.value)}>
              <option value="">Pilih Tingkat...</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rombel / Kelas</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer disabled:opacity-50" value={filterClassroomId} onChange={e => setFilterClassroomId(e.target.value)} disabled={!filterGradeId}>
              <option value="">Pilih Rombel...</option>
              {filterClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Pelajaran</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)}>
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

        {/* Teacher Assignment Status Banner */}
        {isFiltersComplete && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isAssignedTeacher 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : assignedTeacher 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <Users size={18} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Guru Pengampu Mata Pelajaran:</span>
                <div className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>{assignedTeacher?.fullName || 'Belum Ditugaskan'}</span>
                  {assignedTeacher?.employeeNumber && (
                    <span className="text-xs font-normal text-slate-500">({assignedTeacher.employeeNumber})</span>
                  )}
                  {isAssignedTeacher ? (
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Anda Guru Pengampu
                    </span>
                  ) : isSuperAdmin ? (
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Akses Admin
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Mode Hanya-Baca
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                className="input-std pl-10 w-full text-sm" 
                placeholder="Cari judul penilaian..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        )}
      </div>

      {/* Lock Banner Warning */}
      {isFiltersComplete && lockStatus?.isLocked && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Lock size={22} />
            </div>
            <div>
              <div className="font-bold text-amber-950 text-base flex items-center gap-2">
                Agenda Penilaian Ditutup
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase tracking-wider">
                  {lockStatus.lockReason === 'APPROVED_BY_PRINCIPAL' ? 'Disahkan Kepala Sekolah' : 'Divalidasi Wali Kelas'}
                </span>
              </div>
              <div className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Rekap nilai untuk mata pelajaran ini telah divalidasi/disahkan. Pengisian dan perubahan agenda dinonaktifkan (mode hanya-baca).
              </div>
            </div>
          </div>
          {lockStatus.canUnlock && (
            <button
              type="button"
              onClick={() => setReopenModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/60 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <RotateCcw size={16} /> Buka Kunci / Revisi
            </button>
          )}
        </div>
      )}

      {/* Main Table / Placeholder Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        {!isFiltersComplete ? (
          <div className="p-24 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-6 shadow-sm">
              <Target size={36} className="text-indigo-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-800">Pilih Parameter Penilaian</div>
            <div className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
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
              <span className="text-xs text-red-500 mt-1">
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
    </div>
  );
};
export default Exams;
