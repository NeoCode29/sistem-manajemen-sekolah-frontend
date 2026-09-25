import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getStudentById, 
  updateStudent, 
  createGuardian, 
  updateGuardian, 
  deleteGuardian, 
  createGuardianAccount,
  resetGuardianPassword,
  updateEnrollment, 
  type Student, 
  type StudentGuardian, 
  type StudentEnrollment 
} from '../../api/studentService';
import { 
  getAcademicYears, 
  getSemesters, 
  getClassrooms, 
  getMajors, 
  type AcademicYear, 
  type Semester, 
  type Classroom, 
  type Major 
} from '../../api/academicService';
import {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
  getOccupations,
  type Province,
  type Regency,
  type District,
  type Village,
  type Occupation,
} from '../../api/referenceService';
import { 
  ArrowLeft, User, BookOpen, Award, Pencil, Plus, Trash2, MapPin, Calendar, 
  Phone, Briefcase, GraduationCap, Users, Loader2, UserX, RefreshCw, Trophy, 
  ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, FileText, CheckCircle2, 
  ChevronRight, HeartPulse, Bus, DollarSign, Home, Shield, Activity, Search, X,
  KeyRound, RotateCcw, Copy, Check, Eye, EyeOff, Zap
} from 'lucide-react';
import { Modal, FormField, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { SearchableDropdown } from '../../components/ui/SearchableDropdown';
import { notify } from '../../utils/feedback';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  getAchievements, 
  getViolations, 
  getStudentPointsSummary, 
  type Achievement, 
  type Violation, 
  type StudentPointsSummary 
} from '../../api/studentAffairsService';

// Dapodik Master Constants
const SPECIAL_NEEDS_OPTIONS = [
  'Tidak Ada',
  'Netra (A)',
  'Rungu (B)',
  'Grahita Ringan (C)',
  'Grahita Sedang (C1)',
  'Daksa Ringan (D)',
  'Daksa Sedang (D1)',
  'Laras (E)',
  'Wicara (F)',
  'Tuna Ganda (G)',
  'Hiperaktif (H)',
  'Cerdas Istimewa (I)',
  'Bakat Istimewa (J)',
  'Kesulitan Belajar (K)',
  'Narkoba (N)',
  'Indigo (O)',
  'Down Syndrome (P)',
  'Autis (Q)',
];

const EDUCATION_OPTIONS = [
  'Tidak Sekolah',
  'PAUD',
  'TK / Sederajat',
  'SD / Sederajat',
  'SMP / Sederajat',
  'SMA / SMK / Sederajat',
  'D1',
  'D2',
  'D3',
  'D4 / S1',
  'S2',
  'S3',
];

const INCOME_OPTIONS = [
  'Tidak Berpenghasilan',
  'Kurang dari Rp 500.000',
  'Rp 500.000 - Rp 999.999',
  'Rp 1.000.000 - Rp 1.999.999',
  'Rp 2.000.000 - Rp 4.999.999',
  'Rp 5.000.000 - Rp 20.000.000',
  'Lebih dari Rp 20.000.000',
];

const TRANSPORTATION_OPTIONS = [
  'Jalan Kaki',
  'Sepeda',
  'Sepeda Motor',
  'Mobil Pribadi',
  'Angkutan Umum / Bus / Angkot',
  'Jemputan Sekolah',
  'Kereta Api',
  'Ojek Online',
  'Perahu / Sampan / Rakit',
  'Lainnya',
];

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profil');
  const { user } = useAuth();
  const { canUpdateStudent, canManageGuardians, canManageEnrollment } = usePermissions();

  // Master Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  // Master References (Wilayah & Pekerjaan)
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loadingWilayah, setLoadingWilayah] = useState(false);

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
  const [profilSubTab, setProfilSubTab] = useState<'utama' | 'kependudukan' | 'fisik' | 'alamat' | 'asal_bantuan'>('utama');
  const [editProfilData, setEditProfilData] = useState<Partial<Student>>({});

  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianSaving, setGuardianSaving] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<StudentGuardian | null>(null);
  const [guardianData, setGuardianData] = useState<Partial<StudentGuardian>>({});
  const [occupationSearch, setOccupationSearch] = useState('');
  const [isOccupationPickerOpen, setIsOccupationPickerOpen] = useState(false);

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentSaving, setEnrollmentSaving] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollment | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<Partial<StudentEnrollment>>({});
  const [filterRelevantClasses, setFilterRelevantClasses] = useState(true);

  // Catatan (Prestasi & Pelanggaran) States
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [pointsSummary, setPointsSummary] = useState<StudentPointsSummary | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesSubTab, setNotesSubTab] = useState<'prestasi' | 'pelanggaran'>('prestasi');

  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} tahun` : null;
  };

  const currentClassroom = student?.enrollments && student.enrollments.length > 0 
    ? student.enrollments[0]?.classroom?.name 
    : null;

  const filteredClassrooms = React.useMemo(() => {
    if (!filterRelevantClasses) return classrooms;
    if (student?.majorId) {
      const matching = classrooms.filter(cr => !cr.majorId || cr.majorId === student.majorId);
      if (matching.length > 0) return matching;
    }
    return classrooms;
  }, [classrooms, filterRelevantClasses, student?.majorId]);

  const filteredOccupations = React.useMemo(() => {
    if (!occupationSearch.trim()) return occupations;
    const q = occupationSearch.toLowerCase();
    return occupations.filter(o => o.name.toLowerCase().includes(q) || (o.category && o.category.toLowerCase().includes(q)));
  }, [occupations, occupationSearch]);

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

  const fetchStudentNotes = async () => {
    if (!id) return;
    try {
      setLoadingNotes(true);
      const [achList, violList, summary] = await Promise.all([
        getAchievements({ studentId: id }).catch(() => []),
        getViolations({ studentId: id }).catch(() => []),
        getStudentPointsSummary(id).catch(() => null),
      ]);
      setAchievements(achList);
      setViolations(violList);
      setPointsSummary(summary);
    } catch (err) {
      console.error('Gagal memuat catatan siswa', err);
      notify.error(err, 'Gagal memuat catatan prestasi & pelanggaran siswa');
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [ay, sm, cr, mj, provs, occs] = await Promise.all([
        getAcademicYears(), 
        getSemesters(), 
        getClassrooms(), 
        getMajors(),
        getProvinces().catch(() => []),
        getOccupations().catch(() => []),
      ]);
      setAcademicYears(ay);
      setSemesters(sm);
      setClassrooms(cr);
      setMajors(mj);
      setProvinces(provs);
      setOccupations(occs);
    } catch (err) {
      console.error("Gagal memuat data master", err);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchMasterData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'catatan') {
      fetchStudentNotes();
    }
  }, [activeTab, id]);

  // Pre-load cascading wilayah when opening modal
  const loadWilayahHierarchy = async (currentStudent: Student, provList: Province[]) => {
    if (!currentStudent.province) return;
    try {
      setLoadingWilayah(true);
      const provMatch = provList.find(p => p.name.toUpperCase() === currentStudent.province?.toUpperCase());
      if (provMatch) {
        const regs = await getRegencies(provMatch.code);
        setRegencies(regs);
        if (currentStudent.city) {
          const regMatch = regs.find(r => r.name.toUpperCase() === currentStudent.city?.toUpperCase());
          if (regMatch) {
            const dists = await getDistricts(regMatch.code);
            setDistricts(dists);
            if (currentStudent.district) {
              const distMatch = dists.find(d => d.name.toUpperCase() === currentStudent.district?.toUpperCase());
              if (distMatch) {
                const vills = await getVillages(distMatch.code);
                setVillages(vills);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error preloading wilayah:', e);
    } finally {
      setLoadingWilayah(false);
    }
  };

  // --- WILAYAH CASCADING CHANGE HANDLERS ---
  const handleProvinceChange = async (provName: string) => {
    const selected = provinces.find(p => p.name === provName);
    setEditProfilData(prev => ({
      ...prev,
      province: provName,
      city: '',
      district: '',
      village: ''
    }));
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (selected) {
      try {
        setLoadingWilayah(true);
        const regs = await getRegencies(selected.code);
        setRegencies(regs);
      } finally {
        setLoadingWilayah(false);
      }
    }
  };

  const handleRegencyChange = async (regName: string) => {
    const selected = regencies.find(r => r.name === regName);
    setEditProfilData(prev => ({
      ...prev,
      city: regName,
      district: '',
      village: ''
    }));
    setDistricts([]);
    setVillages([]);
    if (selected) {
      try {
        setLoadingWilayah(true);
        const dists = await getDistricts(selected.code);
        setDistricts(dists);
      } finally {
        setLoadingWilayah(false);
      }
    }
  };

  const handleDistrictChange = async (distName: string) => {
    const selected = districts.find(d => d.name === distName);
    setEditProfilData(prev => ({
      ...prev,
      district: distName,
      village: ''
    }));
    setVillages([]);
    if (selected) {
      try {
        setLoadingWilayah(true);
        const vills = await getVillages(selected.code);
        setVillages(vills);
      } finally {
        setLoadingWilayah(false);
      }
    }
  };

  // --- PROFIL HANDLERS ---
  const handleOpenEditProfil = async () => {
    if (!canUpdateStudent) {
      notify.error('Anda tidak memiliki izin untuk mengubah data profil siswa.');
      return;
    }
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
      majorId: student.majorId || '',
      // Dapodik fields
      nik: student.nik || '',
      noKk: student.noKk || '',
      birthCertNo: student.birthCertNo || '',
      heightCm: student.heightCm,
      weightKg: student.weightKg,
      headCircumferenceCm: student.headCircumferenceCm,
      bloodType: student.bloodType || '',
      specialNeeds: student.specialNeeds || '',
      illnessHistory: student.illnessHistory || '',
      rt: student.rt || '',
      rw: student.rw || '',
      subVillage: student.subVillage || '',
      village: student.village || '',
      district: student.district || '',
      city: student.city || '',
      province: student.province || '',
      postalCode: student.postalCode || '',
      transportation: student.transportation || '',
      distanceToSchoolKm: student.distanceToSchoolKm,
      travelTimeMinutes: student.travelTimeMinutes,
      previousSchoolNpsn: student.previousSchoolNpsn || '',
      previousSchoolName: student.previousSchoolName || '',
      diplomaNumber: student.diplomaNumber || '',
      skhunNumber: student.skhunNumber || '',
      examParticipantNumber: student.examParticipantNumber || '',
      kipNumber: student.kipNumber || '',
      kpsNumber: student.kpsNumber || '',
      pipEligible: student.pipEligible || false,
      pipReason: student.pipReason || '',
    });
    setProfilSubTab('utama');
    setShowEditProfil(true);

    if (provinces.length > 0) {
      loadWilayahHierarchy(student, provinces);
    }
  };

  const handleProfilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateStudent) {
      notify.error('Anda tidak memiliki izin untuk mengubah data profil siswa.');
      return;
    }
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
      // Numeric cleanup
      if (payload.heightCm !== undefined && payload.heightCm !== '') {
        payload.heightCm = Number(payload.heightCm);
      } else {
        delete payload.heightCm;
      }
      if (payload.weightKg !== undefined && payload.weightKg !== '') {
        payload.weightKg = Number(payload.weightKg);
      } else {
        delete payload.weightKg;
      }
      if (payload.headCircumferenceCm !== undefined && payload.headCircumferenceCm !== '') {
        payload.headCircumferenceCm = Number(payload.headCircumferenceCm);
      } else {
        delete payload.headCircumferenceCm;
      }
      if (payload.distanceToSchoolKm !== undefined && payload.distanceToSchoolKm !== '') {
        payload.distanceToSchoolKm = Number(payload.distanceToSchoolKm);
      } else {
        delete payload.distanceToSchoolKm;
      }
      if (payload.travelTimeMinutes !== undefined && payload.travelTimeMinutes !== '') {
        payload.travelTimeMinutes = Number(payload.travelTimeMinutes);
      } else {
        delete payload.travelTimeMinutes;
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
    if (!canManageGuardians) {
      notify.error('Anda tidak memiliki izin untuk mengelola data orang tua / wali murid.');
      return;
    }
    setEditingGuardian(null);
    setGuardianData({ 
      relationship: 'Ayah', 
      isPrimary: !student?.guardians || student.guardians.length === 0, 
      isAlive: true 
    });
    setOccupationSearch('');
    setIsOccupationPickerOpen(false);
    setShowGuardianModal(true);
  };

  const handleOpenEditGuardian = (g: any) => {
    if (!canManageGuardians) {
      notify.error('Anda tidak memiliki izin untuk mengelola data orang tua / wali murid.');
      return;
    }
    setEditingGuardian(g);
    setGuardianData({ 
      ...g,
      occupationId: g.occupationId ? String(g.occupationId) : (g.occupationRef?.id ? String(g.occupationRef.id) : undefined),
      occupation: g.occupationRef?.name || g.occupation || '',
    });
    setOccupationSearch('');
    setIsOccupationPickerOpen(false);
    setShowGuardianModal(true);
  };

  const handleGuardianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageGuardians) {
      notify.error('Anda tidak memiliki izin untuk mengelola data orang tua / wali murid.');
      return;
    }
    if (!student) return;
    try {
      setGuardianSaving(true);
      const payload: any = {
        relationship: guardianData.relationship,
        fullName: guardianData.fullName,
        isPrimary: guardianData.isPrimary ?? false,
      };
      if (guardianData.phone) payload.phone = guardianData.phone;
      if (guardianData.email) payload.email = guardianData.email;
      if (guardianData.nationalId) payload.nationalId = guardianData.nationalId;
      if (guardianData.nik) payload.nik = guardianData.nik;
      if (guardianData.birthYear) payload.birthYear = Number(guardianData.birthYear);
      if (guardianData.isAlive !== undefined) payload.isAlive = guardianData.isAlive;
      if (guardianData.education) payload.education = guardianData.education;
      if (guardianData.occupationId) payload.occupationId = guardianData.occupationId;
      if (guardianData.occupation) payload.occupation = guardianData.occupation;
      if (guardianData.monthlyIncome) payload.monthlyIncome = guardianData.monthlyIncome;
      if (guardianData.specialNeeds) payload.specialNeeds = guardianData.specialNeeds;
      if (guardianData.address) payload.address = guardianData.address;

      if (editingGuardian?.id) {
        await updateGuardian(student.id, String(editingGuardian.id), payload);
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
    if (!canManageGuardians) {
      notify.error('Anda tidak memiliki izin untuk mengelola data orang tua / wali murid.');
      return;
    }
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

  // --- GUARDIAN ACCOUNT HANDLERS ---
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedGuardianForAccount, setSelectedGuardianForAccount] = useState<StudentGuardian | null>(null);
  const [accountForm, setAccountForm] = useState({ username: '', password: '', name: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleAutoGenerateCredentials = () => {
    if (!student || !selectedGuardianForAccount) return;
    const baseNis = student.nis ? student.nis.trim() : (selectedGuardianForAccount.phone ? selectedGuardianForAccount.phone.slice(-6) : '123456');
    const autoUsername = `wali.${baseNis}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const autoPassword = `Wali#${randomSuffix}`;
    setAccountForm({
      username: autoUsername,
      password: autoPassword,
      name: selectedGuardianForAccount.fullName || `Wali ${student.fullName}`,
    });
  };

  const handleAutoGenerateResetPassword = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setResetPasswordForm({
      newPassword: `Wali#${randomSuffix}`,
    });
  };

  const handleCopyCredentials = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    notify.success('Kredensial berhasil disalin ke clipboard');
  };

  const handleSaveGuardianAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianForAccount?.id) return;
    if (!accountForm.username || !accountForm.password) {
      notify.error('Username dan password wajib diisi');
      return;
    }
    try {
      setAccountSubmitting(true);
      await createGuardianAccount(selectedGuardianForAccount.id, accountForm);
      notify.success(`Akun portal untuk ${selectedGuardianForAccount.fullName} berhasil dibuat!`);
      setShowCreateAccountModal(false);
      fetchStudent();
    } catch (err: any) {
      notify.error(err, 'Gagal membuat akun portal wali');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianForAccount?.id) return;
    if (!resetPasswordForm.newPassword || resetPasswordForm.newPassword.length < 6) {
      notify.error('Password baru minimal 6 karakter');
      return;
    }
    try {
      setAccountSubmitting(true);
      await resetGuardianPassword(selectedGuardianForAccount.id, resetPasswordForm);
      notify.success('Password akun wali murid berhasil di-reset!');
      setShowResetPasswordModal(false);
      fetchStudent();
    } catch (err: any) {
      notify.error(err, 'Gagal me-reset password akun wali');
    } finally {
      setAccountSubmitting(false);
    }
  };

  // --- ENROLLMENT HANDLERS ---
  const handleOpenEditEnrollment = (enr: StudentEnrollment) => {
    if (!canManageEnrollment) {
      notify.error('Anda tidak memiliki izin untuk mengelola penempatan kelas siswa.');
      return;
    }
    setEditingEnrollment(enr);
    setEnrollmentData({
      academicYearId: enr.academicYearId,
      semesterId: enr.semesterId,
      classroomId: enr.classroomId,
      enrollmentDate: enr.enrollmentDate ? new Date(enr.enrollmentDate).toISOString().split('T')[0] : '',
      status: enr.status
    });
    setShowEnrollmentModal(true);
  };

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageEnrollment) {
      notify.error('Anda tidak memiliki izin untuk mengelola penempatan kelas siswa.');
      return;
    }
    if (!student || !editingEnrollment?.id) return;
    try {
      setEnrollmentSaving(true);
      const payload: any = {
        classroomId: enrollmentData.classroomId || null,
        academicYearId: enrollmentData.academicYearId,
        semesterId: enrollmentData.semesterId,
      };
      if (enrollmentData.enrollmentDate) payload.enrollmentDate = enrollmentData.enrollmentDate;
      if (enrollmentData.status) payload.status = enrollmentData.status;

      await updateEnrollment(student.id, editingEnrollment.id, payload);
      notify.success('Data penempatan kelas berhasil diperbarui!');
      setShowEnrollmentModal(false);
      fetchStudent();
    } catch (err: any) {
      notify.error(err, 'Gagal memperbarui penempatan kelas');
    } finally {
      setEnrollmentSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-gray-500">Memuat data siswa...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 max-w-xl mx-auto my-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <UserX size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Data Siswa Tidak Ditemukan</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Data siswa yang diminta tidak dapat dimuat. Pastikan ID siswa valid dan Anda memiliki hak akses yang cukup.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button 
            type="button"
            onClick={() => navigate('/entities/students')}
            className="btn-std-secondary"
          >
            <ArrowLeft size={16} /> Kembali ke Daftar Siswa
          </button>
          <button 
            type="button"
            onClick={() => { setLoading(true); fetchStudent(); }}
            className="btn-std-primary"
          >
            <RefreshCw size={16} /> Coba Lagi
          </button>
        </div>
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
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 z-0"></div>
        {canUpdateStudent && (
          <button 
            onClick={handleOpenEditProfil}
            className="absolute top-4 right-4 sm:top-5 sm:right-6 z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 hover:bg-white/35 text-white rounded-xl backdrop-blur-md transition-all font-medium text-xs shadow-xs border border-white/25 cursor-pointer active:scale-95" 
            title="Edit Profil & Standar Data Dapodik"
          >
            <Pencil size={13} />
            <span>Edit Profil</span>
          </button>
        )}
        <div className="w-28 h-28 shrink-0 bg-white border-4 border-white rounded-2xl shadow-md flex items-center justify-center text-4xl font-extrabold text-indigo-600 z-10 mt-6 md:mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 border-white">
          {student.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left z-10 md:mt-24 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 break-words [overflow-wrap:anywhere]" title={student.fullName}>
            {student.fullName}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs text-gray-600 mb-3 font-mono">
            <span className="font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">NIS: {student.nis}</span>
            {student.nisn && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">NISN: {student.nisn}</span>
            )}
            {student.nik && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">NIK: {student.nik}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {currentClassroom && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200/70 flex items-center gap-1">
                <GraduationCap size={13} /> Kelas {currentClassroom}
              </span>
            )}
            {student.major?.name && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100 max-w-xs truncate" title={student.major.name}>
                {student.major.name}
              </span>
            )}
            <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'TRANSFER' ? 'info' : student.status === 'GRADUATED' ? 'purple' : 'danger'}>
              {student.status === 'ACTIVE' ? 'Aktif' : student.status === 'TRANSFER' ? 'Pindahan' : student.status === 'GRADUATED' ? 'Lulus' : student.status === 'DROPOUT' ? 'Keluar' : student.status}
            </Badge>
            {student.pipEligible && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1">
                <Award size={12} /> Penerima PIP / KIP
              </span>
            )}
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
            {/* Left Column: Data Pokok, Kependudukan, Fisik, Kesejahteraan */}
            <div className="lg:col-span-1 space-y-6">
              {/* Biodata Siswa */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">Biodata Siswa</h3>
                      <p className="text-[11px] text-gray-400 font-normal">Informasi identitas pokok & status</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/80">
                    Pokok
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Jenis Kelamin & Agama */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 font-medium block text-[11px] mb-1">Jenis Kelamin</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs ${
                        student.gender === 'Laki-laki' || student.gender === 'L' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100/70' 
                          : 'bg-pink-50 text-pink-700 border border-pink-100/70'
                      }`}>
                        {student.gender === 'Laki-laki' || student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 font-medium block text-[11px] mb-1">Agama</span>
                      <span className="font-semibold text-gray-900 break-words [overflow-wrap:anywhere] block">
                        {student.religion || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Tempat, Tanggal Lahir & Usia */}
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-500" /> Tempat, Tanggal Lahir
                      </span>
                      {calculateAge(student.birthDate) && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100/60">
                          {calculateAge(student.birthDate)}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-900 font-semibold break-words [overflow-wrap:anywhere] leading-snug">
                      {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </div>
                  </div>

                  {/* Kewarganegaraan & Tanggal Masuk */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 font-medium block text-[11px] mb-1">Kewarganegaraan</span>
                      <span className="font-semibold text-gray-900 break-words [overflow-wrap:anywhere] block">
                        {student.nationality || 'Indonesia (WNI)'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 font-medium block text-[11px] mb-1">Tgl Masuk</span>
                      <span className="font-semibold text-gray-900 break-words [overflow-wrap:anywhere] block">
                        {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Akun Portal Siswa */}
                  <div className="p-2.5 rounded-xl border flex items-center justify-between gap-2 min-w-0 bg-gray-50/50 border-gray-100/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${student.users && student.users.length > 0 && student.users[0]?.isActive !== false ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <span className="text-gray-500 font-medium block text-[11px] leading-tight">Akun Portal Siswa</span>
                        <span className="font-mono text-gray-800 text-[11px] font-semibold truncate block">
                          {student.users && student.users.length > 0 ? `ID: ${student.nis}` : 'Belum diaktifkan'}
                        </span>
                      </div>
                    </div>
                    {student.users && student.users.length > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200/60 shrink-0">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full shrink-0">
                        Nonaktif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Kependudukan Dapodik */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Shield size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">Kependudukan & Dokumen</h3>
                    <p className="text-[11px] text-gray-400 font-normal">Identitas resmi Dapodik Disdukcapil</p>
                  </div>
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                    <span className="text-gray-400 font-medium block text-[11px] mb-1">NIK (KTP / KIA)</span>
                    <span className="font-mono font-bold text-gray-900 tracking-wider text-sm break-all [overflow-wrap:anywhere] select-all block">
                      {student.nik || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                    <span className="text-gray-400 font-medium block text-[11px] mb-1">No. Kartu Keluarga (KK)</span>
                    <span className="font-mono font-bold text-gray-900 tracking-wider text-sm break-all [overflow-wrap:anywhere] select-all block">
                      {student.noKk || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80">
                    <span className="text-gray-400 font-medium block text-[11px] mb-1">No. Registrasi Akta Lahir</span>
                    <span className="font-medium text-gray-900 break-all [overflow-wrap:anywhere] select-all block">
                      {student.birthCertNo || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Periodik Fisik & Kesehatan */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <HeartPulse size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">Periodik Fisik & Kesehatan</h3>
                    <p className="text-[11px] text-gray-400 font-normal">Kondisi fisik & rekam kesehatan siswa</p>
                  </div>
                </div>

                {/* Stat 3-Kolom Metric Boxes */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-gray-50/40 border-b border-gray-100">
                  <div className="p-2.5 bg-white rounded-xl border border-rose-100/80 shadow-xs text-center flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-rose-600 tracking-tight block truncate">Tinggi Badan</span>
                    <div className="mt-1">
                      <span className="text-base font-bold text-gray-900">{student.heightCm ?? '-'}</span>
                      {student.heightCm && <span className="text-[11px] text-gray-400 ml-0.5">cm</span>}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-blue-100/80 shadow-xs text-center flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-blue-600 tracking-tight block truncate">Berat Badan</span>
                    <div className="mt-1">
                      <span className="text-base font-bold text-gray-900">{student.weightKg ?? '-'}</span>
                      {student.weightKg && <span className="text-[11px] text-gray-400 ml-0.5">kg</span>}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-100/80 shadow-xs text-center flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-purple-600 tracking-tight block truncate">Lingkar Kepala</span>
                    <div className="mt-1">
                      <span className="text-base font-bold text-gray-900">{student.headCircumferenceCm ?? '-'}</span>
                      {student.headCircumferenceCm && <span className="text-[11px] text-gray-400 ml-0.5">cm</span>}
                    </div>
                  </div>
                </div>

                {/* Key-Value Details dengan Safe Word Breaking */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Golongan Darah</span>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md font-bold text-xs">
                      {student.bloodType ? `Golongan ${student.bloodType}` : '-'}
                    </span>
                  </div>

                  <div>
                    <div className="text-gray-400 font-medium text-[11px] mb-1 flex items-center justify-between">
                      <span>Kebutuhan Khusus</span>
                      {student.specialNeeds && student.specialNeeds !== 'Tidak Ada' && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200/60">Perhatian</span>
                      )}
                    </div>
                    <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100/80 font-medium text-gray-900 break-words [overflow-wrap:anywhere] leading-relaxed">
                      {student.specialNeeds || 'Tidak Ada'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 font-medium text-[11px] mb-1">Riwayat Penyakit</div>
                    <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100/80 text-gray-800 break-words [overflow-wrap:anywhere] leading-relaxed max-h-48 overflow-y-auto">
                      {student.illnessHistory ? student.illnessHistory : (
                        <span className="text-gray-400 italic">Tidak ada catatan riwayat penyakit</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kesejahteraan Siswa (PIP/KIP/KPS) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <DollarSign size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">Kesejahteraan Siswa</h3>
                    <p className="text-[11px] text-gray-400 font-normal">Program bantuan & perlindungan sosial</p>
                  </div>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Status Kelayakan PIP</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${student.pipEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {student.pipEligible ? 'Layak PIP' : 'Tidak / Mandiri'}
                    </span>
                  </div>
                  {student.pipEligible && student.pipReason && (
                    <div>
                      <span className="text-[11px] text-gray-400 font-medium block mb-1">Alasan Layak PIP</span>
                      <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50 text-amber-900 font-medium break-words [overflow-wrap:anywhere] leading-relaxed">
                        {student.pipReason}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-gray-50 gap-2">
                    <span className="text-gray-400 font-medium shrink-0">No. KIP</span>
                    <span className="font-mono font-semibold text-gray-900 break-all [overflow-wrap:anywhere] text-right">{student.kipNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 gap-2">
                    <span className="text-gray-400 font-medium shrink-0">No. KPS</span>
                    <span className="font-mono font-semibold text-gray-900 break-all [overflow-wrap:anywhere] text-right">{student.kpsNumber || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Wali Murid, Alamat Wilayah, Transportasi, Asal Sekolah */}
            <div className="lg:col-span-2 space-y-6">
              {/* Data Wali Murid */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">Data Orang Tua / Wali Murid</h3>
                      <p className="text-xs text-gray-400 font-normal">Kontak & data wali terdaftar di Dapodik</p>
                    </div>
                  </div>
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
                    <div className="text-center py-10 text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <Users size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Belum ada data orang tua atau wali murid.</p>
                      <p className="text-xs text-gray-400 mt-0.5">Tambahkan data wali untuk melengkapi identitas Dapodik siswa.</p>
                      {canManageGuardians && (
                        <button
                          type="button"
                          onClick={handleOpenAddGuardian}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          <Plus size={14} /> Tambah Wali Sekarang
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${student.guardians.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                      {student.guardians.map((g: any) => (
                        <div key={g.id} className="p-4.5 border border-gray-100 rounded-2xl bg-white shadow-xs hover:shadow-sm hover:border-indigo-100/90 transition-all flex flex-col justify-between relative group">
                          <div>
                            {/* Card Header: Avatar, Name, Badges, Action Buttons */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-2xs border ${
                                  g.relationship?.toLowerCase().includes('ibu') 
                                    ? 'bg-rose-50 text-rose-600 border-rose-100/80' 
                                    : g.relationship?.toLowerCase().includes('ayah')
                                    ? 'bg-blue-50 text-blue-600 border-blue-100/80'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100/80'
                                }`}>
                                  {g.fullName ? g.fullName.charAt(0).toUpperCase() : <User size={18} />}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-900 text-sm sm:text-base break-words [overflow-wrap:anywhere] leading-snug" title={g.fullName}>
                                    {g.fullName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded-md text-[11px]">
                                      {g.relationship}
                                    </span>
                                    <span className={`px-2 py-0.5 font-medium rounded-md text-[11px] ${
                                      g.isAlive === false ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                      {g.isAlive === false ? 'Meninggal' : 'Hidup'}
                                    </span>
                                    {g.isPrimary && (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[11px] flex items-center gap-1">
                                        <CheckCircle2 size={11} /> Utama
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {canManageGuardians && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button 
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                                    onClick={() => handleOpenEditGuardian(g)} 
                                    title="Edit Data Wali"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button 
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                    onClick={() => handleDeleteGuardian(g)} 
                                    title="Hapus Data Wali"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Card Body: Structured 2-Column Attributes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5 pt-3.5 border-t border-gray-100 text-xs">
                              {/* Pekerjaan */}
                              <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                                <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1 mb-1">
                                  <Briefcase size={12} className="text-indigo-500 shrink-0" /> Pekerjaan
                                </span>
                                <div className="font-semibold text-gray-900 break-words [overflow-wrap:anywhere]">
                                  {g.occupationRef?.name || g.occupation || <span className="text-gray-400 font-normal italic">Belum diisi</span>}
                                </div>
                                {g.occupationRef?.category && (
                                  <span className="inline-block mt-1 text-[10px] text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/60 truncate max-w-full">
                                    {g.occupationRef.category}
                                  </span>
                                )}
                              </div>

                              {/* Telepon */}
                              <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                                <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1 mb-1">
                                  <Phone size={12} className="text-emerald-500 shrink-0" /> No. Telepon / WA
                                </span>
                                <div className="font-mono font-semibold text-gray-900 break-all [overflow-wrap:anywhere]">
                                  {g.phone || <span className="font-sans text-gray-400 font-normal italic">Belum diisi</span>}
                                </div>
                              </div>

                              {/* NIK */}
                              <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                                <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1 mb-1">
                                  <Shield size={12} className="text-sky-500 shrink-0" /> NIK (KTP)
                                </span>
                                <div className="font-mono font-semibold text-gray-900 break-all [overflow-wrap:anywhere]">
                                  {g.nik || g.nationalId || <span className="font-sans text-gray-400 font-normal italic">-</span>}
                                </div>
                              </div>

                              {/* Pendidikan & Lahir */}
                              <div className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                                <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1 mb-1">
                                  <GraduationCap size={12} className="text-teal-500 shrink-0" /> Pendidikan & Lahir
                                </span>
                                <div className="font-semibold text-gray-900 break-words [overflow-wrap:anywhere]">
                                  {g.education || '-'} {g.birthYear ? `• Thn ${g.birthYear}` : ''}
                                </div>
                              </div>

                              {/* Penghasilan Bulanan (jika ada) */}
                              {g.monthlyIncome && (
                                <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/70 min-w-0 sm:col-span-2">
                                  <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1 mb-0.5">
                                    <DollarSign size={12} className="text-emerald-600 shrink-0" /> Penghasilan Bulanan
                                  </span>
                                  <div className="font-bold text-emerald-900 break-words [overflow-wrap:anywhere]">
                                    {g.monthlyIncome}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Alamat Lengkap */}
                            <div className="mt-2.5 p-2.5 bg-gray-50/70 rounded-xl border border-gray-100/80 flex items-start gap-2 text-xs min-w-0">
                              <MapPin size={13} className="text-amber-500 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-gray-400 text-[11px] font-medium block mb-0.5">Alamat Tempat Tinggal:</span>
                                <span className="text-gray-800 font-medium break-words [overflow-wrap:anywhere] leading-relaxed block">
                                  {g.address || <span className="text-gray-400 font-normal italic">Alamat belum diisi</span>}
                                </span>
                              </div>
                            </div>

                            {/* Seksi Akun Portal Wali (Khusus Wali Utama / isPrimary) */}
                            {g.isPrimary && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                {g.userAccount ? (
                                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/80 flex flex-wrap items-center justify-between gap-2.5">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                                        <KeyRound size={12} className="text-indigo-600 shrink-0" /> Akun Portal Wali (Aktif)
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-xs sm:text-sm text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-200/80 select-all shadow-2xs">
                                          {g.userAccount.username}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                          Aktif
                                        </span>
                                      </div>
                                    </div>
                                    {canManageGuardians && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedGuardianForAccount(g);
                                          setResetPasswordForm({ newPassword: '' });
                                          setShowPassword(false);
                                          setShowResetPasswordModal(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                      >
                                        <RotateCcw size={12} /> Reset Password
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                                        Akses Portal Wali
                                      </span>
                                      <span className="text-xs text-amber-600 font-medium">
                                        Belum dibuatkan akun login
                                      </span>
                                    </div>
                                    {canManageGuardians && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedGuardianForAccount(g);
                                          const baseNis = student?.nis ? student.nis.trim() : (g.phone ? g.phone.slice(-6) : '123456');
                                          setAccountForm({
                                            username: `wali.${baseNis}`,
                                            password: `Wali#${Math.floor(1000 + Math.random() * 9000)}`,
                                            name: g.fullName || `Wali ${student?.fullName || ''}`,
                                          });
                                          setShowPassword(false);
                                          setShowCreateAccountModal(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                                      >
                                        <KeyRound size={13} /> + Buat Akun Portal
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Alamat & Wilayah Domisili Terstruktur */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">Alamat & Wilayah Domisili</h3>
                    <p className="text-xs text-gray-400 font-normal">Tempat tinggal peserta didik berdasar hierarki wilayah</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block mb-1">Alamat Lengkap (Jalan / Gang / No Rumah)</span>
                    <div className="text-sm font-medium text-gray-900 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 break-words [overflow-wrap:anywhere] leading-relaxed">
                      {student.address || 'Belum diisi'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">RT / RW</span>
                      <span className="font-semibold text-gray-800 break-words [overflow-wrap:anywhere] block">{student.rt || '-'}/{student.rw || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">Dusun / Lingkungan</span>
                      <span className="font-semibold text-gray-800 break-words [overflow-wrap:anywhere] block">{student.subVillage || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">Kelurahan / Desa</span>
                      <span className="font-semibold text-gray-800 break-words [overflow-wrap:anywhere] block">{student.village || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">Kecamatan</span>
                      <span className="font-semibold text-gray-800 break-words [overflow-wrap:anywhere] block">{student.district || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0 sm:col-span-2">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">Kabupaten / Kota</span>
                      <span className="font-semibold text-gray-800 break-words [overflow-wrap:anywhere] block">{student.city || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">Provinsi</span>
                      <span className="font-semibold text-gray-800 break-words [overflow-wrap:anywhere] block">{student.province || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                      <span className="text-gray-400 block text-[11px] mb-1 font-medium">Kode Pos</span>
                      <span className="font-semibold text-gray-800 font-mono break-all [overflow-wrap:anywhere] block">{student.postalCode || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transportasi & Jarak Tempuh */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bus size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">Transportasi & Jarak Tempuh</h3>
                    <p className="text-xs text-gray-400 font-normal">Akses perjalanan harian siswa ke sekolah</p>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/70 min-w-0">
                    <span className="text-indigo-600 block mb-1 font-semibold text-[11px]">Moda Transportasi</span>
                    <span className="font-bold text-gray-900 text-sm break-words [overflow-wrap:anywhere] block">{student.transportation || 'Belum diisi'}</span>
                  </div>
                  <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/70 min-w-0">
                    <span className="text-blue-600 block mb-1 font-semibold text-[11px]">Jarak ke Sekolah</span>
                    <span className="font-bold text-gray-900 text-sm block">
                      {student.distanceToSchoolKm ? `${student.distanceToSchoolKm} km` : '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/70 min-w-0">
                    <span className="text-emerald-600 block mb-1 font-semibold text-[11px]">Waktu Tempuh</span>
                    <span className="font-bold text-gray-900 text-sm block">
                      {student.travelTimeMinutes ? `${student.travelTimeMinutes} menit` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Asal Sekolah & Ijazah Sebelumnya */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">Asal Sekolah & Dokumen Kelulusan</h3>
                    <p className="text-xs text-gray-400 font-normal">Riwayat jenjang pendidikan sebelumnya</p>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                    <span className="text-gray-400 block mb-1 font-medium text-[11px]">Nama Sekolah Asal Sebelumnya</span>
                    <span className="font-semibold text-gray-900 text-sm break-words [overflow-wrap:anywhere] block">{student.previousSchoolName || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                    <span className="text-gray-400 block mb-1 font-medium text-[11px]">NPSN Sekolah Asal</span>
                    <span className="font-mono font-semibold text-gray-800 text-sm break-all [overflow-wrap:anywhere] block">{student.previousSchoolNpsn || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                    <span className="text-gray-400 block mb-1 font-medium text-[11px]">No. Seri Ijazah Sebelumnya</span>
                    <span className="font-mono font-semibold text-gray-800 break-all [overflow-wrap:anywhere] block">{student.diplomaNumber || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0">
                    <span className="text-gray-400 block mb-1 font-medium text-[11px]">No. SKHUN / Surat Keterangan Lulus</span>
                    <span className="font-mono font-semibold text-gray-800 break-all [overflow-wrap:anywhere] block">{student.skhunNumber || '-'}</span>
                  </div>
                  <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 min-w-0 sm:col-span-2">
                    <span className="text-gray-400 block mb-1 font-medium text-[11px]">No. Peserta Ujian Nasional / Asesmen</span>
                    <span className="font-mono font-semibold text-gray-800 break-all [overflow-wrap:anywhere] block">{student.examParticipantNumber || '-'}</span>
                  </div>
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
          <div className="space-y-6">
            {/* Header & Refresh */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kedisiplinan & Pencapaian Siswa</h3>
                <p className="text-sm text-gray-500">
                  Ringkasan akumulasi poin pembinaan, prestasi akademik/non-akademik, dan rekam jejak tata tertib.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchStudentNotes}
                disabled={loadingNotes}
                className="btn-std-secondary self-start md:self-auto cursor-pointer"
              >
                <RefreshCw size={14} className={loadingNotes ? 'animate-spin text-indigo-600' : ''} />
                Segarkan Catatan
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Prestasi</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Trophy size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-900">{pointsSummary?.totalAchievementPoints ?? achievements.length}</div>
                <p className="text-xs text-emerald-700/80 mt-1 font-medium">Pencapaian dan penghargaan tercatat</p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Pelanggaran</span>
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <ShieldAlert size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-rose-900">{pointsSummary?.totalViolationPoints ?? violations.length}</div>
                <p className="text-xs text-rose-700/80 mt-1 font-medium">Insiden tata tertib tercatat</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Poin Pelanggaran</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-indigo-950">{pointsSummary?.totalViolationPoints ?? 0} Poin</div>
                <p className="text-xs text-indigo-700/80 mt-1 font-medium">
                  Status: <span className="font-semibold text-indigo-900">{pointsSummary?.spStatus || 'SAFE'}</span>
                </p>
              </div>
            </div>

            {/* Subtabs for Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 flex px-6 pt-3 gap-6">
                <button
                  type="button"
                  onClick={() => setNotesSubTab('prestasi')}
                  className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer relative ${
                    notesSubTab === 'prestasi' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Trophy size={16} /> Prestasi ({achievements.length})
                  {notesSubTab === 'prestasi' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full" />}
                </button>
                <button
                  type="button"
                  onClick={() => setNotesSubTab('pelanggaran')}
                  className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer relative ${
                    notesSubTab === 'pelanggaran' ? 'text-rose-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ShieldAlert size={16} /> Pelanggaran ({violations.length})
                  {notesSubTab === 'pelanggaran' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-t-full" />}
                </button>
              </div>

              <div className="p-6">
                {loadingNotes ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                    <span className="text-xs">Memuat riwayat...</span>
                  </div>
                ) : notesSubTab === 'prestasi' ? (
                  achievements.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Trophy size={48} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm font-medium">Belum ada prestasi yang tercatat untuk siswa ini.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                          <tr>
                            <th className="px-6 py-3.5">Tanggal</th>
                            <th className="px-6 py-3.5">Nama Prestasi</th>
                            <th className="px-6 py-3.5">Tingkat</th>
                            <th className="px-6 py-3.5">Kategori</th>
                            <th className="px-6 py-3.5 text-right">Poin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {achievements.map((ach) => (
                            <tr key={ach.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                {ach.eventDate ? new Date(ach.eventDate).toLocaleDateString('id-ID') : (ach.date ? new Date(ach.date).toLocaleDateString('id-ID') : '-')}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">{ach.title}</div>
                                {ach.description && <div className="text-xs text-gray-500 line-clamp-1">{ach.description}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="info">{ach.level}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                                {ach.category || 'Umum'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                                +{ach.points ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  violations.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <ShieldCheck size={48} className="mx-auto text-emerald-200 mb-2" />
                      <p className="text-sm font-medium text-emerald-700">Tidak ada rekam jejak pelanggaran. Siswa memiliki catatan disiplin yang baik.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                          <tr>
                            <th className="px-6 py-3.5">Tanggal</th>
                            <th className="px-6 py-3.5">Pelanggaran</th>
                            <th className="px-6 py-3.5">Tingkat / Kategori</th>
                            <th className="px-6 py-3.5">Tindakan / Sanksi</th>
                            <th className="px-6 py-3.5 text-right">Poin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {violations.map((viol) => (
                            <tr key={viol.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                {viol.violationDate ? new Date(viol.violationDate).toLocaleDateString('id-ID') : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">{viol.title || viol.violationType?.name}</div>
                                {viol.notes && <div className="text-xs text-gray-500 line-clamp-1">{viol.notes}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={
                                  (viol.category || viol.violationType?.category) === 'BERAT' 
                                    ? 'danger' 
                                    : (viol.category || viol.violationType?.category) === 'SEDANG' 
                                    ? 'warning' 
                                    : 'default'
                                }>
                                  {viol.category || viol.violationType?.category || 'Umum'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-600">
                                {viol.actionTaken ? (
                                  <span className="font-medium text-gray-800">{viol.actionTaken}</span>
                                ) : (
                                  <span className="text-gray-400 italic">Belum ada tindakan</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-rose-600">
                                -{viol.points ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT PROFIL SISWA (TABBED) */}
      <Modal 
        open={showEditProfil} 
        onClose={() => setShowEditProfil(false)} 
        title="Edit Profil & Standar Data Dapodik Siswa" 
        size="xl"
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
        <div className="p-6">
          {/* Subtabs Header */}
          <div className="flex border-b border-gray-200 overflow-x-auto mb-6 gap-2">
            {[
              { id: 'utama', label: 'Data Pokok' },
              { id: 'kependudukan', label: 'Kependudukan' },
              { id: 'fisik', label: 'Periodik Fisik' },
              { id: 'alamat', label: 'Alamat & Wilayah' },
              { id: 'asal_bantuan', label: 'Asal Sekolah & Bantuan' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`pb-2.5 px-3 text-xs font-bold transition-colors whitespace-nowrap border-b-2 -mb-px ${
                  profilSubTab === t.id 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-800'
                }`}
                onClick={() => setProfilSubTab(t.id as any)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleProfilSubmit}>
            {/* SUBTAB 1: DATA POKOK */}
            {profilSubTab === 'utama' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField label="Jenis Kelamin" required>
                  <select className="input-std" value={editProfilData.gender || ''} onChange={(e)=>setEditProfilData({...editProfilData, gender: e.target.value})} required>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </FormField>
                <FormField label="Status Siswa">
                  <select className="input-std" value={editProfilData.status || ''} onChange={(e)=>setEditProfilData({...editProfilData, status: e.target.value})}>
                    <option value="ACTIVE">Aktif</option>
                    <option value="TRANSFER">Pindahan</option>
                    <option value="GRADUATED">Lulus</option>
                    <option value="DROPOUT">Keluar</option>
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
                  <select className="input-std" value={editProfilData.religion || ''} onChange={(e)=>setEditProfilData({...editProfilData, religion: e.target.value})}>
                    <option value="">-- Pilih Agama --</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </FormField>
                <FormField label="Tempat Lahir">
                  <input type="text" className="input-std" value={editProfilData.birthPlace || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthPlace: e.target.value})}/>
                </FormField>
                <FormField label="Tanggal Lahir">
                  <input type="date" className="input-std" value={editProfilData.birthDate || ''} onChange={(e)=>setEditProfilData({...editProfilData, birthDate: e.target.value})}/>
                </FormField>
              </div>
            )}

            {/* SUBTAB 2: KEPENDUDUKAN & DOKUMEN */}
            {profilSubTab === 'kependudukan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Nomor Induk Kependudukan (NIK Siswa)" hint="16 digit sesuai Kartu Identitas Anak / KK">
                    <input 
                      type="text" 
                      maxLength={16}
                      className="input-std font-mono" 
                      placeholder="Contoh: 3201015505080002"
                      value={editProfilData.nik || ''} 
                      onChange={(e)=>setEditProfilData({...editProfilData, nik: e.target.value})}
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Nomor Kartu Keluarga (No. KK)" hint="16 digit sesuai KK resmi Disdukcapil">
                    <input 
                      type="text" 
                      maxLength={16}
                      className="input-std font-mono" 
                      placeholder="Contoh: 3201012503100005"
                      value={editProfilData.noKk || ''} 
                      onChange={(e)=>setEditProfilData({...editProfilData, noKk: e.target.value})}
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="No. Registrasi Akta Lahir" hint="Nomor registrasi yang tercantum pada Akta Kelahiran">
                    <input 
                      type="text" 
                      className="input-std" 
                      placeholder="Contoh: 3201-LT-25032010-0012"
                      value={editProfilData.birthCertNo || ''} 
                      onChange={(e)=>setEditProfilData({...editProfilData, birthCertNo: e.target.value})}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* SUBTAB 3: PERIODIK FISIK & KESEHATAN */}
            {profilSubTab === 'fisik' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Tinggi Badan (cm)">
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input-std" 
                    placeholder="Contoh: 165"
                    value={editProfilData.heightCm ?? ''} 
                    onChange={(e)=>setEditProfilData({...editProfilData, heightCm: e.target.value ? Number(e.target.value) : undefined})}
                  />
                </FormField>
                <FormField label="Berat Badan (kg)">
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input-std" 
                    placeholder="Contoh: 54.5"
                    value={editProfilData.weightKg ?? ''} 
                    onChange={(e)=>setEditProfilData({...editProfilData, weightKg: e.target.value ? Number(e.target.value) : undefined})}
                  />
                </FormField>
                <FormField label="Lingkar Kepala (cm)">
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input-std" 
                    placeholder="Contoh: 52"
                    value={editProfilData.headCircumferenceCm ?? ''} 
                    onChange={(e)=>setEditProfilData({...editProfilData, headCircumferenceCm: e.target.value ? Number(e.target.value) : undefined})}
                  />
                </FormField>
                <div className="md:col-span-1">
                  <FormField label="Golongan Darah">
                    <select 
                      className="input-std" 
                      value={editProfilData.bloodType || ''} 
                      onChange={(e)=>setEditProfilData({...editProfilData, bloodType: e.target.value})}
                    >
                      <option value="">-- Pilih Gol Darah --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="Tidak Tahu">Tidak Tahu</option>
                    </select>
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Kebutuhan Khusus">
                    <SearchableDropdown
                      options={SPECIAL_NEEDS_OPTIONS}
                      value={editProfilData.specialNeeds || ''}
                      onChange={(val) => setEditProfilData({...editProfilData, specialNeeds: val})}
                      placeholder="-- Pilih Kebutuhan Khusus --"
                      maxVisible={5}
                    />
                  </FormField>
                </div>
                <div className="md:col-span-3">
                  <FormField label="Riwayat Penyakit Pernah Diderita">
                    <textarea 
                      className="input-std" 
                      rows={2} 
                      placeholder="Tuliskan riwayat penyakit kronis/alergi berat bila ada..."
                      value={editProfilData.illnessHistory || ''} 
                      onChange={(e)=>setEditProfilData({...editProfilData, illnessHistory: e.target.value})}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* SUBTAB 4: ALAMAT & WILAYAH (CASCADING) */}
            {profilSubTab === 'alamat' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Alamat Lengkap (Jalan / Gang / RT / RW)">
                    <textarea 
                      className="input-std" 
                      rows={2} 
                      placeholder="Contoh: Jl. Pahlawan No. 45 RT 02 RW 05"
                      value={editProfilData.address || ''} 
                      onChange={(e)=>setEditProfilData({...editProfilData, address: e.target.value})}
                    />
                  </FormField>
                </div>
                <FormField label="RT">
                  <input type="text" className="input-std" placeholder="002" value={editProfilData.rt || ''} onChange={(e)=>setEditProfilData({...editProfilData, rt: e.target.value})}/>
                </FormField>
                <FormField label="RW">
                  <input type="text" className="input-std" placeholder="005" value={editProfilData.rw || ''} onChange={(e)=>setEditProfilData({...editProfilData, rw: e.target.value})}/>
                </FormField>
                <FormField label="Dusun / Lingkungan">
                  <input type="text" className="input-std" placeholder="Dusun Cibinong" value={editProfilData.subVillage || ''} onChange={(e)=>setEditProfilData({...editProfilData, subVillage: e.target.value})}/>
                </FormField>
                <FormField label="Kode Pos">
                  <input type="text" className="input-std font-mono" placeholder="16911" value={editProfilData.postalCode || ''} onChange={(e)=>setEditProfilData({...editProfilData, postalCode: e.target.value})}/>
                </FormField>

                {/* Cascading Wilayah Master Dropdowns */}
                <div className="md:col-span-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-3">
                    Master Wilayah Indonesia {loadingWilayah && <Loader2 size={12} className="inline animate-spin text-indigo-600 ml-2" />}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Provinsi">
                      <SearchableDropdown
                        options={provinces.map(p => p.name)}
                        value={editProfilData.province || ''}
                        onChange={(val) => handleProvinceChange(val)}
                        placeholder="-- Pilih Provinsi --"
                        maxVisible={6}
                      />
                    </FormField>

                    <FormField label="Kabupaten / Kota">
                      <SearchableDropdown
                        options={regencies.map(r => r.name)}
                        value={editProfilData.city || ''}
                        onChange={(val) => handleRegencyChange(val)}
                        placeholder={regencies.length === 0 ? '-- Pilih Provinsi Terlebih Dahulu --' : '-- Pilih Kabupaten/Kota --'}
                        disabled={!editProfilData.province || regencies.length === 0}
                        maxVisible={6}
                      />
                    </FormField>

                    <FormField label="Kecamatan">
                      <SearchableDropdown
                        options={districts.map(d => d.name)}
                        value={editProfilData.district || ''}
                        onChange={(val) => handleDistrictChange(val)}
                        placeholder={districts.length === 0 ? '-- Pilih Kab/Kota Terlebih Dahulu --' : '-- Pilih Kecamatan --'}
                        disabled={!editProfilData.city || districts.length === 0}
                        maxVisible={6}
                      />
                    </FormField>

                    <FormField label="Kelurahan / Desa">
                      <SearchableDropdown
                        options={villages.map(v => v.name)}
                        value={editProfilData.village || ''}
                        onChange={(val) => setEditProfilData({...editProfilData, village: val})}
                        placeholder={villages.length === 0 ? '-- Pilih Kecamatan Terlebih Dahulu --' : '-- Pilih Desa/Kelurahan --'}
                        disabled={!editProfilData.district || villages.length === 0}
                        maxVisible={6}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Transportasi */}
                <div className="md:col-span-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-3">Transportasi & Jarak</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Moda Transportasi">
                      <SearchableDropdown
                        options={TRANSPORTATION_OPTIONS}
                        value={editProfilData.transportation || ''}
                        onChange={(val) => setEditProfilData({...editProfilData, transportation: val})}
                        placeholder="-- Pilih Transportasi --"
                        maxVisible={6}
                      />
                    </FormField>
                    <FormField label="Jarak ke Sekolah (km)">
                      <input 
                        type="number" 
                        step="0.1" 
                        className="input-std" 
                        placeholder="Contoh: 3.5"
                        value={editProfilData.distanceToSchoolKm ?? ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, distanceToSchoolKm: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </FormField>
                    <FormField label="Waktu Tempuh (menit)">
                      <input 
                        type="number" 
                        className="input-std" 
                        placeholder="Contoh: 20"
                        value={editProfilData.travelTimeMinutes ?? ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, travelTimeMinutes: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: ASAL SEKOLAH & BANTUAN */}
            {profilSubTab === 'asal_bantuan' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-3">Asal Sekolah & Kelulusan</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nama Sekolah Asal Sebelumnya">
                      <input 
                        type="text" 
                        className="input-std" 
                        placeholder="Contoh: SMPN 1 / MTs / SDN 01"
                        value={editProfilData.previousSchoolName || ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, previousSchoolName: e.target.value})}
                      />
                    </FormField>
                    <FormField label="NPSN Sekolah Asal">
                      <input 
                        type="text" 
                        className="input-std font-mono" 
                        placeholder="Contoh: 20200123"
                        value={editProfilData.previousSchoolNpsn || ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, previousSchoolNpsn: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Nomor Seri Ijazah Sebelumnya">
                      <input 
                        type="text" 
                        className="input-std font-mono" 
                        placeholder="Contoh: DN-02/DI-06/0012345"
                        value={editProfilData.diplomaNumber || ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, diplomaNumber: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Nomor SKHUN / Surat Keterangan Lulus">
                      <input 
                        type="text" 
                        className="input-std font-mono" 
                        placeholder="Nomor SKHUN / SKL"
                        value={editProfilData.skhunNumber || ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, skhunNumber: e.target.value})}
                      />
                    </FormField>
                    <div className="md:col-span-2">
                      <FormField label="Nomor Peserta Ujian Nasional / Asesmen">
                        <input 
                          type="text" 
                          className="input-std font-mono" 
                          value={editProfilData.examParticipantNumber || ''} 
                          onChange={(e)=>setEditProfilData({...editProfilData, examParticipantNumber: e.target.value})}
                        />
                      </FormField>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-3">Kesejahteraan & Bantuan Pemerintah</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                          checked={editProfilData.pipEligible || false} 
                          onChange={(e)=>setEditProfilData({...editProfilData, pipEligible: e.target.checked})} 
                        />
                        <span className="text-sm font-semibold text-gray-900">Siswa Berhak Menerima PIP / Bantuan Afirmasi</span>
                      </label>
                    </div>
                    {editProfilData.pipEligible && (
                      <div className="md:col-span-2">
                        <FormField label="Alasan Layak PIP">
                          <input 
                            type="text" 
                            className="input-std" 
                            placeholder="Contoh: Pemegang PKH / KPS / Daerah 3T"
                            value={editProfilData.pipReason || ''} 
                            onChange={(e)=>setEditProfilData({...editProfilData, pipReason: e.target.value})}
                          />
                        </FormField>
                      </div>
                    )}
                    <FormField label="Nomor KIP (Kartu Indonesia Pintar)">
                      <input 
                        type="text" 
                        className="input-std font-mono" 
                        placeholder="Contoh: KIP-123456"
                        value={editProfilData.kipNumber || ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, kipNumber: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Nomor KPS / KKS">
                      <input 
                        type="text" 
                        className="input-std font-mono" 
                        placeholder="Contoh: KPS-987654"
                        value={editProfilData.kpsNumber || ''} 
                        onChange={(e)=>setEditProfilData({...editProfilData, kpsNumber: e.target.value})}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>

      {/* MODAL GUARDIAN (ORANG TUA / WALI) */}
      <Modal 
        open={showGuardianModal} 
        onClose={() => setShowGuardianModal(false)} 
        title={editingGuardian ? 'Edit Data Wali Murid' : 'Tambah Data Orang Tua / Wali Murid'}
        size="lg"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Hubungan" required>
              <select className="input-std" value={guardianData.relationship || ''} onChange={(e)=>setGuardianData({...guardianData, relationship: e.target.value})}>
                <option value="Ayah">Ayah Kandung</option>
                <option value="Ibu">Ibu Kandung</option>
                <option value="Wali">Wali</option>
                <option value="Kakek/Nenek">Kakek / Nenek</option>
                <option value="Paman/Bibi">Paman / Bibi</option>
                <option value="Kakak">Kakak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </FormField>

            <FormField label="Status Hidup">
              <select 
                className="input-std" 
                value={guardianData.isAlive === false ? 'false' : 'true'} 
                onChange={(e)=>setGuardianData({...guardianData, isAlive: e.target.value === 'true'})}
              >
                <option value="true">Masih Hidup</option>
                <option value="false">Sudah Meninggal</option>
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Nama Lengkap Wali" required>
                <input type="text" className="input-std" value={guardianData.fullName || ''} onChange={(e)=>setGuardianData({...guardianData, fullName: e.target.value})} required/>
              </FormField>
            </div>

            <FormField label="NIK (Nomor Induk Kependudukan)">
              <input 
                type="text" 
                maxLength={16}
                className="input-std font-mono" 
                placeholder="16 digit NIK"
                value={guardianData.nik || guardianData.nationalId || ''} 
                onChange={(e)=>setGuardianData({...guardianData, nik: e.target.value, nationalId: e.target.value})}
              />
            </FormField>

            <FormField label="Tahun Lahir">
              <input 
                type="number" 
                className="input-std" 
                placeholder="Contoh: 1980"
                value={guardianData.birthYear ?? ''} 
                onChange={(e)=>setGuardianData({...guardianData, birthYear: e.target.value ? Number(e.target.value) : undefined})}
              />
            </FormField>

            <FormField label="Pendidikan Terakhir">
              <select 
                className="input-std" 
                value={guardianData.education || ''} 
                onChange={(e)=>setGuardianData({...guardianData, education: e.target.value})}
              >
                <option value="">-- Pilih Pendidikan --</option>
                {EDUCATION_OPTIONS.map(ed => (
                  <option key={ed} value={ed}>{ed}</option>
                ))}
              </select>
            </FormField>

            {/* Pekerjaan (Searchable Master Data Combobox) */}
            <div className="md:col-span-2">
              <FormField label="Pekerjaan (Master Data)">
                {guardianData.occupationId ? (
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Briefcase size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 break-words [overflow-wrap:anywhere]">
                          {guardianData.occupation || occupations.find(o => o.id === guardianData.occupationId)?.name}
                        </div>
                        {occupations.find(o => o.id === guardianData.occupationId)?.category && (
                          <div className="text-[11px] text-indigo-600 font-medium">
                            Kategori: {occupations.find(o => o.id === guardianData.occupationId)?.category}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shrink-0 cursor-pointer"
                      onClick={() => {
                        setGuardianData({ ...guardianData, occupationId: undefined, occupation: '' });
                        setOccupationSearch('');
                        setIsOccupationPickerOpen(true);
                      }}
                    >
                      Ganti / Hapus
                    </button>
                  </div>
                ) : (
                  <div className="relative space-y-1.5">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                      <input 
                        type="text" 
                        className="input-std pl-9 pr-8 text-xs" 
                        placeholder="Ketik untuk mencari pekerjaan (contoh: Guru, Pedagang, Wiraswasta, PNS)..."
                        value={occupationSearch}
                        onChange={(e) => {
                          setOccupationSearch(e.target.value);
                          setIsOccupationPickerOpen(true);
                        }}
                        onFocus={() => setIsOccupationPickerOpen(true)}
                      />
                      {occupationSearch && (
                        <button
                          type="button"
                          onClick={() => setOccupationSearch('')}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {isOccupationPickerOpen && (
                      <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl divide-y divide-gray-50 z-30">
                        {filteredOccupations.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs text-gray-500 mb-2">Tidak ditemukan opsi pekerjaan untuk "{occupationSearch}"</p>
                            {occupationSearch.trim() && (
                              <button
                                type="button"
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                onClick={() => {
                                  setGuardianData({ ...guardianData, occupationId: undefined, occupation: occupationSearch });
                                  setIsOccupationPickerOpen(false);
                                }}
                              >
                                + Gunakan "{occupationSearch}" sebagai teks manual
                              </button>
                            )}
                          </div>
                        ) : (
                          filteredOccupations.map(occ => (
                            <button
                              key={occ.id}
                              type="button"
                              className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-indigo-50/80 transition-colors text-xs cursor-pointer group"
                              onClick={() => {
                                setGuardianData({
                                  ...guardianData,
                                  occupationId: occ.id,
                                  occupation: occ.name
                                });
                                setOccupationSearch('');
                                setIsOccupationPickerOpen(false);
                              }}
                            >
                              <span className="font-medium text-gray-900 group-hover:text-indigo-700">{occ.name}</span>
                              {occ.category && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                                  {occ.category}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </FormField>
            </div>

            <FormField label="Penghasilan Bulanan">
              <select 
                className="input-std" 
                value={guardianData.monthlyIncome || ''} 
                onChange={(e)=>setGuardianData({...guardianData, monthlyIncome: e.target.value})}
              >
                <option value="">-- Pilih Penghasilan --</option>
                {INCOME_OPTIONS.map(inc => (
                  <option key={inc} value={inc}>{inc}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Kebutuhan Khusus">
              <SearchableDropdown
                options={SPECIAL_NEEDS_OPTIONS}
                value={guardianData.specialNeeds || ''}
                onChange={(val) => setGuardianData({...guardianData, specialNeeds: val})}
                placeholder="-- Pilih Kebutuhan Khusus --"
                maxVisible={5}
              />
            </FormField>

            <FormField label="No. Telepon / WhatsApp">
              <input type="text" className="input-std" value={guardianData.phone || ''} onChange={(e)=>setGuardianData({...guardianData, phone: e.target.value})}/>
            </FormField>

            <FormField label="Email">
              <input type="email" className="input-std" value={guardianData.email || ''} onChange={(e)=>setGuardianData({...guardianData, email: e.target.value})}/>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Alamat Tempat Tinggal">
                <textarea className="input-std" rows={2} value={guardianData.address || ''} onChange={(e)=>setGuardianData({...guardianData, address: e.target.value})}/>
              </FormField>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={guardianData.isPrimary || false} onChange={(e)=>setGuardianData({...guardianData, isPrimary: e.target.checked})} />
                <span className="text-sm font-semibold text-gray-900">Jadikan Sebagai Wali Utama</span>
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
            {/* Warning Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Perhatian Mutasi Rombel:</span>
                <p className="text-amber-700 leading-relaxed">
                  Mengubah kelas siswa pada semester aktif akan memindahkan penempatan presensi dan penilaian siswa ke rombel baru. Pastikan kelas tujuan memiliki kuota yang mencukupi dan belum ada rapor resmi yang divalidasi.
                </p>
              </div>
            </div>

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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Rombongan Belajar (Kelas) <span className="text-rose-500">*</span></label>
                {student?.majorId && (
                  <button
                    type="button"
                    onClick={() => setFilterRelevantClasses(!filterRelevantClasses)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {filterRelevantClasses ? 'Tampilkan Semua Rombel' : 'Filter Sesuai Jurusan'}
                  </button>
                )}
              </div>
              <select className="input-std" value={enrollmentData.classroomId || ''} onChange={(e)=>setEnrollmentData({...enrollmentData, classroomId: e.target.value})} required>
                <option value="">Pilih Kelas</option>
                {filteredClassrooms.map(cr => (
                  <option key={cr.id} value={cr.id}>
                    {cr.name} {cr.capacity ? `(Kapasitas: ${cr.capacity} siswa)` : ''}
                  </option>
                ))}
              </select>
              {filterRelevantClasses && student?.majorId && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Menampilkan kelas yang sesuai dengan jurusan siswa.
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Buat Akun Portal Wali */}
      <Modal
        isOpen={showCreateAccountModal}
        onClose={() => !accountSubmitting && setShowCreateAccountModal(false)}
        title="Buat Akun Portal Wali Murid"
        subtitle={
          selectedGuardianForAccount
            ? `Wali: ${selectedGuardianForAccount.fullName} • Siswa: ${student?.fullName || '-'}`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              onClick={() =>
                handleCopyCredentials(
                  `Akun Portal Wali Murid:\nUsername: ${accountForm.username}\nPassword: ${accountForm.password}\nSiswa: ${student?.fullName || '-'}`
                )
              }
              title="Salin username dan password ke clipboard"
            >
              {copiedNotification ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedNotification ? 'Tersalin!' : 'Salin Kredensial'}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-std-secondary"
                onClick={() => setShowCreateAccountModal(false)}
                disabled={accountSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-std-primary"
                onClick={handleSaveGuardianAccount}
                disabled={accountSubmitting}
              >
                {accountSubmitting && <Loader2 size={16} className="animate-spin" />}
                {accountSubmitting ? 'Membuat Akun...' : 'Simpan Akun'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSaveGuardianAccount} className="p-6 space-y-4">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100/90 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-950">Generator Cepat Kredensial</span>
                <button
                  type="button"
                  onClick={handleAutoGenerateCredentials}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Zap size={12} /> Generate Ulang
                </button>
              </div>
              <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
                Kredensial otomatis dibuat berdasarkan format standar (<span className="font-mono">wali.[nis]</span>). Anda tetap dapat mengubahnya secara manual sebelum menyimpan.
              </p>
            </div>
          </div>

          <FormField label="Username Login" required helper="Minimal 4 karakter, unik untuk login portal">
            <input
              type="text"
              className="input-std font-mono font-medium"
              placeholder="Contoh: wali.10293"
              value={accountForm.username}
              onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Password" required helper="Minimal 6 karakter kombinasi huruf dan angka">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-std font-mono font-medium pr-10"
                placeholder="Masukkan atau generate password"
                value={accountForm.password}
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>
        </form>
      </Modal>

      {/* Modal Reset Password Akun Wali */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => !accountSubmitting && setShowResetPasswordModal(false)}
        title="Reset Password Akun Wali Murid"
        subtitle={
          selectedGuardianForAccount?.userAccount
            ? `Username: ${selectedGuardianForAccount.userAccount.username} • Wali: ${selectedGuardianForAccount.fullName}`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              onClick={() =>
                handleCopyCredentials(
                  `Kredensial Baru Akun Wali:\nUsername: ${selectedGuardianForAccount?.userAccount?.username || '-'}\nPassword Baru: ${resetPasswordForm.newPassword}`
                )
              }
              title="Salin password baru ke clipboard"
              disabled={!resetPasswordForm.newPassword}
            >
              {copiedNotification ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedNotification ? 'Tersalin!' : 'Salin Password'}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-std-secondary"
                onClick={() => setShowResetPasswordModal(false)}
                disabled={accountSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-std-primary"
                onClick={handleSaveResetPassword}
                disabled={accountSubmitting}
              >
                {accountSubmitting && <Loader2 size={16} className="animate-spin" />}
                {accountSubmitting ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSaveResetPassword} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-950">Generate Password Acak</span>
                <button
                  type="button"
                  onClick={handleAutoGenerateResetPassword}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Zap size={12} /> Buat Password
                </button>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Buat password acak baru atau ketikkan password khusus secara manual di bawah ini.
              </p>
            </div>
          </div>

          <FormField label="Password Baru" required helper="Minimal 6 karakter">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-std font-mono font-medium pr-10"
                placeholder="Masukkan password baru"
                value={resetPasswordForm.newPassword}
                onChange={(e) => setResetPasswordForm({ newPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>
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
