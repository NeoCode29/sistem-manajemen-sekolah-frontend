import React, { useEffect, useState } from 'react';
import { getAttendanceSetting, updateAttendanceSetting } from '../../api/attendanceService';
import { Clock, Save, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

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

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/40 rounded-3xl p-6 md:p-8 mb-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6 text-indigo-600 border-b border-indigo-100/50 pb-4">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/50">
            <Clock size={22} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600">
            Konfigurasi Waktu Absensi
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat pengaturan...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">

              {/* Check-in Section */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 rounded-2xl border border-blue-100/50 shadow-inner hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm shadow-sm border border-blue-200/50">
                    Masuk
                  </span>
                  <h3 className="font-bold text-blue-900 text-lg group-hover:text-blue-700 transition-colors">Waktu Kedatangan</h3>
                </div>
                <div className="grid grid-cols-1 gap-5 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-blue-200/50 -z-10 hidden sm:block"></div>
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
              <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-6 rounded-2xl border border-emerald-100/50 shadow-inner hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shadow-sm border border-emerald-200/50">
                    Pulang
                  </span>
                  <h3 className="font-bold text-emerald-900 text-lg group-hover:text-emerald-700 transition-colors">Waktu Kepulangan</h3>
                </div>
                <div className="grid grid-cols-1 gap-5 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-200/50 -z-10 hidden sm:block"></div>
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
            <div className="mt-8 pt-8 relative">
              <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              
              <div className="flex items-center gap-3 mb-6 text-purple-600">
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 shadow-sm border border-purple-100/50">
                  <MapPin size={22} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
                  Pengaturan Lokasi (Geofencing)
                </h2>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50/80 to-fuchsia-50/80 p-6 rounded-2xl border border-purple-100/50 shadow-inner hover:shadow-md transition-all duration-300">
                <p className="text-sm text-purple-800/80 font-medium mb-5 bg-white/50 p-3 rounded-xl inline-block border border-purple-100">
                  <span className="mr-2">📍</span> Fitur ini membatasi area di mana siswa atau pegawai dapat melakukan absensi melalui GPS.
                </p>
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

            <div className="mt-8 pt-6 relative">
              <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer font-bold text-gray-800 group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-md text-indigo-600 border-gray-300 focus:ring-indigo-500/30 transition-all peer"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <div className="absolute w-8 h-8 rounded-full bg-indigo-100/50 opacity-0 peer-hover:opacity-100 transition-opacity -z-10 scale-0 peer-hover:scale-100 duration-300"></div>
                    </div>
                    <span className="group-hover:text-indigo-700 transition-colors">Aktifkan Aturan Jam Absensi</span>
                  </label>
                  <p className="text-sm text-gray-500 ml-8 mt-1.5 font-medium">Sistem akan memvalidasi absensi berdasarkan jam masuk & pulang ini.</p>
                </div>
                
                <button
                  type="submit"
                  className="btn-std-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto justify-center"
                  disabled={saving}
                >
                  <Save size={18} className={saving ? 'animate-pulse' : ''} />
                  <span className="font-semibold">{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
