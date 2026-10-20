import React, { useEffect, useState, useMemo } from 'react';
import { getEmployees } from '../../api/employeeService';
import { getEmployeeAttendances, upsertEmployeeAttendanceBatch, getAttendanceSetting, type EmployeeAttendance, type EmployeeAttendanceBatchItem } from '../../api/attendanceService';
import { Save, Calendar, Search, CheckCircle2, Clock, UserCheck, AlertTriangle, Users, RotateCcw, Tv, ExternalLink } from 'lucide-react';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePermissions } from '../../hooks/usePermissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { notify, parseApiError } from '../../utils/feedback';
import { getLocalDateString } from '../../utils/constants';

interface AttendanceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  nip: string;
  status: string;
  checkinTime: string;
  checkoutTime: string;
  notes: string;
}

export const EmployeeAttendancePage: React.FC = () => {
  const { canRecordEmployeeAttendance, canReadEmployeeAttendance } = usePermissions();

  const [date, setDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'recap'>('input');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isManualEnabled, setIsManualEnabled] = useState(true);
  
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [originalRows, setOriginalRows] = useState<AttendanceRow[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (date) {
      fetchAttendanceData();
    }
  }, [date]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      const [employeesData, attendancesData, settingData] = await Promise.all([
        getEmployees(),
        getEmployeeAttendances({ date }),
        getAttendanceSetting().catch(() => null),
      ]);

      if (settingData) {
        setIsManualEnabled(settingData.employeeManualEnabled ?? true);
      }
      
      // Filter active employees
      const activeEmployees = employeesData.filter(emp => emp.isActive);
      
      const attendanceMap = new Map<string, EmployeeAttendance>();
      attendancesData.forEach((att: EmployeeAttendance) => {
        attendanceMap.set(att.employeeId, att);
      });
      
      const newRows: AttendanceRow[] = activeEmployees.map(emp => {
        const att = attendanceMap.get(emp.id);
        return {
          id: emp.id,
          employeeId: emp.id,
          employeeName: emp.fullName,
          nip: emp.employeeNumber || '-',
          status: att ? att.status : 'Belum Absen',
          checkinTime: att?.checkinTime || '',
          checkoutTime: att?.checkoutTime || '',
          notes: att?.notes || ''
        };
      });
      
      setRows(newRows);
      setOriginalRows(JSON.parse(JSON.stringify(newRows)));
    } catch (err: any) {
      notify.error(parseApiError(err, 'Gagal memuat data absensi pegawai'));
      setRows([]);
      setOriginalRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof AttendanceRow, value: string) => {
    const updatedRows = [...rows];
    const updatedRow = { ...updatedRows[index], [field]: value };
    
    if (field === 'status') {
      if (value === 'Hadir' || value === 'Terlambat') {
        if (!updatedRow.checkinTime) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          updatedRow.checkinTime = `${hh}:${mm}`;
        }
      } else {
        updatedRow.checkinTime = '';
        updatedRow.checkoutTime = '';
      }
    }
    
    updatedRows[index] = updatedRow;
    setRows(updatedRows);
  };

  const handleSetAllPresent = () => {
    if (!canRecordEmployeeAttendance || !isManualEnabled) {
      notify.error('Anda tidak memiliki izin atau metode pencatatan manual sedang dinonaktifkan.');
      return;
    }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    const updated = rows.map(r => {
      if (r.status === 'Belum Absen') {
        return {
          ...r,
          status: 'Hadir',
          checkinTime: r.checkinTime || currentTime
        };
      }
      return r;
    });

    setRows(updated);
    notify.info('Pegawai yang belum absen telah diset Hadir dengan jam saat ini.');
  };

  const handleReset = () => {
    if (!canRecordEmployeeAttendance || !isManualEnabled) return;
    setRows(JSON.parse(JSON.stringify(originalRows)));
    notify.info('Perubahan status telah dikembalikan ke kondisi awal.');
  };

  const handleOpenConfirm = () => {
    if (!canRecordEmployeeAttendance || !isManualEnabled) {
      notify.error('Anda tidak memiliki izin untuk menyimpan presensi pegawai.');
      return;
    }
    if (!date) {
      notify.error('Harap pilih tanggal presensi.');
      return;
    }
    const attendances = rows.filter(r => r.status !== 'Belum Absen');
    if (attendances.length === 0) {
      notify.error('Tidak ada perubahan status presensi untuk disimpan.');
      return;
    }
    setConfirmOpen(true);
  };

  const handleExecuteSave = async () => {
    if (!canRecordEmployeeAttendance || !isManualEnabled) {
      notify.error('Anda tidak memiliki izin untuk menyimpan presensi pegawai.');
      return;
    }
    try {
      setSaving(true);
      
      const attendances: EmployeeAttendanceBatchItem[] = rows
        .filter(r => r.status !== 'Belum Absen')
        .map(r => {
          const isPresent = r.status === 'Hadir' || r.status === 'Terlambat';
          return {
            employeeId: r.employeeId,
            status: r.status,
            checkinTime: isPresent ? (r.checkinTime || undefined) : undefined,
            checkoutTime: isPresent ? (r.checkoutTime || undefined) : undefined,
            notes: r.notes || undefined
          };
        });
      
      await upsertEmployeeAttendanceBatch(date, attendances);
      notify.success(`Data absensi untuk ${attendances.length} pegawai berhasil disimpan!`);
      setConfirmOpen(false);
      await fetchAttendanceData();
    } catch (err: any) {
      notify.error(parseApiError(err, 'Gagal menyimpan absensi pegawai'));
    } finally {
      setSaving(false);
    }
  };

  // KPI calculations
  const totalEmployees = rows.length;
  const countPresent = rows.filter(r => r.status === 'Hadir').length;
  const countLate = rows.filter(r => r.status === 'Terlambat').length;
  const countLeave = rows.filter(r => r.status === 'Sakit' || r.status === 'Izin' || r.status === 'Cuti').length;
  const countAlphaUnrecorded = rows.filter(r => r.status === 'Alpa' || r.status === 'Belum Absen').length;

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Hadir': return 'success';
      case 'Terlambat': return 'warning';
      case 'Sakit':
      case 'Izin':
      case 'Cuti': return 'info';
      case 'Alpa': return 'danger';
      default: return 'default';
    }
  };

  // Search filtering
  const filteredRows = rows.filter(r => {
    const matchesSearch = 
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nip.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const isDirty = useMemo(() => {
    return JSON.stringify(rows) !== JSON.stringify(originalRows);
  }, [rows, originalRows]);

  const formattedDate = date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const inputColumns: Column<AttendanceRow>[] = [
    {
      key: 'no',
      header: 'No',
      width: '48px',
      className: 'text-center font-mono text-xs text-gray-400',
      headerClassName: 'w-12 text-center',
      sortable: false,
      render: (_row, index) => (index !== undefined ? index + 1 : '-')
    },
    {
      key: 'nip',
      header: 'NIP',
      width: '130px',
      className: 'font-mono text-xs text-gray-500',
      sortable: false,
      render: (row) => row.nip
    },
    {
      key: 'employeeName',
      header: 'Nama Pegawai',
      sortable: false,
      render: (row) => (
        <span className="font-bold text-gray-800 truncate block max-w-[220px]" title={row.employeeName}>
          {row.employeeName}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '190px',
      sortable: false,
      render: (row) => {
        const originalIndex = rows.findIndex(r => r.employeeId === row.employeeId);
        return (
          <select 
            disabled={!canRecordEmployeeAttendance || !isManualEnabled}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold outline-none transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent ${
              canRecordEmployeeAttendance && isManualEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
            } ${
              row.status === 'Belum Absen' ? 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400/50' :
              row.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400/50' :
              row.status === 'Terlambat' ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-400/50' :
              row.status === 'Izin' ? 'bg-sky-50 text-sky-700 border-sky-300 focus:ring-sky-400/50' :
              row.status === 'Sakit' ? 'bg-indigo-50 text-indigo-700 border-indigo-300 focus:ring-indigo-400/50' :
              row.status === 'Cuti' ? 'bg-purple-50 text-purple-700 border-purple-300 focus:ring-purple-400/50' :
              'bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-400/50'
            }`}
            value={row.status}
            onChange={(e) => handleRowChange(originalIndex, 'status', e.target.value)}
          >
            <option value="Belum Absen">Belum Absen</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Cuti">Cuti</option>
            <option value="Alpa">Alpa</option>
          </select>
        );
      }
    },
    {
      key: 'checkinTime',
      header: 'Jam Masuk',
      width: '120px',
      sortable: false,
      render: (row) => {
        const originalIndex = rows.findIndex(r => r.employeeId === row.employeeId);
        const isPresent = row.status === 'Hadir' || row.status === 'Terlambat';
        return (
          <input 
            type="time" 
            disabled={!canRecordEmployeeAttendance || !isManualEnabled || !isPresent}
            className={`input-std py-1 px-2.5 text-xs w-full ${!isPresent || !canRecordEmployeeAttendance || !isManualEnabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
            value={row.checkinTime}
            onChange={(e) => handleRowChange(originalIndex, 'checkinTime', e.target.value)}
          />
        );
      }
    },
    {
      key: 'checkoutTime',
      header: 'Jam Pulang',
      width: '120px',
      sortable: false,
      render: (row) => {
        const originalIndex = rows.findIndex(r => r.employeeId === row.employeeId);
        const isPresent = row.status === 'Hadir' || row.status === 'Terlambat';
        return (
          <input 
            type="time" 
            disabled={!canRecordEmployeeAttendance || !isManualEnabled || !isPresent}
            className={`input-std py-1 px-2.5 text-xs w-full ${!isPresent || !canRecordEmployeeAttendance || !isManualEnabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
            value={row.checkoutTime}
            onChange={(e) => handleRowChange(originalIndex, 'checkoutTime', e.target.value)}
          />
        );
      }
    },
    {
      key: 'notes',
      header: 'Keterangan',
      sortable: false,
      render: (row) => {
        const originalIndex = rows.findIndex(r => r.employeeId === row.employeeId);
        return (
          <input 
            type="text" 
            disabled={!canRecordEmployeeAttendance || !isManualEnabled}
            className={`input-std py-1.5 px-3 text-xs shadow-sm w-full transition-colors ${
              canRecordEmployeeAttendance && isManualEnabled ? 'bg-white/70 focus:bg-white' : 'bg-gray-100 cursor-not-allowed opacity-80'
            }`}
            value={row.notes}
            onChange={(e) => handleRowChange(originalIndex, 'notes', e.target.value)}
            placeholder={canRecordEmployeeAttendance && isManualEnabled ? "Keterangan opsional..." : "-"}
          />
        );
      }
    }
  ];

  const recapColumns: Column<AttendanceRow>[] = [
    {
      key: 'no',
      header: 'No',
      width: '48px',
      className: 'text-center font-mono text-xs text-gray-400',
      headerClassName: 'w-12 text-center',
      sortable: false,
      render: (_row, index) => (index !== undefined ? index + 1 : '-')
    },
    {
      key: 'nip',
      header: 'NIP',
      width: '130px',
      className: 'font-mono text-xs text-gray-500',
      sortValue: (row) => row.nip,
      render: (row) => row.nip
    },
    {
      key: 'employeeName',
      header: 'Nama Pegawai',
      sortValue: (row) => row.employeeName,
      render: (row) => (
        <span className="font-bold text-gray-800 truncate block max-w-[240px]" title={row.employeeName}>
          {row.employeeName}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      sortValue: (row) => row.status,
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'checkinTime',
      header: 'Jam Masuk',
      width: '110px',
      sortValue: (row) => row.checkinTime || '',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600">
          {row.checkinTime || '-'}
        </span>
      )
    },
    {
      key: 'checkoutTime',
      header: 'Jam Pulang',
      width: '110px',
      sortValue: (row) => row.checkoutTime || '',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600">
          {row.checkoutTime || '-'}
        </span>
      )
    },
    {
      key: 'notes',
      header: 'Keterangan',
      sortValue: (row) => row.notes || '',
      render: (row) => (
        <span className="truncate block max-w-[280px] text-xs text-gray-600" title={row.notes || '-'}>
          {row.notes || '-'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Presensi Pegawai & Guru"
        subtitle="Kelola dan pantau kehadiran harian staf dan dewan pengajar"
        action={
          <a
            href="/kiosk/attendance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm transition-all shadow-sm hover:shadow group"
          >
            <Tv size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span>Layar Monitor Kiosk</span>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-white transition-colors" />
          </a>
        }
      />

      {/* 2. Filter Bar Terintegrasi (Glassmorphism Standard) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end justify-between">
        <div className="w-full sm:w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Tanggal Presensi
          </label>
          <div className="relative group">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 min-w-[260px] max-w-lg">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Pegawai / Guru
          </label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-gray-400"
              placeholder="Cari nama guru atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {Boolean(searchTerm) && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* 3. Kartu Ringkasan KPI Guru */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Pegawai</p>
            <p className="text-xl font-bold text-slate-800">{totalEmployees}</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Hadir</p>
            <p className="text-xl font-bold text-emerald-800">{countPresent}</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-amber-600 font-medium">Terlambat</p>
            <p className="text-xl font-bold text-amber-800">{countLate}</p>
          </div>
        </div>

        <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-sky-600 font-medium">Izin / Cuti</p>
            <p className="text-xl font-bold text-sky-800">{countLeave}</p>
          </div>
        </div>

        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-rose-600 font-medium">Alpa / Belum</p>
            <p className="text-xl font-bold text-rose-800">{countAlphaUnrecorded}</p>
          </div>
        </div>
      </div>

      {/* Peringatan jika metode presensi manual pegawai dinonaktifkan */}
      {!isManualEnabled && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-amber-900 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-amber-950">Pencatatan Presensi Manual Pegawai Sedang Dinonaktifkan</p>
            <p className="text-amber-800/90 mt-0.5">
              Pihak sekolah mengalihkan absensi pegawai ke metode aktif lainnya (seperti Kartu RFID / Mandiri GPS). Aksi simpan manual disembunyikan.
            </p>
          </div>
        </div>
      )}

      {/* Peringatan jika pengguna hanya memiliki izin lihat (Hanya-Baca) */}
      {!canRecordEmployeeAttendance && (
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-3 text-blue-900 shadow-xs animate-in fade-in duration-300">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <UserCheck size={18} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-blue-950">Mode Pratinjau (Hanya-Baca)</p>
            <p className="text-blue-800/90 mt-0.5">
              Anda memiliki hak akses untuk memantau rekapitulasi kehadiran pegawai & guru. Pengubahan data dibatasi hanya untuk administrator yang berwenang.
            </p>
          </div>
        </div>
      )}

      {/* 4. Toolbar Tabel Presensi Pegawai (Clean Standard) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sisi Kiri: Tab Pilihan Mode & Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'input' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pencatatan Presensi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recap')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recap' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rekap Pegawai
            </button>
          </div>
          {isDirty && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl animate-pulse">
              Perubahan belum disimpan
            </span>
          )}
        </div>

        {/* Sisi Kanan: Aksi Massal & Simpan */}
        {canRecordEmployeeAttendance && isManualEnabled && rows.length > 0 && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            {activeTab === 'input' && (
              <>
                <button
                  type="button"
                  onClick={handleSetAllPresent}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  Set Semua Hadir
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Kembalikan ke kondisi awal"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={saving || !isDirty}
              className={`inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 transition-all ${
                !isDirty ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Save size={15} className={saving ? 'animate-pulse' : ''} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Tabel Presensi Pegawai Terstandarisasi */}
      <DataTable 
        columns={activeTab === 'input' ? inputColumns : recapColumns}
        data={filteredRows}
        loading={loading}
        emptyMessage={
          searchTerm ? `Tidak ditemukan pegawai dengan pencarian "${searchTerm}".` : 'Tidak ada data pegawai aktif.'
        }
      />

      {/* 5. Dialog Konfirmasi Simpan Presensi Pegawai */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExecuteSave}
        variant="info"
        title="Konfirmasi Presensi Pegawai"
        message={`Apakah Anda yakin ingin menyimpan data absensi untuk dewan guru/pegawai pada tanggal ${date}? Data presensi yang telah terisi (${rows.filter(r => r.status !== 'Belum Absen').length} orang) akan diperbarui ke sistem.`}
        confirmText={saving ? 'Menyimpan...' : 'Ya, Simpan'}
      />
    </div>
  );
};
