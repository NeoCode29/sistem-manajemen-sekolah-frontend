import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck2,
  ArrowUpRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import type { PrincipalDashboardSummary } from '../../../api/dashboardService';
import { GeolocationCheckin } from '../../../components/widgets/GeolocationCheckin';

interface PrincipalDashboardViewProps {
  summary: PrincipalDashboardSummary;
  onRefresh?: () => void;
}

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({ summary }) => {
  const navigate = useNavigate();

  const totalStudents = summary.schoolOverview.totalStudents;
  const totalEmployees = summary.schoolOverview.totalEmployees;

  // Student percentages
  const studentPresentPct = totalStudents > 0 ? Math.round((summary.attendance.present / totalStudents) * 100) : 0;
  const studentSickPct = totalStudents > 0 ? Math.round((summary.attendance.sickLeave / totalStudents) * 100) : 0;
  const studentAbsentPct = totalStudents > 0 ? Math.round((summary.attendance.absent / totalStudents) * 100) : 0;
  const studentUnrecordedPct = totalStudents > 0 ? Math.round((summary.attendance.unrecorded / totalStudents) * 100) : 0;

  // Employee percentages
  const empPresentPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.present / totalEmployees) * 100) : 0;
  const empSickPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.sickLeave / totalEmployees) * 100) : 0;
  const empAbsentPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.absent / totalEmployees) * 100) : 0;
  const empUnrecordedPct = totalEmployees > 0 ? Math.round((summary.employeeAttendance.unrecorded / totalEmployees) * 100) : 0;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* 1. Banner Utama Eksekutif: Supervisi & Pengesahan Rapor */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <FileCheck2 size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 leading-tight">Supervisi & Pengesahan Rapor Semester</h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                T.A. {summary.reportCardSupervision.academicYearName} • {summary.reportCardSupervision.semesterName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.reportCardSupervision.pendingApprovalsCount > 0 
                ? `Terdapat ${summary.reportCardSupervision.pendingApprovalsCount} rapor yang telah divalidasi wali kelas dan siap disahkan pimpinan.`
                : 'Seluruh rapor semester yang disetorkan telah selesai disahkan atau belum ada antrean validasi.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/assessment/report-cards')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start md:self-auto"
        >
          <span>Buka Pengesahan Rapor</span>
          <ArrowUpRight size={15} />
        </button>
      </div>

      {/* 2. 4 Kartu KPI Eksekutif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        
        {/* Kehadiran Siswa Global */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Kehadiran Siswa</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.schoolOverview.studentAttendanceRate}%</h4>
              <p className="text-xs text-slate-500 mt-0.5">{summary.attendance.present.toLocaleString()} Hadir dari {totalStudents} Siswa</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Kehadiran Pegawai Global */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Kehadiran Pegawai</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.schoolOverview.employeeAttendanceRate}%</h4>
              <p className="text-xs text-slate-500 mt-0.5">{summary.employeeAttendance.present.toLocaleString()} Hadir dari {totalEmployees} Guru/Staf</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* Rapor Menunggu Pengesahan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Menunggu Pengesahan</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.reportCardSupervision.pendingApprovalsCount}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{summary.reportCardSupervision.validatedCount} Rapor Telah Disahkan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <FileCheck2 size={22} />
            </div>
          </div>
        </div>

        {/* Pelanggaran Berat / Atensi Pimpinan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Atensi Kedisiplinan</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{summary.highDisciplineIncidentsCount}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Kasus Disiplin Bulan Ini</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Breakdown Kehadiran & Panel Supervisi Manajerial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* Kolom Kiri: Breakdown Presensi Siswa & Pegawai (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          
          {/* Breakdown Presensi Siswa */}
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
              <div className="w-full sm:w-1/3 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
                <div className="text-3xl font-extrabold text-indigo-600">{studentPresentPct}%</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Tingkat Kehadiran</div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 flex">
                  <div style={{ width: `${studentPresentPct}%` }} className="bg-indigo-600 h-full" title={`Hadir: ${studentPresentPct}%`} />
                  <div style={{ width: `${studentSickPct}%` }} className="bg-amber-400 h-full" title={`Sakit/Izin: ${studentSickPct}%`} />
                  <div style={{ width: `${studentAbsentPct}%` }} className="bg-rose-500 h-full" title={`Alpa: ${studentAbsentPct}%`} />
                  <div style={{ width: `${studentUnrecordedPct}%` }} className="bg-slate-300 h-full" title={`Belum Absen: ${studentUnrecordedPct}%`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Hadir</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.present.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({studentPresentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Izin / Sakit</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.sickLeave.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({studentSickPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Alpa</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.absent.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({studentAbsentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Belum Direkam</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.unrecorded.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({studentUnrecordedPct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Presensi Pegawai */}
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
                <div className="text-3xl font-extrabold text-blue-600">{empPresentPct}%</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Kehadiran Pegawai</div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 flex">
                  <div style={{ width: `${empPresentPct}%` }} className="bg-blue-600 h-full" title={`Hadir: ${empPresentPct}%`} />
                  <div style={{ width: `${empSickPct}%` }} className="bg-amber-400 h-full" title={`Sakit/Izin: ${empSickPct}%`} />
                  <div style={{ width: `${empAbsentPct}%` }} className="bg-rose-500 h-full" title={`Alpa: ${empAbsentPct}%`} />
                  <div style={{ width: `${empUnrecordedPct}%` }} className="bg-slate-300 h-full" title={`Belum Absen: ${empUnrecordedPct}%`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span> 
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
                    {summary.employeeAttendance.unrecorded.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empUnrecordedPct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Presensi Mandiri Pimpinan & Pintasan Supervisi (1 Kolom) */}
        <div className="flex flex-col gap-6 min-w-0">
          <div className="w-full min-w-0">
            <GeolocationCheckin />
          </div>

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
                  <p className="text-xs font-bold text-slate-800 group-hover:text-amber-800">Pengesahan Rapor Digital</p>
                  <p className="text-[11px] text-slate-400">Verifikasi kelulusan dan rapor semester</p>
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

              <button
                onClick={() => navigate('/achievements-violations/violations')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-rose-300 bg-white hover:bg-rose-50/40 transition-all text-left group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-rose-700">Pelanggaran & Disiplin Siswa</p>
                  <p className="text-[11px] text-slate-400">Monitoring sanksi dan SP siswa</p>
                </div>
                <ArrowUpRight size={15} className="text-slate-400 group-hover:text-rose-600 shrink-0" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
