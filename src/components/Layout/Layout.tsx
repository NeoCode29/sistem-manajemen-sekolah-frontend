import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAcademicYears, getSemesters, type AcademicYear, type Semester } from '../../api/academicService';
import { Toaster } from 'react-hot-toast';
import { searchMenus } from '../../utils/constants';

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
    <div className="flex min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-w-0 max-w-[calc(100vw-260px)] overflow-x-hidden">
        <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30 min-w-0 max-w-full">
          <div ref={searchRef} className="relative w-[400px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari menu halaman (Contoh: Absensi)..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full py-2.5 pr-4 pl-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white"
            />
            {isSearchOpen && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-y-auto z-50">
                {filteredMenus.length > 0 ? (
                  <ul className="list-none m-0 py-2">
                    {filteredMenus.map((menu, index) => (
                      <li key={index}>
                        <button
                          onClick={() => {
                            navigate(menu.path);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors block"
                        >
                          {menu.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Menu tidak ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            {activeAy && activeSem && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
                TA {activeAy.name} - {activeSem.name}
              </div>
            )}

            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <div className="font-semibold text-gray-900 text-sm">{user?.name || 'Admin Utama'}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.roles && user.roles.length > 0 ? user.roles.map(r => r.name).join(', ') : 'SUPER ADMINISTRATOR'}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
