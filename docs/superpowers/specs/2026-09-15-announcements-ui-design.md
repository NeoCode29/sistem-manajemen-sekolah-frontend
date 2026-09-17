# Spesifikasi Desain: Standardisasi Tampilan Papan Pengumuman (Announcements)

**Tanggal:** 2026-09-15  
**Topik:** Standardisasi UI Halaman Pengumuman (`Announcements.tsx`)  
**Status:** Approved by User  

---

## 1. Latar Belakang & Tujuan
Halaman `Announcements.tsx` (`/announcements`) bertugas mengelola pengumuman resmi sekolah untuk berbagai target audiens (Siswa, Guru, Staf, atau Semua).
Tampilan saat ini masih memiliki inkonsistensi:
- Menggunakan `useDialog()` lama dengan browser prompt.
- Tombol aksi belum menggunakan `<ActionButtons />`.
- Belum memiliki `<Pagination />` dan kartu pencarian instan.
- Modal masih menggunakan banner merah statis untuk menampilkan error.

Tujuannya adalah menstandarkan halaman ini ke pola desain sistem aplikasi modern.

---

## 2. Ruang Lingkup Desain
1. **Header & Aksi:** `<PageHeader />` dengan tombol aksi `+ Buat Pengumuman` yang responsif hak akses `canCreate`.
2. **Pencarian:** Kartu input pencarian judul & isi teks pengumuman.
3. **Tabel & Paginasi:** `<DataTable<Announcement> />` dengan penanda pinned, target audiens badge, status aktif badge, periode tayang, serta `<Pagination />`.
4. **Tombol Aksi:** `<ActionButtons onEdit onDelete />`.
5. **Dialog & Feedback:** `<ConfirmDialog variant="danger" />` dan toast `notify` (`@/utils/feedback`).
6. **Modal Form:** Form terstruktur dengan validasi bersih dan notifikasi toast.

---

## 3. Komponen & Dependensi
- `@/components/ui`: `PageHeader`, `Modal`, `FormField`, `Badge`
- `@/components/ui/ConfirmDialog`: `ConfirmDialog`
- `@/components/Common/DataTable`: `DataTable`, `type Column`
- `@/components/Common/ActionButtons`: `ActionButtons`
- `@/components/Common/Pagination`: `Pagination`
- `@/utils/feedback`: `notify`
- `@/api/announcementService`: `getAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`

---

## 4. Rencana Verifikasi
- TypeScript Typecheck: `cd frontend && npx tsc --noEmit` -> 0 errors.
- Backend Test: `cd backend && npm test -- announcements` -> 100% Pass.
