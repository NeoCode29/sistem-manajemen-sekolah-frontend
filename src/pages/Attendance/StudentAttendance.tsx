import React, { useEffect, useState } from 'react';
import { getAcademicYears, getSemesters, getGrades, getClassrooms, type AcademicYear, type Semester, type Grade, type Classroom } from '../../api/academicService';
import { getStudents } from '../../api/studentService';
import { getStudentAttendances, upsertStudentAttendanceBatch, type StudentAttendance, type StudentAttendanceBatchItem } from '../../api/attendanceService';
import { Save, Calendar } from 'lucide-react';

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
          status: att ? att.status : 'Hadir',
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
      
      const attendances: StudentAttendanceBatchItem[] = rows.map(r => {
        return {
          studentId: r.studentId,
          status: r.status,
          notes: r.notes || undefined
        };
      });
      
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

      {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      {success && <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">{success}</div>}

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-blue-600 border-b pb-2">
          <Calendar size={20} />
          <h2 className="text-lg font-semibold">Filter Absensi</h2>
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
            <label className="text-sm font-medium text-gray-700">Tanggal</label>
            <input type="date" className="input-std mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Kehadiran</h2>
          <button 
            className="btn-std-primary flex items-center gap-2"
            onClick={handleSave}
            disabled={saving || rows.length === 0}
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
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
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th className="w-40">Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.studentId}>
                    <td className="text-center text-gray-500">{index + 1}</td>
                    <td className="font-mono text-sm text-gray-600">{row.nis}</td>
                    <td className="font-semibold">{row.studentName}</td>
                    <td>
                      <select 
                        className={`w-full p-2 border rounded-md text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                          row.status === 'Hadir' ? 'bg-green-50 text-green-700 border-green-200' :
                          row.status === 'Terlambat' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          row.status === 'Izin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          row.status === 'Sakit' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                        value={row.status}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Alpa">Alpa</option>
                        <option value="Terlambat">Terlambat</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="input-std py-1.5 px-2"
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder="Keterangan..."
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
