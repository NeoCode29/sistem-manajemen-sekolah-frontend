import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { getAttendanceSetting, type AttendanceSetting } from '../../api/attendanceService';

interface TodayAttendanceStatus {
  role: 'Siswa' | 'Pegawai' | 'Unknown';
  hasCheckedIn: boolean;
  hasCheckedOut?: boolean;
  checkinTime: string | null;
  checkoutTime?: string | null;
  status: string | null;
}

export const GeolocationCheckin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [setting, setSetting] = useState<AttendanceSetting | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchTodayStatus = useCallback(async () => {
    try {
      setFetchingStatus(true);
      const [statusRes, settingRes] = await Promise.all([
        api.get('/attendances/my-today'),
        getAttendanceSetting().catch(() => null),
      ]);
      setTodayStatus(statusRes.data);
      if (settingRes) {
        setSetting(settingRes);
      }
    } catch (err) {
      console.error('Failed to fetch today attendance status', err);
    } finally {
      setFetchingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  const handleCheckin = () => {
    if (!navigator.geolocation) {
      setResult({ success: false, message: 'Geolocation tidak didukung oleh browser Anda' });
      return;
    }

    setLoading(true);
    setResult(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post('/attendances/manual-checkin', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setResult({ success: true, message: res.data.message || 'Absensi berhasil dicatat' });
          await fetchTodayStatus();
        } catch (err: any) {
          setResult({
            success: false,
            message: err.response?.data?.message || 'Gagal melakukan absensi.',
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        let msg = 'Gagal mengakses lokasi perangkat Anda.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi (GPS) ditolak. Silakan izinkan akses lokasi di browser HP/laptop Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi tidak tersedia. Pastikan GPS perangkat aktif.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Waktu permintaan lokasi habis. Coba beberapa saat lagi.';
        }
        setResult({ success: false, message: msg });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const isSiswa = todayStatus?.role === 'Siswa';
  const isPegawai = todayStatus?.role === 'Pegawai';

  // Sembunyikan widget jika metode GPS dinonaktifkan untuk peran pengguna saat ini
  if (!fetchingStatus && setting) {
    if (isSiswa && setting.studentGpsEnabled === false) return null;
    if (isPegawai && setting.employeeGpsEnabled === false) return null;
  }

  const isSiswaCompleted = isSiswa && !!todayStatus?.hasCheckedIn;
  const isPegawaiCompleted = isPegawai && !!(todayStatus?.hasCheckedIn && todayStatus?.hasCheckedOut);
  const isPegawaiCanCheckout = isPegawai && !!todayStatus?.hasCheckedIn && !todayStatus?.hasCheckedOut;

  const isButtonDisabled = loading || fetchingStatus || isSiswaCompleted || isPegawaiCompleted;

  let buttonColorClass = 'bg-blue-600 hover:bg-blue-700 text-white';
  let buttonLabel = 'Absen Masuk Sekarang';

  if (loading) {
    buttonLabel = 'Mendapatkan Lokasi & Memproses...';
    buttonColorClass = 'bg-blue-300 text-white cursor-wait';
  } else if (fetchingStatus) {
    buttonLabel = 'Memeriksa status kehadiran...';
    buttonColorClass = 'bg-slate-300 text-slate-600 cursor-not-allowed';
  } else if (isSiswaCompleted) {
    buttonLabel = `Sudah Absen Hari Ini (${todayStatus?.checkinTime || ''})`;
    buttonColorClass = 'bg-slate-300 text-slate-600 cursor-not-allowed';
  } else if (isPegawaiCompleted) {
    buttonLabel = 'Absensi Hari Ini Selesai';
    buttonColorClass = 'bg-slate-300 text-slate-600 cursor-not-allowed';
  } else if (isPegawaiCanCheckout) {
    buttonLabel = 'Absen Pulang Sekarang';
    buttonColorClass = 'bg-amber-600 hover:bg-amber-700 text-white';
  }

  return (
    <div className="p-5 sm:p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <MapPin size={18} />
          </div>
          <span>Absensi Mandiri (GPS)</span>
        </h3>
        {fetchingStatus && <Loader2 size={16} className="animate-spin text-gray-400" />}
      </div>

      <p className="text-gray-500 text-xs sm:text-sm mb-4 leading-relaxed">
        Pastikan Anda berada di radius area sekolah dan telah mengizinkan akses lokasi (GPS) pada browser ponsel.
      </p>

      {/* Status Card Hari Ini */}
      {todayStatus && !fetchingStatus && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm border transition-colors ${
            isSiswaCompleted || isPegawaiCompleted
              ? 'bg-emerald-50/80 border-emerald-200'
              : isPegawaiCanCheckout
              ? 'bg-amber-50/80 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSiswaCompleted || isPegawaiCompleted ? (
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <Clock size={18} className={isPegawaiCanCheckout ? 'text-amber-600 flex-shrink-0' : 'text-slate-500 flex-shrink-0'} />
            )}
            <span
              className={`font-semibold ${
                isSiswaCompleted || isPegawaiCompleted
                  ? 'text-emerald-800'
                  : isPegawaiCanCheckout
                  ? 'text-amber-800'
                  : 'text-slate-700'
              }`}
            >
              {isSiswaCompleted && `Sudah Absen (${todayStatus.status || 'Hadir'})`}
              {isPegawaiCompleted && 'Absensi Lengkap (Masuk & Pulang)'}
              {isPegawaiCanCheckout && 'Sudah Absen Masuk'}
              {!todayStatus.hasCheckedIn && 'Status: Belum Absen'}
            </span>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 font-medium pl-6 sm:pl-0">
            {isSiswaCompleted && todayStatus.checkinTime && `Masuk: ${todayStatus.checkinTime}`}
            {isPegawaiCanCheckout && todayStatus.checkinTime && `Masuk: ${todayStatus.checkinTime}`}
            {isPegawaiCompleted && `Masuk: ${todayStatus.checkinTime} | Pulang: ${todayStatus.checkoutTime}`}
          </div>
        </div>
      )}

      {result && (
        <div
          className={`p-3.5 rounded-xl mb-4 flex items-start gap-2.5 text-xs sm:text-sm ${
            result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{result.message}</span>
        </div>
      )}

      <button
        onClick={handleCheckin}
        disabled={isButtonDisabled}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${buttonColorClass} ${
          isButtonDisabled ? 'opacity-80' : 'hover:shadow-md active:scale-[0.99]'
        }`}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
};
