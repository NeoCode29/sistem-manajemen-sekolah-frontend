import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getViolations, createViolation, updateViolation, deleteViolation, type Violation } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { AlertOctagon, Plus, Edit2, Trash2, Search, User, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const Violations: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { showConfirm, showAlert } = useDialog();
  
  const [search, setSearch] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Violation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ringan');
  const [points, setPoints] = useState<number>(0);
  const [actionTaken, setActionTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [violationDate, setViolationDate] = useState('');

  useEffect(() => {
    fetchViolations();
  }, [search]);

  // Debounced student search for form
  useEffect(() => {
    if (searchStudent.length >= 3) {
      const fetchS = async () => {
        try {
          const data = await getStudents({ search: searchStudent });
          setStudents(data);
        } catch (err) {
          console.error(err);
        }
      };
      const timer = setTimeout(fetchS, 500);
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
    }
  }, [searchStudent]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      
      const data = await getViolations(params);
      setViolations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data pelanggaran');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setStudentId('');
    setSelectedStudent(null);
    setSearchStudent('');
    setTitle('');
    setCategory('Ringan');
    setPoints(0);
    setActionTaken('');
    setNotes('');
    setViolationDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: Violation) => {
    setEditingItem(item);
    setStudentId(item.studentId);
    setSelectedStudent(item.student);
    setSearchStudent('');
    setTitle(item.title || '');
    setCategory(item.category || 'Ringan');
    setPoints(item.points || 0);
    setActionTaken(item.actionTaken || '');
    setNotes(item.notes || '');
    setViolationDate(item.violationDate ? item.violationDate.split('T')[0] : '');
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setStudentId(s.id);
    setSearchStudent('');
    setStudents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError('Siswa harus dipilih');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        studentId,
        title,
        category,
        points: Number(points),
        actionTaken,
        notes,
        violationDate: new Date(violationDate).toISOString(),
      };
      
      if (editingItem) {
        await updateViolation(editingItem.id, payload);
      } else {
        await createViolation(payload);
      }
      
      closeModal();
      fetchViolations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus data pelanggaran ini?', async () => {
      try {
        await deleteViolation(id);
        setSuccess('Data pelanggaran berhasil dihapus!');
        fetchViolations();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus data');
      }
    });
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'sedang': return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
      case 'berat': return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
      default: return { bg: '#fefce8', text: '#a16207', border: '#fef08a' }; // Ringan
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Pelanggaran Siswa</h1>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>Pencatatan indisipliner, pelanggaran tata tertib, dan poin penalti siswa.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => openAddModal()}
            style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem', backgroundColor: '#dc2626' }}
          >
            <Plus size={20} /> Catat Pelanggaran
          </button>
        </div>
      </div>

      {error && !isModalOpen && (
        <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert flex items-center gap-3" style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '1.5rem', fontWeight: 500 }}>
          <CheckCircle2 size={20} className="text-emerald-500" />
          {success}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} style={{ color: '#dc2626' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Pencarian Data Pelanggaran</h2>
        </div>
        <div className="form-group" style={{ gap: '0.35rem', maxWidth: '500px' }}>
          <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Cari Nama Siswa atau Kasus</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '2.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
              placeholder="Ketik kata kunci pencarian..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Kasus Pelanggaran</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Seluruh catatan indisipliner siswa yang terdaftar dalam sistem.</p>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>Memuat data pelanggaran...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siswa</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kasus Pelanggaran</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Kategori</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Tanggal</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Poin Penalti</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((item) => {
                  const catStyle = getCategoryStyles(item.category || item.violationType?.category || '');
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={18} style={{ color: '#dc2626' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{item.student?.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NIS: {item.student?.nis}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.95rem' }}>{item.title || item.violationType?.name || '-'}</div>
                        {item.actionTaken && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Tindakan:</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.actionTaken}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}`, display: 'inline-block' }}>
                          {item.category || item.violationType?.category || '-'}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                          {new Date(item.violationDate || item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', display: 'inline-block' }}>
                          +{item.points}
                        </span>
                      </td>

                      <td style={{ padding: '1.25rem 2rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => openEditModal(item)}
                            style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#4f46e5'; }} 
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            style={{ padding: '0.5rem', color: '#64748b', backgroundColor: 'transparent', borderRadius: '8px', border: '1px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }} 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }} 
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {violations.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1)' }}>
                          <ShieldAlert size={36} style={{ color: '#ef4444' }} />
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>Belum Ada Data Pelanggaran</div>
                        <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
                          Belum ada catatan pelanggaran yang ditambahkan ke sistem. Gunakan tombol "Catat Pelanggaran" jika diperlukan.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4" style={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}>
              <h2>{editingItem ? 'Edit Data Pelanggaran' : 'Catat Pelanggaran Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid" style={{ padding: '2rem 1.5rem' }}>
                {error && <div className="alert flex items-center gap-3" style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '1.5rem', fontWeight: 500 }}><AlertCircle size={20} />{error}</div>}
                
                <div className="form-group mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Siswa *</label>
                  {!selectedStudent ? (
                    <div className="relative">
                      <input 
                        type="text" 
                        className="input-field pl-9" 
                        placeholder="Cari nama atau NIS (min 3 huruf)..."
                        value={searchStudent}
                        onChange={(e) => setSearchStudent(e.target.value)}
                      />
                      <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                      
                      {students.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {students.map(s => (
                            <div 
                              key={s.id} 
                              className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSelectStudent(s)}
                            >
                              <div className="font-medium text-gray-800">{s.fullName}</div>
                              <div className="text-xs text-gray-500 font-mono">NIS: {s.nis}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-red-50 p-3 rounded-xl border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm"><User size={16} /></div>
                        <div>
                          <div className="font-bold text-sm text-gray-800">{selectedStudent.fullName}</div>
                          <div className="text-xs text-gray-600 font-mono">{selectedStudent.nis}</div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="text-xs text-red-600 font-semibold hover:bg-white px-3 py-1.5 rounded border border-red-200 transition-colors"
                        onClick={() => {
                          setSelectedStudent(null);
                          setStudentId('');
                        }}
                      >
                        Ganti Siswa
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group mb-4">
                  <label className="text-sm font-semibold text-gray-700">Kasus Pelanggaran *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Terlambat, Atribut tidak lengkap"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Kategori Pelanggaran</label>
                    <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Ringan">Ringan</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Berat">Berat</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Tanggal Kejadian *</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={violationDate} 
                      onChange={(e) => setViolationDate(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="text-sm font-semibold text-gray-700">Poin Penalti</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={points} 
                    onChange={(e) => setPoints(Number(e.target.value))}
                    min={0}
                  />
                </div>
                
                <div className="form-group mb-4">
                  <label className="text-sm font-semibold text-gray-700">Tindakan / Sanksi</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={actionTaken} 
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Misal: Teguran Lisan, Surat Peringatan"
                  />
                </div>

                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Keterangan / Kronologi Tambahan (Opsional)</label>
                  <textarea 
                    className="input-field" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{ resize: 'none' }}
                    placeholder="Tuliskan kronologi atau detail lebih lanjut..."
                  ></textarea>
                </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || !studentId} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', backgroundColor: '#dc2626' }}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
