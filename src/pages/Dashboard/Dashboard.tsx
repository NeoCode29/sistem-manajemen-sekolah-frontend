import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Clock, Calendar, Megaphone, Pin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { getDashboardSummary } from '../../api/dashboardService';
import type { DashboardSummary } from '../../api/dashboardService';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const now = new Date();
  const currentDate = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const currentTime = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

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
    return <div className="p-8 text-center text-gray-500 font-medium">Memuat dashboard...</div>;
  }

  // Hitung jumlah yang belum absen
  const unrecordedStudents = Math.max(0, summary.totalStudents - summary.attendance.present - summary.attendance.sickLeave - summary.attendance.absent);
  const unrecordedEmployees = Math.max(0, summary.totalEmployees - summary.employeeAttendance.present - summary.employeeAttendance.sickLeave - summary.employeeAttendance.absent);

  // Calculate attendance percentages dari total keseluruhan
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

  // Cek apakah user adalah Guru, Staf, Kepala Sekolah (yang bisa absen)
  const isEmployee = user?.roles?.some(r => ['Guru / Wali Kelas', 'Staf', 'Kepala Sekolah'].includes(r.name));

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter flex flex-col gap-6">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-gray-700 transition-colors">Beranda</span>
          <span>›</span>
          <span className="font-semibold text-gray-900">Dashboard</span>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2.5 border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
              <img src="/icon.svg" alt="App Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Utama</h1>
              <p className="text-gray-500 text-sm">Selamat datang kembali, {user?.name || 'Admin'}. Berikut ringkasan operasional sekolah hari ini.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <Calendar size={16} className="text-gray-400" /> {currentDate}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Siswa */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">Aktif</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">TOTAL SISWA</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{summary.totalStudents.toLocaleString()}</h2>
          </div>
        </div>

        {/* Guru */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
              <Users size={24} />
            </div>
            <span className="bg-gray-50 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">Aktif</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">TOTAL GURU & STAF</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{summary.totalEmployees.toLocaleString()}</h2>
          </div>
        </div>

        {/* Kelas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <GraduationCap size={24} />
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">ROMBEL</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">KELAS AKTIF</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{summary.activeClassrooms.toLocaleString()}</h2>
          </div>
        </div>

        {/* Tahun Ajaran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-50 text-pink-600">
              <Calendar size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">TAHUN AJARAN</p>
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{summary.academicYear.name}</h2>
            <span className="inline-block mt-2 text-xs font-semibold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-md border border-pink-100">
              {summary.academicYear.semester}
            </span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ringkasan Absensi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ringkasan Absensi Hari Ini</h3>
              <p className="text-xs text-gray-500 mt-1">Update terakhir: {currentTime}</p>
            </div>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Detail Laporan</a>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 flex-1">
            {/* Absensi Siswa */}
            <div className="flex flex-col items-center gap-6 bg-white border border-gray-50 rounded-2xl p-4 xl:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-32 h-32 xl:w-40 xl:h-40 rounded-full flex items-center justify-center flex-shrink-0 mt-2" 
                   style={{ 
                     border: '16px solid #f3f4f6', 
                     borderTopColor: presentPct > 0 ? '#3b82f6' : '#f3f4f6', 
                     borderRightColor: presentPct > 25 ? '#3b82f6' : '#f3f4f6', 
                     borderBottomColor: presentPct > 50 ? '#3b82f6' : '#f3f4f6', 
                     borderLeftColor: presentPct > 75 ? '#3b82f6' : '#f3f4f6' 
                   }}>
                <div className="text-center">
                  <div className="text-2xl xl:text-3xl font-extrabold text-gray-900">{presentPct}%</div>
                  <div className="text-[10px] xl:text-xs font-bold text-gray-500 mt-1 uppercase">Siswa</div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Hadir</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{summary.attendance.present.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({presentPct}%)</span></div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Izin/Sakit</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{summary.attendance.sickLeave.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({sickPct}%)</span></div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Alpa</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{summary.attendance.absent.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({absentPct}%)</span></div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Belum Absen</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{unrecordedStudents.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({unrecordedPct}%)</span></div>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-2.5 rounded-xl mt-1 text-center w-full">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">KELAS BELUM ABSENSI</div>
                  <div className="text-lg font-extrabold text-red-500">{summary.classesWithoutAttendance.toLocaleString()} Kelas</div>
                </div>
              </div>
            </div>

            {/* Absensi Guru */}
            <div className="flex flex-col items-center gap-6 bg-white border border-gray-50 rounded-2xl p-4 xl:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-32 h-32 xl:w-40 xl:h-40 rounded-full flex items-center justify-center flex-shrink-0 mt-2" 
                   style={{ 
                     border: '16px solid #f3f4f6', 
                     borderTopColor: empPresentPct > 0 ? '#8b5cf6' : '#f3f4f6', 
                     borderRightColor: empPresentPct > 25 ? '#8b5cf6' : '#f3f4f6', 
                     borderBottomColor: empPresentPct > 50 ? '#8b5cf6' : '#f3f4f6', 
                     borderLeftColor: empPresentPct > 75 ? '#8b5cf6' : '#f3f4f6' 
                   }}>
                <div className="text-center">
                  <div className="text-2xl xl:text-3xl font-extrabold text-gray-900">{empPresentPct}%</div>
                  <div className="text-[10px] xl:text-xs font-bold text-gray-500 mt-1 uppercase">Guru</div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Hadir</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{summary.employeeAttendance.present.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({empPresentPct}%)</span></div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Izin/Sakit</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{summary.employeeAttendance.sickLeave.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({empSickPct}%)</span></div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Alpa</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{summary.employeeAttendance.absent.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({empAbsentPct}%)</span></div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></span> 
                    <span className="text-sm font-medium text-gray-700">Belum Absen</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{unrecordedEmployees.toLocaleString()} <span className="text-gray-400 font-normal ml-0.5">({empUnrecordedPct}%)</span></div>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-2.5 rounded-xl mt-1 text-center w-full">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">GURU ABSEN (ALPA)</div>
                  <div className="text-lg font-extrabold text-purple-600">{summary.employeeAttendance.absent.toLocaleString()} Orang</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Absensi Geo & Aktivitas Terbaru */}
        <div className="flex flex-col gap-6">
          
          {isEmployee && (
            <GeolocationCheckin />
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Aktivitas Terbaru</h3>
              <p className="text-xs text-gray-500 mt-1">Log sistem dan log administratif</p>
            </div>
            <div className="p-5 flex flex-col gap-6 relative flex-1">
              <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-gray-100 rounded-full"></div>
              
              {summary.recentActivities && summary.recentActivities.length > 0 ? (
                summary.recentActivities.map((act, idx) => (
                  <div key={act.id} className="flex gap-4 relative group">
                    <div className={`w-4 h-4 rounded-full border-4 border-white z-10 mt-1 shadow-sm ${idx === 0 ? 'bg-blue-400' : idx === 1 ? 'bg-blue-600' : 'bg-amber-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 leading-snug">
                        {act.message} <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-1 font-semibold border border-gray-200">{act.status}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5 font-medium">
                        <Clock size={12} /> {new Date(act.createdAt).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-gray-400 text-sm italic pl-4">
                  Belum ada aktivitas terbaru hari ini.
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Lihat Semua Aktivitas</a>
            </div>
          </div>
        </div>

      </div>

      {/* Papan Pengumuman */}
      <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl shadow-md border border-indigo-800 overflow-hidden relative mt-2">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between z-10 relative border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
              <Megaphone size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Papan Pengumuman</h3>
              <p className="text-indigo-200 text-sm mt-1">Informasi dan pengumuman terbaru untuk seluruh sivitas</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/announcements')}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all backdrop-blur-sm"
          >
            Lihat Semua
          </button>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {announcements.length === 0 ? (
            <p className="text-sm text-indigo-300 col-span-3 text-center py-4">Belum ada pengumuman terbaru.</p>
          ) : (
            announcements.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-5 flex flex-col backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-3">
                  <h4 className="text-base font-bold text-white flex-1 leading-tight">{item.title}</h4>
                  {item.isPinned && <Pin size={16} className="text-amber-300 shrink-0 mt-0.5 drop-shadow-sm" />}
                </div>
                <div dangerouslySetInnerHTML={{ __html: item.content }} className="text-sm text-indigo-100/80 leading-relaxed line-clamp-3" />
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};




