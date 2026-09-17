import React, { useEffect, useState } from 'react';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, getSubjects, type AcademicYear, type Semester, type Grade, type Classroom, type Subject } from '../../api/academicService';
import { getAssessmentComponents, createAssessmentComponent, updateAssessmentComponent, deleteAssessmentComponent, getAssessmentTypes, generateDefaultComponents, type AssessmentComponent, type AssessmentType } from '../../api/assessmentService';
import { Plus, Target, BookOpen, PieChart, CheckCircle2, Sparkles, Calendar, GraduationCap, Users } from 'lucide-react';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

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

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
    action: async () => {}
  });

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
      notify.error(err, 'Gagal memuat data referensi');
    }
  };

  const fetchClassrooms = async (gid: string) => {
    try {
      const data = await getClassrooms(gid);
      setClassrooms(data);
    } catch (err) {
      notify.error(err, 'Gagal memuat daftar rombel');
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
      notify.error(err, 'Gagal memuat komponen penilaian');
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
        gradeId: '',
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
      notify.error('Pilih kelas, mata pelajaran, tahun ajaran, dan semester terlebih dahulu.');
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
        notify.success('Komponen penilaian berhasil diperbarui');
      } else {
        await createAssessmentComponent(payload);
        notify.success('Komponen penilaian berhasil ditambahkan');
      }

      await fetchComponents();
      handleCloseModal();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan komponen penilaian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Komponen Penilaian',
      message: 'Apakah Anda yakin ingin menghapus komponen penilaian ini? Komponen yang sudah memiliki nilai terkait mungkin akan terpengaruh.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteAssessmentComponent(id);
          notify.success('Komponen penilaian berhasil dihapus');
          await fetchComponents();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus komponen');
        }
      }
    });
  };

  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isFiltersComplete = Boolean(filterClassroomId && filterSubjectId && filterAcademicYearId && filterSemesterId);
  const activeTypes = types.filter(t => t.isActive !== false);
  const existingTypeIds = new Set(components.map(c => (c.typeId || c.type?.id)?.toString()));
  const isAllTypesCreated = isFiltersComplete && activeTypes.length > 0 && activeTypes.every(t => existingTypeIds.has(t.id.toString()));

  const handleGenerateDefault = () => {
    if (!isFiltersComplete || isAllTypesCreated || isGenerating) return;

    setConfirmDialog({
      open: true,
      title: 'Generate Komponen Otomatis',
      message: 'Generate otomatis semua jenis penilaian aktif yang belum ada untuk kelas & mapel ini dengan nilai bobot awal 0%?',
      variant: 'info',
      action: async () => {
        try {
          setIsGenerating(true);
          await generateDefaultComponents({
            classroomId: filterClassroomId,
            subjectId: filterSubjectId,
            academicYearId: filterAcademicYearId,
            semesterId: filterSemesterId
          });
          notify.success('Komponen penilaian default berhasil dibuat');
          await fetchComponents();
        } catch (err: any) {
          notify.error(err, 'Gagal generate komponen penilaian');
        } finally {
          setIsGenerating(false);
        }
      }
    });
  };

  const columns: Column<AssessmentComponent>[] = [
    { 
      key: 'type', 
      header: 'Jenis Penilaian',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 truncate block max-w-[200px]" title={row.type?.name || 'Unknown'}>
              {row.type?.name || 'Unknown'}
            </div>
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
        <div className="text-base font-extrabold text-slate-900 text-center">{row.weight}%</div>
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader
        title="Komponen Penilaian"
        subtitle="Atur struktur penilaian, jenis ujian, dan proporsi bobot untuk perhitungan nilai akhir."
      />

      {/* Parameter Filter Bar (Glassmorphism Standard - No Header, Icon Group Focus) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tahun Ajaran</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate"
                value={filterAcademicYearId}
                onChange={e => setFilterAcademicYearId(e.target.value)}
              >
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}{ay.isActive ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Semester</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate disabled:opacity-50 disabled:cursor-not-allowed" 
                value={filterSemesterId} 
                onChange={e => setFilterSemesterId(e.target.value)}
                disabled={!filterAcademicYearId}
              >
                <option value="">Pilih Semester...</option>
                {semesters.filter(s => s.academicYearId === filterAcademicYearId).map(s => <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat Kelas</label>
            <div className="relative group">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate"
                value={filterGradeId}
                onChange={e => setFilterGradeId(e.target.value)}
              >
                <option value="">Pilih Tingkat...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Rombel / Kelas</label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate disabled:opacity-50 disabled:cursor-not-allowed"
                value={filterClassroomId}
                onChange={e => setFilterClassroomId(e.target.value)}
                disabled={!filterGradeId}
              >
                <option value="">Pilih Rombel...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Mata Pelajaran</label>
            <div className="relative group">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate"
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
              >
                <option value="">Pilih Mapel...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 m-0">Daftar Komponen</h3>
              {isFiltersComplete && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {classrooms.find(c => c.id === filterClassroomId)?.name || 'Kelas'} • {subjects.find(s => s.id === filterSubjectId)?.name || 'Mapel'}
                </span>
              )}
              {isFiltersComplete && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAllTypesCreated 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isAllTypesCreated ? 'Komponen Lengkap' : 'Komponen Sebagian'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Sebaran bobot persentase penilaian siswa</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
            {/* Total Bobot KPI Indicator */}
            {isFiltersComplete && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                totalWeight === 100 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : totalWeight > 100 
                  ? 'bg-rose-50/70 border-rose-200' 
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="text-right">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    totalWeight === 100 ? 'text-emerald-700' : totalWeight > 100 ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    Total Bobot
                  </div>
                  <div className={`text-base font-black leading-none ${
                    totalWeight === 100 ? 'text-emerald-700' : totalWeight > 100 ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    {totalWeight}%
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : totalWeight > 100 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <PieChart size={15} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canManageAssessmentComponents && isFiltersComplete && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateDefault}
                  disabled={isAllTypesCreated || isGenerating}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                    isAllTypesCreated
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 active:scale-95 cursor-pointer shadow-indigo-100'
                  }`}
                  title={
                    isAllTypesCreated
                      ? 'Semua jenis penilaian aktif sudah dibuat'
                      : 'Buat otomatis seluruh jenis penilaian dengan bobot 0%'
                  }
                >
                  <Sparkles size={15} className={isGenerating ? 'animate-spin' : ''} />
                  <span>{isAllTypesCreated ? 'Komponen Lengkap' : 'Generate Otomatis'}</span>
                </button>
                <button 
                  className="btn-std-primary flex items-center gap-1.5 px-4 py-2 text-xs shadow-sm transition-all" 
                  onClick={() => handleOpenModal()}
                >
                  <Plus size={15} /> <span>Tambah Komponen</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner if total weight is not 100% */}
        {isFiltersComplete && totalWeight !== 100 && (
          <div className="px-5 py-2.5 bg-amber-50/90 border-b border-amber-200/80 flex items-center gap-2 text-xs text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              Total pembobotan saat ini <strong>{totalWeight}%</strong>. Sesuaikan bobot masing-masing komponen agar mencapai tepat <strong>100%</strong> untuk perhitungan nilai akhir rapor.
            </span>
          </div>
        )}

        {!isFiltersComplete ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4 shadow-sm text-indigo-600">
                <Target size={30} />
             </div>
             <div className="text-lg font-bold text-slate-800">Pilih Parameter Penilaian</div>
             <div className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
               Silakan pilih Tahun Ajaran, Semester, Rombel/Kelas, dan Mata Pelajaran terlebih dahulu untuk menampilkan atau mengatur bobot komponen penilaian.
             </div>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={components} 
            loading={loading} 
            emptyMessage="Belum ada komponen penilaian yang diatur untuk kelas dan mapel ini. Silakan tambah komponen baru." 
          />
        )}

        {/* Progress Bar Footer */}
        {(components.length > 0) && (
          <div className="p-5 bg-slate-50/80 border-t border-slate-200">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-semibold text-slate-600">Distribusi Total Bobot</span>
              {totalWeight === 100 ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 size={13} /> Konfigurasi Sempurna (100%)
                </Badge>
              ) : totalWeight > 100 ? (
                <Badge variant="danger">
                  Melebihi 100% (+{totalWeight - 100}%)
                </Badge>
              ) : (
                <Badge variant="warning">
                  Sisa {100 - totalWeight}% belum dialokasikan
                </Badge>
              )}
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-in-out ${totalWeight === 100 ? 'bg-emerald-500' : (totalWeight > 100 ? 'bg-rose-500' : 'bg-amber-500')}`}
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

      {/* Dialog Konfirmasi Terstandarisasi */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
};
