import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentById, updateStudent, createGuardian, updateGuardian, deleteGuardian, updateEnrollment, type Student, type StudentGuardian, type StudentEnrollment } from '../../api/studentService';
import { getAcademicYears, getSemesters, getClassrooms, getMajors, type AcademicYear, type Semester, type Classroom, type Major } from '../../api/academicService';
import { ArrowLeft, User, BookOpen, Award, Pencil, Plus, Trash2, MapPin, Calendar, Phone, Briefcase, GraduationCap, Users, Loader2 } from 'lucide-react';
import { Modal, FormField, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { notify } from '../../utils/feedback';
import { usePermissions } from '../../hooks/usePermissions';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profil');
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

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

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
      notify.error(err, 'Gagal memuat data siswa');
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
      notify.success('Profil siswa berhasil diperbarui!');
      setShowEditProfil(false);
      fetchStudent();
    } catch (err: any) {
      notify.error(err, 'Gagal memperbarui profil siswa');
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
        notify.success('Data wali berhasil diperbarui!');
      } else {
        await createGuardian(student.id, payload);
        notify.success('Data wali berhasil ditambahkan!');
      }
      setShowGuardianModal(false);
      fetchStudent();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan data wali');
    } finally {
      setGuardianSaving(false);
    }
  };

  const handleDeleteGuardian = (g: StudentGuardian) => {
    if (!student) return;
    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Hapus Data Wali "${g.fullName}"`,
      message: `Apakah Anda yakin ingin menghapus data wali "${g.fullName}" (${g.relationship})? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Wali',
      onConfirm: async () => {
        if (!g.id) return;
        try {
          await deleteGuardian(student.id, String(g.id));
          notify.success(`Data wali "${g.fullName}" berhasil dihapus!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
          fetchStudent();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus data wali');
        }
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
        notify.success('Riwayat penempatan kelas berhasil diperbarui!');
      }
      setShowEnrollmentModal(false);
      fetchStudent();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan riwayat penempatan kelas');
    } finally {
      setEnrollmentSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        Memuat data siswa...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        Data siswa tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <button 
          onClick={() => navigate('/entities/students')} 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium text-sm cursor-pointer"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Siswa
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-blue-600 z-0"></div>
        {canUpdateStudent && (
          <button 
            onClick={handleOpenEditProfil}
            className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors cursor-pointer" 
            title="Edit Profil"
          >
            <Pencil size={16} />
          </button>
        )}
        <div className="w-28 h-28 shrink-0 bg-white border-4 border-white rounded-full shadow-md flex items-center justify-center text-4xl font-bold text-indigo-600 z-10 mt-6 md:mt-8">
          {student.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left z-10 md:mt-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-1 max-w-xl truncate" title={student.fullName}>{student.fullName}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600 mb-3 font-mono">
            <span className="font-semibold">NIS: {student.nis}</span>
            {student.nisn && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>NISN: {student.nisn}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            {student.major?.name && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100 max-w-xs truncate" title={student.major.name}>
                {student.major.name}
              </span>
            )}
            <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'TRANSFER' ? 'info' : student.status === 'GRADUATED' ? 'purple' : 'danger'}>
              {student.status === 'ACTIVE' ? 'Aktif' : student.status === 'TRANSFER' ? 'Pindahan' : student.status === 'GRADUATED' ? 'Lulus' : student.status === 'DROPOUT' ? 'Keluar' : student.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'profil', icon: User, label: 'Profil & Wali' },
          { id: 'akademik', icon: BookOpen, label: 'Akademik' },
          { id: 'catatan', icon: Award, label: 'Catatan' },
        ].map(tab => (
          <button 
            key={tab.id}
            className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} 
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
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><User size={18} className="text-indigo-500"/> Biodata Siswa</h3>
                </div>
                <div className="flex flex-col text-sm">
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
                    <div className="text-gray-900 font-medium break-words">{student.address || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Users size={18} className="text-emerald-500"/> Data Wali Murid</h3>
                  {canManageGuardians && (
                    <button 
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer" 
                      onClick={handleOpenAddGuardian}
                    >
                      <Plus size={14}/> Tambah Wali
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {(!student.guardians || student.guardians.length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-sm">Belum ada data wali murid yang ditambahkan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {student.guardians.map((g: any) => (
                        <div key={g.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-xs relative group hover:border-indigo-200 transition-colors">
                          {canManageGuardians && (
                            <div className="absolute top-3 right-3 flex gap-1">
                              <button 
                                type="button"
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                onClick={() => handleOpenEditGuardian(g)} 
                                title="Edit Wali"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                type="button"
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                                onClick={() => handleDeleteGuardian(g)} 
                                title="Hapus Wali"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1.5 pr-14">
                            <div className="font-bold text-gray-900 text-sm truncate" title={g.fullName}>{g.fullName}</div>
                            {g.isPrimary && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full shrink-0">Utama</span>}
                          </div>
                          <div className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold mb-3">
                            {g.relationship}
                          </div>
                          <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                            <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400 shrink-0"/> <span className="truncate">{g.phone || '-'}</span></div>
                            <div className="flex items-center gap-2"><Briefcase size={13} className="text-gray-400 shrink-0"/> <span className="truncate">{g.occupation || '-'}</span></div>
                            <div className="flex items-start gap-2"><MapPin size={13} className="text-gray-400 mt-0.5 shrink-0"/> <span className="line-clamp-2">{g.address || '-'}</span></div>
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
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><GraduationCap size={18} className="text-blue-500"/> Riwayat Penempatan Kelas</h3>
            </div>
            {(!student.enrollments || student.enrollments.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <GraduationCap size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-medium">Belum ada riwayat penempatan kelas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Tahun Ajaran</th>
                      <th className="px-6 py-4 whitespace-nowrap">Semester</th>
                      <th className="px-6 py-4 whitespace-nowrap">Kelas</th>
                      <th className="px-6 py-4 whitespace-nowrap">Tanggal Masuk</th>
                      {canManageEnrollment && <th className="px-6 py-4 text-right whitespace-nowrap">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {student.enrollments.map((enr: any) => (
                      <tr key={enr.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{enr.academicYear?.name || '-'}</td>
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{enr.semester?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs border border-blue-100">
                            {enr.classroom?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(enr.createdAt).toLocaleDateString('id-ID')}</td>
                        {canManageEnrollment && (
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button 
                              type="button"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                              onClick={() => handleOpenEditEnrollment(enr)}
                              title="Edit Penempatan"
                            >
                              <Pencil size={16} />
                            </button>
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
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Catatan Prestasi & Pelanggaran</h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm">Data kedisiplinan dan pencapaian akademik sedang dalam tahap integrasi modul.</p>
          </div>
        )}
      </div>

      {/* MODAL EDIT PROFIL */}
      <Modal 
        open={showEditProfil} 
        onClose={() => setShowEditProfil(false)} 
        title="Edit Profil Siswa" 
        size="lg"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button 
              type="button" 
              className="btn-std-secondary" 
              onClick={() => setShowEditProfil(false)}
              disabled={profilSaving}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="btn-std-primary" 
              onClick={handleProfilSubmit} 
              disabled={profilSaving}
            >
              {profilSaving && <Loader2 size={16} className="animate-spin" />}
              {profilSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleProfilSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="NIS" required>
              <input type="text" className="input-std" value={editProfilData.nis || ''} onChange={(e)=>setEditProfilData({...editProfilData, nis: e.target.value})} required/>
            </FormField>
            <FormField label="NISN">
              <input type="text" className="input-std" value={editProfilData.nisn || ''} onChange={(e)=>setEditProfilData({...editProfilData, nisn: e.target.value})}/>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Nama Lengkap" required>
                <input type="text" className="input-std" value={editProfilData.fullName || ''} onChange={(e)=>setEditProfilData({...editProfilData, fullName: e.target.value})} required/>
              </FormField>
            </div>
            <FormField label="Jenis Kelamin">
              <select className="input-std" value={editProfilData.gender || ''} onChange={(e)=>setEditProfilData({...editProfilData, gender: e.target.value})}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </FormField>
            <FormField label="Jurusan" hint="(Opsional)">
              <select className="input-std" value={editProfilData.majorId || ''} onChange={(e)=>setEditProfilData({...editProfilData, majorId: e.target.value})}>
                <option value="">-- Tidak Ada Jurusan --</option>
                {majors.filter(m => m.isActive).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Agama">
              <input type="text" className="input-std" value={editProfilData.religion || ''} onChange={(e)=>setEditProfilData({...editProfilData, religion: e.target.value})}/>
            </FormField>
            <FormField label="Status Siswa">
              <select className="input-std" value={editProfilData.status || ''} onChange={(e)=>setEditProfilData({...editProfilData, status: e.target.value})}>
                <option value="ACTIVE">Aktif</option>
                <option value="TRANSFER">Pindahan</option>
                <option value="GRADUATED">Lulus</option>
                <option value="DROPOUT">Keluar</option>
              </select>
            </FormField>
            <FormField label="Tempat Lahir">
              <input type="text" className="input-std" value={editProfilData.birthPlace || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthPlace: e.target.value})}/>
            </FormField>
            <FormField label="Tanggal Lahir">
              <input type="date" className="input-std" value={editProfilData.birthDate || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthDate: e.target.value})}/>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Alamat Lengkap">
                <textarea className="input-std" rows={3} value={editProfilData.address || ''} onChange={(e)=>setEditProfilData({...editProfilData, address: e.target.value})}/>
              </FormField>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL GUARDIAN */}
      <Modal 
        open={showGuardianModal} 
        onClose={() => setShowGuardianModal(false)} 
        title={editingGuardian ? 'Edit Data Wali' : 'Tambah Data Wali'}
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button 
              type="button" 
              className="btn-std-secondary" 
              onClick={() => setShowGuardianModal(false)}
              disabled={guardianSaving}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="btn-std-primary" 
              onClick={handleGuardianSubmit} 
              disabled={guardianSaving}
            >
              {guardianSaving && <Loader2 size={16} className="animate-spin" />}
              {guardianSaving ? 'Menyimpan...' : 'Simpan Data Wali'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleGuardianSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Hubungan" required>
              <select className="input-std" value={guardianData.relationship || ''} onChange={(e)=>setGuardianData({...guardianData, relationship: e.target.value})}>
                <option value="Ayah">Ayah</option>
                <option value="Ibu">Ibu</option>
                <option value="Wali">Wali Lainnya</option>
              </select>
            </FormField>
            <FormField label="No. Telepon">
              <input type="text" className="input-std" value={guardianData.phone || ''} onChange={(e)=>setGuardianData({...guardianData, phone: e.target.value})}/>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Nama Lengkap" required>
                <input type="text" className="input-std" value={guardianData.fullName || ''} onChange={(e)=>setGuardianData({...guardianData, fullName: e.target.value})} required/>
              </FormField>
            </div>
            <FormField label="Email">
              <input type="email" className="input-std" value={guardianData.email || ''} onChange={(e)=>setGuardianData({...guardianData, email: e.target.value})}/>
            </FormField>
            <FormField label="Pekerjaan">
              <input type="text" className="input-std" value={guardianData.occupation || ''} onChange={(e)=>setGuardianData({...guardianData, occupation: e.target.value})}/>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="NIK / No. KTP">
                <input type="text" className="input-std" value={guardianData.nationalId || ''} onChange={(e)=>setGuardianData({...guardianData, nationalId: e.target.value})}/>
              </FormField>
            </div>
            <div className="md:col-span-2">
              <FormField label="Alamat Lengkap">
                <textarea className="input-std" rows={2} value={guardianData.address || ''} onChange={(e)=>setGuardianData({...guardianData, address: e.target.value})}/>
              </FormField>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={guardianData.isPrimary || false} onChange={(e)=>setGuardianData({...guardianData, isPrimary: e.target.checked})} />
                <span className="text-sm font-semibold text-gray-900">Jadikan Wali Utama</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL ENROLLMENT */}
      <Modal 
        open={showEnrollmentModal} 
        onClose={() => setShowEnrollmentModal(false)} 
        title="Edit Penempatan Kelas"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button 
              type="button" 
              className="btn-std-secondary" 
              onClick={() => setShowEnrollmentModal(false)}
              disabled={enrollmentSaving}
            >
              Batal
            </button>
            <button 
              type="button" 
              className="btn-std-primary" 
              onClick={handleEnrollmentSubmit} 
              disabled={enrollmentSaving}
            >
              {enrollmentSaving && <Loader2 size={16} className="animate-spin" />}
              {enrollmentSaving ? 'Menyimpan...' : 'Simpan Penempatan'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleEnrollmentSubmit} className="p-6">
          <div className="flex flex-col gap-5">
            <FormField label="Tahun Ajaran" required>
              <select className="input-std" value={enrollmentData.academicYearId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, academicYearId: e.target.value})} required>
                <option value="">Pilih Tahun Ajaran</option>
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Semester" required>
              <select className="input-std" value={enrollmentData.semesterId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, semesterId: e.target.value})} required>
                <option value="">Pilih Semester</option>
                {semesters.map(sm => (
                  <option key={sm.id} value={sm.id}>{sm.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Rombongan Belajar (Kelas)" required>
              <select className="input-std" value={enrollmentData.classroomId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, classroomId: e.target.value})} required>
                <option value="">Pilih Kelas</option>
                {classrooms.map(cr => (
                  <option key={cr.id} value={cr.id}>{cr.name}</option>
                ))}
              </select>
            </FormField>
          </div>
        </form>
      </Modal>

      {/* Modern Confirm Dialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

