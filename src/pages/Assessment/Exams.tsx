import React, { useEffect, useState } from 'react';
import { getExams, createExam, updateExam, deleteExam, getAssessmentTypes, getAssessmentComponents, type Exam, type AssessmentType, type AssessmentComponent } from '../../api/assessmentService';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { Plus, Search, Calendar, Users, BookOpen, Target, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';

interface ExamForm {
  academicYearId: string;
  semesterId: string;
  gradeId: string;
  classroomId: string;
  subjectId: string;
  title: string;
  typeId: string;
  componentId: string;
  examDate: string;
  maxScore: number;
  description: string;
}

const DEFAULT_FORM: ExamForm = {
  academicYearId: '',
  semesterId: '',
  gradeId: '',
  classroomId: '',
  subjectId: '',
  title: '',
  typeId: '',
  componentId: '',
  examDate: '',
  maxScore: 100,
  description: ''
};

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
  const { showConfirm, showAlert } = useDialog();
  
  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<ExamForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalClassrooms, setModalClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (form.gradeId) {
      getClassrooms(form.gradeId).then(setModalClassrooms).catch(console.error);
    } else {
      setModalClassrooms([]);
    }
  }, [form.gradeId]);

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
      showAlert('Gagal memuat data referensi', 'Error');
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
      showAlert(err.response?.data?.message || 'Gagal memuat agenda penilaian', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setForm({
        academicYearId: exam.academicYearId || '',
        semesterId: exam.semesterId || '',
        gradeId: '', // cannot easily infer gradeId from classroomId without searching the classrooms list, leaving empty is fine if disabled
        classroomId: exam.classroomId || '',
        subjectId: exam.subjectId || '',
        title: exam.title || '',
        typeId: exam.typeId || '',
        componentId: exam.componentId || '',
        examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
        maxScore: exam.maxScore || 100,
        description: exam.description || ''
      });
      setModal({ open: true, editId: exam.id });
    } else {
      setForm({
        ...DEFAULT_FORM,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId
      });
      setModal({ open: true, editId: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, editId: null });
  };

  const setField = (field: keyof ExamForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        title: form.title,
        academicYearId: form.academicYearId,
        semesterId: form.semesterId,
        classroomId: form.classroomId,
        subjectId: form.subjectId,
        typeId: form.typeId,
        componentId: form.componentId,
        assessmentDate: form.examDate ? new Date(form.examDate).toISOString() : null,
        maxScore: Number(form.maxScore),
        notes: form.description
      };

      if (modal.editId) {
        await updateExam(modal.editId, payload);
      } else {
        await createExam(payload);
      }
      
      await fetchExams();
      handleCloseModal();
    } catch (err: any) {
      const message = err.response?.data?.message;
      showAlert(Array.isArray(message) ? message.join(', ') : (message || 'Gagal menyimpan agenda penilaian'), 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus agenda penilaian ini? Semua nilai yang sudah diinput akan ikut terhapus.', async () => {
      try {
        await deleteExam(id);
        await fetchExams();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus agenda penilaian', 'Error');
      }
    });
  };

  const columns: Column<Exam>[] = [
    { 
      key: 'title', 
      header: 'Judul Penilaian',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Target size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{row.type?.name || 'Unknown Type'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'target',
      header: 'Target Kelas & Mapel',
      render: (row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Users size={14} className="text-gray-400" />
            <span className="font-medium">{row.classroom?.name || 'Unknown Class'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen size={14} className="text-gray-400" />
            <span>{row.subject?.name || 'Unknown Subject'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'schedule',
      header: 'Jadwal & Komponen',
      render: (row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Calendar size={14} className="text-indigo-500" />
            <span>{row.examDate ? new Date(row.examDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="info">Bobot: {row.component?.weight || 0}%</Badge>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <Link 
            to={`/assessment/exams/${row.id}/scores`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
          >
            Input Nilai
          </Link>
          <ActionButtons onEdit={() => handleOpenModal(row)} onDelete={() => handleDelete(row.id)} />
        </div>
      )
    }
  ];

  const filteredComponents = components.filter(c => 
    (!form.classroomId || c.classroomId === form.classroomId) &&
    (!form.subjectId || c.subjectId === form.subjectId)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Agenda Penilaian"
        subtitle="Kelola agenda penilaian, ujian, dan tugas untuk setiap kelas dan mata pelajaran."
        action={
          <button className="btn-std-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} /> Buat Agenda Baru
          </button>
        }
      />

      {/* Modern Filter Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Filter Agenda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun Ajaran</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterAcademicYearId} onChange={e => setFilterAcademicYearId(e.target.value)}>
              <option value="">Semua Tahun Ajaran...</option>
              {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</label>
            <select 
              className="input-std bg-slate-50 border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              value={filterSemesterId} 
              onChange={e => setFilterSemesterId(e.target.value)}
              disabled={!filterAcademicYearId}
            >
              <option value="">Semua Semester...</option>
              {semesters.filter(s => s.academicYearId === filterAcademicYearId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cari Judul / Mapel</label>
            <div className="relative">
              <input 
                type="text" 
                className="input-std pl-10" 
                placeholder="Ketik kata kunci..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <DataTable columns={columns} data={exams} loading={loading} emptyMessage="Belum ada agenda penilaian yang sesuai dengan kriteria filter." />
      </div>

      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Agenda Penilaian' : 'Buat Agenda Penilaian'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tahun Ajaran" required>
              <select className="input-std disabled:bg-slate-50" value={form.academicYearId} onChange={setField('academicYearId')} required disabled={!!modal.editId}>
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </select>
            </FormField>
            <FormField label="Semester" required>
              <select 
              className="input-std disabled:bg-slate-50 disabled:cursor-not-allowed" 
              value={form.semesterId} 
              onChange={setField('semesterId')} 
              required 
              disabled={!!modal.editId || !form.academicYearId}
            >
              <option value="">Pilih Semester...</option>
              {semesters.filter(s => s.academicYearId === form.academicYearId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!modal.editId && (
              <FormField label="Tingkat Kelas" required>
                <select className="input-std" value={form.gradeId} onChange={setField('gradeId')} required>
                  <option value="">Pilih Tingkat Kelas...</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </FormField>
            )}
            <FormField label="Rombel / Kelas" required>
              <select className="input-std disabled:bg-slate-50" value={form.classroomId} onChange={setField('classroomId')} required disabled={!!modal.editId || !form.gradeId}>
                <option value="">Pilih Rombel / Kelas...</option>
                {modal.editId ? classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : modalClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Mata Pelajaran" required>
            <select className="input-std disabled:bg-slate-50" value={form.subjectId} onChange={setField('subjectId')} required disabled={!!modal.editId}>
              <option value="">Pilih Mata Pelajaran...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </FormField>

          <div className="h-px bg-slate-200 my-2"></div>
          
          <FormField label="Judul Penilaian" required>
            <input type="text" className="input-std" placeholder="Contoh: Ulangan Harian 1" value={form.title} onChange={setField('title')} required />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Jenis Penilaian" required>
              <select className="input-std disabled:bg-slate-50" value={form.typeId} onChange={setField('typeId')} required disabled={!!modal.editId}>
                <option value="">Pilih Jenis Penilaian...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
            </FormField>
            <FormField label="Komponen Bobot" required>
              <select className="input-std disabled:bg-slate-50" value={form.componentId} onChange={setField('componentId')} required disabled={!!modal.editId || !form.classroomId || !form.subjectId}>
                <option value="">Pilih Komponen Bobot...</option>
                {filteredComponents.map(c => <option key={c.id} value={c.id}>{c.type?.name} ({c.weight}%)</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tanggal Penilaian" required>
              <input type="date" className="input-std" value={form.examDate} onChange={setField('examDate')} required />
            </FormField>
            <FormField label="Skor Maksimal" required>
              <input type="number" className="input-std" value={form.maxScore || ''} onChange={setField('maxScore')} min={1} required />
            </FormField>
          </div>

          <FormField label="Keterangan">
            <textarea className="input-std" placeholder="Opsional" rows={3} value={form.description} onChange={setField('description')} />
          </FormField>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
            <button type="button" onClick={handleCloseModal} className="btn-std-secondary" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn-std-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
