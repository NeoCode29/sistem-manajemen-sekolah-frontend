import React, { useEffect, useState } from 'react';
import { BookOpen, FileText } from 'lucide-react';
import { getMyGrades, type ReportCard } from '../../api/studentPortalService';

export const StudentGrades: React.FC = () => {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await getMyGrades();
        setReportCards(data);
      } catch (error) {
        console.error('Failed to fetch grades', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data nilai...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BookOpen size={24} color="#3b82f6" /> Nilai & Rapor
      </h2>

      {reportCards.length === 0 ? (
        <div style={{ padding: '2rem', backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Belum ada data rapor yang tersedia untuk Anda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reportCards.map((rc) => (
            <div key={rc.id} style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              
              <div 
                style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedId === rc.id ? '#f8fafc' : '#ffffff' }}
                onClick={() => setExpandedId(expandedId === rc.id ? null : rc.id)}
              >
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>Rapor Semester {rc.semester.name}</h3>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Tahun Ajaran {rc.academicYear.name} | Kelas: {rc.classroom.name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontWeight: 500, fontSize: '0.875rem' }}>
                  {expandedId === rc.id ? 'Tutup Detail' : 'Lihat Detail'}
                  <FileText size={18} />
                </div>
              </div>

              {expandedId === rc.id && (
                <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '0.75rem 1rem', color: '#4b5563', fontWeight: 600, fontSize: '0.875rem' }}>Mata Pelajaran</th>
                          <th style={{ padding: '0.75rem 1rem', color: '#4b5563', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center' }}>KKM</th>
                          <th style={{ padding: '0.75rem 1rem', color: '#4b5563', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center' }}>Nilai Akhir</th>
                          <th style={{ padding: '0.75rem 1rem', color: '#4b5563', fontWeight: 600, fontSize: '0.875rem', textAlign: 'center' }}>Predikat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rc.details && rc.details.length > 0 ? rc.details.map((detail) => (
                          <tr key={detail.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '1rem', color: '#111827', fontWeight: 500 }}>{detail.subject.name}</td>
                            <td style={{ padding: '1rem', color: '#6b7280', textAlign: 'center' }}>{detail.kkm}</td>
                            <td style={{ padding: '1rem', color: '#111827', fontWeight: 700, textAlign: 'center' }}>{detail.finalScore}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '0.25rem',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                backgroundColor: detail.predicate === 'A' ? '#dcfce7' : detail.predicate === 'B' ? '#dbeafe' : detail.predicate === 'C' ? '#fef3c7' : '#fee2e2',
                                color: detail.predicate === 'A' ? '#166534' : detail.predicate === 'B' ? '#1e40af' : detail.predicate === 'C' ? '#92400e' : '#991b1b'
                              }}>
                                {detail.predicate}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Data nilai belum diisi.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
