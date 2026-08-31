import React, { useEffect, useState } from 'react';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, AlertTriangle, Calendar, Clock, MapPin, Megaphone, Pin } from 'lucide-react';
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>
        Selamat Datang, {user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}!
      </h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Memuat data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Kolom Kiri: Widget Absensi & Jadwal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Hanya tampilkan form check-in jika BUKAN wali murid */}
            {!isGuardian && <GeolocationCheckin />}
            
            <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#8b5cf6" />
                Jadwal Anak Hari Ini
              </h3>
              {data?.todaySchedules && data.todaySchedules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.todaySchedules.map((schedule) => (
                    <div key={schedule.id} style={{ display: 'flex', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                      <div style={{ minWidth: '90px', borderRight: '1px solid #e5e7eb', paddingRight: '1rem', marginRight: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{schedule.time}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: '0.25rem' }}>{schedule.subject}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{schedule.teacher}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        <MapPin size={16} /> {schedule.room}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Tidak ada jadwal pelajaran hari ini.
                </p>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Info Ringkas & Pengumuman */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981' }}>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Kehadiran Semester Ini</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{data?.attendancePercentage ?? 0}%</div>
              </div>
              <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Poin Pelanggaran</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{data?.violationPoints ?? 0}</div>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={20} color="#3b82f6" />
                Pengumuman Sekolah
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Belum ada pengumuman terbaru dari sekolah.</p>
                ) : (
                  announcements.slice(0, 3).map((item) => (
                    <div key={item.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: '#111827', flex: 1, lineHeight: 1.4 }}>{item.title}</h4>
                        {item.isPinned && <Pin size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />}
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: item.content }} style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} />
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

