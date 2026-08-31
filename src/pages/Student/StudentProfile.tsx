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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        {/* Header Cover */}
        <div style={{ height: '120px', background: 'linear-gradient(to right, #3b82f6, #1d4ed8)' }}></div>
        
        {/* Avatar & Basic Info */}
        <div style={{ padding: '0 2rem 2rem', position: 'relative' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f3f4f6', border: '4px solid white', marginTop: '-50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6', marginBottom: '1rem' }}>
            {student.fullName.charAt(0)}
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem 0' }}>{student.fullName}</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '1rem' }}>NIS: {student.nis} {student.nisn ? `| NISN: ${student.nisn}` : ''}</p>
        </div>

        {/* Detailed Info Grid */}
        <div style={{ borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
            
            <div style={{ padding: '1.5rem', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#6b7280' }}>
                <User size={18} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Jenis Kelamin</span>
              </div>
              <div style={{ color: '#111827', fontWeight: 500 }}>{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
            </div>

            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#6b7280' }}>
                <Calendar size={18} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tempat, Tanggal Lahir</span>
              </div>
              <div style={{ color: '#111827', fontWeight: 500 }}>
                {student.birthPlace || '-'}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#6b7280' }}>
                <MapPin size={18} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Alamat</span>
              </div>
              <div style={{ color: '#111827', fontWeight: 500 }}>{student.address || '-'}</div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#6b7280' }}>
                <CreditCard size={18} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Agama</span>
              </div>
              <div style={{ color: '#111827', fontWeight: 500 }}>{student.religion || '-'}</div>
            </div>
            
          </div>
        </div>

        {/* Wali Murid Info */}
        {student.guardians && student.guardians.length > 0 && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#3b82f6" /> Data Wali Murid
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {student.guardians.map((guardian, i) => (
                <div key={i} style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{guardian.fullName}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{guardian.relationship} {guardian.isPrimary ? '(Utama)' : ''}</div>
                  <div style={{ color: '#4b5563', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} /> {guardian.phone || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat Kelas */}
        {student.enrollments && student.enrollments.length > 0 && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={20} color="#10b981" /> Riwayat Kelas
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>Tahun Ajaran</th>
                    <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>Semester</th>
                    <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>Kelas</th>
                    <th style={{ padding: '0.75rem', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.enrollments.map((e, i) => {
                    let statusLabel = e.status;
                    let bgColor = '#f3f4f6';
                    let textColor = '#374151';

                    switch (e.status) {
                      case 'ENROLLED':
                        statusLabel = 'Aktif';
                        bgColor = '#d1fae5'; // green-100
                        textColor = '#065f46'; // green-800
                        break;
                      case 'PROMOTED':
                        statusLabel = 'Selesai / Naik Kelas';
                        bgColor = '#dbeafe'; // blue-100
                        textColor = '#1e3a8a'; // blue-900
                        break;
                      case 'GRADUATED':
                        statusLabel = 'Lulus';
                        bgColor = '#fef3c7'; // amber-100
                        textColor = '#92400e'; // amber-800
                        break;
                      case 'RETAINED':
                        statusLabel = 'Tinggal Kelas';
                        bgColor = '#fee2e2'; // red-100
                        textColor = '#991b1b'; // red-800
                        break;
                      case 'DROPOUT':
                      case 'EXPELLED':
                        statusLabel = 'Keluar / Dikeluarkan';
                        bgColor = '#fef2f2'; // red-50
                        textColor = '#b91c1c'; // red-700
                        break;
                    }

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', color: '#111827' }}>{e.academicYear?.name || '-'}</td>
                        <td style={{ padding: '0.75rem', color: '#111827' }}>{e.semester?.name || '-'}</td>
                        <td style={{ padding: '0.75rem', color: '#111827' }}>{e.classroom?.name || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: bgColor, color: textColor }}>
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
