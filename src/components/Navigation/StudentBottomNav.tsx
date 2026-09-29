import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, BookOpen, AlertTriangle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentBottomNav: React.FC = () => {
  const { user } = useAuth();
  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  const navItems = [
    {
      to: '/student/dashboard',
      label: 'Beranda',
      icon: Home,
    },
    {
      to: '/student/schedule',
      label: 'Jadwal',
      icon: Calendar,
    },
    {
      to: '/student/grades',
      label: 'Nilai',
      icon: BookOpen,
    },
    {
      to: '/student/discipline',
      label: 'Disiplin',
      icon: AlertTriangle,
    },
    {
      to: '/student/profile',
      label: isGuardian ? 'Anak' : 'Profil',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Portal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg block lg:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 select-none ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-xl transition-transform duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 scale-105 shadow-2xs'
                        : 'text-slate-400'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight leading-tight truncate max-w-full">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
