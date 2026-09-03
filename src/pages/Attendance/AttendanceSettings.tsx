import React, { useEffect, useState } from 'react';
import { getAttendanceSetting, updateAttendanceSetting } from '../../api/attendanceService';
import { Clock, Save, MapPin } from 'lucide-react';

export const AttendanceSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [minCheckinTime, setMinCheckinTime] = useState('');
  const [maxCheckinTime, setMaxCheckinTime] = useState('');
  const [minCheckoutTime, setMinCheckoutTime] = useState('');
  const [maxCheckoutTime, setMaxCheckoutTime] = useState('');
  const [lateThreshold, setLateThreshold] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radiusMeter, setRadiusMeter] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceSetting();
      if (data) {
        setMinCheckinTime(data.minCheckinTime);
        setMaxCheckinTime(data.maxCheckinTime);
        setMinCheckoutTime(data.minCheckoutTime);
        setMaxCheckoutTime(data.maxCheckoutTime);
        setLateThreshold(data.lateThreshold);
        setLatitude(data.latitude ?? '');
        setLongitude(data.longitude ?? '');
        setRadiusMeter(data.radiusMeter ?? '');
        setIsActive(data.isActive);
      }
      setError('');
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Gagal memuat pengaturan absensi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        minCheckinTime,
        maxCheckinTime,
        minCheckoutTime,
        maxCheckoutTime,
        lateThreshold,
        latitude: latitude === '' ? undefined : Number(latitude),
        longitude: longitude === '' ? undefined : Number(longitude),
        radiusMeter: radiusMeter === '' ? undefined : Number(radiusMeter),
        isActive,
      };

      await updateAttendanceSetting(payload);
      setSuccess('Pengaturan jam absensi berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pengaturan Jam Absensi</h1>
          <p className="text-gray-500 mt-1">Atur batas waktu check-in, check-out, dan keterlambatan</p>
        </div>
      </div>

      {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      {success && <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">{success}</div>}

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-5">
        <div className="flex items-center gap-2 mb-4 text-blue-600 border-b pb-2">
          <Clock size={20} />
          <h2 className="text-lg font-semibold">Konfigurasi Waktu (Format 24-Jam HH:mm)</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat pengaturan...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">

              {/* Check-in Section */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-700">
                    Masuk
                  </span>
                  Waktu Kedatangan
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Mulai Check-in Masuk</label>
                    <input
                      type="time"
                      className="input-std mt-1"
                      value={minCheckinTime}
                      onChange={(e) => setMinCheckinTime(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Waktu paling awal siswa/pegawai bisa absen masuk.</p>
                  </div>

                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Batas Check-in Masuk</label>
                    <input
                      type="time"
                      className="input-std mt-1"
                      value={maxCheckinTime}
                      onChange={(e) => setMaxCheckinTime(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Waktu paling akhir untuk absen masuk.</p>
                  </div>

                  <div className="form-group">
                    <label className="text-sm font-medium text-red-600">Batas Terlambat (Late Threshold) *</label>
                    <input
                      type="time"
                      className="input-std mt-1"
                      value={lateThreshold}
                      onChange={(e) => setLateThreshold(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Jika check-in melewati jam ini, status otomatis menjadi Terlambat.</p>
                  </div>
                </div>
              </div>

              {/* Check-out Section */}
              <div className="bg-green-50/50 p-5 rounded-xl border border-green-100">
                <h3 className="font-bold text-green-800 mb-4 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-700">
                    Pulang
                  </span>
                  Waktu Kepulangan
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Mulai Check-out Pulang</label>
                    <input
                      type="time"
                      className="input-std mt-1"
                      value={minCheckoutTime}
                      onChange={(e) => setMinCheckoutTime(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Waktu paling awal diperbolehkan absen pulang.</p>
                  </div>

                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Batas Check-out Pulang</label>
                    <input
                      type="time"
                      className="input-std mt-1"
                      value={maxCheckoutTime}
                      onChange={(e) => setMaxCheckoutTime(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Waktu paling akhir untuk absen pulang.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Geofencing Section */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center gap-2 mb-4 text-purple-600 border-b pb-2">
                <MapPin size={20} />
                <h2 className="text-lg font-semibold">Pengaturan Lokasi (Geofencing)</h2>
              </div>
              
              <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-800 mb-4">Fitur ini membatasi area di mana siswa atau pegawai dapat melakukan absensi melalui GPS.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="input-std mt-1"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="-6.200000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="input-std mt-1"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="106.816666"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Radius (Meter)</label>
                    <input
                      type="number"
                      className="input-std mt-1"
                      value={radiusMeter}
                      onChange={(e) => setRadiusMeter(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group mt-6 pt-4 border-t">
              <label className="flex items-center gap-3 cursor-pointer font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Aktifkan Aturan Ini
              </label>
              <p className="text-xs text-gray-500 ml-8 mt-1">Jika tidak diaktifkan, maka sistem tidak akan menerapkan validasi jam pada saat absen.</p>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                type="submit"
                className="btn-std-primary flex items-center gap-2"
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
