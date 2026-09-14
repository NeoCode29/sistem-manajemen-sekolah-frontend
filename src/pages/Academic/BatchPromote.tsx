import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchPromote } from '../../api/promotionService';
import { getAcademicYears, getClassrooms, getSemesters, getClassroomCapacity } from '../../api/academicService';
import type { AcademicYear, Classroom as ClassType, Semester } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { TrendingUp, AlertTriangle, ChevronRight, ChevronLeft, ArrowLeft, CheckSquare } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { FormField } from '../../components/ui/FormField';
import { usePermissions } from '../../hooks/usePermissions';

export const BatchPromote: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canPromote = hasPermission('promotions.execute') || hasPermission('academic.write');
  const [, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();

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
  
  // Capacity State
  const [targetCapacityInfo, setTargetCapacityInfo] = useState<{capacity: number | null, currentCount: number, remaining: number | null} | null>(null);

  // Retain unpromoted option
  const [markRemainingAsRetained, setMarkRemainingAsRetained] = useState(false);

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
          s.academicYearId.toString() === sourceAy.id.toString() &&
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
            s.academicYearId.toString() === nextAy.id.toString() &&
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
          (s) => s.academicYearId.toString() === activeAy.id.toString(),
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
      console.error('Failed to load dropdowns');
    }
  };

  const handleSourceAcademicYearChange = (yearId: string) => {
    setSelectedSourceAcademicYear(yearId);
    const yearSemesters = semesters.filter(
      (s) => s.academicYearId.toString() === yearId.toString(),
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

  const handleSourceClassChange = (classId: string) => {
    setSelectedSourceClass(classId);
  };

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
        setError('Gagal memuat daftar siswa');
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
        showAlert(`Gagal: Memindahkan ${moving.length} siswa akan melebihi kapasitas kelas tujuan (Sisa ruang: ${targetCapacityInfo.capacity - targetCapacityInfo.currentCount - promotedStudents.length})`, 'Peringatan');
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

  const handleBatchPromoteSubmit = async () => {
    if (!selectedSourceAcademicYear || !selectedSourceSemester || !selectedTargetAcademicYear || !selectedSourceClass || !selectedTargetClass || !selectedTargetSemester) {
      showAlert('Tahun Ajaran, Semester, dan Kelas (Asal & Tujuan) harus dipilih lengkap!', 'Peringatan');
      return;
    }

    const studentIds = promotedStudents.map(s => s.id.toString());
    const retainedIds = markRemainingAsRetained ? sourceStudents.map(s => s.id.toString()) : [];

    if (studentIds.length === 0 && retainedIds.length === 0) {
      showAlert('Pilih setidaknya satu siswa untuk dinaikkan ke kelas tujuan (atau centang opsi tinggal kelas).', 'Peringatan');
      return;
    }

    const sourceClassName = classes.find(c => c.id.toString() === selectedSourceClass)?.name || 'Kelas Asal';
    const targetClassName = classes.find(c => c.id.toString() === selectedTargetClass)?.name || 'Kelas Tujuan';

    let confirmMsg = `Siswa Naik Kelas (ke ${targetClassName}): ${studentIds.length} orang\n`;
    if (markRemainingAsRetained) {
      confirmMsg += `Siswa Tinggal Kelas: ${retainedIds.length} orang\n`;
    } else {
      confirmMsg += `Siswa Belum Diproses (Tetap di ${sourceClassName}): ${sourceStudents.length} orang\n`;
    }
    confirmMsg += `\nLanjutkan proses kenaikan kelas?`;

    showConfirm(confirmMsg, async () => {
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
        const response = await batchPromote(payload);
        
        if (response.failedCount > 0) {
          showAlert(`Diproses: ${response.promotedCount} naik, ${response.retainedCount} tinggal. Gagal: ${response.failedCount} siswa.`, 'Peringatan');
        } else {
          showAlert('Proses kenaikan kelas berhasil disimpan.', 'Berhasil', 'success');
        }
        
        // Navigate back after success
        navigate('/academic/promotions');
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal memproses kenaikan kelas', 'Gagal', 'error');
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter pb-6">
      <div className="mb-6">
        <button onClick={() => navigate('/academic/promotions')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium text-sm mb-4">
          <ArrowLeft size={16} /> Kembali ke Riwayat
        </button>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <TrendingUp size={28} className="text-indigo-600" />
          Pemrosesan Kenaikan Kelas (Batch)
        </h1>
        <p className="text-gray-500 mt-2">Pindahkan siswa dari kelas asal ke kelas tujuan. Rombel dapat dibagi ke beberapa kelas tujuan secara bertahap.</p>
      </div>

      <div className="bg-indigo-50/80 text-indigo-950 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 mb-6 text-sm leading-relaxed">
        <TrendingUp size={20} className="flex-shrink-0 mt-0.5 text-indigo-600" />
        <div>
          Pindahkan siswa ke panel kanan untuk menaikkan mereka ke <strong>Kelas Tujuan</strong>. Siswa yang dibiarkan di panel kiri <strong>tetap aktif di kelas asal</strong> sehingga dapat dinaikkan ke kelas lain nanti (misalnya membagi rombel 1-A ke 2-A dan 2-B), kecuali jika Anda mencentang opsi <em>"Tinggal Kelas"</em> di bagian bawah.
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <TrendingUp size={18} className="text-indigo-500" /> Asal Siswa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tahun Ajaran Asal">
              <select className="input-std w-full" value={selectedSourceAcademicYear} onChange={(e) => handleSourceAcademicYearChange(e.target.value)}>
                <option value="">-- Pilih --</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name} {ay.isActive ? '(Aktif)' : ''}</option>)}
              </select>
            </FormField>
            <FormField label="Semester Asal">
              <select className="input-std w-full" value={selectedSourceSemester} onChange={(e) => handleSourceSemesterChange(e.target.value)}>
                <option value="">-- Pilih --</option>
                {semesters
                  .filter(sem => !selectedSourceAcademicYear || sem.academicYearId === selectedSourceAcademicYear)
                  .map(sem => <option key={sem.id} value={sem.id}>{sem.name} {sem.isActive ? '(Aktif)' : ''}</option>)}
              </select>
            </FormField>
            <FormField label="Kelas Asal">
              <select className="input-std w-full" value={selectedSourceClass} onChange={(e) => handleSourceClassChange(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-500" /> Tujuan (Naik Ke)
            </h3>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Progresi Otomatis
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tahun Ajaran Baru">
              <select className="input-std w-full" value={selectedTargetAcademicYear} onChange={(e) => setSelectedTargetAcademicYear(e.target.value)}>
                <option value="">-- Pilih --</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name} {ay.isActive ? '(Aktif)' : ''}</option>)}
              </select>
            </FormField>
            <FormField label="Semester Baru">
              <select className="input-std w-full" value={selectedTargetSemester} onChange={(e) => setSelectedTargetSemester(e.target.value)}>
                <option value="">-- Pilih --</option>
                {semesters
                  .filter(sem => !selectedTargetAcademicYear || sem.academicYearId === selectedTargetAcademicYear)
                  .map(sem => <option key={sem.id} value={sem.id}>{sem.name} ({sem.academicYear?.name || ''})</option>)}
              </select>
            </FormField>
            <FormField label="Kelas Tujuan">
              <select className="input-std w-full" value={selectedTargetClass} onChange={(e) => setSelectedTargetClass(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
          {targetYearNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>{targetYearNotice} Silakan buat tahun ajaran tersebut di menu <strong>Master Data &gt; Tahun Ajaran</strong> terlebih dahulu.</span>
            </div>
          )}
        </div>
      </div>

      {/* Dual Pane Workspace */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch mb-8 min-h-[500px]">
        {/* Source Pane */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden w-full md:w-[45%]">
          <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-gray-900 text-lg">
                {classes.find(c => c.id === selectedSourceClass)?.name || 'Kelas Asal'}
              </div>
              <div className="text-sm text-gray-500">Siswa aktif belum dipromosikan ({sourceStudents.length})</div>
            </div>
            <div className="flex items-center gap-4">
              <div 
                className="text-xs cursor-pointer text-gray-500 hover:text-indigo-600 font-medium flex items-center gap-1.5 transition-colors"
                onClick={() => {
                  const allIds = new Set(sourceStudents.map(s => s.id.toString()));
                  if (checkedSourceIds.size === sourceStudents.length && sourceStudents.length > 0) {
                    setCheckedSourceIds(new Set());
                  } else {
                    setCheckedSourceIds(allIds);
                  }
                }}>
                <CheckSquare size={14} /> Pilih Semua
              </div>
              <div className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold">{sourceStudents.length}</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
            {!selectedSourceClass ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 text-sm">
                <TrendingUp size={48} className="opacity-20 mb-4" />
                Pilih Kelas Asal terlebih dahulu.
              </div>
            ) : sourceStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 text-sm">
                <CheckSquare size={48} className="opacity-20 mb-4" />
                Semua siswa sudah dipindahkan.
              </div>
            ) : (
              sourceStudents.map(student => {
                const isSelected = checkedSourceIds.has(student.id.toString());
                return (
                  <div 
                    key={student.id}
                    onClick={(e) => {
                      if ((e.target as any).tagName !== 'INPUT') {
                        toggleSourceSelection(student.id.toString());
                      }
                    }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors cursor-pointer mb-2 ${isSelected ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={isSelected}
                      onChange={() => toggleSourceSelection(student.id.toString())}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{student.fullName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{student.nis || '-'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex md:flex-col justify-center gap-4 py-4 md:py-0 w-full md:w-auto">
          <button 
            className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border border-indigo-100" 
            title="Pindahkan ke Kelas Tujuan" 
            disabled={checkedSourceIds.size === 0 || !selectedTargetClass}
            onClick={moveRight}
          >
            <ChevronRight size={24} className="ml-0.5" />
          </button>
          <button 
            className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border border-red-100" 
            title="Kembalikan ke Kelas Asal" 
            disabled={checkedTargetIds.size === 0}
            onClick={moveLeft}
          >
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
        </div>

        {/* Target Pane */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden w-full md:w-[45%]">
          <div className="bg-emerald-50/50 border-b border-emerald-100 p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-gray-900 text-lg">
                {classes.find(c => c.id === selectedTargetClass)?.name || 'Kelas Tujuan'}
              </div>
              <div className="text-sm text-gray-500">
                Siswa yang akan naik kelas 
                {targetCapacityInfo && targetCapacityInfo.capacity !== null && (
                  <span className={`ml-2 ${(targetCapacityInfo.currentCount + promotedStudents.length) > targetCapacityInfo.capacity ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    (Kapasitas: {targetCapacityInfo.currentCount + promotedStudents.length}/{targetCapacityInfo.capacity})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div 
                className="text-xs cursor-pointer text-gray-500 hover:text-emerald-600 font-medium flex items-center gap-1.5 transition-colors"
                onClick={() => {
                  const allIds = new Set(promotedStudents.map(s => s.id.toString()));
                  if (checkedTargetIds.size === promotedStudents.length && promotedStudents.length > 0) {
                    setCheckedTargetIds(new Set());
                  } else {
                    setCheckedTargetIds(allIds);
                  }
                }}>
                <CheckSquare size={14} /> Pilih Semua
              </div>
              <div className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold">{promotedStudents.length}</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
            {!selectedTargetClass ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 text-sm">
                <CheckSquare size={48} className="opacity-20 mb-4" />
                Pilih Kelas Tujuan terlebih dahulu.
              </div>
            ) : promotedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 text-sm">
                <TrendingUp size={48} className="opacity-20 mb-4" />
                Gunakan tombol panah untuk memindahkan siswa yang naik kelas ke sini.
              </div>
            ) : (
              promotedStudents.map(student => {
                const isSelected = checkedTargetIds.has(student.id.toString());
                return (
                  <div 
                    key={student.id}
                    onClick={(e) => {
                      if ((e.target as any).tagName !== 'INPUT') {
                        toggleTargetSelection(student.id.toString());
                      }
                    }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors cursor-pointer mb-2 ${isSelected ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      checked={isSelected}
                      onChange={() => toggleTargetSelection(student.id.toString())}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{student.fullName}</div>
                      <div className="text-xs text-emerald-700 mt-0.5 font-medium">{student.nis || '-'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Action Bar Bottom */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] z-20 sticky bottom-6 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-700 select-none bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
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
              <span>Sisa siswa tetap aktif dan dapat dinaikkan ke rombel lain (misal: 2-B).</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button className="btn-std-secondary" onClick={() => navigate('/academic/promotions')}>Batal</button>
          <button 
            className="btn-std-primary" 
            onClick={handleBatchPromoteSubmit}
            disabled={!canPromote || (promotedStudents.length === 0 && (!markRemainingAsRetained || sourceStudents.length === 0))}
            title={!canPromote ? 'Anda tidak memiliki hak akses untuk memproses kenaikan kelas' : undefined}
          >
            <TrendingUp size={18} />
            Simpan Kenaikan ({promotedStudents.length})
          </button>
        </div>
      </div>
    </div>
  );
};
