import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { getAssessmentComponents, createAssessmentComponent, updateAssessmentComponent, deleteAssessmentComponent, getAssessmentTypes, type AssessmentComponent, type AssessmentType } from '../../api/assessmentService';
import { Plus, Edit2, Trash2, Settings, AlertCircle } from 'lucide-react';
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Komponen Penilaian</h1>
          <p className="page-description">Atur jenis dan bobot penilaian untuk perhitungan nilai akhir rapor</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} />
            Tambah Komponen
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel overflow-hidden border border-gray-200 shadow-sm mb-6">
        <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
          <Settings size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-700">Filter Data</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Tahun Ajaran</label>
              <select className="input-field mt-1" value={filterAcademicYearId} onChange={e => setFilterAcademicYearId(e.target.value)}>
                <option value="">Pilih...</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Semester</label>
              <select className="input-field mt-1" value={filterSemesterId} onChange={e => setFilterSemesterId(e.target.value)}>
                <option value="">Pilih...</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semesterType})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Tingkat Kelas</label>
              <select className="input-field mt-1" value={filterGradeId} onChange={e => setFilterGradeId(e.target.value)}>
                <option value="">Pilih...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Rombel / Kelas</label>
              <select className="input-field mt-1" value={filterClassroomId} onChange={e => setFilterClassroomId(e.target.value)} disabled={!filterGradeId}>
                <option value="">Pilih...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <select className="input-field mt-1" value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)}>
                <option value="">Pilih...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border border-gray-200 shadow-sm">
        {loading && !isModalOpen ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <span className="text-sm font-medium">Memuat data...</span>
          </div>
        ) : components.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400 py-4">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                <AlertCircle size={36} className="text-gray-300" />
              </div>
              <div className="text-lg font-bold text-gray-700 tracking-wide">Belum ada komponen penilaian.</div>
              <div className="text-sm text-gray-500 font-medium" style={{ marginTop: '30px' }}>Silakan tambah komponen penilaian baru melalui tombol di atas.</div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider w-16">No</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Jenis Penilaian</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Kode</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-center">Bobot (%)</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {components.map((comp, index) => (
                  <tr key={comp.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-4 align-middle text-gray-600">{index + 1}</td>
                    <td className="p-4 align-middle">
                      <div className="font-semibold text-gray-800">{comp.type?.name || 'Unknown'}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {comp.type?.code}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className="font-bold text-gray-800">{comp.weight}%</div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-1.5">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" onClick={() => handleOpenModal(comp)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => handleDelete(comp.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50/80 border-t-2 border-gray-200">
                  <td colSpan={3} className="text-right p-4 font-bold text-gray-700">Total Bobot:</td>
                  <td className={`text-center p-4 font-bold text-lg ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalWeight}%
                    {totalWeight !== 100 && (
                      <div className="text-xs font-semibold mt-1 text-red-500 bg-red-50 py-0.5 px-2 rounded border border-red-100 inline-block block">Total harus 100%</div>
                    )}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>{editingId ? 'Edit Komponen' : 'Tambah Komponen'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                
                {/* Independent Modal Inputs */}
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tahun Ajaran *</label>
                  <select className="input-field mt-1" value={modalAcademicYearId} onChange={e => setModalAcademicYearId(e.target.value)} required disabled={!!editingId}>
                    <option value="">Pilih...</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Semester *</label>
                  <select className="input-field mt-1" value={modalSemesterId} onChange={e => setModalSemesterId(e.target.value)} required disabled={!!editingId}>
                    <option value="">Pilih...</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semesterType})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tingkat Kelas *</label>
                  <select className="input-field mt-1" value={modalGradeId} onChange={e => setModalGradeId(e.target.value)} required disabled={!!editingId}>
                    <option value="">Pilih...</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Rombel / Kelas *</label>
                  <select className="input-field mt-1" value={modalClassroomId} onChange={e => setModalClassroomId(e.target.value)} disabled={!modalGradeId || !!editingId} required>
                    <option value="">Pilih...</option>
                    {modalClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="text-sm font-medium text-gray-700">Mata Pelajaran *</label>
                  <select className="input-field mt-1" value={modalSubjectId} onChange={e => setModalSubjectId(e.target.value)} required disabled={!!editingId}>
                    <option value="">Pilih...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>

                <hr className="my-2 border-gray-200" style={{ gridColumn: '1 / -1' }} />
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Jenis Penilaian *</label>
                  <select className="input-field mt-1" value={typeId} onChange={e => setTypeId(e.target.value)} required disabled={!!editingId}>
                    <option value="">Pilih...</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Bobot Persentase (%) *</label>
                  <input 
                    type="number" 
                    className="input-field mt-1" 
                    value={weight || ''} 
                    onChange={e => setWeight(Number(e.target.value))} 
                    min={1} 
                    max={100}
                    step="0.01"
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">Sisa bobot yang bisa ditambahkan: {100 - (totalWeight - (editingId ? (components.find(c => c.id === editingId)?.weight || 0) : 0))}%</p>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
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
