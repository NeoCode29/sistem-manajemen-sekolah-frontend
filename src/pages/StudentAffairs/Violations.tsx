import React, { useEffect, useState } from 'react';
import { getViolations, createViolation, updateViolation, deleteViolation, type Violation } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { Plus, Edit2, Trash2, Search, User, ShieldAlert, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { getErrorMessage } from '../../utils/errorHandler';

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
  const [violations, setViolations] = useState<Violation[]>([]);
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
  const [form, setForm] = useState<ViolationForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchViolations = React.useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      
      const data = await getViolations(params);
      setViolations(data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Gagal memuat data pelanggaran'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  // Debounced student search
  useEffect(() => {
    if (searchStudent.length >= 3) {
      const timer = setTimeout(async () => {
        try {
          const data = await getStudents({ search: searchStudent });
          setStudents(data);
        } catch (err) {
          console.error(err);
        }
      }, 500);
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
    setError('');
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
      showAlert('Siswa harus dipilih', 'Peringatan');
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
      } else {
        await createViolation(payload);
      }
      
      handleCloseModal();
      fetchViolations();
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Gagal menyimpan data pelanggaran. Pastikan siswa dipilih dan data terisi lengkap.'), 'Gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin menghapus data catatan pelanggaran ini?', async () => {
      try {
        await deleteViolation(id);
        setSuccess('Data pelanggaran berhasil dihapus!');
        fetchViolations();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus data pelanggaran siswa.'), 'Gagal');
      }
    });
  };

  const columns: Column<Violation>[] = [
    {
      key: 'student',
      header: 'Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-red-600" />
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
      header: 'Jenis Pelanggaran',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="font-bold text-gray-900">{row.title}</div>
          <div className="text-xs text-gray-500">{row.category}</div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-sm font-medium text-gray-700">
          {new Date(row.violationDate || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'points',
      header: 'Poin Penalti',
      render: (row) => (
        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold">
          -{row.points}
        </span>
      )
    },
    {
      key: 'actionTaken',
      header: 'Tindakan',
      render: (row) => (
        <div className="flex flex-col gap-1 max-w-[200px]">
          <div className="text-sm font-medium text-gray-800 truncate">{row.actionTaken || '-'}</div>
          {row.notes && <div className="text-xs text-gray-500 truncate">{row.notes}</div>}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => handleOpenModal(row)} className="p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader 
        title="Pelanggaran Siswa" 
        subtitle="Kelola dan catat riwayat pelanggaran serta poin kedisiplinan siswa."
        action={
          <button className="btn-std-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
            <Plus size={20} /> Tambah Pelanggaran
          </button>
        }
      />

      {error && !modal.open && (
        <div className="alert flex items-center gap-3 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-6 font-medium">
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert flex items-center gap-3 bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 mb-6 font-medium">
          <CheckCircle2 size={20} className="text-emerald-500" />
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
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Cari Nama Siswa atau Jenis Pelanggaran</label>
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
          data={violations} 
          loading={loading} 
          emptyMessage="Belum ada data pelanggaran."
        />
      </div>

      <Modal open={modal.open} onClose={handleCloseModal} title={modal.editId ? 'Edit Data Pelanggaran' : 'Tambah Pelanggaran Baru'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {error && <div className="alert bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 flex items-center gap-3 font-medium"><AlertCircle size={18} />{error}</div>}
          
          <div className="form-group">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Siswa *</label>
            {!selectedStudent ? (
              <div className="relative">
                <input 
                  type="text" 
                  className="input-std pl-10" 
                  placeholder="Cari nama atau NIS (min 3 huruf)..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {students.map(s => (
                      <div 
                        key={s.id} 
                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <div className="font-medium text-gray-900">{s.fullName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">NIS: {s.nis}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm"><User size={18} /></div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">{selectedStudent.fullName}</div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Kategori Pelanggaran">
              <select className="input-std" value={form.category} onChange={setField('category')}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Poin Penalti">
              <input 
                type="number" 
                className="input-std" 
                value={form.points} 
                onChange={setField('points')}
                min={0}
              />
            </FormField>
          </div>

          <FormField label="Tindakan / Sanksi yang Diberikan">
            <input 
              type="text" 
              className="input-std" 
              value={form.actionTaken} 
              onChange={setField('actionTaken')}
              placeholder="Misal: Teguran lisan, Pemanggilan orang tua"
            />
          </FormField>

          <FormField label="Keterangan Tambahan (Opsional)">
            <textarea 
              className="input-std" 
              value={form.notes} 
              onChange={setField('notes')}
              rows={3}
              style={{ resize: 'none' }}
              placeholder="Catatan tambahan mengenai pelanggaran..."
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
