# Master Data Rombel / Kelas (Classrooms) UI/UX Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyeragamkan UI, UX, filter pencarian tingkat, dialog konfirmasi, dan penanganan feedback/error pada modul Rombongan Belajar (`Classrooms.tsx` dan `ClassroomDetail.tsx`) sesuai standar Design System (`FilterBar`, `Select`, `ConfirmDialog`, `notify`, `PageHeader`).

**Architecture:** Mengganti modal `showAlert` dan `showConfirm` bahasa Inggris pada `Classrooms.tsx` dengan utilitas terpusat `notify` (`@/utils/feedback`) dan `<ConfirmDialog />`. Menyeragamkan filter pencarian nama/kode rombel dan filter tingkat kelas menggunakan `<FilterBar />` dan `<Select />`. Memperbarui `ClassroomDetail.tsx` (penetapan wali kelas dan tab siswa) dengan toast notification cerdas dan komponen UI standar.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, react-hot-toast.

## Global Constraints

- Dilarang keras menggunakan `window.alert()`, `window.confirm()`, atau dialog alert lokal.
- Semua notifikasi feedback mutasi wajib menggunakan `notify.success()` dan `notify.error(err, fallback)` dari `@/utils/feedback`.
- Dialog konfirmasi hapus rombel wajib menggunakan `<ConfirmDialog />` dari `@/components/ui`.
- Filter dan dropdown wajib menggunakan `<FilterBar />` dan `<Select />` dari `@/components/ui`.
- Typecheck `npx tsc --noEmit` wajib menghasilkan 0 error di setiap akhir task.

---

### Task 1: Refactor Halaman Rombongan Belajar (Classrooms.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Academic/Classrooms.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `FilterBar`, `Select`, `ConfirmDialog`, `Badge`, `Modal`, `FormField` from `@/components/ui`, `DataTable`, `Pagination`, `ActionButtons` from `@/components/Common`.
- Produces: Standardized Classrooms directory with instant search, Grade filter dropdown, ConfirmDialog deletion, and unified toast feedback.

- [ ] **Step 1: Replace useDialog with notify and ConfirmDialog in Classrooms.tsx**
  - Ganti `showConfirm` bahasa Inggris dengan `<ConfirmDialog variant="danger">`.
  - Ganti `showAlert` dengan `notify.success` dan `notify.error`.
  - Pasang `<FilterBar>` dengan search input dan dropdown `<Select>` tingkat kelas.
  - Rapikan form modal dengan `<Select>` untuk Tingkat & Jurusan, dan tombol generate kode acak.
  - Tambahkan indikator loading saat simpan data.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `node_modules/.bin/tsc.cmd --noEmit` di frontend.

---

### Task 2: Refactor Halaman Detail Rombel & Wali Kelas (ClassroomDetail.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Academic/ClassroomDetail.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `Select`, `Badge`, `FormField` from `@/components/ui`, `DataTable` from `@/components/Common`.
- Produces: Polished Classroom Detail view with back button, tab switching (Info/Wali Kelas vs Daftar Siswa), and unified toast feedback for homeroom teacher assignment.

- [ ] **Step 1: Replace useDialog with notify in ClassroomDetail.tsx**
  - Ganti `showAlert` dengan `notify.success` dan `notify.error`.
  - Gunakan `<Select>` pada form penetapan Wali Kelas (Tahun Ajaran, Semester, Guru).
  - Rapikan tampilan tab dan DataTable daftar siswa di dalam kelas tersebut.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `node_modules/.bin/tsc.cmd --noEmit` di frontend.

---

### Task 3: Verifikasi Build & Pengujian Visual Browser

**Agent:** `typescript-pro`

**Files:**
- Test/Verify: `src/pages/Academic/Classrooms.tsx`, `src/pages/Academic/ClassroomDetail.tsx`

- [ ] **Step 1: Menjalankan TypeScript & production bundle build check**
  - Jalankan `npm run build` di frontend untuk memvalidasi bundle tanpa error.

- [ ] **Step 2: Verifikasi visual via browser agent**
  - Buka `/academic/classrooms` di browser; uji pencarian, filter dropdown tingkat, navigasi ke detail kelas `/academic/classrooms/:id`, dan uji pembukaan ConfirmDialog.
