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
import { Save, ArrowLeft, Award, Users, BookOpen, Calendar, CheckCircle2, Lock, AlertTriangle, TrendingUp, Sparkles, RotateCcw } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/Common/TableSkeleton';
import { notify } from '../../utils/feedback';

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
  const canInputScore = hasPermission('assessments.input') || hasPermission('assessments.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage');
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah' || r.name === 'Kepala Sekolah') ?? false;

  const [exam, setExam] = useState<Exam | null>(null);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [originalRows, setOriginalRows] = useState<ScoreRow[]>([]);
  const [lockStatus, setLockStatus] = useState<AssessmentLockStatus | null>(null);
  const [assignedTeacher, setAssignedTeacher] = useState<any>(null);
  const [isAssignedTeacher, setIsAssignedTeacher] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      
      const newRows: ScoreRow[] = studentsData.map(student => {
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
      setOriginalRows(JSON.parse(JSON.stringify(newRows)));
    } catch (err: any) {
      notify.error(err, 'Gagal memuat data ujian atau daftar siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof ScoreRow, value: string) => {
    if (isReadOnly) return;
    const updatedRows = [...rows];
    
    if (field === 'score') {
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

  const handleSetKKMToEmpty = () => {
    if (isReadOnly || !exam) return;
    const kkmValue = exam.subject?.kkm ? Number(exam.subject.kkm) : 75;
    let count = 0;

    const updated = rows.map(r => {
      if (r.score === '' || r.score === null || r.score === undefined) {
        count++;
        return { ...r, score: kkmValue };
      }
      return r;
    });

    setRows(updated);
    notify.info(`${count} siswa yang belum memiliki nilai telah diisi nilai KKM (${kkmValue}).`);
  };

  const handleReset = () => {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    notify.info('Perubahan nilai telah dikembalikan ke kondisi awal.');
  };

  const handleOpenConfirm = () => {
    if (!examId || isReadOnly) return;
    const validScores = rows.filter(r => r.score !== '' && r.score !== null && r.score !== undefined);
    if (validScores.length === 0) {
      notify.error('Tidak ada nilai siswa untuk disimpan.');
      return;
    }
    setConfirmOpen(true);
  };

  const handleExecuteSave = async () => {
    if (!examId || isReadOnly) return;
    
    try {
      setSaving(true);
      const validScores = rows
        .filter(r => r.score !== '' && r.score !== null && r.score !== undefined)
        .map(r => ({
          studentId: r.studentId,
          score: Number(r.score),
          notes: r.notes || undefined
        }));
      
      await upsertExamScoresBatch(examId, validScores);
      notify.success(`Nilai untuk ${validScores.length} siswa berhasil disimpan secara permanen!`);
      setConfirmOpen(false);
      setOriginalRows(JSON.parse(JSON.stringify(rows)));
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-16 max-w-7xl mx-auto text-center flex flex-col items-center justify-center">
        <div className="text-rose-500 mb-4 font-bold text-lg">Agenda Penilaian tidak ditemukan.</div>
        <button className="btn-std-secondary" onClick={() => navigate('/assessment/exams')}>
          <ArrowLeft size={16} className="mr-2" /> Kembali ke Daftar Agenda
        </button>
      </div>
    );
  }

  const kkm = exam.subject?.kkm ? Number(exam.subject.kkm) : 75;
  const totalStudents = rows.length;
  const filledRows = rows.filter(r => r.score !== '' && r.score !== null && r.score !== undefined && !isNaN(Number(r.score)));
  const completedCount = filledRows.length;
  const missingCount = totalStudents - completedCount;

  const filledScores = filledRows.map(r => Number(r.score));
  const avgScore = filledScores.length > 0 ? (filledScores.reduce((a, b) => a + b, 0) / filledScores.length).toFixed(1) : '-';
  const maxClassScore = filledScores.length > 0 ? Math.max(...filledScores) : '-';
  const minClassScore = filledScores.length > 0 ? Math.min(...filledScores) : '-';
  const passedCount = filledScores.filter(s => s >= kkm).length;
  const passPercentage = filledScores.length > 0 ? Math.round((passedCount / filledScores.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      {/* Page Header (Clean Standard - No ContextAccessHeader) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button 
            type="button"
            onClick={() => navigate('/assessment/exams')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors mb-3 shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={13} /> Kembali ke Daftar Agenda
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{exam.title}</h1>
            {isLocked && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Terkunci (Hanya-Baca)
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isAssignedTeacher 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : isSuperAdmin 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isAssignedTeacher 
                ? 'Anda Guru Pengampu' 
                : isSuperAdmin 
                ? (user?.roles?.some(r => r.name === 'Kepala Sekolah') ? 'Akses Kepala Sekolah' : 'Akses Admin') 
                : 'Bukan Pengampu (Hanya-Baca)'}
            </span>
          </div>
          
          <p className="text-xs md:text-sm text-gray-500 mt-1.5">
            {exam.subject?.name || 'Mata Pelajaran'} • Kelas {exam.classroom?.name || 'Rombel'} • KKM: <span className="font-semibold text-slate-700">{kkm}</span> • Skor Maks: <span className="font-semibold text-slate-700">{exam.maxScore}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-start shrink-0">
          {isReadOnly ? (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-sm">
              <Lock size={14} />
              <span>{isLocked ? 'Terkunci (Hanya-Baca)' : 'Mode Hanya-Baca'}</span>
            </div>
          ) : (
            <button 
              type="button"
              className="btn-std-primary flex items-center gap-2 px-5 py-2 text-xs shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all duration-200"
              onClick={handleOpenConfirm}
              disabled={saving || rows.length === 0}
            >
              <Save size={15} className={saving ? 'animate-pulse' : ''} />
              <span className="font-semibold">{saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Kartu Statistik Nilai Realtime (KPI Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-indigo-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-indigo-600 font-medium">Rata-Rata Kelas</p>
            <p className="text-2xl font-black text-indigo-950">{avgScore}</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Nilai Tertinggi</p>
            <p className="text-2xl font-black text-emerald-950">{maxClassScore}</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Nilai Terendah</p>
            <p className="text-2xl font-black text-amber-950">{minClassScore}</p>
          </div>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-sky-600 font-medium">Tuntas KKM ({kkm})</p>
            <p className="text-2xl font-black text-sky-950">{passPercentage}% <span className="text-xs font-semibold text-slate-500">({passedCount}/{completedCount})</span></p>
          </div>
        </div>
      </div>

      {/* 3. Spreadsheet-like Score Input Table */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Daftar Penilaian Siswa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Total: {totalStudents} Siswa • Terisi: {completedCount} • Belum: {missingCount}</p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleSetKKMToEmpty}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5"
                title={`Isi nilai ${kkm} untuk semua siswa yang belum dinilai`}
              >
                <Sparkles size={14} />
                Isi KKM ({kkm}) ke Kosong
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/70 text-gray-600 font-semibold border-b border-gray-100">
              <tr>
                <th className="w-12 text-center py-3.5 px-3">No</th>
                <th className="w-32 py-3.5 px-3">NIS</th>
                <th className="py-3.5 px-3">Nama Siswa</th>
                <th className="w-36 py-3.5 px-3 text-center">Skor (Maks {exam.maxScore})</th>
                <th className="w-32 py-3.5 px-3 text-center">Status KKM</th>
                <th className="py-3.5 px-4">Catatan Perkembangan Siswa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 animate-in fade-in duration-300">
              {rows.map((row, index) => {
                const hasScore = row.score !== '' && row.score !== null && row.score !== undefined && !isNaN(Number(row.score));
                const numScore = hasScore ? Number(row.score) : null;
                const isPassed = numScore !== null && numScore >= kkm;

                return (
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
                    <td className="py-3 px-3 text-center">
                      <input 
                        type="number" 
                        disabled={isReadOnly}
                        min={0}
                        max={exam.maxScore}
                        step="any"
                        placeholder="0"
                        className={`w-24 text-center py-1.5 px-2 rounded-xl font-mono text-sm font-bold shadow-sm transition-all outline-none border ${
                          isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' :
                          !hasScore ? 'bg-white text-gray-400 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100' :
                          isPassed ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold focus:ring-emerald-200' :
                          'bg-rose-50 text-rose-900 border-rose-300 font-extrabold focus:ring-rose-200'
                        }`}
                        value={row.score}
                        onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      {!hasScore ? (
                        <Badge variant="default">Belum Ada</Badge>
                      ) : isPassed ? (
                        <Badge variant="success">Tuntas</Badge>
                      ) : (
                        <Badge variant="danger">Remedial</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input 
                        type="text" 
                        disabled={isReadOnly}
                        className={`input-std py-1.5 px-3 text-xs shadow-sm w-full transition-colors ${
                          isReadOnly ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-white/70 focus:bg-white'
                        }`}
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder={isReadOnly ? "-" : "Keterangan tugas, materi remedial..."}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Konfirmasi Simpan Nilai */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExecuteSave}
        title="Simpan Nilai Penilaian"
        message={`Apakah Anda yakin ingin menyimpan nilai untuk ${completedCount} siswa pada agenda "${exam.title}"? Data akan diperbarui ke pangkalan data nilai kurikulum.`}
        variant="info"
        confirmText={saving ? 'Menyimpan...' : 'Ya, Simpan Nilai'}
      />
    </div>
  );
};
export default ExamScores;
