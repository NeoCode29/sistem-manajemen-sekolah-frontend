import React, { useEffect, useState } from 'react';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, Megaphone, Pin, Clock, Sparkles } from 'lucide-react';
import { getMyDashboardSummary, type DashboardSummary } from '../../api/studentPortalService';
import { getMyAnnouncements, type Announcement } from '../../api/announcementService';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

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

  return (
    <div className="max-w-7xl mx-auto page-enter pb-8">
      {/* Welcome Banner */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-indigo-600 text-xs sm:text-sm font-bold tracking-wide uppercase mb-1">
          <Sparkles size={16} />
          <span>{isGuardian ? 'Portal Wali Murid' : 'Portal Siswa'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
          Selamat Datang,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
            {user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}
          </span>
          ! 👋
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm font-medium mt-1">
          {isGuardian
            ? 'Pantau aktivitas presensi, jadwal, dan nilai akademik putra/putri Anda secara langsung.'
            : 'Selamat belajar! Cek jadwal pelajaran hari ini dan pantau kehadiranmu.'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 font-medium text-sm">Memuat data dashboard...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
          {/* Kolom Kiri: Widget Absensi & Jadwal */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
            {/* Form check-in (hanya untuk siswa) */}
            {!isGuardian && <GeolocationCheckin />}

            {/* Jadwal Hari Ini */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 lg:p-7 hover:shadow-md transition-shadow">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Calendar size={20} />
                </div>
                <span>Jadwal Pelajaran Hari Ini</span>
              </h3>

              {data?.todaySchedules && data.todaySchedules.length > 0 ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {data.todaySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex flex-col sm:flex-row p-4 border border-gray-100 rounded-xl bg-gray-50/60 hover:bg-indigo-50/40 hover:border-indigo-100 transition-colors group gap-3 sm:gap-4 sm:items-center justify-between"
                    >
                      <div className="flex items-center gap-2 sm:w-32 sm:border-r border-gray-200 sm:pr-4 flex-shrink-0">
                        <Clock size={16} className="text-gray-400 group-hover:text-indigo-500 flex-shrink-0" />
                        <span className="font-bold text-xs sm:text-sm text-gray-700">{schedule.time}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm sm:text-base leading-tight mb-1 truncate">
                          {schedule.subject}
                        </div>
                        <div className="text-gray-500 text-xs sm:text-sm font-medium truncate">
                          {schedule.teacher}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-600 text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs self-start sm:self-auto flex-shrink-0">
                        <MapPin size={14} className="text-indigo-500" />
                        <span>{schedule.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">
                    Tidak ada jadwal pelajaran hari ini.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Quick Stats & Pengumuman */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-emerald-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="text-gray-500 text-[10px] sm:text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Kehadiran
                </div>
                <div className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">
                  {data?.attendancePercentage ?? 0}
                  <span className="text-xl sm:text-2xl text-emerald-500 font-bold">%</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-2 font-medium">Bulan berjalan</div>
              </div>

              <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-orange-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/20 transition-colors"></div>
                <div className="text-gray-500 text-[10px] sm:text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Pelanggaran
                </div>
                <div className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">
                  {data?.violationPoints ?? 0}
                  <span className="text-xs sm:text-sm font-semibold text-orange-500 ml-1">Poin</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-2 font-medium">Poin kedisiplinan</div>
              </div>
            </div>

            {/* Pengumuman Terbaru */}
            <div className="bg-white/80 backdrop-blur-md p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5 flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Megaphone size={20} />
                </div>
                <span>Pengumuman Sekolah</span>
              </h3>

              <div className="flex flex-col gap-3">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-xs sm:text-sm text-center py-6">
                    Belum ada pengumuman terbaru dari sekolah.
                  </p>
                ) : (
                  announcements.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 border border-gray-100 rounded-xl bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-colors relative overflow-hidden"
                    >
                      {item.isPinned && (
                        <div className="absolute top-0 right-0 w-10 h-10 bg-amber-500 text-white flex justify-end p-1.5 transform rotate-45 translate-x-1/2 -translate-y-1/2 shadow-xs">
                          <Pin size={10} className="-rotate-45" />
                        </div>
                      )}
                      <div className="flex items-start gap-2 mb-1.5 pr-6">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                          {item.title}
                        </h4>
                      </div>
                      <div
                        dangerouslySetInnerHTML={{ __html: item.content }}
                        className="text-xs text-gray-500 leading-relaxed line-clamp-3 prose prose-xs"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
