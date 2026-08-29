import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';

export const GeolocationCheckin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCheckin = () => {
    if (!navigator.geolocation) {
      setResult({ success: false, message: 'Geolocation is not supported by your browser' });
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
          setResult({ success: true, message: res.data.message || 'Absen berhasil dicatat' });
        } catch (error: any) {
          setResult({ 
            success: false, 
            message: error.response?.data?.message || 'Gagal melakukan absen' 
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

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MapPin size={20} color="#3b82f6" />
        Absensi Geolocation
      </h3>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Pastikan Anda berada di area sekolah dan telah memberikan izin akses lokasi (GPS) pada browser Anda.
      </p>
      
      {result && (
        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: result.success ? '#dcfce7' : '#fee2e2', color: result.success ? '#166534' : '#991b1b' }}>
          {result.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span style={{ fontSize: '0.875rem' }}>{result.message}</span>
        </div>
      )}

      <button 
        onClick={handleCheckin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: loading ? '#93c5fd' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? 'Mendapatkan Lokasi & Memproses...' : 'Absen Sekarang'}
      </button>
    </div>
  );
};
