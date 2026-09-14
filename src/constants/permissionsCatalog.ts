export interface PermissionItem {
  name: string;
  label: string;
  resource: string;
  domain: string;
  description: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  icon: string;
  description: string;
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'academic',
    name: 'Akademik & Kurikulum',
    icon: 'GraduationCap',
    description: 'Pengaturan tahun ajaran, semester, tingkatan, jurusan, jam, dan mata pelajaran',
    permissions: [
      { name: 'academic_years.read', label: 'Lihat Tahun Ajaran', domain: 'Akademik', resource: 'Tahun Ajaran', description: 'Melihat daftar tahun ajaran' },
      { name: 'academic_years.create', label: 'Tambah Tahun Ajaran', domain: 'Akademik', resource: 'Tahun Ajaran', description: 'Membuat tahun ajaran baru' },
      { name: 'academic_years.update', label: 'Edit Tahun Ajaran', domain: 'Akademik', resource: 'Tahun Ajaran', description: 'Mengubah nama tahun ajaran' },
      { name: 'academic_years.delete', label: 'Hapus Tahun Ajaran', domain: 'Akademik', resource: 'Tahun Ajaran', description: 'Menghapus tahun ajaran' },
      { name: 'academic_years.toggle_active', label: 'Toggle Tahun Ajaran Aktif', domain: 'Akademik', resource: 'Tahun Ajaran', description: 'Menentukan tahun ajaran aktif' },
      
      { name: 'semesters.read', label: 'Lihat Semester', domain: 'Akademik', resource: 'Semester', description: 'Melihat daftar semester' },
      { name: 'semesters.create', label: 'Tambah Semester', domain: 'Akademik', resource: 'Semester', description: 'Membuat semester baru' },
      { name: 'semesters.update', label: 'Edit Semester', domain: 'Akademik', resource: 'Semester', description: 'Mengubah semester' },
      { name: 'semesters.delete', label: 'Hapus Semester', domain: 'Akademik', resource: 'Semester', description: 'Menghapus semester' },
      { name: 'semesters.toggle_active', label: 'Toggle Semester Aktif', domain: 'Akademik', resource: 'Semester', description: 'Menentukan semester aktif' },

      { name: 'grades.read', label: 'Lihat Jenjang Kelas', domain: 'Akademik', resource: 'Tingkatan', description: 'Melihat jenjang kelas' },
      { name: 'grades.create', label: 'Tambah Jenjang Kelas', domain: 'Akademik', resource: 'Tingkatan', description: 'Membuat jenjang kelas baru' },
      { name: 'grades.update', label: 'Edit Jenjang Kelas', domain: 'Akademik', resource: 'Tingkatan', description: 'Mengubah jenjang kelas' },
      { name: 'grades.delete', label: 'Hapus Jenjang Kelas', domain: 'Akademik', resource: 'Tingkatan', description: 'Menghapus jenjang kelas' },

      { name: 'majors.read', label: 'Lihat Jurusan', domain: 'Akademik', resource: 'Jurusan', description: 'Melihat daftar jurusan' },
      { name: 'majors.create', label: 'Tambah Jurusan', domain: 'Akademik', resource: 'Jurusan', description: 'Membuat jurusan baru' },
      { name: 'majors.update', label: 'Edit Jurusan', domain: 'Akademik', resource: 'Jurusan', description: 'Mengubah nama/kode jurusan' },
      { name: 'majors.delete', label: 'Hapus Jurusan', domain: 'Akademik', resource: 'Jurusan', description: 'Menghapus jurusan' },

      { name: 'class_periods.read', label: 'Lihat Jam Pelajaran', domain: 'Akademik', resource: 'Jam Pelajaran', description: 'Melihat alokasi jam pelajaran' },
      { name: 'class_periods.create', label: 'Tambah Jam Pelajaran', domain: 'Akademik', resource: 'Jam Pelajaran', description: 'Membuat slot jam baru' },
      { name: 'class_periods.update', label: 'Edit Jam Pelajaran', domain: 'Akademik', resource: 'Jam Pelajaran', description: 'Mengubah slot jam' },
      { name: 'class_periods.delete', label: 'Hapus Jam Pelajaran', domain: 'Akademik', resource: 'Jam Pelajaran', description: 'Menghapus slot jam' },

      { name: 'subjects.read', label: 'Lihat Mata Pelajaran', domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Melihat daftar mapel' },
      { name: 'subjects.create', label: 'Tambah Mata Pelajaran', domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Membuat mapel baru' },
      { name: 'subjects.update', label: 'Edit Mata Pelajaran', domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Mengubah mapel' },
      { name: 'subjects.delete', label: 'Hapus Mata Pelajaran', domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Menghapus mapel' },
    ]
  },
  {
    id: 'classrooms_scheduling',
    name: 'Kelas & Penjadwalan',
    icon: 'Calendar',
    description: 'Manajemen rombel kelas, wali kelas, plotting siswa, jadwal pelajaran, dan kenaikan kelas',
    permissions: [
      { name: 'classrooms.read', label: 'Lihat Data Kelas', domain: 'Kelas & Jadwal', resource: 'Kelas', description: 'Melihat rombel kelas' },
      { name: 'classrooms.create', label: 'Tambah Kelas Baru', domain: 'Kelas & Jadwal', resource: 'Kelas', description: 'Membuat rombel baru' },
      { name: 'classrooms.update', label: 'Edit Info Kelas', domain: 'Kelas & Jadwal', resource: 'Kelas', description: 'Mengubah info rombel' },
      { name: 'classrooms.delete', label: 'Hapus Kelas', domain: 'Kelas & Jadwal', resource: 'Kelas', description: 'Menghapus rombel' },
      { name: 'classrooms.manage_homeroom', label: 'Kelola Wali Kelas', domain: 'Kelas & Jadwal', resource: 'Kelas', description: 'Menugaskan atau mengganti wali kelas' },
      { name: 'classrooms.manage_students', label: 'Plotting Siswa Rombel', domain: 'Kelas & Jadwal', resource: 'Kelas', description: 'Menambah atau mengeluarkan siswa rombel' },

      { name: 'schedules.read', label: 'Lihat Jadwal Pelajaran', domain: 'Kelas & Jadwal', resource: 'Jadwal', description: 'Melihat jadwal mingguan' },
      { name: 'schedules.manage', label: 'Susun Jadwal Pelajaran', domain: 'Kelas & Jadwal', resource: 'Jadwal', description: 'Mengatur slot jadwal pelajaran & guru' },

      { name: 'promotions.read', label: 'Lihat Riwayat Kenaikan', domain: 'Kelas & Jadwal', resource: 'Kenaikan Kelas', description: 'Melihat riwayat kenaikan kelas' },
      { name: 'promotions.execute', label: 'Proses Kenaikan Kelas', domain: 'Kelas & Jadwal', resource: 'Kenaikan Kelas', description: 'Eksekusi batch promote kelas' },
      { name: 'promotions.revert', label: 'Batalkan Kenaikan Kelas', domain: 'Kelas & Jadwal', resource: 'Kenaikan Kelas', description: 'Membatalkan proses kenaikan kelas' },
      { name: 'graduations.read', label: 'Lihat Riwayat Kelulusan', domain: 'Kelas & Jadwal', resource: 'Kelulusan', description: 'Melihat riwayat kelulusan' },
      { name: 'graduations.execute', label: 'Proses Kelulusan Siswa', domain: 'Kelas & Jadwal', resource: 'Kelulusan', description: 'Eksekusi kelulusan siswa tingkat akhir' },
    ]
  },
  {
    id: 'employees',
    name: 'SDM & Kepegawaian',
    icon: 'Briefcase',
    description: 'Manajemen jabatan pegawai, data guru, staf, dan penugasan mata pelajaran',
    permissions: [
      { name: 'positions.read', label: 'Lihat Jabatan', domain: 'SDM & Pegawai', resource: 'Jabatan', description: 'Melihat daftar jabatan' },
      { name: 'positions.create', label: 'Tambah Jabatan Baru', domain: 'SDM & Pegawai', resource: 'Jabatan', description: 'Membuat jabatan baru' },
      { name: 'positions.update', label: 'Edit Jabatan', domain: 'SDM & Pegawai', resource: 'Jabatan', description: 'Mengubah jabatan' },
      { name: 'positions.delete', label: 'Hapus Jabatan', domain: 'SDM & Pegawai', resource: 'Jabatan', description: 'Menghapus jabatan' },

      { name: 'employees.read', label: 'Lihat Pegawai & Guru', domain: 'SDM & Pegawai', resource: 'Pegawai', description: 'Melihat daftar dan profil pegawai' },
      { name: 'employees.create', label: 'Tambah Pegawai Baru', domain: 'SDM & Pegawai', resource: 'Pegawai', description: 'Mendaftarkan pegawai baru' },
      { name: 'employees.update', label: 'Edit Profil Pegawai', domain: 'SDM & Pegawai', resource: 'Pegawai', description: 'Mengubah profil pegawai' },
      { name: 'employees.delete', label: 'Hapus Pegawai', domain: 'SDM & Pegawai', resource: 'Pegawai', description: 'Menghapus data pegawai' },
      { name: 'employees.assign_subjects', label: 'Penugasan Mapel Guru', domain: 'SDM & Pegawai', resource: 'Pegawai', description: 'Menugaskan guru ke mapel yang diampu' },
    ]
  },
  {
    id: 'students',
    name: 'Kesiswaan & Kedisiplinan',
    icon: 'Users',
    description: 'Buku induk siswa, wali murid, catatan prestasi, pelanggaran, dan ambang poin SP',
    permissions: [
      { name: 'students.read', label: 'Lihat Data Siswa', domain: 'Kesiswaan', resource: 'Siswa', description: 'Melihat buku induk siswa' },
      { name: 'students.create', label: 'Pendaftaran Siswa Baru', domain: 'Kesiswaan', resource: 'Siswa', description: 'Mendaftarkan siswa baru' },
      { name: 'students.update', label: 'Edit Biodata Siswa', domain: 'Kesiswaan', resource: 'Siswa', description: 'Mengubah biodata siswa' },
      { name: 'students.delete', label: 'Hapus Siswa', domain: 'Kesiswaan', resource: 'Siswa', description: 'Menghapus data siswa' },
      { name: 'students.manage_guardians', label: 'Kelola Wali Murid', domain: 'Kesiswaan', resource: 'Siswa', description: 'Mengatur relasi wali murid' },
      { name: 'students.export_import', label: 'Ekspor & Impor Siswa', domain: 'Kesiswaan', resource: 'Siswa', description: 'Ekspor impor data siswa via Excel' },

      { name: 'achievements.read', label: 'Lihat Prestasi Siswa', domain: 'Kesiswaan', resource: 'Prestasi', description: 'Melihat catatan prestasi siswa' },
      { name: 'achievements.create_all', label: 'Catat Prestasi (Semua Siswa)', domain: 'Kesiswaan', resource: 'Prestasi', description: 'Menambah prestasi untuk seluruh siswa tanpa batasan pengampu' },
      { name: 'achievements.create_assigned', label: 'Catat Prestasi (Siswa yang Diampu)', domain: 'Kesiswaan', resource: 'Prestasi', description: 'Menambah prestasi khusus siswa di kelas yang diajar atau diwalikan' },
      { name: 'achievements.create', label: 'Catat Prestasi Baru', domain: 'Kesiswaan', resource: 'Prestasi', description: 'Menambah prestasi siswa (kompatibilitas)' },
      { name: 'achievements.update', label: 'Edit Prestasi Siswa', domain: 'Kesiswaan', resource: 'Prestasi', description: 'Mengubah catatan prestasi' },
      { name: 'achievements.delete', label: 'Hapus Prestasi Siswa', domain: 'Kesiswaan', resource: 'Prestasi', description: 'Menghapus catatan prestasi' },

      { name: 'violations.read', label: 'Lihat Pelanggaran Siswa', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Melihat riwayat pelanggaran' },
      { name: 'violations.create_all', label: 'Catat Pelanggaran (Semua Siswa)', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Menginput catatan pelanggaran untuk seluruh siswa tanpa batasan pengampu' },
      { name: 'violations.create_assigned', label: 'Catat Pelanggaran (Siswa yang Diampu)', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Menginput catatan pelanggaran khusus siswa di kelas yang diajar atau diwalikan' },
      { name: 'violations.create', label: 'Catat Pelanggaran Baru', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Menginput catatan pelanggaran (kompatibilitas)' },
      { name: 'violations.update', label: 'Edit Pelanggaran Siswa', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Mengubah catatan pelanggaran' },
      { name: 'violations.delete', label: 'Hapus Pelanggaran', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Menghapus riwayat pelanggaran' },
      { name: 'violation_types.manage', label: 'Master Jenis Pelanggaran', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Mengatur kategori pelanggaran & poin' },
      { name: 'violation_thresholds.manage', label: 'Pengaturan Ambang Poin SP', domain: 'Kesiswaan', resource: 'Kedisiplinan', description: 'Mengatur batas poin SP 1, 2, 3' },
    ]
  },
  {
    id: 'attendance',
    name: 'Presensi & Kehadiran',
    icon: 'Clock',
    description: 'Pencatatan absensi siswa, pegawai, input massal rombel, dan aturan jam masuk',
    permissions: [
      { name: 'student_attendance.read', label: 'Rekap Presensi Siswa', domain: 'Presensi', resource: 'Presensi Siswa', description: 'Melihat laporan presensi siswa' },
      { name: 'student_attendance.record', label: 'Input Absensi Siswa', domain: 'Presensi', resource: 'Presensi Siswa', description: 'Pencatatan absensi harian' },
      { name: 'student_attendance.batch', label: 'Absensi Massal Rombel', domain: 'Presensi', resource: 'Presensi Siswa', description: 'Check-in kehadiran per rombel' },
      { name: 'employee_attendance.read', label: 'Rekap Presensi Pegawai', domain: 'Presensi', resource: 'Presensi Pegawai', description: 'Melihat laporan presensi pegawai' },
      { name: 'employee_attendance.record', label: 'Input Presensi Pegawai', domain: 'Presensi', resource: 'Presensi Pegawai', description: 'Pencatatan absensi pegawai' },
      { name: 'attendance_settings.manage', label: 'Pengaturan Waktu Presensi', domain: 'Presensi', resource: 'Pengaturan Presensi', description: 'Setting toleransi jam & radius' },
    ]
  },
  {
    id: 'hardware',
    name: 'Perangkat Keras & Kartu',
    icon: 'Cpu',
    description: 'Pemantauan mesin RFID/fingerprint dan registrasi kartu identitas',
    permissions: [
      { name: 'hardware.read_logs', label: 'Lihat Log Mesin Presensi', domain: 'Perangkat Keras', resource: 'Hardware', description: 'Melihat log tapping RFID/Fingerprint' },
      { name: 'hardware.assign_card', label: 'Registrasi Kartu & Fingerprint', domain: 'Perangkat Keras', resource: 'Hardware', description: 'Pairing kartu RFID atau sidik jari' },
    ]
  },
  {
    id: 'assessment',
    name: 'Penilaian & Rapor',
    icon: 'Award',
    description: 'Pengaturan bobot evaluasi, input nilai guru, validasi rapor, dan cetak PDF rapor',
    permissions: [
      { name: 'assessment_components.read', label: 'Lihat Komponen Nilai', domain: 'Penilaian & Rapor', resource: 'Komponen Nilai', description: 'Melihat jenis asesmen & bobot' },
      { name: 'assessment_components.manage', label: 'Atur Komponen & Bobot Nilai', domain: 'Penilaian & Rapor', resource: 'Komponen Nilai', description: 'Menentukan persentase UTS/UAS/Tugas' },
      { name: 'assessments.read', label: 'Lihat Nilai Mata Pelajaran', domain: 'Penilaian & Rapor', resource: 'Input Nilai', description: 'Melihat daftar nilai siswa' },
      { name: 'assessments.input', label: 'Input & Edit Nilai Mapel', domain: 'Penilaian & Rapor', resource: 'Input Nilai', description: 'Menginput dan memperbarui nilai' },
      { name: 'score_validations.read', label: 'Lihat Status Validasi', domain: 'Penilaian & Rapor', resource: 'Validasi Nilai', description: 'Melihat progres verifikasi rapor' },
      { name: 'score_validations.validate', label: 'Verifikasi Nilai Wali Kelas', domain: 'Penilaian & Rapor', resource: 'Validasi Nilai', description: 'Persetujuan nilai oleh wali kelas' },
      { name: 'score_validations.principal_approve', label: 'Pengesahan Kepala Sekolah', domain: 'Penilaian & Rapor', resource: 'Validasi Nilai', description: 'Pengesahan rapor oleh kepala sekolah' },
      { name: 'report_cards.read', label: 'Lihat Pratinjau Rapor', domain: 'Penilaian & Rapor', resource: 'Cetak Rapor', description: 'Melihat rapor siswa' },
      { name: 'report_cards.generate', label: 'Cetak & Ekspor Rapor PDF', domain: 'Penilaian & Rapor', resource: 'Cetak Rapor', description: 'Menghasilkan dokumen PDF rapor' },
    ]
  },
  {
    id: 'letters',
    name: 'Persuratan & Pengumuman',
    icon: 'Mail',
    description: 'Arsip surat masuk, surat keluar, nomor surat, template, dan papan pengumuman',
    permissions: [
      { name: 'incoming_letters.read', label: 'Lihat Surat Masuk', domain: 'Persuratan', resource: 'Surat Masuk', description: 'Melihat agenda surat masuk' },
      { name: 'incoming_letters.create', label: 'Catat Surat Masuk', domain: 'Persuratan', resource: 'Surat Masuk', description: 'Registrasi berkas surat masuk' },
      { name: 'incoming_letters.update', label: 'Edit Surat Masuk', domain: 'Persuratan', resource: 'Surat Masuk', description: 'Mengubah catatan surat masuk' },
      { name: 'incoming_letters.delete', label: 'Hapus Surat Masuk', domain: 'Persuratan', resource: 'Surat Masuk', description: 'Menghapus arsip surat masuk' },

      { name: 'outgoing_letters.read', label: 'Lihat Surat Keluar', domain: 'Persuratan', resource: 'Surat Keluar', description: 'Melihat agenda surat keluar' },
      { name: 'outgoing_letters.create', label: 'Buat Surat Keluar', domain: 'Persuratan', resource: 'Surat Keluar', description: 'Menerbitkan nomor surat keluar' },
      { name: 'outgoing_letters.update', label: 'Edit Surat Keluar', domain: 'Persuratan', resource: 'Surat Keluar', description: 'Mengubah catatan surat keluar' },
      { name: 'outgoing_letters.delete', label: 'Hapus Surat Keluar', domain: 'Persuratan', resource: 'Surat Keluar', description: 'Menghapus arsip surat keluar' },

      { name: 'letter_templates.read', label: 'Lihat Template Surat', domain: 'Persuratan', resource: 'Template Surat', description: 'Melihat koleksi template surat' },
      { name: 'letter_templates.manage', label: 'Kelola Template Surat', domain: 'Persuratan', resource: 'Template Surat', description: 'Membuat atau mengedit template surat' },

      { name: 'announcements.read', label: 'Lihat Pengumuman', domain: 'Persuratan', resource: 'Pengumuman', description: 'Melihat pengumuman sekolah' },
      { name: 'announcements.create', label: 'Buat Pengumuman Baru', domain: 'Persuratan', resource: 'Pengumuman', description: 'Menerbitkan berita sekolah' },
      { name: 'announcements.update', label: 'Edit Pengumuman', domain: 'Persuratan', resource: 'Pengumuman', description: 'Mengubah isi pengumuman' },
      { name: 'announcements.delete', label: 'Hapus Pengumuman', domain: 'Persuratan', resource: 'Pengumuman', description: 'Menghapus pengumuman' },
    ]
  },
  {
    id: 'system',
    name: 'Sistem & Pengaturan',
    icon: 'Shield',
    description: 'Profil sekolah, manajemen akun pengguna, pengelolaan peran sistem, dan dashboard',
    permissions: [
      { name: 'school_profile.read', label: 'Lihat Profil Sekolah', domain: 'Pengaturan Sistem', resource: 'Profil Sekolah', description: 'Melihat identitas sekolah' },
      { name: 'school_profile.update', label: 'Edit Profil & Kop Surat', domain: 'Pengaturan Sistem', resource: 'Profil Sekolah', description: 'Mengubah nama, logo, dan kop' },

      { name: 'users.read', label: 'Lihat Data Pengguna', domain: 'Pengaturan Sistem', resource: 'Manajemen Akun', description: 'Melihat daftar akun' },
      { name: 'users.create', label: 'Buat Akun Baru', domain: 'Pengaturan Sistem', resource: 'Manajemen Akun', description: 'Mendaftarkan akun login baru' },
      { name: 'users.update', label: 'Edit Akun Pengguna', domain: 'Pengaturan Sistem', resource: 'Manajemen Akun', description: 'Mengubah data akun' },
      { name: 'users.delete', label: 'Hapus / Nonaktifkan Akun', domain: 'Pengaturan Sistem', resource: 'Manajemen Akun', description: 'Menonaktifkan user' },
      { name: 'users.assign_roles', label: 'Atur Peran Akun', domain: 'Pengaturan Sistem', resource: 'Manajemen Akun', description: 'Menugaskan role ke user' },
      { name: 'users.reset_password', label: 'Reset Kata Sandi Akun', domain: 'Pengaturan Sistem', resource: 'Manajemen Akun', description: 'Mereset password user' },

      { name: 'roles.read', label: 'Lihat Peran Sistem', domain: 'Pengaturan Sistem', resource: 'RBAC', description: 'Melihat daftar role' },
      { name: 'roles.manage', label: 'Tambah / Hapus Peran', domain: 'Pengaturan Sistem', resource: 'RBAC', description: 'Membuat atau menghapus role' },
      { name: 'roles.assign_permissions', label: 'Atur Hak Akses Peran', domain: 'Pengaturan Sistem', resource: 'RBAC', description: 'Mapping permission ke role' },

      { name: 'dashboard.view_stats', label: 'Lihat Widget Dashboard', domain: 'Pengaturan Sistem', resource: 'Dashboard', description: 'Melihat statistik ringkasan' },
    ]
  }
];

export const getAllPermissions = (): PermissionItem[] => {
  return PERMISSION_GROUPS.flatMap(group => group.permissions);
};

export const getPermissionDetails = (name: string): PermissionItem | undefined => {
  return getAllPermissions().find(p => p.name === name);
};
