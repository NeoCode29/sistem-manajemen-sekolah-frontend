import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStudentOrGuardian = user?.roles?.some(
    (r) => r.name === 'Siswa' || r.name === 'Orang Tua / Wali'
  );

  const targetDashboard = isStudentOrGuardian ? '/student/dashboard' : '/dashboard';

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="relative mb-6 flex items-center justify-center">
        {/* Glow backdrop effect */}
        <div className="absolute h-32 w-32 rounded-full bg-rose-500/15 blur-2xl" />
        
        {/* Modern Icon Container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-50 to-amber-50 border border-rose-100/80 shadow-sm text-rose-600">
          <ShieldAlert className="h-12 w-12 animate-pulse text-rose-600" />
        </div>
      </div>

      <span className="mb-2 inline-flex items-center rounded-full bg-rose-50 px-3.5 py-1 text-xs font-semibold text-rose-700 border border-rose-100">
        Error 403 • Akses Ditolak
      </span>

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Akses Terbatas / Ditolak
      </h1>

      <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
        Maaf, akun Anda tidak memiliki izin yang cukup untuk mengakses halaman atau fitur ini. Silakan hubungi administrator jika Anda memerlukan wewenang akses tambahan.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali Sebelumnya</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(targetDashboard, { replace: true })}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Home size={16} />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>
    </div>
  );
};

