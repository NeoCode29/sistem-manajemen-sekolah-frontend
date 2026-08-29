import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAchievements, createAchievement, updateAchievement, deleteAchievement, type Achievement } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { Award, Plus, Edit2, Trash2, Search, User, Star, AlertCircle } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

export const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { showConfirm, showAlert } = useDialog();
  
  const [search, setSearch] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Akademik');
  const [level, setLevel] = useState('Sekolah');
  const [rank, setRank] = useState('');
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    fetchAchievements();
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

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      
      const data = await getAchievements(params);
      setAchievements(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data prestasi');
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
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Akademik');
    setLevel('Sekolah');
    setRank('');
    setPoints(0);
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: Achievement) => {
    setEditingItem(item);
    setStudentId(item.studentId);
    setSelectedStudent(item.student);
    setSearchStudent('');
    setTitle(item.title);
    setDescription(item.description || '');
    setDate(item.eventDate ? item.eventDate.split('T')[0] : (item.date ? item.date.split('T')[0] : ''));
    setCategory(item.category || 'Akademik');
    setLevel(item.level || 'Sekolah');
    setRank(item.rank || '');
    setPoints(item.points || 0);
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
        description,
        category,
        eventDate: new Date(date).toISOString(),
        level,
        rank,
        points: Number(points)
      };
      
      if (editingItem) {
        await updateAchievement(editingItem.id, payload);
      } else {
        await createAchievement(payload);
      }
      
      closeModal();
      fetchAchievements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus data prestasi ini?', async () => {
      try {
        await deleteAchievement(id);
        setSuccess('Data prestasi berhasil dihapus!');
        fetchAchievements();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus data');
      }
    });
  };

  return (
    <div className="academic-container">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Prestasi Siswa</h1>
          <p className="page-description" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>Kelola pencatatan penghargaan dan pencapaian akademik maupun non-akademik siswa.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => openAddModal()}
            style={{ padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '0.95rem' }}
          >
            <Plus size={20} /> Tambah Prestasi
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
          <Star size={20} className="text-emerald-500" />
          {success}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} style={{ color: '#4f46e5' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>Pencarian Data Prestasi</h2>
        </div>
        <div className="form-group" style={{ gap: '0.35rem', maxWidth: '500px' }}>
          <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Cari Nama Siswa atau Judul Prestasi</label>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Daftar Prestasi</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Seluruh catatan pencapaian siswa yang terdaftar dalam sistem.</p>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>Memuat data prestasi...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(248, 250, 252, 0.7)', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siswa</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Judul Prestasi</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tingkat & Peringkat</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Tanggal</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Poin</th>
                  <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={18} style={{ color: '#4f46e5' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{item.student?.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>NIS: {item.student?.nis}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.95rem' }}>{item.title}</div>
                      {item.description && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>}
                    </td>

                    <td style={{ padding: '1.25rem 2rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{item.level}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{item.rank}</div>
                    </td>
                    
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                        {new Date(item.eventDate || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    <td style={{ padding: '1.25rem 2rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'inline-block' }}>
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
                ))}
                
                {achievements.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.1)' }}>
                          <Award size={36} style={{ color: '#d97706' }} />
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>Belum Ada Data Prestasi</div>
                        <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
                          Belum ada data prestasi siswa yang ditambahkan. Gunakan tombol "Tambah Prestasi" untuk mulai mendata.
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
              <h2>{editingItem ? 'Edit Data Prestasi' : 'Tambah Prestasi Baru'}</h2>
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
                              className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
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
                    <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm"><User size={16} /></div>
                        <div>
                          <div className="font-bold text-sm text-gray-800">{selectedStudent.fullName}</div>
                          <div className="text-xs text-gray-600 font-mono">{selectedStudent.nis}</div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="text-xs text-indigo-600 font-semibold hover:bg-white px-3 py-1.5 rounded border border-indigo-200 transition-colors"
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
                  <label className="text-sm font-semibold text-gray-700">Nama / Judul Prestasi *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Juara 1 Olimpiade Matematika Nasional"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Kategori</label>
                    <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Akademik">Akademik</option>
                      <option value="Non-Akademik">Non-Akademik</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Tingkat</label>
                    <select className="input-field" value={level} onChange={(e) => setLevel(e.target.value)}>
                      <option value="Sekolah">Sekolah</option>
                      <option value="Kecamatan">Kecamatan</option>
                      <option value="Kabupaten">Kabupaten / Kota</option>
                      <option value="Provinsi">Provinsi</option>
                      <option value="Nasional">Nasional</option>
                      <option value="Internasional">Internasional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Peringkat / Predikat</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={rank} 
                      onChange={(e) => setRank(e.target.value)}
                      placeholder="Misal: Juara 1, Medali Emas"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Tanggal Diperoleh *</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700">Poin Prestasi</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={points} 
                      onChange={(e) => setPoints(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-sm font-semibold text-gray-700">Keterangan Tambahan (Opsional)</label>
                  <textarea 
                    className="input-field" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{ resize: 'none' }}
                    placeholder="Tuliskan detail tambahan tentang prestasi ini..."
                  ></textarea>
                </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || !studentId} style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
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
