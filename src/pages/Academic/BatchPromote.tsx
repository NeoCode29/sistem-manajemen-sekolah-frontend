import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchPromote } from '../../api/promotionService';
import { getAcademicYears, getClassrooms, getSemesters, getClassroomCapacity } from '../../api/academicService';
import type { AcademicYear, Classroom as ClassType, Semester } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  CheckSquare, 
  Users, 
  Info,
  Loader2
} from 'lucide-react';
import { PageHeader, Select, FormField, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const BatchPromote: React.FC = () => {
  const navigate = useNavigate();
  const { canExecutePromotions } = usePermissions();
  const canPromote = canExecutePromotions;

  // Dropdown Data State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  // Selection State
  const [selectedSourceAcademicYear, setSelectedSourceAcademicYear] = useState('');
  const [selectedSourceSemester, setSelectedSourceSemester] = useState('');
  const [selectedTargetAcademicYear, setSelectedTargetAcademicYear] = useState('');
  const [selectedSourceClass, setSelectedSourceClass] = useState('');
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [selectedTargetSemester, setSelectedTargetSemester] = useState('');
  const [targetYearNotice, setTargetYearNotice] = useState<string | null>(null);
  
  // Dual-Pane State
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  const [checkedSourceIds, setCheckedSourceIds] = useState<Set<string>>(new Set());
  const [promotedStudents, setPromotedStudents] = useState<Student[]>([]);
  const [checkedTargetIds, setCheckedTargetIds] = useState<Set<string>>(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Capacity State
  const [targetCapacityInfo, setTargetCapacityInfo] = useState<{capacity: number | null, currentCount: number, remaining: number | null} | null>(null);

  // Retain unpromoted option
  const [markRemainingAsRetained, setMarkRemainingAsRetained] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    variant: 'info',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  const autoFillTargetPeriod = (
    sourceAyId: string,
    sourceSemId: string,
    ayList: AcademicYear[],
    semList: Semester[],
  ) => {
    if (!sourceAyId || !sourceSemId) return;

    const sourceAy = ayList.find((ay) => ay.id.toString() === sourceAyId.toString());
    const sourceSem = semList.find((s) => s.id.toString() === sourceSemId.toString());
    if (!sourceAy || !sourceSem) return;

    const match = sourceAy.name.match(/^(\d{4})\/(\d{4})$/);
    if (!match) return;

    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);
    const isGanjil = sourceSem.name.trim().toLowerCase().includes('ganjil');

    if (isGanjil) {
      // Ganjil -> Genap in the SAME Academic Year
      setSelectedTargetAcademicYear(sourceAy.id.toString());
      const genapSem = semList.find(
        (s) =>
          (s.academicYearId?.toString() === sourceAy.id.toString() || s.academicYear?.id?.toString() === sourceAy.id.toString()) &&
          s.name.trim().toLowerCase().includes('genap'),
      );
      if (genapSem) {
        setSelectedTargetSemester(genapSem.id.toString());
      } else {
        setSelectedTargetSemester('');
      }
      setTargetYearNotice(null);
    } else {
      // Genap -> Ganjil in the NEXT Academic Year
      const nextYearName = `${startYear + 1}/${endYear + 1}`;
      const nextAy = ayList.find((ay) => ay.name === nextYearName);

      if (nextAy) {
        setSelectedTargetAcademicYear(nextAy.id.toString());
        const ganjilSem = semList.find(
          (s) =>
            (s.academicYearId?.toString() === nextAy.id.toString() || s.academicYear?.id?.toString() === nextAy.id.toString()) &&
            s.name.trim().toLowerCase().includes('ganjil'),
        );
        if (ganjilSem) {
          setSelectedTargetSemester(ganjilSem.id.toString());
        } else {
          setSelectedTargetSemester('');
        }
        setTargetYearNotice(null);
      } else {
        setSelectedTargetAcademicYear('');
        setSelectedTargetSemester('');
        setTargetYearNotice(
          `Tahun Ajaran berikutnya (${nextYearName}) belum terdaftar di Master Data.`,
        );
      }
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [ayData, classData, semData] = await Promise.all([
        getAcademicYears(),
        getClassrooms(),
        getSemesters(),
      ]);
      setAcademicYears(ayData);
      setClasses(classData);
      setSemesters(semData);

      // Default source to active academic year and active semester
      const activeAy = ayData.find((ay) => ay.isActive) || ayData[0];
      let initialSourceAyId = '';
      let initialSourceSemId = '';

      if (activeAy) {
        initialSourceAyId = activeAy.id.toString();
        setSelectedSourceAcademicYear(initialSourceAyId);

        const yearSemesters = semData.filter(
          (s) => (s.academicYearId?.toString() === activeAy.id.toString() || s.academicYear?.id?.toString() === activeAy.id.toString()),
        );
        const activeSemInYear = yearSemesters.find((s) => s.isActive) || yearSemesters[0];
        if (activeSemInYear) {
          initialSourceSemId = activeSemInYear.id.toString();
          setSelectedSourceSemester(initialSourceSemId);
        }
      }

      if (initialSourceAyId && initialSourceSemId) {
        autoFillTargetPeriod(initialSourceAyId, initialSourceSemId, ayData, semData);
      }
    } catch (err) {
      console.error('Failed to load dropdowns', err);
      notify.error(err, 'Gagal memuat data referensi akademik');
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (selectedTargetClass && selectedTargetAcademicYear && selectedTargetSemester) {
      getClassroomCapacity(selectedTargetClass, selectedTargetAcademicYear, selectedTargetSemester)
        .then(res => setTargetCapacityInfo(res))
        .catch(() => setTargetCapacityInfo(null));
    } else {
      setTargetCapacityInfo(null);
    }
  }, [selectedTargetClass, selectedTargetAcademicYear, selectedTargetSemester]);

  const handleSourceAcademicYearChange = (yearId: string) => {
    setSelectedSourceAcademicYear(yearId);
    const yearSemesters = semesters.filter(
      (s) => (s.academicYearId?.toString() === yearId.toString() || s.academicYear?.id?.toString() === yearId.toString()),
    );
    const defaultSem = yearSemesters.find((s) => s.isActive) || yearSemesters[0];
    const semId = defaultSem ? defaultSem.id.toString() : '';
    setSelectedSourceSemester(semId);

    if (yearId && semId) {
      autoFillTargetPeriod(yearId, semId, academicYears, semesters);
    }
  };

  const handleSourceSemesterChange = (semId: string) => {
    setSelectedSourceSemester(semId);
    if (selectedSourceAcademicYear && semId) {
      autoFillTargetPeriod(selectedSourceAcademicYear, semId, academicYears, semesters);
    }
  };

  // Fetch Source Students
  useEffect(() => {
    const fetchSourceStudents = async () => {
      if (!selectedSourceClass || !selectedSourceAcademicYear) {
        setSourceStudents([]);
        setPromotedStudents([]);
        setCheckedSourceIds(new Set());
        setCheckedTargetIds(new Set());
        return;
      }
      try {
        setLoadingStudents(true);
        const queryParams: any = {
          classroomId: selectedSourceClass,
          academicYearId: selectedSourceAcademicYear,
          enrollmentStatus: 'ENROLLED',
          status: 'ACTIVE',
          limit: 1000,
        };
        const students = await getStudents(queryParams);
        setSourceStudents(students as Student[]);
        setPromotedStudents([]);
        setCheckedSourceIds(new Set());
        setCheckedTargetIds(new Set());
      } catch (err) {
        notify.error(err, 'Gagal memuat daftar siswa kelas asal');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchSourceStudents();
  }, [selectedSourceClass, selectedSourceAcademicYear]);

  const toggleSourceSelection = (studentId: string) => {
    const next = new Set(checkedSourceIds);
    if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
    setCheckedSourceIds(next);
  };

  const toggleTargetSelection = (studentId: string) => {
    const next = new Set(checkedTargetIds);
    if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
    setCheckedTargetIds(next);
  };

  const moveRight = () => {
    const moving = sourceStudents.filter(s => checkedSourceIds.has(s.id.toString()));
    
    // Check if adding these students exceeds capacity
    if (targetCapacityInfo && targetCapacityInfo.capacity !== null) {
      const futureTotal = targetCapacityInfo.currentCount + promotedStudents.length + moving.length;
      if (futureTotal > targetCapacityInfo.capacity) {
        notify.warning(`Kapasitas Penuh: Memindahkan ${moving.length} siswa akan melebihi kapasitas kelas tujuan (Sisa ruang: ${targetCapacityInfo.capacity - targetCapacityInfo.currentCount - promotedStudents.length})`);
        return;
      }
    }

    const remaining = sourceStudents.filter(s => !checkedSourceIds.has(s.id.toString()));
    
    setPromotedStudents([...promotedStudents, ...moving]);
    setSourceStudents(remaining);
    setCheckedSourceIds(new Set());
  };

  const moveLeft = () => {
    const moving = promotedStudents.filter(s => checkedTargetIds.has(s.id.toString()));
    const remaining = promotedStudents.filter(s => !checkedTargetIds.has(s.id.toString()));
    
    setSourceStudents([...sourceStudents, ...moving]);
    setPromotedStudents(remaining);
    setCheckedTargetIds(new Set());
  };

  const handleBatchPromoteSubmit = () => {
    if (!canPromote) {
      notify.error('Anda tidak memiliki izin untuk memproses kenaikan kelas.');
      return;
    }
    if (!selectedSourceAcademicYear || !selectedSourceSemester || !selectedTargetAcademicYear || !selectedSourceClass || !selectedTargetClass || !selectedTargetSemester) {
      notify.warning('Tahun Ajaran, Semester, dan Rombel Kelas (Asal & Tujuan) harus dipilih lengkap');
      return;
    }

    const studentIds = promotedStudents.map(s => s.id.toString());
    const retainedIds = markRemainingAsRetained ? sourceStudents.map(s => s.id.toString()) : [];

    if (studentIds.length === 0 && retainedIds.length === 0) {
      notify.warning('Pilih setidaknya satu siswa untuk dinaikkan ke kelas tujuan (atau centang opsi tinggal kelas).');
      return;
    }

    const sourceClassName = classes.find(c => c.id.toString() === selectedSourceClass)?.name || 'Kelas Asal';
    const targetClassName = classes.find(c => c.id.toString() === selectedTargetClass)?.name || 'Kelas Tujuan';

    setConfirmConfig({
      open: true,
      variant: 'info',
      title: 'Konfirmasi Pemrosesan Kenaikan Kelas',
      message: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin memproses kenaikan kelas dengan rincian berikut?
          </p>
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-gray-500">Kelas Asal:</span>
              <span className="text-gray-900 font-semibold">{sourceClassName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kelas Tujuan:</span>
              <span className="text-indigo-700 font-semibold">{targetClassName}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5">
              <span className="text-gray-500">Siswa Naik Kelas:</span>
              <span className="text-emerald-600 font-bold">{studentIds.length} Siswa</span>
            </div>
            {markRemainingAsRetained ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Siswa Tinggal Kelas:</span>
                <span className="text-rose-600 font-bold">{retainedIds.length} Siswa</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-500">Siswa Belum Dimutasi:</span>
                <span className="text-gray-700">{sourceStudents.length} Siswa (Tetap di {sourceClassName})</span>
              </div>
            )}
          </div>
        </div>
      ),
      confirmText: 'Ya, Proses Kenaikan',
      onConfirm: async () => {
        const payload = {
          studentIds,
          retainedStudentIds: retainedIds,
          sourceClassroomId: selectedSourceClass,
          targetClassroomId: selectedTargetClass,
          sourceAcademicYearId: selectedSourceAcademicYear,
          targetAcademicYearId: selectedTargetAcademicYear,
          targetSemesterId: selectedTargetSemester,
        };

        try {
          setSubmitting(true);
          const response = await batchPromote(payload);
          
          if (response.failedCount > 0) {
            notify.warning(`Diproses: ${response.promotedCount} naik, ${response.retainedCount} tinggal. Gagal: ${response.failedCount} siswa.`);
          } else {
            notify.success(`Proses kenaikan kelas berhasil! ${response.promotedCount} siswa telah ditempatkan di ${targetClassName}.`);
          }
          
          setConfirmConfig(prev => ({ ...prev, open: false }));
          navigate('/academic/promotions');
        } catch (err: any) {
          notify.error(err, 'Gagal memproses kenaikan kelas');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // Dropdown options
  const sourceAyOptions = useMemo(() => [
    { value: '', label: '-- Pilih Tahun Ajaran --' },
    ...academicYears.map(ay => ({ value: ay.id, label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}` }))
  ], [academicYears]);

  const sourceSemOptions = useMemo(() => [
    { value: '', label: '-- Pilih Semester --' },
    ...semesters
      .filter(sem => !selectedSourceAcademicYear || (sem.academicYearId === selectedSourceAcademicYear || sem.academicYear?.id === selectedSourceAcademicYear))
      .map(sem => ({ value: sem.id, label: `${sem.name}${sem.isActive ? ' (Aktif)' : ''}` }))
  ], [semesters, selectedSourceAcademicYear]);

  const targetAyOptions = useMemo(() => [
    { value: '', label: '-- Pilih Tahun Ajaran --' },
    ...academicYears.map(ay => ({ value: ay.id, label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}` }))
  ], [academicYears]);

  const targetSemOptions = useMemo(() => [
    { value: '', label: '-- Pilih Semester --' },
    ...semesters
      .filter(sem => !selectedTargetAcademicYear || (sem.academicYearId === selectedTargetAcademicYear || sem.academicYear?.id === selectedTargetAcademicYear))
      .map(sem => ({ value: sem.id, label: `${sem.name}${sem.isActive ? ' (Aktif)' : ''}` }))
  ], [semesters, selectedTargetAcademicYear]);

  const classOptions = useMemo(() => [
    { value: '', label: '-- Pilih Kelas --' },
    ...classes.map(c => ({ value: c.id, label: c.name }))
  ], [classes]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header with Back Button */}
      <div>
        <button 
          type="button"
          onClick={() => navigate('/academic/promotions')} 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Kembali ke Riwayat Kenaikan
        </button>
        <PageHeader 
          title="Pemrosesan Kenaikan Kelas (Batch)" 
          subtitle="Pindahkan dan naikkan rombel siswa secara bertahap antar tahun ajaran dan semester"
        />
      </div>

      {/* 2. Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 text-xs md:text-sm text-indigo-900 leading-relaxed">
        <Info size={20} className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          Pindahkan siswa ke panel kanan untuk menaikkan mereka ke <strong>Kelas Tujuan</strong>. Siswa yang dibiarkan di panel kiri <strong>tetap aktif di kelas asal</strong> sehingga dapat dinaikkan ke kelas lain nanti (misal: membagi rombel 1-A ke 2-A dan 2-B), kecuali jika mencentang opsi <em>"Tinggal Kelas"</em>.
        </div>
      </div>

      {/* 3. Toolbar Filters (Asal Siswa & Tujuan Siswa) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asal Siswa */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <Users size={16} className="text-indigo-600" />
              <span>1. Asal Siswa</span>
            </h3>
            <span className="text-xs font-medium text-gray-400">Rombel Aktif Saat Ini</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Tahun Ajaran Asal">
              <Select 
                wrapperClassName="w-full"
                value={selectedSourceAcademicYear} 
                onChange={(e) => handleSourceAcademicYearChange(e.target.value)}
                options={sourceAyOptions}
              />
            </FormField>
            <FormField label="Semester Asal">
              <Select 
                wrapperClassName="w-full"
                value={selectedSourceSemester} 
                onChange={(e) => handleSourceSemesterChange(e.target.value)}
                options={sourceSemOptions}
              />
            </FormField>
            <FormField label="Kelas Asal">
              <Select 
                wrapperClassName="w-full"
                value={selectedSourceClass} 
                onChange={(e) => setSelectedSourceClass(e.target.value)}
                options={classOptions}
              />
            </FormField>
          </div>
        </div>

        {/* Tujuan (Naik Ke) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-emerald-600" />
              <span>2. Tujuan (Naik Ke)</span>
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Progresi Otomatis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Tahun Ajaran Baru">
              <Select 
                wrapperClassName="w-full"
                value={selectedTargetAcademicYear} 
                onChange={(e) => setSelectedTargetAcademicYear(e.target.value)}
                options={targetAyOptions}
              />
            </FormField>
            <FormField label="Semester Baru">
              <Select 
                wrapperClassName="w-full"
                value={selectedTargetSemester} 
                onChange={(e) => setSelectedTargetSemester(e.target.value)}
                options={targetSemOptions}
              />
            </FormField>
            <FormField label="Kelas Tujuan">
              <Select 
                wrapperClassName="w-full"
                value={selectedTargetClass} 
                onChange={(e) => setSelectedTargetClass(e.target.value)}
                options={classOptions}
              />
            </FormField>
          </div>

          {targetYearNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>{targetYearNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Dual-Pane Workspace */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch min-h-[480px]">
        {/* Source Pane (Panel Kiri) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-gray-900 text-sm md:text-base">
                {classes.find(c => c.id === selectedSourceClass)?.name || 'Kelas Asal'}
              </div>
              <div className="text-xs text-gray-500">
                Siswa aktif belum dipindahkan ({sourceStudents.length})
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="text-xs cursor-pointer text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                onClick={() => {
                  const allIds = new Set(sourceStudents.map(s => s.id.toString()));
                  if (checkedSourceIds.size === sourceStudents.length && sourceStudents.length > 0) {
                    setCheckedSourceIds(new Set());
                  } else {
                    setCheckedSourceIds(allIds);
                  }
                }}
              >
                <CheckSquare size={13} />
                <span>{checkedSourceIds.size === sourceStudents.length && sourceStudents.length > 0 ? 'Batal Semua' : 'Pilih Semua'}</span>
              </button>
              <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono">
                {sourceStudents.length}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50/40 min-h-[300px]">
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-xs gap-2">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span>Memuat data siswa kelas asal...</span>
              </div>
            ) : !selectedSourceClass ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-xs text-center">
                <Users size={36} className="opacity-20 mb-2" />
                <span>Pilih Kelas Asal pada panel di atas untuk memuat daftar siswa.</span>
              </div>
            ) : sourceStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-xs text-center">
                <CheckSquare size={36} className="opacity-20 mb-2 text-emerald-600" />
                <span className="font-semibold text-gray-600">Semua siswa sudah dipindahkan.</span>
              </div>
            ) : (
              sourceStudents.map(student => {
                const isSelected = checkedSourceIds.has(student.id.toString());
                return (
                  <div 
                    key={student.id}
                    onClick={() => toggleSourceSelection(student.id.toString())}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer mb-2 ${
                      isSelected 
                        ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' 
                        : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={isSelected}
                      onChange={() => toggleSourceSelection(student.id.toString())}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-xs md:text-sm truncate" title={student.fullName}>
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {student.nis || student.nisn || '-'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transfer Action Buttons */}
        <div className="flex md:flex-col justify-center items-center gap-3 py-2 md:py-0">
          <button 
            type="button"
            className="w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-200" 
            title="Pindahkan siswa terpilih ke Kelas Tujuan" 
            disabled={checkedSourceIds.size === 0 || !selectedTargetClass}
            onClick={moveRight}
          >
            <ChevronRight size={20} />
          </button>
          <button 
            type="button"
            className="w-11 h-11 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs border border-gray-200" 
            title="Kembalikan siswa terpilih ke Kelas Asal" 
            disabled={checkedTargetIds.size === 0}
            onClick={moveLeft}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Target Pane (Panel Kanan) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-emerald-50/50 border-b border-emerald-100 p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-gray-900 text-sm md:text-base">
                {classes.find(c => c.id === selectedTargetClass)?.name || 'Kelas Tujuan'}
              </div>
              <div className="text-xs text-gray-500">
                Siswa yang akan dinaikkan
                {targetCapacityInfo && targetCapacityInfo.capacity !== null && (
                  <span className={`ml-1.5 font-semibold ${(targetCapacityInfo.currentCount + promotedStudents.length) > targetCapacityInfo.capacity ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                    ({targetCapacityInfo.currentCount + promotedStudents.length}/{targetCapacityInfo.capacity})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="text-xs cursor-pointer text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 transition-colors"
                onClick={() => {
                  const allIds = new Set(promotedStudents.map(s => s.id.toString()));
                  if (checkedTargetIds.size === promotedStudents.length && promotedStudents.length > 0) {
                    setCheckedTargetIds(new Set());
                  } else {
                    setCheckedTargetIds(allIds);
                  }
                }}
              >
                <CheckSquare size={13} />
                <span>{checkedTargetIds.size === promotedStudents.length && promotedStudents.length > 0 ? 'Batal Semua' : 'Pilih Semua'}</span>
              </button>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono">
                {promotedStudents.length}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50/40 min-h-[300px]">
            {!selectedTargetClass ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-xs text-center">
                <CheckSquare size={36} className="opacity-20 mb-2" />
                <span>Pilih Kelas Tujuan pada panel di atas.</span>
              </div>
            ) : promotedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-xs text-center">
                <TrendingUp size={36} className="opacity-20 mb-2 text-indigo-600" />
                <span>Gunakan tombol panah untuk memindahkan siswa yang naik kelas ke sini.</span>
              </div>
            ) : (
              promotedStudents.map(student => {
                const isSelected = checkedTargetIds.has(student.id.toString());
                return (
                  <div 
                    key={student.id}
                    onClick={() => toggleTargetSelection(student.id.toString())}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer mb-2 ${
                      isSelected 
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' 
                        : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      checked={isSelected}
                      onChange={() => toggleTargetSelection(student.id.toString())}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-xs md:text-sm truncate" title={student.fullName}>
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                        {student.nis || student.nisn || '-'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Sticky Bottom Action Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-gray-100 sticky bottom-4 z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs md:text-sm font-medium text-gray-700 select-none bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              checked={markRemainingAsRetained}
              onChange={(e) => setMarkRemainingAsRetained(e.target.checked)}
              disabled={sourceStudents.length === 0}
            />
            <span>Tandai sisa siswa ({sourceStudents.length}) sebagai <strong>Tinggal Kelas</strong></span>
          </label>
          <div className="text-xs text-gray-500">
            {markRemainingAsRetained ? (
              <span className="text-amber-600 font-medium">Sisa siswa akan berstatus tinggal kelas di tahun ajaran baru.</span>
            ) : (
              <span>Sisa siswa tetap aktif dan dapat dinaikkan ke rombel lain secara bertahap.</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            type="button"
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/academic/promotions')}
          >
            Batal
          </button>
          <button 
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleBatchPromoteSubmit}
            disabled={!canPromote || (promotedStudents.length === 0 && (!markRemainingAsRetained || sourceStudents.length === 0)) || submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                <span>Simpan Kenaikan ({promotedStudents.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. ConfirmDialog */}
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
