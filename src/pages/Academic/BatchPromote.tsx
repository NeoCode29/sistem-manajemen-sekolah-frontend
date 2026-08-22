import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchPromote } from '../../api/promotionService';
import { getAcademicYears, getClassrooms, getSemesters, getClassroomCapacity } from '../../api/academicService';
import type { AcademicYear, Classroom as ClassType, Semester } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { TrendingUp, AlertTriangle, ChevronRight, ChevronLeft, ArrowLeft, CheckSquare } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';
import './BatchPromote.css';

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
          enrollmentStatus: 'ENROLLED' 
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
    
    showConfirm(`Siswa Naik Kelas: ${studentIds.length} orang\nSiswa Tinggal Kelas: ${retainedIds.length} orang\n\nLanjutkan proses?`, async () => {
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
        showAlert(err.response?.data?.message || 'Gagal memproses kenaikan kelas', 'Gagal');
      }
    });
  };

  return (
    <div className="bp-container">
      <div className="bp-header">
        <div className="bp-header-top" onClick={() => navigate('/academic/promotions')}>
          <ArrowLeft size={16} /> Kembali ke Riwayat
        </div>
        <h1>
          <TrendingUp size={24} color="var(--bp-secondary)" />
          Pemrosesan Kenaikan Kelas (Batch)
        </h1>
        <p>Pindahkan siswa dari kelas asal ke kelas tujuan. Siswa yang tidak dipindahkan akan berstatus tinggal kelas.</p>
      </div>

      <div className="bp-info-banner">
        <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          Siswa yang dipindahkan ke panel kanan akan <strong>NAIK KELAS</strong> ke Kelas Tujuan. Siswa yang dibiarkan di panel kiri akan berstatus <strong>TINGGAL KELAS</strong> dan didaftarkan kembali ke Kelas Asal pada Tahun Ajaran Baru.
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bp-toolbar">
        <div className="bp-filter-group">
          <h3 style={{ color: 'var(--bp-secondary)' }}>
            <TrendingUp size={16} /> Asal Siswa
          </h3>
          <div className="bp-filter-row">
            <div className="bp-input-group">
              <label>Tahun Ajaran</label>
              <select
                value={selectedSourceAcademicYear}
                onChange={(e) => setSelectedSourceAcademicYear(e.target.value)}
              >
                <option value="">-- Pilih --</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </div>
            <div className="bp-input-group">
              <label>Pilih Kelas Asal</label>
              <select
                value={selectedSourceClass}
                onChange={(e) => handleSourceClassChange(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bp-filter-group">
          <h3 style={{ color: 'var(--bp-primary)' }}>
            <CheckSquare size={16} /> Tujuan (Naik Ke)
          </h3>
          <div className="bp-filter-row">
            <div className="bp-input-group">
              <label>Tahun Ajaran Baru</label>
              <select
                value={selectedTargetAcademicYear}
                onChange={(e) => setSelectedTargetAcademicYear(e.target.value)}
              >
                <option value="">-- Pilih --</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </div>
            <div className="bp-input-group">
              <label>Semester Baru</label>
              <select
                value={selectedTargetSemester}
                onChange={(e) => setSelectedTargetSemester(e.target.value)}
              >
                <option value="">-- Pilih --</option>
                {semesters
                  .filter(sem => !selectedTargetAcademicYear || sem.academicYearId === selectedTargetAcademicYear)
                  .map(sem => <option key={sem.id} value={sem.id}>{sem.name} ({sem.academicYear?.name || ''})</option>)}
              </select>
            </div>
            <div className="bp-input-group">
              <label>Kelas Tujuan</label>
              <select
                value={selectedTargetClass}
                onChange={(e) => setSelectedTargetClass(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Pane Workspace */}
      <div className="bp-workspace">
        {/* Source Pane */}
        <div className="bp-pane">
          <div className="bp-pane-header source">
            <div>
              <div className="bp-pane-title">
                {classes.find(c => c.id === selectedSourceClass)?.name || 'Kelas Asal'}
              </div>
              <div className="bp-pane-subtitle">Siswa belum diproses (Tetap tinggal)</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--bp-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
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
              <div className="bp-student-count">{sourceStudents.length}</div>
            </div>
          </div>
          
          <div className="bp-student-list">
            {!selectedSourceClass ? (
              <div className="bp-empty-state">
                <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                Pilih Kelas Asal terlebih dahulu.
              </div>
            ) : sourceStudents.length === 0 ? (
              <div className="bp-empty-state">
                <CheckSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
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
                    className={`bp-student-item ${isSelected ? 'selected' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      className="bp-student-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSourceSelection(student.id.toString())}
                    />
                    <div className="bp-student-info">
                      <div className="bp-student-name">{student.fullName}</div>
                      <div className="bp-student-nis">{student.nis || '-'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bp-actions-area">
          <button 
            className="bp-btn-move" 
            title="Pindahkan ke Kelas Tujuan" 
            disabled={checkedSourceIds.size === 0 || !selectedTargetClass}
            onClick={moveRight}
          >
            <ChevronRight size={24} />
          </button>
          <button 
            className="bp-btn-move danger" 
            title="Kembalikan ke Kelas Asal" 
            disabled={checkedTargetIds.size === 0}
            onClick={moveLeft}
            style={checkedTargetIds.size > 0 ? { color: 'var(--bp-danger)' } : {}}
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Target Pane */}
        <div className="bp-pane">
          <div className="bp-pane-header target">
            <div>
              <div className="bp-pane-title">
                {classes.find(c => c.id === selectedTargetClass)?.name || 'Kelas Tujuan'}
              </div>
              <div className="bp-pane-subtitle">
                Siswa yang akan naik kelas 
                {targetCapacityInfo && targetCapacityInfo.capacity !== null && (
                  <span style={{ 
                    marginLeft: '8px', 
                    color: (targetCapacityInfo.currentCount + promotedStudents.length) > targetCapacityInfo.capacity ? 'var(--bp-danger)' : 'var(--bp-text-muted)',
                    fontWeight: (targetCapacityInfo.currentCount + promotedStudents.length) > targetCapacityInfo.capacity ? 'bold' : 'normal'
                  }}>
                    (Kapasitas: {targetCapacityInfo.currentCount + promotedStudents.length}/{targetCapacityInfo.capacity})
                  </span>
                )}
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--bp-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
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
              <div className="bp-student-count">{promotedStudents.length}</div>
            </div>
          </div>
          
          <div className="bp-student-list">
            {!selectedTargetClass ? (
              <div className="bp-empty-state">
                <CheckSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                Pilih Kelas Tujuan terlebih dahulu.
              </div>
            ) : promotedStudents.length === 0 ? (
              <div className="bp-empty-state">
                <ChevronRight size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
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
                    className={`bp-student-item moved ${isSelected ? 'selected' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      className="bp-student-checkbox"
                      checked={isSelected}
                      onChange={() => toggleTargetSelection(student.id.toString())}
                    />
                    <div className="bp-student-info">
                      <div className="bp-student-name">{student.fullName}</div>
                      <div className="bp-student-nis">{student.nis || '-'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Action Bar Bottom */}
      <div className="bp-action-bar">
        <div className="bp-action-summary">
          Total <strong>{sourceStudents.length + promotedStudents.length}</strong> siswa siap diproses.
        </div>
        <div className="bp-action-buttons">
          <button className="bp-btn bp-btn-outline" onClick={() => navigate('/academic/promotions')}>Batal</button>
          <button 
            className="bp-btn bp-btn-primary" 
            onClick={handleBatchPromoteSubmit}
            disabled={sourceStudents.length === 0 && promotedStudents.length === 0}
          >
            <TrendingUp size={16} />
            Simpan Data Kenaikan
          </button>
        </div>
      </div>
    </div>
  );
};
