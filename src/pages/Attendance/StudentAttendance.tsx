import React, { useEffect, useState, useMemo } from 'react';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, type AcademicYear, type Semester, type Grade, type Classroom } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import { getStudentAttendances, upsertStudentAttendanceBatch, getAttendanceSetting, type StudentAttendance, type StudentAttendanceBatchItem } from '../../api/attendanceService';
import { Save, Calendar, CheckCircle2, Clock, AlertTriangle, UserCheck, RotateCcw, Filter, Users, GraduationCap, Tv, ExternalLink } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/Common/TableSkeleton';
import { notify } from '../../utils/feedback';

interface AttendanceRow {
  studentId: string;
  studentName: string;
  nis: string;
  status: string;
  notes: string;
}

export const StudentAttendancePage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canRecordAttendance = hasPermission('student_attendance.record') || hasPermission('student_attendance.batch') || hasPermission('attendance.write');

  // Filters
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI Tabs & State
  const [activeTab, setActiveTab] = useState<'input' | 'recap'>('input');
  const [recapFilter, setRecapFilter] = useState<'ALL' | 'RECORDED' | 'UNRECORDED'>('ALL');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isManualEnabled, setIsManualEnabled] = useState(true);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [originalRows, setOriginalRows] = useState<AttendanceRow[]>([]);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedGradeId) {
      fetchClassrooms(selectedGradeId);
    } else {
      setClassrooms([]);
      setSelectedClassroomId('');
    }
  }, [selectedGradeId]);

  useEffect(() => {
    if (selectedAcademicYearId && selectedSemesterId && selectedClassroomId && date) {
      fetchAttendanceData();
    } else {
      setRows([]);
      setOriginalRows([]);
    }
  }, [selectedAcademicYearId, selectedSemesterId, selectedClassroomId, date]);

  // Filtered semesters for selected academic year
  const filteredSemesters = useMemo(() => {
    if (!selectedAcademicYearId) return [];
    return semesters.filter((s) => {
      const semAyId = s.academicYearId?.toString() || s.academicYear?.id?.toString();
      return semAyId === selectedAcademicYearId.toString();
    });
  }, [semesters, selectedAcademicYearId]);

  const handleAcademicYearChange = (newAyId: string) => {
    setSelectedAcademicYearId(newAyId);
    if (!newAyId) {
      setSelectedSemesterId('');
      return;
    }
    const relevantSemesters = semesters.filter((s) => {
      const semAyId = s.academicYearId?.toString() || s.academicYear?.id?.toString();
      return semAyId === newAyId.toString();
    });
    const activeSem = relevantSemesters.find(s => s.isActive) || relevantSemesters[0];
    setSelectedSemesterId(activeSem ? activeSem.id.toString() : '');
  };

  const fetchFilters = async () => {
    try {
      const [ayRes, semRes, grRes, settingRes] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getGrades(),
        getAttendanceSetting().catch(() => null),
      ]);
      setAcademicYears(ayRes);
      setSemesters(semRes);
      setGrades(grRes);
      if (settingRes) {
        setIsManualEnabled(settingRes.studentManualEnabled ?? true);
      }
      
      const activeAy = ayRes.find(a => a.isActive) || ayRes[0];
      if (activeAy) {
        const ayIdStr = activeAy.id.toString();
        setSelectedAcademicYearId(ayIdStr);
        const relevantSemesters = semRes.filter((s) => {
          const semAyId = s.academicYearId?.toString() || s.academicYear?.id?.toString();
          return semAyId === ayIdStr;
        });
        const activeSem = relevantSemesters.find(s => s.isActive) || relevantSemesters[0];
        if (activeSem) setSelectedSemesterId(activeSem.id.toString());
      }
    } catch (err: any) {
      notify.error(err, 'Gagal memuat filter akademik');
    }
  };

  const fetchClassrooms = async (gradeId: string) => {
    try {
      const data = await getClassrooms(gradeId);
      setClassrooms(data);
      if (data.length > 0) setSelectedClassroomId(data[0].id);
      else setSelectedClassroomId('');
    } catch (err) {
      notify.error(err, 'Gagal memuat daftar rombel');
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      const [studentsData, attendancesData] = await Promise.all([
        getStudents({ 
          classroomId: selectedClassroomId, 
          academicYearId: selectedAcademicYearId,
          semesterId: selectedSemesterId,
          status: 'ACTIVE',
          limit: 1000
        }),
        getStudentAttendances({
          classroomId: selectedClassroomId,
          academicYearId: selectedAcademicYearId,
          semesterId: selectedSemesterId,
          date
        })
      ]);
      
      const attendanceMap = new Map<string, StudentAttendance>();
      attendancesData.forEach((att: StudentAttendance) => {
        attendanceMap.set(att.studentId, att);
      });
      
      const newRows: AttendanceRow[] = studentsData.map(student => {
        const att = attendanceMap.get(student.id);
        return {
          studentId: student.id,
          studentName: student.fullName,
          nis: student.nis,
          status: att ? att.status : 'Belum Absen',
          notes: att?.notes || ''
        };
      });
      
      setRows(newRows);
      setOriginalRows(JSON.parse(JSON.stringify(newRows)));
    } catch (err: any) {
      if (err.response?.status === 403) {
        notify.error('Akses ditolak: Anda hanya berwenang melihat/mengabsen kelas perwalian Anda sendiri.');
      } else {
        notify.error(err, 'Gagal memuat data absensi siswa');
      }
      setRows([]);
      setOriginalRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof AttendanceRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
  };

  const handleMarkAllPresent = () => {
    const updated = rows.map(r => {
      if (r.status === 'Belum Absen') {
        return { ...r, status: 'Hadir' };
      }
      return r;
    });
    setRows(updated);
    notify.info('Siswa yang belum absen telah ditandai Hadir. Klik "Simpan Presensi" untuk menerapkan.');
  };

  const handleReset = () => {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    notify.info('Perubahan status telah dikembalikan ke kondisi awal.');
  };

  const handleOpenConfirm = () => {
    if (!selectedAcademicYearId || !selectedSemesterId || !selectedClassroomId || !date) {
      notify.error('Harap lengkapi semua filter kelas dan tanggal sebelum menyimpan.');
      return;
    }
    const attendances = rows.filter(r => r.status !== 'Belum Absen');
    if (attendances.length === 0) {
      notify.error('Tidak ada perubahan absensi untuk disimpan. Silakan pilih status kehadiran siswa terlebih dahulu.');
      return;
    }
    setConfirmOpen(true);
  };

  const handleExecuteSave = async () => {
    try {
      setSaving(true);
      const attendances: StudentAttendanceBatchItem[] = rows
        .filter(r => r.status !== 'Belum Absen')
        .map(r => ({
          studentId: r.studentId,
          status: r.status,
          notes: r.notes || undefined
        }));
      
      await upsertStudentAttendanceBatch(selectedClassroomId, selectedAcademicYearId, selectedSemesterId, date, attendances);
      notify.success(`Data presensi untuk ${attendances.length} siswa berhasil disimpan!`);
      setConfirmOpen(false);
      await fetchAttendanceData();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan absensi siswa');
    } finally {
      setSaving(false);
    }
  };

  // KPI calculations
  const totalStudents = rows.length;
  const countPresent = rows.filter(r => r.status === 'Hadir').length;
  const countLate = rows.filter(r => r.status === 'Terlambat').length;
  const countSickLeave = rows.filter(r => r.status === 'Sakit' || r.status === 'Izin').length;
  const countAlphaUnrecorded = rows.filter(r => r.status === 'Alpa' || r.status === 'Belum Absen').length;
  const countRecorded = rows.filter(r => r.status !== 'Belum Absen').length;
  const countUnrecorded = rows.filter(r => r.status === 'Belum Absen').length;

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Hadir': return 'success';
      case 'Terlambat': return 'warning';
      case 'Sakit':
      case 'Izin': return 'info';
      case 'Alpa': return 'danger';
      default: return 'default';
    }
  };

  // Filtered rows for recap tab
  const recapRows = rows.filter(r => {
    if (recapFilter === 'RECORDED') return r.status !== 'Belum Absen';
    if (recapFilter === 'UNRECORDED') return r.status === 'Belum Absen';
    return true;
  });

  const isDirty = useMemo(() => {
    return JSON.stringify(rows) !== JSON.stringify(originalRows);
  }, [rows, originalRows]);

  const selectedClassroomObj = classrooms.find(c => c.id === selectedClassroomId);
  const formattedDate = date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Presensi & Kehadiran Siswa"
        subtitle="Kelola pencatatan kehadiran harian siswa per rombel kelas dengan cepat dan akurat"
        action={
          <a
            href="/kiosk/attendance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm transition-all shadow-sm hover:shadow group"
          >
            <Tv size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span>Layar Monitor Kiosk</span>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-white transition-colors" />
          </a>
        }
      />

      {/* 2. Filter Bar Terintegrasi (Glassmorphism Standard) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tahun Ajaran</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate" 
                value={selectedAcademicYearId} 
                onChange={(e) => handleAcademicYearChange(e.target.value)}
              >
                <option value="">Pilih Tahun Ajaran</option>
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.name}{ay.isActive ? ' (Aktif)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Semester</label>
            <div className="relative group">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate disabled:opacity-60 disabled:cursor-not-allowed" 
                value={selectedSemesterId} 
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                disabled={!selectedAcademicYearId || filteredSemesters.length === 0}
              >
                <option value="">{selectedAcademicYearId ? 'Pilih Semester' : 'Pilih Tahun Ajaran Dulu'}</option>
                {filteredSemesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (Aktif)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat</label>
            <div className="relative group">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium" 
                value={selectedGradeId} 
                onChange={(e) => setSelectedGradeId(e.target.value)}
              >
                <option value="">Pilih Tingkat</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Kelas / Rombel</label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium" 
                value={selectedClassroomId} 
                onChange={(e) => setSelectedClassroomId(e.target.value)} 
                disabled={!selectedGradeId}
              >
                <option value="">Pilih Kelas</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tanggal</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kartu Ringkasan Statistik (KPI Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Siswa</p>
            <p className="text-xl font-bold text-slate-800">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Hadir</p>
            <p className="text-xl font-bold text-emerald-800">{countPresent}</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Terlambat</p>
            <p className="text-xl font-bold text-amber-800">{countLate}</p>
          </div>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-sky-600 font-medium">Sakit / Izin</p>
            <p className="text-xl font-bold text-sky-800">{countSickLeave}</p>
          </div>
        </div>

        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-rose-600 font-medium">Alpa / Belum</p>
            <p className="text-xl font-bold text-rose-800">{countAlphaUnrecorded}</p>
          </div>
        </div>
      </div>

      {/* Peringatan jika metode presensi manual siswa dinonaktifkan */}
      {!isManualEnabled && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-amber-900 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-amber-950">Pencatatan Presensi Manual Siswa Sedang Dinonaktifkan</p>
            <p className="text-amber-800/90 mt-0.5">
              Pihak sekolah mengalihkan absensi siswa ke metode aktif lainnya (seperti Kartu RFID / Kiosk). Aksi simpan manual disembunyikan.
            </p>
          </div>
        </div>
      )}

      {/* 4. Toolbar Tabel Presensi (Clean Standard) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sisi Kiri: Tab Pilihan Mode & Filter Rekap */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'input' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Input Presensi Rombel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recap')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recap' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rekap & Riwayat Hari Ini
            </button>
          </div>

          {activeTab === 'recap' && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />
              <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-1.5 pl-2 pr-1 text-slate-400">
                  <Filter size={13} />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:inline">Status:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecapFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    recapFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>Semua</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    recapFilter === 'ALL' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {rows.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecapFilter('RECORDED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    recapFilter === 'RECORDED'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>Sudah Absen</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    recapFilter === 'RECORDED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {countRecorded}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecapFilter('UNRECORDED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    recapFilter === 'UNRECORDED'
                      ? 'bg-white text-rose-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>Belum Absen</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    recapFilter === 'UNRECORDED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {countUnrecorded}
                  </span>
                </button>
              </div>
            </div>
          )}

          {selectedClassroomObj && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl hidden lg:inline-flex items-center gap-1.5">
              <Users size={13} />
              {selectedClassroomObj.name} ({formattedDate})
            </span>
          )}

          {isDirty && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl animate-pulse">
              Perubahan belum disimpan
            </span>
          )}
        </div>

        {/* Sisi Kanan: Aksi Massal & Simpan */}
        {canRecordAttendance && isManualEnabled && selectedClassroomObj && rows.length > 0 && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            {activeTab === 'input' && (
              <>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  Tandai Semua Hadir
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Kembalikan ke kondisi awal"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={saving || !isDirty}
              className={`inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 transition-all ${
                !isDirty ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Save size={15} className={saving ? 'animate-pulse' : ''} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Tabel Interaktif */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-6">
            <table className="w-full">
              <tbody>
                <TableSkeleton rows={8} columns={5} />
              </tbody>
            </table>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {selectedClassroomId 
              ? 'Tidak ada data siswa aktif di rombel kelas ini.' 
              : 'Silakan pilih Tahun Ajaran, Tingkat, dan Rombel Kelas untuk memuat presensi.'}
          </div>
        ) : activeTab === 'input' ? (
          /* TAB 1: INPUT PRESENSI ROMBEL */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/70 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="w-12 text-center py-3.5 px-3">No</th>
                  <th className="w-32 py-3.5 px-3">NIS</th>
                  <th className="py-3.5 px-3">Nama Siswa</th>
                  <th className="w-52 py-3.5 px-3">Status Kehadiran</th>
                  <th className="py-3.5 px-4">Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 animate-in fade-in duration-300">
                {rows.map((row, index) => (
                  <tr key={row.studentId} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="text-center text-gray-400 py-3 px-3 font-mono text-xs">{index + 1}</td>
                    <td className="font-mono text-xs text-gray-500 py-3 px-3">{row.nis}</td>
                    <td className="py-3 px-3">
                      <span 
                        className="font-bold text-gray-800 truncate block max-w-[220px]" 
                        title={row.studentName}
                      >
                        {row.studentName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select 
                        disabled={!canRecordAttendance}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold outline-none transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent ${
                          canRecordAttendance ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                        } ${
                          row.status === 'Belum Absen' ? 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400/50' :
                          row.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400/50' :
                          row.status === 'Terlambat' ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-400/50' :
                          row.status === 'Izin' ? 'bg-sky-50 text-sky-700 border-sky-300 focus:ring-sky-400/50' :
                          row.status === 'Sakit' ? 'bg-indigo-50 text-indigo-700 border-indigo-300 focus:ring-indigo-400/50' :
                          'bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-400/50'
                        }`}
                        value={row.status}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      >
                        <option value="Belum Absen">Belum Absen</option>
                        <option value="Hadir">Hadir</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Alpa">Alpa</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input 
                        type="text" 
                        disabled={!canRecordAttendance}
                        className={`input-std py-1.5 px-3 text-xs shadow-sm w-full transition-colors ${
                          canRecordAttendance ? 'bg-white/70 focus:bg-white' : 'bg-gray-100 cursor-not-allowed opacity-80'
                        }`}
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder={canRecordAttendance ? "Tambahkan keterangan opsional..." : "-"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: REKAP & RIWAYAT HARI INI */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/70 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="w-12 text-center py-3.5 px-3">No</th>
                  <th className="w-32 py-3.5 px-3">NIS</th>
                  <th className="py-3.5 px-3">Nama Siswa</th>
                  <th className="w-40 py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 animate-in fade-in duration-300">
                {recapRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                      Tidak ada data siswa yang cocok dengan filter ini.
                    </td>
                  </tr>
                ) : (
                  recapRows.map((row, index) => (
                    <tr key={row.studentId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="text-center text-gray-400 py-3 px-3 font-mono text-xs">{index + 1}</td>
                      <td className="font-mono text-xs text-gray-500 py-3 px-3">{row.nis}</td>
                      <td className="py-3 px-3">
                        <span 
                          className="font-bold text-gray-800 truncate block max-w-[240px]"
                          title={row.studentName}
                        >
                          {row.studentName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={getStatusBadgeVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <span className="truncate block max-w-[300px]" title={row.notes || '-'}>
                          {row.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Dialog Konfirmasi Simpan Presensi */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExecuteSave}
        variant="info"
        title="Konfirmasi Simpan Presensi"
        message={`Apakah Anda yakin ingin menyimpan data presensi untuk rombel ini pada tanggal ${date}? Data presensi yang telah terisi (${rows.filter(r => r.status !== 'Belum Absen').length} siswa) akan diperbarui ke sistem.`}
        confirmText={saving ? 'Menyimpan...' : 'Ya, Simpan'}
      />
    </div>
  );
};
