import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAcademicYears, getSemesters, type AcademicYear, type Semester } from '../../api/academicService';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [activeAy, setActiveAy] = useState<AcademicYear | null>(null);
  const [activeSem, setActiveSem] = useState<Semester | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Daftar menu untuk pencarian
  const searchMenus = [
    { title: 'Dashboard', path: '/dashboard' },
    { title: 'Profil Sekolah', path: '/profile/school' },
    { title: 'Jabatan', path: '/entities/positions' },
    { title: 'Rombel / Kelas', path: '/academic/classrooms' },
    { title: 'Tingkat Kelas', path: '/academic/grades' },
    { title: 'Jurusan', path: '/academic/majors' },
    { title: 'Tahun Ajaran', path: '/academic/years' },
    { title: 'Semester', path: '/academic/semesters' },
    { title: 'Siswa & Wali', path: '/entities/students' },
    { title: 'Pegawai / Guru', path: '/entities/employees' },
    { title: 'Mata Pelajaran', path: '/academic/subjects' },
    { title: 'Jam Pelajaran', path: '/academic/class-periods' },
    { title: 'Jadwal Pelajaran', path: '/academic/schedules' },
    { title: 'Kenaikan Kelas', path: '/academic/promotions' },
    { title: 'Kelulusan', path: '/academic/graduations' },
    { title: 'Pengaturan Absensi', path: '/attendance/settings' },
    { title: 'Absensi Siswa', path: '/attendance/students' },
    { title: 'Absensi Pegawai', path: '/attendance/employees' },
    { title: 'Komponen Penilaian', path: '/assessment/components' },
    { title: 'Agenda Penilaian', path: '/assessment/exams' },
    { title: 'Cetak Rapor', path: '/assessment/report-cards' },
    { title: 'Prestasi Siswa', path: '/student-affairs/achievements' },
    { title: 'Pelanggaran (Kasus)', path: '/student-affairs/violations' },
    { title: 'Pengumuman', path: '/announcements' },
    { title: 'Pengguna', path: '/admin/users' },
    { title: 'Peran (Roles)', path: '/admin/roles' },
    { title: 'Pengaturan', path: '/settings' }
  ];

  const filteredMenus = searchMenus.filter(menu => 
    menu.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If user is Student or Guardian, they shouldn't be in this Layout
  const isStudentOrGuardian = user?.roles?.some(r => r.name === 'Siswa' || r.name === 'Orang Tua / Wali');
  if (isStudentOrGuardian) {
    return <Navigate to="/student/dashboard" replace />;
  }

  React.useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [ayData, semData] = await Promise.all([getAcademicYears(), getSemesters()]);
        const currentAy = ayData.find(a => a.isActive);
        const currentSem = semData.find(s => s.isActive);
        if (currentAy) setActiveAy(currentAy);
        if (currentSem) setActiveSem(currentSem);
      } catch (err) {
        console.error("Failed to fetch active academic year/semester");
      }
    };
    fetchMaster();
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '72px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div ref={searchRef} style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder="Cari menu halaman (Contoh: Absensi)..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#111827',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: isSearchOpen ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'
              }}
            />
            {isSearchOpen && searchQuery && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 50
              }}>
                {filteredMenus.length > 0 ? (
                  <ul style={{ listStyle: 'none', margin: 0, padding: '0.5rem 0' }}>
                    {filteredMenus.map((menu, index) => (
                      <li key={index}>
                        <button
                          onClick={() => {
                            navigate(menu.path);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            color: '#374151',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {menu.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                    Menu tidak ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {activeAy && activeSem && (
              <div style={{ 
                backgroundColor: '#eff6ff', 
                color: '#1d4ed8', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                border: '1px solid #bfdbfe'
              }}>
                TA {activeAy.name} - {activeSem.name}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid #e5e7eb' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{user?.name || 'Admin Utama'}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.roles && user.roles.length > 0 ? user.roles.map(r => r.name).join(', ') : 'SUPER ADMINISTRATOR'}</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
