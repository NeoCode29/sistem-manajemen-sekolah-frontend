# Spesifikasi Desain: Standardisasi Tampilan Prestasi & Pelanggaran Siswa

**Tanggal:** 2026-09-15  
**Topik:** Standardisasi UI Halaman Kesiswaan (`Achievements.tsx` & `Violations.tsx`)  
**Status:** Approved by User  

---

## 1. Latar Belakang & Tujuan
Modul Kesiswaan pada frontend saat ini mencakup dua halaman utama:
1. `Achievements.tsx` (`/student-affairs/achievements`)
2. `Violations.tsx` (`/student-affairs/violations`)

Kedua halaman tersebut sebelumnya masih menggunakan pola UI lama:
- Dialog konfirmasi manual/lama (`useDialog` dengan alert bawaan).
- Belum menggunakan `<DataTable />`, `<ActionButtons />`, dan `<Pagination />` standar.
- Form modal belum seragam dengan standar input kelas, feedback alert lokal, dan styling chip siswa.

Tujuan dari pekerjaan ini adalah menstandarkan kedua halaman ini agar selaras 100% dengan modul yang telah distandarkan sebelumnya (Master Data, Akademik, Presensi, dan Penilaian).

---

## 2. Ruang Lingkup Perubahan (Scope)
Sesuai arahan pengguna: **Fokus Penataan Tampilan Saja** (tanpa menambahkan ringkasan KPI baru):
1. **Prestasi Siswa (`Achievements.tsx`)**:
   - Ganti tabel ke `<DataTable<Achievement> />`.
   - Ganti tombol aksi ke `<ActionButtons onEdit onDelete />`.
   - Tambahkan `<Pagination />` terpadu (pilihan 10, 25, 50 per halaman).
   - Ganti `useDialog()` lama ke `<ConfirmDialog />` (variant danger) dan notifikasi toast `notify` (`@/utils/feedback`).
   - Sempurnakan modal form penambahan/pengeditan dengan `<Modal />`, `<FormField />`, dan pencarian siswa debounced dengan chip terpilih.
   - Tambahkan badge visual untuk tingkat prestasi (Nasional, Provinsi, Kabupaten, Sekolah) dan kategori.

2. **Pelanggaran Siswa (`Violations.tsx`)**:
   - Ganti tabel ke `<DataTable<Violation> />`.
   - Ganti tombol aksi ke `<ActionButtons onEdit onDelete />`.
   - Tambahkan `<Pagination />` terpadu.
   - Ganti `useDialog()` ke `<ConfirmDialog />` dan toast `notify`.
   - Sempurnakan modal form penambahan/pengeditan dengan `<Modal />`, `<FormField />`, dropdown kategori/jenis pelanggaran, dan chip siswa terpilih.
   - Tambahkan badge visual untuk kategori keparahan pelanggaran (Ringan, Sedang, Berat).

---

## 3. Komponen & Dependensi
- `@/components/ui`: `PageHeader`, `Modal`, `FormField`, `Badge`
- `@/components/ui/ConfirmDialog`: `ConfirmDialog`
- `@/components/Common/DataTable`: `DataTable`, `type Column`
- `@/components/Common/ActionButtons`: `ActionButtons`
- `@/components/Common/Pagination`: `Pagination`
- `@/utils/feedback`: `notify`
- `@/hooks/usePermissions`: `usePermissions`

---

## 4. Rencana Verifikasi
1. **Frontend Type Check:** `cd frontend && npx tsc --noEmit` wajib exit code 0.
2. **Backend Integrity Check:** `npm test -- achievements-violations` wajib lulus 100%.
3. **Manual Verification:** Verifikasi pembukaan modal, pemilihan siswa, submit form, dialog konfirmasi hapus, dan pagination.
