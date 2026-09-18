/**
 * Web Audio API & Web Speech API synthesis utility for Attendance Kiosk Display
 * Zero external audio files required.
 */

class KioskAudioManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    try {
      this.cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      this.cachedVoices = [];
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays an elegant modern dual-tone chime for successful check-in
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 880 Hz (A5) - slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn('Audio playback failed', err);
    }
  }

  /**
   * Plays a distinct warning buzz for unregistered / error scans
   */
  public playWarningTone() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(146.83, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (err) {
      console.warn('Audio warning playback failed', err);
    }
  }

  private findBestVoice(lang: string = 'id'): SpeechSynthesisVoice | null {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    if (lang === 'ar') {
      const arVoice = this.cachedVoices.find(
        v => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
      );
      if (arVoice) return arVoice;
    } else {
      const idVoice = this.cachedVoices.find(
        v => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) return idVoice;
    }
    return this.cachedVoices.find(v => v.default) || this.cachedVoices[0] || null;
  }

  private speakRaw(text: string, delayMs: number = 0, lang: string = 'id') {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        setTimeout(() => {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'ar' ? 'ar-SA' : 'id-ID';
            utterance.rate = lang === 'ar' ? 0.90 : 0.95;
            utterance.pitch = 1.0;

            const voice = this.findBestVoice(lang);
            if (voice) {
              utterance.voice = voice;
            }

            utterance.onerror = (e) => {
              console.warn('Speech synthesis error:', e);
            };

            window.speechSynthesis.speak(utterance);
          } catch (innerErr) {
            console.warn('Speech synthesis inner error', innerErr);
          }
        }, 50);
      } catch (err) {
        console.warn('Speech synthesis cancel/resume error', err);
      }
    }, delayMs);
  }

  /**
   * Speaks a test phrase when language is switched
   */
  public speakLanguageSwitch(language: 'id' | 'jv' | 'su' | 'ar') {
    if (this.isMuted) return;
    this.playSuccessChime();
    let phrase = 'Mode Bahasa Indonesia diaktifkan.';
    if (language === 'jv') {
      phrase = 'Sugeng rawuh. Mode Basa Jawi dipun ginakaken.';
    } else if (language === 'su') {
      phrase = 'Wilujeng sumping. Mode Basa Sunda parantos diaktipkeun.';
    } else if (language === 'ar') {
      phrase = 'أهلاً وسهلاً. تم تفعيل اللغة العربية.';
    }
    this.speakRaw(phrase, 350, language);
  }

  /**
   * Speaks a friendly greeting in Indonesian, Javanese, Sundanese, or Arabic using Web Speech API
   */
  public speakGreeting(
    name: string,
    attendanceStatus: string,
    alreadyCheckedIn: boolean = false,
    checkinTime: string = '',
    language: 'id' | 'jv' | 'su' | 'ar' = 'id'
  ) {
    if (this.isMuted) return;
    const hour = new Date().getHours();
    const shortName = name.split(' ').slice(0, 2).join(' ');
    let text = '';

    if (language === 'ar') {
      // --- AL-LUGHAH AL-'ARABIYYAH (BAHASA ARAB) ---
      const arGreeting = (hour >= 4 && hour < 12) ? 'صباح الخير' : 'مساء الخير';
      if (alreadyCheckedIn) {
        text = `عفواً، ${shortName}. لقد تم تسجيل حضورك مسبقاً اليوم${checkinTime ? ` في الساعة ${checkinTime}` : ''}.`;
      } else if (attendanceStatus === 'Terlambat') {
        text = `${arGreeting}، ${shortName}. لقد تم تسجيل حضورك متأخراً اليوم.`;
      } else {
        text = `${arGreeting}، ${shortName}. تم تسجيل حضورك بنجاح. شكراً لك.`;
      }
    } else if (language === 'jv') {
      // --- BAHASA JAWA (KRAMA ALUS) ---
      let jvGreeting = 'Sugeng enjang';
      if (hour >= 11 && hour < 15) jvGreeting = 'Sugeng siang';
      else if (hour >= 15 && hour < 18) jvGreeting = 'Sugeng sonten';
      else if (hour >= 18 || hour < 4) jvGreeting = 'Sugeng dalu';

      if (alreadyCheckedIn) {
        text = `Nyuwun sewu, ${shortName}. Panjenengan sampun presensi dinten menika${checkinTime ? ` wau tabuh ${checkinTime}` : ''}.`;
      } else if (attendanceStatus === 'Terlambat') {
        text = `${jvGreeting}, ${shortName}. Nyuwun sewu, panjenengan kecatet telat dinten menika.`;
      } else {
        text = `${jvGreeting}, ${shortName}. Presensi panjenengan sampun kacatet. Matur nuwun.`;
      }
    } else if (language === 'su') {
      // --- BAHASA SUNDA (LEMES / KRAMA) ---
      let suGreeting = 'Wilujeng enjing';
      if (hour >= 11 && hour < 15) suGreeting = 'Wilujeng siang';
      else if (hour >= 15 && hour < 18) suGreeting = 'Wilujeng sonten';
      else if (hour >= 18 || hour < 4) suGreeting = 'Wilujeng wengi';

      if (alreadyCheckedIn) {
        text = `Punten, ${shortName}. Anjeun parantos presensi dinten ieu${checkinTime ? ` tadi tabuh ${checkinTime}` : ''}.`;
      } else if (attendanceStatus === 'Terlambat') {
        text = `${suGreeting}, ${shortName}. Punten, anjeun kacatet telat dinten ieu.`;
      } else {
        text = `${suGreeting}, ${shortName}. Kahadiran anjeun parantos kacatet. Hatur nuhun.`;
      }
    } else {
      // --- BAHASA INDONESIA ---
      let idGreeting = 'Selamat pagi';
      if (hour >= 11 && hour < 15) idGreeting = 'Selamat siang';
      else if (hour >= 15 && hour < 18) idGreeting = 'Selamat sore';
      else if (hour >= 18 || hour < 4) idGreeting = 'Selamat malam';

      if (alreadyCheckedIn) {
        text = `Perhatian, ${shortName}. Anda sudah melakukan presensi hari ini${checkinTime ? ` pada pukul ${checkinTime}` : ''}.`;
      } else if (attendanceStatus === 'Terlambat') {
        text = `${idGreeting}, ${shortName}. Perhatian, Anda tercatat datang terlambat.`;
      } else {
        text = `${idGreeting}, ${shortName}. Kehadiran Anda berhasil dicatat. Terima kasih.`;
      }
    }

    // Delay 350ms so chime plays first clearly before speech starts
    this.speakRaw(text, 350, language);
  }

  /**
   * Speaks a warning phrase when card is unrecognized / not detected
   */
  public speakUnrecognized(language: 'id' | 'jv' | 'su' | 'ar' = 'id') {
    if (this.isMuted) return;
    this.playWarningTone();
    let text = 'Tidak terdeteksi. Kartu belum terdaftar di sistem.';
    if (language === 'ar') {
      text = 'لم يتم التعرف على البطاقة. يرجى المحاولة مرة أخرى.';
    } else if (language === 'jv') {
      text = 'Mboten kadeteksi. Kertu dereng katampi wonten sistem.';
    } else if (language === 'su') {
      text = 'Henteu kadeteksi. Kartu teu acan kadaptar dina sistem.';
    }
    this.speakRaw(text, 350, language);
  }
}

export const kioskAudio = new KioskAudioManager();
