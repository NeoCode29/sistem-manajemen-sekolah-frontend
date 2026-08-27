import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentById, updateStudent, createGuardian, updateGuardian, deleteGuardian, createEnrollment, updateEnrollment, deleteEnrollment, type Student, type StudentGuardian, type StudentEnrollment } from '../../api/studentService';
import { getAcademicYears, getSemesters, getClassrooms, type AcademicYear, type Semester, type Classroom } from '../../api/academicService';
import { ArrowLeft, User, BookOpen, CreditCard, Award, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profil');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showConfirm, showAlert } = useDialog();
  const { user } = useAuth();

  const canManageSivitas = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin');

  // Master Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Modal States
  const [showEditProfil, setShowEditProfil] = useState(false);
  const [profilSaving, setProfilSaving] = useState(false);
  const [editProfilData, setEditProfilData] = useState<Partial<Student>>({});

  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianSaving, setGuardianSaving] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<StudentGuardian | null>(null);
  const [guardianData, setGuardianData] = useState<Partial<StudentGuardian>>({});

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentSaving, setEnrollmentSaving] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollment | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<Partial<StudentEnrollment>>({});

  const fetchStudent = async () => {
    if (!id) return;
    try {
      const data = await getStudentById(id);
      setStudent(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [ay, sm, cr] = await Promise.all([
        getAcademicYears(), getSemesters(), getClassrooms()
      ]);
      setAcademicYears(ay);
      setSemesters(sm);
      setClassrooms(cr);
    } catch (err) {
      console.error("Gagal memuat data master akademik", err);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchMasterData();
  }, [id]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // --- PROFIL HANDLERS ---
  const handleOpenEditProfil = () => {
    if (!student) return;
    setEditProfilData({
      nis: student.nis,
      nisn: student.nisn || '',
      fullName: student.fullName,
      gender: student.gender,
      religion: student.religion || '',
      birthPlace: student.birthPlace || '',
      birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
      address: student.address || '',
      status: student.status
    });
    setShowEditProfil(true);
  };

  const handleProfilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      setProfilSaving(true);
      const payload = { ...editProfilData };
      if (!payload.religion) delete payload.religion;
      if (!payload.birthPlace) delete payload.birthPlace;
      if (!payload.birthDate) delete payload.birthDate;
      if (!payload.address) delete payload.address;

      await updateStudent(student.id, payload);
      showSuccess('Profil berhasil diperbarui!');
      setShowEditProfil(false);
      fetchStudent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setProfilSaving(false);
    }
  };

  // --- GUARDIAN HANDLERS ---
  const handleOpenAddGuardian = () => {
    setEditingGuardian(null);
    setGuardianData({ relationship: 'Ayah', isPrimary: false });
    setShowGuardianModal(true);
  };

  const handleOpenEditGuardian = (g: StudentGuardian) => {
    setEditingGuardian(g);
    setGuardianData({ ...g });
    setShowGuardianModal(true);
  };

  const handleGuardianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      setGuardianSaving(true);
      const payload: any = {
        relationship: guardianData.relationship,
        fullName: guardianData.fullName,
        isPrimary: guardianData.isPrimary,
      };
      if (guardianData.phone) payload.phone = guardianData.phone;
      if (guardianData.email) payload.email = guardianData.email;
      if (guardianData.nationalId) payload.nationalId = guardianData.nationalId;
      if (guardianData.occupation) payload.occupation = guardianData.occupation;
      if (guardianData.address) payload.address = guardianData.address;

      if (editingGuardian?.id) {
        await updateGuardian(student.id, editingGuardian.id, payload);
        showSuccess('Data wali berhasil diperbarui!');
      } else {
        await createGuardian(student.id, payload);
        showSuccess('Data wali berhasil ditambahkan!');
      }
      setShowGuardianModal(false);
      fetchStudent();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Gagal menyimpan data wali', 'Gagal');
    } finally {
      setGuardianSaving(false);
    }
  };

  const handleDeleteGuardian = async (gId: string) => {
    if (!student) return;
    showConfirm('Hapus data wali ini?', async () => {
      try {
        await deleteGuardian(student.id, gId);
        showSuccess('Data wali dihapus!');
        fetchStudent();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus data wali', 'Gagal');
      }
    });
  };

  // --- ENROLLMENT HANDLERS ---
  const handleOpenAddEnrollment = () => {
    setEditingEnrollment(null);
    const activeAy = academicYears.find(a => a.isActive)?.id || '';
    const activeSm = semesters.find(s => s.isActive)?.id || '';
    setEnrollmentData({ academicYearId: activeAy, semesterId: activeSm, classroomId: '' });
    setShowEnrollmentModal(true);
  };

  const handleOpenEditEnrollment = (enr: StudentEnrollment) => {
    setEditingEnrollment(enr);
    setEnrollmentData({ ...enr });
    setShowEnrollmentModal(true);
  };

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      setEnrollmentSaving(true);
      const payload: any = {
        academicYearId: enrollmentData.academicYearId,
        semesterId: enrollmentData.semesterId,
        classroomId: enrollmentData.classroomId,
      };
      if (enrollmentData.status) payload.status = enrollmentData.status;
      if (enrollmentData.enrollmentDate) payload.enrollmentDate = enrollmentData.enrollmentDate;

      if (editingEnrollment?.id) {
        await updateEnrollment(student.id, editingEnrollment.id, payload);
        showSuccess('Riwayat kelas diperbarui!');
      } else {
        await createEnrollment(student.id, payload);
        showSuccess('Riwayat kelas ditambahkan!');
      }
      setShowEnrollmentModal(false);
      fetchStudent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan riwayat kelas');
    } finally {
      setEnrollmentSaving(false);
    }
  };

  const handleDeleteEnrollment = async (enrId: string) => {
    if (!student) return;
    showConfirm('Hapus riwayat penempatan kelas ini?', async () => {
      try {
        await deleteEnrollment(student.id, enrId);
        showSuccess('Riwayat kelas dihapus!');
        fetchStudent();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus riwayat kelas', 'Gagal');
      }
    });
  };

  if (loading) return <div className="academic-container">Memuat data...</div>;
  if (!student) return <div className="academic-container">Student not found</div>;

  return (
    <div className="academic-container">
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/entities/students')} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Kembali ke Daftar Siswa
        </button>
      </div>

      {/* Header Card */}
      <div className="student-detail-header" style={{ position: 'relative' }}>
        {canManageSivitas && (
          <button 
            onClick={handleOpenEditProfil}
            className="btn-icon" 
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f3f4f6' }}
            title="Edit Profil"
          >
            <Pencil size={18} />
          </button>
        )}
        <div className="student-detail-avatar">
          {student.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="student-detail-info">
          <h2>{student.fullName}</h2>
          <p>NIS: {student.nis} &bull; NISN: {student.nisn}</p>
          <div>
            <span className={`status-badge ${student.status === 'Aktif' || student.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
              {student.status === 'ACTIVE' ? 'Aktif' : student.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="student-detail-tabs">
        <button className={`student-detail-tab ${activeTab === 'profil' ? 'active' : ''}`} onClick={() => setActiveTab('profil')}>
          <User size={18} /> Profil & Wali
        </button>
        <button className={`student-detail-tab ${activeTab === 'akademik' ? 'active' : ''}`} onClick={() => setActiveTab('akademik')}>
          <BookOpen size={18} /> Akademik
        </button>
        <button className={`student-detail-tab ${activeTab === 'keuangan' ? 'active' : ''}`} onClick={() => setActiveTab('keuangan')}>
          <CreditCard size={18} /> Keuangan
        </button>
        <button className={`student-detail-tab ${activeTab === 'catatan' ? 'active' : ''}`} onClick={() => setActiveTab('catatan')}>
          <Award size={18} /> Catatan
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'profil' && (
          <div className="student-detail-grid">
            <div className="student-detail-card">
              <h3>Informasi Biodata</h3>
              <div className="student-detail-row"><div className="student-detail-label">Jenis Kelamin</div><div className="student-detail-value">{student.gender}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Agama</div><div className="student-detail-value">{student.religion || '-'}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Tempat Lahir</div><div className="student-detail-value">{student.birthPlace || '-'}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Tanggal Lahir</div><div className="student-detail-value">{student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID') : '-'}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Alamat Lengkap</div><div className="student-detail-value">{student.address || '-'}</div></div>
            </div>

            <div className="student-detail-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Data Wali (Guardians)</h3>
                {canManageSivitas && (
                  <button className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={handleOpenAddGuardian}>
                    <Plus size={14} style={{ display: 'inline', marginRight: '4px' }}/> Tambah
                  </button>
                )}
              </div>
              {(!student.guardians || student.guardians.length === 0) ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Belum ada data wali.</p>
              ) : (
                <div>
                  {student.guardians.map((g: any) => (
                    <div key={g.id} className="guardian-item" style={{ position: 'relative' }}>
                      {canManageSivitas && (
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" style={{ background: 'white' }} onClick={() => handleOpenEditGuardian(g)}><Pencil size={14} color="#3b82f6" /></button>
                          <button className="btn-icon" style={{ background: 'white' }} onClick={() => handleDeleteGuardian(g.id)}><Trash2 size={14} color="#ef4444" /></button>
                        </div>
                      )}
                      <div className="guardian-item-name">{g.fullName} <span className="guardian-item-rel">{g.relationship}</span> {g.isPrimary && <span className="guardian-item-rel" style={{ background: '#dcfce7', color: '#166534' }}>Utama</span>}</div>
                      <div className="guardian-item-details">
                        <span><strong>Telepon:</strong> {g.phone || '-'}</span>
                        <span><strong>Pekerjaan:</strong> {g.occupation || '-'}</span>
                        <span><strong>Alamat:</strong> {g.address || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'akademik' && (
          <div className="student-detail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Riwayat Kelas & Penempatan</h3>
              {canManageSivitas && (
                <button className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={handleOpenAddEnrollment}>
                  <Plus size={14} style={{ display: 'inline', marginRight: '4px' }}/> Tambah
                </button>
              )}
            </div>
            {(!student.enrollments || student.enrollments.length === 0) ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Belum ada riwayat penempatan kelas.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tahun Ajaran</th>
                      <th>Semester</th>
                      <th>Kelas</th>
                      <th>Tanggal Masuk</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.enrollments.map((enr: any) => (
                      <tr key={enr.id}>
                        <td>{enr.academicYear?.name || '-'}</td>
                        <td>{enr.semester?.name || '-'}</td>
                        <td className="font-semibold" style={{ color: '#2563eb' }}>{enr.classroom?.name || '-'}</td>
                        <td style={{ color: '#6b7280' }}>{new Date(enr.createdAt).toLocaleDateString('id-ID')}</td>
                        <td style={{ textAlign: 'right' }}>
                          {canManageSivitas && (
                            <>
                              <button className="btn-icon" onClick={() => handleOpenEditEnrollment(enr)}><Pencil size={14} color="#3b82f6" /></button>
                              <button className="btn-icon" onClick={() => handleDeleteEnrollment(enr.id)}><Trash2 size={14} color="#ef4444" /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'keuangan' && (
          <div className="student-detail-empty"><CreditCard size={64} /><h3>Fitur Keuangan</h3><p>Data tagihan SPP dan riwayat pembayaran sedang dalam tahap pengembangan.</p></div>
        )}

        {activeTab === 'catatan' && (
          <div className="student-detail-empty"><Award size={64} /><h3>Catatan Prestasi & Pelanggaran</h3><p>Data kedisiplinan dan pencapaian akademik sedang dalam tahap pengembangan.</p></div>
        )}
      </div>

      {/* MODALS */}
      {showEditProfil && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '700px' }}>
            <div className="modal-header-v4">
              <h2>Edit Profil Siswa</h2>
              <button className="btn-close" onClick={() => setShowEditProfil(false)}>&times;</button>
            </div>
            <form onSubmit={handleProfilSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                <div className="form-group"><label>NIS</label><input type="text" className="input-field" value={editProfilData.nis || ''} onChange={(e)=>setEditProfilData({...editProfilData, nis: e.target.value})} required/></div>
                <div className="form-group"><label>NISN</label><input type="text" className="input-field" value={editProfilData.nisn || ''} onChange={(e)=>setEditProfilData({...editProfilData, nisn: e.target.value})}/></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Nama Lengkap</label><input type="text" className="input-field" value={editProfilData.fullName || ''} onChange={(e)=>setEditProfilData({...editProfilData, fullName: e.target.value})} required/></div>
                <div className="form-group"><label>Jenis Kelamin</label><select className="input-field" value={editProfilData.gender || ''} onChange={(e)=>setEditProfilData({...editProfilData, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                <div className="form-group"><label>Agama</label><input type="text" className="input-field" value={editProfilData.religion || ''} onChange={(e)=>setEditProfilData({...editProfilData, religion: e.target.value})}/></div>
                <div className="form-group"><label>Tempat Lahir</label><input type="text" className="input-field" value={editProfilData.birthPlace || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthPlace: e.target.value})}/></div>
                <div className="form-group"><label>Tanggal Lahir</label><input type="date" className="input-field" value={editProfilData.birthDate || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthDate: e.target.value})}/></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Alamat</label><textarea className="input-field" rows={2} value={editProfilData.address || ''} onChange={(e)=>setEditProfilData({...editProfilData, address: e.target.value})}/></div>
                <div className="form-group"><label>Status Siswa</label><select className="input-field" value={editProfilData.status || ''} onChange={(e)=>setEditProfilData({...editProfilData, status: e.target.value})}><option value="ACTIVE">Aktif</option><option value="TRANSFER">Pindahan</option><option value="GRADUATED">Lulus</option><option value="DROPOUT">Keluar</option></select></div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfil(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={profilSaving}>{profilSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGuardianModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>{editingGuardian ? 'Edit Data Wali' : 'Tambah Data Wali'}</h2>
              <button className="btn-close" onClick={() => setShowGuardianModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleGuardianSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                <div className="form-group"><label>Hubungan <span className="text-red-500">*</span></label><select className="input-field" value={guardianData.relationship || ''} onChange={(e)=>setGuardianData({...guardianData, relationship: e.target.value})}><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Wali">Wali Lainnya</option></select></div>
                <div className="form-group"><label>Nama Lengkap <span className="text-red-500">*</span></label><input type="text" className="input-field" value={guardianData.fullName || ''} onChange={(e)=>setGuardianData({...guardianData, fullName: e.target.value})} required/></div>
                <div className="form-group"><label>No. Telepon</label><input type="text" className="input-field" value={guardianData.phone || ''} onChange={(e)=>setGuardianData({...guardianData, phone: e.target.value})}/></div>
                <div className="form-group"><label>Email</label><input type="email" className="input-field" value={guardianData.email || ''} onChange={(e)=>setGuardianData({...guardianData, email: e.target.value})}/></div>
                <div className="form-group"><label>Pekerjaan</label><input type="text" className="input-field" value={guardianData.occupation || ''} onChange={(e)=>setGuardianData({...guardianData, occupation: e.target.value})}/></div>
                <div className="form-group"><label>NIK / KTP</label><input type="text" className="input-field" value={guardianData.nationalId || ''} onChange={(e)=>setGuardianData({...guardianData, nationalId: e.target.value})}/></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Alamat</label><textarea className="input-field" rows={2} value={guardianData.address || ''} onChange={(e)=>setGuardianData({...guardianData, address: e.target.value})}/></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={guardianData.isPrimary || false} onChange={(e)=>setGuardianData({...guardianData, isPrimary: e.target.checked})} /> Jadikan Wali Utama</label></div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setShowGuardianModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={guardianSaving}>{guardianSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEnrollmentModal && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>{editingEnrollment ? 'Edit Penempatan' : 'Tambah Penempatan'}</h2>
              <button className="btn-close" onClick={() => setShowEnrollmentModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEnrollmentSubmit} className="modal-form-v4">
              <div className="modal-body-v4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group"><label>Tahun Ajaran <span className="text-red-500">*</span></label><select className="input-field" value={enrollmentData.academicYearId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, academicYearId: e.target.value})} required><option value="">Pilih Tahun Ajaran</option>{academicYears.map(ay => (<option key={ay.id} value={ay.id}>{ay.name}</option>))}</select></div>
                <div className="form-group"><label>Semester <span className="text-red-500">*</span></label><select className="input-field" value={enrollmentData.semesterId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, semesterId: e.target.value})} required><option value="">Pilih Semester</option>{semesters.map(sm => (<option key={sm.id} value={sm.id}>{sm.name}</option>))}</select></div>
                <div className="form-group"><label>Kelas <span className="text-red-500">*</span></label><select className="input-field" value={enrollmentData.classroomId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, classroomId: e.target.value})} required><option value="">Pilih Kelas</option>{classrooms.map(cr => (<option key={cr.id} value={cr.id}>{cr.name}</option>))}</select></div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setShowEnrollmentModal(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={enrollmentSaving}>{enrollmentSaving ? 'Menyimpan...' : 'Simpan'}</button>
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
