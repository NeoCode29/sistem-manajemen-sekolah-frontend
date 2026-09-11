import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import type { Schedule, SubjectAssignment } from '../../api/schedulingService';
import { CalendarDays, Plus, Edit2, Trash2, Clock, Users, BookOpen, MapPin, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { useSchedules } from '../../hooks/useSchedules';
import { useDialog } from '../../contexts/DialogContext';
import { getErrorMessage } from '../../utils/errorHandler';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
  { id: 7, name: 'Minggu' }
];

const getSubjectColor = (subjectName: string = '') => {
  const colorMap = [
    { border: 'border-t-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { border: 'border-t-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { border: 'border-t-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { border: 'border-t-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
    { border: 'border-t-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
    { border: 'border-t-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },
  ];
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorMap[Math.abs(hash) % colorMap.length];
};

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
      const errMsg = getErrorMessage(err, 'Gagal menyimpan penugasan guru. Pastikan guru dan mata pelajaran belum pernah ditugaskan pada periode yang sama.');
      setError(errMsg);
      showAlert(errMsg, 'Gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!filterClassroomId) return;
    showConfirm('Apakah Anda yakin ingin menghapus penugasan guru ini? Jadwal pelajaran yang terkait mungkin akan terpengaruh.', async () => {
      try {
        await deleteSubjectAssignment(id);
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus penugasan guru. Penugasan tidak dapat dihapus jika masih terkait dengan jadwal pelajaran.'), 'Gagal');
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
      const errMsg = getErrorMessage(err, 'Gagal menyimpan jadwal pelajaran. Pastikan tidak ada bentrok jam pelajaran, ruang, atau guru pada hari tersebut.');
      setError(errMsg);
      showAlert(errMsg, 'Gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!filterClassroomId) return;
    showConfirm('Apakah Anda yakin ingin menghapus jadwal pelajaran ini?', async () => {
      try {
        await deleteSchedule(id);
      } catch (err: any) {
        showAlert(getErrorMessage(err, 'Gagal menghapus jadwal pelajaran.'), 'Gagal');
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
      <span className="font-semibold text-gray-800">{row.subject?.name}</span>
    )},
    { key: 'employee', header: 'Guru Pengampu', render: (row) => <span className="text-gray-600 font-medium">{row.employee?.fullName}</span> },
    { key: 'actions', header: 'Aksi', render: (row) => (
      <ActionButtons 
        onEdit={() => openEditAssignmentModal(row)}
        onDelete={() => handleDeleteAssignment(row.id)}
      />
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter w-full min-w-0" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Jadwal & Penugasan Pelajaran</h1>
          <p className="text-gray-500 mt-1">Atur penugasan guru dan jadwal mata pelajaran per kelas</p>
        </div>
      </div>

      {pageError && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 border border-red-200 rounded-xl flex items-center gap-3 mb-6 flex items-center gap-2">
          <AlertCircle size={18} />
          {pageError}
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-6 mb-8 flex flex-wrap gap-6 items-end bg-gradient-to-r from-blue-50/40 to-transparent border-l-4 border-l-blue-500">
        <div className="form-group w-48">
          <label className="text-xs tracking-wider font-bold text-gray-500 uppercase mb-1">Tahun Ajaran</label>
          <select className="input-std shadow-sm" value={filterAcademicYearId} onChange={(e) => setFilterAcademicYearId(e.target.value)}>
            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </select>
        </div>
        <div className="form-group w-48">
          <label className="text-xs tracking-wider font-bold text-gray-500 uppercase mb-1">Semester</label>
          <select className="input-std shadow-sm" value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}>
            {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
          </select>
        </div>
        <div className="form-group w-64">
          <label className="text-xs tracking-wider font-bold text-blue-600 uppercase mb-1">Pilih Kelas *</label>
          <select 
            className="input-std shadow-sm border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
            value={filterClassroomId} 
            onChange={(e) => setFilterClassroomId(e.target.value)}
          >
            <option value="">-- Pilih Kelas --</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {!filterClassroomId ? (
        <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-12 text-center text-gray-500">
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
                <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-200 shadow-sm">
                  <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">Daftar Guru Mata Pelajaran</h2>
                      <p className="text-xs text-gray-500 mt-1">Kelola guru pengampu untuk kelas ini</p>
                    </div>
                    <button className="btn-std-primary flex items-center gap-2 text-sm py-2 shadow-md hover:shadow-lg" onClick={openAddAssignmentModal}>
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
                    <button className="btn-std-primary flex items-center gap-2 text-sm py-2 shadow-md hover:shadow-lg" onClick={openAddScheduleModal}>
                      <Plus size={16} /> Tambah Jadwal
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedSchedules.map(day => (
                      <div key={day.id} className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col h-full rounded-2xl">
                        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-200 py-4 px-3 text-center font-bold text-gray-800 flex items-center justify-center gap-2 shadow-sm">
                          <CalendarDays size={18} className="text-indigo-600" />
                          {day.name}
                        </div>
                        <div className="p-3 flex-1 flex flex-col bg-gray-50/50 min-h-[300px]">
                          {day.schedules.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-gray-400 flex-1">
                              <span className="text-sm font-medium mb-4 opacity-70">Belum ada jadwal</span>
                              <button 
                                className="text-blue-600 hover:text-white font-semibold border border-blue-600 hover:bg-blue-600 px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1 shadow-sm hover:shadow"
                                onClick={() => {
                                  openAddScheduleModal();
                                  setDayOfWeek(day.id);
                                }}
                              >
                                <Plus size={14} /> Tambah Jadwal
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col gap-4">
                              {day.schedules.map(item => {
                                const subjName = item.subjectAssignment?.subject?.name || '';
                                const color = getSubjectColor(subjName);
                                
                                return (
                                <div key={item.id} className={`group relative bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border-t-4 ${color.border} p-4`}>
                                  
                                  <div className="flex justify-between items-start mb-4">
                                    <div className={`w-11 h-11 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0 shadow-inner`}>
                                      <BookOpen size={20} />
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 tracking-wide">
                                        <Clock size={12} className="text-gray-500" /> {item.classPeriod?.startTime} - {item.classPeriod?.endTime}
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" onClick={() => openEditScheduleModal(item)} title="Edit">
                                          <Edit2 size={14} />
                                        </button>
                                        <button className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" onClick={() => handleDeleteSchedule(item.id)} title="Hapus">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    {item.subjectAssignment?.employee?.fullName}
                                  </div>
                                  
                                  <div className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                                    {subjName}
                                  </div>

                                  {item.room && (
                                    <div className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md flex items-center gap-1.5 w-fit mt-2">
                                      <MapPin size={12} />
                                      {item.room}
                                    </div>
                                  )}
                                </div>
                                );
                              })}
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
      <Modal
        open={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title={editingAssignment ? 'Edit Penugasan Guru' : 'Tambah Penugasan Guru'}
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={() => setIsAssignmentModalOpen(false)}>Batal</button>
            <button type="submit" form="assignment-form" className="btn-std-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        }
      >
        <form id="assignment-form" onSubmit={handleAssignmentSubmit} className="p-6">
          <div className="flex flex-col gap-5">
            {error && isAssignmentModalOpen && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            
            <FormField label="Mata Pelajaran" required>
              <select className="input-std" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                <option value="">Pilih Mata Pelajaran...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </FormField>
            
            <FormField label="Guru Pengampu" required>
              <select className="input-std" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                <option value="">Pilih Guru...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </FormField>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
        footer={
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-100">
            <button type="button" className="btn-std-secondary" onClick={() => setIsScheduleModalOpen(false)}>Batal</button>
            <button type="submit" form="schedule-form" className="btn-std-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        }
      >
        <form id="schedule-form" onSubmit={handleScheduleSubmit} className="p-6">
          <div className="flex flex-col gap-5">
            {error && isScheduleModalOpen && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Hari" required>
                <select className="input-std" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} required>
                  {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FormField>

              <FormField label="Jam Ke-" required>
                <select className="input-std" value={classPeriodId} onChange={(e) => setClassPeriodId(e.target.value)} required>
                  {classPeriods.map(p => <option key={p.id} value={p.id}>Jam ke-{p.periodNumber} ({p.startTime} - {p.endTime})</option>)}
                </select>
              </FormField>
            </div>
            
            <FormField label="Mata Pelajaran & Guru" required>
              <select className="input-std" value={subjectAssignmentId} onChange={(e) => setSubjectAssignmentId(e.target.value)} required>
                <option value="">Pilih Penugasan Guru...</option>
                {subjectAssignments.map(sa => (
                  <option key={sa.id} value={sa.id}>{sa.subject?.name} - {sa.employee?.fullName}</option>
                ))}
              </select>
              {subjectAssignments.length === 0 && (
                <p className="text-xs text-amber-600 mt-2 font-medium">Belum ada penugasan guru di kelas ini. Tambahkan di tab "Penugasan Guru".</p>
              )}
            </FormField>

            <FormField label="Ruangan (Opsional)">
              <input 
                type="text" 
                className="input-std" 
                value={room} 
                onChange={(e) => setRoom(e.target.value)} 
                placeholder="Contoh: Lab Komputer 1" 
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
