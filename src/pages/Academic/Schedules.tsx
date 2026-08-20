import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Schedule, SubjectAssignment } from '../../api/schedulingService';
import { CalendarDays, Plus, Edit2, Trash2, Clock, Users, BookOpen, MapPin, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { useSchedules } from '../../hooks/useSchedules';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

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
  const { showConfirm, showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<'schedule' | 'assignments'>('schedule');

  const {
    schedules,
    subjectAssignments,
    academicYears,
    semesters,
    classrooms,
    subjects,
    employees,
    classPeriods,
    loading,
    error,
    pageError,
    setError,
    filterAcademicYearId,
    setFilterAcademicYearId,
    filterSemesterId,
    setFilterSemesterId,
    filterClassroomId,
    setFilterClassroomId,
    createSubjectAssignment,
    updateSubjectAssignment,
    deleteSubjectAssignment,
    createSchedule,
    updateSchedule,
    deleteSchedule
  } = useSchedules();

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
      setError('');
      const payload = {
        subjectId,
        employeeId,
        academicYearId: filterAcademicYearId,
        semesterId: filterSemesterId,
        isActive: true
      };
      
      if (editingAssignment) {
        await updateSubjectAssignment(editingAssignment.id, {
          subjectId,
          employeeId,
          isActive: true
        });
      } else {
        await createSubjectAssignment(payload);
      }
      setIsAssignmentModalOpen(false);
    } catch (err: any) {
      console.error("Save assignment error:", err);
      let errMsg = 'Gagal menyimpan penugasan guru';
      const resData = err.response?.data;
      
      if (resData) {
        const errObj = resData.error;
        if (errObj && errObj.message) {
          errMsg = Array.isArray(errObj.message) ? errObj.message.join(', ') : errObj.message;
        } else if (typeof errObj === 'string') {
          errMsg = errObj;
        } else if (resData.message) {
          errMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!filterClassroomId) return;
    showConfirm('Yakin ingin menghapus penugasan ini? Jadwal yang terkait mungkin akan error.', async () => {
      try {
        await deleteSubjectAssignment(id);
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus data', 'Gagal');
      }
    });
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
      setError('');
      
      if (editingSchedule) {
        const updatePayload = {
          dayOfWeek: Number(dayOfWeek),
          classPeriodId,
          subjectAssignmentId,
          room: room || undefined
        };
        await updateSchedule(editingSchedule.id, updatePayload);
      } else {
        const createPayload = {
          academicYearId: filterAcademicYearId,
          semesterId: filterSemesterId,
          dayOfWeek: Number(dayOfWeek),
          classPeriodId,
          subjectAssignmentId,
          room: room || undefined
        };
        await createSchedule(createPayload);
      }
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      console.error("Save schedule error:", err);
      let errMsg = 'Gagal menyimpan jadwal';
      const resData = err.response?.data;
      
      if (resData) {
        const errObj = resData.error;
        if (errObj && errObj.message) {
          errMsg = Array.isArray(errObj.message) ? errObj.message.join(', ') : errObj.message;
        } else if (typeof errObj === 'string') {
          errMsg = errObj;
        } else if (resData.message) {
          errMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!filterClassroomId) return;
    showConfirm('Yakin ingin menghapus jadwal ini?', async () => {
      try {
        await deleteSchedule(id);
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus data', 'Gagal');
      }
    });
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

  const assignmentColumns: Column<SubjectAssignment>[] = [
    { key: 'subject', header: 'Mata Pelajaran', render: (row) => (
      <div className="font-semibold text-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
          {row.subject?.name?.substring(0, 2) || 'MA'}
        </div>
        {row.subject?.name}
      </div>
    )},
    { key: 'employee', header: 'Guru Pengampu', render: (row) => <span className="text-gray-600 font-medium">{row.employee?.fullName}</span> },
    { key: 'actions', header: 'Aksi', render: (row) => (
      <div className="flex gap-2 justify-end">
        <button className="btn-icon text-blue-600 hover:bg-blue-50" onClick={() => openEditAssignmentModal(row)}>
          <Edit2 size={16} />
        </button>
        <button className="btn-icon text-red-600 hover:bg-red-50" onClick={() => handleDeleteAssignment(row.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    )}
  ];

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal & Penugasan Pelajaran</h1>
          <p className="page-subtitle">Atur penugasan guru dan jadwal mata pelajaran per kelas</p>
        </div>
      </div>

      {pageError && (
        <div className="alert alert-error mb-6 flex items-center gap-2">
          <AlertCircle size={18} />
          {pageError}
        </div>
      )}

      <div className="glass-panel p-6 mb-8 flex flex-wrap gap-6 items-end bg-gradient-to-r from-blue-50/40 to-transparent border-l-4 border-l-blue-500">
        <div className="form-group w-48">
          <label className="text-xs tracking-wider font-bold text-gray-500 uppercase mb-1">Tahun Ajaran</label>
          <select className="input-field shadow-sm" value={filterAcademicYearId} onChange={(e) => setFilterAcademicYearId(e.target.value)}>
            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </select>
        </div>
        <div className="form-group w-48">
          <label className="text-xs tracking-wider font-bold text-gray-500 uppercase mb-1">Semester</label>
          <select className="input-field shadow-sm" value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}>
            {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
          </select>
        </div>
        <div className="form-group w-64">
          <label className="text-xs tracking-wider font-bold text-blue-600 uppercase mb-1">Pilih Kelas *</label>
          <select 
            className="input-field shadow-sm border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
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
          <div className="flex border-b border-gray-200 mb-6 gap-2">
            <button
              className={`py-3 px-6 font-semibold text-sm border-b-2 outline-none transition-all ${
                activeTab === 'assignments'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('assignments')}
            >
              1. Penugasan Guru
            </button>
            <button
              className={`py-3 px-6 font-semibold text-sm border-b-2 outline-none transition-all ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
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
                <div className="glass-panel overflow-hidden border border-gray-200 shadow-sm">
                  <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">Daftar Guru Mata Pelajaran</h2>
                      <p className="text-xs text-gray-500 mt-1">Kelola guru pengampu untuk kelas ini</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2 text-sm py-2 shadow-md hover:shadow-lg" onClick={openAddAssignmentModal}>
                      <Plus size={16} /> Tambah Penugasan
                    </button>
                  </div>
                  <DataTable 
                    columns={assignmentColumns}
                    data={subjectAssignments}
                    loading={loading}
                    emptyMessage="Belum ada penugasan guru untuk kelas ini."
                  />
                </div>
              )}

              {activeTab === 'schedule' && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">Grid Jadwal Pelajaran</h2>
                      <p className="text-xs text-gray-500">Susunan mata pelajaran per hari</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2 text-sm py-2 shadow-md hover:shadow-lg" onClick={openAddScheduleModal}>
                      <Plus size={16} /> Tambah Jadwal
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedSchedules.map(day => (
                      <div key={day.id} className="glass-panel overflow-hidden border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="bg-blue-600 p-3 text-center font-bold text-white shadow-sm flex items-center justify-center gap-2">
                          <CalendarDays size={16} className="opacity-70" />
                          {day.name}
                        </div>
                        <div className="p-0 flex-1 flex flex-col bg-white">
                          {day.schedules.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-gray-400 flex-1">
                              <span className="text-sm font-medium mb-4 opacity-70">Belum ada jadwal</span>
                              <button 
                                className="text-blue-600 hover:text-white font-semibold border border-blue-600 hover:bg-blue-600 px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1"
                                onClick={() => {
                                  openAddScheduleModal();
                                  setDayOfWeek(day.id);
                                }}
                              >
                                <Plus size={14} /> Tambah Jadwal
                              </button>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100 flex-1">
                              {day.schedules.map(item => (
                                <div key={item.id} className="p-4 hover:bg-blue-50/40 transition-colors">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                      <Clock size={12} /> {item.classPeriod?.startTime} - {item.classPeriod?.endTime}
                                    </div>
                                    
                                    <div className="flex gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-1">
                                      <button className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" onClick={() => openEditScheduleModal(item)} title="Edit">
                                        <Edit2 size={14} />
                                      </button>
                                      <button className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" onClick={() => handleDeleteSchedule(item.id)} title="Hapus">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="font-bold text-gray-800 flex items-center gap-2 mb-1.5 text-sm">
                                    <BookOpen size={16} className="text-blue-500" />
                                    {item.subjectAssignment?.subject?.name}
                                  </div>
                                  
                                  <div className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-1.5">
                                    <Users size={14} className="text-gray-400" />
                                    {item.subjectAssignment?.employee?.fullName}
                                  </div>

                                  {item.room && (
                                    <div className="text-xs font-semibold text-orange-600 flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-gray-200">
                                      <MapPin size={14} />
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
      {isAssignmentModalOpen && createPortal(
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
      , document.body)}

      {/* Schedule Modal */}
      {isScheduleModalOpen && createPortal(
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
      , document.body)}
    </div>
  );
};
