# Admin RBAC (Users, Roles, Permissions) UI/UX Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyeragamkan UI, UX, filter pencarian, dialog konfirmasi, dan penanganan feedback/error pada ketiga halaman modul Admin (Users, Roles, Permissions) sesuai standar Design System baru (`UI_PATTERNS.md`, `notify`, `ConfirmDialog`, `FilterBar`, `Select`).

**Architecture:** Mengganti modal alert ad-hoc (`useDialog().showAlert`) dan `window.confirm()` dengan utilitas toast terpusat `notify` (`@/utils/feedback`) dan `<ConfirmDialog />`. Menambahkan `<FilterBar>` interaktif dengan search dan filter dropdown `<Select />`. Merapikan layout `<PageHeader>` dan styling modal form agar 100% konsisten dengan template acuan showcase.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, react-hot-toast.

## Global Constraints

- Dilarang keras menggunakan `window.alert()`, `window.confirm()`, atau dialog alert lokal.
- Semua notifikasi sukses/error mutasi wajib menggunakan `notify.success()` dan `notify.error(err, fallback)` dari `@/utils/feedback`.
- Dialog konfirmasi aksi kritis wajib menggunakan `<ConfirmDialog />` dari `@/components/ui`.
- Filter dan pencarian wajib menggunakan `<FilterBar />` dan `<Select />` dari `@/components/ui`.
- Typecheck `npx tsc --noEmit` wajib menghasilkan 0 error di setiap akhir task.

---

### Task 1: Refactor Halaman Pengguna (Users.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Admin/Users.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `FilterBar`, `Select`, `ConfirmDialog`, `Badge`, `Modal`, `FormField` from `@/components/ui`, `DataTable`, `Pagination` from `@/components/Common`.
- Produces: Enhanced User Management UI with search by username/name, filter by status & role, unified toast feedback.

- [ ] **Step 1: Update UI layout, FilterBar, dan unified notify di Users.tsx**
  - Tambahkan state `searchQuery`, `statusFilter`, `roleFilter`.
  - Implementasikan filter dinamis pada list `users`.
  - Ganti `showAlert` dengan `notify.success('Pengguna berhasil disimpan!')` dan `notify.error(error, 'Gagal menyimpan pengguna')`.
  - Rapikan `<PageHeader>` dengan action prop.
  - Tambahkan `<FilterBar>` dengan search input dan filter dropdown `<Select>`.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `npx tsc --noEmit` di folder frontend untuk memastikan tidak ada type error.

---

### Task 2: Refactor Halaman Peran & Hak Akses (Roles.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Admin/Roles.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `ConfirmDialog`, `PageHeader`, `Modal`, `FormField` from `@/components/ui`.
- Produces: Roles & Matrix Permissions Editor with standard `<ConfirmDialog>` for discarding unsaved changes and deleting roles, unified toast feedback for saving/errors.

- [ ] **Step 1: Replace useDialog with notify and ConfirmDialog in Roles.tsx**
  - Ganti `showAlert` penyimpanan hak akses & pembuatan peran dengan `notify.success` dan `notify.error`.
  - Ganti `showConfirm` untuk menghapus peran dengan `<ConfirmDialog variant="danger">`.
  - Ganti `showConfirm` untuk unsaved changes (berpindah peran saat dirty) dengan `<ConfirmDialog variant="warning">`.
  - Rapikan search input peran dan search hak akses agar serasi dengan token desain.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `npx tsc --noEmit` di folder frontend.

---

### Task 3: Refactor Halaman Hak Akses (Permissions.tsx)

**Agent:** `ux-ui-pro-max`

**Files:**
- Modify: `src/pages/Admin/Permissions.tsx`

**Interfaces:**
- Consumes: `notify` from `@/utils/feedback`, `PageHeader`, `FilterBar`, `DataTable`, `Modal`, `FormField` from `@/components/ui`.
- Produces: Permissions table with searchable filter bar, proper empty states, and unified toast feedback.

- [ ] **Step 1: Update Permissions.tsx dengan FilterBar dan notify**
  - Tambahkan state `searchQuery` untuk mencari permission berdasarkan nama atau guardName.
  - Ganti `showAlert` dengan `notify.success('Hak akses berhasil dibuat!')` dan `notify.error(error, 'Gagal membuat hak akses')`.
  - Gunakan `<PageHeader title="..." action={...} />` tanpa flexbox berlebih.
  - Tambahkan `<FilterBar>` dengan reset search.

- [ ] **Step 2: Typecheck & verifikasi build**
  - Jalankan `npx tsc --noEmit` di folder frontend.

---

### Task 4: Verifikasi Menyeluruh & Testing Visual Browser

**Agent:** `typescript-pro`

**Files:**
- Test/Verify: `src/pages/Admin/Users.tsx`, `src/pages/Admin/Roles.tsx`, `src/pages/Admin/Permissions.tsx`

- [ ] **Step 1: Menjalankan linter & TypeScript build check**
  - Jalankan `npm run build` di frontend untuk memvalidasi bundle production tanpa error.

- [ ] **Step 2: Verifikasi visual via browser agent**
  - Akses halaman admin di browser untuk memastikan render layout, filter, dan dialog berjalan lancar.
