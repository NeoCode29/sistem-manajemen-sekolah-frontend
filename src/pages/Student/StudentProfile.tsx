import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentById, type Student } from '../../api/studentService';
import { User, Phone, MapPin, Calendar, CreditCard } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.studentId) {
          const data = await getStudentById(user.studentId);
          setStudent(data);
        }
      } catch (error) {
        console.error("Failed to fetch student profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

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

      </div>
    </div>
  );
};
