import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getClassroomById, 
  getAcademicYears, 
  getSemesters, 
  assignHomeroomTeacher, 
  getHomeroomTeacher, 
  type Classroom, 
  type AcademicYear, 
  type Semester 
} from '../../api/academicService';
import { getEmployees, type Employee } from '../../api/employeeService';
import { getStudents, type Student } from '../../api/studentService';
import { 
  ArrowLeft, 
  Info, 
  Users, 
  CheckCircle, 
  GraduationCap, 
  Loader2, 
  Eye, 
  Search, 
  X, 
  Phone, 
  MapPin, 
  UserCheck, 
  ExternalLink,
  Sparkles,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { FormField, Select, EmptyState, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const ClassroomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'siswa'>('info');
  const { user } = useAuth();
  const { 
    canManageHomeroom, 
    canManageClassroomStudents, 
    canReadClassrooms, 
    canReadStudents,
    hasPermission 
  } = usePermissions();
  
  // Safe permission checking for navigating to full student details page (/entities/students/:id)
  const canViewStudentDetail = Boolean(canReadStudents || hasPermission('students.manage'));
  
  // Master Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form & Homeroom State
  const [selectedAy, setSelectedAy] = useState('');
  const [selectedSm, setSelectedSm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentHomeroomTeacher, setCurrentHomeroomTeacher] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Student State & Filtering
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Laki-laki' | 'Perempuan'>('ALL');

  // Quick View Student Modal State
  const [quickViewStudent, setQuickViewStudent] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Conditionally fetch employees only if user has permission to manage homeroom
        const [cr, ay, sm, emp] = await Promise.all([
          getClassroomById(id),
          getAcademicYears(),
          getSemesters(),
          canManageHomeroom ? getEmployees() : Promise.resolve([])
        ]);
        setClassroom(cr);
        setAcademicYears(ay);
        setSemesters(sm);
        setEmployees(emp);

        // Set default active academic year & semester
        const activeAy = ay.find((a: AcademicYear) => a.isActive);
        const activeSm = sm.find((s: Semester) => s.isActive);
        if (activeAy) setSelectedAy(activeAy.id);
        if (activeSm) setSelectedSm(activeSm.id);
      } catch (err) {
        console.error(err);
        notify.error(err, 'Gagal memuat detail kelas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, canManageHomeroom]);

  useEffect(() => {
    const fetchTeacher = async () => {
      if (id && selectedAy && selectedSm) {
        try {
          const ht = await getHomeroomTeacher(id, selectedAy, selectedSm);
          if (ht) {
            setSelectedEmployee(ht.employeeId ? ht.employeeId.toString() : '');
            setCurrentHomeroomTeacher(ht.employee || null);
          } else {
            setSelectedEmployee('');
            setCurrentHomeroomTeacher(null);
          }
        } catch (err) {
          console.error(err);
          setCurrentHomeroomTeacher(null);
        }
      }
    };
    fetchTeacher();
  }, [id, selectedAy, selectedSm]);

  const handleAssignHomeroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageHomeroom) {
      notify.error('Anda tidak memiliki izin untuk menugaskan wali kelas.');
      return;
    }
    if (!id || !selectedEmployee || !selectedAy || !selectedSm) {
      notify.warning('Mohon lengkapi data Guru, Tahun Ajaran, dan Semester terlebih dahulu.');
      return;
    }
    try {
      setSaving(true);
      const result = await assignHomeroomTeacher(id, {
        employeeId: parseInt(selectedEmployee, 10),
        academicYearId: parseInt(selectedAy, 10),
        semesterId: parseInt(selectedSm, 10)
      });
      if (result?.employee) {
        setCurrentHomeroomTeacher(result.employee);
      } else {
        const emp = employees.find(e => String(e.id) === selectedEmployee);
        if (emp) setCurrentHomeroomTeacher(emp);
      }
      notify.success('Wali kelas berhasil ditugaskan untuk kelas ini!');
    } catch (err: any) {
      notify.error(err, 'Gagal menugaskan wali kelas');
    } finally {
      setSaving(false);
    }
  };

  const fetchStudents = async () => {
    if (!id || !selectedAy || !selectedSm) return;
    try {
      setLoadingStudents(true);
      const data = await getStudents({
        classroomId: id,
        academicYearId: selectedAy,
        semesterId: selectedSm,
        limit: 1000
      });
      setStudents(data);
    } catch (err) {
      console.error(err);
      notify.error(err, 'Gagal memuat daftar siswa di kelas ini');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'siswa' && id && selectedAy && selectedSm) {
      fetchStudents();
    }
  }, [activeTab, id, selectedAy, selectedSm]);

  // Filtered Students for the roster table
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchQuery = !searchQuery.trim() || 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn && s.nisn.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchGender = genderFilter === 'ALL' || s.gender === genderFilter;
      return matchQuery && matchGender;
    });
  }, [students, searchQuery, genderFilter]);

  // Statistics
  const maleCount = useMemo(() => students.filter(s => s.gender === 'Laki-laki').length, [students]);
  const femaleCount = useMemo(() => students.filter(s => s.gender === 'Perempuan').length, [students]);
  const occupancyRate = useMemo(() => {
    if (!classroom?.capacity) return 0;
    return Math.min(100, Math.round((students.length / classroom.capacity) * 100));
  }, [students.length, classroom?.capacity]);

  // Helper navigate to student detail safely
  const handleNavigateToStudent = (studentId: string | number) => {
    if (!canViewStudentDetail) {
      notify.warning('Anda tidak memiliki izin untuk melihat detail lengkap siswa.');
      return;
    }
    navigate(`/entities/students/${studentId}`);
  };

  const studentColumns: Column<Student>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_: Student, index?: number) => (
        <span className="text-gray-400 text-xs font-mono font-medium">{(index ?? 0) + 1}</span>
      )
    },
    {
      key: 'fullName',
      header: 'Identitas Siswa',
      render: (s) => (
        <div className="flex items-center gap-3 min-w-0 py-1">
          {/* Avatar Inisial Tematik */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs ${
            s.gender === 'Perempuan' 
              ? 'bg-rose-50 text-rose-700 border-rose-200/80' 
              : 'bg-blue-50 text-blue-700 border-blue-200/80'
          }`}>
            {s.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 max-w-xs sm:max-w-sm md:max-w-md">
            {canViewStudentDetail ? (
              <button
                type="button"
                onClick={() => handleNavigateToStudent(s.id)}
                className="text-left font-semibold text-gray-900 hover:text-indigo-600 hover:underline text-sm transition-colors block truncate group flex items-center gap-1.5 max-w-full"
                title={`Buka detail lengkap: ${s.fullName}`}
              >
                <span className="truncate">{s.fullName}</span>
                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setQuickViewStudent(s)}
                className="text-left font-semibold text-gray-900 hover:text-indigo-600 text-sm transition-colors block truncate cursor-pointer max-w-full"
                title={`Lihat profil: ${s.fullName}`}
              >
                {s.fullName}
              </button>
            )}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
              <span>NISN: <span className="font-mono text-gray-600 break-all">{s.nisn || '-'}</span></span>
              {s.phone && (
                <>
                  <span>&bull;</span>
                  <span className="truncate flex items-center gap-1">
                    <Phone size={10} className="shrink-0" /> {s.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'nis',
      header: 'NIS',
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-50/90 px-2.5 py-1 rounded-lg border border-gray-200/80 select-all shadow-2xs break-all">
          {s.nis}
        </span>
      )
    },
    {
      key: 'gender',
      header: 'L/P',
      render: (s) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
          s.gender === 'Perempuan'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {s.gender === 'Perempuan' ? 'P' : 'L'} ({s.gender || '-'})
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuickViewStudent(s)}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
            title="Rangkuman Cepat (Quick View)"
          >
            <Eye size={15} />
          </button>
          {canViewStudentDetail ? (
            <button
              type="button"
              onClick={() => handleNavigateToStudent(s.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl transition-all shadow-2xs group"
              title="Buka Halaman Detail Siswa"
            >
              <span>Detail</span>
              <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          ) : (
            <span className="text-[11px] text-gray-400 italic bg-gray-50 px-2 py-1 rounded-md border border-gray-200/60 cursor-default">
              Hanya Baca
            </span>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[360px]">
        <div className="flex flex-col items-center gap-3 text-gray-500 text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="font-medium text-gray-600">Memuat data rombongan belajar...</span>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState 
          message="Kelas Tidak Ditemukan"
          description="Data rombongan belajar tidak ditemukan atau telah dinonaktifkan."
          action={
            <button
              type="button"
              onClick={() => navigate('/academic/classrooms')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Rombel
            </button>
          }
        />
      </div>
    );
  }

  const currentTeacher = currentHomeroomTeacher || employees.find(e => String(e.id) === selectedEmployee);
  const currentAy = academicYears.find(ay => ay.id === selectedAy);
  const currentSm = semesters.find(sm => sm.id === selectedSm);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Tombol Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <button 
          type="button"
          onClick={() => navigate(canReadClassrooms ? '/academic/classrooms' : '/homeroom/dashboard')} 
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
        >
          <ArrowLeft size={14} /> {canReadClassrooms ? 'Kembali ke Daftar Rombel' : 'Kembali ke Dashboard'}
        </button>
      </div>

      {/* Header Banner Rombel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-[0.04] pointer-events-none text-indigo-900">
          <GraduationCap size={200} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            {/* Class Badge Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-200/80 shrink-0 tracking-wider">
              {classroom.code.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight break-all [overflow-wrap:anywhere] min-w-0">
                  {classroom.name}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                  classroom.isActive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${classroom.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {classroom.isActive ? 'Rombel Aktif' : 'Non-Aktif'}
                </span>
              </div>

              {/* Clean Subtitle Info */}
              <p className="text-xs text-gray-500 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Kode: <strong className="font-mono text-gray-700">{classroom.code}</strong></span>
                <span>&bull;</span>
                <span>Tingkat: <strong className="text-gray-700">{classroom.grade?.name || '-'} ({classroom.grade?.educationLevel || '-'})</strong></span>
                <span>&bull;</span>
                <span>Jurusan: <strong className="text-gray-700">{classroom.major?.name || 'Umum'}</strong></span>
                <span>&bull;</span>
                <span>Terisi: <strong className="text-indigo-600 font-semibold">{students.length} / {classroom.capacity || 0} Siswa</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Roster Status Card */}
          <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-200/70 shrink-0 flex flex-col justify-center min-w-[200px]">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
              <span className="font-medium">Kapasitas Kelas</span>
              <span className="font-bold text-gray-900">{occupancyRate}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyRate >= 95 ? 'bg-rose-500' : occupancyRate >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                }`} 
                style={{ width: `${occupancyRate}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span>{students.length} Siswa</span>
              <span>Maks {classroom.capacity || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b border-gray-200">
        <button 
          type="button"
          className={`pb-3.5 px-1 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'info' ? 'text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <Info size={16} /> Info & Wali Kelas
          {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button 
          type="button"
          className={`pb-3.5 px-1 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'siswa' ? 'text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('siswa')}
        >
          <Users size={16} /> 
          Daftar Siswa Rombel
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'siswa' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {students.length}
          </span>
          {activeTab === 'siswa' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Spesifikasi Teknis Rombel (Cardlet Pattern) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 leading-tight">Spesifikasi Ruang & Rombel</h3>
                <p className="text-xs text-gray-400 font-normal mt-0.5">Identitas teknis dan parameter ruang belajar</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Kode Rombel</span>
                  <span className="font-mono font-semibold text-gray-900 text-sm break-all select-all block">{classroom.code}</span>
                </div>
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Nama Rombel</span>
                  <span className="font-semibold text-gray-900 text-sm break-all [overflow-wrap:anywhere] block">{classroom.name}</span>
                </div>
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Tingkat Pendidikan</span>
                  <span className="font-semibold text-gray-900 text-sm break-words [overflow-wrap:anywhere] block">{classroom.grade?.name || '-'} ({classroom.grade?.educationLevel || '-'})</span>
                </div>
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Konsentrasi / Jurusan</span>
                  <span className="font-semibold text-gray-900 text-sm break-all [overflow-wrap:anywhere] block">{classroom.major?.name || 'Umum'}</span>
                </div>
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Kapasitas Maksimal</span>
                  <span className="font-bold text-gray-900 text-sm block">{classroom.capacity || 0} Siswa</span>
                </div>
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Siswa Ditempatkan</span>
                  <span className="font-bold text-indigo-600 text-sm block">{students.length} Siswa</span>
                </div>
                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0 sm:col-span-2">
                  <span className="text-gray-400 block mb-1 font-medium text-[11px] tracking-wide uppercase">Komposisi Gender Siswa</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Laki-laki: {maleCount} Siswa
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Perempuan: {femaleCount} Siswa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Penetapan Wali Kelas atau Display Ringkasan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 leading-tight">Wali Kelas Aktif</h3>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  {canManageHomeroom ? 'Kelola penugasan guru pendamping kelas' : 'Data guru yang ditugaskan sebagai wali kelas'}
                </p>
              </div>

              {canManageHomeroom ? (
                <form onSubmit={handleAssignHomeroom} className="space-y-4 pt-1">
                  <FormField label="Tahun Ajaran" required>
                    <Select
                      wrapperClassName="w-full"
                      value={selectedAy}
                      onChange={(e) => setSelectedAy(e.target.value)}
                      options={[
                        { value: '', label: '-- Pilih Tahun Ajaran --' },
                        ...academicYears.map(ay => ({
                          value: ay.id,
                          label: `${ay.name} ${ay.isActive ? '(Aktif)' : ''}`
                        }))
                      ]}
                      required
                    />
                  </FormField>

                  <FormField label="Semester" required>
                    <Select
                      wrapperClassName="w-full"
                      value={selectedSm}
                      onChange={(e) => setSelectedSm(e.target.value)}
                      options={[
                        { value: '', label: '-- Pilih Semester --' },
                        ...semesters.map(sm => ({
                          value: sm.id,
                          label: `${sm.name} ${sm.isActive ? '(Aktif)' : ''}`
                        }))
                      ]}
                      required
                    />
                  </FormField>

                  <FormField label="Guru / Wali Kelas" required>
                    <Select
                      wrapperClassName="w-full"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      options={[
                        { value: '', label: '-- Pilih Guru / Wali Kelas --' },
                        ...employees.map(emp => ({
                          value: String(emp.id),
                          label: `${emp.fullName} (${emp.employeeNumber})`
                        }))
                      ]}
                      required
                    />
                  </FormField>

                  {/* Preview Guru Terpilih */}
                  {currentTeacher && (
                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        {currentTeacher.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 text-sm block truncate">{currentTeacher.fullName}</span>
                        <span className="text-xs text-indigo-700 font-mono">NIP: {currentTeacher.employeeNumber}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 cursor-pointer" 
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Menyimpan Penugasan...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Simpan Penugasan Wali Kelas
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 pt-1">
                  {currentTeacher ? (
                    <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-indigo-200">
                        {currentTeacher.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 text-base block truncate">{currentTeacher.fullName}</span>
                        <span className="text-xs text-gray-500 font-mono block">NIP: {currentTeacher.employeeNumber}</span>
                        <span className="text-xs text-indigo-600 font-medium mt-1 inline-flex items-center gap-1">
                          <UserCheck size={12} /> Ditugaskan untuk periode ini
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                      <GraduationCap size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Belum Ada Wali Kelas Ditugaskan</p>
                      <p className="text-xs text-gray-400 mt-0.5">Wali kelas belum ditetapkan untuk periode akademik ini.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                      <span className="text-gray-400 block mb-1 font-medium text-[11px] uppercase">Tahun Ajaran</span>
                      <span className="font-semibold text-gray-900">{currentAy?.name || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                      <span className="text-gray-400 block mb-1 font-medium text-[11px] uppercase">Semester</span>
                      <span className="font-semibold text-gray-900">{currentSm?.name || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Roster Siswa Rombel */}
        {activeTab === 'siswa' && (
          <div className="space-y-4">
            {/* Header Toolbar & Search Filter */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900 break-all [overflow-wrap:anywhere]">
                    Roster Siswa Kelas {classroom.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>Tahun Ajaran: <strong className="text-gray-800">{currentAy?.name || '-'}</strong></span>
                    <span>&bull;</span>
                    <span>Semester: <strong className="text-gray-800">{currentSm?.name || '-'}</strong></span>
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Bar */}
                  <div className="relative min-w-[240px] flex-1 sm:flex-none">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50/90 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Cari nama, NIS, atau NISN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Gender Filter Buttons */}
                  <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs border border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => setGenderFilter('ALL')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        genderFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Semua ({students.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter('Laki-laki')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        genderFilter === 'Laki-laki' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      L ({maleCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter('Perempuan')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        genderFilter === 'Perempuan' ? 'bg-white text-rose-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      P ({femaleCount})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Data */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6">
              <DataTable
                columns={studentColumns}
                data={filteredStudents}
                loading={loadingStudents}
                emptyMessage={
                  searchQuery || genderFilter !== 'ALL'
                    ? "Tidak ada siswa yang sesuai dengan filter pencarian."
                    : "Belum ada siswa yang ditempatkan di kelas ini pada periode yang dipilih."
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick View Student Modal */}
      {quickViewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Sparkles size={16} /> Rangkuman Singkat Siswa
              </div>
              <button 
                type="button" 
                onClick={() => setQuickViewStudent(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border shadow-xs ${
                quickViewStudent.gender === 'Perempuan' 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {quickViewStudent.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-lg leading-tight truncate">{quickViewStudent.fullName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    NIS: {quickViewStudent.nis}
                  </span>
                  <span className="text-xs text-gray-400">&bull;</span>
                  <span className="text-xs text-gray-500">
                    NISN: <span className="font-mono">{quickViewStudent.nisn || '-'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Data */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[11px] uppercase">Jenis Kelamin</span>
                <span className="font-semibold text-gray-800">{quickViewStudent.gender || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[11px] uppercase">Agama</span>
                <span className="font-semibold text-gray-800">{quickViewStudent.religion || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[11px] uppercase">Tempat / Tgl Lahir</span>
                <span className="font-semibold text-gray-800">
                  {quickViewStudent.birthPlace || '-'}, {quickViewStudent.birthDate ? new Date(quickViewStudent.birthDate).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[11px] uppercase">No. Telepon / WA</span>
                <span className="font-semibold text-gray-800">{quickViewStudent.phone || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 col-span-2">
                <span className="text-gray-400 block mb-0.5 text-[11px] uppercase">Alamat Domisili</span>
                <span className="font-medium text-gray-800 break-words [overflow-wrap:anywhere] block">
                  {quickViewStudent.address || '-'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setQuickViewStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Tutup
              </button>
              {canViewStudentDetail && (
                <button
                  type="button"
                  onClick={() => {
                    const sid = quickViewStudent.id;
                    setQuickViewStudent(null);
                    handleNavigateToStudent(sid);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                >
                  <span>Buka Halaman Detail Lengkap</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
