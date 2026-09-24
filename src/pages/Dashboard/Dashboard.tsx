import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  Calendar, 
  Megaphone, 
  Pin,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { getDashboardSummary } from '../../api/dashboardService';
import type { DashboardSummary } from '../../api/dashboardService';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';
import { PageHeader } from '../../components/ui/PageHeader';
import { AnnouncementDetailModal } from '../Announcements/AnnouncementDetailModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const now = new Date();
  const currentTime = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Announcement Slider & Modal State
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await getMyAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-medium gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span>Memuat data dashboard...</span>
      </div>
    );
  }

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

  // Cek apakah user adalah Guru, Staf, Kepala Sekolah
  const isEmployee = user?.roles?.some(r => ['Guru / Wali Kelas', 'Staf', 'Kepala Sekolah'].includes(r.name));

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. PageHeader Tunggal Elegan */}
      <PageHeader
        title="Dashboard Utama"
        subtitle={`Selamat datang kembali, ${user?.name || 'Administrator'}. Berikut ringkasan operasional dan data pokok sekolah.`}
        action={
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
        }
      />

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Siswa */}
        <div 
          onClick={() => navigate('/entities/students')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50/70 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              <Users size={22} />
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200/70">Aktif</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">TOTAL SISWA</p>
            <h2 className="text-3xl font-black text-slate-900">{summary.totalStudents.toLocaleString()}</h2>
          </div>
        </div>

        {/* Guru */}
        <div 
          onClick={() => navigate('/entities/employees')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-4 relative overflow-hidden group hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-50/70 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100/80">
              <Users size={22} />
            </div>
            <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-200/70">PTK</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">TOTAL GURU & STAF</p>
            <h2 className="text-3xl font-black text-slate-900">{summary.totalEmployees.toLocaleString()}</h2>
          </div>
        </div>

        {/* Kelas */}
        <div 
          onClick={() => navigate('/academic/classrooms')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-4 relative overflow-hidden group hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50/70 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100/80">
              <GraduationCap size={22} />
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200/70">ROMBEL</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">KELAS AKTIF</p>
            <h2 className="text-3xl font-black text-slate-900">{summary.activeClassrooms.toLocaleString()}</h2>
          </div>
        </div>

        {/* Tahun Ajaran */}
        <div 
          onClick={() => navigate('/academic/years')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-4 relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-50/70 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100/80">
              <Calendar size={22} />
            </div>
            <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200/70">{summary.academicYear.semester}</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">TAHUN AJARAN</p>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{summary.academicYear.name}</h2>
          </div>
        </div>

      </div>

      {/* 4. Main Analytics & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ringkasan Absensi Hari Ini */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">Ringkasan Kehadiran Hari Ini</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pembaruan sistem: {currentTime}</p>
            </div>
            <button 
              onClick={() => navigate('/attendance/students')} 
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              <span>Detail Laporan</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 flex-1">
            {/* Absensi Siswa */}
            <div className="flex flex-col items-center gap-5 bg-slate-50/40 border border-slate-100 rounded-2xl p-5 shadow-xs">
              <div 
                className="relative w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 mt-1" 
                style={{ 
                  border: '14px solid #f1f5f9', 
                  borderTopColor: presentPct > 0 ? '#4f46e5' : '#f1f5f9', 
                  borderRightColor: presentPct > 25 ? '#4f46e5' : '#f1f5f9', 
                  borderBottomColor: presentPct > 50 ? '#4f46e5' : '#f1f5f9', 
                  borderLeftColor: presentPct > 75 ? '#4f46e5' : '#f1f5f9' 
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900">{presentPct}%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Siswa Hadir</div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Hadir</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.present.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({presentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Izin / Sakit</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.sickLeave.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({sickPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Alpa</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.attendance.absent.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({absentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Belum Direkam</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {unrecordedStudents.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({unrecordedPct}%)</span>
                  </div>
                </div>
                <div className="border border-slate-200/70 bg-white p-2.5 rounded-xl mt-1 text-center w-full">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ROMBEL BELUM ABSENSI</div>
                  <div className="text-base font-bold text-rose-600">{summary.classesWithoutAttendance.toLocaleString()} Kelas</div>
                </div>
              </div>
            </div>

            {/* Absensi Guru & Pegawai */}
            <div className="flex flex-col items-center gap-5 bg-slate-50/40 border border-slate-100 rounded-2xl p-5 shadow-xs">
              <div 
                className="relative w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 mt-1" 
                style={{ 
                  border: '14px solid #f1f5f9', 
                  borderTopColor: empPresentPct > 0 ? '#7c3aed' : '#f1f5f9', 
                  borderRightColor: empPresentPct > 25 ? '#7c3aed' : '#f1f5f9', 
                  borderBottomColor: empPresentPct > 50 ? '#7c3aed' : '#f1f5f9', 
                  borderLeftColor: empPresentPct > 75 ? '#7c3aed' : '#f1f5f9' 
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900">{empPresentPct}%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Pegawai Hadir</div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Hadir</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.employeeAttendance.present.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empPresentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Izin / Sakit</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.employeeAttendance.sickLeave.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empSickPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Alpa</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {summary.employeeAttendance.absent.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empAbsentPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span> 
                    <span className="text-xs font-medium text-slate-700">Belum Direkam</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {unrecordedEmployees.toLocaleString()} <span className="text-slate-400 font-normal ml-0.5">({empUnrecordedPct}%)</span>
                  </div>
                </div>
                <div className="border border-slate-200/70 bg-white p-2.5 rounded-xl mt-1 text-center w-full">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">PEGAWAI ALPA</div>
                  <div className="text-base font-bold text-purple-600">{summary.employeeAttendance.absent.toLocaleString()} Orang</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Geolocation Checkin & Aktivitas Terbaru */}
        <div className="flex flex-col gap-6">
          
          {isEmployee && (
            <GeolocationCheckin />
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col flex-1 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm md:text-base font-bold text-slate-900">Aktivitas Sistem Terbaru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Log pembaruan data dan operasional sekolah</p>
            </div>
            <div className="p-5 flex flex-col gap-5 relative flex-1">
              <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-slate-100 rounded-full"></div>
              
              {summary.recentActivities && summary.recentActivities.length > 0 ? (
                summary.recentActivities.map((act, idx) => (
                  <div key={act.id} className="flex gap-4 relative group">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 mt-1 shadow-xs ${
                      idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-purple-600' : 'bg-slate-300'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
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
        </div>

      </div>

      {/* 5. Papan Pengumuman Sekolah (Horizontal Slider / Carousel) */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-600">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Megaphone size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Papan Pengumuman Sekolah</h3>
                <p className="text-xs text-slate-500 font-normal">Informasi resmi, poster kegiatan, dan surat edaran sekolah</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Navigasi Geser (Slide Horizontal) */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs border border-slate-200/70 cursor-pointer"
                  title="Geser ke kiri"
                  aria-label="Geser ke kiri"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs border border-slate-200/70 cursor-pointer"
                  title="Geser ke kanan"
                  aria-label="Geser ke kanan"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              <button 
                onClick={() => navigate('/announcements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Slider Container Bergeser ke Samping Kanan */}
          <div 
            ref={sliderRef}
            className="flex gap-4.5 overflow-x-auto snap-x scroll-smooth pb-2 pt-1"
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
                  className={`w-[290px] sm:w-[320px] shrink-0 snap-start rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between overflow-hidden group select-none ${
                    ann.isPinned 
                      ? 'bg-amber-50/25 border-amber-200 hover:border-amber-300' 
                      : 'bg-white border-slate-200/90 hover:border-indigo-300'
                  }`}
                >
                  {/* Poster Banner (Dengan Proteksi Ukuran & Rasio Tetap) */}
                  {posterUrl ? (
                    <div className="relative h-36 w-full bg-slate-900 overflow-hidden shrink-0 border-b border-slate-100">
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
                    <div className="p-4 pb-0 flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {ann.targetAudience || 'SEMUA'}
                      </span>
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Pin size={10} className="fill-amber-600" /> Disematkan
                        </span>
                      )}
                    </div>
                  )}

                  {/* Konten Card dengan Proteksi Teks (Anti-Bleed) */}
                  <div className="p-4.5 flex-1 flex flex-col justify-between gap-3 min-w-0">
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate" title={ann.title}>
                        {ann.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere]">
                        {ann.content}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {/* Chip Dokumen Lampiran Resmi (SK / Berita Acara) */}
                      {ann.attachmentUrl && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80 truncate">
                          <FileText size={13} className="text-indigo-600 shrink-0" />
                          <span className="truncate" title={ann.attachmentName || 'Dokumen Resmi'}>
                            {ann.attachmentName || 'Dokumen Resmi (SK/Surat)'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(ann.publishDate || ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
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
      )}

      {/* Announcement Detail Modal */}
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
