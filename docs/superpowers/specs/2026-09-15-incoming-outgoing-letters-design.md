# Spesifikasi Desain: Standardisasi Tampilan Surat Masuk & Surat Keluar

**Tanggal:** 2026-09-15  
**Topik:** Standardisasi UI Halaman Persuratan (`IncomingLetters.tsx` & `OutgoingLetters.tsx`)  
**Status:** Approved by User  

---

## 1. Latar Belakang & Tujuan
Modul Persuratan mencakup dua alur utama tata usaha:
1. `IncomingLetters.tsx` (`/letters/incoming`) — Pencatatan surat masuk dan arsip dokumen digital.
2. `OutgoingLetters.tsx` (`/letters/outgoing`) — Pembuatan surat keluar, penerima, dan lampiran.

Kedua halaman tersebut sebelumnya masih menggunakan dialog browser lama (`useDialog`), belum memiliki kontrol paginasi terpadu (`<Pagination />`), input filter pencarian instan, serta belum memakai `<ActionButtons />` terstandar.
Tujuannya adalah menyelaraskan kedua halaman ini dengan standar desain sistem modern sekolah.

---

## 2. Ruang Lingkup Desain
1. **Surat Masuk (`IncomingLetters.tsx`)**:
   - Header & tombol `+ Catat Surat Masuk` dengan `<PageHeader />`.
   - Kartu pencarian nomor surat, perihal, dan pengirim.
   - Tabel `<DataTable<IncomingLetter> />` dengan link download lampiran, tanggal terima/surat, dan `<ActionButtons />`.
   - Integrasi `<Pagination />`.
   - Ganti dialog konfirmasi hapus ke `<ConfirmDialog variant="danger" />` dan toast `notify`.
   - Modal form rapi dengan preview/input file lampiran.

2. **Surat Keluar (`OutgoingLetters.tsx`)**:
   - Header & tombol `+ Buat Surat Keluar` dengan `<PageHeader />`.
   - Kartu pencarian nomor surat, perihal, dan tujuan penerima.
   - Tabel `<DataTable<OutgoingLetter> />` dengan link download lampiran, tanggal surat, dan `<ActionButtons />`.
   - Integrasi `<Pagination />`.
   - Ganti dialog konfirmasi hapus ke `<ConfirmDialog variant="danger" />` dan toast `notify`.
   - Modal form pencatatan surat keluar.

---

## 3. Komponen & Dependensi
- `@/components/ui`: `PageHeader`, `Modal`, `FormField`, `Badge`
- `@/components/ui/ConfirmDialog`: `ConfirmDialog`
- `@/components/Common/DataTable`: `DataTable`, `type Column`
- `@/components/Common/ActionButtons`: `ActionButtons`
- `@/components/Common/Pagination`: `Pagination`
- `@/utils/feedback`: `notify`
- `@/api/letterService`: API servis persuratan

---

## 4. Rencana Verifikasi
- Frontend TypeScript check: `cd frontend && npx tsc --noEmit` -> 0 errors.
- Backend Letters test: `cd backend && npm test -- letters` -> 100% Pass.
