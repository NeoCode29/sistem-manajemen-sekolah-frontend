import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Megaphone, 
  Pin,
  UserCheck, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  FileCheck2, 
  BookOpen,
  Inbox,
  Send,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { 
  getDashboardSummary, 
  getTeacherDashboardSummary,
  getPrincipalDashboardSummary,
  getStaffDashboardSummary
} from '../../api/dashboardService';
import type { 
  DashboardSummary, 
  TeacherDashboardSummary,
  PrincipalDashboardSummary,
  StaffDashboardSummary
} from '../../api/dashboardService';
import { PageHeader } from '../../components/ui/PageHeader';
import { AnnouncementDetailModal } from '../Announcements/AnnouncementDetailModal';
import { AdminDashboardView } from './views/AdminDashboardView';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { PrincipalDashboardView } from './views/PrincipalDashboardView';
import { StaffDashboardView } from './views/StaffDashboardView';
import { CustomRoleDashboardView } from './views/CustomRoleDashboardView';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRoleNames = user?.roles?.map((r) => r.name) || [];
  const isSuperAdmin = userRoleNames.includes('Super Admin');
  const isAdminSekolah = userRoleNames.includes('Admin Sekolah');
  const isKepalaSekolah = userRoleNames.includes('Kepala Sekolah');
  const isTeacher = userRoleNames.some((r) => ['Guru / Wali Kelas', 'Guru'].includes(r));
  const isStaff = userRoleNames.some((r) => ['Staf', 'Pegawai', 'Tata Usaha'].includes(r));
  const isStudentOrGuardian = (userRoleNames.includes('Siswa') || userRoleNames.includes('Orang Tua / Wali')) && 
    !isSuperAdmin && !isAdminSekolah && !isTeacher && !isKepalaSekolah && !isStaff;

  // Strict Role Hierarchy: Predefined vs Custom
  const isPrincipal = isKepalaSekolah;
  const isAdmin = (isSuperAdmin || isAdminSekolah) && !isPrincipal;
  const isPureTeacher = isTeacher && !isSuperAdmin && !isAdminSekolah && !isPrincipal;
  const isStaffOnly = isStaff && !isPrincipal && !isAdmin && !isPureTeacher;
  const isCustomRole = !isPrincipal && !isAdmin && !isPureTeacher && !isStaffOnly && !isStudentOrGuardian;
  const isEmployee = isTeacher || isKepalaSekolah || isStaff || Boolean(user?.employeeId);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adminSummary, setAdminSummary] = useState<DashboardSummary | null>(null);
  const [principalSummary, setPrincipalSummary] = useState<PrincipalDashboardSummary | null>(null);
  const [teacherSummary, setTeacherSummary] = useState<TeacherDashboardSummary | null>(null);
  const [staffSummary, setStaffSummary] = useState<StaffDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Announcement Slider & Modal State
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
      const scrollAmount = direction === 'left' ? -340 : 340;
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

  useEffect(() => {
    if (isStudentOrGuardian) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const announcementsData = await getMyAnnouncements();
        setAnnouncements(announcementsData);

        if (isPrincipal) {
          const principalData = await getPrincipalDashboardSummary();
          setPrincipalSummary(principalData);
        } else if (isAdmin) {
          const summaryData = await getDashboardSummary();
          setAdminSummary(summaryData);
        } else if (isPureTeacher) {
          const teacherData = await getTeacherDashboardSummary();
          setTeacherSummary(teacherData);
        } else if (isStaffOnly) {
          const staffData = await getStaffDashboardSummary();
          setStaffSummary(staffData);
        }
        // Custom roles do not require fixed summary endpoints; they derive widgets from permissions
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isStudentOrGuardian, isPrincipal, isAdmin, isPureTeacher, isStaffOnly]);

  // Siswa dan Wali Murid dialihkan langsung ke Portal Siswa/Wali
  if (isStudentOrGuardian) {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-medium gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span>Memuat data dashboard...</span>
      </div>
    );
  }

  // Header Title & Subtitle Generator
  const getHeaderInfo = () => {
    if (isPrincipal) {
      return {
        title: "Dashboard Kepala Sekolah",
        subtitle: `Selamat datang kembali, ${user?.name || 'Bapak/Ibu Kepala Sekolah'}. Berikut ringkasan eksekutif, rekap presensi, dan supervisi rapor sekolah.`
      };
    }
    if (isAdmin) {
      return {
        title: "Dashboard Administrator",
        subtitle: `Selamat datang kembali, ${user?.name || 'Administrator'}. Berikut ringkasan operasional dan data pokok sekolah.`
      };
    }
    if (isPureTeacher) {
      return {
        title: "Dashboard Pendidik",
        subtitle: `Selamat datang kembali, ${user?.name || 'Bapak/Ibu Guru'}. Berikut agenda mengajar dan aktivitas kelas Anda hari ini.`
      };
    }
    if (isStaffOnly) {
      return {
        title: "Dashboard Tata Usaha",
        subtitle: `Selamat datang kembali, ${user?.name || 'Bapak/Ibu Staf'}. Berikut ringkasan persuratan dan catatan kehadiran kerja Anda.`
      };
    }
    return {
      title: `Dashboard ${userRoleNames[0] || 'Kustom'}`,
      subtitle: `Selamat datang kembali, ${user?.name || 'Pengguna'}. Dashboard ini disusun otomatis mengikuti hak akses aktif peran Anda.`
    };
  };

  const { title: headerTitle, subtitle: headerSubtitle } = getHeaderInfo();

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 1. PageHeader Dinamis Berdasarkan Peran */}
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        action={
          isPrincipal ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate('/assessment/report-cards')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200/70 transition-all shadow-xs cursor-pointer"
              >
                <FileCheck2 size={14} />
                <span>Pengesahan Rapor</span>
              </button>
              <button
                onClick={() => navigate('/attendance/students')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/70 transition-all shadow-xs cursor-pointer"
              >
                <Users size={14} />
                <span>Rekap Presensi</span>
              </button>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate('/attendance/students')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/70 transition-all shadow-xs cursor-pointer"
              >
                <UserCheck size={14} />
                <span>Presensi Siswa</span>
              </button>
              <button
                onClick={() => navigate('/attendance/employees')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200/70 transition-all shadow-xs cursor-pointer"
              >
                <Users size={14} />
                <span>Presensi Pegawai</span>
              </button>
            </div>
          ) : isPureTeacher ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate('/assessment/exams')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/70 transition-all shadow-xs cursor-pointer"
              >
                <FileCheck2 size={14} />
                <span>Input Nilai Siswa</span>
              </button>
              <button
                onClick={() => navigate('/academic/schedules')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200/70 transition-all shadow-xs cursor-pointer"
              >
                <BookOpen size={14} />
                <span>Jadwal Saya</span>
              </button>
            </div>
          ) : isStaffOnly ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate('/letters/incoming')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200/70 transition-all shadow-xs cursor-pointer"
              >
                <Inbox size={14} />
                <span>Surat Masuk</span>
              </button>
              <button
                onClick={() => navigate('/letters/outgoing')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/70 transition-all shadow-xs cursor-pointer"
              >
                <Send size={14} />
                <span>Surat Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-200/60">
                <ShieldCheck size={14} />
                <span>Peran: {userRoleNames[0] || 'Kustom'}</span>
              </span>
            </div>
          )
        }
      />

      {/* 2. Papan Pengumuman Sekolah Universal (Horizontal Slider / Carousel) */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4 w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2.5 text-indigo-600">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Megaphone size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Papan Pengumuman</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {announcements.length} Pengumuman
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">Informasi resmi, agenda kegiatan, dan surat edaran sekolah</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  <ChevronLeft size={16} />
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
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Wrapper Carousel */}
          <div className="relative w-full min-w-0 max-w-full">
            <div 
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none w-full min-w-0 max-w-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent 100%)'
              }}
            >
              {announcements.map((ann) => {
                const hasPoster = Boolean(ann.posterUrl);

                return (
                  <div
                    key={ann.id}
                    onClick={() => {
                      setSelectedAnnouncement(ann);
                      setIsDetailOpen(true);
                    }}
                    className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start flex flex-col justify-between bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300/80 transition-all duration-200 cursor-pointer group overflow-hidden h-[360px] min-w-0"
                  >
                    {hasPoster ? (
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden shrink-0">
                        <img 
                          src={ann.posterUrl!} 
                          alt={ann.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider backdrop-blur-xs ${
                            ann.targetAudience === 'SISWA' 
                              ? 'bg-blue-600/90 text-white' 
                              : ann.targetAudience === 'GURU' 
                              ? 'bg-emerald-600/90 text-white' 
                              : 'bg-indigo-600/90 text-white'
                          }`}>
                            {ann.targetAudience}
                          </span>
                          {ann.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300/95 px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                              <Pin size={10} className="fill-amber-900" /> Semat
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 p-3.5 flex flex-col justify-between border-b border-slate-100 shrink-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider ${
                            ann.targetAudience === 'SISWA' 
                              ? 'bg-blue-100 text-blue-700' 
                              : ann.targetAudience === 'GURU' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {ann.targetAudience}
                          </span>
                          {ann.isPinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md shadow-xs">
                              <Pin size={10} className="fill-amber-900" /> Semat
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between gap-2.5 min-w-0">
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
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80 min-w-0">
                            <FileText size={13} className="text-indigo-600 shrink-0" />
                            <span className="truncate min-w-0 flex-1" title={ann.attachmentName || 'Dokumen Resmi'}>
                              {ann.attachmentName || 'Dokumen Resmi (SK/Surat)'}
                            </span>
                          </div>
                        ) : (
                          <div className="h-6" />
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

      {/* 3. Render View Berdasarkan Role */}
      {isPrincipal && principalSummary ? (
        <PrincipalDashboardView summary={principalSummary} />
      ) : isAdmin && adminSummary ? (
        <AdminDashboardView 
          summary={adminSummary} 
          isEmployee={isEmployee} 
        />
      ) : isPureTeacher && teacherSummary ? (
        <TeacherDashboardView summary={teacherSummary} />
      ) : isStaffOnly && staffSummary ? (
        <StaffDashboardView summary={staffSummary} />
      ) : (
        <CustomRoleDashboardView user={user} />
      )}

      {/* Modal Detail Pengumuman */}
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

export default Dashboard;
