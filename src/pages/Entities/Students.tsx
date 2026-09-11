import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, Filter, ChevronLeft, ChevronRight, FileUp, RefreshCw, User, GraduationCap, ChevronDown } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { ImportStudentModal } from './ImportStudentModal';
import { useStudents } from '../../hooks/useStudents';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../contexts/DialogContext';
import { getErrorMessage } from '../../utils/errorHandler';
import { getAcademicYears, getSemesters, getClassrooms, getMajors, type AcademicYear, type Semester, type Classroom, type Major } from '../../api/academicService';

interface WizardForm {
  nis: string;
  nisn: string;
  fullName: string;
  gender: string;
  status: string;
  majorId: string;
  guardianRel: string;
  guardianName: string;
  guardianPhone: string;
  selectedAy: string;
  selectedSem: string;
  selectedClass: string;
  createUserAccount: boolean;
}

const DEFAULT_WIZARD_FORM: WizardForm = {
  nis: '', nisn: '', fullName: '', gender: 'Laki-laki', status: 'ACTIVE', majorId: '',
  guardianRel: 'Ayah', guardianName: '', guardianPhone: '',
  selectedAy: '', selectedSem: '', selectedClass: '', createUserAccount: true
};

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const { showConfirm, showAlert } = useDialog();

  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { items, meta, loading, createWizard, restore, remove, load } = useStudents({
    page: currentPage, limit: itemsPerPage, search: searchTerm, 
    status: filterStatus || undefined, isDeleted: activeTab === 'deleted'
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [wizardModal, setWizardModal] = useState({ open: false, step: 1 });
  const [form, setForm] = useState<WizardForm>(DEFAULT_WIZARD_FORM);

  const setField = (field: keyof WizardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const [masterData, setMasterData] = useState({
    academicYears: [] as AcademicYear[],
    semesters: [] as Semester[],
    classrooms: [] as Classroom[],
    majors: [] as Major[]
  });
  const [activeAyId, setActiveAyId] = useState('');
  const [activeSemId, setActiveSemId] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [ayData, semData, classData, majorsData] = await Promise.all([
          getAcademicYears(), getSemesters(), getClassrooms(), getMajors()
        ]);
        setMasterData({ academicYears: ayData, semesters: semData, classrooms: classData, majors: majorsData });
        
        const activeAy = ayData.find(ay => ay.isActive);
        const activeSem = semData.find(sem => sem.isActive);
        
        if (activeAy) {
          setActiveAyId(activeAy.id);
          setForm(prev => ({ ...prev, selectedAy: activeAy.id }));
        }
        if (activeSem) {
          setActiveSemId(activeSem.id);
          setForm(prev => ({ ...prev, selectedSem: activeSem.id }));
        }
      } catch (err) {
        console.error("Failed to fetch wizard master data", err);
      }
    };
    fetchMasterData();
  }, []);

  const handleRestore = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin me-restore siswa ini?', async () => {
      try { await restore(id); } catch (err: any) { showAlert(getErrorMessage(err, 'Gagal merestore data siswa'), 'Gagal'); }
    });
  };

  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus siswa ini?', async () => {
      try { await remove(id); } catch (err: any) { showAlert(getErrorMessage(err, 'Gagal menghapus data siswa. Data siswa tidak dapat dihapus jika masih terikat riwayat kelas atau nilai.'), 'Gagal'); }
    });
  };

  const closeWizard = () => {
    setWizardModal({ open: false, step: 1 });
    setForm({ ...DEFAULT_WIZARD_FORM, selectedAy: activeAyId, selectedSem: activeSemId });
  };

  const submitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWizard({
        nis: form.nis,
        nisn: form.nisn || undefined,
        fullName: form.fullName,
        gender: form.gender,
        status: form.status,
        majorId: form.majorId || undefined,
        guardians: [{
          relationship: form.guardianRel,
          fullName: form.guardianName,
          phone: form.guardianPhone || undefined,
          isPrimary: true
        }],
        enrollment: {
          academicYearId: form.selectedAy,
          semesterId: form.selectedSem,
          classroomId: form.selectedClass || undefined,
        },
        createUserAccount: form.createUserAccount
      });
      closeWizard();
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Terjadi kesalahan saat mendaftar siswa baru. Pastikan NIS/NISN belum pernah terdaftar sebelumnya.'), 'Gagal');
    }
  };

  const columns: Column<any>[] = [
    { key: 'nis', header: 'NIS / NISN', render: (student) => (
      <div>
        <div className="font-semibold text-gray-900">{student.nis}</div>
        <div className="text-xs text-gray-500 mt-0.5">{student.nisn || '-'}</div>
      </div>
    )},
    { key: 'fullName', header: 'Nama Lengkap', render: (student) => (
      <div>
        <div className="font-semibold text-gray-900">{student.fullName}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {student.gender === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}
        </div>
      </div>
    )},
    { key: 'major', header: 'Jurusan', render: (student) => (
      student.major?.name ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs border border-indigo-100">
          {student.major.name}
        </span>
      ) : <span className="text-gray-400">-</span>
    )},
    { key: 'status', header: 'Status', render: (student) => (
      <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'TRANSFER' ? 'info' : student.status === 'GRADUATED' ? 'purple' : 'danger'}>
        {student.status === 'ACTIVE' ? 'Aktif' : student.status === 'TRANSFER' ? 'Pindahan' : student.status === 'GRADUATED' ? 'Lulus' : student.status === 'DROPOUT' ? 'Keluar' : student.status}
      </Badge>
    )},
    { key: 'class', header: 'Kelas Saat Ini', render: (student) => {
      const currentEnrollment = student.enrollments?.find((e: any) => e.academicYearId === activeAyId && e.semesterId === activeSemId);
      return currentEnrollment?.classroom?.name ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-gray-700">{currentEnrollment.classroom.name}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
          <span className="text-sm text-gray-400 italic">Belum Masuk</span>
        </div>
      );
    }},
    { key: 'actions', header: '', render: (student) => (
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {activeTab === 'active' ? (
          <>
            <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" onClick={() => navigate(`/entities/students/${student.id}`)} title="Lihat Detail Siswa">
              <ChevronRight size={18} />
            </button>
            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(student.id)} title="Hapus">
              <Trash2 size={18} />
            </button>
          </>
        ) : (
          <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" onClick={() => handleRestore(student.id)} title="Restore Siswa">
            <RefreshCw size={18} />
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader title="Siswa & Wali Murid" subtitle="Pendaftaran dan manajemen riwayat siswa terpadu" />
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm" onClick={() => setIsImportModalOpen(true)}>
            <FileUp size={18} className="text-gray-500" /> 
            <span>Import Excel</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => setWizardModal({ open: true, step: 1 })}>
            <Plus size={18} /> 
            <span>Pendaftaran Siswa Baru</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <button className={`pb-3 px-1 text-sm font-semibold transition-colors relative ${activeTab === 'active' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('active'); setCurrentPage(1); }}>
          Daftar Siswa
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button className={`pb-3 px-1 text-sm font-semibold transition-colors relative ${activeTab === 'deleted' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => { setActiveTab('deleted'); setCurrentPage(1); }}>
          Arsip Siswa
          {activeTab === 'deleted' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Cari NIS, NISN, atau Nama Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {activeTab === 'active' && (
          <div className="w-full md:w-64 relative group">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors z-10" size={18} />
            <select className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer relative z-0" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="GRADUATED">Lulus</option>
              <option value="TRANSFER">Pindahan</option>
              <option value="DROPOUT">Keluar</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 flex flex-col">
        <DataTable containerClassName="w-full overflow-x-auto" columns={columns} data={items} loading={loading} emptyMessage={activeTab === 'deleted' ? "Tidak ada siswa di tempat sampah." : "Belum ada data siswa ditemukan."} />
        
        {!loading && meta?.totalPages > 0 && (
          <Pagination currentPage={currentPage} totalPages={meta.totalPages} totalItems={meta.total} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }} />
        )}
      </div>

      <Modal 
        open={wizardModal.open} 
        onClose={closeWizard} 
        title="Pendaftaran Siswa Baru" 
        size="lg"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100 rounded-b-2xl">
            <button type="button" className="btn-std-secondary" onClick={() => wizardModal.step > 1 ? setWizardModal(prev => ({ ...prev, step: prev.step - 1 })) : closeWizard()}>
              {wizardModal.step > 1 ? <><ChevronLeft size={16}/> Kembali</> : 'Batal'}
            </button>
            <button type="button" className="btn-std-primary" onClick={(e) => wizardModal.step === 3 ? submitWizard(e) : setWizardModal(prev => ({ ...prev, step: prev.step + 1 }))}>
              {wizardModal.step < 3 ? <>Selanjutnya <ChevronRight size={16}/></> : 'Selesaikan Pendaftaran'}
            </button>
          </div>
        }
      >
        <form id="wizard-form" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6 p-6">
          <div className="px-2 pt-2 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-300" style={{ width: wizardModal.step === 1 ? '10%' : wizardModal.step === 2 ? '50%' : '100%' }} />
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm transition-colors ${wizardModal.step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm transition-colors ${wizardModal.step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm transition-colors ${wizardModal.step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500">
              <span className={wizardModal.step >= 1 ? 'text-indigo-600' : ''}>Data Siswa</span>
              <span className={wizardModal.step >= 2 ? 'text-indigo-600' : ''}>Data Wali</span>
              <span className={wizardModal.step >= 3 ? 'text-indigo-600' : ''}>Penempatan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {wizardModal.step === 1 && (
                <>
                  <FormField label="NIS" required><input type="text" className="input-std" value={form.nis} onChange={setField('nis')} required /></FormField>
                  <FormField label="NISN"><input type="text" className="input-std" value={form.nisn} onChange={setField('nisn')} /></FormField>
                  <div className="md:col-span-2"><FormField label="Nama Lengkap Siswa" required><input type="text" className="input-std" value={form.fullName} onChange={setField('fullName')} required /></FormField></div>
                  <FormField label="Jenis Kelamin">
                    <select className="input-std" value={form.gender} onChange={setField('gender')}>
                      <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                    </select>
                  </FormField>
                  <FormField label="Jurusan" hint="(Opsional)">
                    <select className="input-std" value={form.majorId} onChange={setField('majorId')}>
                      <option value="">-- Tidak Ada Jurusan --</option>
                      {masterData.majors.filter(m => m.isActive).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Status Masuk">
                      <select className="input-std" value={form.status} onChange={setField('status')}>
                        <option value="ACTIVE">Siswa Baru (Aktif)</option><option value="TRANSFER">Siswa Pindahan</option>
                      </select>
                    </FormField>
                  </div>
                </>
              )}
              {wizardModal.step === 2 && (
                <>
                  <FormField label="Hubungan Wali" required>
                    <select className="input-std" value={form.guardianRel} onChange={setField('guardianRel')} required>
                      <option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Kakek">Kakek</option>
                      <option value="Nenek">Nenek</option><option value="Paman">Paman</option><option value="Bibi">Bibi</option><option value="Lainnya">Lainnya</option>
                    </select>
                  </FormField>
                  <FormField label="Nomor Telepon"><input type="text" className="input-std" value={form.guardianPhone} onChange={setField('guardianPhone')} /></FormField>
                  <div className="md:col-span-2"><FormField label="Nama Lengkap Wali" required><input type="text" className="input-std" value={form.guardianName} onChange={setField('guardianName')} required /></FormField></div>
                </>
              )}
              {wizardModal.step === 3 && (
                <>
                  <FormField label="Tahun Ajaran" required>
                    <select className="input-std" value={form.selectedAy} onChange={setField('selectedAy')} required>
                      <option value="">-- Pilih --</option>
                      {masterData.academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Semester" required>
                    <select className="input-std" value={form.selectedSem} onChange={setField('selectedSem')} required>
                      <option value="">-- Pilih --</option>
                      {masterData.semesters.filter(s => s.academicYearId === form.selectedAy).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Rombongan Belajar (Kelas)" hint="(Opsional)">
                      <select className="input-std" value={form.selectedClass} onChange={setField('selectedClass')}>
                        <option value="">-- Belum Masuk Kelas --</option>
                        {masterData.classrooms.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                      </select>
                    </FormField>
                  </div>
                  <div className="md:col-span-2 mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="pt-0.5"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={form.createUserAccount} onChange={setField('createUserAccount')} /></div>
                      <div><p className="text-sm font-semibold text-gray-900">Buat Akun Akses Sistem</p><p className="text-xs text-gray-600 mt-1">Otomatis membuat akun login untuk siswa ini. Password *default* akan disamakan dengan NIS.</p></div>
                    </label>
                  </div>
                </>
              )}
            </div>
        </form>
      </Modal>

      <ImportStudentModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => { setIsImportModalOpen(false); load(); }} />
    </div>
  );
};
