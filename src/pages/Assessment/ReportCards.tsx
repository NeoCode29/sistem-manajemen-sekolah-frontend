import React, { useState, useEffect } from 'react';
import { useReportCards, type ReportCard } from '../../hooks/useReportCards';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import { useSemesters } from '../../hooks/useSemesters';
import { useClassrooms } from '../../hooks/useClassrooms';
import { FileText, Edit, Printer, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// If standard Modal is missing, I'll use inline div approach as in plan. Let's stick to inline div for safety based on the plan.

export const ReportCards: React.FC = () => {
  const { user } = useAuth();
  const { years: academicYears, refresh: fetchAcademicYears } = useAcademicYears();
  const { semesters, refresh: fetchSemesters } = useSemesters();
  const { classrooms, refresh: fetchClassrooms } = useClassrooms();
  const { reportCards, loading, error, fetchReportCards, generateReportCards, updateHomeroomNotes, exportPdf } = useReportCards();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ReportCard | null>(null);
  const [formData, setFormData] = useState({ sickDays: 0, excusedDays: 0, unexcusedDays: 0, homeroomNotes: '' });

  useEffect(() => {
    fetchAcademicYears();
    fetchSemesters();
    fetchClassrooms();
  }, [fetchAcademicYears, fetchSemesters, fetchClassrooms]);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const active = academicYears.find(y => y.isActive) || academicYears[0];
      setSelectedYear(active.id);
    }
  }, [academicYears, selectedYear]);

  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      const active = semesters.find(s => s.isActive) || semesters[0];
      setSelectedSemester(active.id);
    }
  }, [semesters, selectedSemester]);
  
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
       setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  useEffect(() => {
    if (selectedYear && selectedSemester && selectedClassroom) {
      fetchReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
    }
  }, [selectedYear, selectedSemester, selectedClassroom, fetchReportCards]);

  const handleGenerate = async () => {
    if (!selectedYear || !selectedSemester || !selectedClassroom) return;
    if (window.confirm('Generate rapor untuk seluruh siswa di kelas ini? Nilai yang belum divalidasi mungkin tidak akan masuk.')) {
      try {
        await generateReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
        alert('Rapor berhasil di-generate!');
      } catch (e: any) {
        alert(e.message || 'Gagal generate rapor');
      }
    }
  };

  const openEditModal = (card: ReportCard) => {
    setEditingCard(card);
    setFormData({
      sickDays: card.sickDays,
      excusedDays: card.excusedDays,
      unexcusedDays: card.unexcusedDays,
      homeroomNotes: card.homeroomNotes || ''
    });
    setIsModalOpen(true);
  };

  const saveNotes = async () => {
    if (editingCard) {
      try {
        await updateHomeroomNotes(editingCard.id, formData);
        setIsModalOpen(false);
      } catch (e) {
        alert('Gagal menyimpan catatan');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cetak Rapor</h1>
          <p className="text-gray-600">Kelola dan cetak rapor siswa per kelas</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedClassroom}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate Rapor Kelas
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select 
            value={selectedSemester} 
            onChange={e => setSelectedSemester(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
          <select 
            value={selectedClassroom} 
            onChange={e => setSelectedClassroom(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
             <option value="">Pilih Kelas</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading && reportCards.length === 0 ? (
          <div className="p-8 flex justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absensi (S/I/A)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportCards.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Belum ada rapor di kelas ini. Silakan tekan tombol "Generate Rapor Kelas".
                  </td>
                </tr>
              ) : (
                reportCards.map((card) => (
                  <tr key={card.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.student.nis}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{card.student.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {card.sickDays} / {card.excusedDays} / {card.unexcusedDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => openEditModal(card)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        title="Isi Catatan"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => exportPdf(card.id, card.student.fullName)}
                        className="text-green-600 hover:text-green-900"
                        title="Cetak PDF"
                      >
                        <Printer className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Edit Catatan Rapor</h2>
            <div className="mb-4 text-sm text-gray-600">
              Siswa: <strong>{editingCard?.student?.fullName}</strong>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sakit (Hari)</label>
                <input type="number" value={formData.sickDays} onChange={e => setFormData({...formData, sickDays: parseInt(e.target.value)||0})} className="w-full border border-gray-300 p-2 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Izin (Hari)</label>
                <input type="number" value={formData.excusedDays} onChange={e => setFormData({...formData, excusedDays: parseInt(e.target.value)||0})} className="w-full border border-gray-300 p-2 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Alpa (Hari)</label>
                <input type="number" value={formData.unexcusedDays} onChange={e => setFormData({...formData, unexcusedDays: parseInt(e.target.value)||0})} className="w-full border border-gray-300 p-2 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Wali Kelas</label>
              <textarea 
                value={formData.homeroomNotes} 
                onChange={e => setFormData({...formData, homeroomNotes: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded h-24 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Tuliskan pesan / motivasi untuk siswa..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium">Batal</button>
              <button onClick={saveNotes} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
