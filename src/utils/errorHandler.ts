/**
 * Utility untuk memproses pesan error teknis menjadi bahasa Indonesia yang jelas,
 * ramah pengguna, dan menjelaskan alasan kegagalan serta solusinya.
 */

// Kamus terjemahan nama kolom/atribut
const FIELD_NAMES: Record<string, string> = {
  code: 'Kode',
  name: 'Nama',
  capacity: 'Kapasitas',
  password: 'Kata Sandi',
  username: 'Username',
  level: 'Tingkat',
  educationLevel: 'Jenjang Pendidikan',
  gender: 'Jenis Kelamin',
  phone: 'Nomor Telepon',
  email: 'Alamat Email',
  address: 'Alamat',
  gradeId: 'Tingkat Kelas',
  majorId: 'Jurusan',
  classroomId: 'Rombel/Kelas',
  subjectId: 'Mata Pelajaran',
  academicYearId: 'Tahun Ajaran',
  semesterId: 'Semester',
  periodNumber: 'Nomor Jam Pelajaran',
  startTime: 'Jam Mulai',
  endTime: 'Jam Selesai',
  nip: 'NIP/NIK',
  employeeNumber: 'NIP/NIK',
  nis: 'NIS',
  nisn: 'NISN',
  title: 'Judul',
  points: 'Poin',
  targetAudience: 'Target Penerima',
  recipient: 'Penerima',
  letterNumber: 'Nomor Surat',
  sender: 'Pengirim',
  subject: 'Perihal',
  roleId: 'Peran (Role)',
  positionId: 'Jabatan',
};

/**
 * Menerjemahkan kalimat validasi class-validator ke bahasa Indonesia
 */
function translateValidationMessage(msg: string): string {
  let translated = msg;

  const words = translated.split(' ');
  const fieldKey = words[0];
  const fieldName = FIELD_NAMES[fieldKey] || fieldKey;

  if (translated.includes('should not be empty') || translated.includes('must not be empty') || translated.includes('is required')) {
    return `${fieldName} tidak boleh kosong.`;
  }
  if (translated.includes('must be a string')) {
    return `${fieldName} harus berupa teks.`;
  }
  if (translated.includes('must be an integer') || translated.includes('must be a number')) {
    return `${fieldName} harus berupa angka.`;
  }
  if (translated.includes('must be an email') || translated.includes('must be a valid email')) {
    return `Format ${fieldName} tidak valid (contoh: user@sekolah.sch.id).`;
  }
  if (translated.includes('must be a valid ISO 8601 date string') || translated.includes('must be a date')) {
    return `Format tanggal pada ${fieldName} tidak valid.`;
  }
  if (translated.includes('must be a boolean')) {
    return `${fieldName} harus berupa pilihan ya atau tidak.`;
  }

  const minMatch = translated.match(/must be longer than or equal to (\d+) characters/i);
  if (minMatch) {
    return `${fieldName} minimal harus berisi ${minMatch[1]} karakter.`;
  }
  const maxMatch = translated.match(/must be shorter than or equal to (\d+) characters/i);
  if (maxMatch) {
    return `${fieldName} maksimal berisi ${maxMatch[1]} karakter.`;
  }

  return translated;
}

/**
 * Menerjemahkan pesan error API menjadi pesan detail yang informatif
 */
export function getErrorMessage(error: any, fallbackMessage = 'Terjadi kesalahan saat memproses data'): string {
  if (!error) return fallbackMessage;

  // Jika error sudah berupa string murni
  if (typeof error === 'string') {
    return parseRawStringMessage(error, fallbackMessage);
  }

  const response = error.response;
  const status = response?.status;
  const data = response?.data;

  // 1. Tangani validation array dari NestJS/class-validator
  if (data?.message) {
    if (Array.isArray(data.message)) {
      const translatedItems = data.message.map((m: any) => 
        typeof m === 'string' ? translateValidationMessage(m) : JSON.stringify(m)
      );
      return translatedItems.join(' ');
    }
    
    if (typeof data.message === 'string') {
      const parsed = parseRawStringMessage(data.message, '');
      if (parsed) return parsed;
    }
  }

  if (data?.error && typeof data.error === 'string') {
    const parsed = parseRawStringMessage(data.error, '');
    if (parsed) return parsed;
  }

  // 2. Tangani berdasarkan HTTP Status Code
  if (status === 409) {
    return 'Data dengan informasi unik ini (seperti kode, nama, username, atau nomor identitas) sudah terdaftar di sistem. Mohon gunakan data yang berbeda.';
  }

  if (status === 400) {
    return 'Format data tidak valid atau ada kolom wajib yang belum diisi dengan benar. Mohon periksa kembali isian formulir Anda.';
  }

  if (status === 401) {
    return 'Sesi login Anda telah berakhir atau belum terautentikasi. Silakan muat ulang halaman atau login kembali.';
  }

  if (status === 403) {
    return 'Akses Ditolak: Akun Anda tidak memiliki izin untuk melakukan aksi ini. Silakan hubungi Administrator sistem jika Anda memerlukan akses.';
  }

  if (status === 404) {
    return 'Data yang dimaksud tidak ditemukan atau mungkin sudah dihapus dari sistem.';
  }

  if (status === 422) {
    return 'Data yang dikirim tidak dapat diproses karena tidak memenuhi ketentuan validasi relasi data.';
  }

  if (status >= 500) {
    const rawMsg = error.message || '';
    if (rawMsg.toLowerCase().includes('foreign key') || rawMsg.toLowerCase().includes('constraint')) {
      return 'Data tidak dapat dihapus atau diubah karena masih terhubung dengan data lain (misalnya kelas, siswa, guru, atau jadwal). Hapus atau pindahkan data terkait terlebih dahulu.';
    }
    return 'Terjadi kendala pada server database saat memproses data. Silakan coba beberapa saat lagi atau hubungi tim teknis.';
  }

  // 3. Tangani Axios runtime error message
  if (error.message && typeof error.message === 'string') {
    const parsed = parseRawStringMessage(error.message, '');
    if (parsed) return parsed;
  }

  // 4. Tangani Network Error
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Tidak dapat terhubung ke server backend. Pastikan server backend sedang berjalan dan koneksi jaringan Anda stabil.';
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Waktu permintaan habis (timeout). Server membutuhkan waktu terlalu lama untuk merespons, silakan coba lagi.';
  }

  return fallbackMessage;
}

/**
 * Parsing pola string bahasa Inggris umum yang sering muncul
 */
function parseRawStringMessage(raw: string, defaultVal: string): string {
  const lower = raw.toLowerCase();

  // Pattern: "Request failed with status code XXX"
  const statusMatch = raw.match(/Request failed with status code (\d+)/i);
  if (statusMatch) {
    const code = parseInt(statusMatch[1], 10);
    if (code === 409) return 'Data dengan kode/nama ini sudah terdaftar di sistem. Mohon gunakan kode atau nama yang berbeda.';
    if (code === 400) return 'Format formulir tidak valid atau ada kolom wajib yang belum diisi.';
    if (code === 403) return 'Akses Ditolak: Anda tidak memiliki hak akses untuk tindakan ini.';
    if (code === 404) return 'Data tidak ditemukan atau sudah dihapus.';
    if (code >= 500) return 'Terjadi kesalahan pada server. Mohon coba beberapa saat lagi.';
  }

  // Relasi data / Foreign key constraint
  if (
    lower.includes('foreign key') || 
    lower.includes('is still referenced') || 
    lower.includes('violates foreign key constraint') ||
    lower.includes('foreign_key_constraint') ||
    lower.includes('cannot delete')
  ) {
    return 'Data tidak dapat dihapus atau diubah karena masih terhubung dengan data lain (misalnya rombel kelas, data siswa, guru, jadwal, atau nilai). Mohon hapus atau pindahkan data terkait terlebih dahulu.';
  }

  // Duplikasi / Unique constraint
  if (lower.includes('already exists') || lower.includes('duplicate key') || lower.includes('unique constraint') || lower.includes('sudah terdaftar') || lower.includes('sudah ada')) {
    if (lower.includes('code') || lower.includes('kode')) {
      return 'Kode ini sudah digunakan pada data lain. Silakan masukkan kode yang berbeda.';
    }
    if (lower.includes('name') || lower.includes('nama')) {
      return 'Nama ini sudah terdaftar di sistem. Silakan gunakan nama yang berbeda.';
    }
    if (lower.includes('username')) {
      return 'Username ini sudah digunakan oleh akun lain. Silakan pilih username yang berbeda.';
    }
    if (lower.includes('nip') || lower.includes('nik') || lower.includes('employeenumber')) {
      return 'NIP/NIK ini sudah terdaftar pada pegawai lain.';
    }
    if (lower.includes('nis') || lower.includes('nisn')) {
      return 'NIS/NISN ini sudah terdaftar pada siswa lain.';
    }
    if (lower.includes('email')) {
      return 'Alamat email ini sudah terdaftar pada akun lain.';
    }
    if (lower.includes('classroom') || lower.includes('rombel') || lower.includes('kelas')) {
      return 'Rombel/kelas dengan kode ini sudah terdaftar.';
    }
    if (lower.includes('period') || lower.includes('jam')) {
      return 'Jam pelajaran ini sudah terdaftar.';
    }
    if (lower.includes('semester')) {
      return 'Semester ini sudah terdaftar untuk tahun ajaran yang dipilih.';
    }
    if (lower.includes('academic year') || lower.includes('tahun ajaran')) {
      return 'Tahun ajaran ini sudah terdaftar.';
    }
    return 'Data dengan informasi unik ini (kode atau nama) sudah ada di sistem. Mohon gunakan data yang berbeda.';
  }

  // Pola "Failed to [action] [entity]"
  if (lower.startsWith('failed to')) {
    if (lower.includes('classroom')) return 'Gagal memproses data rombel/kelas. Silakan periksa kembali kode dan data yang dimasukkan.';
    if (lower.includes('major')) return 'Gagal memproses data jurusan. Pastikan kode jurusan belum digunakan.';
    if (lower.includes('grade')) return 'Gagal memproses data tingkat kelas. Pastikan kode dan level belum digunakan.';
    if (lower.includes('subject')) return 'Gagal memproses data mata pelajaran. Pastikan kode mata pelajaran belum digunakan.';
    if (lower.includes('semester')) return 'Gagal memproses data semester.';
    if (lower.includes('academic year')) return 'Gagal memproses data tahun ajaran.';
    if (lower.includes('class period')) return 'Gagal memproses data jam pelajaran.';
    if (lower.includes('user')) return 'Gagal memproses data akun pengguna. Pastikan username belum digunakan.';
    if (lower.includes('role')) return 'Gagal memproses data peran (role).';
    if (lower.includes('permission')) return 'Gagal memproses hak akses.';
    if (lower.includes('save') || lower.includes('create') || lower.includes('update')) return 'Gagal menyimpan data ke sistem. Mohon periksa kembali isian formulir.';
    if (lower.includes('delete') || lower.includes('remove')) return 'Gagal menghapus data dari sistem.';
    if (lower.includes('fetch') || lower.includes('load')) return 'Gagal memuat data dari server.';
  }

  // Network Error
  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Tidak dapat terhubung ke server backend. Pastikan server backend sedang berjalan dan jaringan aktif.';
  }

  return defaultVal || raw;
}
