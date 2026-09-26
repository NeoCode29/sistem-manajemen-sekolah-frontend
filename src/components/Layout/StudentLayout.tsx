import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StudentSidebar } from '../Sidebar/StudentSidebar';
import { Menu, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAcademicYears, getSemesters, type AcademicYear, type Semester } from '../../api/academicService';
import { AppLogo } from '../Common/AppLogo';

export const StudentLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeAy, setActiveAy] = useState<AcademicYear | null>(null);
  const [activeSem, setActiveSem] = useState<Semester | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Responsive Sidebar */}
      <StudentSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 sm:h-[72px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
          {/* Left: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              aria-label="Buka navigasi"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <AppLogo size="sm" variant="white" />
              <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                {isGuardian ? 'Portal Wali' : 'Portal Siswa'}
              </span>
            </div>
          </div>

          {/* Right: Academic Year Badge & User Avatar */}
          <div className="flex items-center gap-3 sm:gap-6">
            {activeAy && activeSem && (
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide border border-indigo-100 shadow-xs">
                <Calendar size={13} className="hidden xs:inline text-indigo-600" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  TA {activeAy.name} - {activeSem.name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-gray-900 text-sm leading-tight max-w-[150px] truncate">
                  {user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                  {isGuardian ? 'WALI MURID' : 'SISWA'}
                </div>
              </div>

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm shadow-indigo-600/20 border-2 border-white flex-shrink-0">
                {user?.name?.charAt(0) || (isGuardian ? 'W' : 'S')}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
