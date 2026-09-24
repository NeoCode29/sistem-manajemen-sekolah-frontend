import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles
} from 'lucide-react';
import { getMyDashboardSummary, type DashboardSummary } from '../../api/studentPortalService';
import { getMyAnnouncements, type Announcement } from '../../api/announcementService';
import { AnnouncementDetailModal } from '../Announcements/AnnouncementDetailModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement modal & slider state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

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
    const fetchData = async () => {
      try {
        const [summary, ann] = await Promise.all([
          getMyDashboardSummary(),
          getMyAnnouncements()
        ]);
        setData(summary);
        setAnnouncements(ann);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto w-full min-w-0 max-w-full">
      
      {/* 1. Hero Header Sambutan */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50/70 via-blue-50/40 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Portal Siswa & Akademik</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang, <span className="text-indigo-600">{user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}</span>! 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal max-w-2xl leading-relaxed">
            Pantau kehadiran, jadwal mata pelajaran harian, dan pengumuman resmi sekolah Anda secara langsung.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-start md:self-auto bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/70 text-xs font-medium text-slate-600 shadow-2xs">
          <Calendar size={15} className="text-indigo-600 shrink-0" />
          <span>{todayDateFormatted}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-sm font-medium">Memuat data dashboard siswa...</span>
        </div>
      ) : (
        <>
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

          {/* 3. Aktivitas Hari Ini (2 Kolom Seimbang: Presensi & Jadwal) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Kolom Kiri: Presensi Mandiri (6 Kolom) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {!isGuardian ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                  <div className="flex items-center gap-2.5 text-indigo-600 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Presensi Kehadiran Siswa</h3>
                      <p className="text-xs text-slate-500 font-normal">Check-in mandiri berbasis lokasi GPS area sekolah</p>
                    </div>
                  </div>
                  <GeolocationCheckin />
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-indigo-600 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Status Kehadiran Siswa</h3>
                      <p className="text-xs text-slate-500 font-normal">Informasi presensi anak Anda hari ini</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sebagai Orang Tua / Wali Murid, Anda dapat memantau presensi dan rekap kehadiran siswa secara berkala melalui menu navigasi.
                  </p>
                </div>
              )}
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
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Jadwal Pelajaran Hari Ini</h3>
                      <p className="text-xs text-slate-500 font-normal">Daftar kelas dan guru pengampu yang berlangsung</p>
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
                      <p className="text-xs font-medium text-slate-500">Tidak ada jadwal pelajaran hari ini.</p>
                      <p className="text-[11px] text-slate-400">Selamat beristirahat atau nikmati kegiatan belajar mandiri.</p>
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
                    <p className="text-xs text-slate-500 font-normal">Informasi resmi, poster kegiatan, dan agenda sekolah untuk Anda</p>
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
                        onClick={() => {
                          setSelectedAnnouncement(ann);
                          setIsDetailOpen(true);
                        }}
                        className={`w-[280px] sm:w-[310px] h-[350px] shrink-0 snap-start rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between overflow-hidden group select-none ${
                          ann.isPinned 
                            ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300' 
                            : 'bg-white border-slate-200/90 hover:border-indigo-300'
                        }`}
                      >
                        {/* Banner Atas (Poster Asli atau Gradient Banner Elegan) */}
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
        </>
      )}

      {/* Announcement Detail Modal for Student */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAnnouncement(null);
        }}
      />
    </div>
  );
};
