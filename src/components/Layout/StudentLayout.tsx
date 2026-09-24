import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StudentSidebar } from '../Sidebar/StudentSidebar';

import { useAuth } from '../../context/AuthContext';
import { getAcademicYears, getSemesters, type AcademicYear, type Semester } from '../../api/academicService';

export const StudentLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeAy, setActiveAy] = useState<AcademicYear | null>(null);
  const [activeSem, setActiveSem] = useState<Semester | null>(null);
  const location = useLocation();

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
      <StudentSidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen min-w-0 max-w-[calc(100vw-260px)] overflow-x-hidden">
        <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-6 lg:px-8 sticky top-0 z-30 shadow-sm min-w-0 max-w-full">
          <div className="flex items-center gap-6">
            {activeAy && activeSem && (
              <div className="hidden sm:flex items-center bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-indigo-100 shadow-sm">
                TA {activeAy.name} - {activeSem.name}
              </div>
            )}

            
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-gray-900 text-sm leading-tight">{user?.name || 'Siswa'}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{user?.roles?.[0]?.name || 'SISWA'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-600/20 border-2 border-white">
                {user?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
