import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  GraduationCap, 
  FileCheck, 
  UserCheck, 
  Calendar, 
  ArrowUpRight, 
  AlertTriangle,
  BookOpen,
  MapPin,
  CheckCircle2,
  Users
} from 'lucide-react';
import type { TeacherDashboardSummary } from '../../../api/dashboardService';
import { GeolocationCheckin } from '../../../components/widgets/GeolocationCheckin';

interface TeacherDashboardViewProps {
  summary: TeacherDashboardSummary;
  onRefresh?: () => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ summary, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 1. Presensi Mandiri Guru */}
      <div className="w-full min-w-0">
        <GeolocationCheckin />
      </div>

      {/* 2. Banner Kelas Binaan (Khusus Wali Kelas) */}
      {summary.homeroomPreview && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/80 rounded-2xl p-5 shadow-xs transition-all w-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                <Users size={12} />
                <span>Wali Kelas Aktif</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight truncate">
                Kelas Binaan: {summary.homeroomPreview.classroomName}
              </h3>
              <p className="text-xs text-slate-500">
                Total {summary.homeroomPreview.totalStudents} siswa terdaftar di rombongan belajar ini.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-emerald-700 font-semibold">{summary.homeroomPreview.presentToday} Hadir</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-700 font-medium">{summary.homeroomPreview.sickToday + summary.homeroomPreview.leaveToday} Izin/Skt</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-700 font-medium">{summary.homeroomPreview.absentToday} Alpa</span>
              </div>

              {summary.homeroomPreview.alertDisciplineCount > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  <AlertTriangle size={13} />
                  <span>{summary.homeroomPreview.alertDisciplineCount} Pelanggaran</span>
                </div>
              )}

              <button
                onClick={() => navigate('/homeroom/dashboard')}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Kelola Kelas</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 4 Kartu KPI Khusus Guru */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        {/* KPI 1: Jam Mengajar Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Jam Hari Ini</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.todayTeachingHours}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Jam Pelajaran Terjadwal</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* KPI 2: Kelas Yang Diajar Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Kelas Hari Ini</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.todayClassesCount}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Rombel Kelas Mengajar</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <GraduationCap size={22} />
            </div>
          </div>
        </div>

        {/* KPI 3: Nilai/Tugas Pending Diperiksa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Pending Penilaian</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.pendingAssessmentsCount}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Asesmen Belum Selesai</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <FileCheck size={22} />
            </div>
          </div>
        </div>

        {/* KPI 4: Kehadiran Mandiri Guru Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Presensi Saya</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.teacherMonthlyAttendanceRate}%</h4>
              <p className="text-xs text-slate-500 mt-0.5">Kehadiran Bulan Ini</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <UserCheck size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Jadwal Mengajar Hari Ini (Agenda Timeline) & Pintasan Aksi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Kolom Kiri: Agenda Mengajar Hari Ini (2 Kolom) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 min-w-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-800 text-sm">Jadwal Mengajar Hari Ini</h3>
            </div>
            <button
              onClick={() => navigate('/academic/schedules')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Jadwal Lengkap</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          {summary.todaySchedule.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500/70" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada jadwal mengajar hari ini</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Anda tidak memiliki jam mengajar terjadwal pada hari ini. Gunakan waktu untuk persiapan materi atau penilaian tugas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.todaySchedule.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-100 transition-all gap-3 min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Jam</span>
                      <span className="text-sm font-extrabold text-slate-800 leading-tight">#{item.periodNumber}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wide">
                          {item.classroomName}
                        </span>
                        {item.room && (
                          <span className="text-slate-400 text-xs flex items-center gap-0.5">
                            <MapPin size={11} />
                            {item.room}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm truncate mt-0.5">
                        {item.subjectName}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {item.startTime} - {item.endTime} WIB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/assessment/exams')}
                    className="shrink-0 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Setor Nilai
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Pintasan Edukatif Guru (1 Kolom) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 min-w-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="text-indigo-600" size={18} />
            <h3 className="font-bold text-slate-800 text-sm">Pintasan Guru</h3>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/assessment/exams')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Input Nilai & Ujian</p>
                <p className="text-[11px] text-slate-400 truncate">Kelola asesmen formatif & sumatif</p>
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
            </button>

            <button
              onClick={() => navigate('/academic/schedules')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 transition-all text-left shadow-2xs group cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Jadwal Mengajar Saya</p>
                <p className="text-[11px] text-slate-400 truncate">Lihat matriks jam mengajar mingguan</p>
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
            </button>

            {summary.homeroomPreview && (
              <button
                onClick={() => navigate('/homeroom/dashboard')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-purple-200 hover:border-purple-300 bg-purple-50/40 hover:bg-purple-50 transition-all text-left shadow-2xs group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-purple-900">Dashboard Wali Kelas</p>
                  <p className="text-[11px] text-purple-600/80 truncate">Rekap komprehensif kelas binaan</p>
                </div>
                <ArrowUpRight size={16} className="text-purple-600 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
