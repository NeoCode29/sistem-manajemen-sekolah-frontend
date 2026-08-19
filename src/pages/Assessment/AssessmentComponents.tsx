import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { getAssessmentComponents, createAssessmentComponent, updateAssessmentComponent, deleteAssessmentComponent, getAssessmentTypes, type AssessmentComponent, type AssessmentType } from '../../api/assessmentService';
import { Plus, Edit2, Trash2, Settings, AlertCircle } from 'lucide-react';
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
    if (filterClassroomId && filterSubjectId && filterAcademicYearId && filterSemesterId) {
      fetchComponents();
    } else {
      setComponents([]);
    }
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
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId
      });
      setComponents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat komponen penilaian');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (comp?: AssessmentComponent) => {
    if (!comp && (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId)) {
      alert('Silakan pilih Tahun Ajaran, Semester, Kelas, dan Mata Pelajaran terlebih dahulu sebelum menambah komponen penilaian.');
      return;
    }
    if (comp) {
      setEditingId(comp.id);
      setTypeId(comp.typeId || '');
      setWeight(comp.weight || 0);
    } else {
      setEditingId(null);
      setTypeId('');
      setWeight(0);
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTypeId('');
    setWeight(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId) {
      setError('Pilih kelas, mata pelajaran, tahun ajaran, dan semester terlebih dahulu');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        typeId,
        weight: Number(weight),
        classroomId: filterClassroomId,
        subjectId: filterSubjectId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId
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
    if (!window.confirm('Yakin ingin menghapus komponen penilaian ini?')) return;
    try {
      setLoading(true);
      await deleteAssessmentComponent(id);
      await fetchComponents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus komponen');
      setLoading(false);
    }
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
            title={!isFiltersComplete ? "Lengkapi filter terlebih dahulu" : ""}
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
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title text-sm"><Settings size={16} className="inline mr-2" /> Filter Data</h2>
        </div>
        <div className="card-body">
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

      <div className="card">
        {loading && !isModalOpen ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : !isFiltersComplete ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-b-xl border-t border-gray-100">
            Silakan pilih Tahun Ajaran, Semester, Kelas, dan Mata Pelajaran untuk melihat komponen penilaian.
          </div>
        ) : components.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada komponen penilaian untuk kelas dan mata pelajaran ini.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Jenis Penilaian</th>
                  <th>Kode</th>
                  <th className="text-center">Bobot (%)</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {components.map((comp, index) => (
                  <tr key={comp.id}>
                    <td className="w-16">{index + 1}</td>
                    <td>
                      <div className="font-medium text-gray-900">{comp.type?.name || 'Unknown'}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{comp.type?.code}</span>
                    </td>
                    <td className="text-center">
                      <div className="font-semibold text-gray-700">{comp.weight}%</div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn-icon text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(comp)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon text-red-600 hover:bg-red-50" onClick={() => handleDelete(comp.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                  <td colSpan={3} className="text-right py-4">Total Bobot:</td>
                  <td className={`text-center py-4 ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalWeight}%
                    {totalWeight !== 100 && (
                      <div className="text-xs font-normal mt-1 text-red-500">Total harus 100%</div>
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
