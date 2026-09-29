import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../Sidebar/StudentSidebar';
import { StudentBottomNav } from '../Navigation/StudentBottomNav';
import { Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAcademicYears, getSemesters, type AcademicYear, type Semester } from '../../api/academicService';
import { AppLogo } from '../Common/AppLogo';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeAy, setActiveAy] = useState<AcademicYear | null>(null);
  const [activeSem, setActiveSem] = useState<Semester | null>(null);
  const location = useLocation();

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
      {/* Desktop Responsive Sidebar */}
      <StudentSidebar isOpen={false} onClose={() => {}} />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 sm:h-[72px] bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
          {/* Left: Mobile/Desktop Logo & Portal Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="lg:hidden">
              <AppLogo size="sm" variant="white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight leading-tight">
                {isGuardian ? 'Portal Wali' : 'Portal Siswa'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium sm:hidden truncate max-w-[130px]">
                {user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}
              </span>
            </div>
          </div>

          {/* Right: Academic Year Badge, User Avatar & Quick Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {activeAy && activeSem && (
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide border border-indigo-100 shadow-2xs">
                <Calendar size={12} className="hidden xs:inline text-indigo-600" />
                <span className="truncate max-w-[110px] sm:max-w-none">
                  TA {activeAy.name} - {activeSem.name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-gray-900 text-sm leading-tight max-w-[150px] truncate">
                  {user?.name || (isGuardian ? 'Wali Murid' : 'Siswa')}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                  {isGuardian ? 'WALI MURID' : 'SISWA'}
                </div>
              </div>

              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs sm:text-base shadow-xs shadow-indigo-600/20 border-2 border-white flex-shrink-0"
                title={user?.name || 'User'}
              >
                {user?.name?.charAt(0) || (isGuardian ? 'W' : 'S')}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
                title="Keluar dari Akun"
                aria-label="Keluar"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content with Bottom Safe Spacing */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Thumb-Friendly Bottom Navigation */}
        <StudentBottomNav />
      </div>
    </div>
  );
};

