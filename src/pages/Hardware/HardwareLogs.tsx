import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getScanLogs, getRecentScans } from '../../api/hardwareService';
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
  RotateCcw
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Pagination } from '../../components/Common/Pagination';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const HardwareLogs: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canReadLogs = hasPermission('hardware.read_logs') || hasPermission('hardware.manage') || true;

  const [logs, setLogs] = useState<HardwareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const intervalRef = useRef<number | ReturnType<typeof setInterval> | null>(null);

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

  const fetchLogs = async () => {
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
    try {
      const data = await getRecentScans(deviceId, scanType, 15);
      setLogs(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Live fetch failed', err);
    }
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      stopLiveMode();
      notify.info('Mode live streaming dinonaktifkan');
    } else {
      setIsLiveMode(true);
      notify.success('Mode live streaming diaktifkan (Auto-refresh 3s)');
      fetchRecentOnly();
      intervalRef.current = setInterval(() => {
        fetchRecentOnly();
      }, 3000);
    }
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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

  // Filtered & Paginated logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchKeyword.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.deviceId && log.deviceId.toLowerCase().includes(q)) ||
        (log.identityValue && log.identityValue.toLowerCase().includes(q)) ||
        (log.student?.name && log.student.name.toLowerCase().includes(q)) ||
        (log.student?.nis && log.student.nis.toLowerCase().includes(q)) ||
        (log.employee?.name && log.employee.name.toLowerCase().includes(q)) ||
        (log.employee?.nip && log.employee.nip.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'MATCHED' && log.status === 'MATCHED') ||
        (statusFilter === 'UNMATCHED' && log.status !== 'MATCHED');

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchKeyword, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalMatched = useMemo(() => logs.filter((l) => l.status === 'MATCHED').length, [logs]);
  const totalUnmatched = useMemo(() => logs.filter((l) => l.status !== 'MATCHED').length, [logs]);

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
            <Monitor size={12} className="text-slate-400" /> {log.deviceId}
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
            {log.scanType}
          </span>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
            {log.identityValue}
          </span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status Mapping', 
      render: (log) => (
        log.status === 'MATCHED' ? (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200/70 w-max shadow-sm">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">Berhasil Terdeteksi</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-xl border border-rose-200/70 w-max shadow-sm">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span className="text-xs font-semibold">Tidak Dikenali</span>
            </div>
            <span className="text-[10px] text-rose-500 font-medium ml-5">{log.errorMessage || 'ID belum diregistrasi'}</span>
          </div>
        )
      )
    },
    { 
      key: 'identity', 
      header: 'Identitas Terdeteksi', 
      render: (log) => (
        log.status === 'MATCHED' ? (
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
              log.matchedUserType === 'STUDENT' 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                : 'bg-purple-50 text-purple-600 border-purple-200'
            }`}>
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs md:text-sm text-slate-900">
                {log.student ? log.student.name : (log.employee ? log.employee.name : 'Unknown')}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-mono font-medium text-slate-500">
                  {log.student ? (log.student.nis || 'NIS-') : (log.employee ? (log.employee.nip || 'NIP-') : '')}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md uppercase font-bold tracking-wider ${
                  log.matchedUserType === 'STUDENT' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' 
                    : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                }`}>
                  {log.matchedUserType === 'STUDENT' ? 'Siswa' : 'Pegawai'}
                </span>
              </div>
              {log.student?.class && (
                <span className="text-[11px] text-slate-500 mt-0.5 font-medium">Kelas: {log.student.class.name}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 w-max inline-block">
            Data tidak terdaftar
          </span>
        )
      )
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

      {/* 2. Filter Bar Pola Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Pencarian Kata Kunci
            </label>
            <div className="relative group">
              <Search 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" 
                size={17} 
              />
              <input
                type="text"
                placeholder="Cari nama, NIS, NIP, atau ID scan..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="w-full md:w-44">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Device ID
            </label>
            <div className="relative group">
              <Monitor 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" 
                size={17} 
              />
              <input
                type="text"
                placeholder="Semua Device..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-mono font-medium"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-44">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Tipe Scan
            </label>
            <div className="relative group">
              <Fingerprint 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" 
                size={17} 
              />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
              >
                <option value="">Semua Tipe</option>
                <option value="RFID">Kartu RFID</option>
                <option value="FINGERPRINT">Sidik Jari</option>
                <option value="FACE">Face Recognition</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Status Mapping
            </label>
            <div className="relative group">
              <Activity 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" 
                size={17} 
              />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
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

      {/* Status indicator for live mode */}
      {isLiveMode && (
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-2xl flex items-center justify-center gap-3 text-xs md:text-sm text-indigo-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <span className="font-semibold">Live Streaming Aktif: Menerima pemindaian otomatis dari mesin absensi setiap 3 detik</span>
        </div>
      )}

      {/* 3. DataTable Card & Pagination */}
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
