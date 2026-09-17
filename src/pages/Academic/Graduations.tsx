import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Award, 
  Undo2, 
  Users, 
  FileText, 
  Loader2, 
  CheckSquare, 
  Calendar, 
  AlertTriangle,
  FileCheck,
  Search,
  RotateCcw
} from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { useGraduations } from '../../hooks/useGraduations';
import { PageHeader, Modal, FormField, Select, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { Can } from '../../components/Common/Can';
import { notify } from '../../utils/feedback';

export const Graduations: React.FC = () => {
  const {
    graduationsHistory,
    loading,
    classes,
    academicYears,
    sourceStudents,
    selectedAcademicYear,
    setSelectedAcademicYear,
    loadStudents,
    batchGraduate,
    cancelGraduation
  } = useGraduations();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  
  // Batch Graduate Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [graduationDate, setGraduationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  const handleOpenModal = () => {
    setSelectedClass('');
    setDocumentNumber('');
    setGraduationDate(new Date().toISOString().split('T')[0]);
    setSelectedStudentIds(new Set());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass('');
    setDocumentNumber('');
    setSelectedStudentIds(new Set());
    setSubmitting(false);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(new Set(sourceStudents.map(s => s.id.toString())));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    if (!classId) {
      setSelectedStudentIds(new Set());
      return;
    }
    try {
      setLoadingClassStudents(true);
      const students = await loadStudents(classId, selectedAcademicYear);
      setSelectedStudentIds(new Set(students.map((s: any) => s.id.toString())));
    } catch (err: any) {
      notify.error(err, 'Gagal memuat daftar siswa di kelas terpilih');
    } finally {
      setLoadingClassStudents(false);
    }
  };

  const handleAcademicYearChange = async (yearId: string) => {
    setSelectedAcademicYear(yearId);
    if (selectedClass) {
      try {
        setLoadingClassStudents(true);
        const students = await loadStudents(selectedClass, yearId);
        setSelectedStudentIds(new Set(students.map((s: any) => s.id.toString())));
      } catch (err: any) {
        notify.error(err, 'Gagal memuat daftar siswa');
      } finally {
        setLoadingClassStudents(false);
      }
    }
  };

  const handleBatchGraduateSubmit = () => {
    if (!selectedClass || !graduationDate) {
      notify.warning('Rombel kelas akhir dan tanggal kelulusan wajib diisi');
      return;
    }
    if (selectedStudentIds.size === 0) {
      notify.warning('Pilih minimal satu siswa untuk diproses kelulusannya');
      return;
    }

    const className = classes.find(c => c.id === selectedClass)?.name || 'Kelas Terpilih';
    const yearName = academicYears.find((ay: any) => ay.id === selectedAcademicYear)?.name || '';

    setConfirmConfig({
      open: true,
      variant: 'info',
      title: `Pelepasan Alumni (${selectedStudentIds.size} Siswa)`,
      message: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Apakah Anda yakin ingin meluluskan <strong>{selectedStudentIds.size} siswa</strong> dari kelas <strong>{className}</strong>?
          </p>
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-gray-500">Kelas Asal:</span>
              <span className="text-gray-900 font-semibold">{className}</span>
            </div>
            {yearName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tahun Ajaran:</span>
                <span className="text-gray-900 font-semibold">{yearName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Kelulusan:</span>
              <span className="text-indigo-700 font-semibold">{new Date(graduationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            {documentNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">No. SK / Ijazah:</span>
                <span className="text-gray-900 font-mono font-semibold">{documentNumber}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Perhatian: Siswa yang diluluskan akan diubah statusnya menjadi <strong>Alumni</strong> dan tidak lagi terdaftar pada rombel operasional aktif.
          </p>
        </div>
      ),
      confirmText: 'Ya, Proses Kelulusan',
      onConfirm: async () => {
        const payload = {
          classroomId: selectedClass,
          academicYearId: selectedAcademicYear,
          graduationDate: new Date(graduationDate).toISOString(),
          certificateNumber: documentNumber.trim() || undefined,
          notes: undefined,
          studentIds: Array.from(selectedStudentIds)
        };

        try {
          setSubmitting(true);
          await batchGraduate(payload);
          notify.success(`Proses kelulusan berhasil! ${selectedStudentIds.size} siswa kini resmi berstatus Alumni.`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
          handleCloseModal();
        } catch (err: any) {
          notify.error(err, 'Gagal memproses kelulusan siswa');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleCancelGraduation = (row: any) => {
    const studentName = row.student?.fullName || row.student?.name || 'Siswa';
    const className = row.classroom?.name || 'Kelas';

    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Batalkan Kelulusan "${studentName}"`,
      message: (
        <div>
          Apakah Anda yakin ingin membatalkan status kelulusan untuk{' '}
          <strong className="text-gray-900 font-semibold">{studentName}</strong>?
          <p className="mt-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Siswa akan dikembalikan statusnya menjadi <strong>Siswa Aktif</strong> di kelas {className}.
          </p>
        </div>
      ),
      confirmText: 'Ya, Batalkan Kelulusan',
      onConfirm: async () => {
        try {
          await cancelGraduation(row.id);
          notify.success(`Status kelulusan "${studentName}" berhasil dibatalkan. Siswa kembali aktif.`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal membatalkan status kelulusan');
        }
      }
    });
  };

  // Dropdown options
  const academicYearOptions = useMemo(() => [
    { value: '', label: 'Semua Tahun Ajaran' },
    ...academicYears.map((ay: any) => ({
      value: ay.id,
      label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}`
    }))
  ], [academicYears]);

  const modalAyOptions = useMemo(() => [
    { value: '', label: '-- Pilih Tahun Ajaran --' },
    ...academicYears.map((ay: any) => ({
      value: ay.id,
      label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}`
    }))
  ], [academicYears]);

  const classOptions = useMemo(() => [
    { value: '', label: '-- Pilih Kelas Akhir --' },
    ...classes.map(c => ({
      value: c.id,
      label: c.name
    }))
  ], [classes]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return graduationsHistory.filter(item => {
      const studentName = (item.student?.fullName || item.student?.name || '').toLowerCase();
      const studentNis = (item.student?.nis || item.student?.nisn || '').toLowerCase();
      const docNum = (item.certificateNumber || '').toLowerCase();
      const className = (item.classroom?.name || '').toLowerCase();
      const sTerm = searchTerm.toLowerCase().trim();

      const matchSearch = !sTerm || 
        studentName.includes(sTerm) || 
        studentNis.includes(sTerm) ||
        docNum.includes(sTerm) ||
        className.includes(sTerm);

      const itemYearId = item.academicYearId || item.academicYear?.id;
      const matchYear = !filterYear || itemYearId === filterYear;

      return matchSearch && matchYear;
    });
  }, [graduationsHistory, searchTerm, filterYear]);

  const columns: Column<any>[] = [
    { 
      key: 'student', 
      header: 'Siswa (Alumni)', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <GraduationCap size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <span 
              className="font-semibold text-gray-900 block max-w-[200px] md:max-w-[280px] truncate"
              title={row.student?.fullName || row.student?.name}
            >
              {row.student?.fullName || row.student?.name || 'Siswa tidak ditemukan'}
            </span>
            <span className="font-mono text-xs text-gray-500">
              {row.student?.nis || row.student?.nisn || '-'}
            </span>
          </div>
        </div>
      )
    },
    { 
      key: 'class', 
      header: 'Kelas Terakhir', 
      render: (row) => (
        <span 
          className="text-gray-800 font-medium text-xs bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 block max-w-[130px] truncate"
          title={row.classroom?.name}
        >
          {row.classroom?.name || '-'}
        </span>
      )
    },
    { 
      key: 'date', 
      header: 'Tanggal Lulus', 
      render: (row) => (
        <span className="text-xs text-gray-600 font-medium">
          {new Date(row.graduationDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    { 
      key: 'document', 
      header: 'No. SK / Ijazah', 
      render: (row) => (
        row.certificateNumber ? (
          <span 
            className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 block max-w-[180px] truncate"
            title={row.certificateNumber}
          >
            {row.certificateNumber}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Belum diinput</span>
        )
      )
    },
    { 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => (
        <Can permissions={['graduations.delete', 'academic.write']}>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleCancelGraduation(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors shadow-xs"
              title="Batalkan Status Kelulusan Siswa"
            >
              <Undo2 size={13} /> Batal Lulus
            </button>
          </div>
        </Can>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Kelulusan & Alumni" 
        subtitle="Daftar alumni dan proses pelepasan kelulusan siswa"
        action={
          <Can permissions={['graduations.execute', 'academic.write']}>
            <button 
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors" 
              onClick={handleOpenModal}
            >
              <Award size={16} />
              <span>Proses Kelulusan Baru</span>
            </button>
          </Can>
        }
      />

      {/* 2. Filter Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Alumni
          </label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari nama alumni, NIS, kelas, atau no. ijazah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tahun Ajaran Kelulusan
          </label>
          <div className="relative group">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
            >
              {academicYearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end mb-1">
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-indigo-600" />
            Total: {filteredHistory.length} Alumni
          </span>
        </div>

        {Boolean(searchTerm || filterYear) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterYear('');
            }}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable 
          columns={columns} 
          data={filteredHistory} 
          loading={loading}
          emptyMessage={
            searchTerm || filterYear
              ? 'Tidak ada data alumni yang cocok dengan pencarian.'
              : 'Belum ada data kelulusan / alumni. Klik "Proses Kelulusan Baru" untuk memulai.'
          }
        />
      </div>

      {/* 4. Batch Processing Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Proses Kelulusan Siswa (Batch)"
        size="lg"
      >
        <div className="p-6 flex flex-col gap-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs md:text-sm leading-relaxed">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              Siswa yang diluluskan akan diubah statusnya menjadi <strong>Alumni</strong> (tidak lagi aktif dalam rombel kelas). Pastikan Anda telah menyelesaikan administrasi nilai raport dan ijazah sebelum memproses.
            </div>
          </div>

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Tahun Ajaran" required>
              <Select
                wrapperClassName="w-full"
                value={selectedAcademicYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                options={modalAyOptions}
                required
              />
            </FormField>
            
            <FormField label="Kelas Akhir" required>
              <Select
                wrapperClassName="w-full"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                options={classOptions}
                required
              />
            </FormField>

            <FormField label="Tanggal Kelulusan" required>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-gray-800"
                value={graduationDate}
                onChange={(e) => setGraduationDate(e.target.value)}
                required
              />
            </FormField>

            <FormField label="No. SK / Ijazah (Opsional)">
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-gray-800"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Misal: 421/SK-LULUS/2026"
              />
            </FormField>
          </div>

          {/* Student Checkbox Table */}
          {loadingClassStudents ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 text-xs gap-2">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span>Memuat daftar siswa di kelas akhir...</span>
            </div>
          ) : sourceStudents.length > 0 ? (
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="select-all-students"
                    className="rounded w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    checked={selectedStudentIds.size === sourceStudents.length && sourceStudents.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <label htmlFor="select-all-students" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Pilih Semua Siswa
                  </label>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedStudentIds.size} dari {sourceStudents.length} siswa dipilih
                </span>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                {sourceStudents.map(student => {
                  const isSelected = selectedStudentIds.has(student.id.toString());
                  return (
                    <div 
                      key={student.id} 
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50/60'
                      }`}
                      onClick={() => handleStudentToggle(student.id.toString())}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300"
                        checked={isSelected}
                        onChange={() => handleStudentToggle(student.id.toString())}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 text-xs md:text-sm block truncate" title={student.fullName}>
                          {student.fullName}
                        </span>
                        <span className="font-mono text-[11px] text-gray-500">
                          {student.nis || student.nisn || '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedClass ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs">
              <Users size={28} className="mx-auto opacity-20 mb-2" />
              <span>Tidak ada siswa aktif terdaftar di kelas akhir ini.</span>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs">
              <GraduationCap size={28} className="mx-auto opacity-20 mb-2" />
              <span>Pilih Kelas Akhir di atas untuk memuat daftar calon alumni.</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500">
              {selectedStudentIds.size > 0 && `${selectedStudentIds.size} siswa terpilih`}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchGraduateSubmit}
                disabled={selectedStudentIds.size === 0 || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Award size={16} />
                    <span>Proses Kelulusan ({selectedStudentIds.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 5. Standard ConfirmDialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
