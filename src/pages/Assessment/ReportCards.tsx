import React, { useState, useEffect } from 'react';
import { useReportCards, type ReportCard } from '../../hooks/useReportCards';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import { useSemesters } from '../../hooks/useSemesters';
import { useClassrooms } from '../../hooks/useClassrooms';
import { getHomeroomTeacher } from '../../api/academicService';
import { FileText, Edit2, Printer, Loader2, AlertCircle, Settings, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePermissions } from '../../hooks/usePermissions';

export const ReportCards: React.FC = () => {
  const { years: academicYears, refresh: fetchAcademicYears } = useAcademicYears();
  const { semesters, refresh: fetchSemesters } = useSemesters();
  const { classrooms, refresh: fetchClassrooms } = useClassrooms();
  const { reportCards, loading, error, fetchReportCards, generateReportCards, updateHomeroomNotes, validateReportCard, exportPdf, approveClassroom, getApprovals } = useReportCards();
  const { user } = useAuth();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState<any>(null);
  
  const [isClassroomApproved, setIsClassroomApproved] = useState(false);

  const [modal, setModal] = useState<{ open: boolean; editCard: ReportCard | null }>({ open: false, editCard: null });
  const [formData, setFormData] = useState({ sickDays: 0, excusedDays: 0, unexcusedDays: 0, homeroomNotes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasPermission } = usePermissions();
  const canValidatePermission = hasPermission('score_validations.validate') || hasPermission('assessment.write');
  const canApprovePermission = hasPermission('score_validations.principal_approve') || hasPermission('assessment.write');
  const canGeneratePermission = hasPermission('report_cards.generate') || hasPermission('assessment.write');

  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah') ?? false;
  const isPrincipal = (user?.roles?.some(r => r.name === 'Kepala Sekolah') ?? false) || canApprovePermission;
  const isHomeroomTeacher = Boolean(
    homeroomTeacher?.employeeId && user?.employeeId && 
    String(homeroomTeacher.employeeId) === String(user.employeeId)
  );
  // STRICT: Only Homeroom Teacher or Principal/Approved role can validate/endorse report cards
  const canValidate = (canValidatePermission && isHomeroomTeacher) || canApprovePermission || isPrincipal;
  const canManageReports = canGeneratePermission || isSuperAdmin || isPrincipal || isHomeroomTeacher;

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
    if (semesters.length > 0 && selectedYear) {
      const yearSemesters = semesters.filter(s => s.academicYearId === selectedYear);
      if (yearSemesters.length > 0) {
        const stillValid = yearSemesters.some(s => s.id === selectedSemester);
        if (!stillValid) {
          const active = yearSemesters.find(s => s.isActive) || yearSemesters[0];
          setSelectedSemester(active.id);
        }
      } else {
        setSelectedSemester('');
      }
    }
  }, [semesters, selectedYear, selectedSemester]);
  
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
       setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  useEffect(() => {
    if (selectedYear && selectedSemester && selectedClassroom) {
      fetchReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
      getApprovals({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom })
        .then(res => setIsClassroomApproved(res.length > 0 && res[0].status === 'APPROVED'))
        .catch(err => console.error(err));
      getHomeroomTeacher(selectedClassroom, selectedYear, selectedSemester)
        .then(ht => setHomeroomTeacher(ht))
        .catch(() => setHomeroomTeacher(null));
    } else {
      setHomeroomTeacher(null);
    }
  }, [selectedYear, selectedSemester, selectedClassroom, fetchReportCards, getApprovals]);

  const handleGenerate = async () => {
    if (!selectedYear || !selectedSemester || !selectedClassroom) {
      alert('Pilih Tahun Ajaran, Semester, dan Kelas terlebih dahulu.');
      return;
    }
    if (window.confirm('Generate rapor untuk seluruh siswa di kelas ini? Nilai yang belum divalidasi mungkin tidak akan masuk.')) {
      try {
        const res = await generateReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
        const count = res?.generatedCount ?? res?.count ?? 0;
        if (count > 0) {
          alert(`Rapor berhasil di-generate untuk ${count} siswa!`);
        } else {
          alert('Proses generate selesai.');
        }
      } catch (e: any) {
        alert(e.response?.data?.message || e.message || 'Gagal generate rapor');
      }
    }
  };

  const openEditModal = (card: ReportCard) => {
    setFormData({
      sickDays: card.sickDays,
      excusedDays: card.excusedDays,
      unexcusedDays: card.unexcusedDays,
      homeroomNotes: card.homeroomNotes || ''
    });
    setModal({ open: true, editCard: card });
  };

  const closeEditModal = () => {
    setModal({ open: false, editCard: null });
  };

  const saveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.editCard) {
      try {
        setIsSubmitting(true);
        await updateHomeroomNotes(modal.editCard.id, formData);
        closeEditModal();
      } catch (e: any) {
        alert('Gagal menyimpan catatan: ' + (e.message || 'Error'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const columns: Column<ReportCard>[] = [
    {
      key: 'student',
      header: 'Identitas Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.student.fullName}</div>
            <div className="text-xs text-slate-500">NIS: {row.student.nis}</div>
          </div>
        </div>
      )
    },
    {
      key: 'attendance',
      header: 'Kehadiran (S/I/A)',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-slate-100 text-slate-600 border border-slate-200">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
          {row.sickDays} Sakit / {row.excusedDays} Izin / {row.unexcusedDays} Alpa
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-2">
          {row.validatedAt ? (
            <Badge variant="success">Wali: Valid</Badge>
          ) : (
            <Badge variant="warning">Wali: Menunggu</Badge>
          )}
          
          {isClassroomApproved ? (
            <Badge variant="info">Kepsek: Sah</Badge>
          ) : (
            <Badge variant="default">Kepsek: Menunggu</Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          {!row.validatedAt && (
            <button 
              onClick={async () => {
                if (!canValidate) {
                  alert('Hanya Wali Kelas untuk kelas ini atau Kepala Sekolah yang dapat memvalidasi rapor.');
                  return;
                }
                if (window.confirm('Validasi rapor ini? Tindakan ini akan membubuhkan tanda tangan digital Anda.')) {
                  try {
                    await validateReportCard(row.id);
                  } catch (e: any) {
                    alert(e.response?.data?.message || e.message || 'Gagal memvalidasi rapor');
                  }
                }
              }}
              disabled={!canValidate}
              className={`p-2 rounded-lg transition-colors border border-transparent ${
                canValidate 
                  ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' 
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
              title={canValidate ? 'Validasi & Tanda Tangani' : `Hanya Wali Kelas (${homeroomTeacher?.employee?.fullName || 'Wali Kelas'}) atau Kepala Sekolah yang dapat memvalidasi`}
            >
              <CheckCircle size={16} />
            </button>
          )}
          <button 
            onClick={() => {
              if (!canValidate) {
                alert('Hanya Wali Kelas untuk kelas ini atau Kepala Sekolah yang dapat mengubah catatan/absensi.');
                return;
              }
              openEditModal(row);
            }}
            disabled={!canValidate}
            className={`p-2 rounded-lg transition-colors border border-transparent ${
              canValidate 
                ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer' 
                : 'text-slate-300 cursor-not-allowed opacity-40'
            }`}
            title={canValidate ? 'Isi Catatan & Absensi' : 'Hanya Wali Kelas atau Kepala Sekolah yang dapat mengubah catatan'}
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => exportPdf(row.id, row.student.fullName)}
            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent"
            title="Cetak PDF"
          >
            <Printer size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <PageHeader
        title="Cetak Rapor & Pengesahan"
        subtitle="Kelola dan sahkan dokumen rapor hasil belajar siswa per kelas."
        action={
          <div className="flex gap-4">
            <button 
              className="btn-std-secondary flex items-center gap-2"
              onClick={handleGenerate}
              disabled={loading || !selectedClassroom || !canManageReports}
              title={!canManageReports ? `Hanya Wali Kelas (${homeroomTeacher?.employee?.fullName || 'Wali Kelas'}), Kepala Sekolah, atau Admin yang dapat men-generate rapor kelas ini` : undefined}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              Generate Rapor Kelas
            </button>
            
            {isPrincipal && (
              <button 
                className={`btn-std-primary flex items-center gap-2 disabled:opacity-70 ${isClassroomApproved ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' : ''}`}
                onClick={async () => {
                  if (window.confirm('Sahkah rapor untuk kelas ini? Tanda tangan Anda sebagai Kepala Sekolah akan dibubuhkan secara resmi pada seluruh dokumen rapor di kelas ini.')) {
                    try {
                      await approveClassroom({
                        classroomId: selectedClassroom,
                        academicYearId: selectedYear,
                        semesterId: selectedSemester,
                        action: 'APPROVE',
                        notes: ''
                      });
                      setIsClassroomApproved(true);
                      alert('Berhasil Disahkan!');
                    } catch (e: any) {
                      alert(e.response?.data?.message || e.message || 'Gagal mengesahkan rapor');
                    }
                  }
                }}
                disabled={loading || !selectedClassroom || isClassroomApproved}
              >
                <CheckCircle size={18} />
                {isClassroomApproved ? 'Telah Disahkan (Kepala Sekolah)' : 'Sahkah Rapor Kelas (Kepala Sekolah)'}
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="alert flex items-center gap-3 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-6 font-medium">
          <AlertCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Filter Pencarian Rapor</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun Ajaran</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              <option value="">Pilih Tahun Ajaran...</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</label>
            <select 
              className="input-std bg-slate-50 border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              value={selectedSemester} 
              onChange={e => setSelectedSemester(e.target.value)}
              disabled={!selectedYear}
            >
              <option value="">Pilih Semester...</option>
              {semesters.filter(s => s.academicYearId === selectedYear).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</label>
            <select className="input-std bg-slate-50 border-slate-200 cursor-pointer" value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}>
              <option value="">Pilih Kelas</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {selectedClassroom && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-600">Wali Kelas:</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                {homeroomTeacher?.employee?.fullName || 'Belum Ditugaskan'}
              </span>
              {isHomeroomTeacher && (
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold px-2 py-0.5 rounded-full">
                  Anda adalah Wali Kelas
                </span>
              )}
              {isPrincipal && (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                  Kepala Sekolah
                </span>
              )}
              {isSuperAdmin && (
                <span className="bg-purple-100 text-purple-800 border border-purple-200 font-bold px-2 py-0.5 rounded-full">
                  Admin (Non-Wali / Non-Kepsek)
                </span>
              )}
            </div>
            {!canValidate && (
              <div className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                Mode Hanya-Baca: Validasi dan pengesahan rapor merupakan hak mutlak Wali Kelas dan Kepala Sekolah.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Daftar Rapor Siswa</h3>
            <p className="text-sm text-slate-500 mt-1">Data absensi dan dokumen rapor siswa di kelas terpilih</p>
          </div>
        </div>

        {(loading && reportCards.length === 0) ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span className="text-base font-semibold text-gray-500">Memuat data rapor...</span>
          </div>
        ) : (!loading && reportCards.length === 0) ? (
          <div className="p-24 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-6 shadow-sm">
                <FileText size={36} className="text-indigo-600" />
             </div>
             <div className="text-xl font-extrabold text-slate-800">Belum Ada Rapor</div>
             <div className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
               Belum ada rapor di kelas ini. Silakan tekan tombol "Generate Rapor Kelas".
             </div>
          </div>
        ) : (
          <DataTable columns={columns} data={reportCards} loading={loading} emptyMessage="Belum ada data rapor." />
        )}
      </div>

      <Modal open={modal.open} onClose={closeEditModal} title="Edit Kehadiran & Catatan">
        <form onSubmit={saveNotes} className="flex flex-col gap-4 p-6">
          <div className="mb-4 text-sm text-slate-600 flex items-center gap-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            <User size={18} className="text-indigo-600" />
            <span>Siswa: <strong className="text-indigo-900">{modal.editCard?.student?.fullName}</strong></span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <FormField label="Sakit (Hari)" required>
              <input 
                type="number" 
                value={formData.sickDays} 
                onChange={e => setFormData({...formData, sickDays: parseInt(e.target.value)||0})} 
                className="input-std" 
                min={0}
              />
            </FormField>
            <FormField label="Izin (Hari)" required>
              <input 
                type="number" 
                value={formData.excusedDays} 
                onChange={e => setFormData({...formData, excusedDays: parseInt(e.target.value)||0})} 
                className="input-std" 
                min={0}
              />
            </FormField>
            <FormField label="Alpa (Hari)" required>
              <input 
                type="number" 
                value={formData.unexcusedDays} 
                onChange={e => setFormData({...formData, unexcusedDays: parseInt(e.target.value)||0})} 
                className="input-std" 
                min={0}
              />
            </FormField>
          </div>

          <FormField label="Catatan Wali Kelas">
            <textarea 
              value={formData.homeroomNotes} 
              onChange={e => setFormData({...formData, homeroomNotes: e.target.value})}
              className="input-std resize-none"
              placeholder="Tuliskan pesan / motivasi untuk siswa..."
              rows={4}
            ></textarea>
          </FormField>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
            <button type="button" onClick={closeEditModal} className="btn-std-secondary" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn-std-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
