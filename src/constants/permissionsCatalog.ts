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
  // 1. Akademik & Kurikulum
  {
    id: 'academic',
    name: 'Akademik & Kurikulum',
    icon: 'GraduationCap',
    description: 'Pengaturan tahun ajaran, semester, tingkatan, jurusan, jam, dan mata pelajaran',
    permissions: [
      { name: 'academic_years.read',          label: 'Lihat Tahun Ajaran',         domain: 'Akademik', resource: 'Tahun Ajaran',   description: 'Melihat daftar tahun ajaran' },
      { name: 'academic_years.create',        label: 'Tambah Tahun Ajaran',        domain: 'Akademik', resource: 'Tahun Ajaran',   description: 'Membuat tahun ajaran baru' },
      { name: 'academic_years.update',        label: 'Edit Tahun Ajaran',          domain: 'Akademik', resource: 'Tahun Ajaran',   description: 'Mengubah nama tahun ajaran' },
      { name: 'academic_years.delete',        label: 'Hapus Tahun Ajaran',         domain: 'Akademik', resource: 'Tahun Ajaran',   description: 'Menghapus tahun ajaran' },
      { name: 'academic_years.toggle_active', label: 'Toggle Tahun Ajaran Aktif',  domain: 'Akademik', resource: 'Tahun Ajaran',   description: 'Menentukan tahun ajaran aktif' },

      { name: 'semesters.read',               label: 'Lihat Semester',             domain: 'Akademik', resource: 'Semester',       description: 'Melihat daftar semester' },
      { name: 'semesters.create',             label: 'Tambah Semester',            domain: 'Akademik', resource: 'Semester',       description: 'Membuat semester baru' },
      { name: 'semesters.update',             label: 'Edit Semester',              domain: 'Akademik', resource: 'Semester',       description: 'Mengubah semester' },
      { name: 'semesters.delete',             label: 'Hapus Semester',             domain: 'Akademik', resource: 'Semester',       description: 'Menghapus semester' },
      { name: 'semesters.toggle_active',      label: 'Toggle Semester Aktif',      domain: 'Akademik', resource: 'Semester',       description: 'Menentukan semester aktif' },

      { name: 'grades.read',                  label: 'Lihat Jenjang Kelas',        domain: 'Akademik', resource: 'Tingkatan',      description: 'Melihat jenjang kelas' },
      { name: 'grades.create',                label: 'Tambah Jenjang Kelas',       domain: 'Akademik', resource: 'Tingkatan',      description: 'Membuat jenjang kelas baru' },
      { name: 'grades.update',                label: 'Edit Jenjang Kelas',         domain: 'Akademik', resource: 'Tingkatan',      description: 'Mengubah jenjang kelas' },
      { name: 'grades.delete',                label: 'Hapus Jenjang Kelas',        domain: 'Akademik', resource: 'Tingkatan',      description: 'Menghapus jenjang kelas' },

      { name: 'majors.read',                  label: 'Lihat Jurusan',              domain: 'Akademik', resource: 'Jurusan',        description: 'Melihat daftar jurusan' },
      { name: 'majors.create',                label: 'Tambah Jurusan',             domain: 'Akademik', resource: 'Jurusan',        description: 'Membuat jurusan baru' },
      { name: 'majors.update',                label: 'Edit Jurusan',               domain: 'Akademik', resource: 'Jurusan',        description: 'Mengubah nama/kode jurusan' },
      { name: 'majors.delete',                label: 'Hapus Jurusan',              domain: 'Akademik', resource: 'Jurusan',        description: 'Menghapus jurusan' },

      { name: 'class_periods.read',           label: 'Lihat Jam Pelajaran',        domain: 'Akademik', resource: 'Jam Pelajaran',  description: 'Melihat alokasi jam pelajaran' },
      { name: 'class_periods.create',         label: 'Tambah Jam Pelajaran',       domain: 'Akademik', resource: 'Jam Pelajaran',  description: 'Membuat slot jam baru' },
      { name: 'class_periods.update',         label: 'Edit Jam Pelajaran',         domain: 'Akademik', resource: 'Jam Pelajaran',  description: 'Mengubah slot jam' },
      { name: 'class_periods.delete',         label: 'Hapus Jam Pelajaran',        domain: 'Akademik', resource: 'Jam Pelajaran',  description: 'Menghapus slot jam' },

      { name: 'subjects.read',                label: 'Lihat Mata Pelajaran',       domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Melihat daftar mapel' },
      { name: 'subjects.create',              label: 'Tambah Mata Pelajaran',      domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Membuat mapel baru' },
      { name: 'subjects.update',              label: 'Edit Mata Pelajaran',        domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Mengubah mapel' },
      { name: 'subjects.delete',              label: 'Hapus Mata Pelajaran',       domain: 'Akademik', resource: 'Mata Pelajaran', description: 'Menghapus mapel' },
    ],
  },

  // 2. Kelas & Penjadwalan
  {
    id: 'classrooms_scheduling',
    name: 'Kelas & Penjadwalan',
    icon: 'Calendar',
    description: 'Manajemen rombel kelas, wali kelas, plotting siswa, jadwal pelajaran, dan kenaikan kelas',
    permissions: [
      { name: 'classrooms.read',            label: 'Lihat Kelas',                domain: 'Kelas', resource: 'Rombel',    description: 'Melihat daftar rombel kelas' },
      { name: 'classrooms.create',          label: 'Tambah Kelas',               domain: 'Kelas', resource: 'Rombel',    description: 'Membuat rombel kelas baru' },
      { name: 'classrooms.update',          label: 'Edit Kelas',                 domain: 'Kelas', resource: 'Rombel',    description: 'Mengubah data rombel' },
      { name: 'classrooms.delete',          label: 'Hapus Kelas',                domain: 'Kelas', resource: 'Rombel',    description: 'Menghapus rombel kelas' },
      { name: 'classrooms.manage_homeroom', label: 'Kelola Wali Kelas',          domain: 'Kelas', resource: 'Rombel',    description: 'Menugaskan wali kelas ke rombel' },
      { name: 'classrooms.manage_students', label: 'Kelola Siswa di Kelas',      domain: 'Kelas', resource: 'Rombel',    description: 'Plotting siswa ke rombel' },

      { name: 'schedules.read',             label: 'Lihat Jadwal Pelajaran',     domain: 'Kelas', resource: 'Jadwal',    description: 'Melihat jadwal pelajaran' },
      { name: 'schedules.manage',           label: 'Kelola Jadwal Pelajaran',    domain: 'Kelas', resource: 'Jadwal',    description: 'Membuat dan mengubah jadwal pelajaran' },

      { name: 'promotions.read',            label: 'Lihat Kenaikan Kelas',       domain: 'Kelas', resource: 'Kenaikan',  description: 'Melihat status kenaikan kelas siswa' },
      { name: 'promotions.execute',         label: 'Proses Kenaikan Kelas',      domain: 'Kelas', resource: 'Kenaikan',  description: 'Menjalankan proses kenaikan kelas' },
      { name: 'promotions.revert',          label: 'Batalkan Kenaikan Kelas',    domain: 'Kelas', resource: 'Kenaikan',  description: 'Membatalkan proses kenaikan kelas' },

      { name: 'graduations.read',           label: 'Lihat Kelulusan',            domain: 'Kelas', resource: 'Kelulusan', description: 'Melihat data kelulusan siswa' },
      { name: 'graduations.execute',        label: 'Proses Kelulusan',           domain: 'Kelas', resource: 'Kelulusan', description: 'Menjalankan proses kelulusan' },
    ],
  },

  // 3. SDM & Kepegawaian
  {
    id: 'hr',
    name: 'SDM & Kepegawaian',
    icon: 'Briefcase',
    description: 'Manajemen jabatan pegawai, data guru, staf, dan penugasan mata pelajaran',
    permissions: [
      { name: 'positions.read',          label: 'Lihat Jabatan',               domain: 'SDM', resource: 'Jabatan',  description: 'Melihat daftar jabatan' },
      { name: 'positions.create',        label: 'Tambah Jabatan',              domain: 'SDM', resource: 'Jabatan',  description: 'Membuat jabatan baru' },
      { name: 'positions.update',        label: 'Edit Jabatan',                domain: 'SDM', resource: 'Jabatan',  description: 'Mengubah jabatan' },
      { name: 'positions.delete',        label: 'Hapus Jabatan',               domain: 'SDM', resource: 'Jabatan',  description: 'Menghapus jabatan' },

      { name: 'employees.read',          label: 'Lihat Data Pegawai',          domain: 'SDM', resource: 'Pegawai',  description: 'Melihat data pegawai/guru' },
      { name: 'employees.create',        label: 'Tambah Pegawai',              domain: 'SDM', resource: 'Pegawai',  description: 'Mendaftarkan pegawai baru' },
      { name: 'employees.update',        label: 'Edit Data Pegawai',           domain: 'SDM', resource: 'Pegawai',  description: 'Mengubah data pegawai' },
      { name: 'employees.delete',        label: 'Hapus Pegawai',               domain: 'SDM', resource: 'Pegawai',  description: 'Menghapus data pegawai' },
      { name: 'employees.assign_subjects', label: 'Tugaskan Mapel ke Guru',    domain: 'SDM', resource: 'Pegawai',  description: 'Menugaskan mata pelajaran ke guru' },
    ],
  },

  // 4. Kesiswaan & Kedisiplinan
  {
    id: 'students',
    name: 'Kesiswaan & Kedisiplinan',
    icon: 'Users',
    description: 'Buku induk siswa, wali murid, catatan prestasi, pelanggaran, dan ambang poin SP',
    permissions: [
      { name: 'students.read',                 label: 'Lihat Data Siswa',           domain: 'Kesiswaan', resource: 'Siswa',        description: 'Melihat buku induk siswa' },
      { name: 'students.create',               label: 'Tambah Siswa',               domain: 'Kesiswaan', resource: 'Siswa',        description: 'Mendaftarkan siswa baru' },
      { name: 'students.update',               label: 'Edit Data Siswa',            domain: 'Kesiswaan', resource: 'Siswa',        description: 'Mengubah data siswa' },
      { name: 'students.delete',               label: 'Hapus Siswa',                domain: 'Kesiswaan', resource: 'Siswa',        description: 'Menghapus data siswa' },
      { name: 'students.manage_guardians',     label: 'Kelola Wali Murid',          domain: 'Kesiswaan', resource: 'Siswa',        description: 'Mengelola data wali murid' },
      { name: 'students.export_import',        label: 'Import / Export Siswa',      domain: 'Kesiswaan', resource: 'Siswa',        description: 'Import dan export data siswa' },

      { name: 'achievements.read',             label: 'Lihat Prestasi',             domain: 'Kesiswaan', resource: 'Prestasi',     description: 'Melihat catatan prestasi siswa' },
      { name: 'achievements.create',           label: 'Tambah Prestasi',            domain: 'Kesiswaan', resource: 'Prestasi',     description: 'Mencatat prestasi siswa baru' },
      { name: 'achievements.update',           label: 'Edit Prestasi',              domain: 'Kesiswaan', resource: 'Prestasi',     description: 'Mengubah catatan prestasi' },
      { name: 'achievements.delete',           label: 'Hapus Prestasi',             domain: 'Kesiswaan', resource: 'Prestasi',     description: 'Menghapus catatan prestasi' },

      { name: 'violations.read',               label: 'Lihat Pelanggaran',          domain: 'Kesiswaan', resource: 'Pelanggaran',  description: 'Melihat catatan pelanggaran siswa' },
      { name: 'violations.create',             label: 'Catat Pelanggaran',          domain: 'Kesiswaan', resource: 'Pelanggaran',  description: 'Mencatat pelanggaran siswa' },
      { name: 'violations.delete',             label: 'Hapus Pelanggaran',          domain: 'Kesiswaan', resource: 'Pelanggaran',  description: 'Menghapus catatan pelanggaran' },
      { name: 'violation_types.manage',        label: 'Kelola Jenis Pelanggaran',   domain: 'Kesiswaan', resource: 'Pelanggaran',  description: 'Menambah/ubah jenis pelanggaran dan poinnya' },
      { name: 'violation_thresholds.manage',   label: 'Kelola Ambang Poin SP',      domain: 'Kesiswaan', resource: 'Pelanggaran',  description: 'Mengatur ambang poin surat peringatan (SP)' },
    ],
  },

  // 5. Presensi & Kehadiran
  {
    id: 'attendance',
    name: 'Presensi & Kehadiran',
    icon: 'Clock',
    description: 'Pencatatan absensi siswa, pegawai, input massal rombel, dan aturan jam masuk',
    permissions: [
      { name: 'student_attendance.read',    label: 'Lihat Absensi Siswa',        domain: 'Presensi', resource: 'Absensi Siswa',   description: 'Melihat rekap absensi siswa' },
      { name: 'student_attendance.record',  label: 'Catat Absensi Siswa',        domain: 'Presensi', resource: 'Absensi Siswa',   description: 'Mencatat kehadiran siswa' },
      { name: 'student_attendance.batch',   label: 'Input Massal Absensi Siswa', domain: 'Presensi', resource: 'Absensi Siswa',   description: 'Input absensi massal per rombel' },

      { name: 'employee_attendance.read',   label: 'Lihat Absensi Pegawai',      domain: 'Presensi', resource: 'Absensi Pegawai', description: 'Melihat rekap absensi pegawai' },
      { name: 'employee_attendance.record', label: 'Catat Absensi Pegawai',      domain: 'Presensi', resource: 'Absensi Pegawai', description: 'Mencatat kehadiran pegawai' },

      { name: 'attendance_settings.manage', label: 'Kelola Aturan Jam Masuk',    domain: 'Presensi', resource: 'Pengaturan',      description: 'Mengatur jam masuk dan toleransi keterlambatan' },
    ],
  },

  // 6. Perangkat Keras & Kartu
  {
    id: 'hardware',
    name: 'Perangkat Keras & Kartu',
    icon: 'Cpu',
    description: 'Pemantauan mesin RFID/fingerprint dan registrasi kartu identitas',
    permissions: [
      { name: 'hardware.read_logs',   label: 'Lihat Log Perangkat',    domain: 'Hardware', resource: 'Perangkat', description: 'Membaca log dari mesin absensi RFID/fingerprint' },
      { name: 'hardware.assign_card', label: 'Daftarkan Kartu',        domain: 'Hardware', resource: 'Perangkat', description: 'Mendaftarkan kartu RFID ke pengguna' },
    ],
  },

  // 7. Penilaian & Rapor
  {
    id: 'assessment',
    name: 'Penilaian & Rapor',
    icon: 'Award',
    description: 'Komponen penilaian, input nilai, validasi, persetujuan kepala sekolah, dan cetak rapor',
    permissions: [
      { name: 'assessment_components.read',       label: 'Lihat Komponen Penilaian',    domain: 'Penilaian', resource: 'Komponen',   description: 'Melihat daftar komponen penilaian' },
      { name: 'assessment_components.manage',     label: 'Kelola Komponen Penilaian',   domain: 'Penilaian', resource: 'Komponen',   description: 'Membuat dan mengubah komponen penilaian' },

      { name: 'assessments.read',                 label: 'Lihat Nilai',                 domain: 'Penilaian', resource: 'Nilai',       description: 'Melihat nilai siswa' },
      { name: 'assessments.input',                label: 'Input Nilai',                 domain: 'Penilaian', resource: 'Nilai',       description: 'Memasukkan nilai siswa' },

      { name: 'score_validations.read',           label: 'Lihat Validasi Nilai',        domain: 'Penilaian', resource: 'Validasi',    description: 'Melihat status validasi nilai' },
      { name: 'score_validations.validate',       label: 'Validasi Nilai (Guru)',       domain: 'Penilaian', resource: 'Validasi',    description: 'Memvalidasi nilai sebagai guru/koordinator' },
      { name: 'score_validations.principal_approve', label: 'Setujui Nilai (Kepsek)',  domain: 'Penilaian', resource: 'Validasi',    description: 'Persetujuan akhir nilai oleh kepala sekolah' },

      { name: 'report_cards.read',                label: 'Lihat Rapor',                 domain: 'Penilaian', resource: 'Rapor',       description: 'Melihat rapor siswa' },
      { name: 'report_cards.generate',            label: 'Cetak / Generate Rapor',      domain: 'Penilaian', resource: 'Rapor',       description: 'Mencetak dan menghasilkan rapor siswa' },
    ],
  },

  // 8. Persuratan & Pengumuman
  {
    id: 'letters',
    name: 'Persuratan & Pengumuman',
    icon: 'Mail',
    description: 'Surat masuk, surat keluar, template surat, dan pengumuman sekolah',
    permissions: [
      { name: 'incoming_letters.read',    label: 'Lihat Surat Masuk',          domain: 'Persuratan', resource: 'Surat Masuk',  description: 'Melihat daftar surat masuk' },
      { name: 'incoming_letters.create',  label: 'Tambah Surat Masuk',         domain: 'Persuratan', resource: 'Surat Masuk',  description: 'Mencatat surat masuk baru' },
      { name: 'incoming_letters.update',  label: 'Edit Surat Masuk',           domain: 'Persuratan', resource: 'Surat Masuk',  description: 'Mengubah data surat masuk' },
      { name: 'incoming_letters.delete',  label: 'Hapus Surat Masuk',          domain: 'Persuratan', resource: 'Surat Masuk',  description: 'Menghapus surat masuk' },

      { name: 'outgoing_letters.read',    label: 'Lihat Surat Keluar',         domain: 'Persuratan', resource: 'Surat Keluar', description: 'Melihat daftar surat keluar' },
      { name: 'outgoing_letters.create',  label: 'Buat Surat Keluar',          domain: 'Persuratan', resource: 'Surat Keluar', description: 'Membuat surat keluar baru' },
      { name: 'outgoing_letters.update',  label: 'Edit Surat Keluar',          domain: 'Persuratan', resource: 'Surat Keluar', description: 'Mengubah surat keluar' },
      { name: 'outgoing_letters.delete',  label: 'Hapus Surat Keluar',         domain: 'Persuratan', resource: 'Surat Keluar', description: 'Menghapus surat keluar' },

      { name: 'letter_templates.read',    label: 'Lihat Template Surat',       domain: 'Persuratan', resource: 'Template',     description: 'Melihat template surat' },
      { name: 'letter_templates.manage',  label: 'Kelola Template Surat',      domain: 'Persuratan', resource: 'Template',     description: 'Membuat dan mengubah template surat' },

      { name: 'announcements.read',       label: 'Lihat Pengumuman',           domain: 'Persuratan', resource: 'Pengumuman',   description: 'Melihat pengumuman sekolah' },
      { name: 'announcements.create',     label: 'Buat Pengumuman',            domain: 'Persuratan', resource: 'Pengumuman',   description: 'Membuat pengumuman baru' },
      { name: 'announcements.update',     label: 'Edit Pengumuman',            domain: 'Persuratan', resource: 'Pengumuman',   description: 'Mengubah pengumuman' },
      { name: 'announcements.delete',     label: 'Hapus Pengumuman',           domain: 'Persuratan', resource: 'Pengumuman',   description: 'Menghapus pengumuman' },
    ],
  },

  // 9. Sistem & Pengaturan
  {
    id: 'system',
    name: 'Sistem & Pengaturan',
    icon: 'Sliders',
    description: 'Profil sekolah, manajemen pengguna, peran, hak akses, dan statistik dashboard',
    permissions: [
      { name: 'school_profile.read',        label: 'Lihat Profil Sekolah',       domain: 'Sistem', resource: 'Profil',     description: 'Melihat informasi profil sekolah' },
      { name: 'school_profile.update',      label: 'Edit Profil Sekolah',        domain: 'Sistem', resource: 'Profil',     description: 'Mengubah informasi profil sekolah' },

      { name: 'users.read',                 label: 'Lihat Pengguna',             domain: 'Sistem', resource: 'Pengguna',   description: 'Melihat daftar akun pengguna sistem' },
      { name: 'users.create',               label: 'Tambah Pengguna',            domain: 'Sistem', resource: 'Pengguna',   description: 'Membuat akun pengguna baru' },
      { name: 'users.update',               label: 'Edit Pengguna',              domain: 'Sistem', resource: 'Pengguna',   description: 'Mengubah data akun pengguna' },
      { name: 'users.delete',               label: 'Hapus Pengguna',             domain: 'Sistem', resource: 'Pengguna',   description: 'Menghapus akun pengguna' },
      { name: 'users.assign_roles',         label: 'Tugaskan Peran ke Pengguna', domain: 'Sistem', resource: 'Pengguna',   description: 'Menugaskan peran ke akun pengguna' },
      { name: 'users.reset_password',       label: 'Reset Password Pengguna',    domain: 'Sistem', resource: 'Pengguna',   description: 'Mereset password akun pengguna' },

      { name: 'roles.read',                 label: 'Lihat Peran',                domain: 'Sistem', resource: 'RBAC',       description: 'Melihat daftar peran yang tersedia' },
      { name: 'roles.manage',               label: 'Kelola Peran',               domain: 'Sistem', resource: 'RBAC',       description: 'Membuat, mengubah, dan menghapus peran' },
      { name: 'roles.assign_permissions',   label: 'Tugaskan Hak Akses ke Peran', domain: 'Sistem', resource: 'RBAC',     description: 'Mengatur hak akses yang dimiliki setiap peran' },

      { name: 'dashboard.view_stats',       label: 'Lihat Statistik Dashboard',  domain: 'Sistem', resource: 'Dashboard',  description: 'Melihat ringkasan statistik di halaman dashboard' },
    ],
  },
];
