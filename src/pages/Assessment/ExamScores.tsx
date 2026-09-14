import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getExamById, 
  getExamScores, 
  upsertExamScoresBatch, 
  getAssessmentLockStatus,
  type Exam, 
  type ExamScore,
  type AssessmentLockStatus
} from '../../api/assessmentService';
import { getStudents } from '../../api/studentService';
import { getSubjectAssignments, type SubjectAssignment } from '../../api/schedulingService';
import { Save, ArrowLeft, Award, Users, BookOpen, Calendar, CheckCircle2, AlertCircle, Lock, AlertTriangle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';

interface ScoreRow {
  studentId: string;
  studentName: string;
  nis: string;
  score: number | string;
  notes: string;
}

export const ExamScores: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canInputScore = hasPermission('assessments.input') || hasPermission('assessment.write');
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah') ?? false;

  const [exam, setExam] = useState<Exam | null>(null);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [lockStatus, setLockStatus] = useState<AssessmentLockStatus | null>(null);
  const [assignedTeacher, setAssignedTeacher] = useState<any>(null);
  const [isAssignedTeacher, setIsAssignedTeacher] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isTeacherOrAdmin = isSuperAdmin || isAssignedTeacher;
  const isLocked = lockStatus?.isLocked ?? false;
  const isReadOnly = isLocked || !canInputScore || !isTeacherOrAdmin;

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch Exam info
      const examData = await getExamById(examId!);
      setExam(examData);
      
      // 2. Fetch Students in that classroom, existing scores, lock status, and subject assignments
      const [studentsData, scoresData, lockData, assignmentsData] = await Promise.all([
        getStudents({ 
          classroomId: examData.classroomId, 
          academicYearId: examData.academicYearId,
          semesterId: examData.semesterId,
          limit: 1000
        }),
        getExamScores(examId!),
        getAssessmentLockStatus({
          classroomId: examData.classroomId,
          subjectId: examData.subjectId,
          academicYearId: examData.academicYearId,
          semesterId: examData.semesterId
        }).catch(() => null),
        examData.classroomId 
          ? getSubjectAssignments(examData.classroomId).catch(() => [] as SubjectAssignment[])
          : Promise.resolve([] as SubjectAssignment[])
      ]);
      
      setLockStatus(lockData);

      // Determine assigned teacher
      const matchingAssignment = assignmentsData.find(
        a => a.subjectId === examData.subjectId &&
             (!examData.academicYearId || a.academicYearId === examData.academicYearId) &&
             (!examData.semesterId || a.semesterId === examData.semesterId)
      ) || assignmentsData.find(a => a.subjectId === examData.subjectId);

      const teacher = matchingAssignment?.employee || examData.employee;
      setAssignedTeacher(teacher);

      const assignedEmployeeId = matchingAssignment?.employeeId || examData.employeeId;
      const isTeacher = Boolean(
        user?.employeeId && assignedEmployeeId && String(assignedEmployeeId) === String(user.employeeId)
      );
      setIsAssignedTeacher(isTeacher);
      
      const scoreMap = new Map<string, ExamScore>();
      scoresData.forEach(s => scoreMap.set(s.studentId, s));
      
      const newRows = studentsData.map(student => {
        const existingScore = scoreMap.get(student.id);
        return {
          studentId: student.id,
          studentName: student.fullName,
          nis: student.nis,
          score: existingScore ? existingScore.score : '',
          notes: existingScore?.notes || ''
        };
      });
      
      setRows(newRows);
    } catch (err: any) {
      setError('Gagal memuat data ujian atau daftar siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof ScoreRow, value: string) => {
    if (isReadOnly) return;
    const updatedRows = [...rows];
    
    if (field === 'score') {
      // Allow empty string or valid number <= maxScore
      if (value === '') {
        updatedRows[index].score = '';
      } else {
        const num = Number(value);
        if (!isNaN(num) && num >= 0 && (exam ? num <= exam.maxScore : true)) {
          updatedRows[index].score = num;
        }
      }
    } else {
      updatedRows[index] = { ...updatedRows[index], [field]: value };
    }
    
    setRows(updatedRows);
  };

  const handleSave = async () => {
    if (!examId || isReadOnly) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Only send rows that have a score inputted
      const validScores = rows
        .filter(r => r.score !== '')
        .map(r => ({
          studentId: r.studentId,
          score: Number(r.score),
          notes: r.notes || undefined
        }));
      
      await upsertExamScoresBatch(examId, validScores);
      setSuccess('Nilai berhasil disimpan secara permanen!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>Memuat data penilaian...</span>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 text-center" style={{ padding: '6rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="text-red-500 mb-4 font-bold text-xl">Agenda Penilaian tidak ditemukan.</div>
        <button className="btn-std-secondary" onClick={() => navigate('/assessment/exams')} style={{ padding: '0.75rem 2rem' }}>Kembali ke Daftar Agenda</button>
      </div>
    );
  }

  const totalStudents = rows.length;
  const completedCount = rows.filter(r => r.score !== '' && r.score !== null && r.score !== undefined).length;
  const missingCount = totalStudents - completedCount;

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8" style={{ marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button 
              onClick={() => navigate('/assessment/exams')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '0.35rem 0.75rem', borderRadius: '99px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c7d2fe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
            >
              <ArrowLeft size={14} /> Daftar Agenda
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>/</span>
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Input Nilai</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontSize: '2rem' }}>{exam.title}</h1>
            {isReadOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <Lock size={13} /> {isLocked ? 'Terkunci' : (!isTeacherOrAdmin ? 'Bukan Pengampu (Hanya-Baca)' : 'Hanya-Baca')}
              </span>
            )}
          </div>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
            {isLocked
              ? 'Agenda penilaian telah divalidasi/disahkan. Formulir dalam mode hanya-baca.'
              : !isTeacherOrAdmin
              ? `Mata pelajaran ini diampu oleh ${assignedTeacher?.fullName || 'Guru Pengampu lain'}. Anda berada dalam mode hanya-baca.`
              : !canInputScore
              ? 'Anda tidak memiliki hak akses untuk mengubah nilai.'
              : 'Masukkan skor pencapaian siswa untuk agenda ini.'}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-std-primary" 
            onClick={handleSave}
            disabled={saving || rows.length === 0 || isReadOnly}
            style={{ 
              padding: '0.875rem 1.75rem', 
              borderRadius: '12px', 
              fontSize: '0.95rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              opacity: (saving || rows.length === 0 || isReadOnly) ? 0.6 : 1,
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              backgroundColor: isReadOnly ? '#94a3b8' : undefined
            }}
            title={isReadOnly ? (isLocked ? 'Agenda terkunci karena sudah divalidasi atau disahkan' : (!isTeacherOrAdmin ? `Hanya Guru Pengampu (${assignedTeacher?.fullName || 'Guru Pengampu'}) yang dapat menginput nilai` : 'Anda tidak memiliki hak akses untuk menginput nilai')) : undefined}
          >
            {isReadOnly ? (
              <>
                <Lock size={18} />
                {!canInputScore ? 'Hanya-Baca (Tidak Ada Izin)' : (!isTeacherOrAdmin ? 'Hanya-Baca (Bukan Pengampu)' : 'Terkunci (Hanya-Baca)')}
              </>
            ) : (
              <>
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Teacher Ownership Notice if not assigned teacher */}
      {!isSuperAdmin && !isAssignedTeacher && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Mode Hanya-Baca: Bukan Guru Pengampu</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Mata pelajaran ini diampu oleh <strong>{assignedTeacher?.fullName || 'Guru Pengampu lain'}</strong>. Hanya guru pengampu yang berwenang untuk menginput atau mengubah nilai siswa.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 shrink-0">
            Read Only
          </span>
        </div>
      )}

      {/* Lock Banner if locked */}
      {isLocked && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 text-sm sm:text-base">Penilaian Terkunci (Mode Hanya-Baca)</h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {lockStatus?.validation?.status === 'VALIDATED' && (
                  <span>Divalidasi oleh Wali Kelas ({lockStatus.validation.validatedBy?.fullName || 'Wali Kelas'}). </span>
                )}
                {lockStatus?.approval?.status === 'APPROVED' && (
                  <span>Disahkan oleh Kepala Sekolah ({lockStatus.approval.approvedBy?.fullName || 'Kepala Sekolah'}). </span>
                )}
                Nilai agenda ini tidak dapat diedit kecuali dibuka revisi dari daftar agenda penilaian oleh pihak yang berwenang.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 shrink-0">
            Read Only
          </span>
        </div>
      )}

      {error && (
        <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert flex items-center gap-3" style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '1.5rem', fontWeight: 500 }}>
          <CheckCircle2 size={20} className="text-emerald-500" />
          {success}
        </div>
      )}

      {/* Modern Info Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Mata Pelajaran</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem' }}>{exam.subject?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Pengampu: <strong style={{ color: '#334155' }}>{assignedTeacher?.fullName || 'Belum Ditugaskan'}</strong>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Kelas</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem' }}>{exam.classroom?.name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Jenis & Tanggal</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem' }}>{exam.examType} &bull; {new Date(exam.examDate).toLocaleDateString('id-ID')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Skor Maksimal</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginTop: '0.15rem' }}>{exam.maxScore}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Siswa</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Data nilai yang belum disimpan tidak akan hilang saat Anda mengubah angka di baris lain.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
              <span>Total:</span>
              <strong style={{ color: '#0f172a' }}>{totalStudents} Siswa</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ecfdf5', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#065f46' }}>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Dinilai:</span>
              <strong style={{ color: '#065f46' }}>{completedCount}</strong>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              backgroundColor: missingCount > 0 ? '#fffbeb' : '#f8fafc', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '10px', 
              border: missingCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0', 
              fontSize: '0.8rem', 
              color: missingCount > 0 ? '#92400e' : '#64748b' 
            }}>
              {missingCount > 0 && <AlertTriangle size={14} className="text-amber-600" />}
              <span>Belum Dinilai:</span>
              <strong style={{ color: missingCount > 0 ? '#b45309' : '#64748b' }}>{missingCount}</strong>
            </div>
          </div>
        </div>

        {/* Missing score notice banner */}
        {missingCount > 0 && (
          <div style={{ margin: '1rem 2rem', padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: '#92400e' }}>
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Terdapat <strong>{missingCount} siswa</strong> yang belum memiliki nilai. Siswa yang belum dinilai ditandai dengan label kuning di bawah.
            </span>
          </div>
        )}
        
        {rows.length === 0 ? (
          <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>Belum ada siswa yang terdaftar di kelas ini.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px', textAlign: 'center' }}>No</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>NIS</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Lengkap Siswa</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '170px', textAlign: 'center' }}>Skor (Max: {exam.maxScore})</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '300px' }}>Catatan Khusus (Opsional)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isMissing = row.score === '' || row.score === null || row.score === undefined;
                  const isBelowPassing = row.score !== '' && Number(row.score) < (exam.maxScore * 0.6);

                  return (
                    <tr 
                      key={row.studentId} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9', 
                        transition: 'all 0.2s',
                        backgroundColor: isMissing ? 'rgba(254, 243, 199, 0.25)' : undefined
                      }} 
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isMissing ? 'rgba(254, 243, 199, 0.45)' : '#f8fafc'} 
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isMissing ? 'rgba(254, 243, 199, 0.25)' : 'transparent'}
                    >
                      <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500, textAlign: 'center', verticalAlign: 'middle' }}>{index + 1}</td>
                      
                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px', display: 'inline-block' }}>
                          {row.nis}
                        </div>
                      </td>

                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{row.studentName}</span>
                          {isMissing && (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              padding: '0.15rem 0.5rem', 
                              borderRadius: '99px', 
                              backgroundColor: '#fef3c7', 
                              color: '#92400e', 
                              border: '1px solid #fde68a' 
                            }}>
                              Belum Dinilai
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <input 
                          type="number" 
                          className="input-std"
                          disabled={isReadOnly}
                          style={{ 
                            textAlign: 'center', 
                            fontWeight: 800, 
                            fontSize: '1.1rem',
                            height: '46px',
                            color: isReadOnly ? '#64748b' : (isBelowPassing ? '#dc2626' : '#0f172a'),
                            backgroundColor: isReadOnly ? '#f1f5f9' : (isMissing ? '#fffbeb' : (isBelowPassing ? '#fef2f2' : '#f8fafc')),
                            borderColor: isReadOnly ? '#cbd5e1' : (isMissing ? '#fcd34d' : (isBelowPassing ? '#fca5a5' : '#e2e8f0')),
                            cursor: isReadOnly ? 'not-allowed' : 'text',
                          }}
                          value={row.score}
                          onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                          placeholder="-"
                          min={0}
                          max={exam.maxScore}
                        />
                      </td>

                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <input 
                          type="text" 
                          className="input-std"
                          disabled={isReadOnly}
                          style={{ 
                            height: '46px', 
                            backgroundColor: isReadOnly ? '#f1f5f9' : '#f8fafc', 
                            borderColor: isReadOnly ? '#cbd5e1' : '#e2e8f0',
                            fontSize: '0.9rem',
                            cursor: isReadOnly ? 'not-allowed' : 'text',
                            color: isReadOnly ? '#64748b' : undefined
                          }}
                          value={row.notes}
                          onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                          placeholder={isLocked ? '-' : "Tuliskan catatan..."}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
