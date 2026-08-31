import React, { useEffect, useState } from 'react';
import { AlertTriangle, Award, ShieldAlert, Calendar } from 'lucide-react';
import { getMyDiscipline, type DisciplineData } from '../../api/studentPortalService';

export const StudentDiscipline: React.FC = () => {
  const [data, setData] = useState<DisciplineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'violations'>('achievements');

  useEffect(() => {
    const fetchDiscipline = async () => {
      try {
        const response = await getMyDiscipline();
        setData(response);
      } catch (error) {
        console.error('Failed to fetch discipline data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscipline();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data kedisiplinan...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={24} color="#ef4444" /> Kedisiplinan & Prestasi
      </h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('achievements')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '0.5rem', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'achievements' ? '#3b82f6' : '#ffffff',
            color: activeTab === 'achievements' ? '#ffffff' : '#6b7280',
            boxShadow: activeTab === 'achievements' ? '0 4px 6px -1px rgba(59,130,246,0.5)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
            borderTop: activeTab !== 'achievements' ? '1px solid #e5e7eb' : 'none',
            borderLeft: activeTab !== 'achievements' ? '1px solid #e5e7eb' : 'none',
            borderRight: activeTab !== 'achievements' ? '1px solid #e5e7eb' : 'none',
            borderBottom: activeTab !== 'achievements' ? '1px solid #e5e7eb' : 'none',
          }}
        >
          <Award size={18} /> Prestasi
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '0.5rem', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'violations' ? '#ef4444' : '#ffffff',
            color: activeTab === 'violations' ? '#ffffff' : '#6b7280',
            boxShadow: activeTab === 'violations' ? '0 4px 6px -1px rgba(239,68,68,0.5)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
            borderTop: activeTab !== 'violations' ? '1px solid #e5e7eb' : 'none',
            borderLeft: activeTab !== 'violations' ? '1px solid #e5e7eb' : 'none',
            borderRight: activeTab !== 'violations' ? '1px solid #e5e7eb' : 'none',
            borderBottom: activeTab !== 'violations' ? '1px solid #e5e7eb' : 'none',
          }}
        >
          <AlertTriangle size={18} /> Pelanggaran
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {activeTab === 'achievements' && (
          <div>
            {data?.achievements && data.achievements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.achievements.map((item, i) => (
                  <div key={item.id} style={{ padding: '1.5rem', borderBottom: i < data.achievements.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>{item.title}</h3>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>{item.category}</span> | {item.level} {item.rank ? `| Peringkat ${item.rank}` : ''}
                        </div>
                        {item.description && (
                          <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: 0 }}>{item.description}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          <Calendar size={14} /> {new Date(item.eventDate).toLocaleDateString('id-ID')}
                        </div>
                        <div style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          +{item.points} Poin
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                Belum ada data prestasi.
              </div>
            )}
          </div>
        )}

        {activeTab === 'violations' && (
          <div>
            {data?.violations && data.violations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.violations.map((item, i) => (
                  <div key={item.id} style={{ padding: '1.5rem', borderBottom: i < data.violations.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>{item.title || 'Pelanggaran Kedisiplinan'}</h3>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: item.category === 'BERAT' ? '#ef4444' : item.category === 'SEDANG' ? '#f59e0b' : '#fcd34d' }}>{item.category || '-'}</span>
                        </div>
                        {item.actionTaken && (
                          <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}><strong>Tindakan:</strong> {item.actionTaken}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          <Calendar size={14} /> {new Date(item.violationDate).toLocaleDateString('id-ID')}
                        </div>
                        <div style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          +{item.points} Poin Pelanggaran
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                Belum ada catatan pelanggaran.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
