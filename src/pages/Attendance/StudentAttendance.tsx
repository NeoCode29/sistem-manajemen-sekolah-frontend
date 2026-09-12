import React, { useEffect, useState } from 'react';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, type AcademicYear, type Semester, type Grade, type Classroom } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import { getStudentAttendances, upsertStudentAttendanceBatch, type StudentAttendance, type StudentAttendanceBatchItem } from '../../api/attendanceService';
import { Save, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface AttendanceRow {
  studentId: string;
  studentName: string;
  nis: string;
  status: string;
  notes: string;
}

export const StudentAttendancePage: React.FC = () => {
  // Filters
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedGradeId) {
      fetchClassrooms(selectedGradeId);
    } else {
      setClassrooms([]);
      setSelectedClassroomId('');
    }
  }, [selectedGradeId]);

  useEffect(() => {
    if (selectedAcademicYearId && selectedSemesterId && selectedClassroomId && date) {
      fetchAttendanceData();
    } else {
      setRows([]);
    }
  }, [selectedAcademicYearId, selectedSemesterId, selectedClassroomId, date]);

  const fetchFilters = async () => {
    try {
      const [ayRes, semRes, grRes] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getGrades()
      ]);
      setAcademicYears(ayRes);
      setSemesters(semRes);
      setGrades(grRes);
      
      const activeAy = ayRes.find(a => a.isActive);
      const activeSem = semRes.find(s => s.isActive);
      
      if (activeAy) setSelectedAcademicYearId(activeAy.id);
      if (activeSem) setSelectedSemesterId(activeSem.id);
    } catch (err: any) {
      setError('Gagal memuat filter');
    }
  };

  const fetchClassrooms = async (gradeId: string) => {
    try {
      const data = await getClassrooms(gradeId);
      setClassrooms(data);
      if (data.length > 0) setSelectedClassroomId(data[0].id);
      else setSelectedClassroomId('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [studentsData, attendancesData] = await Promise.all([
        getStudents({ 
          classroomId: selectedClassroomId, 
          academicYearId: selectedAcademicYearId,
          semesterId: selectedSemesterId,
          status: 'ACTIVE',
          limit: 1000
        }),
        getStudentAttendances({
          classroomId: selectedClassroomId,
          academicYearId: selectedAcademicYearId,
          semesterId: selectedSemesterId,
          date
        })
      ]);
      
      const attendanceMap = new Map<string, StudentAttendance>();
      attendancesData.forEach((att: StudentAttendance) => {
        attendanceMap.set(att.studentId, att);
      });
      
      const newRows = studentsData.map(student => {
        const att = attendanceMap.get(student.id);
        return {
          studentId: student.id,
          studentName: student.fullName,
          nis: student.nis,
          status: att ? att.status : 'Belum Absen',
          notes: att?.notes || ''
        };
      });
      
      setRows(newRows);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Akses ditolak: Anda hanya bisa melihat/mengabsen kelas perwalian Anda sendiri.');
      } else {
        setError('Gagal memuat data absensi');
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof AttendanceRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    
    setRows(updatedRows);
  };

  const handleSave = async () => {
    if (!selectedAcademicYearId || !selectedSemesterId || !selectedClassroomId || !date) {
      setError('Harap lengkapi semua filter sebelum menyimpan.');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const attendances: StudentAttendanceBatchItem[] = rows
        .filter(r => r.status !== 'Belum Absen')
        .map(r => {
          return {
            studentId: r.studentId,
            status: r.status,
            notes: r.notes || undefined
          };
        });
      
      if (attendances.length === 0) {
        setError('Tidak ada perubahan absensi untuk disimpan. Silakan pilih status kehadiran siswa terlebih dahulu.');
        setSaving(false);
        return;
      }
      
      await upsertStudentAttendanceBatch(selectedClassroomId, selectedAcademicYearId, selectedSemesterId, date, attendances);
      setSuccess('Data absensi berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh to get potentially auto-updated statuses (like Terlambat)
      await fetchAttendanceData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Absensi Siswa</h1>
          <p className="text-gray-500 mt-1">Kelola kehadiran harian siswa per kelas</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-xl border border-white shadow-lg shadow-slate-200/40 rounded-3xl p-6 md:p-8 mb-8 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-3 mb-6 text-indigo-600 border-b border-indigo-100/50 pb-4">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/50">
            <Calendar size={22} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600">
            Filter Data Absensi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700">Tahun Ajaran</label>
            <select className="input-std mt-1 pr-10 truncate" value={selectedAcademicYearId} onChange={(e) => setSelectedAcademicYearId(e.target.value)}>
              <option value="">Pilih Tahun Ajaran</option>
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700">Semester</label>
            <select className="input-std mt-1 pr-10 truncate" value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)}>
              <option value="">Pilih Semester</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700">Tingkat</label>
            <select className="input-std mt-1 pr-8" value={selectedGradeId} onChange={(e) => setSelectedGradeId(e.target.value)}>
              <option value="">Pilih Tingkat</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700">Kelas / Rombel</label>
            <select className="input-std mt-1 pr-8" value={selectedClassroomId} onChange={(e) => setSelectedClassroomId(e.target.value)} disabled={!selectedGradeId}>
              <option value="">Pilih Kelas</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tanggal</label>
            <input type="date" className="input-std w-full shadow-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-slate-200/30 mb-8 overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">Daftar Kehadiran Siswa</h2>
          </div>
          <button 
            className="btn-std-primary flex items-center gap-2 px-6 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleSave}
            disabled={saving || rows.length === 0}
          >
            <Save size={18} className={saving ? 'animate-pulse' : ''} />
            <span className="font-semibold">{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data absensi...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {selectedClassroomId ? 'Tidak ada data siswa di kelas ini.' : 'Pilih kelas dan filter lainnya untuk menampilkan data.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="w-12 text-center py-4">No</th>
                  <th className="py-4 px-2">NIS</th>
                  <th className="py-4 px-2">Nama Siswa</th>
                  <th className="w-48 py-4 px-2">Status</th>
                  <th className="py-4 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, index) => (
                  <tr key={row.studentId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="text-center text-gray-500 py-3">{index + 1}</td>
                    <td className="font-mono text-sm text-gray-500 py-3 px-2">{row.nis}</td>
                    <td className="font-bold text-gray-800 py-3 px-2">{row.studentName}</td>
                    <td className="py-3 px-2">
                      <select 
                        className={`w-full p-2.5 rounded-xl font-medium outline-none transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent cursor-pointer ${
                          row.status === 'Belum Absen' ? 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400/50' :
                          row.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400/50' :
                          row.status === 'Terlambat' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400/50' :
                          row.status === 'Izin' ? 'bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-400/50' :
                          row.status === 'Sakit' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-400/50' :
                          'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400/50'
                        }`}
                        value={row.status}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      >
                        <option value="Belum Absen">Belum Absen</option>
                        <option value="Hadir">Hadir</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Alpa">Alpa</option>
                        <option value="Terlambat">Terlambat</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input 
                        type="text" 
                        className="input-std py-2 px-3 shadow-sm w-full bg-white/50 focus:bg-white transition-colors"
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder="Tambahkan keterangan opsional..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
