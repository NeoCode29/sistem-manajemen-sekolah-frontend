import React, { useEffect, useState } from 'react';
import { getStudents, createStudentWizard, updateStudent, deleteStudent, getGuardians, updateGuardian, type Student, type StudentGuardian, type CreateStudentWizardPayload } from '../../api/studentService';
import { getAcademicYears, getSemesters, getClassrooms, type AcademicYear, type Semester, type Classroom } from '../../api/academicService';
import { updateUser } from '../../api/rbacService';
import { Plus, CheckCircle, XCircle, Trash2, Pencil, Users as UsersIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import '../Academic/Academic.css'; 

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // View Guardians Modal State
  const [showGuardiansModal, setShowGuardiansModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);

  // Edit Guardian Modal State
  const [showEditGuardianModal, setShowEditGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<StudentGuardian | null>(null);
  const [guardianSaving, setGuardianSaving] = useState(false);
  const [guardianError, setGuardianError] = useState('');
  const [egRelationship, setEgRelationship] = useState('Ayah');
  const [egFullName, setEgFullName] = useState('');
  const [egPhone, setEgPhone] = useState('');
  const [egEmail, setEgEmail] = useState('');
  const [egNationalId, setEgNationalId] = useState('');
  const [egOccupation, setEgOccupation] = useState('');
  const [egAddress, setEgAddress] = useState('');
  const [egIsPrimary, setEgIsPrimary] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editNis, setEditNis] = useState('');
  const [editNisn, setEditNisn] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState('Laki-laki');
  const [editStatus, setEditStatus] = useState('Aktif');

  // Wizard Modal State
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Siswa, 2: Wali, 3: Penempatan

  // Wizard Step 1: Student Data
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [status, setStatus] = useState('ACTIVE');
  
  // Wizard Step 2: Primary Guardian Data
  const [guardianRel, setGuardianRel] = useState('Ayah');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Wizard Step 3: Enrollment Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  const [selectedAy, setSelectedAy] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [createUserAccount, setCreateUserAccount] = useState(true);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchWizardMasterData = async () => {
    try {
      const [ayData, semData, classData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getClassrooms()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setClassrooms(classData);
      
      const activeAy = ayData.find(ay => ay.isActive);
      if (activeAy) setSelectedAy(activeAy.id);
      
      const activeSem = semData.find(sem => sem.isActive);
      if (activeSem) setSelectedSem(activeSem.id);

    } catch (err) {
      console.error("Failed to fetch wizard master data", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchWizardMasterData();
  }, []);

  const handleOpenGuardians = async (student: Student) => {
    setSelectedStudent(student);
    setShowGuardiansModal(true);
    setLoadingGuardians(true);
    try {
      const data = await getGuardians(student.id);
      setGuardians(data);
    } catch (err) {
      console.error("Gagal memuat wali murid");
    } finally {
      setLoadingGuardians(false);
    }
  };

  const refreshGuardians = async () => {
    if (!selectedStudent) return;
    setLoadingGuardians(true);
    try {
      const data = await getGuardians(selectedStudent.id);
      setGuardians(data);
    } catch (err) {
      console.error("Gagal memuat wali murid");
    } finally {
      setLoadingGuardians(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      try {
        await deleteStudent(id);
        setSuccess('Siswa berhasil dihapus!');
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal menghapus siswa');
      }
    }
  };

  const handleToggle = async (student: Student) => {
    const userAccount = student.users?.[0];
    if (!userAccount) {
      setError('Siswa ini belum memiliki akun login.');
      return;
    }
    
    try {
      await updateUser(userAccount.id, { isActive: !userAccount.isActive });
      setSuccess(`Status akun siswa berhasil diubah!`);
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal merubah status akun siswa');
    }
  };

  // EDIT STUDENT HANDLERS
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditNis(student.nis);
    setEditNisn(student.nisn || '');
    setEditFullName(student.fullName);
    setEditGender(student.gender);
    setEditStatus(student.status);
    setEditError('');
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditingStudent(null);
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setEditSaving(true);
      setEditError('');

      const payload: Partial<Student> = {
        nis: editNis,
        nisn: editNisn || undefined,
        fullName: editFullName,
        gender: editGender,
        status: editStatus,
      };

      await updateStudent(editingStudent.id, payload);
      setSuccess('Data siswa berhasil diperbarui!');
      closeEdit();
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Gagal memperbarui data siswa');
    } finally {
      setEditSaving(false);
    }
  };

  // EDIT GUARDIAN HANDLERS
  const handleOpenEditGuardian = (guardian: StudentGuardian) => {
    setEditingGuardian(guardian);
    setEgRelationship(guardian.relationship);
    setEgFullName(guardian.fullName);
    setEgPhone(guardian.phone || '');
    setEgEmail(guardian.email || '');
    setEgNationalId(guardian.nationalId || '');
    setEgOccupation(guardian.occupation || '');
    setEgAddress(guardian.address || '');
    setEgIsPrimary(guardian.isPrimary);
    setGuardianError('');
    setShowEditGuardianModal(true);
  };

  const closeEditGuardian = () => {
    setShowEditGuardianModal(false);
    setEditingGuardian(null);
    setGuardianError('');
  };

  const handleGuardianEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuardian) return;

    try {
      setGuardianSaving(true);
      setGuardianError('');

      const payload: Partial<StudentGuardian> = {
        relationship: egRelationship,
        fullName: egFullName,
        phone: egPhone || undefined,
        email: egEmail || undefined,
        nationalId: egNationalId || undefined,
        occupation: egOccupation || undefined,
        address: egAddress || undefined,
        isPrimary: egIsPrimary,
      };

      if (!selectedStudent) throw new Error("Siswa belum dipilih");

      await updateGuardian(selectedStudent.id, editingGuardian.id!, payload);
      setSuccess('Data wali murid berhasil diperbarui!');
      closeEditGuardian();
      await refreshGuardians();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setGuardianError(err.response?.data?.message || 'Gagal memperbarui data wali murid');
    } finally {
      setGuardianSaving(false);
    }
  };

  // WIZARD HANDLERS
  const closeWizard = () => {
    setShowWizardModal(false);
    setWizardStep(1);
    // Reset forms
    setNis(''); setNisn(''); setFullName(''); setGender('Laki-laki'); setStatus('ACTIVE');
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
        <button className="btn-primary" onClick={() => setShowWizardModal(true)}>
          <Plus size={18} /> Pendaftaran Wizard
        </button>
      </div>

      {error && !showWizardModal && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>NIS / NISN</th>
                <th>Nama Lengkap</th>
                <th>Status</th>
                <th>Akun Aktif</th>
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
                      {student.users && student.users.length > 0 ? (
                        <span className={`status-badge ${student.users[0].isActive ? 'active' : 'inactive'}`}>
                          {student.users[0].isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Tidak Ada Akun</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon text-blue-400 hover:bg-blue-400/10"
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Data Siswa"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          className="btn-icon text-indigo-400 hover:bg-indigo-400/10"
                          onClick={() => handleOpenGuardians(student)}
                          title="Lihat Wali Murid"
                        >
                          <UsersIcon size={18} />
                        </button>
                        {student.users && student.users.length > 0 && (
                          <button 
                            className={`btn-icon ${student.users[0].isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                            onClick={() => handleToggle(student)}
                            title={student.users[0].isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {student.users[0].isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                          </button>
                        )}
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
      </div>

      {/* GUARDIANS MODAL */}
      {showGuardiansModal && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '760px' }}>
            <div className="modal-header-v4">
              <h2>Wali Murid dari {selectedStudent?.fullName}</h2>
              <button type="button" className="btn-close" onClick={() => setShowGuardiansModal(false)}>&times;</button>
            </div>
            <div className="modal-body-v4">
              {loadingGuardians ? (
                <p className="text-center py-4">Memuat data wali...</p>
              ) : guardians.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Belum ada wali yang terdaftar untuk siswa ini.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Hubungan</th>
                        <th>Nama Wali</th>
                        <th>No. Telp</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guardians.map(g => (
                        <tr key={g.id}>
                          <td className="font-semibold">{g.relationship}</td>
                          <td>{g.fullName}</td>
                          <td>{g.phone || '-'}</td>
                          <td>
                            {g.isPrimary && <span className="status-badge active">Wali Utama</span>}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="btn-icon text-blue-400 hover:bg-blue-400/10"
                                onClick={() => handleOpenEditGuardian(g)}
                                title="Edit Wali Murid"
                              >
                                <Pencil size={18} />
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
            <div className="modal-footer-v4">
              <button type="button" className="btn-primary" onClick={() => setShowGuardiansModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GUARDIAN MODAL */}
      {showEditGuardianModal && editingGuardian && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>Edit Wali Murid</h2>
              <button type="button" className="btn-close" onClick={closeEditGuardian}>&times;</button>
            </div>
            <form onSubmit={handleGuardianEditSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {guardianError && <div className="alert alert-error" style={{ gridColumn: '1 / -1' }}>{guardianError}</div>}

                <div className="form-group">
                  <label>Hubungan <span className="text-red-500">*</span></label>
                  <select className="input-field" value={egRelationship} onChange={(e) => setEgRelationship(e.target.value)} required>
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
                  <input type="text" className="input-field" value={egPhone} onChange={(e) => setEgPhone(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Nama Lengkap Wali <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={egFullName} onChange={(e) => setEgFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>NIK</label>
                  <input type="text" className="input-field" value={egNationalId} onChange={(e) => setEgNationalId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Pekerjaan</label>
                  <input type="text" className="input-field" value={egOccupation} onChange={(e) => setEgOccupation(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="input-field" value={egEmail} onChange={(e) => setEgEmail(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Alamat</label>
                  <textarea className="input-field" rows={2} value={egAddress} onChange={(e) => setEgAddress(e.target.value)} />
                </div>
                <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={egIsPrimary} onChange={(e) => setEgIsPrimary(e.target.checked)} />
                    Jadikan sebagai Wali Utama
                  </label>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeEditGuardian}>Batal</button>
                <button type="submit" className="btn-primary" disabled={guardianSaving}>
                  {guardianSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {showEditModal && editingStudent && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>Edit Data Siswa</h2>
              <button type="button" className="btn-close" onClick={closeEdit}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {editError && <div className="alert alert-error" style={{ gridColumn: '1 / -1' }}>{editError}</div>}

                <div className="form-group">
                  <label>NIS <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={editNis} onChange={(e) => setEditNis(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>NISN</label>
                  <input type="text" className="input-field" value={editNisn} onChange={(e) => setEditNisn(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Nama Lengkap Siswa <span className="text-red-500">*</span></label>
                  <input type="text" className="input-field" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select className="input-field" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="input-field" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="ACTIVE">Aktif</option>
                    <option value="TRANSFER">Pindahan</option>
                    <option value="GRADUATED">Lulus</option>
                    <option value="DROPOUT">Keluar</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeEdit}>Batal</button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WIZARD MODAL */}
      {showWizardModal && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>Pendaftaran Siswa Baru (Wizard)</h2>
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
                <span style={{ color: wizardStep >= 1 ? 'var(--primary-color)' : ''}}>1. Identitas Siswa</span>
                <span style={{ color: wizardStep >= 2 ? 'var(--primary-color)' : ''}}>2. Wali Utama</span>
                <span style={{ color: wizardStep >= 3 ? 'var(--primary-color)' : ''}}>3. Penempatan Kelas</span>
              </div>

              <div className="modal-body-v4 form-grid">
                {error && <div className="alert alert-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
                
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
      )}
    </div>
  );
};
