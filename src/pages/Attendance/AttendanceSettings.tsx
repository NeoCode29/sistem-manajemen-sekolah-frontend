import React, { useEffect, useState } from 'react';
import { getAttendanceSetting, updateAttendanceSetting, triggerAutoAlpha, triggerAllAutoAlpha, type AttendanceExemptionDate } from '../../api/attendanceService';
import {
  Clock,
  Save,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  CreditCard,
  Smartphone,
  UserCheck,
  Sliders,
  Sparkles,
  Play,
  CalendarOff,
  Trash2,
  Plus,
  Calendar,
  Check,
  Info,
  CalendarCheck,
  Clock4,
  GraduationCap,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { MapLocationPicker } from '../../components/widgets/MapLocationPicker';
import { usePermissions } from '../../hooks/usePermissions';
import { notify, parseApiError } from '../../utils/feedback';
import { getLocalDateString } from '../../utils/constants';

const DAY_OPTIONS = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
  { value: 0, label: 'Minggu', short: 'Min' },
];

type TabType = 'schedule' | 'methods' | 'automation';

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'indigo' | 'purple' | 'blue' | 'emerald';
}> = ({ checked, onChange, disabled, color = 'indigo' }) => {
  const getActiveColor = () => {
    switch (color) {
      case 'purple':
        return 'bg-purple-600 focus:ring-purple-500';
      case 'blue':
        return 'bg-blue-600 focus:ring-blue-500';
      case 'emerald':
        return 'bg-emerald-600 focus:ring-emerald-500';
      default:
        return 'bg-indigo-600 focus:ring-indigo-500';
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        checked ? getActiveColor() : 'bg-slate-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const AttendanceSettings: React.FC = () => {
  const { canManageAttendanceSettings } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [showMap, setShowMap] = useState(true);

  // Form State
  const [minCheckinTime, setMinCheckinTime] = useState('');
  const [maxCheckinTime, setMaxCheckinTime] = useState('');
  const [minCheckoutTime, setMinCheckoutTime] = useState('');
  const [maxCheckoutTime, setMaxCheckoutTime] = useState('');
  const [lateThreshold, setLateThreshold] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radiusMeter, setRadiusMeter] = useState<number | ''>('');

  // Working Days State (0=Minggu, 1=Senin, ..., 6=Sabtu)
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Allowed Methods State
  const [studentRfidEnabled, setStudentRfidEnabled] = useState(true);
  const [studentGpsEnabled, setStudentGpsEnabled] = useState(false);
  const [studentManualEnabled, setStudentManualEnabled] = useState(true);

  const [employeeRfidEnabled, setEmployeeRfidEnabled] = useState(true);
  const [employeeGpsEnabled, setEmployeeGpsEnabled] = useState(true);
  const [employeeManualEnabled, setEmployeeManualEnabled] = useState(true);

  // Auto-Alpha Automation State
  const [autoAlphaEnabled, setAutoAlphaEnabled] = useState(true);
  const [employeeAutoAlphaEnabled, setEmployeeAutoAlphaEnabled] = useState(true);
  const [autoAlphaTime, setAutoAlphaTime] = useState('16:30');
  const [autoAlphaSkippedDates, setAutoAlphaSkippedDates] = useState<AttendanceExemptionDate[]>([]);
  const [newExemptionDate, setNewExemptionDate] = useState('');
  const [newExemptionReason, setNewExemptionReason] = useState('');
  const [triggeringAlpha, setTriggeringAlpha] = useState(false);
  const [confirmTriggerOpen, setConfirmTriggerOpen] = useState(false);

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
        setAutoAlphaEnabled(data.autoAlphaEnabled ?? true);
        setEmployeeAutoAlphaEnabled(data.employeeAutoAlphaEnabled ?? true);
        setAutoAlphaTime(data.autoAlphaTime || '16:30');
        setAutoAlphaSkippedDates(Array.isArray(data.autoAlphaSkippedDates) ? data.autoAlphaSkippedDates : []);
        if (Array.isArray(data.workingDays) && data.workingDays.length > 0) {
          setWorkingDays(data.workingDays);
        } else {
          setWorkingDays([1, 2, 3, 4, 5]);
        }
        setIsActive(data.isActive ?? true);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        notify.error(parseApiError(err, 'Gagal memuat pengaturan absensi'));
      }
    } finally {
      setLoading(false);
    }
  };

  const validateTimes = (): boolean => {
    if (!workingDays || workingDays.length === 0) {
      notify.error('Pilih minimal 1 hari operasional/sekolah aktif.');
      return false;
    }

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

  const todayStr = getLocalDateString();
  const isTodaySkipped = autoAlphaSkippedDates.some((d) => d.date === todayStr);
  const todayDayOfWeek = new Date().getDay();
  const isTodaySchoolDay = workingDays.includes(todayDayOfWeek);

  const formatIndonesianDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const date = new Date(Date.UTC(y, m - 1, d));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleToggleSkipToday = () => {
    if (isTodaySkipped) {
      setAutoAlphaSkippedDates((prev) => prev.filter((d) => d.date !== todayStr));
      notify.success('Penandaan Alpa otomatis untuk HARI INI diaktifkan kembali. Pastikan klik Simpan Pengaturan.');
    } else {
      const newEntry: AttendanceExemptionDate = {
        date: todayStr,
        reason: 'Dilewati manual oleh Admin',
        createdAt: new Date().toISOString(),
      };
      setAutoAlphaSkippedDates((prev) => [newEntry, ...prev]);
      notify.info('Penandaan Alpa otomatis untuk HARI INI berhasil dilewati.');
    }
  };

  const handleAddExemptionDate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newExemptionDate) {
      notify.error('Pilih tanggal pengecualian libur terlebih dahulu.');
      return;
    }
    if (autoAlphaSkippedDates.some((d) => d.date === newExemptionDate)) {
      notify.error('Tanggal ini sudah terdaftar dalam daftar pengecualian.');
      return;
    }

    const newEntry: AttendanceExemptionDate = {
      date: newExemptionDate,
      reason: newExemptionReason.trim() || 'Libur Khusus / Kegiatan Sekolah',
      createdAt: new Date().toISOString(),
    };

    setAutoAlphaSkippedDates((prev) => [newEntry, ...prev]);
    setNewExemptionDate('');
    setNewExemptionReason('');
    notify.success(`Tanggal ${newExemptionDate} berhasil ditambahkan ke daftar pengecualian.`);
  };

  const handleRemoveExemptionDate = (dateToRemove: string) => {
    setAutoAlphaSkippedDates((prev) => prev.filter((d) => d.date !== dateToRemove));
    notify.info(`Tanggal ${dateToRemove} dihapus dari daftar pengecualian.`);
  };

  const handleRunAutoAlphaNow = async () => {
    try {
      setTriggeringAlpha(true);
      const res = await triggerAllAutoAlpha();
      notify.success(res?.message || 'Proses evaluasi penandaan Alpa otomatis berhasil dijalankan!');
    } catch (err: any) {
      notify.error(parseApiError(err, 'Gagal menjalankan evaluasi Alpa'));
    } finally {
      setTriggeringAlpha(false);
      setConfirmTriggerOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAttendanceSettings) {
      notify.error('Anda tidak memiliki izin untuk mengubah pengaturan absensi.');
      return;
    }

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
        autoAlphaEnabled,
        employeeAutoAlphaEnabled,
        autoAlphaTime,
        autoAlphaSkippedDates,
        workingDays,
        isActive,
      };

      await updateAttendanceSetting(payload);
      notify.success('Pengaturan jam, lokasi, dan otomatisasi absensi berhasil disimpan!');
    } catch (err: any) {
      notify.error(parseApiError(err, 'Gagal menyimpan pengaturan absensi'));
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
          canManageAttendanceSettings ? (
            <button
              type="submit"
              form="attendance-settings-form"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-sm font-medium">Memuat konfigurasi pengaturan absensi...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!canManageAttendanceSettings && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm shadow-2xs">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Mode Pratinjau (Hanya-Baca)</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Anda hanya memiliki izin melihat konfigurasi presensi. Opsi perubahan formulir dinonaktifkan.
                </p>
              </div>
            </div>
          )}
          {/* Segmented Tab Navigation */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row gap-1.5">
            {[
              {
                id: 'schedule' as const,
                label: 'Jadwal & Hari Sekolah',
                description: 'Hari operasional, jam masuk & pulang',
                icon: Clock,
                badge: `${workingDays.length} Hari Aktif`,
              },
              {
                id: 'methods' as const,
                label: 'Metode & Lokasi',
                description: 'RFID, GPS mandiri & titik geofencing',
                icon: MapPin,
                badge: radiusMeter ? `${radiusMeter}m` : undefined,
              },
              {
                id: 'automation' as const,
                label: 'Otomatisasi & Libur Khusus',
                description: 'Auto-Alpha harian & kalender libur',
                icon: Sparkles,
                badge: autoAlphaSkippedDates.length > 0 ? `${autoAlphaSkippedDates.length} Libur` : undefined,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActiveTab = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                    isActiveTab
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold ring-1 ring-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActiveTab
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          : 'bg-slate-200/70 text-slate-500'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs md:text-sm truncate">{tab.label}</div>
                      <div className="text-[11px] text-slate-400 font-normal hidden md:block truncate">
                        {tab.description}
                      </div>
                    </div>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        isActiveTab
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-200/60 text-slate-600 border-slate-300/50'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form id="attendance-settings-form" onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={!canManageAttendanceSettings} className="space-y-6 border-0 p-0 m-0 min-w-0 disabled:opacity-90">
              
              {/* TAB 1: JADWAL & HARI SEKOLAH */}
              {activeTab === 'schedule' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                  {/* Standard Header Section */}
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3.5 bg-slate-50/50 flex-wrap">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 m-0">Hari Sekolah & Rentang Jam Absensi</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Hari operasional aktif sekolah, batas waktu kedatangan, toleransi keterlambatan, dan kepulangan</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                        {workingDays.length} Hari Aktif Terpilih
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Section Hari Operasional / Hari Aktif Sekolah */}
                    <div className="bg-slate-50/70 p-5 md:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CalendarCheck size={15} className="text-indigo-600" />
                          Hari Operasional / Hari Sekolah Aktif
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pilih hari di mana presensi dan penandaan Alpa otomatis diberlakukan. Hari yang tidak dipilih otomatis menjadi hari libur sekolah.
                        </p>
                      </div>

                      {/* 7 Day Pills Multi-Checkbox */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1">
                        {DAY_OPTIONS.map((day) => {
                          const isSelected = workingDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (workingDays.length <= 1) {
                                    notify.warning('Minimal harus ada 1 hari aktif sekolah yang dipilih.');
                                    return;
                                  }
                                  setWorkingDays(workingDays.filter((d) => d !== day.value).sort());
                                } else {
                                  setWorkingDays([...workingDays, day.value].sort());
                                }
                              }}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-2xs ring-1 ring-indigo-500/20'
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-600'}`}>
                                  {day.label}
                                </span>
                                {isSelected && <Check size={12} className="text-indigo-600 stroke-[3]" />}
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {isSelected ? 'Aktif' : 'Libur'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60">
                        <span className="text-slate-600 font-medium">
                          Total: <strong className="text-slate-900 font-bold">{workingDays.length} hari</strong> operasional per minggu.
                        </span>
                        {workingDays.includes(6) ? (
                          <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/80 font-bold text-[11px] w-fit">
                            Sistem 6 Hari Sekolah (Sabtu Aktif Masuk)
                          </span>
                        ) : (
                          <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 font-bold text-[11px] w-fit">
                            Sistem 5 Hari Sekolah (Sabtu & Minggu Libur)
                          </span>
                        )}
                      </div>
                    </div>

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
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Validasi Aturan Jam Absensi</span>
                            {isActive ? (
                              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Aktif</span>
                            ) : (
                              <span className="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Nonaktif</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Jika aktif, sistem dan mesin biometrik akan memberlakukan validasi jam masuk dan pulang secara otomatis.
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <ToggleSwitch
                          checked={isActive}
                          onChange={setIsActive}
                          color="indigo"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: METODE & LOKASI */}
              {activeTab === 'methods' && (
                <div className="space-y-6">
                  {/* Card: Metode Presensi yang Diizinkan */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
                        <Sliders size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 m-0">Metode Presensi yang Diizinkan</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Tentukan jalur absensi yang aktif dan boleh digunakan oleh Siswa maupun Pegawai/Guru</p>
                      </div>
                    </div>

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
                              <ToggleSwitch
                                checked={studentRfidEnabled}
                                onChange={setStudentRfidEnabled}
                                color="indigo"
                              />
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
                              <ToggleSwitch
                                checked={studentGpsEnabled}
                                onChange={setStudentGpsEnabled}
                                color="blue"
                              />
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
                              <ToggleSwitch
                                checked={studentManualEnabled}
                                onChange={setStudentManualEnabled}
                                color="emerald"
                              />
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
                              <ToggleSwitch
                                checked={employeeRfidEnabled}
                                onChange={setEmployeeRfidEnabled}
                                color="indigo"
                              />
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
                              <ToggleSwitch
                                checked={employeeGpsEnabled}
                                onChange={setEmployeeGpsEnabled}
                                color="blue"
                              />
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
                              <ToggleSwitch
                                checked={employeeManualEnabled}
                                onChange={setEmployeeManualEnabled}
                                color="emerald"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Card: Lokasi & Geofencing GPS */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3.5 bg-slate-50/50 flex-wrap">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900 m-0">Lokasi & Geofencing GPS</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Titik koordinat sekolah dan batas radius meter toleransi presensi</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs cursor-pointer"
                      >
                        {showMap ? (
                          <>
                            <ChevronUp size={14} className="text-slate-500" />
                            <span>Sembunyikan Peta</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} className="text-slate-500" />
                            <span>Buka Peta Interaktif</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                      <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 flex items-center gap-3 text-purple-900 text-xs">
                        <span className="text-base">📍</span>
                        <p className="font-medium leading-relaxed">
                          Pilih lokasi titik pusat sekolah pada peta interaktif di bawah atau masukkan koordinat lintang/bujur secara manual. Presensi mobile hanya dapat dilakukan jika pengguna berada di dalam radius toleransi.
                        </p>
                      </div>

                      {/* Interactive Leaflet Map Container (Collapsible) */}
                      {showMap && (
                        <div className={`overflow-hidden rounded-2xl border border-slate-200 shadow-2xs transition-opacity ${!canManageAttendanceSettings ? 'pointer-events-none opacity-80' : ''}`}>
                          <MapLocationPicker
                            position={latitude !== '' && longitude !== '' ? [Number(latitude), Number(longitude)] : null}
                            radius={radiusMeter !== '' ? Number(radiusMeter) : null}
                            onLocationSelect={(lat, lng) => {
                              if (!canManageAttendanceSettings) return;
                              setLatitude(lat);
                              setLongitude(lng);
                            }}
                          />
                        </div>
                      )}

                      {/* Coordinates and Radius Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Latitude (Lintang)</label>
                          <input
                            type="number"
                            step="any"
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-500"
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
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-500"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="106.816666"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Radius Geofencing (Meter)</label>
                          <input
                            type="number"
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-500"
                            value={radiusMeter}
                            onChange={(e) => setRadiusMeter(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OTOMATISASI & LIBUR KHUSUS */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  {/* Card: Otomatisasi Presensi & Penandaan Alpa */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900 m-0">Otomatisasi Presensi & Penandaan Alpa (Auto-Alpha)</h2>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                  autoAlphaEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                Siswa: {autoAlphaEnabled ? 'Aktif' : 'Nonaktif'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                  employeeAutoAlphaEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                Pegawai: {employeeAutoAlphaEnabled ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Konfigurasi cron job penandaan Alpa otomatis siswa dan pegawai/guru tanpa presensi masuk, jam eksekusi, dan pengecualian hari libur
                          </p>
                        </div>
                      </div>

                      {canManageAttendanceSettings && (
                        <button
                          type="button"
                          disabled={triggeringAlpha}
                          onClick={() => setConfirmTriggerOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {triggeringAlpha ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Play size={13} className="fill-white" />
                          )}
                          <span>{triggeringAlpha ? 'Menjalankan...' : 'Jalankan Alpa Sekarang'}</span>
                        </button>
                      )}
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                      {/* Row 1: Master Switches & Jam Eksekusi */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Master Switch Siswa */}
                        <div className="bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap size={16} className="text-indigo-600 shrink-0" />
                              <span className="font-bold text-xs md:text-sm text-slate-900">Alpa Siswa</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Siswa tanpa presensi masuk akan otomatis ditandai <strong className="text-rose-600">ALPA</strong>.
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={autoAlphaEnabled}
                            onChange={setAutoAlphaEnabled}
                            color="indigo"
                          />
                        </div>

                        {/* Master Switch Pegawai */}
                        <div className="bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Users size={16} className="text-purple-600 shrink-0" />
                              <span className="font-bold text-xs md:text-sm text-slate-900">Alpa Pegawai</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Guru/pegawai aktif tanpa presensi masuk akan otomatis ditandai <strong className="text-rose-600">ALPA</strong>.
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={employeeAutoAlphaEnabled}
                            onChange={setEmployeeAutoAlphaEnabled}
                            color="purple"
                          />
                        </div>

                        {/* Jam Eksekusi Cron */}
                        <div className="bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-xs md:text-sm text-slate-900 flex items-center gap-1.5">
                              <Clock4 size={15} className="text-indigo-600" />
                              Jam Eksekusi Harian
                            </label>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {workingDays.length === 5 && !workingDays.includes(6) && !workingDays.includes(0)
                                ? 'Senin - Jumat'
                                : workingDays.length === 6 && !workingDays.includes(0)
                                ? 'Senin - Sabtu'
                                : `${workingDays.length} Hari Aktif`}
                            </span>
                          </div>
                          <input
                            type="time"
                            value={autoAlphaTime}
                            onChange={(e) => setAutoAlphaTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                          />
                          <p className="text-[10px] text-slate-500">
                            Disarankan setelah batas kepulangan (default: 16:30 WIB).
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Banner Aksi Cepat "Lewati Alpa Hari Ini" */}
                      <div
                        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          !isTodaySchoolDay
                            ? 'bg-slate-50/90 border-slate-200 text-slate-800'
                            : isTodaySkipped
                            ? 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs'
                            : 'bg-indigo-50/50 border-indigo-100 text-indigo-950'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              !isTodaySchoolDay
                                ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                : isTodaySkipped
                                ? 'bg-amber-100 text-amber-700 border border-amber-300/60'
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {!isTodaySchoolDay ? (
                              <CalendarOff size={18} />
                            ) : isTodaySkipped ? (
                              <CalendarOff size={18} />
                            ) : (
                              <CalendarCheck size={18} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">
                              {!isTodaySchoolDay
                                ? 'Hari Ini Libur Sekolah Rutin (Bukan Hari Aktif)'
                                : isTodaySkipped
                                ? 'Penandaan Alpa Hari Ini Dikecualikan / Dilewati'
                                : 'Status Hari Ini: Berjalan Normal'}
                            </h3>
                            <p className="text-xs mt-0.5 opacity-80 leading-relaxed">
                              {!isTodaySchoolDay
                                ? `Hari ini (${formatIndonesianDate(todayStr)}) tidak termasuk dalam hari aktif sekolah. Sistem tidak akan mengeksekusi penandaan Alpa otomatis.`
                                : isTodaySkipped
                                ? `Tanggal hari ini (${todayStr}) ada di daftar pengecualian. Siswa dan pegawai yang tidak hadir tidak akan ditandai Alpa otomatis.`
                                : `Penandaan Alpa otomatis akan dieksekusi hari ini pada pukul ${autoAlphaTime} WIB untuk siswa dan pegawai tanpa presensi.`}
                            </p>
                          </div>
                        </div>

                        {isTodaySchoolDay && (
                          <button
                            type="button"
                            onClick={handleToggleSkipToday}
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                              isTodaySkipped
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-slate-100'
                            }`}
                          >
                            {isTodaySkipped ? (
                              <>
                                <Check size={14} />
                                <span>Aktifkan Kembali Hari Ini</span>
                              </>
                            ) : (
                              <>
                                <CalendarOff size={14} className="text-rose-600" />
                                <span>Lewati Alpa Hari Ini</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card: Pengaturan Tanggal Libur Khusus & Pengecualian Presensi */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                          <CalendarOff size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900 m-0">Pengaturan Tanggal Libur Khusus & Pengecualian Presensi</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                              {autoAlphaSkippedDates.length} Tanggal Terdaftar
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Daftar tanggal libur khusus, cuti bersama, atau agenda kegiatan sekolah di mana sistem tidak akan menjalankan penandaan Alpa otomatis
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                      {/* Form Tambah Tanggal Libur Khusus */}
                      <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                        <div className="mb-3">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus size={14} className="text-indigo-600" />
                            Tambah Tanggal Pengecualian Baru
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pilih tanggal kalender dan tentukan keterangan libur (misal: Rapat Dinas, Class Meeting, Hari Libur Keagamaan).
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                          <div className="sm:w-56 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">Pilih Tanggal</label>
                            <input
                              type="date"
                              value={newExemptionDate}
                              onChange={(e) => setNewExemptionDate(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                            />
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">Keterangan / Alasan Libur</label>
                            <input
                              type="text"
                              placeholder="Contoh: Class Meeting Semester Ganjil, Libur Hardiknas, Rapat Kerja..."
                              value={newExemptionReason}
                              onChange={(e) => setNewExemptionReason(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddExemptionDate();
                                }
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddExemptionDate()}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer h-[42px] shrink-0"
                          >
                            <Plus size={15} />
                            <span>Tambah ke Daftar</span>
                          </button>
                        </div>
                      </div>

                      {/* Tabel Standar Daftar Tanggal Libur Khusus */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={14} className="text-indigo-600" />
                            Daftar Tanggal Libur Terdaftar
                          </h3>
                          <span className="text-xs text-slate-500">
                            Total: <strong className="text-slate-800">{autoAlphaSkippedDates.length}</strong> hari
                          </span>
                        </div>

                        {autoAlphaSkippedDates.length === 0 ? (
                          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                              <CalendarOff size={24} />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Belum Ada Tanggal Libur Khusus</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                              Belum ada tanggal libur yang terdaftar. Gunakan formulir di atas untuk mengecualikan tanggal tertentu dari sistem penandaan Alpa otomatis.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-2xs bg-white">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                                <tr>
                                  <th className="w-14 text-center py-3.5 px-3">No</th>
                                  <th className="py-3.5 px-4 min-w-[220px]">Tanggal Libur</th>
                                  <th className="py-3.5 px-4">Keterangan / Alasan Libur</th>
                                  <th className="w-36 py-3.5 px-4 text-center">Status Presensi</th>
                                  <th className="w-20 py-3.5 px-4 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs">
                                {autoAlphaSkippedDates.map((item, index) => {
                                  const isCurrentToday = item.date === todayStr;
                                  return (
                                    <tr key={item.date} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="text-center text-slate-400 py-3.5 px-3 font-mono font-medium">
                                        {index + 1}
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-slate-900 text-xs">
                                            {item.date}
                                          </span>
                                          {isCurrentToday && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                              Hari Ini
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                          {formatIndonesianDate(item.date)}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <span className="font-medium text-slate-800 text-xs">
                                          {item.reason || '-'}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                          Alpa Dikecualikan
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveExemptionDate(item.date)}
                                          title="Hapus tanggal ini dari daftar pengecualian"
                                          className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          </form>
        </div>
      )}

      {/* Confirmation Dialog for Manual Auto-Alpha Execution */}
      <ConfirmDialog
        open={confirmTriggerOpen}
        onClose={() => setConfirmTriggerOpen(false)}
        onConfirm={handleRunAutoAlphaNow}
        title="Jalankan Penandaan Alpa Sekarang?"
        message={
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Sistem akan memindai presensi untuk hari ini ({todayStr}):
            </p>
            <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
              <li>
                <strong>Siswa</strong>: Seluruh siswa aktif di rombel yang belum hadir akan ditandai <strong className="text-rose-600">ALPA</strong>.
              </li>
              <li>
                <strong>Pegawai & Guru</strong>: Seluruh pegawai/guru aktif yang belum hadir akan ditandai <strong className="text-rose-600">ALPA</strong>.
              </li>
            </ul>
            <p className="text-xs text-amber-700 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Perhatian: Tindakan ini akan langsung membuat catatan presensi ALPA baru bagi siswa dan pegawai yang belum memiliki catatan presensi hari ini.
            </p>
          </div>
        }
        variant="warning"
        confirmText="Ya, Jalankan Sekarang"
        cancelText="Batal"
        isLoading={triggeringAlpha}
      />
    </div>
  );
};
