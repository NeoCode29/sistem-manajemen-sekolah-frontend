import React, { useEffect, useState, useRef } from 'react';
import { getScanLogs, getRecentScans } from '../../api/hardwareService';
import type { HardwareLog } from '../../api/hardwareService';
import { Monitor, RefreshCw, Filter, AlertCircle, CheckCircle2, User, Clock, Fingerprint, Activity } from 'lucide-react';
import '../Academic/Academic.css';

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

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Monitor size={24} className="text-blue-600" />
            Log Mesin Absensi
          </h1>
          <p className="page-subtitle">Pantau data scan RFID dan Biometrik secara real-time</p>
        </div>
        <div className="header-actions">
          <button 
            className={`btn-primary flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isLiveMode ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white'
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

      <div className="glass-panel mt-6">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-end bg-gray-50/50">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Device ID</label>
            <div className="relative">
              <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Semua Device..."
                className="input-field w-full pl-9"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipe Scan</label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="input-field w-full pl-9 appearance-none"
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
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200 h-[42px]"
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
          <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-2 flex items-center justify-center gap-2 text-sm text-blue-700">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Menunggu data scan terbaru dari mesin... (Auto-refresh)
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu & Device</th>
                <th>Tipe & ID Scan</th>
                <th>Status Mapping</th>
                <th>Identitas Terdeteksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && !isLiveMode ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Memuat log...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Monitor size={32} className="text-gray-300" />
                      <p>Belum ada log scan yang terekam.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(log.scanTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <Monitor size={12} /> {log.deviceId}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(log.scanTimestamp).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 w-max px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          <Fingerprint size={12} />
                          {log.scanType}
                        </span>
                        <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                          {log.identityValue}
                        </span>
                      </div>
                    </td>
                    <td>
                      {log.status === 'MATCHED' ? (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 w-max">
                          <CheckCircle2 size={16} />
                          <span className="text-sm font-medium">Berhasil Terdeteksi</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 w-max">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle size={16} />
                            <span className="text-sm font-medium">Tidak Dikenali</span>
                          </div>
                          <span className="text-xs text-red-500 font-medium ml-5">{log.errorMessage || 'ID belum diregistrasi'}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {log.status === 'MATCHED' ? (
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.matchedUserType === 'STUDENT' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
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
                              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${log.matchedUserType === 'STUDENT' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
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
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
