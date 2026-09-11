import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Lock, User, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../utils/errorHandler';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', { username, password });

      const { accessToken, refreshToken, user } = response.data;
      login({ accessToken, refreshToken, user });
      
      const isStudentOrGuardian = user.roles.some((r: any) => r.name === 'Siswa' || r.name === 'Orang Tua / Wali');
      if (isStudentOrGuardian) {
        navigate('/student/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Gagal masuk. Periksa kembali username dan password Anda.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Kiri: Panel Visual / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
        {/* Latar Belakang Gradien & Shape Ornamen */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 z-0"></div>
        
        {/* Dekorasi Bentuk Abstrak */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-overlay"></div>
        <div className="absolute top-[40%] right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-xl px-12 text-white page-enter">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl inline-block mb-8">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 17H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Sistem Informasi <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Manajemen Sekolah</span>
          </h1>
          <p className="text-lg text-indigo-100/90 leading-relaxed max-w-md">
            Platform terpadu untuk mengelola seluruh aspek administrasi, akademik, dan kesiswaan dengan mudah dan efisien.
          </p>
          
          {/* Ilustrasi "Glass Card" Dummy untuk UI */}
          <div className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <div className="h-4 w-32 bg-white/20 rounded mb-2"></div>
                <div className="h-3 w-20 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="h-3 w-full bg-white/10 rounded mb-2"></div>
            <div className="h-3 w-4/5 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50 relative">
        <div className="w-full max-w-md page-enter">
          
          <div className="text-center lg:text-left mb-10">
            {/* Logo Mobile Only */}
            <div className="lg:hidden bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mx-auto mb-6 shadow-lg">
              SMS
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Selamat Datang! 👋</h2>
            <p className="text-gray-500 font-medium">Silakan login untuk mengakses akun Anda.</p>
          </div>

          {error && (
            <div className="alert flex items-center gap-3 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-8 font-medium animate-in fade-in zoom-in duration-300">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="group relative">
              <label className="text-sm font-semibold text-gray-700 block mb-2 transition-colors group-focus-within:text-indigo-600">Username</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl outline-none transition-all pl-12 pr-4 py-3.5 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 shadow-sm"
                  placeholder="Masukkan username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-indigo-600">Password</label>
                <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">Lupa password?</a>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                  type="password"
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl outline-none transition-all pl-12 pr-4 py-3.5 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-xl py-3.5 px-4 shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  Masuk ke Sistem
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 font-medium mt-10">
            &copy; {new Date().getFullYear()} SekolahApp. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
};
