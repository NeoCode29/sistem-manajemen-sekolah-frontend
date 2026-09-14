import React, { useEffect, useState } from 'react';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { getAssessmentComponents, createAssessmentComponent, updateAssessmentComponent, deleteAssessmentComponent, getAssessmentTypes, generateDefaultComponents, type AssessmentComponent, type AssessmentType } from '../../api/assessmentService';
import { Plus, Settings, Target, BookOpen, PieChart, CheckCircle2, Sparkles } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, Modal, FormField } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { usePermissions } from '../../hooks/usePermissions';

interface ComponentForm {
  typeId: string;
  weight: number;
  academicYearId: string;
  semesterId: string;
  gradeId: string;
  classroomId: string;
  subjectId: string;
}

const DEFAULT_FORM: ComponentForm = {
  typeId: '',
  weight: 0,
  academicYearId: '',
  semesterId: '',
  gradeId: '',
  classroomId: '',
  subjectId: ''
};

export const AssessmentComponents: React.FC = () => {
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [types, setTypes] = useState<AssessmentType[]>([]);
  
  const [loading, setLoading] = useState(false);
  const { hasPermission } = usePermissions();
  const canManageAssessmentComponents = hasPermission('assessment_components.manage') || hasPermission('assessment.write');
  const { showConfirm, showAlert } = useDialog();

  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterClassroomId, setFilterClassroomId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  // Modal & Form State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<ComponentForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalClassrooms, setModalClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (filterGradeId) fetchClassrooms(filterGradeId);
    else setClassrooms([]);
  }, [filterGradeId]);

  useEffect(() => {
    if (form.gradeId) {
      getClassrooms(form.gradeId).then(setModalClassrooms).catch(console.error);
    } else {
      setModalClassrooms([]);
    }
  }, [form.gradeId]);

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
      showAlert('Gagal memuat data referensi', 'Error');
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
    if (!filterClassroomId || !filterSubjectId || !filterAcademicYearId || !filterSemesterId) {
      setComponents([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getAssessmentComponents({
        classroomId: filterClassroomId || undefined,
        subjectId: filterSubjectId || undefined,
        academicYearId: filterAcademicYearId || undefined,
        semesterId: filterSemesterId || undefined
      });
      setComponents(data);
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Gagal memuat komponen penilaian', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (comp?: AssessmentComponent) => {
    if (comp) {
      setForm({
        typeId: comp.typeId || '',
        weight: comp.weight || 0,
        academicYearId: comp.academicYearId || '',
        semesterId: comp.semesterId || '',
        gradeId: '', // Note: we might not know gradeId from component directly if backend doesn't return it
        classroomId: comp.classroomId || '',
        subjectId: comp.subjectId || ''
      });
      setModal({ open: true, editId: comp.id });
    } else {
      setForm({
        ...DEFAULT_FORM,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        gradeId: filterGradeId,
        classroomId: filterClassroomId,
        subjectId: filterSubjectId
      });
      setModal({ open: true, editId: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, editId: null });
  };

  const setField = (field: keyof ComponentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classroomId || !form.subjectId || !form.academicYearId || !form.semesterId) {
      showAlert('Pilih kelas, mata pelajaran, tahun ajaran, dan semester terlebih dahulu.', 'Peringatan');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        typeId: form.typeId,
        weight: Number(form.weight),
        classroomId: form.classroomId,
        subjectId: form.subjectId,
        academicYearId: form.academicYearId,
        semesterId: form.semesterId
      };

      if (modal.editId) {
        await updateAssessmentComponent(modal.editId, {
          weight: Number(form.weight)
        });
      } else {
        await createAssessmentComponent(payload);
      }

      
      await fetchComponents();
      handleCloseModal();
    } catch (err: any) {
      const message = err.response?.data?.message;
      showAlert(Array.isArray(message) ? message.join(', ') : (message || 'Gagal menyimpan komponen penilaian'), 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus komponen penilaian ini?', async () => {
      try {
        await deleteAssessmentComponent(id);
        await fetchComponents();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus komponen', 'Error');
      }
    });
  };

  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isFiltersComplete = Boolean(filterClassroomId && filterSubjectId && filterAcademicYearId && filterSemesterId);
  const activeTypes = types.filter(t => t.isActive !== false);
  const existingTypeIds = new Set(components.map(c => (c.typeId || c.type?.id)?.toString()));
  const isAllTypesCreated = isFiltersComplete && activeTypes.length > 0 && activeTypes.every(t => existingTypeIds.has(t.id.toString()));

  const handleGenerateDefault = async () => {
    if (!isFiltersComplete || isAllTypesCreated || isGenerating) return;

    showConfirm(
      'Generate otomatis semua jenis penilaian aktif yang belum ada untuk kelas & mapel ini dengan nilai bobot awal 0%?',
      async () => {
        try {
          setIsGenerating(true);
          await generateDefaultComponents({
            classroomId: filterClassroomId,
            subjectId: filterSubjectId,
            academicYearId: filterAcademicYearId,
            semesterId: filterSemesterId
          });
          await fetchComponents();
        } catch (err: any) {
          const message = err.response?.data?.message;
          showAlert(Array.isArray(message) ? message.join(', ') : (message || 'Gagal generate komponen penilaian'), 'Error');
        } finally {
          setIsGenerating(false);
        }
      }
    );
  };

  const columns: Column<AssessmentComponent>[] = [
    { 
      key: 'type', 
      header: 'Jenis Penilaian',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BookOpen size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.type?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">Komponen Penilaian</div>
          </div>
        </div>
      )
    },
    {
      key: 'code',
      header: 'Kode Ref',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-slate-100 text-slate-600 border border-slate-200">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
          {row.type?.code}
        </span>
      )
    },
    {
      key: 'weight',
      header: 'Bobot (%)',
      render: (row) => (
        <div className="text-lg font-extrabold text-slate-900 text-center">{row.weight}%</div>
      )
    }
  ];

  if (canManageAssessmentComponents) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      render: (row) => <ActionButtons onEdit={() => handleOpenModal(row)} onDelete={() => handleDelete(row.id)} />
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Komponen Penilaian"
        subtitle="Atur struktur penilaian, jenis ujian, dan proporsi bobot untuk perhitungan nilai akhir."
        action={
          canManageAssessmentComponents ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateDefault}
                disabled={!isFiltersComplete || isAllTypesCreated || isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  isAllTypesCreated
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : !isFiltersComplete
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 active:scale-95 cursor-pointer shadow-indigo-100'
                }`}
                title={
                  !isFiltersComplete
                    ? 'Lengkapi pilihan filter terlebih dahulu'
                    : isAllTypesCreated
                    ? 'Semua jenis penilaian aktif sudah dibuat'
                    : 'Buat otomatis seluruh jenis penilaian dengan bobot 0%'
                }
              >
                <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
                <span>{isAllTypesCreated ? 'Komponen Lengkap' : 'Generate Otomatis'}</span>
              </button>
              <button className="btn-std-primary" onClick={() => handleOpenModal()}>
                <Plus size={20} /> Tambah Komponen
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Modern Filter Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Parameter Penilaian</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun Ajaran</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterAcademicYearId} onChange={e => setFilterAcademicYearId(e.target.value)}>
              <option value="">Pilih Tahun Ajaran...</option>
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
              <option value="">Pilih Semester...</option>
              {semesters.filter(s => s.academicYearId === filterAcademicYearId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tingkat Kelas</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterGradeId} onChange={e => setFilterGradeId(e.target.value)}>
              <option value="">Pilih Tingkat...</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rombel / Kelas</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer disabled:opacity-50" value={filterClassroomId} onChange={e => setFilterClassroomId(e.target.value)} disabled={!filterGradeId}>
              <option value="">Pilih Rombel...</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Pelajaran</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)}>
              <option value="">Pilih Mapel...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Daftar Komponen</h3>
            <p className="text-sm text-slate-500 mt-1">Sebaran bobot persentase penilaian siswa</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`text-xs font-bold uppercase tracking-wider ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>Total Bobot</div>
              <div className={`text-2xl font-black leading-none ${totalWeight === 100 ? 'text-emerald-500' : 'text-red-500'}`}>{totalWeight}%</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${totalWeight === 100 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <PieChart size={24} className={totalWeight === 100 ? 'text-emerald-500' : 'text-red-500'} />
            </div>
          </div>
        </div>

        {!isFiltersComplete ? (
          <div className="p-24 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-6 shadow-sm">
                <Target size={36} className="text-indigo-600" />
             </div>
             <div className="text-xl font-extrabold text-slate-800">Pilih Parameter Penilaian</div>
             <div className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
               Silakan pilih Tahun Ajaran, Semester, Rombel/Kelas, dan Mata Pelajaran terlebih dahulu untuk menampilkan atau mengatur bobot komponen penilaian.
             </div>
          </div>
        ) : (
          <DataTable columns={columns} data={components} loading={loading} emptyMessage="Belum ada komponen penilaian yang diatur untuk kelas dan mapel ini. Silakan tambah komponen baru." />
        )}

        {/* Progress Bar Footer */}
        {(components.length > 0) && (
          <div className="p-6 bg-slate-50/80 border-t border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-slate-600">Distribusi Total Bobot</span>
              {totalWeight === 100 ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-500">
                  <CheckCircle2 size={16} /> Konfigurasi Sempurna
                </span>
              ) : (
                <span className="text-sm font-semibold text-red-500">
                  Sisa {100 - totalWeight}% yang belum dialokasikan
                </span>
              )}
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-in-out ${totalWeight === 100 ? 'bg-emerald-500' : (totalWeight > 100 ? 'bg-red-500' : 'bg-indigo-600')}`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Komponen' : 'Tambah Komponen'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
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
              <option value="">Pilih Rombel...</option>
              {modal.editId ? classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : modalClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Mata Pelajaran" required>
            <select className="input-std disabled:bg-slate-50" value={form.subjectId} onChange={setField('subjectId')} required disabled={!!modal.editId}>
              <option value="">Pilih Mata Pelajaran...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </FormField>

          <div className="h-px bg-slate-200 my-2"></div>
          
          <FormField label="Jenis Penilaian" required>
            <select className="input-std disabled:bg-slate-50" value={form.typeId} onChange={setField('typeId')} required disabled={!!modal.editId}>
              <option value="">Pilih Jenis Penilaian...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
            </select>
          </FormField>

          <FormField label="Bobot Persentase (%)" required>
            <input 
              type="number" 
              className="input-std text-lg font-bold" 
              value={form.weight ?? ''} 
              onChange={setField('weight')} 
              min={0} 
              max={100}
              step="0.01"
              required 
            />
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <span className="text-xs text-slate-500">
                Sisa kuota: <strong className="text-slate-700">{100 - (totalWeight - (modal.editId ? (components.find(c => c.id === modal.editId)?.weight || 0) : 0))}%</strong>
              </span>
            </div>
          </FormField>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
            <button type="button" onClick={handleCloseModal} className="btn-std-secondary" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn-std-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
