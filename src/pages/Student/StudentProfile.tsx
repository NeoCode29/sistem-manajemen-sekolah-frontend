import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyStudent, type StudentProfileData } from '../../api/studentPortalService';
import { User, Phone, MapPin, Calendar, CreditCard, Users, GraduationCap, Sparkles } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyStudent();
        setStudent(data);
      } catch (error) {
        console.error("Failed to fetch student profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 font-medium text-sm">Memuat profil...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 max-w-lg mx-auto">
        Data profil tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto page-enter pb-8">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          {isGuardian ? 'Biodata Siswa & Wali' : 'Profil Siswa'}
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm font-medium mt-1">
          Informasi identitas pokok, data keluarga, dan riwayat akademik di sekolah.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Cover Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        </div>

        {/* Avatar & Basic Info */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl sm:text-4xl font-black text-indigo-600 flex-shrink-0">
              {student.fullName.charAt(0)}
            </div>

            <div className="sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Status Siswa Aktif
              </span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight mb-2">
            {student.fullName}
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-gray-800">
              NIS: {student.nis}
            </span>
            {student.nisn && (
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-semibold text-gray-800">
                NISN: {student.nisn}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-gray-100">
            <div className="p-5 sm:p-6 sm:border-r sm:border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <User size={16} className="text-indigo-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Jenis Kelamin</span>
              </div>
              <div className="text-gray-900 font-semibold text-sm sm:text-base">
                {student.gender === 'Laki-laki' || student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </div>
            </div>

            <div className="p-5 sm:p-6 sm:border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <Calendar size={16} className="text-indigo-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tempat, Tanggal Lahir</span>
              </div>
              <div className="text-gray-900 font-semibold text-sm sm:text-base">
                {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </div>
            </div>

            <div className="p-5 sm:p-6 sm:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <MapPin size={16} className="text-indigo-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Alamat Domisili</span>
              </div>
              <div className="text-gray-900 font-medium text-sm sm:text-base leading-relaxed">
                {student.address || '-'}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <CreditCard size={16} className="text-indigo-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Agama</span>
              </div>
              <div className="text-gray-900 font-semibold text-sm sm:text-base">
                {student.religion || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Data Orang Tua / Wali */}
        {student.guardians && student.guardians.length > 0 && (
          <div className="border-t border-gray-100 p-5 sm:p-8">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={18} />
              </div>
              <span>Data Orang Tua / Wali Murid</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {student.guardians.map((guardian, i) => (
                <div key={i} className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm sm:text-base">{guardian.fullName}</span>
                      {guardian.isPrimary && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Utama
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-indigo-600 mb-3">
                      Hubungan: {guardian.relationship}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 pt-2 border-t border-gray-200/60">
                    <Phone size={14} className="text-gray-400" />
                    <span>{guardian.phone || 'Nomor telepon tidak tersedia'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat Kelas */}
        {student.enrollments && student.enrollments.length > 0 && (
          <div className="border-t border-gray-100 p-5 sm:p-8">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <GraduationCap size={18} />
              </div>
              <span>Riwayat Kelas & Akademik</span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs sm:text-sm min-w-[420px]">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3.5 sm:p-4">Tahun Ajaran</th>
                    <th className="p-3.5 sm:p-4">Semester</th>
                    <th className="p-3.5 sm:p-4">Kelas</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {student.enrollments.map((e, i) => {
                    let statusLabel = e.status;
                    let badgeClass = 'bg-gray-100 text-gray-700';

                    switch (e.status) {
                      case 'ENROLLED':
                        statusLabel = 'Aktif';
                        badgeClass = 'bg-emerald-100 text-emerald-700';
                        break;
                      case 'PROMOTED':
                        statusLabel = 'Naik Kelas';
                        badgeClass = 'bg-blue-100 text-blue-700';
                        break;
                      case 'GRADUATED':
                        statusLabel = 'Lulus';
                        badgeClass = 'bg-purple-100 text-purple-700';
                        break;
                      case 'RETAINED':
                        statusLabel = 'Tinggal Kelas';
                        badgeClass = 'bg-red-100 text-red-700';
                        break;
                    }

                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3.5 sm:p-4 font-semibold text-gray-900">{e.academicYear?.name || '-'}</td>
                        <td className="p-3.5 sm:p-4 text-gray-600">{e.semester?.name || '-'}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-indigo-600">{e.classroom?.name || '-'}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
