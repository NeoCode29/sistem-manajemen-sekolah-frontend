import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  Radio, 
  Send,
  User
} from 'lucide-react';
import { scanHardware, getKioskStats } from '../../api/hardwareService';
import { useSchoolProfile } from '../../hooks/useSchoolProfile';
import { kioskAudio } from '../../utils/kioskAudio';

interface RecentScanItem {
  id: string;
  name: string;
  identifier: string;
  roleOrClass: string;
  attendableType: 'Student' | 'Employee';
  attendanceStatus: string;
  time: string;
  photo?: string | null;
  alreadyCheckedIn?: boolean;
}

export type KioskLanguage = 'id' | 'jv' | 'su' | 'ar';

export const KioskAttendancePage: React.FC = () => {
  const { profile } = useSchoolProfile();

  // Language state (Indonesian, Javanese, Sundanese, or Arabic)
  const [language, setLanguage] = useState<KioskLanguage>(() => {
    return (localStorage.getItem('kiosk_attendance_lang') as KioskLanguage) || 'id';
  });
  const languageRef = useRef<KioskLanguage>(language);

  // Keep ref synchronized immediately to avoid stale closure in event handlers
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Audio & Fullscreen state
  const [isMuted, setIsMuted] = useState<boolean>(kioskAudio.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSimDrawer, setShowSimDrawer] = useState<boolean>(false);
  const [simCardInput, setSimCardInput] = useState<string>('');

  // Scan state
  const [scanState, setScanState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [activeScan, setActiveScan] = useState<RecentScanItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Live feed and stats
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    employees: 0
  });

  // Keystroke buffer for USB RFID reader
  const keyBufferRef = useRef<{ buffer: string; lastTime: number }>({ buffer: '', lastTime: 0 });
  const lastScannedCardRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const timeoutResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const executeScanRef = useRef<(code: string) => Promise<void>>(() => Promise.resolve());

  // Load real statistics and today's recent check-ins on mount + poll periodically
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const res = await getKioskStats();
        if (isMounted && res) {
          setStats({
            total: res.total || 0,
            students: res.students || 0,
            employees: res.employees || 0,
          });
          if (res.recentScans && Array.isArray(res.recentScans)) {
            setRecentScans(res.recentScans);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat statistik kehadiran kiosk:', err);
      }
    };

    fetchStats();
    const statsInterval = setInterval(fetchStats, 15000);

    return () => {
      isMounted = false;
      clearInterval(statsInterval);
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Global Keydown Listener for USB HID RFID Scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing in the manual simulation input drawer, ignore global listener
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      // Enter key indicates end of RFID scan string from USB reader
      if (e.key === 'Enter') {
        const code = keyBufferRef.current.buffer.trim();
        keyBufferRef.current = { buffer: '', lastTime: 0 };
        if (code.length >= 3) {
          e.preventDefault();
          executeScanRef.current(code);
        }
        return;
      }

      // Collect fast alphanumeric burst keystrokes (< 60ms between keys)
      if (e.key.length === 1) {
        const now = Date.now();
        if (now - keyBufferRef.current.lastTime > 250) {
          keyBufferRef.current.buffer = e.key;
        } else {
          keyBufferRef.current.buffer += e.key;
        }
        keyBufferRef.current.lastTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Process RFID scan
  const executeScan = async (cardCode: string) => {
    const now = Date.now();
    // Anti-double-tap lock (reject same card within 3 seconds)
    if (
      lastScannedCardRef.current.code === cardCode &&
      now - lastScannedCardRef.current.time < 3000
    ) {
      return;
    }
    lastScannedCardRef.current = { code: cardCode, time: now };

    if (timeoutResetRef.current) {
      clearTimeout(timeoutResetRef.current);
    }

    setScanState('PROCESSING');

    try {
      const response = await scanHardware({
        scanValue: cardCode,
        scanType: 'CARD',
        deviceId: 'KIOSK-LOBBY',
        mode: 'ATTENDANCE'
      });

      if (response.success && response.data) {
        const data = response.data;
        const isAlreadyIn = !!data.alreadyCheckedIn;
        const scanItem: RecentScanItem = {
          id: data.attendableId || String(Date.now()),
          name: data.name || 'Personil Sekolah',
          identifier: data.identifier || cardCode,
          roleOrClass: data.roleOrClass || (data.attendableType === 'Student' ? 'Siswa' : 'Pegawai'),
          attendableType: data.attendableType || 'Student',
          attendanceStatus: data.attendanceStatus || 'Hadir',
          time: data.time || new Date().toTimeString().substring(0, 8),
          photo: data.photo || null,
          alreadyCheckedIn: isAlreadyIn,
        };

        setActiveScan(scanItem);
        setScanState('SUCCESS');

        // Sound & speech with language preference (read from languageRef to avoid stale closure)
        kioskAudio.playSuccessChime();
        kioskAudio.speakGreeting(scanItem.name, scanItem.attendanceStatus, isAlreadyIn, scanItem.time, languageRef.current);

        // Update recent feed (deduplicating by ID and keeping newest at top)
        setRecentScans(prev => [scanItem, ...prev.filter(p => p.id !== scanItem.id).slice(0, 6)]);
        
        // Only increment counters if it's the first check-in of the day
        if (!isAlreadyIn) {
          setStats(prev => ({
            total: prev.total + 1,
            students: scanItem.attendableType === 'Student' ? prev.students + 1 : prev.students,
            employees: scanItem.attendableType === 'Employee' ? prev.employees + 1 : prev.employees
          }));
        }

        // Reset to idle after 3.8 seconds
        timeoutResetRef.current = setTimeout(() => {
          setScanState('IDLE');
          setActiveScan(null);
        }, 3800);

      } else {
        throw new Error(response.message || 'Kartu tidak dikenali atau belum terdaftar.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Kartu RFID belum terdaftar di sistem.';
      setErrorMessage(msg);
      setScanState('ERROR');
      kioskAudio.speakUnrecognized(languageRef.current);

      // Reset to idle after 3 seconds
      timeoutResetRef.current = setTimeout(() => {
        setScanState('IDLE');
        setErrorMessage('');
      }, 3000);
    }
  };

  // Always keep executeScanRef pointing to latest executeScan
  executeScanRef.current = executeScan;

  const handleLanguageChange = (newLang: KioskLanguage) => {
    languageRef.current = newLang; // immediate ref update for any pending callbacks
    setLanguage(newLang);
    localStorage.setItem('kiosk_attendance_lang', newLang);
    kioskAudio.speakLanguageSwitch(newLang);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    kioskAudio.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleManualSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simCardInput.trim()) {
      executeScan(simCardInput.trim());
      setSimCardInput('');
    }
  };

  // Formatted date string in Indonesian, Javanese, or Sundanese
  const formattedDate = useMemo(() => {
    if (language === 'jv') {
      const dayNames = ['Ahad', 'Senen', 'Selasa', 'Rebo', 'Kemis', 'Jemuwah', 'Setu'];
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const dayName = dayNames[currentTime.getDay()];
      const dayNum = currentTime.getDate();
      const monthName = monthNames[currentTime.getMonth()];
      const year = currentTime.getFullYear();
      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    }
    if (language === 'su') {
      const dayNames = ['Ahad', 'Senén', 'Salasa', 'Rebo', 'Kemis', 'Jumaah', 'Saptu'];
      const monthNames = [
        'Januari', 'Pébruari', 'Maret', 'April', 'Méi', 'Juni',
        'Juli', 'Agustus', 'Séptémber', 'Oktober', 'Nopémber', 'Désémber'
      ];
      const dayName = dayNames[currentTime.getDay()];
      const dayNum = currentTime.getDate();
      const monthName = monthNames[currentTime.getMonth()];
      const year = currentTime.getFullYear();
      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    }
    if (language === 'ar') {
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const dayName = dayNames[currentTime.getDay()];
      const dayNum = currentTime.getDate();
      const monthName = monthNames[currentTime.getMonth()];
      const year = currentTime.getFullYear();
      return `${dayName}، ${dayNum} ${monthName} ${year}`;
    }
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [currentTime, language]);

  const hoursStr = currentTime.getHours().toString().padStart(2, '0');
  const minutesStr = currentTime.getMinutes().toString().padStart(2, '0');
  const secondsStr = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none overflow-hidden relative font-sans">
      {/* Dynamic Background Ambient Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. Top Bar */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-2xl p-1" />
            ) : (
              <Sparkles size={24} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {profile.name || 'Sistem Manajemen Sekolah'}
            </h1>
            <p className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <span>
                {language === 'jv'
                  ? 'Kori Utama / Lobi'
                  : language === 'su'
                  ? 'Panto Utama / Lobi'
                  : language === 'ar'
                  ? 'المدخل الرئيسي / الردهة'
                  : 'Gerbang Utama / Lobi'}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-indigo-400 font-semibold">
                {language === 'jv'
                  ? 'Monitor Presensi Mandiri'
                  : language === 'su'
                  ? 'Monitor Presénsi Mandiri'
                  : language === 'ar'
                  ? 'شاشة الحضور الذاتي'
                  : 'Monitor Presensi Mandiri'}
              </span>
            </p>
          </div>
        </div>

        {/* Live Status & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi size={14} />
            <span>
              {language === 'jv'
                ? 'SISTEM SIAP'
                : language === 'su'
                ? 'SISTEM SAYAGA'
                : language === 'ar'
                ? 'النظام متصل وجاهز'
                : 'SISTEM ONLINE & SIAP'}
            </span>
          </div>

          {/* Segmented Language Selector (ID, JV, SU, AR) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 gap-1 shadow-sm">
            <button 
              onClick={() => handleLanguageChange('id')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                language === 'id'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Bahasa Indonesia"
            >
              <span>🇮🇩</span>
              <span>ID</span>
            </button>

            <button 
              onClick={() => handleLanguageChange('jv')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                language === 'jv'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Basa Jawa"
            >
              <span>ꦗ</span>
              <span>Jawa</span>
            </button>

            <button 
              onClick={() => handleLanguageChange('su')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                language === 'su'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Basa Sunda"
            >
              <span>ᮞ</span>
              <span>Sunda</span>
            </button>

            <button 
              onClick={() => handleLanguageChange('ar')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                language === 'ar'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="اللغة العربية"
            >
              <span>🇸🇦</span>
              <span>عربي</span>
            </button>
          </div>

          <button 
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
            title={isMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
          >
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
          </button>

          <button 
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (F11)'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={() => setShowSimDrawer(!showSimDrawer)}
            className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
          >
            Tes RFID Manual
          </button>
        </div>
      </header>

      {/* Optional Simulation Drawer */}
      {showSimDrawer && (
        <div className="bg-slate-900 border-b border-indigo-500/30 px-8 py-3 flex items-center justify-between z-20">
          <form onSubmit={handleManualSimSubmit} className="flex items-center gap-3 w-full max-w-xl">
            <span className="text-xs text-indigo-300 font-medium whitespace-nowrap">Simulasi Tap USB RFID:</span>
            <input 
              type="text"
              placeholder="Ketik nomor kartu RFID (lalu tekan Enter)..."
              value={simCardInput}
              onChange={(e) => setSimCardInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              autoFocus
            />
            <button 
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Send size={12} /> Kirim
            </button>
          </form>
          <button 
            onClick={() => setShowSimDrawer(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. Main Content Grid */}
      <main className="flex-1 px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Interactive Panel (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center h-full">
          {scanState === 'IDLE' && (
            <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
              {/* Giant Digital Clock */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-center gap-2 font-mono font-black text-7xl sm:text-8xl md:text-9xl text-white tracking-tight drop-shadow-2xl">
                  <span>{hoursStr}</span>
                  <span className="text-indigo-400 animate-pulse">:</span>
                  <span>{minutesStr}</span>
                  <span className="text-indigo-400 animate-pulse">:</span>
                  <span className="text-emerald-400 text-5xl sm:text-6xl md:text-7xl font-bold">{secondsStr}</span>
                </div>
                <p className="text-lg md:text-xl font-medium text-slate-300 tracking-wide">
                  {formattedDate}
                </p>
              </div>

              {/* Pulsing RFID Radar Wave */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 animate-ping opacity-60 pointer-events-none" />
                <div className="absolute w-36 h-36 rounded-full bg-emerald-500/15 animate-pulse pointer-events-none" />
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/20">
                  <Radio size={48} className="animate-pulse text-indigo-400" />
                </div>
              </div>

              {/* Instruction banner */}
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {language === 'jv'
                    ? 'Sumangga Tempelaken Kertu RFID'
                    : language === 'su'
                    ? 'Mangga Témpélkeun Kartu RFID'
                    : language === 'ar'
                    ? 'يرجى تمرير بطاقة RFID'
                    : 'Silakan Tempelkan Kartu RFID'}
                </h3>
                <p className="text-sm text-slate-400">
                  {language === 'jv'
                    ? 'Caketaken kertu identitas panjenengan dhateng mesin scanner USB ing meja utawi gapura'
                    : language === 'su'
                    ? 'Caketkeun kartu idéntitas anjeun kana mesin scanner USB dina méja atanapi gapura'
                    : language === 'ar'
                    ? 'قرب بطاقتك الذكية من جهاز القارئ عند المدخل أو المكتب'
                    : 'Dekatkan kartu identitas Anda pada mesin scanner USB di meja atau gerbang'}
                </p>
              </div>
            </div>
          )}

          {scanState === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                <Radio size={32} className="absolute text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">
                  {language === 'jv'
                    ? 'Mriksa Kertu...'
                    : language === 'su'
                    ? 'Mariksa Kartu...'
                    : language === 'ar'
                    ? 'جاري التحقق من البطاقة...'
                    : 'Memverifikasi Kartu...'}
                </h3>
                <p className="text-sm text-slate-400">
                  {language === 'jv'
                    ? 'Nyathet data rawuh panjenengan dhateng sistem...'
                    : language === 'su'
                    ? 'Nyatet data kahadiran anjeun kana sistem...'
                    : language === 'ar'
                    ? 'جاري تسجيل بيانات الحضور في النظام...'
                    : 'Mencatat data kehadiran Anda ke sistem...'}
                </p>
              </div>
            </div>
          )}

          {scanState === 'SUCCESS' && activeScan && (
            <div className={`bg-gradient-to-b from-slate-900/90 to-slate-900/60 border rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 space-y-6 ${
              activeScan.alreadyCheckedIn
                ? 'border-cyan-500/40 shadow-cyan-500/10'
                : activeScan.attendanceStatus === 'Terlambat'
                ? 'border-amber-500/50 shadow-amber-500/20'
                : 'border-emerald-500/40 shadow-emerald-500/10'
            }`}>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full animate-ping ${
                    activeScan.alreadyCheckedIn
                      ? 'bg-cyan-400'
                      : activeScan.attendanceStatus === 'Terlambat'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    activeScan.alreadyCheckedIn
                      ? 'text-cyan-400'
                      : activeScan.attendanceStatus === 'Terlambat'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {activeScan.alreadyCheckedIn
                      ? (language === 'jv' ? 'Presensi Sampun Kasimpen' : language === 'su' ? 'Presénsi Parantos Kacatet' : language === 'ar' ? 'تم تسجيل الحضور مسبقاً' : 'Presensi Sudah Tersimpan')
                      : activeScan.attendanceStatus === 'Terlambat'
                      ? (language === 'jv' ? 'Kecathet Kasep' : language === 'su' ? 'Kacatet Telat' : language === 'ar' ? 'تم التسجيل متأخراً' : 'Tercatat Terlambat')
                      : (language === 'jv' ? 'Presensi Kasembadan' : language === 'su' ? 'Presénsi Parantos Hasil' : language === 'ar' ? 'تم تسجيل الحضور بنجاح' : 'Presensi Berhasil Dicatat')}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">
                  {language === 'jv' || language === 'su' ? 'Tabuh' : language === 'ar' ? 'الساعة' : 'Pukul'} {activeScan.time} {language === 'ar' ? '' : 'WIB'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {/* Profile Photo / Avatar */}
                <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-1 flex-shrink-0 shadow-xl bg-gradient-to-tr ${
                  activeScan.alreadyCheckedIn
                    ? 'from-cyan-600 to-blue-600'
                    : activeScan.attendanceStatus === 'Terlambat'
                    ? 'from-amber-600 to-rose-600'
                    : 'from-indigo-600 to-emerald-600'
                }`}>
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                    {activeScan.photo ? (
                      <img src={activeScan.photo} alt={activeScan.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={56} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Identity Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      activeScan.attendableType === 'Student' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {activeScan.attendableType === 'Student' ? <GraduationCap size={14} /> : <Briefcase size={14} />}
                      {activeScan.attendableType === 'Student' 
                        ? (language === 'ar' ? 'طالب' : language === 'su' ? 'Murid / Siswa' : 'Siswa') 
                        : (language === 'ar' ? 'معلم / موظف' : language === 'jv' ? 'Guru / Karyawan' : language === 'su' ? 'Guru / Pagawé' : 'Guru / Pegawai')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeScan.identifier}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {activeScan.name}
                  </h2>

                  <p className="text-lg font-semibold text-indigo-300">
                    {activeScan.roleOrClass}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              {activeScan.alreadyCheckedIn ? (
                <div className="flex items-center justify-between p-4 rounded-2xl border bg-cyan-500/15 border-cyan-500/30 text-cyan-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-cyan-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-base">
                        {language === 'jv' 
                          ? 'SAMPUN PRESENSI DINTEN MENIKA' 
                          : language === 'su'
                          ? 'PARANTOS PRESÉNSI DINTEN IEU'
                          : language === 'ar'
                          ? 'تم تسجيل الحضور مسبقاً اليوم'
                          : 'SUDAH MELAKUKAN PRESENSI HARI INI'}
                      </div>
                      <div className="text-xs opacity-85">
                        {language === 'jv' 
                          ? `Wau sampun kacathet tabuh ${activeScan.time} WIB lan mboten dipuncathet malih.`
                          : language === 'su'
                          ? `Data kahadiran parantos kacatet tabuh ${activeScan.time} WIB sarta henteu dicatet deui.`
                          : language === 'ar'
                          ? `تم حفظ بيانات حضورك في الساعة ${activeScan.time}. لن يتم تسجيلها مرة أخرى.`
                          : `Data kehadiran Anda sudah tersimpan pada pukul ${activeScan.time} WIB. Tidak dicatat ulang.`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                      {language === 'jv' ? 'Kahanan' : language === 'su' ? 'Kaayaan' : language === 'ar' ? 'الحالة' : 'Status'}
                    </span>
                    <span className="text-sm font-extrabold uppercase text-cyan-300">
                      {language === 'jv' ? 'Sampun Absen' : language === 'su' ? 'Parantos Absen' : language === 'ar' ? 'حاضر مسبقاً' : 'Sudah Absen'}
                    </span>
                  </div>
                </div>
              ) : activeScan.attendanceStatus === 'Terlambat' ? (
                <div className="flex items-center justify-between p-4 rounded-2xl border bg-amber-500/20 border-amber-500/40 text-amber-300">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={24} className="text-amber-400 flex-shrink-0 animate-bounce" />
                    <div>
                      <div className="font-bold text-base">
                        {language === 'jv' 
                          ? 'KECATHET KASEP / TELAT' 
                          : language === 'su'
                          ? 'KACATET TELAT'
                          : language === 'ar'
                          ? 'تم تسجيل الحضور متأخراً'
                          : 'TERCATAT TERLAMBAT'}
                      </div>
                      <div className="text-xs opacity-90">
                        {language === 'jv'
                          ? `Rawuh tabuh ${activeScan.time} WIB nglangkungi wates wekdal. Dinten candhakipun mugi rawuh langkung enjang.`
                          : language === 'su'
                          ? `Sumping tabuh ${activeScan.time} WIB langkung tina wates waktos. Enjing-enjing mugi tiasa sumping langkung awal.`
                          : language === 'ar'
                          ? `الوصول في الساعة ${activeScan.time} تجاوز وقت الدوام. يرجى الحضور مبكراً في الأيام القادمة.`
                          : `Tiba pukul ${activeScan.time} WIB melewati batas toleransi. Harap hadir lebih awal di hari berikutnya.`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                      {language === 'jv' ? 'Kahanan' : language === 'su' ? 'Kaayaan' : language === 'ar' ? 'الحالة' : 'Status'}
                    </span>
                    <span className="text-sm font-extrabold uppercase text-amber-300">
                      {language === 'jv' ? 'Kasep' : language === 'su' ? 'Telat' : language === 'ar' ? 'متأخر' : 'Terlambat'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-2xl border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-base">
                        {language === 'jv' 
                          ? 'RAWUH TEPAT WEKDAL' 
                          : language === 'su'
                          ? 'SUMPING TEPAT WAKTOS'
                          : language === 'ar'
                          ? 'حضور في الوقت المحدد'
                          : 'HADIR TEPAT WAKTU'}
                      </div>
                      <div className="text-xs opacity-80">
                        {language === 'jv' 
                          ? 'Matur nuwun sanget, sugeng sinau lan makarya!' 
                          : language === 'su'
                          ? 'Hatur nuhun pisan, wilujeng diajar sarta ngajalankeun kagiatan!'
                          : language === 'ar'
                          ? 'شكراً جزيلاً لك، ونتمنى لك يوماً دراسياً موفقاً!'
                          : 'Terima kasih dan selamat belajar / beraktivitas!'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                      {language === 'jv' ? 'Kahanan' : language === 'su' ? 'Kaayaan' : language === 'ar' ? 'الحالة' : 'Status'}
                    </span>
                    <span className="text-sm font-extrabold uppercase text-emerald-300">
                      {language === 'jv' ? 'Hadir' : language === 'su' ? 'Hadir' : language === 'ar' ? 'حاضر' : 'Hadir'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {scanState === 'ERROR' && (
            <div className="bg-gradient-to-b from-rose-950/80 to-slate-900 border border-rose-500/40 rounded-3xl p-8 shadow-2xl shadow-rose-500/10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <AlertCircle size={44} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-3xl font-extrabold text-white">
                  {language === 'jv'
                    ? 'Kertu Mboten Kadeteksi'
                    : language === 'su'
                    ? 'Kartu Henteu Kadetéksi'
                    : language === 'ar'
                    ? 'لم يتم التعرف على البطاقة'
                    : 'Kartu Tidak Terdeteksi'}
                </h3>
                <p className="text-base text-rose-300 font-medium max-w-md mx-auto">
                  {errorMessage || (
                    language === 'jv'
                      ? 'Nomer kertu RFID dereng kacathet wonten sistem.'
                      : language === 'su'
                      ? 'Nomer kartu RFID teu acan kadaptar dina sistem.'
                      : language === 'ar'
                      ? 'رقم البطاقة غير مسجل في النظام أو الشخص غير مفعّل.'
                      : 'Nomor kartu RFID belum terdaftar di sistem.'
                  )}
                </p>
              </div>
              <p className="text-xs text-slate-400 pt-2">
                {language === 'jv'
                  ? 'Sumangga hubungi operator administrasi sekolah kagem ndaptaraken kertu RFID.'
                  : language === 'su'
                  ? 'Mangga wartosan operator administrasi sakola kanggo ngadaptarkeun kartu RFID.'
                  : language === 'ar'
                  ? 'يرجى مراجعة إدارة المدرسة لتسجيل وتفعيل بطاقة RFID.'
                  : 'Silakan hubungi operator administrasi sekolah untuk pendaftaran kartu RFID.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Feed & Statistics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                <Users size={16} />
              </div>
              <div className="text-2xl font-black text-white">{stats.total}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'jv' ? 'Gunggung Rawuh' : language === 'su' ? 'Jumlah Lebet' : language === 'ar' ? 'إجمالي الحضور' : 'Total Masuk'}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                <GraduationCap size={16} />
              </div>
              <div className="text-2xl font-black text-white">{stats.students}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'su' ? 'Murid / Siswa' : language === 'ar' ? 'الطلاب' : 'Siswa'}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                <Briefcase size={16} />
              </div>
              <div className="text-2xl font-black text-white">{stats.employees}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'jv' ? 'Guru / Karyawan' : language === 'su' ? 'Guru / Pagawé' : language === 'ar' ? 'المعلمون / الموظفون' : 'Guru / Staf'}
              </div>
            </div>
          </div>

          {/* Live Recent Feed */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 flex-1 flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                {language === 'jv' ? 'Aktivitas Tap Enggal' : language === 'su' ? 'Aktivitas Tap Panganyarna' : language === 'ar' ? 'آخر عمليات الحضور' : 'Aktivitas Tap Terkini'}
              </h4>
              <span className="text-xs font-medium text-slate-500">Live Real-time</span>
            </div>

            <div className="flex-1 overflow-hidden space-y-2.5">
              {recentScans.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Radio size={32} className="mb-2 text-slate-600 animate-pulse" />
                  <p className="text-xs">
                    {language === 'jv'
                      ? 'Dereng wonten aktivitas tap kertu ing wekdal menika.'
                      : language === 'su'
                      ? 'Teu acan aya aktivitas tap kartu dina waktos ieu.'
                      : language === 'ar'
                      ? 'لا توجد عمليات حضور مسجلة حتى الآن.'
                      : 'Belum ada aktivitas tap kartu pada sesi ini.'}
                  </p>
                </div>
              ) : (
                recentScans.map((item, idx) => (
                  <div 
                    key={`${item.id}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700/80 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.attendableType === 'Student' 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                          : 'bg-purple-600/20 text-purple-400 border border-purple-500/20'
                      }`}>
                        {item.attendableType === 'Student' ? 'S' : 'G'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate max-w-[150px] sm:max-w-[180px]">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.roleOrClass}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-semibold text-slate-200">{item.time}</div>
                      <div className={`text-[10px] font-bold uppercase ${
                        item.attendanceStatus === 'Terlambat' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {item.attendanceStatus}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Bottom Ticker */}
      <footer className="px-8 py-3 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md z-10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
            INFO
          </span>
          <div className="truncate text-slate-300">
            {language === 'jv'
              ? `Sugeng rawuh ing ${profile.name || 'Sekolah'}. Budayakaken mesem, aruh-aruh, salam, sopan, lan santun. Pasthekaken kertu panjenengan dipuntap nalika rawuh lan saderengipun kondur.`
              : language === 'su'
              ? `Wilujeng sumping di ${profile.name || 'Sakola'}. Biasakeun seuri, sapa, salam, sopan, sarta santun. Pastikeun kartu anjeun ditap nalika sumping sarta sateuacan mulih.`
              : language === 'ar'
              ? `أهلاً وسهلاً بكم في ${profile.name || 'المدرسة'}. يرجى التأكد من تمرير بطاقتك الذكية عند الحضور وعند الانصراف.`
              : `Selamat datang di ${profile.name || 'Sekolah'}. Budayakan senyum, sapa, salam, sopan, dan santun. Pastikan kartu Anda ditap saat tiba dan sebelum meninggalkan sekolah.`}
          </div>
        </div>
        <div className="whitespace-nowrap font-mono text-slate-500 text-[11px] pl-4 hidden md:block">
          SekolahApp v2.0 • Kiosk Mode
        </div>
      </footer>
    </div>
  );
};

export default KioskAttendancePage;
