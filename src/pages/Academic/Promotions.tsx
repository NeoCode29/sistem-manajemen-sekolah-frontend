import React, { useEffect, useState } from 'react';
import { getPromotions, batchPromote, cancelPromotion } from '../../api/promotionService';
import { getAcademicYears, getClassrooms } from '../../api/academicService';
import type { AcademicYear, Classroom as ClassType } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { TrendingUp, X, AlertTriangle, Undo2 } from 'lucide-react';
import './Academic.css';

export const Promotions: React.FC = () => {
  const [promotionsHistory, setPromotionsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setError] = useState('');

  // Batch Promote State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSourceClass, setSelectedSourceClass] = useState('');
  
  // Target states for each student: { studentId: { status, targetClassId } }
  const [promotionData, setPromotionData] = useState<Record<string, {status: string, targetClassId: string}>>({});

  useEffect(() => {
    fetchHistory();
    fetchDropdowns();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getPromotions();
      setPromotionsHistory(data);
    } catch (err: any) {
      setError('Gagal memuat riwayat kenaikan kelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [ayData, classData] = await Promise.all([
        getAcademicYears(),
        getClassrooms()
      ]);
      setAcademicYears(ayData);
      setClasses(classData);
    } catch (err) {
      console.error('Failed to load dropdowns');
    }
  };

  const handleSourceClassChange = async (classId: string) => {
    setSelectedSourceClass(classId);
    if (!classId) {
      setSourceStudents([]);
      return;
    }
    
    try {
      // In a real app, you'd fetch students for this specific class
      // Assuming getStudents takes a classId param
      const students = await getStudents({ classId });
      setSourceStudents(students);
      
      // Initialize promotion data
      const initialData: Record<string, any> = {};
      students.forEach((s: Student) => {
        initialData[s.id] = { status: 'PROMOTED', targetClassId: '' };
      });
      setPromotionData(initialData);
    } catch (err) {
      setError('Gagal memuat daftar siswa');
    }
  };

  const handleStudentActionChange = (studentId: string, field: 'status' | 'targetClassId', value: string) => {
    setPromotionData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        // If status changes to STAYED or DROPPED_OUT, reset targetClass
        ...(field === 'status' && value !== 'PROMOTED' ? { targetClassId: '' } : {})
      }
    }));
  };

  const handleBatchPromoteSubmit = async () => {
    if (!selectedAcademicYear || !selectedSourceClass) {
      alert('Tahun ajaran dan kelas asal harus dipilih');
      return;
    }

    const payload = {
      academicYearId: selectedAcademicYear,
      sourceClassId: selectedSourceClass,
      promotions: sourceStudents.map(s => ({
        studentId: s.id.toString(),
        targetClassId: promotionData[s.id].targetClassId,
        status: promotionData[s.id].status,
      }))
    };

    try {
      await batchPromote(payload);
      setIsModalOpen(false);
      fetchHistory();
      alert('Proses kenaikan kelas berhasil');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses kenaikan kelas');
    }
  };

  const handleCancelPromotion = async (id: string) => {
    if (window.confirm('Yakin ingin membatalkan status kenaikan kelas ini?')) {
      try {
        await cancelPromotion(id);
        fetchHistory();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal membatalkan');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROMOTED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Naik Kelas</span>;
      case 'STAYED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Tinggal Kelas</span>;
      case 'DROPPED_OUT': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Keluar / DO</span>;
      case 'GRADUATED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Lulus</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kenaikan Kelas</h1>
          <p className="page-subtitle">Riwayat dan pemrosesan kenaikan kelas siswa</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <TrendingUp size={18} />
            <span>Proses Kenaikan Kelas</span>
          </button>
        </div>
      </div>

      <div className="glass-panel mt-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Tahun Ajaran Baru</th>
                  <th>Kelas Asal</th>
                  <th>Kelas Tujuan</th>
                  <th>Status</th>
                  <th>Tanggal Proses</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {promotionsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      Belum ada riwayat kenaikan kelas
                    </td>
                  </tr>
                ) : (
                  promotionsHistory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium text-gray-900">{item.student?.name || 'Siswa tidak ditemukan'}</div>
                        <div className="text-xs text-gray-500">{item.student?.nis || item.student?.nisn}</div>
                      </td>
                      <td>{item.academicYear?.name || '-'}</td>
                      <td>{item.sourceClass?.name || '-'}</td>
                      <td>{item.targetClass?.name || '-'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                      <td>
                        <button
                          onClick={() => handleCancelPromotion(item.id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded flex items-center gap-1 text-xs font-medium border border-transparent hover:border-orange-200"
                          title="Batalkan Kenaikan Kelas"
                        >
                          <Undo2 size={14} /> Batal
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Processing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Pemrosesan Kenaikan Kelas (Batch)
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 text-blue-800 text-sm">
                <AlertTriangle size={20} className="text-blue-600 flex-shrink-0" />
                <p>
                  Pilih Tahun Ajaran <strong>Baru</strong> (tahun tujuan) dan Kelas <strong>Asal</strong> (kelas saat ini). Sistem akan memuat semua siswa di kelas asal untuk diproses secara massal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tahun Ajaran Tujuan (Baru) *</label>
                  <select
                    className="input-field mt-1 w-full"
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  >
                    <option value="">-- Pilih Tahun Ajaran Baru --</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kelas Asal (Saat Ini) *</label>
                  <select
                    className="input-field mt-1 w-full"
                    value={selectedSourceClass}
                    onChange={(e) => handleSourceClassChange(e.target.value)}
                  >
                    <option value="">-- Pilih Kelas Asal --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {sourceStudents.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">NIS/NISN</th>
                        <th className="px-4 py-3 w-48">Status Kenaikan</th>
                        <th className="px-4 py-3 w-48">Kelas Tujuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sourceStudents.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2 font-medium text-gray-900">{student.fullName}</td>
                          <td className="px-4 py-2 text-gray-500">{student.nis || '-'}</td>
                          <td className="px-4 py-2">
                            <select
                              className="w-full p-1.5 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={promotionData[student.id]?.status || 'PROMOTED'}
                              onChange={(e) => handleStudentActionChange(student.id, 'status', e.target.value)}
                            >
                              <option value="PROMOTED">Naik Kelas</option>
                              <option value="STAYED">Tinggal Kelas</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              className="w-full p-1.5 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={promotionData[student.id]?.targetClassId || ''}
                              onChange={(e) => handleStudentActionChange(student.id, 'targetClassId', e.target.value)}
                              disabled={promotionData[student.id]?.status !== 'PROMOTED'}
                              required={promotionData[student.id]?.status === 'PROMOTED'}
                            >
                              <option value="">-- Pilih Kelas Baru --</option>
                              {classes.filter(c => c.id !== selectedSourceClass).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {selectedSourceClass && sourceStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  Tidak ada siswa di kelas ini.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {sourceStudents.length > 0 ? `${sourceStudents.length} siswa akan diproses.` : ''}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBatchPromoteSubmit}
                  disabled={sourceStudents.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proses & Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
