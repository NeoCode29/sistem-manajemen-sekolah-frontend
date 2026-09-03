import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyStudent, type StudentProfileData } from '../../api/studentPortalService';
import { User, Phone, MapPin, Calendar, CreditCard, Users, GraduationCap } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

  if (!student) return <div style={{ padding: '2rem' }}>Data profil tidak ditemukan.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto page-enter">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-blue-600"></div>
        
        {/* Avatar & Basic Info */}
        <div className="px-8 pb-8 relative">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-indigo-600 -mt-12 mb-4">
            {student.fullName.charAt(0)}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{student.fullName}</h2>
          <div className="flex flex-wrap gap-2 text-gray-600">
            <span className="font-medium">NIS: {student.nis}</span>
            {student.nisn && <><span className="text-gray-300">|</span><span className="font-medium">NISN: {student.nisn}</span></>}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-b md:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <User size={18} /> <span className="text-sm font-semibold uppercase tracking-wider">Jenis Kelamin</span>
              </div>
              <div className="text-gray-900 font-medium">{student.gender === 'Laki-laki' || student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
            </div>

            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Calendar size={18} /> <span className="text-sm font-semibold uppercase tracking-wider">Tempat, Tanggal Lahir</span>
              </div>
              <div className="text-gray-900 font-medium">
                {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>

            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <MapPin size={18} /> <span className="text-sm font-semibold uppercase tracking-wider">Alamat</span>
              </div>
              <div className="text-gray-900 font-medium">{student.address || '-'}</div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <CreditCard size={18} /> <span className="text-sm font-semibold uppercase tracking-wider">Agama</span>
              </div>
              <div className="text-gray-900 font-medium">{student.religion || '-'}</div>
            </div>
          </div>
        </div>

        {/* Wali Murid Info */}
        {student.guardians && student.guardians.length > 0 && (
          <div className="border-t border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> Data Wali Murid
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.guardians.map((guardian, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="font-bold text-gray-900 mb-1">{guardian.fullName}</div>
                  <div className="text-sm font-medium text-gray-600 mb-3">
                    {guardian.relationship} {guardian.isPrimary && <span className="px-2 py-0.5 ml-2 bg-emerald-100 text-emerald-700 text-xs rounded-full">Utama</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} /> {guardian.phone || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat Kelas */}
        {student.enrollments && student.enrollments.length > 0 && (
          <div className="border-t border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap size={20} className="text-emerald-500" /> Riwayat Kelas
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-4">Tahun Ajaran</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Status</th>
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
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-gray-900">{e.academicYear?.name || '-'}</td>
                        <td className="p-4 text-gray-600">{e.semester?.name || '-'}</td>
                        <td className="p-4 font-semibold text-blue-600">{e.classroom?.name || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
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
