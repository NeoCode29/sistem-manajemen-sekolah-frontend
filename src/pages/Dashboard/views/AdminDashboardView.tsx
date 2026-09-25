import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  FileCheck2,
  ArrowUpRight
} from 'lucide-react';
import type { DashboardSummary } from '../../../api/dashboardService';
import { GeolocationCheckin } from '../../../components/widgets/GeolocationCheckin';

interface AdminDashboardViewProps {
  summary: DashboardSummary;
  isEmployee: boolean;
  isPrincipal?: boolean;
  isAdmin?: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ 
  summary, 
  isEmployee,
  isPrincipal = false,
  isAdmin = false
}) => {
  const navigate = useNavigate();

  // Hitung jumlah yang belum absen
  const unrecordedStudents = Math.max(0, summary.totalStudents - summary.attendance.present - summary.attendance.sickLeave - summary.attendance.absent);
  const unrecordedEmployees = Math.max(0, summary.totalEmployees - summary.employeeAttendance.present - summary.employeeAttendance.sickLeave - summary.employeeAttendance.absent);

  // Calculate attendance percentages
  const totalStudents = summary.totalStudents;
  const presentPct = totalStudents > 0 ? Math.round((summary.attendance.present / totalStudents) * 100) : 0;
  const sickPct = totalStudents > 0 ? Math.round((summary.attendance.sickLeave / totalStudents) * 100) : 0;
  const absentPct = totalStudents > 0 ? Math.round((summary.attendance.absent / totalStudents) * 100) : 0;
  const unrecordedPct = totalStudents > 0 ? Math.round((unrecordedStudents / totalStudents) * 100) : 0;

  const totalEmployees = summary.totalEmployees;
  const empPresentPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.present / totalEmployees) * 100) : 0;
  const empSickPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.sickLeave / totalEmployees) * 100) : 0;
  const empAbsentPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.absent / totalEmployees) * 100) : 0;
  const empUnrecordedPct = totalEmployees > 0 ? Math.round((unrecordedEmployees / totalEmployees) * 100) : 0;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Khusus Kepala Sekolah: Banner Pengesahan Rapor */}
      {isPrincipal && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <FileCheck2 size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-800">Supervisi & Pengesahan Rapor</h4>
              <p className="text-xs text-slate-500">
                Tinjau ketuntasan nilai dan verifikasi pengesahan rapor semester secara digital.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/assessment/report-cards')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Buka Pengesahan Rapor</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* 1. 4 Kartu KPI Makro Sekolah */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Total Siswa Aktif</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.totalStudents.toLocaleString()}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Siswa Terdaftar</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <GraduationCap size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Guru & Pegawai</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.totalEmployees.toLocaleString()}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Pendidik & Tenaga Kependidikan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Kehadiran Siswa</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{presentPct}%</h4>
              <p className="text-xs text-slate-500 mt-0.5">{summary.attendance.present.toLocaleString()} Hadir Hari Ini</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Kehadiran Pegawai</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{empPresentPct}%</h4>
              <p className="text-xs text-slate-500 mt-0.5">{summary.employeeAttendance.present.toLocaleString()} Hadir Hari Ini</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Clock size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Breakdown Kehadiran & Aktivitas Sistem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Kolom Kiri: Detail Presensi Siswa & Pegawai (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Detail Presensi Siswa */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Breakdown Presensi Siswa Hari Ini</h3>
                <p className="text-xs text-slate-500">Tingkat kehadiran siswa di seluruh kelas aktif</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                Total: {totalStudents} Siswa
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Stacked Progress Bar */}
              <div className="w-full sm:w-1/3 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
                <div className="text-3xl font-extrabold text-indigo-600">{presentPct}%</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Tingkat Kehadiran</div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 flex">
                  <div style={{ width: `${presentPct}%` }} className="bg-indigo-600 h-full" title={`Hadir: ${presentPct}%`} />
                  <div style={{ width: `${sickPct}%` }} className="bg-amber-400 h-full" title={`Sakit/Izin: ${sickPct}%`} />
                  <div style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full" title={`Alpa: ${absentPct}%`} />
                  <div style={{ width: `${unrecordedPct}%` }} className="bg-slate-300 h-full" title={`Belum Absen: ${unrecordedPct}%`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Hadir</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.present.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({presentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Izin / Sakit</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.sickLeave.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({sickPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Alpa</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.absent.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({absentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Belum Direkam</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {unrecordedStudents.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({unrecordedPct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Presensi Pegawai */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Breakdown Presensi Pegawai Hari Ini</h3>
                <p className="text-xs text-slate-500">Pendidik dan tenaga kependidikan</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                Total: {totalEmployees} Pegawai
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/3 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
                <div className="text-3xl font-extrabold text-purple-600">{empPresentPct}%</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Kehadiran Pegawai</div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 flex">
                  <div style={{ width: `${empPresentPct}%` }} className="bg-purple-600 h-full" title={`Hadir: ${empPresentPct}%`} />
                  <div style={{ width: `${empSickPct}%` }} className="bg-amber-400 h-full" title={`Sakit/Izin: ${empSickPct}%`} />
                  <div style={{ width: `${empAbsentPct}%` }} className="bg-rose-500 h-full" title={`Alpa: ${empAbsentPct}%`} />
                  <div style={{ width: `${empUnrecordedPct}%` }} className="bg-slate-300 h-full" title={`Belum Absen: ${empUnrecordedPct}%`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Hadir</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.employeeAttendance.present.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empPresentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Izin / Sakit</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.employeeAttendance.sickLeave.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empSickPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Alpa</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.employeeAttendance.absent.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empAbsentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Belum Direkam</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {unrecordedEmployees.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empUnrecordedPct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Geolocation Checkin & (Khusus Admin) Aktivitas Terbaru ATAU Pintasan Supervisi */}
        <div className="flex flex-col gap-6 min-w-0">
          {isEmployee && (
            <div className="w-full min-w-0">
              <GeolocationCheckin />
            </div>
          )}

          {isAdmin ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col flex-1 overflow-hidden min-w-0">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm md:text-base font-bold text-slate-900">Aktivitas Sistem Terbaru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Log pembaruan data dan operasional sekolah</p>
              </div>
              <div className="p-5 flex flex-col gap-5 relative flex-1 min-w-0">
                <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-slate-100 rounded-full"></div>
                
                {summary.recentActivities && summary.recentActivities.length > 0 ? (
                  summary.recentActivities.map((act, idx) => (
                    <div key={act.id} className="flex gap-4 relative group min-w-0">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 mt-1 shadow-xs shrink-0 ${
                        idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-purple-600' : 'bg-slate-300'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug break-words">
                          {act.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          {new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">Belum ada aktivitas terekam hari ini.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4 min-w-0">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm md:text-base font-bold text-slate-900">Pintasan Supervisi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Akses cepat laporan dan pengesahan sekolah</p>
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={() => navigate('/assessment/report-cards')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-amber-300 bg-amber-50/30 hover:bg-amber-50 transition-all text-left group cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-amber-800">Pengesahan Rapor</p>
                    <p className="text-[11px] text-slate-400">Verifikasi dan tanda tangan digital</p>
                  </div>
                  <ArrowUpRight size={15} className="text-slate-400 group-hover:text-amber-600 shrink-0" />
                </button>

                <button
                  onClick={() => navigate('/attendance/students')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Rekap Presensi Siswa</p>
                    <p className="text-[11px] text-slate-400">Pantau kehadiran seluruh kelas</p>
                  </div>
                  <ArrowUpRight size={15} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                </button>

                <button
                  onClick={() => navigate('/attendance/employees')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-purple-300 bg-white hover:bg-purple-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Rekap Presensi Guru & Staf</p>
                    <p className="text-[11px] text-slate-400">Kedisiplinan tenaga kependidikan</p>
                  </div>
                  <ArrowUpRight size={15} className="text-slate-400 group-hover:text-purple-600 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

