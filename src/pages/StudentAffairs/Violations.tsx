import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getViolations, createViolation, updateViolation, deleteViolation, type Violation } from '../../api/studentAffairsService';
import { getStudents, type Student } from '../../api/studentService';
import { AlertOctagon, Plus, Edit2, Trash2, Search, User } from 'lucide-react';
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
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Ringan');
  const [actionTaken, setActionTaken] = useState('');
  const [points, setPoints] = useState<number>(0);

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
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Ringan');
    setActionTaken('');
    setPoints(0);
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: Violation) => {
    setEditingItem(item);
    setStudentId(item.studentId);
    setSelectedStudent(item.student);
    setSearchStudent('');
    setTitle(item.title);
    setDescription(item.description || '');
    setDate(item.date ? item.date.split('T')[0] : '');
    setCategory(item.category || 'Ringan');
    setActionTaken(item.actionTaken || '');
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
        date: new Date(date).toISOString(),
        category,
        actionTaken,
        points: Number(points)
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

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'sedang': return 'bg-orange-100 text-orange-700';
      case 'berat': return 'bg-red-100 text-red-700 font-bold';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelanggaran Siswa</h1>
          <p className="page-subtitle">Pencatatan indisipliner, pelanggaran tata tertib, dan poin hukuman</p>
        </div>
        <button className="btn-primary" onClick={() => openAddModal()}>
          <Plus size={18} /> Catat Pelanggaran
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-end bg-gray-50/50">
        <div className="form-group flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase">Cari Kasus / Nama Siswa</label>
          <div className="relative">
            <input 
              type="text" 
              className="input-field mt-1 pl-9" 
              placeholder="Ketik pencarian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {error && !isModalOpen && <div className="error-message mb-4">{error}</div>}

      <div className="glass-panel">
        <div className="table-header border-b-2 border-red-100">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <AlertOctagon size={18} /> Daftar Kasus Pelanggaran
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-y">
                  <th className="p-3 font-medium">Siswa</th>
                  <th className="p-3 font-medium">Kasus Pelanggaran</th>
                  <th className="p-3 font-medium text-center">Kategori</th>
                  <th className="p-3 font-medium text-center">Tanggal</th>
                  <th className="p-3 font-medium text-center">Poin Plus (Penalti)</th>
                  <th className="p-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-red-50/30">
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{item.student?.fullName}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">NIS: {item.student?.nis}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-red-700">{item.title}</div>
                      {item.actionTaken && (
                         <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                           <span className="font-semibold">Tindakan:</span> {item.actionTaken}
                         </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(item.category || '')}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm text-gray-600">
                      {new Date(item.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-sm">
                        +{item.points}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" onClick={() => openEditModal(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {violations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Belum ada data pelanggaran.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>{editingItem ? 'Edit Pelanggaran' : 'Catat Pelanggaran Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && <div className="error-message mb-4">{error}</div>}
              
              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Siswa *</label>
                {!selectedStudent ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      className="input-field pl-9" 
                      placeholder="Cari nama atau NIS (min 3 huruf)..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    
                    {students.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {students.map(s => (
                          <div 
                            key={s.id} 
                            className="p-3 hover:bg-red-50 cursor-pointer border-b last:border-b-0"
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
                  <div className="flex justify-between items-center bg-red-50 p-3 rounded-md border border-red-100">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-red-600" />
                      <div>
                        <div className="font-bold text-sm text-gray-800">{selectedStudent.fullName}</div>
                        <div className="text-xs text-gray-600 font-mono">{selectedStudent.nis}</div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="text-xs text-red-600 hover:underline px-2 py-1 bg-white rounded border border-red-200"
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentId('');
                      }}
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Jenis Pelanggaran *</label>
                <input 
                  type="text" 
                  className="input-field mt-1" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Terlambat, Merokok, dll."
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kategori</label>
                  <select className="input-field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tanggal Kejadian *</label>
                  <input 
                    type="date" 
                    className="input-field mt-1" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Poin Pelanggaran (Penalti)</label>
                <input 
                  type="number" 
                  className="input-field mt-1" 
                  value={points} 
                  onChange={(e) => setPoints(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Tindakan / Sanksi Diberikan</label>
                <input 
                  type="text" 
                  className="input-field mt-1" 
                  value={actionTaken} 
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Misal: Teguran Lisan, SP 1, Skorsing"
                />
              </div>

              <div className="form-group mb-6">
                <label className="text-sm font-medium text-gray-700">Keterangan Tambahan / Kronologi</label>
                <textarea 
                  className="input-field mt-1" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                ></textarea>
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 border-none" disabled={isSubmitting || !studentId}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    </div>
  );
};
