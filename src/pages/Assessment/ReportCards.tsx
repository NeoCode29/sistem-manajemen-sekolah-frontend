import React, { useState, useEffect } from 'react';
import { useReportCards, type ReportCard } from '../../hooks/useReportCards';
import { useAcademicYears } from '../../hooks/useAcademicYears';
import { useSemesters } from '../../hooks/useSemesters';
import { useClassrooms } from '../../hooks/useClassrooms';
import { getHomeroomTeacher } from '../../api/academicService';
import { FileText, Edit2, Printer, Loader2, User, CheckCircle, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const ReportCards: React.FC = () => {
  const { years: academicYears, refresh: fetchAcademicYears } = useAcademicYears();
  const { semesters, refresh: fetchSemesters } = useSemesters();
  const { classrooms, refresh: fetchClassrooms } = useClassrooms();
  const { reportCards, loading, fetchReportCards, generateReportCards, updateHomeroomNotes, validateReportCard, exportPdf, approveClassroom, getApprovals } = useReportCards();
  const { user } = useAuth();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState<any>(null);
  
  const [isClassroomApproved, setIsClassroomApproved] = useState(false);

  const [modal, setModal] = useState<{ open: boolean; editCard: ReportCard | null }>({ open: false, editCard: null });
  const [formData, setFormData] = useState({ sickDays: 0, excusedDays: 0, unexcusedDays: 0, homeroomNotes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
    action: async () => {}
  });

  const { hasPermission } = usePermissions();
  const canValidatePermission = hasPermission('score_validations.validate') || hasPermission('score_validations.principal_approve') || hasPermission('assessment.write') || hasPermission('assessment.manage');
  const canApprovePermission = hasPermission('score_validations.principal_approve') || hasPermission('assessment.write') || hasPermission('assessment.manage');
  const canGeneratePermission = hasPermission('report_cards.generate') || hasPermission('report_cards.manage') || hasPermission('assessment.write') || hasPermission('assessment.manage');
  const canReadReports = hasPermission('report_cards.read') || hasPermission('report_cards.generate') || hasPermission('report_cards.manage') || hasPermission('assessment.read');

  const isSuperAdmin = user?.roles?.some(r => r.name === 'Super Admin' || r.name === 'Admin Sekolah' || r.name === 'Kepala Sekolah') ?? false;
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

  const handleGenerate = () => {
    if (!canManageReports) {
      notify.error(`Hanya Wali Kelas (${homeroomTeacher?.employee?.fullName || 'Wali Kelas'}), Kepala Sekolah, atau Administrator yang berwenang men-generate rapor kelas ini.`);
      return;
    }

    if (!selectedYear || !selectedSemester || !selectedClassroom) {
      notify.error('Pilih Tahun Ajaran, Semester, dan Kelas terlebih dahulu.');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Generate Rapor Kelas',
      message: 'Generate rapor untuk seluruh siswa di kelas ini? Nilai terbobot akan dihitung secara otomatis. Nilai yang belum tervalidasi mungkin belum masuk ke rapor.',
      variant: 'info',
      action: async () => {
        try {
          const res = await generateReportCards({ academicYearId: selectedYear, semesterId: selectedSemester, classroomId: selectedClassroom });
          const count = res?.generatedCount ?? res?.count ?? 0;
          notify.success(`Rapor berhasil di-generate untuk ${count} siswa!`);
        } catch (e: any) {
          notify.error(e, 'Gagal generate rapor');
        }
      }
    });
  };

  const openEditModal = (card: ReportCard) => {
    if (!canValidate) {
      notify.error('Hanya Wali Kelas untuk kelas ini atau Kepala Sekolah yang dapat mengubah catatan/absensi siswa.');
      return;
    }

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
    if (!canValidate) {
      notify.error('Hanya Wali Kelas untuk kelas ini atau Kepala Sekolah yang berwenang mengubah catatan/absensi siswa.');
      return;
    }

    if (modal.editCard) {
      try {
        setIsSubmitting(true);
        await updateHomeroomNotes(modal.editCard.id, formData);
        notify.success('Catatan perkembangan dan absensi siswa berhasil disimpan');
        closeEditModal();
      } catch (e: any) {
        notify.error(e, 'Gagal menyimpan catatan');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleValidateStudentReport = (row: ReportCard) => {
    if (!canValidate) {
      notify.error('Hanya Wali Kelas untuk kelas ini atau Kepala Sekolah yang dapat memvalidasi rapor.');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Validasi Rapor Siswa',
      message: `Validasi rapor untuk siswa "${row.student.fullName}"? Tindakan ini membubuhkan tanda tangan digital Anda pada dokumen rapor.`,
      variant: 'info',
      action: async () => {
        try {
          await validateReportCard(row.id);
          notify.success(`Rapor untuk ${row.student.fullName} berhasil divalidasi`);
        } catch (e: any) {
          notify.error(e, 'Gagal memvalidasi rapor');
        }
      }
    });
  };

  const handleApproveClassroom = () => {
    if (!isPrincipal) {
      notify.error('Hanya Kepala Sekolah yang berwenang mengesahkan dokumen rapor kelas.');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Pengesahan Rapor Kelas (Kepala Sekolah)',
      message: 'Sahkan dokumen rapor untuk seluruh siswa di kelas ini? Tanda tangan Anda sebagai Kepala Sekolah akan dibubuhkan secara resmi pada seluruh lembar rapor.',
      variant: 'info',
      action: async () => {
        try {
          await approveClassroom({
            classroomId: selectedClassroom,
            academicYearId: selectedYear,
            semesterId: selectedSemester,
            action: 'APPROVE',
            notes: ''
          });
          setIsClassroomApproved(true);
          notify.success('Rapor kelas berhasil disahkan secara resmi oleh Kepala Sekolah!');
        } catch (e: any) {
          notify.error(e, 'Gagal mengesahkan rapor');
        }
      }
    });
  };

  const columns: Column<ReportCard>[] = [
    {
      key: 'student',
      header: 'Identitas Siswa',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
            <User size={18} />
          </div>
          <div>
            <div className="font-bold text-slate-900 truncate block max-w-[200px]" title={row.student.fullName}>
              {row.student.fullName}
            </div>
            <div className="text-xs text-slate-500 font-mono">NIS: {row.student.nis}</div>
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
      header: 'Status 3-Tier',
      render: (row) => (
        <div className="flex flex-col gap-1.5">
          {row.validatedAt ? (
            <Badge variant="success">Wali: Valid</Badge>
          ) : (
            <Badge variant="warning">Wali: Menunggu</Badge>
          )}
          
          {isClassroomApproved ? (
            <Badge variant="purple">Kepsek: Sah</Badge>
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
              type="button"
              onClick={() => handleValidateStudentReport(row)}
              disabled={!canValidate}
              className={`p-2 rounded-xl transition-all border ${
                canValidate 
                  ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-200 cursor-pointer' 
                  : 'text-slate-300 cursor-not-allowed opacity-40 border-transparent'
              }`}
              title={canValidate ? 'Validasi & Tanda Tangani' : `Hanya Wali Kelas (${homeroomTeacher?.employee?.fullName || 'Wali Kelas'}) atau Kepala Sekolah yang dapat memvalidasi`}
            >
              <CheckCircle size={16} />
            </button>
          )}
          <button 
            type="button"
            onClick={() => {
              if (!canValidate) {
                notify.error('Hanya Wali Kelas untuk kelas ini atau Kepala Sekolah yang dapat mengubah catatan/absensi.');
                return;
              }
              openEditModal(row);
            }}
            disabled={!canValidate}
            className={`p-2 rounded-xl transition-all border ${
              canValidate 
                ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-200 cursor-pointer' 
                : 'text-slate-300 cursor-not-allowed opacity-40 border-transparent'
            }`}
            title={canValidate ? 'Isi Catatan & Absensi' : 'Hanya Wali Kelas atau Kepala Sekolah yang dapat mengubah catatan'}
          >
            <Edit2 size={16} />
          </button>
          <button 
            type="button"
            onClick={() => exportPdf(row.id, row.student.fullName)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-200 cursor-pointer shadow-sm"
            title="Cetak Dokumen PDF Rapor"
          >
            <Printer size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      <PageHeader
        title="Cetak Rapor & Pengesahan"
        subtitle="Kelola dan sahkan dokumen rapor hasil belajar siswa per kelas."
      />

      {/* Filter Section (Glassmorphism Standard - No Header, Icon Group Focus) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tahun Ajaran</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate" 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
              >
                <option value="">Pilih Tahun Ajaran...</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Semester</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate disabled:opacity-50 disabled:cursor-not-allowed" 
                value={selectedSemester} 
                onChange={e => setSelectedSemester(e.target.value)}
                disabled={!selectedYear}
              >
                <option value="">Pilih Semester...</option>
                {semesters.filter(s => s.academicYearId === selectedYear).map(s => <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Kelas / Rombel</label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select 
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium truncate" 
                value={selectedClassroom} 
                onChange={e => setSelectedClassroom(e.target.value)}
              >
                <option value="">Pilih Kelas</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Table Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Daftar Rapor Siswa</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedClassroom 
                ? `${classrooms.find(c => c.id === selectedClassroom)?.name || 'Kelas'} • Wali Kelas: ${homeroomTeacher?.employee?.fullName || 'Belum Ditugaskan'} • Total ${reportCards.length} siswa`
                : 'Pilih Tahun Ajaran, Semester, dan Kelas untuk menampilkan dan mengelola dokumen rapor.'}
            </p>
          </div>

          {selectedClassroom && (
            <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
              <button 
                type="button"
                className="btn-std-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-sm cursor-pointer"
                onClick={handleGenerate}
                disabled={loading || !canManageReports}
                title={!canManageReports ? `Hanya Wali Kelas (${homeroomTeacher?.employee?.fullName || 'Wali Kelas'}), Kepala Sekolah, atau Admin yang dapat men-generate rapor kelas ini` : undefined}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                <span>Generate Rapor Kelas</span>
              </button>
              
              {isPrincipal && (
                <button 
                  type="button"
                  className={`btn-std-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer ${isClassroomApproved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  onClick={handleApproveClassroom}
                  disabled={loading || isClassroomApproved}
                >
                  <CheckCircle size={14} />
                  <span>{isClassroomApproved ? 'Telah Disahkan (KS)' : 'Sahkan Rapor Kelas'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {reportCards.length === 0 && !loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4 shadow-sm text-indigo-600">
                <FileText size={30} />
             </div>
             <div className="text-lg font-bold text-slate-800">Belum Ada Rapor</div>
             <div className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
               Belum ada rapor di kelas ini. Silakan tekan tombol "Generate Rapor Kelas" untuk menghitung nilai akhir.
             </div>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={reportCards} 
            loading={loading} 
            emptyMessage="Belum ada data rapor." 
          />
        )}
      </div>

      <Modal open={modal.open} onClose={closeEditModal} title="Edit Kehadiran & Catatan">
        <form onSubmit={saveNotes} className="flex flex-col gap-4 p-6">
          <div className="text-sm text-slate-600 flex items-center gap-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <User size={18} className="text-indigo-600" />
            <span>Siswa: <strong className="text-indigo-900">{modal.editCard?.student?.fullName}</strong></span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-2">
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
              className="input-std min-h-[90px] resize-none"
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

      {/* Dialog Konfirmasi Terstandarisasi */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
};
