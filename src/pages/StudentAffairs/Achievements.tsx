import React, { useEffect, useState, useCallback } from 'react';
import { getAchievements, createAchievement, updateAchievement, deleteAchievement, type Achievement } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { Award, Plus, Edit2, Trash2, Search, User, Star, AlertCircle, Loader2 } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';

interface AchievementForm {
  studentId: string;
  title: string;
  description: string;
  date: string;
  category: string;
  level: string;
  rank: string;
  points: number | string;
}

const DEFAULT_FORM: AchievementForm = {
  studentId: '',
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Akademik',
  level: 'Sekolah',
  rank: '',
  points: 10
};

export const Achievements: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah') ?? false;
  const canCreateAll = isSuperAdmin || hasPermission('achievements.create_all') || hasPermission('achievements.manage');
  const canCreateAssigned = hasPermission('achievements.create_assigned') || hasPermission('achievements.create') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const canCreate = canCreateAll || canCreateAssigned;
  const canEdit = isSuperAdmin || hasPermission('achievements.update') || canCreate;
  const canDelete = isSuperAdmin || hasPermission('achievements.delete') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const hasActions = canEdit || canDelete;

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { showConfirm, showAlert } = useDialog();
  const [search, setSearch] = useState('');
  
  // Modal & Form State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<AchievementForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAchievements = useCallback(async () => {
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
  }, [search]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Debounced student search
  useEffect(() => {
    if (searchStudent.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const data = await getStudents({ search: searchStudent, limit: 30 });
          setStudents(data);
        } catch (err) {
          console.error(err);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setStudents([]);
    }
  }, [searchStudent]);

  const handleOpenModal = (item?: Achievement) => {
    if (item) {
      setForm({
        studentId: item.studentId || '',
        title: item.title || '',
        description: item.description || '',
        date: item.eventDate ? item.eventDate.split('T')[0] : (item.date ? item.date.split('T')[0] : ''),
        category: item.category || 'Akademik',
        level: item.level || 'Sekolah',
        rank: item.rank || '',
        points: item.points || 10
      });
      setSelectedStudent(item.student || null);
      setSearchStudent('');
      setModal({ open: true, editId: item.id });
    } else {
      setForm({ ...DEFAULT_FORM, date: new Date().toISOString().split('T')[0] });
      setSelectedStudent(null);
      setSearchStudent('');
      setModal({ open: true, editId: null });
    }
    setError('');
  };

  const handleCloseModal = () => {
    setModal({ open: false, editId: null });
  };

  const setField = (field: keyof AchievementForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setForm(prev => ({ ...prev, studentId: s.id }));
    setSearchStudent('');
    setStudents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      setError('Siswa harus dipilih');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        studentId: form.studentId,
        title: form.title,
        description: form.description,
        category: form.category,
        eventDate: new Date(form.date).toISOString(),
        level: form.level,
        rank: form.rank,
        points: Number(form.points)
      };
      
      if (modal.editId) {
        await updateAchievement(modal.editId, payload);
      } else {
        await createAchievement(payload);
      }
      
      handleCloseModal();
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

  const columns: Column<Achievement>[] = [
    {
      key: 'student',
      header: 'Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-gray-900">{row.student?.fullName}</div>
            <div className="text-xs text-gray-500 font-mono">NIS: {row.student?.nis}</div>
          </div>
        </div>
      )
    },
    {
      key: 'title',
      header: 'Judul Prestasi',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="font-bold text-indigo-600">{row.title}</div>
          {row.description && <div className="text-xs text-gray-500 max-w-xs truncate">{row.description}</div>}
        </div>
      )
    },
    {
      key: 'level',
      header: 'Tingkat & Peringkat',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-gray-900">{row.level}</div>
          <div className="text-xs text-gray-500">{row.rank}</div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-sm font-medium text-gray-700">
          {new Date(row.eventDate || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'points',
      header: 'Poin',
      render: (row) => (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold">
          +{row.points}
        </span>
      )
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      render: (row: Achievement) => (
        <div className="flex justify-end gap-2">
          {canEdit && (
            <button onClick={() => handleOpenModal(row)} className="p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
              <Edit2 size={18} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(row.id)} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader 
        title="Prestasi Siswa" 
        subtitle="Kelola pencatatan penghargaan dan pencapaian akademik maupun non-akademik siswa."
        action={canCreate ? (
          <button className="btn-std-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={20} /> Tambah Prestasi
          </button>
        ) : undefined}
      />

      {error && !modal.open && (
        <div className="alert flex items-center gap-3 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-6 font-medium">
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert flex items-center gap-3 bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 mb-6 font-medium">
          <Star size={20} className="text-emerald-500" />
          {success}
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Pencarian Data</h2>
        </div>
        <div className="max-w-md">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Cari Nama Siswa atau Judul</label>
          <div className="relative">
            <input 
              type="text" 
              className="input-std pl-10" 
              placeholder="Ketik kata kunci pencarian..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <DataTable 
          columns={columns} 
          data={achievements} 
          loading={loading} 
          emptyMessage="Belum ada data prestasi. Tambahkan prestasi baru melalui tombol di atas."
        />
      </div>

      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Data Prestasi' : 'Tambah Prestasi Baru'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {error && <div className="alert bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 flex items-center gap-3 font-medium"><AlertCircle size={18} />{error}</div>}
          
          {/* Access Mode Indicator */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            {canCreateAll ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mode Akses: Seluruh Siswa (Akses Global / BK / Kesiswaan)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Mode Akses: Siswa Kelas yang Diampu / Diwalikan Saja
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Siswa *</label>
            {!selectedStudent ? (
              <div className="relative">
                <input 
                  type="text" 
                  className="input-std pl-10" 
                  placeholder="Cari nama atau NIS siswa..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {students.map(s => {
                      const classroomName = s.enrollments?.[0]?.classroom?.name;
                      return (
                        <div 
                          key={s.id} 
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors flex items-center justify-between"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{s.fullName}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">NIS: {s.nis}</div>
                          </div>
                          {classroomName && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shrink-0">
                              Kelas {classroomName}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm"><User size={18} /></div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                      <span>{selectedStudent.fullName}</span>
                      {selectedStudent.enrollments?.[0]?.classroom?.name && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">
                          Kelas {selectedStudent.enrollments[0].classroom.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedStudent.nis}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="text-xs text-indigo-600 font-semibold hover:bg-white px-3 py-2 rounded-lg border border-indigo-200 transition-colors"
                  onClick={() => {
                    setSelectedStudent(null);
                    setForm(prev => ({ ...prev, studentId: '' }));
                  }}
                >
                  Ganti Siswa
                </button>
              </div>
            )}
          </div>

          <FormField label="Nama / Judul Prestasi" required>
            <input 
              type="text" 
              className="input-std" 
              value={form.title} 
              onChange={setField('title')}
              placeholder="Misal: Juara 1 Olimpiade Matematika Nasional"
              required 
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Kategori">
              <select className="input-std" value={form.category} onChange={setField('category')}>
                <option value="Akademik">Akademik</option>
                <option value="Non-Akademik">Non-Akademik</option>
              </select>
            </FormField>
            <FormField label="Tingkat">
              <select className="input-std" value={form.level} onChange={setField('level')}>
                <option value="Sekolah">Sekolah</option>
                <option value="Kecamatan">Kecamatan</option>
                <option value="Kabupaten">Kabupaten / Kota</option>
                <option value="Provinsi">Provinsi</option>
                <option value="Nasional">Nasional</option>
                <option value="Internasional">Internasional</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Peringkat / Predikat">
              <input 
                type="text" 
                className="input-std" 
                value={form.rank} 
                onChange={setField('rank')}
                placeholder="Misal: Juara 1, Medali Emas"
              />
            </FormField>
            <FormField label="Tanggal Diperoleh" required>
              <input 
                type="date" 
                className="input-std" 
                value={form.date} 
                onChange={setField('date')}
                required 
              />
            </FormField>
          </div>

          <FormField label="Poin Prestasi" required>
            <input 
              type="number" 
              className="input-std" 
              value={form.points} 
              onChange={setField('points')}
              min={1}
              placeholder="Minimal 1 poin"
              required
            />
          </FormField>

          <FormField label="Keterangan Tambahan (Opsional)">
            <textarea 
              className="input-std" 
              value={form.description} 
              onChange={setField('description')}
              rows={3}
              style={{ resize: 'none' }}
              placeholder="Tuliskan detail tambahan tentang prestasi ini..."
            ></textarea>
          </FormField>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" className="btn-std-secondary px-6" onClick={handleCloseModal}>Batal</button>
            <button type="submit" className="btn-std-primary px-6 flex items-center gap-2" disabled={isSubmitting || !form.studentId}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
