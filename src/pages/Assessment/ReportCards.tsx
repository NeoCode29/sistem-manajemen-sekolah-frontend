import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReportCards, type ReportCard } from '../../hooks/useReportCards';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import { useSemesters } from '../../hooks/useSemesters';
import { useClassrooms } from '../../hooks/useClassrooms';
import { FileText, Edit2, Printer, Loader2, AlertCircle, Settings, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Academic/Academic.css';

export const ReportCards: React.FC = () => {
  const { years: academicYears, refresh: fetchAcademicYears } = useAcademicYears();
  const { semesters, refresh: fetchSemesters } = useSemesters();
  const { classrooms, refresh: fetchClassrooms } = useClassrooms();
  const { reportCards, loading, error, fetchReportCards, generateReportCards, updateHomeroomNotes, validateReportCard, exportPdf, approveClassroom, getApprovals } = useReportCards();
  const { user } = useAuth();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  
  const [isClassroomApproved, setIsClassroomApproved] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ReportCard | null>(null);
  const [formData, setFormData] = useState({ sickDays: 0, excusedDays: 0, unexcusedDays: 0, homeroomNotes: '' });

  const isPrincipal = user?.roles?.some(r => r.name === 'Kepala Sekolah');

  useEffect(() => {
    fetchAcademicYears();
    fetchSemesters();
    fetchClassrooms();
  }, [fetchAcademicYears, fetchSemesters, fetchClassrooms]);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const active = academicYears.find(y => y.isActive) || academicYears[0];
      setSelectedYear(active.id);
    }
  }, [academicYears, selectedYear]);

  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      const active = semesters.find(s => s.isActive) || semesters[0];
      setSelectedSemester(active.id);
    }
  }, [semesters, selectedSemester]);
  
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
       setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  useEffect(() => {
    if (selectedYear && selectedSemester && selectedClassroom) {
      fetchReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
      getApprovals({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom })
        .then(res => setIsClassroomApproved(res.length > 0 && res[0].status === 'APPROVED'))
        .catch(err => console.error(err));
    }
  }, [selectedYear, selectedSemester, selectedClassroom, fetchReportCards, getApprovals]);

  const handleGenerate = async () => {
    if (!selectedYear || !selectedSemester || !selectedClassroom) return;
    if (window.confirm('Generate rapor untuk seluruh siswa di kelas ini? Nilai yang belum divalidasi mungkin tidak akan masuk.')) {
      try {
        await generateReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
        alert('Rapor berhasil di-generate!');
      } catch (e: any) {
        alert(e.message || 'Gagal generate rapor');
      }
    }
  };

  const openEditModal = (card: ReportCard) => {
    setEditingCard(card);
    setFormData({
      sickDays: card.sickDays,
      excusedDays: card.excusedDays,
      unexcusedDays: card.unexcusedDays,
      homeroomNotes: card.homeroomNotes || ''
    });
    setIsModalOpen(true);
  };

  const saveNotes = async () => {
    if (editingCard) {
      try {
        await updateHomeroomNotes(editingCard.id, formData);
        setIsModalOpen(false);
      } catch (e) {
        alert('Gagal menyimpan catatan');
      }
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Cetak Rapor & Pengesahan</h1>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>Kelola dan sahkan dokumen rapor hasil belajar siswa per kelas.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleGenerate}
            disabled={loading || !selectedClassroom}
            style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem', opacity: (loading || !selectedClassroom) ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            Generate Rapor Kelas
          </button>
          
          {isPrincipal && (
            <button 
              className="btn-primary" 
              onClick={async () => {
                if (window.confirm('Sahkah rapor untuk kelas ini? Tanda tangan Anda akan dibubuhkan secara otomatis pada seluruh dokumen rapor di kelas ini.')) {
                  try {
                    await approveClassroom({
                      classroomId: selectedClassroom,
                      academicYearId: selectedYear,
                      semesterId: selectedSemester,
                      action: 'APPROVE',
                      notes: ''
                    });
                    setIsClassroomApproved(true);
                    alert('Berhasil Disahkan!');
                  } catch (e: any) {
                    alert(e.response?.data?.message || e.message || 'Gagal mengesahkan rapor');
                  }
                }
              }}
              disabled={loading || !selectedClassroom || isClassroomApproved}
              style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem', opacity: (loading || !selectedClassroom || isClassroomApproved) ? 0.7 : 1, background: isClassroomApproved ? '#059669' : undefined }}
            >
              <CheckCircle size={20} style={{ marginRight: '8px', display: 'inline' }} />
              {isClassroomApproved ? 'Telah Disahkan' : 'Sahkah Rapor Kelas'}
            </button>
          )}
        </div>
      </div>



      {error && (
        <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} style={{ color: '#4f46e5' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Filter Pencarian Rapor</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Tahun Ajaran</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Semester</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Kelas</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }} value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}>
                <option value="">Pilih Kelas</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Rapor Siswa</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Data absensi dan dokumen rapor siswa di kelas terpilih</p>
          </div>
        </div>

        {loading && reportCards.length === 0 ? (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>Memuat data rapor...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>No</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identitas Siswa</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kehadiran (S / I / A)</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reportCards.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.1)' }}>
                          <FileText size={36} style={{ color: '#4f46e5' }} />
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>Belum Ada Rapor</div>
                        <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
                          Belum ada rapor di kelas ini. Silakan tekan tombol "Generate Rapor Kelas".
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reportCards.map((card, index) => (
                    <tr key={card.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1.25rem 2rem', color: '#64748b', fontWeight: 500, verticalAlign: 'middle' }}>{index + 1}</td>
                      
                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={18} style={{ color: '#4f46e5' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{card.student.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NIS: {card.student.nis}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#64748b' }}></div>
                          {card.sickDays} Sakit / {card.excusedDays} Izin / {card.unexcusedDays} Alpa
                        </span>
                      </td>

                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {card.validatedAt ? (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
                              Wali: Valid
                            </span>
                          ) : (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fbbf24', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
                              Wali: Menunggu
                            </span>
                          )}
                          
                          {isClassroomApproved ? (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #3b82f6', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
                              Kepsek: Sah
                            </span>
                          ) : (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
                              Kepsek: Menunggu
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1.25rem 2rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                          {!card.validatedAt && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Validasi rapor ini? Tindakan ini akan membubuhkan tanda tangan digital Anda.')) {
                                  try {
                                    await validateReportCard(card.id);
                                  } catch (e: any) {
                                    alert(e.message || 'Gagal memvalidasi rapor');
                                  }
                                }
                              }}
                              style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.color = '#059669'; }} 
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                              title="Validasi & Tanda Tangani"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(card)}
                            style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }} 
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                            title="Isi Catatan & Absensi"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => exportPdf(card.id, card.student.fullName)}
                            style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.color = '#059669'; }} 
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                            title="Cetak PDF"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4" style={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <h2>Edit Kehadiran & Catatan</h2>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="modal-body-v4 form-grid" style={{ padding: '2rem 1.5rem' }}>
              <div className="mb-4 text-sm text-gray-600 flex items-center gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <User size={18} className="text-indigo-600" />
                <span>Siswa: <strong className="text-indigo-900">{editingCard?.student?.fullName}</strong></span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-xs font-semibold text-gray-700">Sakit (Hari)</label>
                  <input 
                    type="number" 
                    value={formData.sickDays} 
                    onChange={e => setFormData({...formData, sickDays: parseInt(e.target.value)||0})} 
                    className="input-field" 
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="text-xs font-semibold text-gray-700">Izin (Hari)</label>
                  <input 
                    type="number" 
                    value={formData.excusedDays} 
                    onChange={e => setFormData({...formData, excusedDays: parseInt(e.target.value)||0})} 
                    className="input-field" 
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="text-xs font-semibold text-gray-700">Alpa (Hari)</label>
                  <input 
                    type="number" 
                    value={formData.unexcusedDays} 
                    onChange={e => setFormData({...formData, unexcusedDays: parseInt(e.target.value)||0})} 
                    className="input-field" 
                    min={0}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="text-sm font-semibold text-gray-700">Catatan Wali Kelas</label>
                <textarea 
                  value={formData.homeroomNotes} 
                  onChange={e => setFormData({...formData, homeroomNotes: e.target.value})}
                  className="input-field"
                  placeholder="Tuliskan pesan / motivasi untuk siswa..."
                  rows={4}
                  style={{ resize: 'none' }}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer-v4">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Batal</button>
              <button onClick={saveNotes} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Simpan Data</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
