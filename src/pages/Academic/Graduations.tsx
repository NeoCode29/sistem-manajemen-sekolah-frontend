import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { GraduationCap, X, AlertTriangle, Undo2, Award, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { useGraduations } from '../../hooks/useGraduations';
import { useDialog } from '../../contexts/DialogContext';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../utils/errorHandler';

export const Graduations: React.FC = () => {
  const {
    graduationsHistory,
    loading,
    error: fetchError,
    classes,
    academicYears,
    sourceStudents,
    selectedAcademicYear,
    setSelectedAcademicYear,
    loadStudents,
    batchGraduate,
    cancelGraduation
  } = useGraduations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  
  // Batch Graduate Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const { showConfirm, showAlert } = useDialog();
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const error = actionError || fetchError;



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
      showAlert('Kelas dan tanggal kelulusan harus diisi', 'Peringatan');
      return;
    }
    if (selectedStudentIds.size === 0) {
      showAlert('Pilih minimal satu siswa untuk diluluskan', 'Peringatan');
      return;
    }

    setActionError('');
    const payload = {
      classroomId: selectedClass,
      academicYearId: selectedAcademicYear,
      graduationDate: new Date(graduationDate).toISOString(),
      certificateNumber: documentNumber,
      notes: undefined,
      studentIds: Array.from(selectedStudentIds)
    };

    try {
      await batchGraduate(payload);
      setIsModalOpen(false);
      showAlert('Proses kelulusan berhasil. Siswa kini menjadi Alumni.', 'Berhasil');
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Gagal memproses kelulusan siswa.'), 'Gagal');
    }
  };

  const handleCancelGraduation = async (id: string) => {
    showConfirm('Apakah Anda yakin ingin membatalkan status kelulusan ini? Status siswa akan dikembalikan menjadi siswa aktif.', async () => {
      setActionError('');
      try {
        await cancelGraduation(id);
      } catch (err: any) {
        const msg = getErrorMessage(err, 'Gagal membatalkan status kelulusan siswa.');
        setActionError(msg);
        showAlert(msg, 'Gagal');
      }
    });
  };

  const columns: Column<any>[] = [
    { key: 'student', header: 'Siswa (Alumni)', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <GraduationCap size={16} />
        </div>
        <div>
          <div className="font-medium text-gray-900">{row.student?.fullName || 'Siswa tidak ditemukan'}</div>
          <div className="text-xs text-gray-500">{row.student?.nis || row.student?.nisn}</div>
        </div>
      </div>
    )},
    { key: 'class', header: 'Kelas Terakhir', render: (row) => row.classroom?.name || '-' },
    { key: 'date', header: 'Tanggal Lulus', render: (row) => new Date(row.graduationDate).toLocaleDateString('id-ID') },
    { key: 'document', header: 'No. SK / Ijazah', render: (row) => (
      row.certificateNumber ? (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{row.certificateNumber}</span>
      ) : (
        <span className="text-xs text-gray-400 italic">Belum diinput</span>
      )
    )},
    { key: 'actions', header: 'Aksi', render: (row) => (
      <button
        onClick={() => handleCancelGraduation(row.id)}
        className="action-btn"
        style={{ color: '#ea580c' }}
        title="Batalkan Kelulusan"
      >
        <Undo2 size={16} /> Batal Lulus
      </button>
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kelulusan & Alumni</h1>
          <p className="text-gray-500 mt-1">Daftar alumni dan proses pelepasan siswa (Lulus)</p>
        </div>
        <div className="header-actions">
          <button className="btn-std-primary" onClick={() => setIsModalOpen(true)}>
            <Award size={18} />
            <span>Proses Kelulusan Baru</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6">
        <DataTable 
          columns={columns} 
          data={graduationsHistory} 
          loading={loading}
          emptyMessage="Belum ada data kelulusan / alumni."
        />
      </div>

      {/* Batch Processing Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-gray-900">
            <Award size={20} className="text-blue-600" />
            Proses Kelulusan Siswa (Batch)
          </div>
        }
        size="lg"
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center rounded-b-2xl border-t border-gray-100 w-full">
            <span className="text-sm font-medium text-blue-700">
              {selectedStudentIds.size} dari {sourceStudents.length} siswa dipilih untuk diluluskan.
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-std-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchGraduateSubmit}
                disabled={selectedStudentIds.size === 0}
                className="btn-std-primary disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-600 hover:bg-yellow-700 text-white border-transparent hover:border-transparent"
              >
                Proses Kelulusan
              </button>
            </div>
          </div>
        }
      >
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex gap-3 text-yellow-800 text-sm">
            <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
            <p>
              Siswa yang diluluskan akan diubah statusnya menjadi <strong>Alumni</strong> (tidak lagi aktif). Pastikan Anda telah menyelesaikan semua administrasi nilai sebelum melakukan proses ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <FormField label="Tahun Ajaran" required>
              <select
                className="input-std w-full"
                value={selectedAcademicYear}
                onChange={(e) => {
                  setSelectedAcademicYear(e.target.value);
                  if (selectedClass) {
                    loadStudents(selectedClass, e.target.value).then(students => {
                      setSelectedStudentIds(new Set(students.map((s: any) => s.id.toString())));
                    });
                  }
                }}
              >
                <option value="">-- Pilih --</option>
                {academicYears.map((ay: any) => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </FormField>
            
            <FormField label="Pilih Kelas (Akhir)" required>
              <select
                className="input-std w-full"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  if (!e.target.value) {
                    setSelectedStudentIds(new Set());
                    return;
                  }
                  loadStudents(e.target.value, selectedAcademicYear).then(students => {
                    setSelectedStudentIds(new Set(students.map((s: any) => s.id.toString())));
                  }).catch(err => setActionError(getErrorMessage(err, 'Gagal memuat daftar siswa')));
                }}
              >
                <option value="">-- Pilih --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Tanggal Kelulusan" required>
              <input
                type="date"
                className="input-std w-full"
                value={graduationDate}
                onChange={(e) => setGraduationDate(e.target.value)}
                required
              />
            </FormField>

            <FormField label="No. SK Kelulusan (Opsional)">
              <input
                type="text"
                className="input-std w-full"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Misal: 421/SK-LULUS/2024"
              />
            </FormField>
          </div>

          {sourceStudents.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
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
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          checked={selectedStudentIds.has(student.id.toString())}
                          onChange={() => handleStudentToggle(student.id.toString())}
                          onClick={(e) => e.stopPropagation()}
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
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Tidak ada siswa di kelas ini.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
