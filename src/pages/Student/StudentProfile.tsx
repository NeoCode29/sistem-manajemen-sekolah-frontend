import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyStudent, type StudentProfileData } from '../../api/studentPortalService';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Users, 
  GraduationCap, 
  Sparkles, 
  Activity, 
  Home, 
  Award, 
  ShieldCheck, 
  FileText, 
  HeartHandshake, 
  Navigation, 
  Clock, 
  Mail, 
  Building2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

type ProfileTab = 'dapodik' | 'address' | 'physical' | 'guardians' | 'academic';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('dapodik');

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyStudent();
        setStudent(data);
      } catch (error) {
        console.error("Failed to fetch student profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const calculateAge = (birthDateString?: string | null) => {
    if (!birthDateString) return null;
    const birth = new Date(birthDateString);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    return years >= 0 ? `${years} tahun` : null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500 gap-3 min-h-[360px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <span className="font-semibold text-sm text-slate-600">Memuat profil lengkap siswa...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 max-w-lg mx-auto shadow-sm my-10">
        <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
        <h3 className="font-bold text-slate-800 text-lg mb-1">Data Profil Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">Akun Anda belum terhubung dengan data siswa terdaftar.</p>
      </div>
    );
  }

  const activeEnrollment = student.enrollments?.find(
    e => e.status === 'ENROLLED' || e.status === 'ACTIVE'
  ) || student.enrollments?.[0];

  const currentClassroomName = activeEnrollment?.classroom?.name || '-';
  const currentMajorName = student.major?.name || activeEnrollment?.classroom?.major?.name || '-';
  const ageString = calculateAge(student.birthDate);

  const nik = student.nik || student.nationalId || '-';
  const noKk = student.noKk || student.familyCardNo || '-';
  const birthCertNo = student.birthCertNo || student.birthCertificateNo || '-';
  const heightCm = student.heightCm ?? student.height ?? '-';
  const weightKg = student.weightKg ?? student.weight ?? '-';
  const headCircumferenceCm = student.headCircumferenceCm ?? student.headCircumference ?? '-';
  const distanceKm = student.distanceToSchoolKm ?? student.distanceToSchool ?? '-';
  const travelMinutes = student.travelTimeMinutes ?? student.travelTimeToSchool ?? '-';
  const transportation = student.transportation || student.transportationMode || '-';
  const illnessHistory = student.illnessHistory || student.medicalHistory || '-';
  const isPipEligible = student.pipEligible || student.kipReceiver || Boolean(student.kipNumber);

  return (
    <div className="max-w-5xl mx-auto page-enter pb-12 space-y-6">
      {/* 1. Header Judul Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isGuardian ? 'Biodata Siswa & Data Wali' : 'Profil Lengkap Siswa'}</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
            Data pokok pendidikan, kependudukan Dapodik, fisik, keluarga, dan rekam jejak akademik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Portal Siswa</span>
          </span>
        </div>
      </div>

      {/* 2. Hero Overview Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Cover Background */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Hero Identity Content */}
        <div className="px-5 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            {/* Avatar Inisial */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-inner">
                {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Status: {student.status || 'Aktif'}
              </span>

              {isPipEligible && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                  <Award size={13} className="text-amber-600" />
                  Penerima KIP/PIP
                </span>
              )}

              {student.bloodType && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                  Gol. Darah: {student.bloodType}
                </span>
              )}
            </div>
          </div>

          {/* Nama & Identitas Pokok */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {student.fullName}
              {student.nickname && (
                <span className="text-slate-400 font-normal text-lg sm:text-xl ml-2">
                  ({student.nickname})
                </span>
              )}
            </h3>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-2.5 py-1 rounded-lg font-bold">
                NIS: {student.nis}
              </span>
              {student.nisn && (
                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                  NISN: {student.nisn}
                </span>
              )}
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <GraduationCap size={14} />
                Kelas: {currentClassroomName}
              </span>
              {currentMajorName !== '-' && (
                <span className="bg-purple-50 text-purple-700 border border-purple-100/80 px-2.5 py-1 rounded-lg font-medium">
                  {currentMajorName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 sm:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('dapodik')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dapodik'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <User size={15} />
              <span>Biodata & Dapodik</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'address'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <MapPin size={15} />
              <span>Alamat & Domisili</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('physical')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'physical'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Activity size={15} />
              <span>Fisik & Transportasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guardians')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'guardians'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Users size={15} />
              <span>Orang Tua & Wali</span>
              {student.guardians && student.guardians.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'guardians' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {student.guardians.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'academic'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <GraduationCap size={15} />
              <span>Akademik & Bantuan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tab Panels Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
        {/* PANEL 1: BIODATA & DAPODIK */}
        {activeTab === 'dapodik' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <User size={18} className="text-indigo-600" />
                <span>Identitas Pokok & Kependudukan (Dapodik)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Data resmi kependudukan yang sinkron dengan data registrasi sekolah dan Dapodik Kemendikbud.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">NIK (No. KTP)</span>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{nik}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nomor Kartu Keluarga (KK)</span>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{noKk}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No. Akta Kelahiran</span>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{birthCertNo}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tempat, Tanggal Lahir</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {student.birthPlace || '-'},{' '}
                  {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  {ageString && <span className="text-xs font-normal text-indigo-600 ml-1.5">({ageString})</span>}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jenis Kelamin</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {student.gender === 'Laki-laki' || student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agama</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.religion || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kewarganegaraan</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.nationality || 'Indonesia (WNI)'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Urutan Kelahiran</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {student.birthOrder ? `Anak ke-${student.birthOrder}` : '-'}
                  {student.siblingCount ? ` dari ${student.siblingCount} bersaudara` : ''}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kebutuhan Khusus</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {student.specialNeeds || student.physicalDisability || 'Tidak Ada'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: ALAMAT & DOMISILI */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600" />
                <span>Data Alamat Tempat Tinggal & Domisili</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Alamat domisili peserta didik sesuai dengan data kependudukan dan tempat tinggal saat ini.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 sm:col-span-2 md:col-span-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alamat Jalan / Rumah</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base leading-relaxed">
                  {student.address || 'Belum diisi'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RT / RW</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">
                  {student.rt ? `RT ${student.rt}` : '-'} / {student.rw ? `RW ${student.rw}` : '-'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dusun / Lingkungan</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.subVillage || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Desa / Kelurahan</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.village || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kecamatan</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.district || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kabupaten / Kota</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.city || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Provinsi</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.province || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kode Pos</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.postalCode || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jenis Tempat Tinggal</span>
                <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.residenceType || 'Bersama Orang Tua'}</p>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: FISIK & TRANSPORTASI */}
        {activeTab === 'physical' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                <span>Data Fisik, Kesehatan & Perjalanan ke Sekolah</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan data periodik antropometri dan rute mobilitas peserta didik ke sekolah.
              </p>
            </div>

            {/* Sub-section: Antropometri */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Antropometri & Medis</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tinggi Badan</span>
                  <p className="font-extrabold text-slate-800 text-lg">
                    {heightCm !== '-' ? `${heightCm} cm` : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Berat Badan</span>
                  <p className="font-extrabold text-slate-800 text-lg">
                    {weightKg !== '-' ? `${weightKg} kg` : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lingkar Kepala</span>
                  <p className="font-extrabold text-slate-800 text-lg">
                    {headCircumferenceCm !== '-' ? `${headCircumferenceCm} cm` : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Golongan Darah</span>
                  <p className="font-extrabold text-rose-600 text-lg">
                    {student.bloodType || '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Riwayat Penyakit / Kelainan Medis</span>
                <p className="font-semibold text-slate-800 text-sm">
                  {illnessHistory !== '-' ? illnessHistory : 'Tidak ada catatan riwayat penyakit khusus'}
                </p>
              </div>
            </div>

            {/* Sub-section: Transportasi */}
            <div className="pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Transportasi ke Sekolah</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                    <Navigation size={15} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alat Transportasi</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">{transportation}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                    <MapPin size={15} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jarak ke Sekolah</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">
                    {distanceKm !== '-' ? `${distanceKm} km` : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                    <Clock size={15} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waktu Tempuh</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">
                    {travelMinutes !== '-' ? `${travelMinutes} menit` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: ORANG TUA & WALI */}
        {activeTab === 'guardians' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <span>Data Lengkap Orang Tua & Wali Murid</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Informasi identitas, pekerjaan, kontak resmi, dan status orang tua/wali siswa.
              </p>
            </div>

            {(!student.guardians || student.guardians.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-400">
                <Users size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-sm text-slate-600">Belum Ada Data Orang Tua/Wali</p>
                <p className="text-xs text-slate-400 mt-0.5">Data wali murid belum didaftarkan di sistem sekolah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {student.guardians.map((guardian, idx) => {
                  const isAlive = guardian.isAlive !== false;
                  const occupationName = guardian.occupationRef?.name || guardian.occupation || '-';

                  return (
                    <div 
                      key={guardian.id || idx} 
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                        guardian.isPrimary 
                          ? 'bg-indigo-50/20 border-indigo-200/80 shadow-2xs' 
                          : 'bg-slate-50/70 border-slate-200/80'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-base">
                              {guardian.fullName}
                            </span>
                            {guardian.isPrimary && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-md shadow-2xs">
                                Wali Utama
                              </span>
                            )}
                          </div>
                          <span className="inline-block text-xs font-bold text-indigo-600 mt-0.5">
                            Hubungan: {guardian.relationship}
                          </span>
                        </div>

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isAlive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isAlive ? 'Masih Hidup' : 'Meninggal'}
                        </span>
                      </div>

                      {/* Detail Body */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">NIK Wali</span>
                          <p className="font-semibold text-slate-800">{guardian.nik || guardian.nationalId || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Tahun Lahir</span>
                          <p className="font-semibold text-slate-800">{guardian.birthYear || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Pendidikan Terakhir</span>
                          <p className="font-semibold text-slate-800">{guardian.educationLevel || guardian.education || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Pekerjaan</span>
                          <p className="font-semibold text-slate-800">{occupationName}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Penghasilan Bulanan</span>
                          <p className="font-semibold text-slate-800">{guardian.monthlyIncome || '-'}</p>
                        </div>
                        {guardian.address && (
                          <div className="col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Alamat Tempat Tinggal</span>
                            <p className="font-medium text-slate-700">{guardian.address}</p>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Kontak */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone size={13} className="text-slate-400" />
                          <span>{guardian.phone || 'No. HP belum ada'}</span>
                        </div>
                        {guardian.email && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <Mail size={13} className="text-slate-400" />
                            <span>{guardian.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 5: AKADEMIK, ASAL SEKOLAH & BANTUAN */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-600" />
                <span>Rekam Jejak Akademik, Sekolah Asal & Program Bantuan</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat pendidikan awal sebelum masuk, program beasiswa/bantuan sosial, serta linimasa kelas.
              </p>
            </div>

            {/* Riwayat Sekolah Asal */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Pendidikan Sebelumnya</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sekolah Asal</span>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">
                    {student.previousSchoolName || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">NPSN Sekolah Asal</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">
                    {student.previousSchoolNpsn || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tanggal Masuk Sekolah Ini</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">
                    {student.admissionDate 
                      ? new Date(student.admissionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                      : '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No. Ijazah Sebelumnya</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">
                    {student.diplomaNumber || student.previousCertificateNo || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No. SKHUN</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">
                    {student.skhunNumber || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No. Peserta Ujian Nasional</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">
                    {student.examParticipantNumber || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bantuan & Kesejahteraan Siswa */}
            <div className="pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Program Bantuan & Beasiswa</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status KIP / Layak PIP</span>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">
                    {isPipEligible ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={16} /> Penerima Bantuan PIP/KIP
                      </span>
                    ) : (
                      'Bukan Penerima'
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nomor KIP</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.kipNumber || '-'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nomor KPS / KKS</span>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">{student.kpsNumber || '-'}</p>
                </div>

                {student.pipReason && (
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alasan Layak PIP</span>
                    <p className="font-semibold text-slate-800 text-sm">{student.pipReason}</p>
                  </div>
                )}

                {student.scholarshipHistory && (
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 sm:col-span-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Riwayat Beasiswa</span>
                    <p className="font-semibold text-slate-800 text-sm">{student.scholarshipHistory}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Riwayat Kelas (Enrollment History) */}
            <div className="pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Linimasa Riwayat Kelas & Kenaikan</h5>
              {(!student.enrollments || student.enrollments.length === 0) ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-400">
                  <p className="text-xs font-medium">Belum ada catatan riwayat kelas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 sm:p-4">Tahun Ajaran</th>
                        <th className="p-3.5 sm:p-4">Semester</th>
                        <th className="p-3.5 sm:p-4">Kelas & Rombel</th>
                        <th className="p-3.5 sm:p-4">Program Keahlian</th>
                        <th className="p-3.5 sm:p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {student.enrollments.map((e, i) => {
                        let statusLabel = e.status;
                        let badgeClass = 'bg-slate-100 text-slate-700';

                        switch (e.status) {
                          case 'ENROLLED':
                          case 'ACTIVE':
                            statusLabel = 'Aktif';
                            badgeClass = 'bg-emerald-100 text-emerald-800';
                            break;
                          case 'PROMOTED':
                            statusLabel = 'Naik Kelas';
                            badgeClass = 'bg-blue-100 text-blue-800';
                            break;
                          case 'GRADUATED':
                            statusLabel = 'Lulus';
                            badgeClass = 'bg-purple-100 text-purple-800';
                            break;
                          case 'RETAINED':
                            statusLabel = 'Tinggal Kelas';
                            badgeClass = 'bg-red-100 text-red-800';
                            break;
                        }

                        return (
                          <tr key={e.id || i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3.5 sm:p-4 font-bold text-slate-800">{e.academicYear?.name || '-'}</td>
                            <td className="p-3.5 sm:p-4 text-slate-600">{e.semester?.name || '-'}</td>
                            <td className="p-3.5 sm:p-4 font-extrabold text-indigo-600">{e.classroom?.name || '-'}</td>
                            <td className="p-3.5 sm:p-4 text-slate-600">{e.classroom?.major?.name || student.major?.name || '-'}</td>
                            <td className="p-3.5 sm:p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Informasi Akun Login Siswa */}
            {student.users && student.users.length > 0 && (
              <div className="pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Informasi Akun Portal</h5>
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Username Login</p>
                      <p className="font-extrabold text-slate-800 text-sm">{student.users[0].username}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Akun Login Aktif
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
