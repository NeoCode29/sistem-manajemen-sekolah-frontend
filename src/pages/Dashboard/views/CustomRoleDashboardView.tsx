import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Inbox, 
  Send, 
  Users, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  FileCheck2, 
  Settings, 
  Cpu, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import type { User } from '../../../context/AuthContext';
import { GeolocationCheckin } from '../../../components/widgets/GeolocationCheckin';

interface CustomRoleDashboardViewProps {
  user: User | null;
}

export const CustomRoleDashboardView: React.FC<CustomRoleDashboardViewProps> = ({ user }) => {
  const navigate = useNavigate();

  const userPermissions = user?.permissions?.map(p => p.name) || [];
  const roleNames = user?.roles?.map(r => r.name) || ['Pengguna Khusus'];

  const hasPermission = (permissionPrefix: string): boolean => {
    return userPermissions.some(
      p => p === permissionPrefix || p.startsWith(permissionPrefix + '.') || p === 'all:manage'
    );
  };

  // Permission checkers
  const canAccessAttendance = Boolean(user?.employeeId) || hasPermission('employee_attendance') || hasPermission('student_attendance');
  const canAccessLetters = hasPermission('incoming_letters') || hasPermission('outgoing_letters') || hasPermission('letter_templates');
  const canAccessStudents = hasPermission('students');
  const canAccessDiscipline = hasPermission('violations') || hasPermission('achievements');
  const canAccessAcademic = hasPermission('schedules') || hasPermission('classrooms') || hasPermission('subjects') || hasPermission('academic_years');
  const canAccessAssessment = hasPermission('assessments') || hasPermission('assessment_components') || hasPermission('report_cards');
  const canAccessEmployees = hasPermission('employees') || hasPermission('positions');
  const canAccessHardware = hasPermission('hardware');
  const canAccessSystem = hasPermission('school_profile') || hasPermission('users') || hasPermission('roles');

  // Count active modules
  const activeModuleCategories = [
    canAccessAttendance && 'Presensi',
    canAccessLetters && 'Persuratan',
    canAccessStudents && 'Kesiswaan',
    canAccessDiscipline && 'Kedisiplinan & Prestasi',
    canAccessAcademic && 'Akademik & Jadwal',
    canAccessAssessment && 'Penilaian',
    canAccessEmployees && 'Kepegawaian',
    canAccessHardware && 'Mesin IoT',
    canAccessSystem && 'Sistem'
  ].filter(Boolean);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 1. Custom Role Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20 backdrop-blur-md">
                <Sparkles size={12} className="text-indigo-400" />
                Role Khusus
              </span>
              {roleNames.map((role, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/10">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  {role}
                </span>
              ))}
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Dashboard Terkonfigurasi
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tampilan dashboard ini disesuaikan otomatis mengikuti hak akses ({userPermissions.length} permission aktif) yang telah diatur oleh Administrator untuk peran Anda.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 shrink-0">
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-white">{activeModuleCategories.length}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-0.5">Modul Aktif</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-2xl font-extrabold text-indigo-300">{userPermissions.length}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider mt-0.5">Hak Akses</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid Modul Permission-Driven */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Presensi Mandiri (Jika memiliki profil pegawai atau izin presensi) */}
        {canAccessAttendance && (
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-base">Presensi Mandiri</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Catat kehadiran kerja via GPS</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <MapPin size={18} />
                </div>
              </div>
              <GeolocationCheckin />
            </div>
          </div>
        )}

        {/* Kolom Kanan / Utama: Katalog Pintasan Akses Cepat Modul Berwenang */}
        <div className={canAccessAttendance ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-sm">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">
                Pusat Modul & Layanan Aktif
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar modul yang dapat Anda kelola sesuai kewenangan role ini
              </p>
            </div>

            {activeModuleCategories.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Info size={24} />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Belum Ada Hak Akses Khusus</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Akun Anda saat ini belum memiliki hak akses operasional spesifik. Silakan hubungi Administrator untuk mengatur permission peran Anda di menu Hak Akses (RBAC).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Persuratan */}
                {canAccessLetters && (
                  <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500 text-white shrink-0">
                        <Inbox size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Tata Usaha & Surat</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pengelolaan surat masuk & keluar</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {hasPermission('incoming_letters') && (
                        <button
                          onClick={() => navigate('/letters/incoming')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Surat Masuk
                        </button>
                      )}
                      {hasPermission('outgoing_letters') && (
                        <button
                          onClick={() => navigate('/letters/outgoing')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Surat Keluar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Kedisiplinan & Prestasi / BK */}
                {canAccessDiscipline && (
                  <div className="p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500 text-white shrink-0">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Bimbingan & Disiplin</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pencatatan prestasi & pelanggaran</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {hasPermission('violations') && (
                        <button
                          onClick={() => navigate('/discipline/violations')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Pelanggaran Siswa
                        </button>
                      )}
                      {hasPermission('achievements') && (
                        <button
                          onClick={() => navigate('/discipline/achievements')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 shadow-2xs hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Prestasi Siswa
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Kesiswaan */}
                {canAccessStudents && (
                  <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                        <GraduationCap size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Data Siswa</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Buku induk dan profil peserta didik</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => navigate('/students')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        Buku Induk Siswa &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Akademik & Jadwal */}
                {canAccessAcademic && (
                  <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Akademik & Jadwal</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kelas, jadwal KBM & mata pelajaran</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {hasPermission('schedules') && (
                        <button
                          onClick={() => navigate('/academic/schedules')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800 shadow-2xs hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          Jadwal KBM
                        </button>
                      )}
                      {hasPermission('classrooms') && (
                        <button
                          onClick={() => navigate('/academic/classrooms')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800 shadow-2xs hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          Daftar Kelas
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Penilaian & Rapor */}
                {canAccessAssessment && (
                  <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                        <FileCheck2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Penilaian & Rapor</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Input nilai dan administrasi rapor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {hasPermission('assessments') && (
                        <button
                          onClick={() => navigate('/assessment/exams')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          Input Nilai
                        </button>
                      )}
                      {hasPermission('report_cards') && (
                        <button
                          onClick={() => navigate('/assessment/report-cards')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          Rapor Siswa
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. SDM & Kepegawaian */}
                {canAccessEmployees && (
                  <div className="p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Kepegawaian</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Direktori guru dan staf sekolah</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => navigate('/employees')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800 shadow-2xs hover:bg-teal-50 transition-colors cursor-pointer"
                      >
                        Daftar Pegawai &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Hardware & Mesin IoT */}
                {canAccessHardware && (
                  <div className="p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/40 bg-cyan-50/30 dark:bg-cyan-900/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-600 text-white shrink-0">
                        <Cpu size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Perangkat & IoT</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Mesin presensi RFID & log perangkat</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => navigate('/hardware/logs')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-cyan-600 dark:text-cyan-400 rounded-xl border border-cyan-200 dark:border-cyan-800 shadow-2xs hover:bg-cyan-50 transition-colors cursor-pointer"
                      >
                        Log Perangkat &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. Sistem & Pengaturan */}
                {canAccessSystem && (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-700 text-white shrink-0">
                        <Settings size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Sistem & Pengaturan</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Identitas sekolah & manajemen akun</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {hasPermission('school_profile') && (
                        <button
                          onClick={() => navigate('/settings/school')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Profil Sekolah
                        </button>
                      )}
                      {hasPermission('users') && (
                        <button
                          onClick={() => navigate('/settings/users')}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Pengguna & Akun
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomRoleDashboardView;
