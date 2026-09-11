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
import { getErrorMessage } from '../../utils/errorHandler';

export const BatchPromote: React.FC = () => {
  const navigate = useNavigate();
  const [, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();

  // Dropdown Data State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  // Selection State
  const [selectedSourceAcademicYear, setSelectedSourceAcademicYear] = useState('');
  const [selectedTargetAcademicYear, setSelectedTargetAcademicYear] = useState('');
  const [selectedSourceClass, setSelectedSourceClass] = useState('');
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [selectedTargetSemester, setSelectedTargetSemester] = useState('');
  
  // Dual-Pane State
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  const [checkedSourceIds, setCheckedSourceIds] = useState<Set<string>>(new Set());
  const [promotedStudents, setPromotedStudents] = useState<Student[]>([]);
  const [checkedTargetIds, setCheckedTargetIds] = useState<Set<string>>(new Set());
  
  // Capacity State
  const [targetCapacityInfo, setTargetCapacityInfo] = useState<{capacity: number | null, currentCount: number, remaining: number | null} | null>(null);

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

  const fetchDropdowns = async () => {
    try {
      const [ayData, classData, semData] = await Promise.all([
        getAcademicYears(),
        getClassrooms(),
        getSemesters()
      ]);
      setAcademicYears(ayData);
      setClasses(classData);
      setSemesters(semData);
      
      const activeAy = ayData.find(ay => ay.isActive);
      if (activeAy) {
        setSelectedTargetAcademicYear(activeAy.id.toString());
        // For source, try to pick the previous year
        const previousAy = ayData.find(ay => Number(ay.id) < Number(activeAy.id));
        if (previousAy) {
          setSelectedSourceAcademicYear(previousAy.id.toString());
        } else {
          setSelectedSourceAcademicYear(activeAy.id.toString());
        }
      }

      const activeSem = semData.find(s => s.isActive);
      if (activeSem) setSelectedTargetSemester(activeSem.id.toString());
    } catch (err) {
      console.error('Failed to load dropdowns');
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
        const students = await getStudents({ 
          classroomId: selectedSourceClass, 
          academicYearId: selectedSourceAcademicYear,
          status: 'ACTIVE',
          limit: 1000
        });
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
    if (!selectedSourceAcademicYear || !selectedTargetAcademicYear || !selectedSourceClass || !selectedTargetClass || !selectedTargetSemester) {
      showAlert('Tahun Ajaran, Kelas, dan Semester (Asal & Tujuan) harus dipilih lengkap!', 'Peringatan');
      return;
    }
    
    // We allow same academic year for semester transitions (e.g. Ganjil to Genap)
    // The backend will handle the enrollment updates.

    if (sourceStudents.length === 0 && promotedStudents.length === 0) {
      showAlert('Tidak ada siswa untuk diproses.', 'Peringatan');
      return;
    }

    const studentIds = promotedStudents.map(s => s.id.toString());
    const retainedIds = sourceStudents.map(s => s.id.toString());
    
    showConfirm(`Siswa Naik Kelas: ${studentIds.length} orang\nSiswa Tinggal Kelas: ${retainedIds.length} orang\n\nApakah Anda yakin ingin melanjutkan proses kenaikan kelas ini?`, async () => {
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
          showAlert('Proses berhasil untuk semua siswa.', 'Berhasil');
        }
        
        // Navigate back after success
        navigate('/academic/promotions');
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal memproses kenaikan kelas batch.'), 'Gagal');
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
        <p className="text-gray-500 mt-2">Pindahkan siswa dari kelas asal ke kelas tujuan. Siswa yang tidak dipindahkan akan berstatus tinggal kelas.</p>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 flex items-start gap-3 mb-6 text-sm leading-relaxed">
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-blue-600" />
        <div>
          Siswa yang dipindahkan ke panel kanan akan <strong>NAIK KELAS</strong> ke Kelas Tujuan. Siswa yang dibiarkan di panel kiri akan berstatus <strong>TINGGAL KELAS</strong> dan didaftarkan kembali ke Kelas Asal pada Tahun Ajaran Baru.
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <TrendingUp size={18} className="text-indigo-500" /> Asal Siswa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tahun Ajaran Asal">
              <select className="input-std w-full" value={selectedSourceAcademicYear} onChange={(e) => setSelectedSourceAcademicYear(e.target.value)}>
                <option value="">-- Pilih --</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
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
          <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <CheckSquare size={18} className="text-emerald-500" /> Tujuan (Naik Ke)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tahun Ajaran Baru">
              <select className="input-std w-full" value={selectedTargetAcademicYear} onChange={(e) => setSelectedTargetAcademicYear(e.target.value)}>
                <option value="">-- Pilih --</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
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
              <div className="text-sm text-gray-500">Siswa belum diproses (Tetap tinggal)</div>
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
              <div className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold">{promotedStudents.length}</div>
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
                <ChevronRight size={48} className="opacity-20 mb-4" />
                Belum ada siswa yang dipindahkan.
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
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors cursor-pointer mb-2 ${isSelected ? 'bg-red-50/50 border-red-200' : 'bg-emerald-50 border-emerald-200 shadow-sm'}`}
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
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] z-20 sticky bottom-6 mt-6">
        <div className="text-gray-600">
          Total <strong className="text-gray-900">{sourceStudents.length + promotedStudents.length}</strong> siswa siap diproses.
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-std-secondary" onClick={() => navigate('/academic/promotions')}>Batal</button>
          <button 
            className="btn-std-primary" 
            onClick={handleBatchPromoteSubmit}
            disabled={sourceStudents.length === 0 && promotedStudents.length === 0}
          >
            <TrendingUp size={18} />
            Simpan Data Kenaikan
          </button>
        </div>
      </div>
    </div>
  );
};
