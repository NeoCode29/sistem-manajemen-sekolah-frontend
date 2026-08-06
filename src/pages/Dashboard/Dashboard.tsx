import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Clock, Calendar, Megaphone, Pin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { getDashboardSummary } from '../../api/dashboardService';
import type { DashboardSummary } from '../../api/dashboardService';

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
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
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>
            <Calendar size={16} /> {currentDate}
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#1d4ed8', border: 'none', borderRadius: '0.5rem', color: '#ffffff', fontWeight: 500, fontSize: '0.875rem' }}>
            + Input Cepat
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        
        {/* Siswa */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <span style={{ background: '#def7ec', color: '#03543f', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '999px' }}>Aktif</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL SISWA</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>{summary.totalStudents.toLocaleString()}</h2>
          </div>
        </div>

        {/* Guru */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <span style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '999px' }}>Aktif</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL GURU & STAF</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>{summary.totalEmployees.toLocaleString()}</h2>
          </div>
        </div>

        {/* Kelas */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} />
            </div>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '999px' }}>ROMBEL</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KELAS AKTIF</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>{summary.activeClassrooms.toLocaleString()}</h2>
          </div>
        </div>

        {/* Tahun Ajaran */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TAHUN AJARAN</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>{summary.academicYear.name}</h2>
            <span style={{ fontSize: '0.75rem', color: '#1d4ed8', background: '#eff6ff', padding: '0.125rem 0.375rem', borderRadius: '4px', marginTop: '0.25rem', display: 'inline-block' }}>{summary.academicYear.semester}</span>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Ringkasan Absensi */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
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

        {/* Aktivitas Terbaru */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>Aktivitas Terbaru</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Log sistem dan log administratif</p>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '2rem', top: '2rem', bottom: '2rem', width: '2px', background: '#e5e7eb' }}></div>
            
            {summary.recentActivities && summary.recentActivities.length > 0 ? (
              summary.recentActivities.map((act, idx) => (
                <div key={act.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        <div style={{ background: '#1d4ed8', borderRadius: '12px', padding: '1.5rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Megaphone size={20} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Papan Pengumuman</h3>
            </div>
            <button 
              onClick={() => navigate('/announcements')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Lihat Semua Pengumuman
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {announcements.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#bfdbfe', margin: 0, gridColumn: '1 / -1' }}>Belum ada pengumuman terbaru.</p>
            ) : (
              announcements.slice(0, 3).map((item) => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
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




