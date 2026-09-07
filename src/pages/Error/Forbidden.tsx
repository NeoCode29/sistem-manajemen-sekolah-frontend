import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-6xl font-bold text-red-500">403</h1>
      <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-gray-100">
        Akses Ditolak
      </h2>
      <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
        Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi
        administrator jika Anda merasa ini adalah sebuah kesalahan.
      </p>
      <button
        onClick={() => navigate('/dashboard', { replace: true })}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
};
