import React, { useEffect, useState, useCallback } from 'react';
import { getAchievements, createAchievement, updateAchievement, deleteAchievement, type Achievement } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { Plus, Search, User, Loader2, Filter, Trophy, RotateCcw } from 'lucide-react';
import { PageHeader, Modal, FormField, Badge, type BadgeVariant } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/feedback';

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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  
  // Modal & Form State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<AchievementForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    action: async () => {}
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (levelFilter) params.level = levelFilter;
      
      const data = await getAchievements(params);
      setAchievements(data);
    } catch (err: any) {
      notify.error(err, 'Gagal memuat data prestasi');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, levelFilter]);

  useEffect(() => {
    fetchAchievements();
    setCurrentPage(1);
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
      notify.error('Siswa harus dipilih');
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
        notify.success('Data prestasi berhasil diperbarui');
      } else {
        await createAchievement(payload);
        notify.success('Data prestasi baru berhasil dicatat');
      }
      
      handleCloseModal();
      fetchAchievements();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan data prestasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Data Prestasi',
      message: 'Apakah Anda yakin ingin menghapus data prestasi ini? Tindakan ini tidak dapat dibatalkan.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteAchievement(id);
          notify.success('Data prestasi berhasil dihapus');
          fetchAchievements();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus data prestasi');
        }
      }
    });
  };

  const getLevelBadgeVariant = (lvl?: string): BadgeVariant => {
    if (!lvl) return 'default';
    if (lvl === 'Internasional' || lvl === 'Nasional') return 'purple';
    if (lvl === 'Provinsi' || lvl === 'Kabupaten' || lvl === 'Kabupaten/Kota') return 'info';
    if (lvl === 'Kecamatan') return 'warning';
    return 'default';
  };

  const columns: Column<Achievement>[] = [
    {
      key: 'student',
      header: 'Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-xs">
            {row.student?.fullName ? row.student.fullName.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{row.student?.fullName || '-'}</div>
            <div className="text-xs text-slate-500 font-mono">NIS: {row.student?.nis || '-'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'title',
      header: 'Judul & Kategori',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-slate-800 text-sm">{row.title}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
              {row.category || 'Akademik'}
            </span>
            {row.description && (
              <span className="text-xs text-slate-400 max-w-xs truncate" title={row.description}>
                {row.description}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'level',
      header: 'Tingkat & Peringkat',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div>
            <Badge variant={getLevelBadgeVariant(row.level)}>
              {row.level || 'Sekolah'}
            </Badge>
          </div>
          {row.rank && <div className="text-xs font-medium text-slate-600">{row.rank}</div>}
        </div>
      )
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {new Date(row.eventDate || row.date || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'points',
      header: 'Poin',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shadow-xs">
          +{row.points ?? 0}
        </span>
      )
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      render: (row: Achievement) => (
        <div className="flex justify-end">
          <ActionButtons 
            onEdit={canEdit ? () => handleOpenModal(row) : undefined}
            onDelete={canDelete ? () => handleDelete(row.id) : undefined}
          />
        </div>
      )
    }] : [])
  ];

  // Filter & Pagination Logic
  const filteredAchievements = achievements.filter(item => {
    const matchesSearch = !search || 
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.student?.nis?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesLevel = !levelFilter || item.level === levelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const totalPages = Math.ceil(filteredAchievements.length / itemsPerPage);
  const paginatedAchievements = filteredAchievements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasActiveFilter = Boolean(search || categoryFilter || levelFilter);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader 
        title="Prestasi Siswa" 
        subtitle="Kelola pencatatan penghargaan dan pencapaian akademik maupun non-akademik siswa."
        action={canCreate ? (
          <button className="btn-std-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Tambah Prestasi
          </button>
        ) : undefined}
      />

      {/* Filter Bar (Glassmorphism Standard - No Header, Icon Group Focus) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Pencarian Data</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" 
                placeholder="Cari nama siswa, NIS, atau judul prestasi..." 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }} 
              />
            </div>
          </div>

          <div className="w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Kategori Prestasi</label>
            <div className="relative group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Semua Kategori</option>
                <option value="Akademik">Akademik</option>
                <option value="Non-Akademik">Non-Akademik</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-56">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat Prestasi</label>
            <div className="relative group">
              <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Semua Tingkat</option>
                <option value="Sekolah">Sekolah</option>
                <option value="Kecamatan">Kecamatan</option>
                <option value="Kabupaten/Kota">Kabupaten/Kota</option>
                <option value="Provinsi">Provinsi</option>
                <option value="Nasional">Nasional</option>
                <option value="Internasional">Internasional</option>
              </select>
            </div>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setLevelFilter('');
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm self-stretch md:self-end cursor-pointer shrink-0"
              title="Reset seluruh filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Daftar Prestasi Siswa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rekapitulasi penghargaan dan capaian prestasi seluruh siswa</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total <span className="font-bold text-slate-800">{filteredAchievements.length}</span> Prestasi Terdaftar
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={paginatedAchievements} 
          loading={loading} 
          emptyMessage="Belum ada data prestasi. Tambahkan prestasi baru melalui tombol di atas."
          hasPagination={filteredAchievements.length > 0}
        />
        
        {filteredAchievements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAchievements.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Modal Form */}
      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Data Prestasi' : 'Tambah Prestasi Baru'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
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

          <FormField label="Siswa" required>
            {!selectedStudent ? (
              <div className="relative">
                <input 
                  type="text" 
                  className="input-std pl-10" 
                  placeholder="Ketik minimal 2 huruf nama atau NIS siswa..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={17} />
                
                {students.length > 0 && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {students.map(s => {
                      const classroomName = s.enrollments?.[0]?.classroom?.name;
                      return (
                        <div 
                          key={s.id} 
                          className="p-3 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{s.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">NIS: {s.nis}</div>
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
              <div className="flex justify-between items-center bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-xs font-bold text-xs">
                    {selectedStudent.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{selectedStudent.fullName}</span>
                      {selectedStudent.enrollments?.[0]?.classroom?.name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">
                          Kelas {selectedStudent.enrollments[0].classroom.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedStudent.nis}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="text-xs text-indigo-600 font-semibold hover:bg-white px-3 py-1.5 rounded-lg border border-indigo-200 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedStudent(null);
                    setForm(prev => ({ ...prev, studentId: '' }));
                  }}
                >
                  Ganti Siswa
                </button>
              </div>
            )}
          </FormField>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kategori">
              <select className="input-std cursor-pointer" value={form.category} onChange={setField('category')}>
                <option value="Akademik">Akademik</option>
                <option value="Non-Akademik">Non-Akademik</option>
              </select>
            </FormField>
            <FormField label="Tingkat">
              <select className="input-std cursor-pointer" value={form.level} onChange={setField('level')}>
                <option value="Sekolah">Sekolah</option>
                <option value="Kecamatan">Kecamatan</option>
                <option value="Kabupaten">Kabupaten / Kota</option>
                <option value="Provinsi">Provinsi</option>
                <option value="Nasional">Nasional</option>
                <option value="Internasional">Internasional</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="input-std min-h-[75px]" 
              value={form.description} 
              onChange={setField('description')}
              rows={3}
              placeholder="Tuliskan detail tambahan tentang prestasi ini..."
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-3 pt-4 border-t border-slate-100">
            <button type="button" className="btn-std-secondary px-5" onClick={handleCloseModal} disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn-std-primary px-6 flex items-center gap-2" disabled={isSubmitting || !form.studentId}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Menyimpan...' : (modal.editId ? 'Simpan Perubahan' : 'Catat Prestasi')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
};
