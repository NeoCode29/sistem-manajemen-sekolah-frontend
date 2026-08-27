import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassroomById, getAcademicYears, getSemesters, assignHomeroomTeacher, getHomeroomTeacher, type Classroom, type AcademicYear, type Semester } from '../../api/academicService';
import { getEmployees, type Employee } from '../../api/employeeService';
import { getStudents, type Student } from '../../api/studentService';
import { ArrowLeft, Info, Users, CheckCircle } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { useAuth } from '../../context/AuthContext';
import './Academic.css';

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
      const msg = err.response?.data?.message || 'Gagal menugaskan wali kelas';
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
        enrollmentStatus: 'ENROLLED'
      });
      setStudents(data);
    } catch (err) {
      console.error(err);
      showAlert('Gagal memuat daftar siswa', 'Gagal');
    } finally {
      setLoadingStudents(false);
    }
  };

  if (loading) return <div className="academic-container">Memuat data...</div>;
  if (!classroom) return <div className="academic-container">Kelas tidak ditemukan</div>;

  return (
    <div className="academic-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(canManageMaster ? '/academic/classrooms' : '/homeroom/dashboard')} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> {canManageMaster ? 'Kembali ke Daftar Rombel' : 'Kembali ke Dashboard'}
        </button>
      </div>

      {/* Header Card */}
      <div className="student-detail-header" style={{ position: 'relative' }}>
        <div className="student-detail-avatar" style={{ background: '#3b82f6' }}>
          {classroom.code.charAt(0).toUpperCase()}
        </div>
        <div className="student-detail-info">
          <h2>{classroom.name}</h2>
          <p>Kode: {classroom.code} &bull; Tingkat: {classroom.grade?.name || '-'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="student-detail-tabs">
        <button className={`student-detail-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          <Info size={18} /> Info & Wali Kelas
        </button>
        <button className={`student-detail-tab ${activeTab === 'siswa' ? 'active' : ''}`} onClick={() => setActiveTab('siswa')}>
          <Users size={18} /> Daftar Siswa
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'info' && (
          <div className="student-detail-grid">
            {canManageMaster ? (
              <div className="student-detail-card">
                <h3>Penugasan Wali Kelas</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Tetapkan Guru sebagai Wali Kelas untuk kelas ini pada tahun ajaran tertentu.
                </p>
                <form onSubmit={handleAssignHomeroom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Tahun Ajaran <span className="text-red-500">*</span></label>
                  <select className="input-field" value={selectedAy} onChange={(e) => setSelectedAy(e.target.value)} required>
                    <option value="">-- Pilih Tahun Ajaran --</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.name} {ay.isActive ? '(Aktif)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester <span className="text-red-500">*</span></label>
                  <select className="input-field" value={selectedSm} onChange={(e) => setSelectedSm(e.target.value)} required>
                    <option value="">-- Pilih Semester --</option>
                    {semesters.map(sm => (
                      <option key={sm.id} value={sm.id}>{sm.name} {sm.isActive ? '(Aktif)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Guru / Wali Kelas <span className="text-red-500">*</span></label>
                  <select className="input-field" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} required>
                    <option value="">-- Pilih Guru --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <CheckCircle size={18} style={{ display: 'inline', marginRight: '4px' }} />
                    {saving ? 'Menyimpan...' : 'Simpan Penugasan'}
                  </button>
                </div>
              </form>
            </div>
            ) : (
            <div className="student-detail-card">
              <h3>Wali Kelas Saat Ini</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                Berikut adalah wali kelas untuk kelas ini pada tahun ajaran dan semester terpilih.
              </p>
              <div className="student-detail-row"><div className="student-detail-label">Tahun Ajaran</div><div className="student-detail-value">{academicYears.find(ay => ay.id === selectedAy)?.name || '-'}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Semester</div><div className="student-detail-value">{semesters.find(sm => sm.id === selectedSm)?.name || '-'}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Guru / Wali Kelas</div><div className="student-detail-value font-semibold" style={{ color: '#2563eb' }}>{employees.find(e => e.id.toString() === selectedEmployee)?.fullName || 'Belum Ditugaskan'}</div></div>
            </div>
            )}
            <div className="student-detail-card">
              <h3>Detail Kelas</h3>
              <div className="student-detail-row"><div className="student-detail-label">Kode Kelas</div><div className="student-detail-value">{classroom.code}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Nama Rombel</div><div className="student-detail-value">{classroom.name}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Tingkat</div><div className="student-detail-value">{classroom.grade?.name || '-'}</div></div>
              <div className="student-detail-row"><div className="student-detail-label">Kapasitas Maksimal</div><div className="student-detail-value">{classroom.capacity || '-'} Siswa</div></div>
            </div>
          </div>
        )}

        {activeTab === 'siswa' && (
          <div className="student-detail-card">
            <h3 style={{ marginBottom: '1rem' }}>Daftar Siswa Kelas Ini</h3>
            {loadingStudents ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Memuat daftar siswa...</div>
            ) : students.length === 0 ? (
              <div className="student-detail-empty">
                <Users size={64} />
                <h3>Data Siswa Kosong</h3>
                <p>Belum ada siswa yang ditempatkan di kelas ini pada Tahun Ajaran & Semester yang dipilih.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>NIS</th>
                      <th>NISN</th>
                      <th>Nama Lengkap</th>
                      <th>Jenis Kelamin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td className="font-semibold">{student.nis}</td>
                        <td>{student.nisn || '-'}</td>
                        <td>{student.fullName}</td>
                        <td>{student.gender}</td>
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
