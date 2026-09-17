import React, { useEffect, useState, useCallback } from 'react';
import { getViolations, createViolation, updateViolation, deleteViolation, type Violation } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { Plus, Search, User, Loader2, Filter, AlertTriangle, RotateCcw } from 'lucide-react';
import { PageHeader, Modal, FormField, Badge, type BadgeVariant } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/feedback';

interface ViolationForm {
  studentId: string;
  title: string;
  category: string;
  points: number | string;
  actionTaken: string;
  notes: string;
  violationDate: string;
}

const DEFAULT_FORM: ViolationForm = {
  studentId: '',
  title: '',
  category: 'Ringan',
  points: 0,
  actionTaken: '',
  notes: '',
  violationDate: new Date().toISOString().split('T')[0]
};

export const Violations: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah') ?? false;
  const canCreateAll = isSuperAdmin || hasPermission('violations.create_all') || hasPermission('violations.manage');
  const canCreateAssigned = hasPermission('violations.create_assigned') || hasPermission('violations.create') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const canCreate = canCreateAll || canCreateAssigned;
  const canEdit = isSuperAdmin || hasPermission('violations.update') || canCreate;
  const canDelete = isSuperAdmin || hasPermission('violations.delete') || hasPermission('student_affairs.write') || hasPermission('students.write');
  const hasActions = canEdit || canDelete;

  const [violations, setViolations] = useState<Violation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal & Form State
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm] = useState<ViolationForm>(DEFAULT_FORM);
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

  const fetchViolations = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      
      const data = await getViolations(params);
      setViolations(data);
    } catch (err: any) {
      notify.error(err, 'Gagal memuat data pelanggaran');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchViolations();
    setCurrentPage(1);
  }, [fetchViolations]);

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

  const handleOpenModal = (item?: Violation) => {
    if (item) {
      setForm({
        studentId: item.studentId || '',
        title: item.title || '',
        category: item.category || 'Ringan',
        points: item.points || 0,
        actionTaken: item.actionTaken || '',
        notes: item.notes || '',
        violationDate: item.violationDate ? item.violationDate.split('T')[0] : ''
      });
      setSelectedStudent(item.student || null);
      setSearchStudent('');
      setModal({ open: true, editId: item.id });
    } else {
      setForm({ ...DEFAULT_FORM, violationDate: new Date().toISOString().split('T')[0] });
      setSelectedStudent(null);
      setSearchStudent('');
      setModal({ open: true, editId: null });
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, editId: null });
  };

  const setField = (field: keyof ViolationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        category: form.category,
        points: Number(form.points),
        actionTaken: form.actionTaken,
        notes: form.notes,
        violationDate: new Date(form.violationDate).toISOString(),
      };
      
      if (modal.editId) {
        await updateViolation(modal.editId, payload);
        notify.success('Data pelanggaran berhasil diperbarui');
      } else {
        await createViolation(payload);
        notify.success('Data pelanggaran baru berhasil dicatat');
      }
      
      handleCloseModal();
      fetchViolations();
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan data pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Data Pelanggaran',
      message: 'Apakah Anda yakin ingin menghapus catatan pelanggaran ini? Tindakan ini tidak dapat dibatalkan.',
      variant: 'danger',
      action: async () => {
        try {
          await deleteViolation(id);
          notify.success('Data pelanggaran berhasil dihapus');
          fetchViolations();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus data pelanggaran');
        }
      }
    });
  };

  const getCategoryBadgeVariant = (cat?: string): BadgeVariant => {
    if (!cat) return 'default';
    if (cat.toLowerCase() === 'berat') return 'danger';
    if (cat.toLowerCase() === 'sedang') return 'warning';
    return 'default';
  };

  const columns: Column<Violation>[] = [
    {
      key: 'student',
      header: 'Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600 font-bold text-xs">
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
      header: 'Pelanggaran & Kategori',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-slate-800 text-sm">{row.title}</div>
          <div>
            <Badge variant={getCategoryBadgeVariant(row.category)}>
              {row.category || 'Ringan'}
            </Badge>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {new Date(row.violationDate || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'points',
      header: 'Poin Penalti',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-xs">
          -{row.points || 0}
        </span>
      )
    },
    {
      key: 'actionTaken',
      header: 'Tindakan / Sanksi',
      render: (row) => (
        <div className="flex flex-col gap-1 max-w-[220px]">
          <div className="text-xs font-semibold text-slate-800 truncate">{row.actionTaken || '-'}</div>
          {row.notes && <div className="text-xs text-slate-400 truncate" title={row.notes}>{row.notes}</div>}
        </div>
      )
    },
    ...(hasActions ? [{
      key: 'actions',
      header: 'Aksi',
      render: (row: Violation) => (
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
  const filteredViolations = violations.filter(item => {
    const matchesSearch = !search || 
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.student?.nis?.toLowerCase().includes(search.toLowerCase()) ||
      item.notes?.toLowerCase().includes(search.toLowerCase()) ||
      item.actionTaken?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const paginatedViolations = filteredViolations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasActiveFilter = Boolean(search || categoryFilter);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader 
        title="Pelanggaran Siswa" 
        subtitle="Kelola dan catat riwayat pelanggaran serta poin kedisiplinan siswa."
        action={canCreate ? (
          <button className="btn-std-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Tambah Pelanggaran
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
                placeholder="Cari nama siswa, NIS, atau jenis pelanggaran..." 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }} 
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tingkat Pelanggaran</label>
            <div className="relative group">
              <AlertTriangle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Semua Tingkat Pelanggaran</option>
                <option value="Ringan">Pelanggaran Ringan</option>
                <option value="Sedang">Pelanggaran Sedang</option>
                <option value="Berat">Pelanggaran Berat</option>
              </select>
            </div>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
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
            <h3 className="text-base font-bold text-slate-900 m-0">Daftar Pelanggaran Siswa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rekapitulasi riwayat pelanggaran dan catatan tindakan kedisiplinan</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total <span className="font-bold text-slate-800">{filteredViolations.length}</span> Pelanggaran Terdaftar
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={paginatedViolations} 
          loading={loading} 
          emptyMessage="Belum ada data pelanggaran."
          hasPagination={filteredViolations.length > 0}
        />

        {filteredViolations.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredViolations.length}
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
      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Data Pelanggaran' : 'Tambah Pelanggaran Baru'} size="lg">
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
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={17} />
                
                {students.length > 0 && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {students.map(s => {
                      const classroomName = s.enrollments?.[0]?.classroom?.name;
                      return (
                        <div 
                          key={s.id} 
                          className="p-3 hover:bg-rose-50/70 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                          onClick={() => handleSelectStudent(s)}
                        >
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{s.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">NIS: {s.nis}</div>
                          </div>
                          {classroomName && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-100 shrink-0">
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
              <div className="flex justify-between items-center bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-rose-600 shadow-xs font-bold text-xs">
                    {selectedStudent.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{selectedStudent.fullName}</span>
                      {selectedStudent.enrollments?.[0]?.classroom?.name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                          Kelas {selectedStudent.enrollments[0].classroom.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedStudent.nis}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="text-xs text-rose-600 font-semibold hover:bg-white px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
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

          <FormField label="Jenis / Nama Pelanggaran" required>
            <input 
              type="text" 
              className="input-std" 
              value={form.title} 
              onChange={setField('title')}
              placeholder="Misal: Terlambat masuk kelas"
              required 
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kategori Pelanggaran">
              <select className="input-std cursor-pointer" value={form.category} onChange={setField('category')}>
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
              </select>
            </FormField>
            <FormField label="Tanggal Pelanggaran" required>
              <input 
                type="date" 
                className="input-std" 
                value={form.violationDate} 
                onChange={setField('violationDate')}
                required 
              />
            </FormField>
          </div>

          <FormField label="Poin Penalti">
            <input 
              type="number" 
              className="input-std" 
              value={form.points} 
              onChange={setField('points')}
              min={0}
              placeholder="Poin penalti kedisiplinan..."
            />
          </FormField>

          <FormField label="Tindakan / Sanksi yang Diberikan">
            <input 
              type="text" 
              className="input-std" 
              value={form.actionTaken} 
              onChange={setField('actionTaken')}
              placeholder="Misal: Teguran lisan, Pemanggilan orang tua..."
            />
          </FormField>

          <FormField label="Keterangan Tambahan (Opsional)">
            <textarea 
              className="input-std min-h-[75px]" 
              value={form.notes} 
              onChange={setField('notes')}
              rows={3}
              placeholder="Catatan tambahan mengenai pelanggaran..."
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-3 pt-4 border-t border-slate-100">
            <button type="button" className="btn-std-secondary px-5" onClick={handleCloseModal} disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn-std-primary px-6 flex items-center gap-2" disabled={isSubmitting || !form.studentId}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Menyimpan...' : (modal.editId ? 'Simpan Perubahan' : 'Catat Pelanggaran')}
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
