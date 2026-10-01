import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6 flex items-center justify-center">
        {/* Glow backdrop effect */}
        <div className="absolute h-32 w-32 rounded-full bg-indigo-500/15 blur-2xl" />
        
        {/* Modern Icon Container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-50 to-blue-50 border border-indigo-100/80 shadow-sm text-indigo-600">
          <Compass className="h-12 w-12 animate-pulse text-indigo-600" />
        </div>
      </div>

      <span className="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
        Error 404 • Not Found
      </span>

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Halaman Tidak Ditemukan
      </h1>

      <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
        Tautan yang Anda tuju mungkin salah ketik, telah dihapus, atau belum terdaftar pada sistem aplikasi sekolah.
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
          onClick={() => navigate('/dashboard', { replace: true })}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Home size={16} />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>
    </div>
  );
};
