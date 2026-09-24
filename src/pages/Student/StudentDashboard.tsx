import React, { useEffect, useState } from 'react';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, Megaphone, Pin, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { getMyDashboardSummary, type DashboardSummary } from '../../api/studentPortalService';
import { getMyAnnouncements, type Announcement } from '../../api/announcementService';
import { AnnouncementDetailModal } from '../Announcements/AnnouncementDetailModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    <div className="max-w-7xl mx-auto page-enter">
      <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
        Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}</span>!
      </h2>
      
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 font-medium">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Kolom Kiri: Widget Absensi & Jadwal */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
            
            {/* Hanya tampilkan form check-in jika BUKAN wali murid */}
            {!isGuardian && <GeolocationCheckin />}
            
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar size={22} className="text-purple-600" />
                </div>
                Jadwal Pelajaran Hari Ini
              </h3>
              
              {data?.todaySchedules && data.todaySchedules.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {data.todaySchedules.map((schedule) => (
                    <div key={schedule.id} className="flex flex-col sm:flex-row p-4 sm:p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-indigo-50/50 transition-colors group">
                      <div className="sm:w-28 sm:border-r border-gray-200 sm:pr-4 sm:mr-4 mb-3 sm:mb-0 flex items-center sm:items-start gap-2">
                        <Clock size={16} className="text-gray-400 group-hover:text-indigo-500" />
                        <div className="font-bold text-sm text-gray-700">{schedule.time}</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg mb-1">{schedule.subject}</div>
                        <div className="text-gray-500 text-sm font-medium">{schedule.teacher}</div>
                      </div>
                      <div className="mt-3 sm:mt-0 flex items-center gap-1.5 text-gray-500 text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm self-start">
                        <MapPin size={16} className="text-indigo-500" /> {schedule.room}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <p className="text-gray-500 font-medium">Tidak ada jadwal pelajaran hari ini.</p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Info Ringkas & Pengumuman */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/70 backdrop-blur-md p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Kehadiran</div>
                <div className="text-4xl font-extrabold text-gray-900">{data?.attendancePercentage ?? 0}<span className="text-2xl text-emerald-500">%</span></div>
              </div>
              <div className="bg-white/70 backdrop-blur-md p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/20 transition-colors"></div>
                <div className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">Pelanggaran</div>
                <div className="text-4xl font-extrabold text-gray-900">{data?.violationPoints ?? 0} <span className="text-sm font-medium text-orange-500">Poin</span></div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Megaphone size={22} className="text-blue-600" />
                </div>
                Pengumuman Terbaru
              </h3>
              
              <div className="flex flex-col gap-4">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Belum ada pengumuman terbaru dari sekolah.</p>
                ) : (
                  announcements.slice(0, 4).map((item) => {
                    const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
                    const posterUrl = item.posterUrl ? `${apiBaseUrl}${item.posterUrl}` : null;

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setSelectedAnnouncement(item);
                          setIsDetailOpen(true);
                        }}
                        className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all relative overflow-hidden cursor-pointer group"
                      >
                        {item.isPinned && (
                          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500 text-white flex justify-end p-2 transform rotate-45 translate-x-1/2 -translate-y-1/2 shadow-xs">
                            <Pin size={12} className="-rotate-45 fill-white" />
                          </div>
                        )}

                        {/* Poster Thumbnail jika ada */}
                        {posterUrl && (
                          <div className="h-28 w-full rounded-lg overflow-hidden mb-3 bg-slate-900 border border-slate-100 shrink-0">
                            <img 
                              src={posterUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5 min-w-0 pr-6">
                          <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1 break-words [overflow-wrap:anywhere]">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
                            {item.content}
                          </p>
                        </div>

                        {/* Chip Berkas Dokumen & Tanggal */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                          {item.attachmentUrl ? (
                            <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate max-w-[180px]">
                              <FileText size={11} className="text-indigo-600 shrink-0" />
                              <span className="truncate">{item.attachmentName || 'Dokumen Resmi'}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(item.publishDate || item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}

                          <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5 shrink-0 ml-auto">
                            Baca Detail &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

        </div>
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
