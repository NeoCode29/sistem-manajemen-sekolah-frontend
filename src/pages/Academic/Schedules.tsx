import React, { useEffect, useState } from 'react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getSubjectAssignments, createSubjectAssignment, updateSubjectAssignment, deleteSubjectAssignment } from '../../api/schedulingService';
import type { Schedule, SubjectAssignment } from '../../api/schedulingService';
import { getAcademicYears, getSemesters, getClassrooms, getSubjects, getClassPeriods } from '../../api/academicService';
import type { AcademicYear, Semester, Classroom, Subject, ClassPeriod } from '../../api/academicService';
import { getEmployees } from '../../api/employeeService';
import type { Employee } from '../../api/employeeService';
import { CalendarDays, Plus, Edit2, Trash2, Clock, Users, BookOpen, MapPin } from 'lucide-react';
import '../Academic/Academic.css';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
  { id: 7, name: 'Minggu' }
];

export const Schedules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'assignments'>('schedule');

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');
  
  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterClassroomId, setFilterClassroomId] = useState('');
  
  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<SubjectAssignment | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Schedule Form
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [classPeriodId, setClassPeriodId] = useState('');
  const [subjectAssignmentId, setSubjectAssignmentId] = useState('');
  const [room, setRoom] = useState('');
  
  // Assignment Form
  const [subjectId, setSubjectId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (filterClassroomId) {
      fetchClassroomData();
    } else {
      setSchedules([]);
      setSubjectAssignments([]);
    }
  }, [filterClassroomId, filterAcademicYearId, filterSemesterId]);

  const fetchDependencies = async () => {
    try {
      setPageError('');
      const [ayData, semData, subjData, empData, clsData, periodData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getSubjects(),
        getEmployees({ isActive: 'true' }),
        getClassrooms(),
        getClassPeriods()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setSubjects(subjData);
      setEmployees(empData);
      setClassrooms(clsData);
      setClassPeriods(periodData.filter(p => !p.isBreak).sort((a,b) => a.periodNumber - b.periodNumber));
      
      const activeAy = ayData.find(a => a.isActive);
      const activeSem = semData.find(s => s.isActive);
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
      
      // Auto-select first class to avoid empty state confusion
      if (clsData.length > 0 && !filterClassroomId) {
        setFilterClassroomId(clsData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setPageError(err.response?.data?.message || err.message || 'Gagal memuat data referensi (Tahun Ajaran, Kelas, dll)');
    }
  };

  const fetchClassroomData = async () => {
    if (!filterClassroomId) return;
    try {
      setLoading(true);
      const [scheds, assigns] = await Promise.all([
        getSchedules(filterClassroomId),
        getSubjectAssignments(filterClassroomId)
      ]);
      
      setSchedules(scheds.filter(s => s.academicYearId === filterAcademicYearId && s.semesterId === filterSemesterId));
      setSubjectAssignments(assigns.filter(a => a.academicYearId === filterAcademicYearId && a.semesterId === filterSemesterId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  // ---- Assignment Actions ----
  const openAddAssignmentModal = () => {
    setEditingAssignment(null);
    setSubjectId('');
    setEmployeeId('');
    setIsAssignmentModalOpen(true);
    setError('');
  };

  const openEditAssignmentModal = (item: SubjectAssignment) => {
    setEditingAssignment(item);
    setSubjectId(item.subjectId);
    setEmployeeId(item.employeeId);
    setIsAssignmentModalOpen(true);
    setError('');
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterClassroomId) return;
    try {
      setIsSubmitting(true);
      const payload = {
        subjectId,
        employeeId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        isActive: true
      };
      
      if (editingAssignment) {
        await updateSubjectAssignment(filterClassroomId, editingAssignment.id, payload);
      } else {
        await createSubjectAssignment(filterClassroomId, payload);
      }
      setIsAssignmentModalOpen(false);
      fetchClassroomData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan penugasan guru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!filterClassroomId) return;
    if (window.confirm('Yakin ingin menghapus penugasan ini? Jadwal yang terkait mungkin akan error.')) {
      try {
        await deleteSubjectAssignment(filterClassroomId, id);
        fetchClassroomData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus data');
      }
    }
  };

  // ---- Schedule Actions ----
  const openAddScheduleModal = () => {
    setEditingSchedule(null);
    setDayOfWeek(1);
    setClassPeriodId(classPeriods.length > 0 ? classPeriods[0].id : '');
    setSubjectAssignmentId('');
    setRoom('');
    setIsScheduleModalOpen(true);
    setError('');
  };

  const openEditScheduleModal = (item: Schedule) => {
    setEditingSchedule(item);
    setDayOfWeek(item.dayOfWeek);
    setClassPeriodId(item.classPeriodId);
    setSubjectAssignmentId(item.subjectAssignmentId);
    setRoom(item.room || '');
    setIsScheduleModalOpen(true);
    setError('');
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterClassroomId) return;
    try {
      setIsSubmitting(true);
      const payload = {
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        dayOfWeek: Number(dayOfWeek),
        classPeriodId,
        subjectAssignmentId,
        room: room || undefined
      };
      
      if (editingSchedule) {
        await updateSchedule(filterClassroomId, editingSchedule.id, payload);
      } else {
        await createSchedule(filterClassroomId, payload);
      }
      setIsScheduleModalOpen(false);
      fetchClassroomData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan jadwal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!filterClassroomId) return;
    if (window.confirm('Yakin ingin menghapus jadwal ini?')) {
      try {
        await deleteSchedule(filterClassroomId, id);
        fetchClassroomData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus data');
      }
    }
  };

  const groupedSchedules = DAYS.map(day => ({
    ...day,
    schedules: schedules
      .filter(s => s.dayOfWeek === day.id)
      .sort((a, b) => {
        const periodA = a.classPeriod?.periodNumber || 0;
        const periodB = b.classPeriod?.periodNumber || 0;
        return periodA - periodB;
      })
  }));

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal & Penugasan Pelajaran</h1>
          <p className="page-subtitle">Atur penugasan guru dan jadwal mata pelajaran per kelas</p>
        </div>
      </div>

      {pageError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200 shadow-sm">
          <strong>Terjadi Kesalahan:</strong> {pageError}
        </div>
      )}

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-end bg-blue-50/30">
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Tahun Ajaran</label>
          <select className="input-field mt-1" value={filterAcademicYearId} onChange={(e) => setFilterAcademicYearId(e.target.value)}>
            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </select>
        </div>
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Semester</label>
          <select className="input-field mt-1" value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}>
            {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
          </select>
        </div>
        <div className="form-group w-64">
          <label className="text-xs font-semibold text-blue-600 uppercase">Pilih Kelas *</label>
          <select 
            className="input-field mt-1 border-blue-300 focus:border-blue-500 focus:ring-blue-200" 
            value={filterClassroomId} 
            onChange={(e) => setFilterClassroomId(e.target.value)}
          >
            <option value="">-- Pilih Kelas --</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {!filterClassroomId ? (
        <div className="glass-panel p-12 text-center text-gray-500">
          <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg">Silakan pilih <b>Kelas</b> terlebih dahulu.</p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'assignments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('assignments')}
            >
              1. Penugasan Guru
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('schedule')}
            >
              2. Jadwal Pelajaran
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat data...</div>
          ) : (
            <>
              {activeTab === 'assignments' && (
                <div className="glass-panel">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">Daftar Guru Mata Pelajaran</h2>
                    <button className="btn-primary flex items-center gap-2 text-sm py-1.5" onClick={openAddAssignmentModal}>
                      <Plus size={16} /> Tambah Penugasan
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table-v4">
                      <thead>
                        <tr>
                          <th>Mata Pelajaran</th>
                          <th>Guru Pengampu</th>
                          <th className="w-24 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectAssignments.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-8 text-gray-400">Belum ada penugasan guru.</td>
                          </tr>
                        ) : (
                          subjectAssignments.map(item => (
                            <tr key={item.id}>
                              <td className="font-medium text-gray-900">{item.subject?.name}</td>
                              <td className="text-gray-600">{item.employee?.fullName}</td>
                              <td className="text-center">
                                <div className="flex justify-center gap-2">
                                  <button className="text-gray-400 hover:text-blue-600" onClick={() => openEditAssignmentModal(item)}>
                                    <Edit2 size={16} />
                                  </button>
                                  <button className="text-gray-400 hover:text-red-600" onClick={() => handleDeleteAssignment(item.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-800">Grid Jadwal Pelajaran</h2>
                    <button className="btn-primary flex items-center gap-2 text-sm py-1.5" onClick={openAddScheduleModal}>
                      <Plus size={16} /> Tambah Jadwal
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedSchedules.map(day => (
                      <div key={day.id} className="glass-panel overflow-hidden">
                        <div className="bg-gray-50/80 p-3 border-b text-center font-bold text-gray-700">
                          {day.name}
                        </div>
                        <div className="p-0">
                          {day.schedules.length === 0 ? (
                            <div className="p-6 flex flex-col items-center justify-center text-gray-400 border-b border-gray-100 last:border-b-0 h-full">
                              <span className="text-sm italic mb-2">Belum ada jadwal</span>
                              <button 
                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                                onClick={() => {
                                  openAddScheduleModal();
                                  setDayOfWeek(day.id);
                                }}
                              >
                                + Tambah
                              </button>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {day.schedules.map(item => (
                                <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors relative">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      <Clock size={12} /> {item.classPeriod?.startTime} - {item.classPeriod?.endTime} (Jam ke-{item.classPeriod?.periodNumber})
                                    </div>
                                    <div className="flex gap-1 bg-white rounded shadow-sm border border-gray-200 p-0.5">
                                      <button className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" onClick={() => openEditScheduleModal(item)} title="Edit Jadwal">
                                        <Edit2 size={14} />
                                      </button>
                                      <button className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" onClick={() => handleDeleteSchedule(item.id)} title="Hapus Jadwal">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                                    <BookOpen size={14} className="text-gray-400" />
                                    {item.subjectAssignment?.subject?.name}
                                  </div>
                                  
                                  <div className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">
                                    <Users size={14} className="text-gray-400" />
                                    {item.subjectAssignment?.employee?.fullName}
                                  </div>

                                  {item.room && (
                                    <div className="text-xs text-orange-600 flex items-center gap-1.5">
                                      <MapPin size={14} className="text-orange-400" />
                                      Ruangan: {item.room}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '400px' }}>
            <div className="modal-header-v4">
              <h2>{editingAssignment ? 'Edit Penugasan Guru' : 'Tambah Penugasan Guru'}</h2>
              <button type="button" className="btn-close" onClick={() => setIsAssignmentModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAssignmentSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="error-message mb-4">{error}</div>}
                
                <div className="form-group mb-4">
                  <label className="text-sm font-medium text-gray-700">Mata Pelajaran *</label>
                  <select className="input-field mt-1" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                    <option value="">Pilih Mapel...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                
                <div className="form-group mb-4">
                  <label className="text-sm font-medium text-gray-700">Guru Pengampu *</label>
                  <select className="input-field mt-1" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                    <option value="">Pilih Guru...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setIsAssignmentModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
              <button type="button" className="btn-close" onClick={() => setIsScheduleModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="error-message mb-4">{error}</div>}
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Hari *</label>
                    <select className="input-field mt-1" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} required>
                      {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Jam Pelajaran *</label>
                    <select className="input-field mt-1" value={classPeriodId} onChange={(e) => setClassPeriodId(e.target.value)} required>
                      <option value="">Pilih Jam...</option>
                      {classPeriods.map(p => <option key={p.id} value={p.id}>Jam ke-{p.periodNumber} ({p.startTime} - {p.endTime})</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="text-sm font-medium text-gray-700">Penugasan Guru & Mapel *</label>
                  <select className="input-field mt-1" value={subjectAssignmentId} onChange={(e) => setSubjectAssignmentId(e.target.value)} required>
                    <option value="">Pilih Penugasan...</option>
                    {subjectAssignments.map(sa => (
                      <option key={sa.id} value={sa.id}>{sa.subject?.name} - {sa.employee?.fullName}</option>
                    ))}
                  </select>
                  {subjectAssignments.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Belum ada guru yang ditugaskan. Silakan ke tab 'Penugasan Guru' terlebih dahulu.</p>
                  )}
                </div>

                <div className="form-group mb-4">
                  <label className="text-sm font-medium text-gray-700">Ruangan (Opsional)</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Contoh: Lab Komputer 1" 
                  />
                </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || subjectAssignments.length === 0}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
