import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Clock, Calendar, Megaphone, Pin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { getDashboardSummary } from '../../api/dashboardService';
import type { DashboardSummary } from '../../api/dashboardService';
import { GeolocationCheckin } from '../../components/widgets/GeolocationCheckin';
import './Dashboard.css';

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
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  // Calculate attendance percentages
  const totalAttendance = summary.attendance.present + summary.attendance.sickLeave + summary.attendance.absent;
  const presentPct = totalAttendance > 0 ? Math.round((summary.attendance.present / totalAttendance) * 100) : 0;
  const sickPct = totalAttendance > 0 ? Math.round((summary.attendance.sickLeave / totalAttendance) * 100) : 0;
  const absentPct = totalAttendance > 0 ? Math.round((summary.attendance.absent / totalAttendance) * 100) : 0;

  // Cek apakah user adalah Guru, Staf, Kepala Sekolah (yang bisa absen)
  const isEmployee = user?.roles?.some(r => ['Guru / Wali Kelas', 'Staf', 'Kepala Sekolah'].includes(r.name));

  return (
    <div className="dashboard-container">
      
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <span style={{ cursor: 'pointer' }}>Beranda</span>
        <span>›</span>
        <span style={{ fontWeight: 600, color: '#111827' }}>Dashboard</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>Dashboard Utama</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Selamat datang kembali, {user?.name || 'Admin'}. Berikut ringkasan operasional sekolah hari ini.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="action-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>
            <Calendar size={16} /> {currentDate}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        
        {/* Siswa */}
        <div className="stat-card" style={{ '--gradient-start': '#3b82f6', '--gradient-end': '#60a5fa' } as React.CSSProperties}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              <Users size={24} />
            </div>
            <span style={{ background: '#def7ec', color: '#03543f', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '999px' }}>Aktif</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL SISWA</p>
            <h2 className="stat-value">{summary.totalStudents.toLocaleString()}</h2>
          </div>
        </div>

        {/* Guru */}
        <div className="stat-card" style={{ '--gradient-start': '#8b5cf6', '--gradient-end': '#a78bfa' } as React.CSSProperties}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-icon-wrapper" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Users size={24} />
            </div>
            <span style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '999px' }}>Aktif</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL GURU & STAF</p>
            <h2 className="stat-value">{summary.totalEmployees.toLocaleString()}</h2>
          </div>
        </div>

        {/* Kelas */}
        <div className="stat-card" style={{ '--gradient-start': '#f59e0b', '--gradient-end': '#fbbf24' } as React.CSSProperties}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
              <GraduationCap size={24} />
            </div>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '999px' }}>ROMBEL</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KELAS AKTIF</p>
            <h2 className="stat-value">{summary.activeClassrooms.toLocaleString()}</h2>
          </div>
        </div>

        {/* Tahun Ajaran */}
        <div className="stat-card" style={{ '--gradient-start': '#ec4899', '--gradient-end': '#f472b6' } as React.CSSProperties}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-icon-wrapper" style={{ background: '#fdf2f8', color: '#db2777' }}>
              <Calendar size={24} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TAHUN AJARAN</p>
            <h2 className="stat-value" style={{ fontSize: '1.75rem' }}>{summary.academicYear.name}</h2>
            <span style={{ fontSize: '0.75rem', color: '#db2777', background: '#fdf2f8', padding: '0.25rem 0.5rem', borderRadius: '6px', marginTop: '0.5rem', display: 'inline-block', fontWeight: 500 }}>{summary.academicYear.semester}</span>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Ringkasan Absensi */}
        <div className="dashboard-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>Ringkasan Absensi Hari Ini</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Update terakhir: {currentTime}</p>
            </div>
            <a href="#" style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 500, textDecoration: 'none' }}>Detail Laporan</a>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            {/* Donut Chart Mock */}
            <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '50%', border: '24px solid #f3f4f6', borderTopColor: presentPct > 0 ? '#1d4ed8' : '#f3f4f6', borderRightColor: presentPct > 25 ? '#1d4ed8' : '#f3f4f6', borderBottomColor: presentPct > 50 ? '#1d4ed8' : '#f3f4f6', borderLeftColor: presentPct > 75 ? '#1d4ed8' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{presentPct}%</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Kehadiran</div>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1d4ed8' }}></span> <span style={{ fontSize: '0.875rem', color: '#374151' }}>Hadir</span></div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{summary.attendance.present.toLocaleString()} Siswa ({presentPct}%)</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fef08a' }}></span> <span style={{ fontSize: '0.875rem', color: '#374151' }}>Izin/Sakit</span></div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{summary.attendance.sickLeave.toLocaleString()} Siswa ({sickPct}%)</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> <span style={{ fontSize: '0.875rem', color: '#374151' }}>Alpa</span></div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{summary.attendance.absent.toLocaleString()} Siswa ({absentPct}%)</div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>BELUM ABSENSI</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>{summary.classesWithoutAttendance.toLocaleString()} Kelas</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>GURU ABSEN</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8' }}>{summary.absentEmployees.toLocaleString()} Orang</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Absensi Geo & Aktivitas Terbaru */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {isEmployee && (
            <GeolocationCheckin />
          )}

          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>Aktivitas Terbaru</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Log sistem dan log administratif</p>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '2rem', top: '2rem', bottom: '2rem', width: '2px', background: '#e5e7eb' }}></div>
            
            {summary.recentActivities && summary.recentActivities.length > 0 ? (
              summary.recentActivities.map((act, idx) => (
                <div key={act.id} className="activity-item" style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: idx === 0 ? '#93c5fd' : idx === 1 ? '#1d4ed8' : '#fef08a', border: '4px solid #ffffff', zIndex: 1, marginTop: '2px' }}></div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.4 }}>
                      {act.message} <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'inline-block', marginLeft: '0.25rem', background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{act.status}</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      <Clock size={12} /> {new Date(act.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic', marginLeft: '1rem' }}>
                Belum ada aktivitas terbaru hari ini.
              </div>
            )}
          </div>
          <div style={{ background: '#f9fafb', padding: '1rem', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
            <a href="#" style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 500, textDecoration: 'none' }}>Lihat Semua Aktivitas</a>
          </div>
        </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        <div className="announcement-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Megaphone size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Papan Pengumuman</h3>
            </div>
            <button 
              className="action-button"
              onClick={() => navigate('/announcements')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              Lihat Semua Pengumuman
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', zIndex: 1 }}>
            {announcements.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#bfdbfe', margin: 0, gridColumn: '1 / -1' }}>Belum ada pengumuman terbaru.</p>
            ) : (
              announcements.slice(0, 3).map((item) => (
                <div key={item.id} className="announcement-item" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'white', flex: 1, lineHeight: 1.4 }}>{item.title}</h4>
                    {item.isPinned && <Pin size={14} color="#fef08a" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: item.content }} style={{ fontSize: '0.75rem', color: '#e0e7ff', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};




