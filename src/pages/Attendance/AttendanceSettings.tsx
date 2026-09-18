import React, { useEffect, useState } from 'react';
import { getAttendanceSetting, updateAttendanceSetting } from '../../api/attendanceService';
import { Clock, Save, MapPin, AlertTriangle, ShieldCheck, Loader2, CheckCircle2, CreditCard, Smartphone, UserCheck, Sliders } from 'lucide-react';
import { Can } from '../../components/Common/Can';
import { PageHeader } from '../../components/ui/PageHeader';
import { MapLocationPicker } from '../../components/widgets/MapLocationPicker';
import { notify } from '../../utils/feedback';

export const AttendanceSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [minCheckinTime, setMinCheckinTime] = useState('');
  const [maxCheckinTime, setMaxCheckinTime] = useState('');
  const [minCheckoutTime, setMinCheckoutTime] = useState('');
  const [maxCheckoutTime, setMaxCheckoutTime] = useState('');
  const [lateThreshold, setLateThreshold] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radiusMeter, setRadiusMeter] = useState<number | ''>('');

  // Allowed Methods State
  const [studentRfidEnabled, setStudentRfidEnabled] = useState(true);
  const [studentGpsEnabled, setStudentGpsEnabled] = useState(false);
  const [studentManualEnabled, setStudentManualEnabled] = useState(true);

  const [employeeRfidEnabled, setEmployeeRfidEnabled] = useState(true);
  const [employeeGpsEnabled, setEmployeeGpsEnabled] = useState(true);
  const [employeeManualEnabled, setEmployeeManualEnabled] = useState(true);

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceSetting();
      if (data) {
        setMinCheckinTime(data.minCheckinTime || '');
        setMaxCheckinTime(data.maxCheckinTime || '');
        setMinCheckoutTime(data.minCheckoutTime || '');
        setMaxCheckoutTime(data.maxCheckoutTime || '');
        setLateThreshold(data.lateThreshold || '');
        setLatitude(data.latitude ?? '');
        setLongitude(data.longitude ?? '');
        setRadiusMeter(data.radiusMeter ?? '');
        setStudentRfidEnabled(data.studentRfidEnabled ?? true);
        setStudentGpsEnabled(data.studentGpsEnabled ?? false);
        setStudentManualEnabled(data.studentManualEnabled ?? true);
        setEmployeeRfidEnabled(data.employeeRfidEnabled ?? true);
        setEmployeeGpsEnabled(data.employeeGpsEnabled ?? true);
        setEmployeeManualEnabled(data.employeeManualEnabled ?? true);
        setIsActive(data.isActive ?? true);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        notify.error(err, 'Gagal memuat pengaturan absensi');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateTimes = (): boolean => {
    if (!minCheckinTime || !maxCheckinTime || !lateThreshold || !minCheckoutTime || !maxCheckoutTime) {
      notify.error('Seluruh kolom rentang jam absensi wajib diisi.');
      return false;
    }

    if (minCheckinTime >= lateThreshold) {
      notify.error('Waktu mulai check-in harus lebih awal dari batas keterlambatan.');
      return false;
    }

    if (lateThreshold >= maxCheckinTime) {
      notify.error('Batas toleransi keterlambatan harus lebih awal dari batas akhir check-in masuk.');
      return false;
    }

    if (minCheckoutTime >= maxCheckoutTime) {
      notify.error('Waktu mulai check-out pulang harus lebih awal dari batas akhir pulang.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTimes()) return;

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
        studentRfidEnabled,
        studentGpsEnabled,
        studentManualEnabled,
        employeeRfidEnabled,
        employeeGpsEnabled,
        employeeManualEnabled,
        isActive,
      };

      await updateAttendanceSetting(payload);
      notify.success('Pengaturan jam, lokasi, dan metode absensi berhasil disimpan!');
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan pengaturan absensi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Pengaturan Presensi"
        subtitle="Konfigurasi rentang jam absensi kedatangan & kepulangan, toleransi keterlambatan, dan batas radius geofencing sekolah"
        action={
          <Can permission={['attendance_settings.manage', 'attendance.write']}>
            <button
              type="submit"
              form="attendance-settings-form"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </Can>
        }
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-sm font-medium">Memuat konfigurasi pengaturan absensi...</p>
        </div>
      ) : (
        <form id="attendance-settings-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card 1: Waktu & Rentang Jam Absensi */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
            {/* Standard Header Section */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 m-0">Waktu & Rentang Jam Absensi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Batas waktu check-in kedatangan, toleransi keterlambatan, dan kepulangan</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sesi Masuk */}
                <div className="bg-blue-50/40 p-5 md:p-6 rounded-2xl border border-blue-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-blue-100/80">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200/60">
                      Sesi Masuk
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">Waktu Kedatangan</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Mulai Check-in Masuk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-slate-900"
                        value={minCheckinTime}
                        onChange={(e) => setMinCheckinTime(e.target.value)}
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Waktu paling awal siswa/pegawai dapat absen masuk.</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-amber-800 block mb-1.5 flex items-center gap-1">
                        <AlertTriangle size={13} className="text-amber-600" />
                        <span>Batas Toleransi Terlambat (Late Threshold) <span className="text-red-500">*</span></span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold text-amber-950"
                        value={lateThreshold}
                        onChange={(e) => setLateThreshold(e.target.value)}
                        required
                      />
                      <p className="text-[11px] text-amber-700 mt-1">Check-in setelah jam ini otomatis berstatus Terlambat.</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Batas Akhir Check-in Masuk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-slate-900"
                        value={maxCheckinTime}
                        onChange={(e) => setMaxCheckinTime(e.target.value)}
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Waktu batas paling akhir diperbolehkan absen masuk.</p>
                    </div>
                  </div>
                </div>

                {/* Sesi Pulang */}
                <div className="bg-emerald-50/40 p-5 md:p-6 rounded-2xl border border-emerald-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-100/80">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                      Sesi Pulang
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">Waktu Kepulangan</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Mulai Check-out Pulang <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-slate-900"
                        value={minCheckoutTime}
                        onChange={(e) => setMinCheckoutTime(e.target.value)}
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Waktu paling awal diperbolehkan absen pulang.</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Batas Akhir Check-out Pulang <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-slate-900"
                        value={maxCheckoutTime}
                        onChange={(e) => setMaxCheckoutTime(e.target.value)}
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Waktu paling akhir gerbang presensi pulang dibuka.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Status Validasi Jam */}
              <div className="bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 text-indigo-600 mt-0.5 shadow-2xs">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-900 cursor-pointer flex items-center gap-2">
                      <span>Validasi Aturan Jam Absensi</span>
                      {isActive ? (
                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Aktif</span>
                      ) : (
                        <span className="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Nonaktif</span>
                      )}
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jika aktif, sistem dan mesin biometrik akan memberlakukan validasi jam masuk dan pulang secara otomatis.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Metode Presensi yang Diizinkan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
            {/* Standard Header Section */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 m-0">Metode Presensi yang Diizinkan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tentukan jalur absensi yang aktif dan boleh digunakan oleh Siswa maupun Pegawai/Guru</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Kelompok Siswa */}
                <div className="bg-slate-50/50 p-5 md:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200/60">
                        Kelompok
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">Metode Presensi Siswa</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Siswa & Kelas</span>
                  </div>

                  <div className="space-y-3">
                    {/* Toggle RFID Siswa */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Kartu RFID / Mesin Kiosk</p>
                          <p className="text-[11px] text-slate-500">Tap kartu RFID / biometrik di mesin absensi</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={studentRfidEnabled}
                          onChange={(e) => setStudentRfidEnabled(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Toggle Mandiri GPS Siswa */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Presensi Mandiri GPS</p>
                          <p className="text-[11px] text-slate-500">Check-in mandiri lewat HP/Web dengan geofencing</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={studentGpsEnabled}
                          onChange={(e) => setStudentGpsEnabled(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Toggle Manual Siswa */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Pencatatan Manual Guru / Wali Kelas</p>
                          <p className="text-[11px] text-slate-500">Input absensi per rombel melalui menu web guru</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={studentManualEnabled}
                          onChange={(e) => setStudentManualEnabled(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Kelompok Pegawai & Guru */}
                <div className="bg-slate-50/50 p-5 md:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px] border border-violet-200/60">
                        Kelompok
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">Metode Presensi Pegawai & Guru</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Staf & Dewan Guru</span>
                  </div>

                  <div className="space-y-3">
                    {/* Toggle RFID Pegawai */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Kartu RFID / Mesin Kiosk</p>
                          <p className="text-[11px] text-slate-500">Tap kartu RFID / biometrik di mesin absensi</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={employeeRfidEnabled}
                          onChange={(e) => setEmployeeRfidEnabled(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Toggle Mandiri GPS Pegawai */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Presensi Mandiri GPS</p>
                          <p className="text-[11px] text-slate-500">Check-in mandiri lewat HP/Web dengan geofencing</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={employeeGpsEnabled}
                          onChange={(e) => setEmployeeGpsEnabled(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Toggle Manual Pegawai */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Pencatatan Manual Admin / Pimpinan</p>
                          <p className="text-[11px] text-slate-500">Input absensi staf oleh admin/tata usaha</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={employeeManualEnabled}
                          onChange={(e) => setEmployeeManualEnabled(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Card 3: Lokasi & Geofencing GPS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
            {/* Standard Header Section */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 m-0">Lokasi & Geofencing GPS</h2>
                <p className="text-xs text-slate-500 mt-0.5">Titik koordinat sekolah dan batas radius meter toleransi presensi</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Info callout */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 flex items-center gap-3 text-purple-900 text-xs">
                <span className="text-base">📍</span>
                <p className="font-medium leading-relaxed">
                  Pilih lokasi titik pusat sekolah pada peta interaktif di bawah atau masukkan koordinat lintang/bujur secara manual. Presensi mobile hanya dapat dilakukan jika pengguna berada di dalam radius toleransi.
                </p>
              </div>

              {/* Interactive Leaflet Map Container */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
                <MapLocationPicker
                  position={latitude !== '' && longitude !== '' ? [Number(latitude), Number(longitude)] : null}
                  radius={radiusMeter !== '' ? Number(radiusMeter) : null}
                  onLocationSelect={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </div>

              {/* Coordinates and Radius Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Latitude (Lintang)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-900 font-medium"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="-6.200000"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Longitude (Bujur)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-900 font-medium"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="106.816666"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Radius Geofencing (Meter)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-900 font-medium"
                    value={radiusMeter}
                    onChange={(e) => setRadiusMeter(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Pastikan seluruh waktu berurutan logis sebelum menyimpan pengaturan.</span>
            </div>

            <Can permission={['attendance_settings.manage', 'attendance.write']}>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-all hover:shadow-md w-full sm:w-auto justify-center"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </button>
            </Can>
          </div>
        </form>
      )}
    </div>
  );
};
