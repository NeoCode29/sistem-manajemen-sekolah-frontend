import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, BookOpen, AlertTriangle, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../Common/AppLogo';

interface StudentSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ isOpen = false, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="md" variant="white" />
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                {isGuardian ? 'Portal Wali' : 'Portal Siswa'}
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                {isGuardian ? 'Monitoring Orang Tua' : 'Akademik & Presensi'}
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 lg:hidden transition-colors"
            aria-label="Tutup navigasi"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card on Mobile */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 lg:hidden">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-gray-900 truncate">{user?.name || 'Pengguna'}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 truncate">
              {isGuardian ? 'Orang Tua / Wali' : 'Siswa Aktif'}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavLink
            to="/student/dashboard"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home size={19} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/student/profile"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <User size={19} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span>{isGuardian ? 'Profil Anak' : 'Profil Saya'}</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/student/grades"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <BookOpen size={19} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span>Nilai & Rapor</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/student/discipline"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <AlertTriangle size={19} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span>Kedisiplinan & Prestasi</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* Bottom Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
