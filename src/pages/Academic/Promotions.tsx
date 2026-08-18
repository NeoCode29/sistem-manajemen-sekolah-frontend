import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPromotions, batchPromote, cancelPromotion } from '../../api/promotionService';
import { getAcademicYears, getClassrooms, getSemesters } from '../../api/academicService';
import type { AcademicYear, Classroom as ClassType, Semester } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { TrendingUp, X, AlertTriangle, Undo2, CheckSquare } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import './Academic.css';

export const Promotions: React.FC = () => {
  const [promotionsHistory, setPromotionsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setError] = useState('');

  // Batch Promote State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  
  const [selectedSourceAcademicYear, setSelectedSourceAcademicYear] = useState('');
  const [selectedTargetAcademicYear, setSelectedTargetAcademicYear] = useState('');
  const [selectedSourceClass, setSelectedSourceClass] = useState('');
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [selectedTargetSemester, setSelectedTargetSemester] = useState('');
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchHistory = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const response = await getPromotions({ page, limit });
      setPromotionsHistory(response.data || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(page);
    } catch (err: any) {
      setError('Gagal memuat riwayat kenaikan kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);


  const fetchDropdowns = async () => {
    try {
      const [ayData, classData, semData] = await Promise.all([
        getAcademicYears(),
        getClassrooms(),
        getSemesters()
      ]);
      setAcademicYears(ayData);
      setClasses(classData);
      setSemesters(semData);
      
      const activeAy = ayData.find(ay => ay.isActive);
      const activeSem = semData.find(s => s.isActive);
      if (activeAy) setSelectedSourceAcademicYear(activeAy.id);
      if (activeSem) setSelectedTargetSemester(activeSem.id);
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
      // Students should be fetched by classroomId and enrollmentStatus
      const students = await getStudents({ classroomId: classId, status: 'ACTIVE', enrollmentStatus: 'ACTIVE' });
      setSourceStudents(students);
      setSelectedStudentIds(students.map(s => s.id.toString()));
    } catch (err) {
      setError('Gagal memuat daftar siswa');
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleBatchPromoteSubmit = async () => {
    if (!selectedSourceAcademicYear || !selectedTargetAcademicYear || !selectedSourceClass || !selectedTargetClass || !selectedTargetSemester) {
      alert('Tahun Ajaran, Kelas, dan Semester (Asal & Tujuan) harus dipilih lengkap!');
      return;
    }
    
    if (selectedSourceAcademicYear === selectedTargetAcademicYear) {
      alert('Tahun Ajaran Asal dan Tujuan tidak boleh sama!');
      return;
    }

    if (sourceStudents.length === 0) {
      alert('Tidak ada siswa di kelas ini.');
      return;
    }

    const retainedIds = sourceStudents.map(s => s.id.toString()).filter(id => !selectedStudentIds.includes(id));
    
    if (!window.confirm(`Siswa Naik Kelas: ${selectedStudentIds.length} orang\nSiswa Tinggal Kelas: ${retainedIds.length} orang\n\nLanjutkan proses?`)) {
        return;
    }

    const payload = {
      studentIds: selectedStudentIds,
      retainedStudentIds: retainedIds,
      sourceClassroomId: selectedSourceClass,
      targetClassroomId: selectedTargetClass,
      sourceAcademicYearId: selectedSourceAcademicYear,
      targetAcademicYearId: selectedTargetAcademicYear,
      targetSemesterId: selectedTargetSemester,
    };

    try {
      const response = await batchPromote(payload);
      setIsModalOpen(false);
      fetchHistory(1);
      
      if (response.failedCount > 0) {
        alert(`Diproses: ${response.promotedCount} naik, ${response.retainedCount} tinggal. Gagal: ${response.failedCount} siswa.`);
      } else {
        alert('Proses berhasil untuk semua siswa.');
      }
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
          <>
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
                        <div className="font-medium text-gray-900">{item.student?.fullName || item.student?.name || 'Siswa tidak ditemukan'}</div>
                        <div className="text-xs text-gray-500">{item.student?.nis || item.student?.nisn}</div>
                      </td>
                      <td>{item.toAcademicYear?.name || '-'}</td>
                      <td>{item.fromClassroom?.name || '-'}</td>
                      <td>{item.toClassroom?.name || '-'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{new Date(item.promotionDate || item.createdAt).toLocaleDateString('id-ID')}</td>
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
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />
          )}
          </>
        )}
      </div>

      {/* Batch Processing Modal */}
      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '900px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Pemrosesan Kenaikan Kelas (Batch)
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-v4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 text-blue-800 text-sm">
                <AlertTriangle size={20} className="text-blue-600 flex-shrink-0" />
                <p>
                  Siswa yang di-checklist akan NAIK KELAS ke Kelas Tujuan. Siswa yang TIDAK di-checklist akan berstatus TINGGAL KELAS dan didaftarkan kembali ke Kelas Asal pada Tahun Ajaran Baru.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                <div className="form-group">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1">Tahun Ajaran Saat Ini *</label>
                  <select
                    className="input-field w-full shadow-sm"
                    value={selectedSourceAcademicYear}
                    onChange={(e) => setSelectedSourceAcademicYear(e.target.value)}
                  >
                    <option value="">-- Pilih --</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1">Kelas Asal (Saat Ini) *</label>
                  <select
                    className="input-field w-full shadow-sm border-blue-300"
                    value={selectedSourceClass}
                    onChange={(e) => handleSourceClassChange(e.target.value)}
                  >
                    <option value="">-- Pilih Kelas Asal --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="hidden lg:block"></div>

                <div className="form-group mt-2">
                  <label className="text-xs font-bold text-green-700 uppercase mb-1">Tahun Ajaran Tujuan (Baru) *</label>
                  <select
                    className="input-field w-full shadow-sm"
                    value={selectedTargetAcademicYear}
                    onChange={(e) => setSelectedTargetAcademicYear(e.target.value)}
                  >
                    <option value="">-- Pilih --</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
                <div className="form-group mt-2">
                  <label className="text-xs font-bold text-green-700 uppercase mb-1">Semester Tujuan *</label>
                  <select
                    className="input-field w-full shadow-sm"
                    value={selectedTargetSemester}
                    onChange={(e) => setSelectedTargetSemester(e.target.value)}
                  >
                    <option value="">-- Pilih --</option>
                    {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
                  </select>
                </div>
                <div className="form-group mt-2">
                  <label className="text-xs font-bold text-green-700 uppercase mb-1">Kelas Tujuan (Baru) *</label>
                  <select
                    className="input-field w-full shadow-sm border-green-400 focus:ring-green-100"
                    value={selectedTargetClass}
                    onChange={(e) => setSelectedTargetClass(e.target.value)}
                  >
                    <option value="">-- Pilih Kelas Tujuan --</option>
                    {classes.filter(c => c.id !== selectedSourceClass).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {sourceStudents.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-100 p-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700 text-sm">Pilih Siswa yang Naik Kelas</span>
                    <button 
                      onClick={() => setSelectedStudentIds(sourceStudents.map(s => s.id.toString()))} 
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <CheckSquare size={14} /> Pilih Semua
                    </button>
                  </div>
                  <table className="w-full text-left text-sm bg-white">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">✓</th>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">NIS/NISN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sourceStudents.map(student => {
                        const isSelected = selectedStudentIds.includes(student.id.toString());
                        return (
                          <tr key={student.id} className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/10' : ''}`} onClick={() => toggleStudentSelection(student.id.toString())}>
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                checked={isSelected}
                                onChange={() => {}} 
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{student.fullName}</td>
                            <td className="px-4 py-3 text-gray-500">{student.nis || '-'}</td>
                          </tr>
                        );
                      })}
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
            
            <div className="modal-footer-v4">
              <div className="flex justify-between items-center w-full">
                <span className="text-sm text-gray-500">
                  {sourceStudents.length > 0 ? `${sourceStudents.length} siswa akan diproses.` : ''}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary"
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
        </div>,
        document.body
      )}
    </div>
  );
};
