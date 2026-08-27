import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { getAssessmentComponents, createAssessmentComponent, updateAssessmentComponent, deleteAssessmentComponent, getAssessmentTypes, type AssessmentComponent, type AssessmentType } from '../../api/assessmentService';
import { Plus, Edit2, Trash2, Settings, AlertCircle, Target, BookOpen, PieChart, CheckCircle2 } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const AssessmentComponents: React.FC = () => {
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [types, setTypes] = useState<AssessmentType[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();

  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterClassroomId, setFilterClassroomId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [modalAcademicYearId, setModalAcademicYearId] = useState('');
  const [modalSemesterId, setModalSemesterId] = useState('');
  const [modalGradeId, setModalGradeId] = useState('');
  const [modalClassroomId, setModalClassroomId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalClassrooms, setModalClassrooms] = useState<Classroom[]>([]);

  // Form Fields
  const [typeId, setTypeId] = useState('');
  const [weight, setWeight] = useState<number>(0);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (filterGradeId) fetchClassrooms(filterGradeId);
    else setClassrooms([]);
  }, [filterGradeId]);

  useEffect(() => {
    if (modalGradeId) {
      getClassrooms(modalGradeId).then(setModalClassrooms).catch(console.error);
    } else {
      setModalClassrooms([]);
    }
  }, [modalGradeId]);

  useEffect(() => {
    fetchComponents();
  }, [filterClassroomId, filterSubjectId, filterAcademicYearId, filterSemesterId]);

  const fetchDependencies = async () => {
    try {
      const [ayData, semData, grData, subjData, typesData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getGrades(),
        getSubjects(),
        getAssessmentTypes()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setGrades(grData);
      setSubjects(subjData);
      setTypes(typesData);
      
      const activeAy = ayData.find(a => a.isActive);
      const activeSem = semData.find(s => s.isActive);
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data referensi');
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

  const fetchComponents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAssessmentComponents({
        classroomId: filterClassroomId || undefined,
        subjectId: filterSubjectId || undefined,
        academicYearId: filterAcademicYearId || undefined,
        semesterId: filterSemesterId || undefined
      });
      setComponents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat komponen penilaian');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (comp?: AssessmentComponent) => {
    if (comp) {
      setEditingId(comp.id);
      setTypeId(comp.typeId || '');
      setWeight(comp.weight || 0);
      setModalAcademicYearId(comp.academicYearId || '');
      setModalSemesterId(comp.semesterId || '');
      setModalSubjectId(comp.subjectId || '');
      setModalClassroomId(comp.classroomId || '');
    } else {
      setEditingId(null);
      setTypeId('');
      setWeight(0);
      setModalAcademicYearId(filterAcademicYearId);
      setModalSemesterId(filterSemesterId);
      setModalGradeId(filterGradeId);
      setModalClassroomId(filterClassroomId);
      setModalSubjectId(filterSubjectId);
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTypeId('');
    setWeight(0);
    setModalAcademicYearId('');
    setModalSemesterId('');
    setModalGradeId('');
    setModalClassroomId('');
    setModalSubjectId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalClassroomId || !modalSubjectId || !modalAcademicYearId || !modalSemesterId) {
      setError('Pilih kelas, mata pelajaran, tahun ajaran, dan semester terlebih dahulu di form modal ini.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        typeId,
        weight: Number(weight),
        classroomId: modalClassroomId,
        subjectId: modalSubjectId,
        academicYearId: modalAcademicYearId,
        semesterId: modalSemesterId
      };

      if (editingId) {
        await updateAssessmentComponent(editingId, payload);
      } else {
        await createAssessmentComponent(payload);
      }
      
      await fetchComponents();
      handleCloseModal();
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Gagal menyimpan komponen penilaian');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus komponen penilaian ini?', async () => {
      try {
        setLoading(true);
        await deleteAssessmentComponent(id);
        await fetchComponents();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal menghapus komponen');
        setLoading(false);
      }
    });
  };

  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isFiltersComplete = filterClassroomId && filterSubjectId && filterAcademicYearId && filterSemesterId;

  return (
    <div className="academic-container">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Komponen Penilaian</h1>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>Atur struktur penilaian, jenis ujian, dan proporsi bobot untuk perhitungan nilai akhir.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => handleOpenModal()}
            style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem' }}
          >
            <Plus size={20} />
            Tambah Komponen
          </button>
        </div>
      </div>

      {error && (
        <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} style={{ color: '#4f46e5' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Parameter Penilaian</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Tahun Ajaran</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={filterAcademicYearId} onChange={e => setFilterAcademicYearId(e.target.value)}>
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Semester</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={filterSemesterId} onChange={e => setFilterSemesterId(e.target.value)}>
                <option value="">Pilih Semester...</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semesterType})</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Tingkat Kelas</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={filterGradeId} onChange={e => setFilterGradeId(e.target.value)}>
                <option value="">Pilih Tingkat...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Rombel / Kelas</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', opacity: filterGradeId ? 1 : 0.6 }} value={filterClassroomId} onChange={e => setFilterClassroomId(e.target.value)} disabled={!filterGradeId}>
                <option value="">Pilih Rombel...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Mata Pelajaran</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)}>
                <option value="">Pilih Mapel...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        {loading && !isModalOpen ? (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>Memuat konfigurasi...</span>
          </div>
        ) : components.length === 0 ? (
          <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.1)' }}>
                <Target size={36} style={{ color: '#4f46e5' }} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>Data Komponen Kosong</div>
              <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
                {isFiltersComplete ? 'Belum ada komponen penilaian yang diatur untuk kelas dan mapel ini. Silakan tambahkan komponen baru.' : 'Pastikan Anda telah memilih semua filter di atas untuk melihat data komponen penilaian.'}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Header section of the table card */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Komponen</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Sebaran bobot persentase penilaian siswa</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: totalWeight === 100 ? '#059669' : '#dc2626' }}>Total Bobot</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalWeight === 100 ? '#10b981' : '#ef4444', lineHeight: 1 }}>{totalWeight}%</div>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: totalWeight === 100 ? '#d1fae5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart size={24} style={{ color: totalWeight === 100 ? '#10b981' : '#ef4444' }} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>No</th>
                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jenis Penilaian</th>
                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode Referensi</th>
                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Bobot (%)</th>
                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp, index) => (
                    <tr key={comp.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                      <td style={{ padding: '1.25rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={18} style={{ color: '#4f46e5' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{comp.type?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Komponen Penilaian Akademik</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 2rem' }}>
                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#64748b' }}></div>
                          {comp.type?.code}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{comp.weight}%</div>
                      </td>
                      <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => handleOpenModal(comp)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                            <Edit2 size={16} />
                          </button>
                          <button style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => handleDelete(comp.id)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progress Bar Footer */}
            <div style={{ padding: '1.5rem 2rem', background: 'rgba(248, 250, 252, 0.8)', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Distribusi Total Bobot</span>
                {totalWeight === 100 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                    <CheckCircle2 size={16} /> Konfigurasi Sempurna
                  </span>
                ) : (
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>
                    Sisa {100 - totalWeight}% yang belum dialokasikan
                  </span>
                )}
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(totalWeight, 100)}%`, backgroundColor: totalWeight === 100 ? '#10b981' : (totalWeight > 100 ? '#ef4444' : '#4f46e5'), borderRadius: '999px', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4" style={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <h2>{editingId ? 'Edit Komponen' : 'Tambah Komponen'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid" style={{ padding: '2rem 1.5rem' }}>
                
                {/* Independent Modal Inputs */}
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Tahun Ajaran <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={modalAcademicYearId} onChange={e => setModalAcademicYearId(e.target.value)} required disabled={!!editingId} style={{ backgroundColor: !!editingId ? '#f1f5f9' : 'white' }}>
                    <option value="">Pilih Tahun Ajaran...</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Semester <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={modalSemesterId} onChange={e => setModalSemesterId(e.target.value)} required disabled={!!editingId} style={{ backgroundColor: !!editingId ? '#f1f5f9' : 'white' }}>
                    <option value="">Pilih Semester...</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semesterType})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Tingkat Kelas <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={modalGradeId} onChange={e => setModalGradeId(e.target.value)} required disabled={!!editingId} style={{ backgroundColor: !!editingId ? '#f1f5f9' : 'white' }}>
                    <option value="">Pilih Tingkat Kelas...</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Rombel / Kelas <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={modalClassroomId} onChange={e => setModalClassroomId(e.target.value)} disabled={!modalGradeId || !!editingId} required style={{ backgroundColor: (!modalGradeId || !!editingId) ? '#f1f5f9' : 'white' }}>
                    <option value="">Pilih Rombel / Kelas...</option>
                    {modalClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-semibold text-gray-700">Mata Pelajaran <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={modalSubjectId} onChange={e => setModalSubjectId(e.target.value)} required disabled={!!editingId} style={{ backgroundColor: !!editingId ? '#f1f5f9' : 'white' }}>
                    <option value="">Pilih Mata Pelajaran...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>

                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '1rem 0', gridColumn: '1 / -1' }}></div>
                
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Jenis Penilaian <span style={{ color: '#ef4444' }}>*</span></label>
                  <select className="input-field" value={typeId} onChange={e => setTypeId(e.target.value)} required disabled={!!editingId} style={{ backgroundColor: !!editingId ? '#f1f5f9' : 'white' }}>
                    <option value="">Pilih Jenis Penilaian...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Bobot Persentase (%) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={weight || ''} 
                    onChange={e => setWeight(Number(e.target.value))} 
                    min={1} 
                    max={100}
                    step="0.01"
                    required 
                    style={{ fontSize: '1.25rem', fontWeight: 700 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Sisa kuota: <strong>{100 - (totalWeight - (editingId ? (components.find(c => c.id === editingId)?.weight || 0) : 0))}%</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
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

