import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getClassroomById, 
  getAcademicYears, 
  getSemesters, 
  assignHomeroomTeacher, 
  getHomeroomTeacher, 
  type Classroom, 
  type AcademicYear, 
  type Semester 
} from '../../api/academicService';
import { getEmployees, type Employee } from '../../api/employeeService';
import { getStudents, type Student } from '../../api/studentService';
import { ArrowLeft, Info, Users, CheckCircle, GraduationCap, Loader2 } from 'lucide-react';
import { PageHeader, FormField, Select, EmptyState, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const ClassroomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'siswa'>('info');
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  const canManageHomeroom = hasPermission('classrooms.manage_homeroom') || hasPermission('classrooms.manage');
  const canManageStudents = hasPermission('classrooms.manage_students') || hasPermission('classrooms.manage');
  const canManageMaster = hasPermission('classrooms.read') || hasPermission('academic.read') || hasPermission('classrooms.manage');
  
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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
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
        notify.error(err, 'Gagal memuat detail kelas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      notify.warning('Mohon lengkapi data Guru, Tahun Ajaran, dan Semester terlebih dahulu.');
      return;
    }
    try {
      setSaving(true);
      await assignHomeroomTeacher(id, {
        employeeId: parseInt(selectedEmployee, 10),
        academicYearId: parseInt(selectedAy, 10),
        semesterId: parseInt(selectedSm, 10)
      });
      notify.success('Wali kelas berhasil ditugaskan untuk kelas ini!');
    } catch (err: any) {
      notify.error(err, 'Gagal menugaskan wali kelas');
    } finally {
      setSaving(false);
    }
  };

  const fetchStudents = async () => {
    if (!id || !selectedAy || !selectedSm) return;
    try {
      setLoadingStudents(true);
      const data = await getStudents({
        classroomId: id,
        academicYearId: selectedAy,
        semesterId: selectedSm,
        limit: 1000
      });
      setStudents(data);
    } catch (err) {
      console.error(err);
      notify.error(err, 'Gagal memuat daftar siswa di kelas ini');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'siswa' && id && selectedAy && selectedSm) {
      fetchStudents();
    }
  }, [activeTab, id, selectedAy, selectedSm]);

  const studentColumns: Column<Student>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_: Student, index?: number) => <span className="text-gray-400 text-xs">{(index ?? 0) + 1}</span>
    },
    {
      key: 'nis',
      header: 'NIS',
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          {s.nis}
        </span>
      )
    },
    {
      key: 'nisn',
      header: 'NISN',
      render: (s) => <span className="text-xs font-mono text-gray-600">{s.nisn || '-'}</span>
    },
    {
      key: 'fullName',
      header: 'Nama Lengkap',
      render: (s) => <span className="font-semibold text-gray-900 text-sm">{s.fullName}</span>
    },
    {
      key: 'gender',
      header: 'L/P',
      render: (s) => (
        <Badge variant={s.gender === 'Perempuan' ? 'purple' : 'info'}>
          {s.gender || '-'}
        </Badge>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-3 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          Memuat data rombel...
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState 
          message="Kelas Tidak Ditemukan"
          description="Data rombongan belajar tidak ditemukan atau telah dihapus."
          action={
            <button
              type="button"
              onClick={() => navigate('/academic/classrooms')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Rombel
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Tombol Navigasi Kembali */}
      <div>
        <button 
          type="button"
          onClick={() => navigate(canManageMaster ? '/academic/classrooms' : '/homeroom/dashboard')} 
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
        >
          <ArrowLeft size={14} /> {canManageMaster ? 'Kembali ke Daftar Rombel' : 'Kembali ke Dashboard'}
        </button>
      </div>

      {/* Header Card Rombel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5 pointer-events-none">
          <GraduationCap size={160} />
        </div>
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-200 shrink-0">
          {classroom.code.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{classroom.name}</h1>
            <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md border border-gray-200">
              {classroom.code}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1.5 flex flex-wrap items-center gap-2">
            <span>Tingkat: <strong>{classroom.grade?.name || '-'}</strong></span>
            <span>&bull;</span>
            <span>Jurusan: <strong>{classroom.major?.name || 'Umum'}</strong></span>
            <span>&bull;</span>
            <span>Kapasitas: <strong>{classroom.capacity || 0} Siswa</strong></span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b border-gray-200">
        <button 
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'info' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <Info size={16} /> Info & Wali Kelas
          {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button 
          type="button"
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'siswa' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('siswa')}
        >
          <Users size={16} /> Daftar Siswa ({students.length})
          {activeTab === 'siswa' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Form Penetapan Wali Kelas */}
            {canManageHomeroom ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Penugasan Wali Kelas</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tetapkan guru sebagai wali kelas untuk kelas ini pada periode akademik aktif.
                  </p>
                </div>
                
                <form onSubmit={handleAssignHomeroom} className="flex flex-col gap-4 pt-2">
                  <FormField label="Tahun Ajaran" required>
                    <Select
                      wrapperClassName="w-full"
                      value={selectedAy}
                      onChange={(e) => setSelectedAy(e.target.value)}
                      options={[
                        { value: '', label: '-- Pilih Tahun Ajaran --' },
                        ...academicYears.map(ay => ({
                          value: ay.id,
                          label: `${ay.name} ${ay.isActive ? '(Aktif)' : ''}`
                        }))
                      ]}
                      required
                    />
                  </FormField>

                  <FormField label="Semester" required>
                    <Select
                      wrapperClassName="w-full"
                      value={selectedSm}
                      onChange={(e) => setSelectedSm(e.target.value)}
                      options={[
                        { value: '', label: '-- Pilih Semester --' },
                        ...semesters.map(sm => ({
                          value: sm.id,
                          label: `${sm.name} ${sm.isActive ? '(Aktif)' : ''}`
                        }))
                      ]}
                      required
                    />
                  </FormField>

                  <FormField label="Guru / Wali Kelas" required>
                    <Select
                      wrapperClassName="w-full"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      options={[
                        { value: '', label: '-- Pilih Guru / Wali Kelas --' },
                        ...employees.map(emp => ({
                          value: String(emp.id),
                          label: `${emp.fullName} (${emp.employeeNumber})`
                        }))
                      ]}
                      required
                    />
                  </FormField>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50" 
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Simpan Penugasan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Wali Kelas Saat Ini</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Informasi wali kelas untuk periode akademik yang sedang aktif.
                  </p>
                </div>
                <div className="space-y-3 pt-2 text-sm">
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                    <span className="text-gray-500 text-xs">Tahun Ajaran</span>
                    <span className="font-semibold text-gray-900">{academicYears.find(ay => ay.id === selectedAy)?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                    <span className="text-gray-500 text-xs">Semester</span>
                    <span className="font-semibold text-gray-900">{semesters.find(sm => sm.id === selectedSm)?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-gray-500 text-xs">Wali Kelas</span>
                    <span className="font-bold text-indigo-600">{employees.find(e => String(e.id) === selectedEmployee)?.fullName || 'Belum Ditugaskan'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Detail Spesifikasi Kelas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Spesifikasi Ruang & Rombel</h3>
                <p className="text-xs text-gray-500 mt-0.5">Data teknis dan kapasitas ruang kelas.</p>
              </div>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500 text-xs">Kode Rombel</span>
                  <span className="font-mono font-semibold text-gray-900">{classroom.code}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500 text-xs">Nama Rombel</span>
                  <span className="font-semibold text-gray-900">{classroom.name}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500 text-xs">Tingkat Pendidikan</span>
                  <span className="font-semibold text-gray-900">{classroom.grade?.name || '-'} ({classroom.grade?.educationLevel || '-'})</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500 text-xs">Jurusan</span>
                  <span className="font-semibold text-gray-900">{classroom.major?.name || 'Umum'}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 text-xs">Kapasitas Maksimal</span>
                  <span className="font-bold text-gray-900">{classroom.capacity || '-'} Siswa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'siswa' && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Daftar Siswa Kelas {classroom.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tahun Ajaran: {academicYears.find(ay => ay.id === selectedAy)?.name || '-'} &bull; Semester: {semesters.find(sm => sm.id === selectedSm)?.name || '-'}
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 self-start sm:self-auto">
                {students.length} Siswa Terdaftar
              </span>
            </div>

            <DataTable
              columns={studentColumns}
              data={students}
              loading={loadingStudents}
              emptyMessage="Belum ada siswa yang ditempatkan di kelas ini pada periode yang dipilih."
            />
          </div>
        )}
      </div>
    </div>
  );
};
