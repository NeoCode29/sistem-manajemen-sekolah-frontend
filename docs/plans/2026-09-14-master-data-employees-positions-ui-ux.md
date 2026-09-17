# Master Data Kepegawaian (Positions & Employees) UI/UX Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyeragamkan UI, UX, filter pencarian, dialog konfirmasi, dan penanganan feedback/error pada modul Master Kepegawaian (`Positions.tsx` dan `Employees.tsx`) sesuai standar Design System (`FilterBar`, `Select`, `ConfirmDialog`, `notify`, `PageHeader`).

**Architecture:** Mengganti modal `showAlert` dan `showConfirm` warisan `useDialog` menjadi utilitas terpusat `notify` (`@/utils/feedback`) dan `<ConfirmDialog />`. Menyeragamkan filter pencarian dengan `<FilterBar />` dan dropdown `<Select />`. Membersihkan duplikasi notifikasi (toast ganda dengan popup), merapikan tombol aksi, tab navigasi (*Aktif vs Archive*), dan menambahkan indikator loading saat mutasi data.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, react-hot-toast.

## Global Constraints

- Dilarang keras menggunakan `window.alert()`, `window.confirm()`, atau dialog alert lokal.
- Semua notifikasi feedback mutasi wajib menggunakan `notify.success()` dan `notify.error(err, fallback)` dari `@/utils/feedback`.
- Dialog konfirmasi aksi kritis (Hapus Jabatan, Arsip Pegawai, Pulihkan Pegawai) wajib menggunakan `<ConfirmDialog />` dari `@/components/ui`.
- Filter dan pencarian wajib menggunakan `<FilterBar />` dan `<Select />` dari `@/components/ui`.
- Typecheck `npx tsc --noEmit` wajib menghasilkan 0 error di setiap akhir task.

---

### Task 1: Refactor Halaman Master Data Jabatan (Positions.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Entities/Positions.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `FilterBar`, `Select`, `ConfirmDialog`, `Badge`, `Modal`, `FormField` from `@/components/ui`, `DataTable`, `ActionButtons` from `@/components/Common`.
- Produces: Clean, standard Master Jabatan UI with instant search, ConfirmDialog for deletion, and unified toast feedback.

- [ ] **Step 1: Replace useDialog with notify and ConfirmDialog in Positions.tsx**
  - Hapus `useDialog`, ganti dengan `notify.success` dan `notify.error(err)`.
  - Pasang `<ConfirmDialog>` varian `danger` untuk konfirmasi hapus jabatan.
  - Pasang `<FilterBar>` dengan search input dan tombol reset filter.
  - Rapikan `<PageHeader>` dengan action prop `+ Tambah Data`.
  - Tambahkan indikator loading pada submit modal form.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `node_modules/.bin/tsc.cmd --noEmit` di frontend.

---

### Task 2: Refactor Halaman Master Pegawai & Guru (Employees.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Entities/Employees.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `ConfirmDialog`, `FilterBar`, `Select`, `PageHeader`, `Badge`, `Modal`, `FormField` from `@/components/ui`, `DataTable`, `Pagination`, `ActionButtons` from `@/components/Common`.
- Produces: Professional Employee & Teacher directory with tab switching (Aktif vs Archive), unified filter bar, clean ConfirmDialog for archive/restore/delete, and robust error extraction.

- [ ] **Step 1: Unify notifications, ConfirmDialog, and FilterBar in Employees.tsx**
  - Hapus duplikasi `toast` + `showAlert` ganda; gunakan `notify.success` dan `notify.error` terstandarisasi.
  - Pasang `<ConfirmDialog>` terpadu untuk aksi "Arsipkan Pegawai" (danger) dan "Pulihkan Pegawai" (info/warning).
  - Pasang `<FilterBar>` yang menampung search query dan filter jabatan via `<Select>`.
  - Rapikan tab *Pegawai Aktif* vs *Archive* dan layout `<PageHeader>`.
  - Pastikan modal tambah/edit pegawai memiliki validasi dan state loading submit yang aman.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `node_modules/.bin/tsc.cmd --noEmit` di frontend.

---

### Task 3: Verifikasi Build & Pengujian Visual Browser

**Agent:** `typescript-pro`

**Files:**
- Test/Verify: `src/pages/Entities/Positions.tsx`, `src/pages/Entities/Employees.tsx`

- [ ] **Step 1: Menjalankan TypeScript & production bundle build check**
  - Jalankan `npm run build` di frontend untuk memastikan tidak ada lint/type error.

- [ ] **Step 2: Verifikasi visual via browser agent**
  - Buka `/entities/positions` dan `/entities/employees` di browser; uji pencarian, filter dropdown jabatan, dan pembukaan ConfirmDialog.
