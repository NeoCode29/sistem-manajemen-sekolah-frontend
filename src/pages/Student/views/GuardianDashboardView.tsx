import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Megaphone, 
  Pin, 
  Clock, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';
import type { DashboardSummary } from '../../../api/studentPortalService';
import type { Announcement } from '../../../api/announcementService';

export interface GuardianDashboardViewProps {
  data: DashboardSummary | null;
  announcements: Announcement[];
  guardianName: string;
  onSelectAnnouncement: (announcement: Announcement) => void;
}

export const GuardianDashboardView: React.FC<GuardianDashboardViewProps> = ({
  data,
  announcements,
  guardianName,
  onSelectAnnouncement,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollState, 350);
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = sliderRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);
      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [announcements, updateScrollState]);

  const todayDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const todayAttendance = data?.todayAttendance;
  const attendanceStats = data?.attendanceStats;

  const renderAttendanceBadge = () => {
    if (!todayAttendance || !todayAttendance.status) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
          <Clock size={16} className="text-slate-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold block">Belum Ada Presensi</span>
            <span className="text-[11px] text-slate-500">Menunggu check-in siswa di sekolah</span>
          </div>
        </div>
      );
    }

    switch (todayAttendance.status.toUpperCase()) {
      case 'HADIR':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">Hadir Tepat Waktu</span>
              <span className="text-xs text-emerald-700 font-medium">
                Masuk: {todayAttendance.checkinTime ? `pkl ${todayAttendance.checkinTime} WIB` : '-'}
                {todayAttendance.checkoutTime && ` • Pulang: pkl ${todayAttendance.checkoutTime} WIB`}
              </span>
            </div>
          </div>
        );
      case 'SAKIT':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">Sakit</span>
              <span className="text-xs text-amber-700 font-medium">
                {todayAttendance.notes ? todayAttendance.notes : 'Keterangan sakit telah diverifikasi sekolah'}
              </span>
            </div>
          </div>
        );
      case 'IZIN':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 shadow-2xs">
            <Info size={18} className="text-blue-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">Izin</span>
              <span className="text-xs text-blue-700 font-medium">
                {todayAttendance.notes ? todayAttendance.notes : 'Keterangan izin resmi tercatat'}
              </span>
            </div>
          </div>
        );
      case 'ALPA':
        return (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 shadow-2xs">
            <XCircle size={18} className="text-rose-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900 block">Alpa / Tanpa Keterangan</span>
              <span className="text-xs text-rose-700 font-medium">
                Siswa tidak hadir tanpa konfirmasi surat keterangan
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <Clock size={16} className="text-slate-500 shrink-0" />
            <span className="text-xs font-semibold">{todayAttendance.status}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* 1. Hero Header Sambutan dengan Konteks Siswa Binaan */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-50/70 via-blue-50/40 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Portal Wali Murid</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang, <span className="text-indigo-600">{guardianName || 'Bapak/Ibu'}</span>! 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal leading-relaxed">
            Pantau perkembangan akademik, kedisiplinan, dan presensi ananda secara langsung dan terpercaya.
          </p>
        </div>

        {/* Child Identity Context Badge */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Siswa yang Dipantau</span>
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {data?.studentInfo?.fullName || 'Data Siswa'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-medium">
                <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-100 text-indigo-700 font-semibold text-[11px]">
                  {data?.studentInfo?.classroomName || 'Kelas -'}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">NIS: {data?.studentInfo?.nis || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/70 text-xs font-medium text-slate-600 shadow-2xs shrink-0">
            <Calendar size={15} className="text-indigo-600 shrink-0" />
            <span>{todayDateFormatted}</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Overview Stats Grid (4 Kolom Rata & Seimbang) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Presensi Kehadiran */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between gap-3 group hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kehadiran</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">
              {data?.attendancePercentage ?? 0}<span className="text-lg font-bold text-emerald-600">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Semester Berjalan</p>
          </div>
        </div>

        {/* Poin Kedisiplinan / Pelanggaran */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between gap-3 group hover:border-amber-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggaran</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">
              {data?.violationPoints ?? 0} <span className="text-sm font-bold text-amber-600">Poin</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Catatan Kedisiplinan</p>
          </div>
        </div>

        {/* Jadwal Hari Ini */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between gap-3 group hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal Kelas</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">
              {data?.todaySchedules?.length ?? 0} <span className="text-sm font-bold text-indigo-600">Mapel</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Jadwal Hari Ini</p>
          </div>
        </div>

        {/* Pengumuman Sekolah */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between gap-3 group hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pengumuman</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">
              {announcements.length} <span className="text-sm font-bold text-blue-600">Aktif</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Informasi Sekolah</p>
          </div>
        </div>

      </div>

      {/* 3. Aktivitas Hari Ini (2 Kolom Seimbang: Presensi Real-Time & Jadwal Pelajaran) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Monitor Presensi Real-Time Siswa (6 Kolom) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-indigo-600">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Presensi Siswa Hari Ini</h3>
                  <p className="text-xs text-slate-500 font-normal">Monitor status kehadiran dan check-in ananda</p>
                </div>
              </div>
            </div>

            {/* Status Real-time Cardlet */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Terkini</span>
              {renderAttendanceBadge()}
            </div>

            {/* Rekap Kehadiran Semester */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rekap Semester Ini</span>
                <span className="text-[11px] font-medium text-slate-500">
                  Total {attendanceStats?.totalDays ?? 0} Hari Efektif
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Hadir</span>
                  <span className="text-lg font-black text-emerald-800">{attendanceStats?.present ?? 0}</span>
                </div>
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Sakit</span>
                  <span className="text-lg font-black text-amber-800">{attendanceStats?.sick ?? 0}</span>
                </div>
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Izin</span>
                  <span className="text-lg font-black text-blue-800">{attendanceStats?.permit ?? 0}</span>
                </div>
                <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Alpa</span>
                  <span className="text-lg font-black text-rose-800">{attendanceStats?.absent ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Note untuk Wali Murid */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
              <Info size={15} className="text-indigo-500 shrink-0 mt-0.5" />
              <span>
                Jika ada kendala kehadiran atau ketidakhadiran ananda karena sakit atau keperluan penting, mohon segera hubungi wali kelas.
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Jadwal Pelajaran Hari Ini (6 Kolom) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4 flex flex-col justify-between min-h-[340px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-purple-600">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Jadwal Pelajaran Ananda</h3>
                  <p className="text-xs text-slate-500 font-normal">Daftar kelas dan guru pengampu yang berlangsung hari ini</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                {data?.todaySchedules?.length ?? 0} Kelas
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {data?.todaySchedules && data.todaySchedules.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.todaySchedules.map((schedule) => (
                    <div 
                      key={schedule.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 border border-slate-100 rounded-xl bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-100 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-bold text-slate-700 font-mono shadow-2xs flex items-center gap-1.5 shrink-0">
                          <Clock size={13} className="text-indigo-500" />
                          <span>{schedule.time}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {schedule.subject}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{schedule.teacher}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs shrink-0 self-end sm:self-auto">
                        <MapPin size={13} className="text-indigo-500" />
                        <span>{schedule.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-2 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/40">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <p className="text-xs font-medium text-slate-500">Tidak ada jadwal pelajaran ananda hari ini.</p>
                  <p className="text-[11px] text-slate-400">Selamat mendampingi kegiatan belajar mandiri ananda di rumah.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Papan Pengumuman Sekolah (Full-Width Horizontal Carousel yang Mewah) */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2.5 text-blue-600">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Megaphone size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Papan Pengumuman Sekolah</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {announcements.length} Pengumuman
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">Informasi resmi, agenda kegiatan, dan surat edaran sekolah</p>
              </div>
            </div>

            {/* Tombol Geser Horizontal */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => scrollSlider('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 rounded-lg transition-colors shadow-2xs border border-slate-200/70 ${
                  canScrollLeft 
                    ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed border-transparent'
                }`}
                title="Geser ke kiri"
                aria-label="Geser ke kiri"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider('right')}
                disabled={!canScrollRight}
                className={`p-1.5 rounded-lg transition-colors shadow-2xs border border-slate-200/70 ${
                  canScrollRight 
                    ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed border-transparent'
                }`}
                title="Geser ke kanan"
                aria-label="Geser ke kanan"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Slider Track Container */}
          <div className="relative w-full min-w-0 max-w-full overflow-hidden">
            {canScrollLeft && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/90 to-transparent z-10 transition-opacity duration-200" />
            )}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/90 to-transparent z-10 transition-opacity duration-200" />
            )}

            <div 
              ref={sliderRef}
              className="flex gap-4.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-1 px-1 scroll-pl-1 w-full min-w-0 max-w-full"
              style={{ scrollbarWidth: 'thin' }}
            >
              {announcements.map((ann) => {
                const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
                const posterUrl = ann.posterUrl ? `${apiBaseUrl}${ann.posterUrl}` : null;

                return (
                  <div 
                    key={ann.id}
                    onClick={() => onSelectAnnouncement(ann)}
                    className={`w-[280px] sm:w-[310px] h-[350px] shrink-0 snap-start rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between overflow-hidden group select-none ${
                      ann.isPinned 
                        ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300' 
                        : 'bg-white border-slate-200/90 hover:border-indigo-300'
                    }`}
                  >
                    {/* Banner Atas */}
                    {posterUrl ? (
                      <div className="relative h-32 w-full bg-slate-900 overflow-hidden shrink-0 border-b border-slate-100">
                        <img 
                          src={posterUrl} 
                          alt={ann.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-900/85 text-white backdrop-blur-md shadow-xs">
                            {ann.targetAudience || 'SEMUA'}
                          </span>
                          {ann.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md shadow-xs">
                              <Pin size={10} className="fill-amber-900" /> Semat
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-32 w-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 overflow-hidden shrink-0 border-b border-indigo-100 flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-1 text-white/90 z-10">
                          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
                            <Megaphone size={18} className="text-white" />
                          </div>
                          <span className="text-[10px] font-semibold tracking-wide text-indigo-100">
                            Pengumuman Sekolah
                          </span>
                        </div>
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-white/25 text-white backdrop-blur-md shadow-xs border border-white/20">
                            {ann.targetAudience || 'SEMUA'}
                          </span>
                          {ann.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md shadow-xs">
                              <Pin size={10} className="fill-amber-900" /> Semat
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Konten Card */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-2 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <h4 
                          className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 break-words [overflow-wrap:anywhere] [word-break:break-word]"
                          title={ann.title}
                        >
                          {ann.title}
                        </h4>
                        <p 
                          className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]"
                          title={ann.content}
                        >
                          {ann.content}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 shrink-0">
                        {ann.attachmentUrl ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100/80 min-w-0">
                            <FileText size={12} className="text-indigo-600 shrink-0" />
                            <span className="truncate min-w-0 flex-1" title={ann.attachmentName || 'Dokumen Resmi'}>
                              {ann.attachmentName || 'Dokumen Resmi'}
                            </span>
                          </div>
                        ) : (
                          <div className="h-5" />
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar size={11} />
                            {new Date(ann.publishDate || ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5 shrink-0">
                            Baca Detail &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
