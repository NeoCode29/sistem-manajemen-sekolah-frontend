# Master Data Tingkat Kelas & Jurusan (Grades & Majors) UI/UX Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyeragamkan UI, UX, filter pencarian, dialog konfirmasi, dan penanganan feedback/error pada modul Master Tingkat Kelas (`Grades.tsx`) dan Master Jurusan (`Majors.tsx`) sesuai standar Design System (`FilterBar`, `Select`, `ConfirmDialog`, `notify`, `PageHeader`).

**Architecture:** Mengganti modal `showConfirm` bahasa Inggris dan penanganan error ad-hoc banner pada `Grades.tsx` dan `Majors.tsx` dengan utilitas terpusat `notify` (`@/utils/feedback`) dan `<ConfirmDialog />`. Menambahkan `<FilterBar />` dengan search box instan, tombol generate kode otomatis dengan icon putar, dropdown `<Select />`, dan loading state saat submit.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, react-hot-toast.

## Global Constraints

- Dilarang keras menggunakan `window.alert()`, `window.confirm()`, atau dialog alert lokal.
- Semua notifikasi feedback mutasi wajib menggunakan `notify.success()` dan `notify.error(err, fallback)` dari `@/utils/feedback`.
- Dialog konfirmasi hapus data wajib menggunakan `<ConfirmDialog />` dari `@/components/ui`.
- Filter dan dropdown wajib menggunakan `<FilterBar />` dan `<Select />` dari `@/components/ui`.
- Typecheck `npx tsc --noEmit` wajib menghasilkan 0 error di setiap akhir task.

---

### Task 1: Refactor Halaman Tingkat Kelas (Grades.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Academic/Grades.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `FilterBar`, `Select`, `ConfirmDialog`, `Badge`, `Modal`, `FormField` from `@/components/ui`, `DataTable`, `ActionButtons` from `@/components/Common`.
- Produces: Standardized Grade Levels directory with instant search, ConfirmDialog deletion, Select for education levels, and unified toast feedback.

- [ ] **Step 1: Replace useDialog with notify and ConfirmDialog in Grades.tsx**
  - Hapus `useDialog`, ganti dengan `notify.success` dan `notify.error`.
  - Pasang `<ConfirmDialog variant="danger">` untuk hapus tingkat kelas.
  - Pasang `<FilterBar>` dengan search input (nama/kode/jenjang) dan tombol reset.
  - Rapikan form modal dengan dropdown `<Select>` untuk Jenjang Pendidikan (*SD, SMP, SMA, SMK*).
  - Tambahkan indikator loading pada submit.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `node_modules/.bin/tsc.cmd --noEmit` di frontend.

---

### Task 2: Refactor Halaman Jurusan (Majors.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Academic/Majors.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `FilterBar`, `ConfirmDialog`, `Badge`, `Modal`, `FormField` from `@/components/ui`, `DataTable`, `ActionButtons` from `@/components/Common`.
- Produces: Standardized Majors directory with instant search, ConfirmDialog for deletion and status change, and unified toast feedback.

- [ ] **Step 1: Replace useDialog with notify and ConfirmDialog in Majors.tsx**
  - Hapus `useDialog`, ganti dengan `notify.success` dan `notify.error`.
  - Pasang `<ConfirmDialog>` untuk hapus jurusan (danger) dan ubah status aktif (warning).
  - Pasang `<FilterBar>` dengan search input dan tombol reset.
  - Rapikan form modal dan tombol generate kode.
  - Tambahkan indikator loading pada submit.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `node_modules/.bin/tsc.cmd --noEmit` di frontend.

---

### Task 3: Verifikasi Build & Pengujian Visual Browser

**Agent:** `typescript-pro`

**Files:**
- Test/Verify: `src/pages/Academic/Grades.tsx`, `src/pages/Academic/Majors.tsx`

- [ ] **Step 1: Menjalankan TypeScript & production bundle build check**
  - Jalankan `npm run build` di frontend untuk memvalidasi bundle tanpa error.

- [ ] **Step 2: Verifikasi visual via browser agent**
  - Buka `/academic/grades` dan `/academic/majors` di browser; uji pencarian, pengujian ConfirmDialog, dan verifikasi layout.
