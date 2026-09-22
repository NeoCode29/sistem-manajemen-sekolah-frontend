import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getScanLogs, getRecentScans, scanHardware } from '../../api/hardwareService';
import type { HardwareLog } from '../../api/hardwareService';
import { 
  Monitor, 
  RefreshCw, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Clock, 
  Fingerprint, 
  Activity, 
  Search, 
  RotateCcw,
  Smartphone,
  Zap,
  Loader2,
  XCircle
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Pagination } from '../../components/Common/Pagination';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const HardwareLogs: React.FC = () => {
  const { user } = useAuth();
  const { canReadHardwareLogs, hasPermission } = usePermissions();

  const isManagementRole = user?.roles?.some((r) =>
    ['Super Admin', 'Admin Sekolah', 'Kepala Sekolah', 'Staf TU'].includes(r.name),
  );

  const canReadLogs =
    canReadHardwareLogs ||
    isManagementRole ||
    hasPermission('hardware.read_logs') ||
    hasPermission('hardware.manage') ||
    hasPermission('attendance.read');

  const [logs, setLogs] = useState<HardwareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const intervalRef = useRef<number | ReturnType<typeof setInterval> | null>(null);

  // Live USB Scan State
  const [scanInput, setScanInput] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const keyBufferRef = useRef<{ buffer: string; lastTime: number }>({ buffer: '', lastTime: 0 });

  // Filters
  const [deviceId, setDeviceId] = useState('');
  const [scanType, setScanType] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCHED' | 'UNMATCHED'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchLogs();
    return () => stopLiveMode();
  }, []);

  // Global keydown listener for USB HID RFID readers in Live Mode
  useEffect(() => {
    if (!isLiveMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If currently typing in another input element, skip
      const activeElement = document.activeElement;
      if (activeElement === scannerInputRef.current) return;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT')
      ) {
        return;
      }

      // Enter key marks end of card scan
      if (e.key === 'Enter') {
        const code = keyBufferRef.current.buffer.trim();
        keyBufferRef.current = { buffer: '', lastTime: 0 };
        if (code.length >= 3) {
          e.preventDefault();
          handleLiveScan(code);
        }
        return;
      }

      // Fast burst keystroke accumulation (< 400ms between chars)
      if (e.key.length === 1) {
        const now = Date.now();
        if (now - keyBufferRef.current.lastTime > 500) {
          keyBufferRef.current.buffer = '';
        }
        keyBufferRef.current.buffer += e.key;
        keyBufferRef.current.lastTime = now;

        // Auto focus the input field for visual clarity
        if (scannerInputRef.current && document.activeElement !== scannerInputRef.current) {
          scannerInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLiveMode]);

  const fetchLogs = async () => {
    if (!canReadLogs) return;
    try {
      setLoading(true);
      const data = await getScanLogs({ deviceId, scanType, limit: 100 });
      setLogs(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err: any) {
      notify.error(err, 'Gagal memuat log mesin absensi');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOnly = async () => {
    if (!canReadLogs) return;
    try {
      const data = await getRecentScans(deviceId, scanType, 15);
      setLogs(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Live fetch failed', err);
    }
  };

  const toggleLiveMode = (e?: React.MouseEvent) => {
    if (e) {
      (e.currentTarget as HTMLElement)?.blur();
    }
    if (!canReadLogs) {
      notify.error(null, 'Anda tidak memiliki izin untuk memantau log mesin absensi');
      return;
    }
    if (isLiveMode) {
      stopLiveMode();
      notify.info('Mode live streaming dinonaktifkan');
    } else {
      setIsLiveMode(true);
      setLastScanResult(null);
      notify.success('Mode live streaming diaktifkan (Siap mendeteksi kartu RFID / Sidik Jari)');
      fetchRecentOnly();
      intervalRef.current = setInterval(() => {
        fetchRecentOnly();
      }, 3000);
      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 100);
    }
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleLiveScan = async (codeToScan?: string) => {
    if (!canReadLogs) {
      notify.error(null, 'Anda tidak memiliki izin untuk memproses pemindaian kartu');
      return;
    }
    const code = (codeToScan || scanInput).trim();
    if (!code) return;

    try {
      setIsProcessingScan(true);
      const result = await scanHardware({
        scanValue: code,
        scanType: 'CARD',
        deviceId: 'DESK-READER',
        mode: 'ATTENDANCE',
      });
      setLastScanResult(result);
      setScanInput('');

      if (result.success) {
        notify.success(`Absensi Berhasil: ${result.data?.name || code} (${result.data?.attendanceStatus || 'Hadir'})`);
      } else {
        notify.warning(result.message || 'Kartu tidak terdaftar');
      }
      await fetchRecentOnly();
    } catch (err: any) {
      notify.error(err, 'Gagal memproses pemindaian kartu');
    } finally {
      setIsProcessingScan(false);
      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 60);
    }
  };

  const handleApplyFilter = () => {
    if (isLiveMode) stopLiveMode();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilter = () => {
    setDeviceId('');
    setScanType('');
    setStatusFilter('ALL');
    setSearchKeyword('');
    setCurrentPage(1);
    if (isLiveMode) stopLiveMode();
    fetchLogs();
  };

  const hasActiveFilter = Boolean(deviceId || scanType || statusFilter !== 'ALL' || searchKeyword);

  // Helper check for success status
  const isScanSuccess = (log: HardwareLog) => {
    return log.status === 'ATTENDANCE_SUCCESS' || log.status === 'MATCHED';
  };

  // Filtered & Paginated logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchKeyword.toLowerCase().trim();
      const val = (log.scanValue || log.identityValue || '').toLowerCase();
      const dev = (log.deviceId || '').toLowerCase();
      const sName = (log.student?.name || '').toLowerCase();
      const sNis = (log.student?.nis || '').toLowerCase();
      const eName = (log.employee?.name || '').toLowerCase();
      const eNip = (log.employee?.nip || '').toLowerCase();

      const matchesSearch =
        !q ||
        dev.includes(q) ||
        val.includes(q) ||
        sName.includes(q) ||
        sNis.includes(q) ||
        eName.includes(q) ||
        eNip.includes(q);

      const matched = isScanSuccess(log);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'MATCHED' && matched) ||
        (statusFilter === 'UNMATCHED' && !matched);

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchKeyword, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalMatched = useMemo(() => logs.filter((l) => isScanSuccess(l)).length, [logs]);
  const totalUnmatched = useMemo(() => logs.filter((l) => !isScanSuccess(l)).length, [logs]);

  const columns: Column<HardwareLog>[] = [
    { 
      key: 'time', 
      header: 'Waktu & Device', 
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs md:text-sm">
            <Clock size={14} className="text-indigo-500" />
            {new Date(log.scanTimestamp || log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Monitor size={12} className="text-slate-400" /> {log.deviceId || 'GATE-01'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {new Date(log.scanTimestamp || log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    { 
      key: 'scanInfo', 
      header: 'Tipe & ID Scan', 
      render: (log) => (
        <div className="flex flex-col gap-1.5 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <Fingerprint size={12} />
            {log.scanType || 'CARD'}
          </span>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
            {log.scanValue || log.identityValue || '-'}
          </span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status Presensi', 
      render: (log) => {
        const matched = isScanSuccess(log);
        return matched ? (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200/70 w-max shadow-xs">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{log.message || 'Berhasil Terdeteksi'}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-xl border border-rose-200/70 w-max shadow-xs">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span className="text-xs font-semibold">Tidak Dikenali</span>
            </div>
            <span className="text-[10px] text-rose-500 font-medium ml-5">{log.message || log.errorMessage || 'Kartu belum diregistrasi'}</span>
          </div>
        );
      }
    },
    { 
      key: 'identity', 
      header: 'Identitas Terdeteksi', 
      render: (log) => {
        const matched = isScanSuccess(log);
        const isStudent = log.matchedUserType === 'STUDENT' || log.attendableType === 'Student';
        return matched ? (
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
              isStudent
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                : 'bg-purple-50 text-purple-600 border-purple-200'
            }`}>
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs md:text-sm text-slate-900">
                {log.student ? log.student.name : (log.employee ? log.employee.name : 'Terdaftar')}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-mono font-medium text-slate-500">
                  {log.student ? (log.student.nis ? `NIS: ${log.student.nis}` : 'NIS-') : (log.employee ? (log.employee.nip ? `NIP: ${log.employee.nip}` : 'NIP-') : '')}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md uppercase font-bold tracking-wider ${
                  isStudent 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' 
                    : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                }`}>
                  {isStudent ? 'Siswa' : 'Pegawai'}
                </span>
              </div>
              {log.student?.class && (
                <span className="text-[11px] text-slate-500 mt-0.5 font-medium">Kelas: {log.student.class.name}</span>
              )}
              {log.employee?.position && (
                <span className="text-[11px] text-slate-500 mt-0.5 font-medium">Jabatan: {log.employee.position.name}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 w-max inline-block">
            Data tidak terdaftar
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header Halaman */}
      <PageHeader 
        title="Log Mesin Absensi" 
        subtitle="Pantau data scan RFID, Sidik Jari, dan Wajah dari mesin absensi secara real-time"
        action={
          <button 
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              isLiveMode 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                : 'btn-std-primary'
            }`}
            onClick={toggleLiveMode}
          >
            {isLiveMode ? (
              <>
                <Activity size={16} className="animate-pulse" />
                <span>Hentikan Live Mode</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Mulai Live Mode</span>
              </>
            )}
          </button>
        }
      />

      {/* 2. Interactive Live RFID Scanner Console when Live Mode is ON */}
      {isLiveMode && (
        <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-indigo-50/90 border-2 border-indigo-300/80 p-5 md:p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-sm text-slate-900">Scanner Live Aktif</span>
              <span className="text-[11px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200">
                Siap Deteksi USB RFID / IoT Webhook
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Tempelkan kartu RFID pada scanner meja atau scanner gerbang sekolah
            </p>
          </div>

          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              handleLiveScan(); 
            }} 
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            <div className="relative flex-1 w-full group">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={18} />
              <input
                ref={scannerInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Tempelkan kartu RFID ke mesin scanner USB (atau ketik nomor kartu lalu tekan Enter)..."
                className="w-full pl-10 pr-28 py-3 bg-white border-2 border-indigo-300/80 rounded-xl text-sm font-mono font-bold text-indigo-950 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
                disabled={isProcessingScan}
                autoFocus
              />
              {isProcessingScan && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Mencatat...</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isProcessingScan || !scanInput.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              <Zap size={15} />
              <span>Simulasi Scan</span>
            </button>
          </form>

          {/* Real-time Scan Feedback Banner */}
          {lastScanResult && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in ${
              lastScanResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                {lastScanResult.success ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <XCircle size={20} />
                  </div>
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{lastScanResult.data?.name || lastScanResult.message || 'Hasil Scan'}</span>
                    {lastScanResult.data?.attendanceStatus && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        lastScanResult.data.attendanceStatus === 'Hadir' 
                          ? 'bg-emerald-200 text-emerald-800' 
                          : 'bg-amber-200 text-amber-800'
                      }`}>
                        {lastScanResult.data.attendanceStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-80 mt-0.5">
                    {lastScanResult.message}
                    {lastScanResult.data?.time && ` • Waktu: ${lastScanResult.data.time}`}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setLastScanResult(null)}
                className="text-xs opacity-60 hover:opacity-100 underline self-end sm:self-center cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Data Scan
          </label>
          <div className="relative group">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" 
              size={16} 
            />
            <input
              type="text"
              placeholder="Cari ID Scan, Nama, NIS, NIP, atau Device..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Device ID
            </label>
            <div className="relative group">
              <Monitor className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Semua"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>
          </div>

          <div className="w-36">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Tipe Scan
            </label>
            <div className="relative group">
              <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
              >
                <option value="">Semua Tipe</option>
                <option value="CARD">Kartu RFID</option>
                <option value="FINGER">Sidik Jari</option>
              </select>
            </div>
          </div>

          <div className="w-44">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Status Presensi
            </label>
            <div className="relative group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">Semua Status</option>
                <option value="MATCHED">Berhasil Terdeteksi</option>
                <option value="UNMATCHED">Tidak Dikenali</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 shadow-sm cursor-pointer"
              onClick={handleApplyFilter}
              disabled={isLiveMode}
              title={isLiveMode ? "Matikan Live Mode untuk memfilter history lengkap" : "Terapkan Filter"}
            >
              <Filter size={14} />
              <span>Terapkan</span>
            </button>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm cursor-pointer"
                title="Reset seluruh filter"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. DataTable Card & Pagination */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/40">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 m-0">Riwayat Pemindaian Mesin</h3>
              {isLiveMode && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Streaming
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Daftar log tap kartu RFID, sidik jari, dan face recognition yang tercatat di sistem</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">{totalMatched} Terdeteksi</Badge>
            {totalUnmatched > 0 && <Badge variant="danger">{totalUnmatched} Tidak Dikenali</Badge>}
            <span className="text-xs text-slate-500 font-medium ml-1">
              Total <span className="font-bold text-slate-800">{filteredLogs.length}</span> Log
            </span>
          </div>
        </div>

        <DataTable 
          columns={columns}
          data={paginatedLogs}
          loading={loading && !isLiveMode}
          emptyMessage={
            isLiveMode 
              ? "Menunggu data pemindaian dari mesin..." 
              : (hasActiveFilter ? "Tidak ada log yang cocok dengan filter yang dipilih." : "Belum ada log scan yang terekam.")
          }
        />

        {!loading && filteredLogs.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
