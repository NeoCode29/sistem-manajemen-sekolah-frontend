import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentById, updateStudent, createGuardian, updateGuardian, deleteGuardian, updateEnrollment, type Student, type StudentGuardian, type StudentEnrollment } from '../../api/studentService';
import { getAcademicYears, getSemesters, getClassrooms, getMajors, type AcademicYear, type Semester, type Classroom, type Major } from '../../api/academicService';
import { ArrowLeft, User, BookOpen, Award, Pencil, Plus, Trash2, MapPin, Calendar, Phone, Briefcase, GraduationCap, Users } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../contexts/DialogContext';

import { usePermissions } from '../../hooks/usePermissions';

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
  const { hasPermission } = usePermissions();

  const canUpdateStudent = hasPermission('students.update') || hasPermission('students.write');
  const canManageGuardians = hasPermission('students.manage_guardians') || hasPermission('students.write');
  const canManageEnrollment = hasPermission('classrooms.manage_students') || hasPermission('students.write') || hasPermission('academic.write');

  // Master Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

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
      const [ay, sm, cr, mj] = await Promise.all([
        getAcademicYears(), getSemesters(), getClassrooms(), getMajors()
      ]);
      setAcademicYears(ay);
      setSemesters(sm);
      setClassrooms(cr);
      setMajors(mj);
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
      status: student.status,
      majorId: student.majorId || ''
    });
    setShowEditProfil(true);
  };

  const handleProfilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      setProfilSaving(true);
      const payload: any = { ...editProfilData };
      if (!payload.religion) delete payload.religion;
      if (!payload.birthPlace) delete payload.birthPlace;
      if (!payload.birthDate) delete payload.birthDate;
      if (!payload.address) delete payload.address;
      if (!payload.majorId) {
        payload.majorId = null;
      }

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
      }
      setShowEnrollmentModal(false);
      fetchStudent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan riwayat kelas');
    } finally {
      setEnrollmentSaving(false);
    }
  };

  if (loading) return <div className="academic-container">Memuat data...</div>;
  if (!student) return <div className="academic-container">Student not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-3">{success}</div>}
      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">{error}</div>}

      <div className="mb-6">
        <button onClick={() => navigate('/entities/students')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium text-sm">
          <ArrowLeft size={16} /> Kembali ke Daftar Siswa
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-blue-600 z-0"></div>
        {canUpdateStudent && (
          <button 
            onClick={handleOpenEditProfil}
            className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors" 
            title="Edit Profil"
          >
            <Pencil size={16} />
          </button>
        )}
        <div className="w-32 h-32 shrink-0 bg-white border-4 border-white rounded-full shadow-md flex items-center justify-center text-5xl font-bold text-indigo-600 z-10 mt-6 md:mt-10">
          {student.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left z-10 md:mt-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{student.fullName}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600 mb-3">
            <span className="font-medium">NIS: {student.nis}</span>
            {student.nisn && <><span className="w-1 h-1 rounded-full bg-gray-300"></span><span className="font-medium">NISN: {student.nisn}</span></>}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            {student.major?.name && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100">{student.major.name}</span>
            )}
            <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'TRANSFER' ? 'info' : student.status === 'GRADUATED' ? 'purple' : 'danger'}>
              {student.status === 'ACTIVE' ? 'Aktif' : student.status === 'TRANSFER' ? 'Pindahan' : student.status === 'GRADUATED' ? 'Lulus' : student.status === 'DROPOUT' ? 'Keluar' : student.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'profil', icon: User, label: 'Profil & Wali' },
          { id: 'akademik', icon: BookOpen, label: 'Akademik' },
          { id: 'catatan', icon: Award, label: 'Catatan' },
        ].map(tab => (
          <button 
            key={tab.id}
            className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} /> {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><User size={18} className="text-indigo-500"/> Biodata Siswa</h3>
                </div>
                <div className="p-0">
                  <div className="flex flex-col">
                    <div className="p-4 border-b border-gray-50">
                      <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Jenis Kelamin</div>
                      <div className="text-gray-900 font-medium">{student.gender === 'Laki-laki' || student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                    </div>
                    <div className="p-4 border-b border-gray-50">
                      <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Agama</div>
                      <div className="text-gray-900 font-medium">{student.religion || '-'}</div>
                    </div>
                    <div className="p-4 border-b border-gray-50">
                      <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Tempat, Tanggal Lahir</div>
                      <div className="text-gray-900 font-medium">{student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID') : '-'}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Alamat Lengkap</div>
                      <div className="text-gray-900 font-medium">{student.address || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users size={18} className="text-emerald-500"/> Data Wali Murid</h3>
                  {canManageGuardians && (
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors" onClick={handleOpenAddGuardian}>
                      <Plus size={14}/> Tambah
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {(!student.guardians || student.guardians.length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto text-gray-200 mb-3" />
                      <p>Belum ada data wali murid yang ditambahkan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {student.guardians.map((g: any) => (
                        <div key={g.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm relative group hover:border-indigo-200 transition-colors">
                          {canManageGuardians && (
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" onClick={() => handleOpenEditGuardian(g)}><Pencil size={14} /></button>
                              <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => handleDeleteGuardian(g.id)}><Trash2 size={14} /></button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-bold text-gray-900">{g.fullName}</div>
                            {g.isPrimary && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Utama</span>}
                          </div>
                          <div className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold mb-4">
                            {g.relationship}
                          </div>
                          <div className="flex flex-col gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {g.phone || '-'}</div>
                            <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400"/> {g.occupation || '-'}</div>
                            <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5"/> <span>{g.address || '-'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'akademik' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-blue-500"/> Riwayat Penempatan Kelas</h3>
            </div>
            {(!student.enrollments || student.enrollments.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <GraduationCap size={48} className="mx-auto text-gray-200 mb-3" />
                <p>Belum ada riwayat penempatan kelas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Tahun Ajaran</th>
                      <th className="px-6 py-4">Semester</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4">Tanggal Masuk</th>
                      {canManageEnrollment && <th className="px-6 py-4 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {student.enrollments.map((enr: any) => (
                      <tr key={enr.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{enr.academicYear?.name || '-'}</td>
                        <td className="px-6 py-4 text-gray-900">{enr.semester?.name || '-'}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg">{enr.classroom?.name || '-'}</span></td>
                        <td className="px-6 py-4 text-gray-500">{new Date(enr.createdAt).toLocaleDateString('id-ID')}</td>
                        {canManageEnrollment && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => handleOpenEditEnrollment(enr)}><Pencil size={16} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {activeTab === 'catatan' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Catatan Prestasi & Pelanggaran</h3>
            <p className="text-gray-500 max-w-md mx-auto">Data kedisiplinan dan pencapaian akademik sedang dalam tahap pengembangan.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal 
        open={showEditProfil} 
        onClose={() => setShowEditProfil(false)} 
        title="Edit Profil Siswa" 
        size="lg"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={() => setShowEditProfil(false)}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleProfilSubmit} disabled={profilSaving}>{profilSaving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        }
      >
        <form id="edit-profil-form" onSubmit={handleProfilSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="NIS" required><input type="text" className="input-std" value={editProfilData.nis || ''} onChange={(e)=>setEditProfilData({...editProfilData, nis: e.target.value})} required/></FormField>
            <FormField label="NISN"><input type="text" className="input-std" value={editProfilData.nisn || ''} onChange={(e)=>setEditProfilData({...editProfilData, nisn: e.target.value})}/></FormField>
            <div className="md:col-span-2"><FormField label="Nama Lengkap" required><input type="text" className="input-std" value={editProfilData.fullName || ''} onChange={(e)=>setEditProfilData({...editProfilData, fullName: e.target.value})} required/></FormField></div>
            <FormField label="Jenis Kelamin"><select className="input-std" value={editProfilData.gender || ''} onChange={(e)=>setEditProfilData({...editProfilData, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></FormField>
            <FormField label="Jurusan" hint="(Opsional)"><select className="input-std" value={editProfilData.majorId || ''} onChange={(e)=>setEditProfilData({...editProfilData, majorId: e.target.value})}><option value="">-- Tidak Ada Jurusan --</option>{majors.filter(m => m.isActive).map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}</select></FormField>
            <FormField label="Agama"><input type="text" className="input-std" value={editProfilData.religion || ''} onChange={(e)=>setEditProfilData({...editProfilData, religion: e.target.value})}/></FormField>
            <FormField label="Status Siswa"><select className="input-std" value={editProfilData.status || ''} onChange={(e)=>setEditProfilData({...editProfilData, status: e.target.value})}><option value="ACTIVE">Aktif</option><option value="TRANSFER">Pindahan</option><option value="GRADUATED">Lulus</option><option value="DROPOUT">Keluar</option></select></FormField>
            <FormField label="Tempat Lahir"><input type="text" className="input-std" value={editProfilData.birthPlace || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthPlace: e.target.value})}/></FormField>
            <FormField label="Tanggal Lahir"><input type="date" className="input-std" value={editProfilData.birthDate || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthDate: e.target.value})}/></FormField>
            <div className="md:col-span-2"><FormField label="Alamat"><textarea className="input-std" rows={3} value={editProfilData.address || ''} onChange={(e)=>setEditProfilData({...editProfilData, address: e.target.value})}/></FormField></div>
          </div>
        </form>
      </Modal>

      <Modal 
        open={showGuardianModal} 
        onClose={() => setShowGuardianModal(false)} 
        title={editingGuardian ? 'Edit Data Wali' : 'Tambah Data Wali'}
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={() => setShowGuardianModal(false)}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleGuardianSubmit} disabled={guardianSaving}>{guardianSaving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        }
      >
        <form onSubmit={handleGuardianSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Hubungan" required><select className="input-std" value={guardianData.relationship || ''} onChange={(e)=>setGuardianData({...guardianData, relationship: e.target.value})}><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Wali">Wali Lainnya</option></select></FormField>
            <FormField label="No. Telepon"><input type="text" className="input-std" value={guardianData.phone || ''} onChange={(e)=>setGuardianData({...guardianData, phone: e.target.value})}/></FormField>
            <div className="md:col-span-2"><FormField label="Nama Lengkap" required><input type="text" className="input-std" value={guardianData.fullName || ''} onChange={(e)=>setGuardianData({...guardianData, fullName: e.target.value})} required/></FormField></div>
            <FormField label="Email"><input type="email" className="input-std" value={guardianData.email || ''} onChange={(e)=>setGuardianData({...guardianData, email: e.target.value})}/></FormField>
            <FormField label="Pekerjaan"><input type="text" className="input-std" value={guardianData.occupation || ''} onChange={(e)=>setGuardianData({...guardianData, occupation: e.target.value})}/></FormField>
            <div className="md:col-span-2"><FormField label="NIK / KTP"><input type="text" className="input-std" value={guardianData.nationalId || ''} onChange={(e)=>setGuardianData({...guardianData, nationalId: e.target.value})}/></FormField></div>
            <div className="md:col-span-2"><FormField label="Alamat"><textarea className="input-std" rows={2} value={guardianData.address || ''} onChange={(e)=>setGuardianData({...guardianData, address: e.target.value})}/></FormField></div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={guardianData.isPrimary || false} onChange={(e)=>setGuardianData({...guardianData, isPrimary: e.target.checked})} />
                <span className="text-sm font-semibold text-gray-900">Jadikan Wali Utama</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal 
        open={showEnrollmentModal} 
        onClose={() => setShowEnrollmentModal(false)} 
        title="Edit Penempatan"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={() => setShowEnrollmentModal(false)}>Batal</button>
            <button type="button" className="btn-std-primary" onClick={handleEnrollmentSubmit} disabled={enrollmentSaving}>{enrollmentSaving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        }
      >
        <form onSubmit={handleEnrollmentSubmit} className="p-6">
          <div className="flex flex-col gap-5">
            <FormField label="Tahun Ajaran" required><select className="input-std" value={enrollmentData.academicYearId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, academicYearId: e.target.value})} required><option value="">Pilih Tahun Ajaran</option>{academicYears.map(ay => (<option key={ay.id} value={ay.id}>{ay.name}</option>))}</select></FormField>
            <FormField label="Semester" required><select className="input-std" value={enrollmentData.semesterId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, semesterId: e.target.value})} required><option value="">Pilih Semester</option>{semesters.map(sm => (<option key={sm.id} value={sm.id}>{sm.name}</option>))}</select></FormField>
            <FormField label="Kelas" required><select className="input-std" value={enrollmentData.classroomId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, classroomId: e.target.value})} required><option value="">Pilih Kelas</option>{classrooms.map(cr => (<option key={cr.id} value={cr.id}>{cr.name}</option>))}</select></FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
