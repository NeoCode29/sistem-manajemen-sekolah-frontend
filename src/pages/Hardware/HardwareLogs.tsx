import React, { useEffect, useState, useRef } from 'react';
import { getScanLogs, getRecentScans } from '../../api/hardwareService';
import type { HardwareLog } from '../../api/hardwareService';
import { Monitor, RefreshCw, Filter, AlertCircle, CheckCircle2, User, Clock, Fingerprint, Activity, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';

export const HardwareLogs: React.FC = () => {
  const [logs, setLogs] = useState<HardwareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const intervalRef = useRef<number | ReturnType<typeof setInterval> | null>(null);

  // Filters
  const [deviceId, setDeviceId] = useState('');
  const [scanType, setScanType] = useState('');

  useEffect(() => {
    fetchLogs();
    return () => stopLiveMode();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getScanLogs({ deviceId, scanType, limit: 50 });
      setLogs(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOnly = async () => {
    try {
      const data = await getRecentScans(deviceId, scanType, 10);
      setLogs(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Live fetch failed', err);
    }
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      stopLiveMode();
    } else {
      setIsLiveMode(true);
      fetchRecentOnly(); // Immediate fetch
      intervalRef.current = setInterval(() => {
        fetchRecentOnly();
      }, 3000); // Poll every 3 seconds
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
    fetchLogs();
  };

  const columns: Column<HardwareLog>[] = [
    { key: 'time', header: 'Waktu & Device', render: (log) => (
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
          <Clock size={14} className="text-indigo-400" />
          {new Date(log.scanTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
          <Monitor size={12} /> {log.deviceId}
        </span>
        <span className="text-[10px] text-gray-400 mt-0.5">
          {new Date(log.scanTimestamp).toLocaleDateString('id-ID')}
        </span>
      </div>
    )},
    { key: 'scanInfo', header: 'Tipe & ID Scan', render: (log) => (
      <div className="flex flex-col gap-1 items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          <Fingerprint size={12} />
          {log.scanType}
        </span>
        <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
          {log.identityValue}
        </span>
      </div>
    )},
    { key: 'status', header: 'Status Mapping', render: (log) => (
      log.status === 'MATCHED' ? (
        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 w-max">
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">Berhasil Terdeteksi</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 w-max">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Tidak Dikenali</span>
          </div>
          <span className="text-xs text-red-500 font-medium ml-5">{log.errorMessage || 'ID belum diregistrasi'}</span>
        </div>
      )
    )},
    { key: 'identity', header: 'Identitas Terdeteksi', render: (log) => (
      log.status === 'MATCHED' ? (
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.matchedUserType === 'STUDENT' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {log.student ? log.student.name : (log.employee ? log.employee.name : 'Unknown')}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-gray-500">
                {log.student ? (log.student.nis || 'NIS-') : (log.employee ? (log.employee.nip || 'NIP-') : '')}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${log.matchedUserType === 'STUDENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                {log.matchedUserType === 'STUDENT' ? 'Siswa' : 'Pegawai'}
              </span>
            </div>
            {log.student?.class && (
              <span className="text-[10px] text-gray-400 mt-0.5">Kelas: {log.student.class.name}</span>
            )}
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-400 italic">Data kosong</span>
      )
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Log Mesin Absensi" 
          subtitle="Pantau data scan RFID dan Biometrik secara real-time"
        />
        <div className="flex">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
              isLiveMode ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
            onClick={toggleLiveMode}
          >
            {isLiveMode ? (
              <>
                <Activity size={18} className="animate-pulse" />
                <span>Hentikan Live Mode</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                <span>Mulai Live Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Device ID</label>
          <div className="relative group">
            <Monitor className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Semua Device..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipe Scan</label>
          <div className="relative group">
            <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
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
        <button 
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-gray-200 shadow-sm"
          onClick={handleApplyFilter}
          disabled={isLiveMode}
          title={isLiveMode ? "Matikan Live Mode untuk memfilter history lengkap" : "Terapkan Filter"}
        >
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Status indicator for live mode */}
      {isLiveMode && (
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-xl mb-6 flex items-center justify-center gap-3 text-sm text-indigo-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <span className="font-medium">Menunggu data scan terbaru dari mesin... (Auto-refresh)</span>
        </div>
      )}

      <DataTable 
        columns={columns}
        data={logs}
        loading={loading && !isLiveMode}
        emptyMessage={isLiveMode ? "Menunggu scan..." : "Belum ada log scan yang terekam."}
      />
    </div>
  );
};
