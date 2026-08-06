import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, getExamScores, upsertExamScoresBatch, type Exam, type ExamScore } from '../../api/assessmentService';
import { getStudents } from '../../api/studentService';
import { Save, ArrowLeft, Award, FileEdit } from 'lucide-react';
import '../Academic/Academic.css';

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
        getStudents({ classroomId: examData.classroomId, enrollmentStatus: 'ACTIVE' }),
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
      setSuccess('Nilai berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat data penilaian...</div>;
  }

  if (!exam) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Agenda Penilaian tidak ditemukan.</div>
        <button className="btn-secondary" onClick={() => navigate('/assessment/exams')}>Kembali</button>
      </div>
    );
  }

  return (
    <div className="academic-container">
      <div className="page-header mb-2 border-b-0 pb-0">
        <div>
          <button 
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors"
            onClick={() => navigate('/assessment/exams')}
          >
            <ArrowLeft size={16} /> Kembali ke Daftar Agenda
          </button>
          <h1 className="page-title">Input Nilai: {exam.title}</h1>
        </div>
      </div>

      {/* Exam Info Card */}
      <div className="glass-panel p-5 mb-6 flex flex-wrap gap-6 items-center bg-blue-50/30 border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-inner">
            <Award size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-semibold">Mata Pelajaran</div>
            <div className="font-bold text-gray-800">{exam.subject?.name}</div>
          </div>
        </div>
        <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Kelas</div>
          <div className="font-medium text-gray-800">{exam.classroom?.name}</div>
        </div>
        <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Jenis & Tanggal</div>
          <div className="font-medium text-gray-800">
            {exam.examType} &bull; {new Date(exam.examDate).toLocaleDateString('id-ID')}
          </div>
        </div>
        <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Skor Maksimal</div>
          <div className="font-bold text-blue-700 text-lg">{exam.maxScore}</div>
        </div>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}
      {success && <div className="success-message mb-4">{success}</div>}

      <div className="glass-panel">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <FileEdit size={18} className="text-gray-500" /> Daftar Siswa
          </div>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={handleSave}
            disabled={saving || rows.length === 0}
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
        
        {rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada siswa di kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm">
                  <th className="p-3 border-b font-medium w-16 text-center">No</th>
                  <th className="p-3 border-b font-medium w-32">NIS</th>
                  <th className="p-3 border-b font-medium">Nama Siswa</th>
                  <th className="p-3 border-b font-medium w-40 text-center">Skor (0 - {exam.maxScore})</th>
                  <th className="p-3 border-b font-medium w-1/3">Catatan Khusus (Opsional)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.studentId} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center text-gray-500">{index + 1}</td>
                    <td className="p-3 font-mono text-sm text-gray-600">{row.nis}</td>
                    <td className="p-3 font-medium text-gray-800">{row.studentName}</td>
                    <td className="p-3 px-6">
                      <input 
                        type="number" 
                        className={`w-full p-2 border rounded-md text-center font-bold outline-none transition-colors focus:ring-2 ${
                          row.score !== '' && Number(row.score) < (exam.maxScore * 0.6) // Simple visual cue for low scores
                            ? 'text-red-600 border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                            : 'text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        value={row.score}
                        onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                        placeholder="-"
                        min={0}
                        max={exam.maxScore}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder="Tambahkan catatan (opsional)..."
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
