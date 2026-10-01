import { test, expect } from '@playwright/test';

test.describe('Audit Interaksi E2E Frontend Sistem Manajemen Sekolah', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Abaikan error favicon jika ada
        if (!msg.text().includes('favicon.ico')) {
          consoleErrors.push(msg.text());
        }
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });
  });

  test('1. Alur Login Admin & Dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="text"], input[name="username"], #username')).toBeVisible({ timeout: 10000 });

    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();

    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    
    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Pastikan ter-redirect ke dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('2. Modul Prestasi Siswa (Achievements)', async ({ page }) => {
    // Login
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Buka menu prestasi
    await page.goto('/student-affairs/achievements');
    await page.waitForLoadState('networkidle');

    // Cek judul / PageHeader
    await expect(page.getByText('Prestasi Siswa').first()).toBeVisible({ timeout: 10000 });

    // Coba buka modal tambah prestasi
    const addBtn = page.getByRole('button', { name: /tambah|catat prestasi/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Verifikasi modal terbuka
      await expect(page.locator('[role="dialog"], .fixed, .modal').first()).toBeVisible();
      // Tutup modal
      const closeBtn = page.getByRole('button', { name: /batal|tutup/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('3. Modul Pelanggaran Siswa (Violations)', async ({ page }) => {
    // Login
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Buka menu pelanggaran
    await page.goto('/student-affairs/violations');
    await page.waitForLoadState('networkidle');

    // Cek judul / PageHeader
    await expect(page.getByText('Pelanggaran').first()).toBeVisible({ timeout: 10000 });

    // Coba buka modal tambah pelanggaran
    const addBtn = page.getByRole('button', { name: /tambah|catat pelanggaran/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Verifikasi modal terbuka
      await expect(page.locator('[role="dialog"], .fixed, .modal').first()).toBeVisible();
      // Tutup modal
      const closeBtn = page.getByRole('button', { name: /batal|tutup/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('4. Data Siswa & Tab Catatan Kedisiplinan', async ({ page }) => {
    // Login
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Buka daftar siswa
    await page.goto('/entities/students');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Siswa & Wali Murid/i).first()).toBeVisible({ timeout: 10000 });

    // Buka detail siswa pertama yang tersedia
    const studentLink = page.locator('tbody tr td a, tbody tr td button').first();
    if (await studentLink.isVisible()) {
      await studentLink.click();
      await page.waitForLoadState('networkidle');

      // Cari dan klik tab 'Catatan'
      const catatanTab = page.getByRole('button', { name: /catatan/i }).or(page.getByText(/catatan/i)).first();
      if (await catatanTab.isVisible()) {
        await catatanTab.click();
        await page.waitForTimeout(1000);

        // Verifikasi kartu statistik muncul
        await expect(page.getByText(/Total Prestasi/i).first()).toBeVisible();
        await expect(page.getByText(/Total Pelanggaran/i).first()).toBeVisible();
        await expect(page.getByText(/Poin Pelanggaran/i).first()).toBeVisible();
      }
    }
  });

  test('5. Halaman Presensi Siswa & Pegawai', async ({ page }) => {
    // Login
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Presensi Siswa
    await page.goto('/attendance/students');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Presensi & Kehadiran Siswa/i).first()).toBeVisible({ timeout: 10000 });

    // Presensi Pegawai
    await page.goto('/attendance/employees');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Presensi Pegawai & Guru/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('7. Modul Akademik & Kurikulum', async ({ page }) => {
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Tahun Ajaran
    await page.goto('/academic/years');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Tahun Ajaran/i).first()).toBeVisible({ timeout: 10000 });

    // Rombel / Kelas
    await page.goto('/academic/classrooms');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Rombongan Belajar|Rombel|Kelas/i).first()).toBeVisible({ timeout: 10000 });

    // Mata Pelajaran
    await page.goto('/academic/subjects');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Mata Pelajaran/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('8. Modul Penilaian & Evaluasi', async ({ page }) => {
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Komponen Penilaian
    await page.goto('/assessment/components');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Komponen Penilaian/i).first()).toBeVisible({ timeout: 10000 });

    // Agenda Ujian
    await page.goto('/assessment/exams');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Agenda Penilaian|Ujian/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('9. Modul Profil Sekolah & Pengaturan Akun', async ({ page }) => {
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Profil Sekolah
    await page.goto('/profile/school');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Profil Sekolah/i).first()).toBeVisible({ timeout: 10000 });

    // Pengaturan Akun
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Pengaturan Akun|Profil Pengguna/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('10. Modul Pengumuman & Persuratan', async ({ page }) => {
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin#1234');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/);

    // Pengumuman
    await page.goto('/announcements');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Pengumuman/i).first()).toBeVisible({ timeout: 10000 });

    // Surat Masuk
    await page.goto('/letters/incoming');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Surat Masuk/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('11. Verifikasi Tidak Ada Unhandled JavaScript Runtime Errors', async () => {
    const criticalErrors = consoleErrors.filter(e => 
      e.includes('Uncaught') || 
      e.includes('TypeError') || 
      e.includes('ReferenceError') ||
      e.includes('Cannot read property')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
