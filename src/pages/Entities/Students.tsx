import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getStudentsPaginated, createStudentWizard, deleteStudent, type Student, type CreateStudentWizardPayload } from '../../api/studentService';
import { getAcademicYears, getSemesters, getClassrooms, getMajors, type AcademicYear, type Semester, type Classroom, type Major } from '../../api/academicService';
import { Plus, Trash2, Search, Filter, ChevronLeft, ChevronRight, FileUp } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { useDialog } from '../../contexts/DialogContext';
import { ImportStudentModal } from './ImportStudentModal';
import '../Academic/Academic.css'; 

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Edit modal states moved to StudentDetail.tsx

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Wizard Modal State
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Siswa, 2: Wali, 3: Penempatan

  // Wizard Step 1: Student Data
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [status, setStatus] = useState('ACTIVE');
  const [majorId, setMajorId] = useState('');
  
  // Wizard Step 2: Primary Guardian Data
  const [guardianRel, setGuardianRel] = useState('Ayah');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Wizard Step 3: Enrollment Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  
  const [selectedAy, setSelectedAy] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [createUserAccount, setCreateUserAccount] = useState(true);
  const [activeAyId, setActiveAyId] = useState('');
  const [activeSemId, setActiveSemId] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus) params.status = filterStatus;
      
      const response = await getStudentsPaginated(params);
      setStudents(response.data);
      if (response.meta?.totalPages) {
        setTotalPages(response.meta.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchWizardMasterData = async () => {
    try {
      const [ayData, semData, classData, majorsData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getClassrooms(),
        getMajors()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setClassrooms(classData);
      setMajors(majorsData);
      
      const activeAy = ayData.find(ay => ay.isActive);
      if (activeAy) {
        setSelectedAy(activeAy.id);
        setActiveAyId(activeAy.id);
      }
      
      const activeSem = semData.find(sem => sem.isActive);
      if (activeSem) {
        setSelectedSem(activeSem.id);
        setActiveSemId(activeSem.id);
      }

    } catch (err) {
      console.error("Failed to fetch wizard master data", err);
    }
  };

  useEffect(() => {
    fetchWizardMasterData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, itemsPerPage, searchTerm, filterStatus]);



  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus siswa ini?', async () => {
      try {
        await deleteStudent(id);
        setSuccess('Siswa berhasil dihapus!');
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus siswa');
      }
    });
  };





  // WIZARD HANDLERS
  const closeWizard = () => {
    setShowWizardModal(false);
    setWizardStep(1);
    // Reset forms
    setNis(''); setNisn(''); setFullName(''); setGender('Laki-laki'); setStatus('ACTIVE'); setMajorId('');
    setGuardianRel('Ayah'); setGuardianName(''); setGuardianPhone('');
    setSelectedClass(''); setCreateUserAccount(true);
    setError('');
  };

  const submitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateStudentWizardPayload = {
        nis,
        nisn: nisn || undefined,
        fullName,
        gender,
        status,
        majorId: majorId || undefined,
        guardians: [{
          relationship: guardianRel,
          fullName: guardianName,
          phone: guardianPhone || undefined,
          isPrimary: true
        }],
        enrollment: {
          academicYearId: selectedAy,
          semesterId: selectedSem,
          classroomId: selectedClass || undefined,
        },
        createUserAccount
      };

      await createStudentWizard(payload);
      setSuccess('Siswa baru berhasil didaftarkan secara lengkap!');
      closeWizard();
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftar siswa');
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Siswa & Wali Murid</h1>
          <p className="page-subtitle">Pendaftaran dan manajemen riwayat siswa terpadu</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setIsImportModalOpen(true)}>
            <FileUp size={18} /> Import Excel
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowWizardModal(true)}>
            <Plus size={18} /> Pendaftaran Siswa Baru
          </button>
        </div>
      </div>

      {error && !showWizardModal && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            className="input-field pl-10 w-full" 
            placeholder="Cari NIS, NISN, atau Nama Siswa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="input-field pl-10 w-full"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="GRADUATED">Lulus</option>
            <option value="TRANSFER">Pindahan</option>
            <option value="DROPOUT">Keluar</option>
          </select>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>NIS / NISN</th>
                <th>Nama Lengkap</th>
                <th>Jurusan</th>
                <th>Status</th>
                <th>Kelas Saat Ini</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Memuat data...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data siswa.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="font-semibold">{student.nis}</div>
                      <div className="text-xs text-gray-500">{student.nisn || '-'}</div>
                    </td>
                    <td className="font-semibold">{student.fullName}</td>
                    <td>{student.major?.name || '-'}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                        {student.status === 'ACTIVE' ? 'Aktif' : 
                         student.status === 'TRANSFER' ? 'Pindahan' : 
                         student.status === 'GRADUATED' ? 'Lulus' : 
                         student.status === 'DROPOUT' ? 'Keluar' : 
                         student.status}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const currentEnrollment = student.enrollments?.find(
                          e => e.academicYearId === activeAyId && e.semesterId === activeSemId
                        );
                        return currentEnrollment?.classroom?.name ? (
                          <span className="font-semibold text-gray-700">{currentEnrollment.classroom.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Belum Masuk Kelas</span>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon text-indigo-500 hover:bg-indigo-500/10"
                          onClick={() => navigate(`/entities/students/${student.id}`)}
                          title="Lihat Detail Siswa"
                        >
                          <ChevronRight size={18} />
                        </button>
                        

                        <button 
                          className="btn-icon text-red-400 hover:bg-red-400/10"
                          onClick={() => handleDelete(student.id)}
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && (students.length > 0 || currentPage > 1) && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            hasNextPage={students.length === itemsPerPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* WIZARD MODAL */}
      {showWizardModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>Pendaftaran Siswa Baru</h2>
              <button type="button" className="btn-close" onClick={closeWizard}>&times;</button>
            </div>
            <form onSubmit={wizardStep === 3 ? submitWizard : (e) => { e.preventDefault(); setWizardStep(wizardStep + 1); }} className="modal-form-v4">
              
              {/* WIZARD PROGRESS BAR */}
              <div style={{ padding: '0 24px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '4px', backgroundColor: wizardStep >= 1 ? 'var(--primary-color)' : '#374151', borderRadius: '4px', margin: '0 4px' }} />
                <div style={{ flex: 1, height: '4px', backgroundColor: wizardStep >= 2 ? 'var(--primary-color)' : '#374151', borderRadius: '4px', margin: '0 4px' }} />
                <div style={{ flex: 1, height: '4px', backgroundColor: wizardStep >= 3 ? 'var(--primary-color)' : '#374151', borderRadius: '4px', margin: '0 4px' }} />
              </div>
              <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                <span style={{ color: wizardStep >= 1 ? 'var(--primary-color)' : ''}}>1. Data Siswa</span>
                <span style={{ color: wizardStep >= 2 ? 'var(--primary-color)' : ''}}>2. Data Wali</span>
                <span style={{ color: wizardStep >= 3 ? 'var(--primary-color)' : ''}}>3. Penempatan Kelas</span>
              </div>

              <div className="modal-body-v4 form-grid">
                {error && (
                  <div 
                    className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md text-sm flex items-center gap-2 mb-4" 
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    <span>{error}</span>
                  </div>
                )}
                
                {/* STEP 1 */}
                {wizardStep === 1 && (
                  <>
                    <div className="form-group">
                      <label>NIS <span className="text-red-500">*</span></label>
                      <input type="text" className="input-field" value={nis} onChange={(e) => setNis(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>NISN</label>
                      <input type="text" className="input-field" value={nisn} onChange={(e) => setNisn(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Nama Lengkap Siswa <span className="text-red-500">*</span></label>
                      <input type="text" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Jenis Kelamin</label>
                      <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Jurusan <span className="text-gray-400 text-xs">(Opsional)</span></label>
                      <select className="input-field" value={majorId} onChange={(e) => setMajorId(e.target.value)}>
                        <option value="">-- Tidak Ada Jurusan --</option>
                        {majors.filter(m => m.isActive).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status Masuk</label>
                      <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="ACTIVE">Siswa Baru (Aktif)</option>
                        <option value="TRANSFER">Siswa Pindahan</option>
                      </select>
                    </div>
                  </>
                )}

                {/* STEP 2 */}
                {wizardStep === 2 && (
                  <>
                    <div className="form-group">
                      <label>Hubungan Wali <span className="text-red-500">*</span></label>
                      <select className="input-field" value={guardianRel} onChange={(e) => setGuardianRel(e.target.value)} required>
                        <option value="Ayah">Ayah</option>
                        <option value="Ibu">Ibu</option>
                        <option value="Kakek">Kakek</option>
                        <option value="Nenek">Nenek</option>
                        <option value="Paman">Paman</option>
                        <option value="Bibi">Bibi</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nomor Telepon</label>
                      <input type="text" className="input-field" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Nama Lengkap Wali <span className="text-red-500">*</span></label>
                      <input type="text" className="input-field" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} required />
                    </div>
                  </>
                )}

                {/* STEP 3 */}
                {wizardStep === 3 && (
                  <>
                    <div className="form-group">
                      <label>Tahun Ajaran <span className="text-red-500">*</span></label>
                      <select className="input-field" value={selectedAy} onChange={(e) => setSelectedAy(e.target.value)} required>
                        <option value="">-- Pilih --</option>
                        {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Semester <span className="text-red-500">*</span></label>
                      <select className="input-field" value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)} required>
                        <option value="">-- Pilih --</option>
                        {semesters.filter(s => s.academicYearId === selectedAy).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Rombongan Belajar (Kelas) <span className="text-gray-400 text-sm">(Opsional)</span></label>
                      <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">-- Belum Masuk Kelas --</option>
                        {classrooms.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={createUserAccount} onChange={(e) => setCreateUserAccount(e.target.checked)} />
                        Otomatis Buat Akun Login untuk Siswa (Password default: sama dengan NIS)
                      </label>
                    </div>
                  </>
                )}

              </div>
              <div className="modal-footer-v4" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn-secondary" onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : closeWizard()}>
                  {wizardStep > 1 ? <><ChevronLeft size={16}/> Kembali</> : 'Batal'}
                </button>
                <button type="submit" className="btn-primary">
                  {wizardStep < 3 ? <>Selanjutnya <ChevronRight size={16}/></> : 'Selesaikan Pendaftaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    {/* Import Modal */}
      <ImportStudentModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => { setIsImportModalOpen(false); fetchStudents(); }} 
      />
    </div>
  );
};
