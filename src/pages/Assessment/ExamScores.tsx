import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, getExamScores, upsertExamScoresBatch, type Exam, type ExamScore } from '../../api/assessmentService';
import { getStudents } from '../../api/studentService';
import { Save, ArrowLeft, Award, FileEdit, Users, BookOpen, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../../utils/errorHandler';

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

  const [exam, setExam] = useState<Exam | null>(null);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      
      // 2. Fetch Students in that classroom & existing scores
      const [studentsData, scoresData] = await Promise.all([
        getStudents({ 
          classroomId: examData.classroomId, 
          academicYearId: examData.academicYearId,
          semesterId: examData.semesterId,
          status: 'ACTIVE', 
          enrollmentStatus: 'ENROLLED' 
        }),
        getExamScores(examId!)
      ]);
      
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
    if (!examId) return;
    
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
      setError(getErrorMessage(err, 'Gagal menyimpan nilai siswa. Pastikan rentang nilai valid (0 - Nilai Maksimum).'));
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

  const completedCount = rows.filter(r => r.score !== '').length;

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8" style={{ marginBottom: '2.5rem' }}>
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontSize: '2rem' }}>{exam.title}</h1>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>Masukkan skor pencapaian siswa untuk agenda ini.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-std-primary" 
            onClick={handleSave}
            disabled={saving || rows.length === 0}
            style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (saving || rows.length === 0) ? 0.7 : 1 }}
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}
          </button>
        </div>
      </div>

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
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Siswa</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Data nilai yang belum disimpan tidak akan hilang saat Anda mengubah angka di baris lain.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Progres Pengisian:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: completedCount === rows.length ? '#10b981' : '#4f46e5' }}>{completedCount} / {rows.length}</span>
          </div>
        </div>
        
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
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '160px', textAlign: 'center' }}>Skor (Max: {exam.maxScore})</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '300px' }}>Catatan Khusus (Opsional)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.studentId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500, textAlign: 'center', verticalAlign: 'middle' }}>{index + 1}</td>
                    
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px', display: 'inline-block' }}>
                        {row.nis}
                      </div>
                    </td>

                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{row.studentName}</div>
                    </td>
                    
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <input 
                        type="number" 
                        className={`input-std`}
                        style={{ 
                          textAlign: 'center', 
                          fontWeight: 800, 
                          fontSize: '1.1rem',
                          height: '46px',
                          color: (row.score !== '' && Number(row.score) < (exam.maxScore * 0.6)) ? '#dc2626' : '#0f172a',
                          backgroundColor: (row.score !== '' && Number(row.score) < (exam.maxScore * 0.6)) ? '#fef2f2' : '#f8fafc',
                          borderColor: (row.score !== '' && Number(row.score) < (exam.maxScore * 0.6)) ? '#fca5a5' : '#e2e8f0',
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
                        style={{ height: '46px', backgroundColor: '#f8fafc', fontSize: '0.9rem' }}
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder="Tuliskan catatan..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
