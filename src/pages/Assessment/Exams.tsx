import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getExams, createExam, updateExam, deleteExam, getAssessmentTypes, getAssessmentComponents, type Exam, type AssessmentType, type AssessmentComponent } from '../../api/assessmentService';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { FileEdit, Plus, Edit2, Trash2, Search, Calendar, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [types, setTypes] = useState<AssessmentType[]>([]);
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [typeId, setTypeId] = useState('');
  const [componentId, setComponentId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (gradeId) fetchClassrooms(gradeId);
    else setClassrooms([]);
  }, [gradeId]);

  useEffect(() => {
    fetchExams();
  }, [filterAcademicYearId, filterSemesterId, search]);

  const fetchDependencies = async () => {
    try {
      const [ayData, semData, grData, subjData, typesData, compData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getGrades(),
        getSubjects(),
        getAssessmentTypes(),
        getAssessmentComponents()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setGrades(grData);
      setSubjects(subjData);
      setTypes(typesData);
      setComponents(compData);
      
      const activeAy = ayData.find(a => a.isActive);
      const activeSem = semData.find(s => s.isActive);
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassrooms = async (gid: string) => {
    try {
      const data = await getClassrooms(gid);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterAcademicYearId) params.academicYearId = filterAcademicYearId;
      if (filterSemesterId) params.semesterId = filterSemesterId;
      if (search) params.search = search;
      
      const data = await getExams(params);
      setExams(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data ujian/tugas');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingExam(null);
    setAcademicYearId(filterAcademicYearId || (academicYears.length > 0 ? academicYears[0].id : ''));
    setSemesterId(filterSemesterId || (semesters.length > 0 ? semesters[0].id : ''));
    setGradeId('');
    setClassroomId('');
    setSubjectId('');
    setTitle('');
    setTypeId(types.length > 0 ? types[0].id : '');
    setComponentId(components.length > 0 ? components[0].id : '');
    setExamDate(new Date().toISOString().split('T')[0]);
    setMaxScore(100);
    setDescription('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: any) => {
    setEditingExam(item);
    setAcademicYearId(item.academicYearId);
    setSemesterId(item.semesterId);
    setGradeId(item.classroom?.gradeId || ''); // trigger fetch classrooms
    setClassroomId(item.classroomId);
    setSubjectId(item.subjectId);
    setTitle(item.title);
    setTypeId(item.typeId || '');
    setComponentId(item.componentId || '');
    setExamDate(item.examDate ? item.examDate.split('T')[0] : '');
    setMaxScore(item.maxScore);
    setDescription(item.notes || item.description || '');
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        academicYearId,
        semesterId,
        classroomId,
        subjectId,
        title,
        typeId,
        componentId,
        assessmentDate: new Date(examDate).toISOString(),
        maxScore: Number(maxScore),
        notes: description
      };
      
      if (editingExam) {
        await updateExam(editingExam.id, payload);
      } else {
        await createExam(payload);
      }
      
      closeModal();
      fetchExams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus agenda penilaian ini? Semua nilai siswa yang terhubung akan ikut terhapus!', async () => {
      try {
        await deleteExam(id);
        fetchExams();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus data', 'Gagal');
      }
    });
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'UTS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'UAS': return 'bg-red-100 text-red-700 border-red-200';
      case 'UH': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PRAKTEK': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda Penilaian & Ujian</h1>
          <p className="page-subtitle">Kelola jadwal tugas, ulangan harian, UTS, dan UAS per kelas</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
          <Plus size={18} /> Tambah Agenda
        </button>
      </div>

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-end bg-gray-50/50">
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Tahun Ajaran</label>
          <select className="input-field mt-1" value={filterAcademicYearId} onChange={(e) => setFilterAcademicYearId(e.target.value)}>
            <option value="">Semua</option>
            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </select>
        </div>
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Semester</label>
          <select className="input-field mt-1" value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}>
            <option value="">Semua</option>
            {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
          </select>
        </div>
        <div className="form-group flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase">Pencarian Judul / Kelas</label>
          <div className="relative">
            <input 
              type="text" 
              className="input-field mt-1 pl-9" 
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {error && !isModalOpen && <div className="error-message mb-4">{error}</div>}

      <div className="glass-panel overflow-hidden border border-gray-200 shadow-sm mt-4">
        <div className="p-5 border-b bg-gray-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <FileEdit size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-800">Daftar Agenda Penilaian</h2>
            <p className="text-xs text-gray-500 mt-0.5">Seluruh agenda ujian dan tugas yang telah dijadwalkan</p>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <span className="text-sm font-medium">Memuat data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Judul Penilaian</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-center">Jenis</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Mapel & Kelas</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-center">Bobot</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-4 align-top">
                      <div className="font-bold text-gray-800 text-sm">{exam.title}</div>
                      {exam.description && <div className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{exam.description}</div>}
                    </td>
                    <td className="p-4 text-center align-top">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase border ${getExamTypeColor(exam.examType)}`}>
                        {exam.examType}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50/50 w-fit px-2 py-1 rounded-md border border-blue-100">
                        <BookOpen size={14} className="text-blue-500" /> {exam.subject?.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mt-2 pl-1">
                        <Users size={14} className="text-gray-400" /> Kelas {exam.classroom?.name}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Calendar size={15} className="text-emerald-500" />
                        {new Date(exam.examDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 text-center align-top">
                      <div className="font-bold text-gray-800 text-base">{exam.weight}</div>
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Max: {exam.maxScore}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link 
                          to={`/assessment/exams/${exam.id}/scores`}
                          className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 font-bold transition-colors shadow-sm"
                        >
                          Input Nilai
                        </Link>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" onClick={() => openEditModal(exam)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => handleDelete(exam.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 py-4">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                          <FileEdit size={36} className="text-gray-300" />
                        </div>
                        <div className="text-lg font-bold text-gray-700 tracking-wide">Belum ada agenda penilaian.</div>
                        <div className="text-sm text-gray-500 font-medium" style={{ marginTop: '30px' }}>Silakan tambah agenda baru melalui tombol di atas.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>{editingExam ? 'Edit Agenda Penilaian' : 'Tambah Agenda Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && <div className="error-message mb-4">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tahun Ajaran *</label>
                  <select className="input-field mt-1" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required>
                    <option value="">Pilih...</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Semester *</label>
                  <select className="input-field mt-1" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} required>
                    <option value="">Pilih...</option>
                    {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tingkat Kelas *</label>
                  <select className="input-field mt-1" value={gradeId} onChange={(e) => setGradeId(e.target.value)} required>
                    <option value="">Pilih...</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Rombel / Kelas *</label>
                  <select className="input-field mt-1" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} required disabled={!gradeId}>
                    <option value="">Pilih...</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Mata Pelajaran *</label>
                <select className="input-field mt-1" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                  <option value="">Pilih Mapel...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Judul Penilaian *</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: UH Bab 1 Aljabar"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Jenis Penilaian *</label>
                  <select className="input-field mt-1" value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
                    <option value="">Pilih...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tanggal *</label>
                  <input 
                    type="date" 
                    className="input-field mt-1" 
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700" title="Skor maksimal yang bisa didapat siswa">Skor Maksimal *</label>
                  <input 
                    type="number" 
                    className="input-field mt-1" 
                    value={maxScore} 
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    min={1}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700" title="Komponen penilaian">Komponen Penilaian *</label>
                  <select className="input-field mt-1" value={componentId} onChange={(e) => setComponentId(e.target.value)} required>
                    <option value="">Pilih...</option>
                    {components
                      .filter(c => c.classroomId === classroomId && c.subjectId === subjectId && c.academicYearId === academicYearId && c.semesterId === semesterId)
                      .map(c => <option key={c.id} value={c.id}>{c.type?.name || 'Komponen'} (Bobot: {c.weight})</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="form-group mb-6">
                <label className="text-sm font-medium text-gray-700">Deskripsi / Keterangan (Opsional)</label>
                <textarea 
                  className="input-field mt-1" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                ></textarea>
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    </div>
  );
};
