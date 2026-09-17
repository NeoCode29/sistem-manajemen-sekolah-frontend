import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Info, 
  Calendar,
  Search,
  Filter,
  RotateCcw,
  Library
} from 'lucide-react';
import { useSemesters } from '../../hooks/useSemesters';
import { usePermissions } from '../../hooks/usePermissions';
import type { Semester } from '../../api/academicService';
import { PageHeader, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { notify } from '../../utils/feedback';

export const Semesters: React.FC = () => {
  const {
    semesters,
    academicYears,
    loading,
    toggleSemesterActive,
  } = useSemesters();
  const { canManageAcademic, hasPermission } = usePermissions();
  const canToggleSemester = hasPermission('semesters.toggle_active') || hasPermission('semesters.update') || canManageAcademic;

  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [semesterTypeFilter, setSemesterTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    variant: 'warning',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  // Group semesters by Academic Year, sorted chronologically descending
  const groupedData = useMemo(() => {
    const yearMap = new Map<string, { year: any; semesters: Semester[] }>();

    academicYears.forEach((ay) => {
      yearMap.set(ay.id.toString(), {
        year: ay,
        semesters: [],
      });
    });

    semesters.forEach((sem) => {
      const yId = (sem.academicYearId || sem.academicYear?.id)?.toString();
      if (yId && yearMap.has(yId)) {
        yearMap.get(yId)!.semesters.push(sem);
      } else if (yId) {
        yearMap.set(yId, {
          year: sem.academicYear || { id: yId, name: 'Tahun Ajaran ' + yId, isActive: false },
          semesters: [sem],
        });
      }
    });

    // Sort academic years descending by name (e.g. 2030/2031, 2029/2030)
    const list = Array.from(yearMap.values()).sort((a, b) => 
      (b.year.name || '').localeCompare(a.year.name || '')
    );

    // Within each year, sort semesters: Ganjil first, then Genap
    list.forEach((item) => {
      item.semesters.sort((a, b) => a.name.localeCompare(b.name));
    });

    return list;
  }, [academicYears, semesters]);

  // Filtered data based on dropdown & search
  const filteredGroups = useMemo(() => {
    return groupedData
      .map((item) => {
        let matchingSemesters = item.semesters;
        if (semesterTypeFilter !== 'ALL') {
          matchingSemesters = matchingSemesters.filter(
            s => s.name.trim().toLowerCase() === semesterTypeFilter.toLowerCase()
          );
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchYear = item.year.name.toLowerCase().includes(q);
          if (!matchYear) {
            matchingSemesters = matchingSemesters.filter(s => s.name.toLowerCase().includes(q));
          }
        }
        return {
          ...item,
          semesters: matchingSemesters,
        };
      })
      .filter((item) => {
        const matchYearFilter =
          selectedYearFilter === 'ALL' || item.year.id.toString() === selectedYearFilter;
        return matchYearFilter && item.semesters.length > 0;
      });
  }, [groupedData, selectedYearFilter, semesterTypeFilter, searchTerm]);

  const yearOptions = useMemo(() => [
    { value: 'ALL', label: 'Semua Tahun Ajaran' },
    ...academicYears.map(ay => ({
      value: ay.id.toString(),
      label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}`
    }))
  ], [academicYears]);

  const handleToggle = (semester: Semester, yearName?: string) => {
    if (semester.isActive) return;

    const yName = yearName || semester.academicYear?.name || 'terpilih';
    setConfirmConfig({
      open: true,
      variant: 'warning',
      title: `Aktifkan Semester ${semester.name}`,
      message: `Apakah Anda yakin ingin mengaktifkan Semester ${semester.name} untuk Tahun Ajaran ${yName}? Mengaktifkan semester ini akan otomatis menjadikan Tahun Ajaran ${yName} sebagai periode akademik aktif di seluruh sistem.`,
      confirmText: 'Ya, Aktifkan Semester',
      onConfirm: async () => {
        try {
          await toggleSemesterActive(semester.id);
          notify.success(`Semester ${semester.name} (${yName}) berhasil diaktifkan!`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal mengubah status semester');
        }
      }
    });
  };

  const activeSemester = semesters.find(s => s.isActive);

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Semester"
        subtitle="Kelola status aktif semester akademik per Tahun Ajaran"
      />

      {/* Information Banner */}
      <div className="p-4 bg-blue-50/80 backdrop-blur-sm text-blue-900 border border-blue-200 rounded-2xl flex items-start gap-3 text-sm leading-relaxed shadow-xs">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Informasi Master Semester</span>
          Setiap Tahun Ajaran memiliki dua semester bawaan (<strong>Ganjil</strong> dan <strong>Genap</strong>) yang dibuat secara otomatis. Pilih tombol <strong>Aktifkan</strong> pada semester yang diinginkan untuk beralih periode semester yang sedang berjalan.
        </div>
      </div>

      {/* 3. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Semester
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari semester atau tahun ajaran..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-56 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tahun Ajaran
          </label>
          <div className="relative group">
            <Calendar 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
            >
              {yearOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full sm:w-44 min-w-[150px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tipe Semester
          </label>
          <div className="relative group">
            <Filter 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
              value={semesterTypeFilter}
              onChange={(e) => setSemesterTypeFilter(e.target.value)}
            >
              <option value="ALL">Semua Tipe</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>

        {(selectedYearFilter !== 'ALL' || semesterTypeFilter !== 'ALL' || Boolean(searchTerm)) && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedYearFilter('ALL');
                setSemesterTypeFilter('ALL');
                setSearchTerm('');
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-100">
          Memuat data semester...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 text-gray-500">
          Tidak ada data semester yang sesuai dengan filter.
        </div>
      ) : (
        /* CARDS VIEW: Grouped by Academic Year */
        <div className="space-y-4">
          {filteredGroups.map(({ year, semesters: yearSemesters }) => {
            const isYearActive = year.isActive;
            const ganjil = yearSemesters.find((s) => s.name.trim().toLowerCase() === 'ganjil');
            const genap = yearSemesters.find((s) => s.name.trim().toLowerCase() === 'genap');

            return (
              <div
                key={year.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  isYearActive
                    ? 'border-emerald-300 ring-2 ring-emerald-100/80 bg-gradient-to-b from-emerald-50/20 to-white'
                    : 'border-gray-200'
                }`}
              >
                {/* Year Header */}
                <div
                  className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
                    isYearActive
                      ? 'bg-emerald-50/60 border-emerald-100'
                      : 'bg-gray-50/80 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isYearActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">
                          Tahun Ajaran {year.name}
                        </span>
                        {isYearActive && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Tahun Ajaran Aktif
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {yearSemesters.length} semester terdaftar
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400">
                    ID: {year.id}
                  </span>
                </div>

                {/* Semesters Pair Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Semester Ganjil Panel */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      ganjil?.isActive
                        ? 'bg-emerald-50/80 border-emerald-200 shadow-sm'
                        : 'bg-gray-50/50 border-gray-200/80 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          ganjil?.isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-700'
                        }`}
                      >
                        1
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <span>Semester Ganjil</span>
                          <Badge variant={ganjil?.isActive ? 'success' : 'default'}>
                            {ganjil?.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          Semester 1 Periode Awal ({year.name})
                        </span>
                      </div>
                    </div>

                    {canToggleSemester && ganjil && (
                      <div>
                        {ganjil.isActive ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300">
                            <CheckCircle2 size={15} className="text-emerald-600" />
                            <span>Sedang Berjalan</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggle(ganjil, year.name)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-gray-700 font-medium text-xs border border-gray-300 shadow-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer"
                            title="Aktifkan Semester Ganjil"
                          >
                            <CheckCircle2 size={14} className="text-gray-400" />
                            <span>Aktifkan</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Semester Genap Panel */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      genap?.isActive
                        ? 'bg-emerald-50/80 border-emerald-200 shadow-sm'
                        : 'bg-gray-50/50 border-gray-200/80 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          genap?.isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-700'
                        }`}
                      >
                        2
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <span>Semester Genap</span>
                          <Badge variant={genap?.isActive ? 'success' : 'default'}>
                            {genap?.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          Semester 2 Periode Akhir ({year.name})
                        </span>
                      </div>
                    </div>

                    {canToggleSemester && genap && (
                      <div>
                        {genap.isActive ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300">
                            <CheckCircle2 size={15} className="text-emerald-600" />
                            <span>Sedang Berjalan</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggle(genap, year.name)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-gray-700 font-medium text-xs border border-gray-300 shadow-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer"
                            title="Aktifkan Semester Genap"
                          >
                            <CheckCircle2 size={14} className="text-gray-400" />
                            <span>Aktifkan</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Confirm Dialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

