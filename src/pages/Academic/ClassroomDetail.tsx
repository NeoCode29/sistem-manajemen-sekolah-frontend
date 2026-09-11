import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassroomById, getAcademicYears, getSemesters, assignHomeroomTeacher, getHomeroomTeacher, type Classroom, type AcademicYear, type Semester } from '../../api/academicService';
import { getEmployees, type Employee } from '../../api/employeeService';
import { getStudents, type Student } from '../../api/studentService';
import { ArrowLeft, Info, Users, CheckCircle, GraduationCap } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader, FormField } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';

export const ClassroomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const { user } = useAuth();
  
  const canManageMaster = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin');
  
  // Master Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form State
  const [selectedAy, setSelectedAy] = useState('');
  const [selectedSm, setSelectedSm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [saving, setSaving] = useState(false);

  // Student State
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const { showAlert } = useDialog();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [cr, ay, sm, emp] = await Promise.all([
          getClassroomById(id),
          getAcademicYears(),
          getSemesters(),
          getEmployees()
        ]);
        setClassroom(cr);
        setAcademicYears(ay);
        setSemesters(sm);
        setEmployees(emp);

        // Set default active academic year & semester
        const activeAy = ay.find((a: AcademicYear) => a.isActive);
        const activeSm = sm.find((s: Semester) => s.isActive);
        if (activeAy) setSelectedAy(activeAy.id);
        if (activeSm) setSelectedSm(activeSm.id);
      } catch (err) {
        console.error(err);
        showAlert('Gagal memuat data kelas', 'Gagal');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, showAlert]);

  useEffect(() => {
    const fetchTeacher = async () => {
      if (id && selectedAy && selectedSm) {
        try {
          const ht = await getHomeroomTeacher(id, selectedAy, selectedSm);
          if (ht) {
            setSelectedEmployee(ht.employeeId.toString());
          } else {
            setSelectedEmployee('');
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchTeacher();
  }, [id, selectedAy, selectedSm]);

  const handleAssignHomeroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedEmployee || !selectedAy || !selectedSm) {
      showAlert('Mohon lengkapi data Guru, Tahun Ajaran, dan Semester', 'Peringatan');
      return;
    }
    try {
      setSaving(true);
      await assignHomeroomTeacher(id, {
        employeeId: parseInt(selectedEmployee, 10),
        academicYearId: parseInt(selectedAy, 10),
        semesterId: parseInt(selectedSm, 10)
      });
      showAlert('Wali kelas berhasil ditugaskan!', 'Sukses');
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Gagal menugaskan wali kelas. Pastikan guru belum ditugaskan sebagai wali kelas di kelas lain pada periode yang sama.');
      showAlert(msg, 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'siswa' && id && selectedAy && selectedSm) {
      fetchStudents();
    }
  }, [activeTab, id, selectedAy, selectedSm]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await getStudents({
        classroomId: id,
        academicYearId: selectedAy,
        semesterId: selectedSm,
        limit: 1000
      });
      setStudents(data);
    } catch (err: any) {
      console.error(err);
      showAlert(getErrorMessage(err, 'Gagal memuat daftar siswa'), 'Gagal');
    } finally {
      setLoadingStudents(false);
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto page-enter">Memuat data...</div>;
  if (!classroom) return <div className="p-6 max-w-7xl mx-auto page-enter">Kelas tidak ditemukan</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="mb-6">
        <button onClick={() => navigate(canManageMaster ? '/academic/classrooms' : '/homeroom/dashboard')} className="btn-std-secondary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> {canManageMaster ? 'Kembali ke Daftar Rombel' : 'Kembali ke Dashboard'}
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5">
          <GraduationCap size={160} />
        </div>
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-200">
          {classroom.code.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{classroom.name}</h2>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-sm">{classroom.code}</span>
            &bull; Tingkat: {classroom.grade?.name || '-'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-px">
        <button className={`px-4 py-2.5 rounded-t-xl font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'info' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={() => setActiveTab('info')}>
          <Info size={18} /> Info & Wali Kelas
        </button>
        <button className={`px-4 py-2.5 rounded-t-xl font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'siswa' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`} onClick={() => setActiveTab('siswa')}>
          <Users size={18} /> Daftar Siswa
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {canManageMaster ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Penugasan Wali Kelas</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tetapkan Guru sebagai Wali Kelas untuk kelas ini pada tahun ajaran tertentu.
                </p>
                <form onSubmit={handleAssignHomeroom} className="flex flex-col gap-4">
                  <FormField label="Tahun Ajaran" required>
                    <select className="input-std" value={selectedAy} onChange={(e) => setSelectedAy(e.target.value)} required>
                      <option value="">-- Pilih Tahun Ajaran --</option>
                      {academicYears.map(ay => (
                        <option key={ay.id} value={ay.id}>{ay.name} {ay.isActive ? '(Aktif)' : ''}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Semester" required>
                    <select className="input-std" value={selectedSm} onChange={(e) => setSelectedSm(e.target.value)} required>
                      <option value="">-- Pilih Semester --</option>
                      {semesters.map(sm => (
                        <option key={sm.id} value={sm.id}>{sm.name} {sm.isActive ? '(Aktif)' : ''}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Guru / Wali Kelas" required>
                    <select className="input-std" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} required>
                      <option value="">-- Pilih Guru --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                      ))}
                    </select>
                  </FormField>
                  <div className="mt-2">
                    <button type="submit" className="btn-std-primary w-full justify-center" disabled={saving}>
                      <CheckCircle size={18} />
                      {saving ? 'Menyimpan...' : 'Simpan Penugasan'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Wali Kelas Saat Ini</h3>
              <p className="text-sm text-gray-500 mb-6">
                Berikut adalah wali kelas untuk kelas ini pada tahun ajaran dan semester terpilih.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50"><div className="text-gray-500 text-sm">Tahun Ajaran</div><div className="font-medium text-gray-900">{academicYears.find(ay => ay.id === selectedAy)?.name || '-'}</div></div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50"><div className="text-gray-500 text-sm">Semester</div><div className="font-medium text-gray-900">{semesters.find(sm => sm.id === selectedSm)?.name || '-'}</div></div>
                <div className="flex justify-between items-center py-2"><div className="text-gray-500 text-sm">Guru / Wali Kelas</div><div className="font-bold text-indigo-600">{employees.find(e => e.id.toString() === selectedEmployee)?.fullName || 'Belum Ditugaskan'}</div></div>
              </div>
            </div>
            )}
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Detail Kelas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50"><div className="text-gray-500 text-sm">Kode Kelas</div><div className="font-medium text-gray-900">{classroom.code}</div></div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50"><div className="text-gray-500 text-sm">Nama Rombel</div><div className="font-medium text-gray-900">{classroom.name}</div></div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50"><div className="text-gray-500 text-sm">Tingkat</div><div className="font-medium text-gray-900">{classroom.grade?.name || '-'}</div></div>
                <div className="flex justify-between items-center py-2"><div className="text-gray-500 text-sm">Kapasitas Maksimal</div><div className="font-medium text-gray-900">{classroom.capacity || '-'} Siswa</div></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'siswa' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Daftar Siswa Kelas Ini</h3>
            {loadingStudents ? (
              <div className="text-center py-12 text-gray-500">Memuat daftar siswa...</div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Data Siswa Kosong</h3>
                <p className="text-gray-500 text-sm max-w-sm">Belum ada siswa yang ditempatkan di kelas ini pada Tahun Ajaran & Semester yang dipilih.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-600">No</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">NIS</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">NISN</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Nama Lengkap</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Jenis Kelamin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900">{student.nis}</td>
                        <td className="px-6 py-3 text-gray-600">{student.nisn || '-'}</td>
                        <td className="px-6 py-3 text-gray-900">{student.fullName}</td>
                        <td className="px-6 py-3 text-gray-600">{student.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
