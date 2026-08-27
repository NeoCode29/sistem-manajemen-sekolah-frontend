import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getExams, createExam, updateExam, deleteExam, getAssessmentTypes, getAssessmentComponents, type Exam, type AssessmentType, type AssessmentComponent } from '../../api/assessmentService';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { FileEdit, Plus, Edit2, Trash2, Search, Calendar, Users, BookOpen, Target, Settings, AlertCircle } from 'lucide-react';
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
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Agenda Penilaian</h1>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>Kelola jadwal tugas, ulangan harian, UTS, dan UAS per kelas dengan mudah.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={openAddModal}
            style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem' }}
          >
            <Plus size={20} />
            Tambah Agenda
          </button>
        </div>
      </div>

      {error && !isModalOpen && (
        <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} style={{ color: '#4f46e5' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Filter Pencarian Agenda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Tahun Ajaran</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={filterAcademicYearId} onChange={(e) => setFilterAcademicYearId(e.target.value)}>
                <option value="">Semua Tahun Ajaran</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Semester</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}>
                <option value="">Semua Semester</option>
                {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Pencarian Judul / Kelas</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field pl-10" 
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                placeholder="Ketik kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        {/* Header section of the table card - EXACTLY like AssessmentComponents */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Agenda Penilaian</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Seluruh agenda ujian dan tugas yang telah dijadwalkan</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>Memuat data agenda...</span>
          </div>
        ) : exams.length === 0 ? (
          <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.1)' }}>
                <Target size={36} style={{ color: '#4f46e5' }} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>Belum Ada Agenda</div>
              <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
                Silakan tambah agenda penilaian baru untuk mulai memasukkan nilai siswa.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>No</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Judul Penilaian</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail (Mapel & Kelas)</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Bobot</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, index) => (
                  <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500, verticalAlign: 'middle' }}>{index + 1}</td>
                    
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileEdit size={18} style={{ color: '#4f46e5' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{exam.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{exam.examType}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'fit-content' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                          {exam.subject?.name}
                        </span>
                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'fit-content' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
                          Kelas {exam.classroom?.name}
                        </span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        {new Date(exam.examDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{exam.weight}%</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginTop: '0.1rem' }}>Max {exam.maxScore}</div>
                    </td>

                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                        <Link 
                          to={`/assessment/exams/${exam.id}/scores`}
                          style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', backgroundColor: '#e0e7ff', borderRadius: '8px', transition: 'all 0.2s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c7d2fe'; }} 
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e0e7ff'; }}
                        >
                          <Users size={14} /> Nilai
                        </Link>
                        <button style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => openEditModal(exam)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                          <Edit2 size={16} />
                        </button>
                        <button style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => handleDelete(exam.id)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '650px' }}>
            <div className="modal-header-v4" style={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <h2>{editingExam ? 'Edit Agenda Penilaian' : 'Tambah Agenda Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid" style={{ padding: '2rem 1.5rem' }}>
              {error && (
                <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}>
                  <AlertCircle size={20} className="text-red-500" />
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-5 mb-4">
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Tahun Ajaran <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required style={{ backgroundColor: '#f8fafc' }}>
                    <option value="">Pilih Tahun Ajaran...</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Semester <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} required style={{ backgroundColor: '#f8fafc' }}>
                    <option value="">Pilih Semester...</option>
                    {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-4">
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Tingkat Kelas <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={gradeId} onChange={(e) => setGradeId(e.target.value)} required style={{ backgroundColor: '#f8fafc' }}>
                    <option value="">Pilih Tingkat...</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Rombel / Kelas <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} required disabled={!gradeId} style={{ backgroundColor: !gradeId ? '#f1f5f9' : '#f8fafc', opacity: !gradeId ? 0.7 : 1 }}>
                    <option value="">Pilih Rombel...</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-group mb-5">
                <label className="text-sm font-semibold text-gray-700">Mata Pelajaran <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="input-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required style={{ backgroundColor: '#f8fafc' }}>
                  <option value="">Pilih Mapel...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.5rem 0 1.5rem 0' }}></div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Judul Penilaian <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: UH Bab 1 Aljabar"
                    required 
                    style={{ fontWeight: 600 }}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Jenis Penilaian <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
                    <option value="">Pilih Jenis...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 mb-5">
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Tanggal <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700" title="Skor maksimal yang bisa didapat siswa">Skor Maksimal <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={maxScore} 
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    min={1}
                    required 
                    style={{ fontWeight: 700 }}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700" title="Komponen penilaian">Komponen Penilaian <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={componentId} onChange={(e) => setComponentId(e.target.value)} required>
                    <option value="">Pilih...</option>
                    {components
                      .filter(c => c.classroomId === classroomId && c.subjectId === subjectId && c.academicYearId === academicYearId && c.semesterId === semesterId)
                      .map(c => <option key={c.id} value={c.id}>{c.type?.name || 'Komponen'} (Bobot: {c.weight})</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="text-sm font-semibold text-gray-700">Deskripsi / Keterangan (Opsional)</label>
                <textarea 
                  className="input-field" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tambahkan catatan khusus untuk agenda ini..."
                  style={{ resize: 'none' }}
                ></textarea>
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
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
