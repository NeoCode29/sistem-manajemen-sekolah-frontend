import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Inbox, 
  Send, 
  Bell, 
  ArrowRight, 
  Clock, 
  Calendar, 
  UserCheck, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { GeolocationCheckin } from '../../../components/widgets/GeolocationCheckin';
import type { StaffDashboardSummary } from '../../../api/dashboardService';

interface StaffDashboardViewProps {
  summary: StaffDashboardSummary;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({ summary }) => {
  const navigate = useNavigate();

  const { myAttendance, lettersOverview, totalActiveAnnouncements } = summary;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Kehadiran Saya Bulan Ini */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Kehadiran Saya
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {myAttendance?.monthlyRate ?? 0}%
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tingkat presensi bulan ini</span>
              {myAttendance?.hasCheckedIn ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sudah Masuk
                </span>
              ) : (
                <span className="text-amber-500 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Belum Presensi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Surat Masuk */}
        <div 
          onClick={() => navigate('/letters/incoming')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Surat Masuk
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {lettersOverview?.incomingLettersCount ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <span>Arsip & disposisi surat</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* KPI 3: Surat Keluar */}
        <div 
          onClick={() => navigate('/letters/outgoing')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Surat Keluar
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {lettersOverview?.outgoingLettersCount ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              <span>Dokumentasi resmi instansi</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* KPI 4: Pengumuman Aktif */}
        <div 
          onClick={() => navigate('/announcements')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Pengumuman Aktif
            </span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {totalActiveAnnouncements ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-amber-600 dark:group-hover:text-amber-400">
              <span>Informasi internal sekolah</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Kiri Presensi Mandiri Pegawai, Kanan Persuratan Tata Usaha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Presensi Mandiri Staf (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base">Presensi Mandiri Pegawai</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Catat kehadiran harian kerja via GPS</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                Staff TU
              </span>
            </div>
            <GeolocationCheckin />
          </div>

          {/* Status Jam Kerja Hari Ini */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Status Presensi Hari Ini
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Jam Masuk</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {myAttendance?.checkinTime ? myAttendance.checkinTime : '-'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Jam Pulang</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {myAttendance?.checkoutTime ? myAttendance.checkoutTime : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Persuratan Tata Usaha Terbaru (7 Kolom) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 gap-3">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Surat Masuk Terbaru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Arsip dan pencatatan lalu lintas surat instansi</p>
            </div>
            
            <button
              type="button"
              onClick={() => navigate('/letters/incoming')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Inbox className="w-3.5 h-3.5" />
              Buka Surat Masuk
            </button>
          </div>

          {/* List Content */}
          <div className="mt-5 space-y-3">
            {!lettersOverview?.recentIncomingLetters || lettersOverview.recentIncomingLetters.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Belum ada catatan surat masuk terbaru.
              </div>
            ) : (
              lettersOverview.recentIncomingLetters.map((letter) => (
                <div 
                  key={letter.id}
                  onClick={() => navigate('/letters/incoming')}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800/60 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                        {letter.letterNumber}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        {letter.sender}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 self-start sm:self-auto">
                      <Calendar className="w-3 h-3" />
                      {new Date(letter.receivedDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {letter.subject}
                    </p>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Footer Links */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Manajemen Administrasi Sekolah</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/letters/incoming')}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Lihat Semua Surat Masuk &rarr;
              </button>
              <button
                type="button"
                onClick={() => navigate('/letters/outgoing')}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Lihat Surat Keluar &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardView;
