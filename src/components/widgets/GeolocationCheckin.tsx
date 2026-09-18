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
        } catch (error: any) {
          setResult({ 
            success: false, 
            message: error.response?.data?.message || 'Gagal melakukan absensi' 
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        setResult({ success: false, message: 'Izin lokasi ditolak atau gagal mendapatkan lokasi: ' + error.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

  let buttonBgColor = '#2563eb'; // blue default
  let buttonLabel = 'Absen Masuk Sekarang';

  if (loading) {
    buttonLabel = 'Mendapatkan Lokasi & Memproses...';
    buttonBgColor = '#93c5fd';
  } else if (fetchingStatus) {
    buttonLabel = 'Memeriksa status kehadiran...';
    buttonBgColor = '#94a3b8';
  } else if (isSiswaCompleted) {
    buttonLabel = `Sudah Absen Hari Ini (${todayStatus?.checkinTime || ''})`;
    buttonBgColor = '#94a3b8';
  } else if (isPegawaiCompleted) {
    buttonLabel = 'Absensi Hari Ini Selesai';
    buttonBgColor = '#94a3b8';
  } else if (isPegawaiCanCheckout) {
    buttonLabel = 'Absen Pulang Sekarang';
    buttonBgColor = '#d97706'; // amber
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <MapPin size={20} color="#3b82f6" />
          Absensi Geolocation
        </h3>
        {fetchingStatus && <Loader2 size={16} className="animate-spin text-gray-400" />}
      </div>

      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Pastikan Anda berada di radius area sekolah dan telah mengizinkan akses lokasi (GPS) pada browser.
      </p>

      {/* Status Card Hari Ini */}
      {todayStatus && !fetchingStatus && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: isSiswaCompleted || isPegawaiCompleted ? '#f0fdf4' : isPegawaiCanCheckout ? '#fffbeb' : '#f8fafc',
          border: `1px solid ${isSiswaCompleted || isPegawaiCompleted ? '#bbf7d0' : isPegawaiCanCheckout ? '#fde68a' : '#e2e8f0'}`,
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSiswaCompleted || isPegawaiCompleted ? (
              <CheckCircle size={18} color="#16a34a" />
            ) : (
              <Clock size={18} color={isPegawaiCanCheckout ? '#d97706' : '#64748b'} />
            )}
            <span style={{ fontWeight: 600, color: isSiswaCompleted || isPegawaiCompleted ? '#15803d' : isPegawaiCanCheckout ? '#b45309' : '#475569' }}>
              {isSiswaCompleted && `Sudah Absen (${todayStatus.status || 'Hadir'})`}
              {isPegawaiCompleted && 'Absensi Lengkap (Masuk & Pulang)'}
              {isPegawaiCanCheckout && 'Sudah Absen Masuk'}
              {!todayStatus.hasCheckedIn && 'Status: Belum Absen'}
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {isSiswaCompleted && todayStatus.checkinTime && `Masuk: ${todayStatus.checkinTime}`}
            {isPegawaiCanCheckout && todayStatus.checkinTime && `Masuk: ${todayStatus.checkinTime}`}
            {isPegawaiCompleted && `Masuk: ${todayStatus.checkinTime} | Pulang: ${todayStatus.checkoutTime}`}
          </div>
        </div>
      )}
      
      {result && (
        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: result.success ? '#dcfce7' : '#fee2e2', color: result.success ? '#166534' : '#991b1b' }}>
          {result.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span style={{ fontSize: '0.875rem' }}>{result.message}</span>
        </div>
      )}

      <button 
        onClick={handleCheckin}
        disabled={isButtonDisabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: buttonBgColor,
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 600,
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {buttonLabel}
      </button>
    </div>
  );
};
