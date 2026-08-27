import React, { useEffect, useState } from 'react';
import { Users, FileText, AlertOctagon, Award, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Academic/Academic.css';

export const HomeroomDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Placeholder data that will later be fetched from the backend API
  const [loading, setLoading] = useState(false);
  const [classroom, setClassroom] = useState<any>(null);

  useEffect(() => {
    // In a real scenario, fetch the classroom info assigned to this employeeId
    // API call: /homeroom/my-classroom
    setLoading(true);
    setTimeout(() => {
      setClassroom({
        id: '1',
        name: 'X MIPA 1',
        totalStudents: 32,
        academicYear: '2023/2024',
        semester: 'Ganjil',
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Wali Kelas</h1>
          <p className="page-subtitle">Selamat datang, {user?.name || 'Bapak/Ibu Guru'}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : classroom ? (
        <>
          <div className="glass-panel mb-6 p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Kelas Binaan: {classroom.name}</h2>
            <p className="text-gray-600">
              Tahun Ajaran: {classroom.academicYear} | Semester: {classroom.semester}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-panel p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Siswa</p>
                <h3 className="text-2xl font-bold text-gray-800">{classroom.totalStudents}</h3>
              </div>
            </div>

            <div className="glass-panel p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">E-Rapor Selesai</p>
                <h3 className="text-2xl font-bold text-gray-800">12 / {classroom.totalStudents}</h3>
              </div>
            </div>

            <div className="glass-panel p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                <Award size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Prestasi Siswa</p>
                <h3 className="text-2xl font-bold text-gray-800">5</h3>
              </div>
            </div>

            <div className="glass-panel p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                <AlertOctagon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pelanggaran</p>
                <h3 className="text-2xl font-bold text-gray-800">2</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                Aksi Cepat
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-primary transition-colors flex justify-between items-center">
                  <span className="font-medium text-gray-700">Lihat Daftar Siswa</span>
                  <Users size={16} className="text-gray-400" />
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-primary transition-colors flex justify-between items-center">
                  <span className="font-medium text-gray-700">Catat Pelanggaran Siswa</span>
                  <AlertOctagon size={16} className="text-gray-400" />
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-primary transition-colors flex justify-between items-center">
                  <span className="font-medium text-gray-700">Kelola Catatan Wali Kelas (Rapor)</span>
                  <FileText size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Aktivitas Terakhir</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Input Catatan Rapor untuk Budi</p>
                    <p className="text-xs text-gray-500">2 jam yang lalu</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Mencatat pelanggaran terlambat (Siti)</p>
                    <p className="text-xs text-gray-500">Kemarin, 07:30</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel p-8 text-center">
          <div className="text-gray-400 mb-4 flex justify-center">
            <Users size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Kelas Binaan</h3>
          <p className="text-gray-500">
            Anda belum ditugaskan sebagai wali kelas pada tahun ajaran & semester aktif ini.
            Silakan hubungi administrator jika ini adalah sebuah kesalahan.
          </p>
        </div>
      )}
    </div>
  );
};
