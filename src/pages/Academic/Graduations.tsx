import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getGraduations, batchGraduate, cancelGraduation } from '../../api/promotionService';
import { getClassrooms, getAcademicYears } from '../../api/academicService';
import type { Classroom as ClassType } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { GraduationCap, X, AlertTriangle, Undo2, Award } from 'lucide-react';
import './Academic.css';

export const Graduations: React.FC = () => {
  const [graduationsHistory, setGraduationsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setError] = useState('');

  // Batch Graduate State
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [graduationDate, setGraduationDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState('');
  
  // Selected students for graduation
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
    fetchClasses();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getGraduations();
      setGraduationsHistory(data);
    } catch (err: any) {
      setError('Gagal memuat riwayat kelulusan (Alumni)');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const [classData, ayData] = await Promise.all([
        getClassrooms(),
        getAcademicYears()
      ]);
      setClasses(classData);
      setAcademicYears(ayData);
      
      const activeAy = ayData.find((ay: any) => ay.isActive);
      if (activeAy) {
        setSelectedAcademicYear(activeAy.id);
      }
    } catch (err) {
      console.error('Failed to load data');
    }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    if (!classId) {
      setSourceStudents([]);
      setSelectedStudentIds(new Set());
      return;
    }
    
    try {
      // Students should be fetched by classroomId and enrollmentStatus
      const students = await getStudents({ classroomId: classId, status: 'ACTIVE', enrollmentStatus: 'ACTIVE' });
      setSourceStudents(students);
      // Auto-select all by default
      setSelectedStudentIds(new Set(students.map((s: Student) => s.id.toString())));
    } catch (err) {
      setError('Gagal memuat daftar siswa');
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(new Set(sourceStudents.map(s => s.id.toString())));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleBatchGraduateSubmit = async () => {
    if (!selectedClass || !graduationDate) {
      alert('Kelas dan tanggal kelulusan harus diisi');
      return;
    }
    if (selectedStudentIds.size === 0) {
      alert('Pilih minimal satu siswa untuk diluluskan');
      return;
    }

    const payload = {
      classroomId: selectedClass,
      academicYearId: selectedAcademicYear,
      graduationDate: new Date(graduationDate).toISOString(),
      notes: documentNumber,
      studentIds: Array.from(selectedStudentIds)
    };

    try {
      await batchGraduate(payload);
      setIsModalOpen(false);
      fetchHistory();
      alert('Proses kelulusan berhasil. Siswa kini menjadi Alumni.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses kelulusan');
    }
  };

  const handleCancelGraduation = async (id: string) => {
    if (window.confirm('Yakin ingin membatalkan status kelulusan ini? Siswa akan dikembalikan menjadi siswa aktif.')) {
      try {
        await cancelGraduation(id);
        fetchHistory();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal membatalkan kelulusan');
      }
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kelulusan & Alumni</h1>
          <p className="page-subtitle">Daftar alumni dan proses pelepasan siswa (Lulus)</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Award size={18} />
            <span>Proses Kelulusan Baru</span>
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
                  <th>Siswa (Alumni)</th>
                  <th>Kelas Terakhir</th>
                  <th>Tanggal Lulus</th>
                  <th>No. SK / Ijazah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {graduationsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Belum ada data kelulusan / alumni
                    </td>
                  </tr>
                ) : (
                  graduationsHistory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <GraduationCap size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.student?.name || 'Siswa tidak ditemukan'}</div>
                            <div className="text-xs text-gray-500">{item.student?.nis || item.student?.nisn}</div>
                          </div>
                        </div>
                      </td>
                      <td>{item.class?.name || '-'}</td>
                      <td>{new Date(item.graduationDate).toLocaleDateString('id-ID')}</td>
                      <td>
                        {item.documentNumber ? (
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{item.documentNumber}</span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum diinput</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleCancelGraduation(item.id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded flex items-center gap-1 text-xs font-medium border border-transparent hover:border-orange-200"
                          title="Batalkan Kelulusan"
                        >
                          <Undo2 size={14} /> Batal Lulus
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
      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '900px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2">
                <Award size={20} className="text-blue-600" />
                Proses Kelulusan Siswa (Batch)
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-v4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3 text-yellow-800 text-sm">
                <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
                <p>
                  Siswa yang diluluskan akan diubah statusnya menjadi <strong>Alumni</strong> (tidak lagi aktif). Pastikan Anda telah menyelesaikan semua administrasi nilai sebelum melakukan proses ini.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Pilih Kelas (Kelas Akhir) *</label>
                  <select
                    className="input-field mt-1 w-full"
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tanggal Kelulusan *</label>
                  <input
                    type="date"
                    className="input-field mt-1 w-full"
                    value={graduationDate}
                    onChange={(e) => setGraduationDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">No. SK Kelulusan (Opsional)</label>
                  <input
                    type="text"
                    className="input-field mt-1 w-full"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Misal: 421/001/SK-LULUS/2024"
                  />
                </div>
              </div>

              {sourceStudents.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3 w-10 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600 focus:ring-blue-500"
                            checked={selectedStudentIds.size === sourceStudents.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">NIS/NISN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sourceStudents.map(student => (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-gray-50/50 cursor-pointer ${selectedStudentIds.has(student.id.toString()) ? 'bg-blue-50/30' : ''}`}
                          onClick={() => handleStudentToggle(student.id.toString())}
                        >
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox" 
                              className="rounded text-blue-600 focus:ring-blue-500"
                              checked={selectedStudentIds.has(student.id.toString())}
                              onChange={() => {}} // Handled by tr onClick
                              onClick={(e) => e.stopPropagation()} // Prevent double trigger
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{student.fullName}</td>
                          <td className="px-4 py-3 text-gray-500">{student.nis || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {selectedClass && sourceStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  Tidak ada siswa di kelas ini.
                </div>
              )}
            </div>
            
            <div className="modal-footer-v4">
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium text-blue-700">
                  {selectedStudentIds.size} dari {sourceStudents.length} siswa dipilih untuk diluluskan.
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
                    onClick={handleBatchGraduateSubmit}
                    disabled={selectedStudentIds.size === 0}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-600 hover:bg-yellow-700"
                  >
                    Proses Kelulusan Sekarang
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
