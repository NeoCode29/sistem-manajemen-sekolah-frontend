import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Clock, Calendar, Printer, HelpCircle, Megaphone, Pin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await getMyAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    }
  };

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
            <Calendar size={16} /> Senin, 14 Okt 2024
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
            <span style={{ background: '#def7ec', color: '#03543f', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '999px' }}>~ +12</span>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL SISWA</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>1,248</h2>
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
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>86</h2>
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
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>42</h2>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>2024/2025</h2>
            <span style={{ fontSize: '0.75rem', color: '#1d4ed8', background: '#eff6ff', padding: '0.125rem 0.375rem', borderRadius: '4px', marginTop: '0.25rem', display: 'inline-block' }}>Semester Ganjil</span>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Ringkasan Absensi */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>Ringkasan Absensi Hari Ini</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Update terakhir: 14 Okt 2024, 09:30 WIB</p>
            </div>
            <a href="#" style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 500, textDecoration: 'none' }}>Detail Laporan</a>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            {/* Donut Chart Mock */}
            <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '50%', border: '24px solid #f3f4f6', borderTopColor: '#1d4ed8', borderRightColor: '#1d4ed8', borderBottomColor: '#fef08a', borderLeftColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>92%</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Kehadiran</div>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1d4ed8' }}></span> <span style={{ fontSize: '0.875rem', color: '#374151' }}>Hadir</span></div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>1,148 Siswa (75%)</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fef08a' }}></span> <span style={{ fontSize: '0.875rem', color: '#374151' }}>Izin/Sakit</span></div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>68 Siswa (10%)</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> <span style={{ fontSize: '0.875rem', color: '#374151' }}>Alpa</span></div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>32 Siswa (7%)</div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>BELUM ABSENSI</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>12 Kelas</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '8px', flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>GURU ABSEN</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8' }}>3 Orang</div>
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
            
            <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#93c5fd', border: '4px solid #ffffff', zIndex: 1, marginTop: '2px' }}></div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>Siti Rahmawati</span> (Staf Kesiswaan) mengajukan pindah kelas untuk 3 siswa.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  <Clock size={12} /> 15 menit yang lalu
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#1d4ed8', border: '4px solid #ffffff', zIndex: 1, marginTop: '2px' }}></div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.4 }}>
                  Input nilai <span style={{ fontWeight: 600, color: '#111827' }}>Matematika Kelas X-A</span> selesai dilakukan oleh Bpk. Budi Santoso.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  <Clock size={12} /> 1 jam yang lalu
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fef08a', border: '4px solid #ffffff', zIndex: 1, marginTop: '2px' }}></div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>Jadwal Semester Genap</span> telah dipublikasikan dan disinkronkan.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  <Clock size={12} /> 3 jam yang lalu
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#f9fafb', padding: '1rem', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
            <a href="#" style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 500, textDecoration: 'none' }}>Lihat Semua Aktivitas</a>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        
        <div style={{ background: '#1d4ed8', borderRadius: '12px', padding: '1.5rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone size={20} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Papan Pengumuman</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto', maxHeight: '150px', paddingRight: '0.5rem' }}>
            {announcements.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#bfdbfe', margin: 0 }}>Belum ada pengumuman terbaru.</p>
            ) : (
              announcements.slice(0, 3).map((item) => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'white' }}>{item.title}</h4>
                    {item.isPinned && <Pin size={12} color="#fef08a" />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#e0e7ff', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, width: '100%', cursor: 'pointer' }}>
              Lihat Semua Pengumuman
            </button>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Printer size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>Cetak Raport Sementara</h4>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>Tersedia untuk kelas X dan XI periode sisipan.</p>
            <a href="#" style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Proses Sekarang →</a>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f9fafb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>Pusat Bantuan EduSys</h4>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>Butuh bantuan navigasi atau kendala teknis sistem?</p>
            <a href="#" style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Buka Tiket →</a>
          </div>
        </div>

      </div>
    </div>
  );
};




