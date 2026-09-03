# Task 0 Brief: Setup Tailwind CSS Aliases di `index.css`

## Konteks Proyek
Proyek: `manajemen-sekolah/frontend/` — React 18 + TypeScript + Vite + Tailwind CSS
Tujuan keseluruhan: Standarisasi frontend ke Tailwind CSS penuh + komponen reusable internal.
Task ini adalah **fondasi** — semua task berikutnya bergantung pada CSS aliases yang dibuat di sini.

## Global Constraints
- Tailwind CSS sudah terpasang — jangan install ulang atau tambah library UI eksternal
- Semua komponen ditulis di `frontend/src/` — tidak ada perubahan backend
- Verifikasi build setiap akhir task: `npm run build` (jalankan dari `frontend/`)

## Files
- **Modify:** `frontend/src/index.css`
- **Check/Create:** `frontend/tailwind.config.js` (jika belum ada)
- **Check/Create:** `frontend/postcss.config.js` (jika belum ada)

## Deliverable
Class utilities berikut tersedia secara global setelah task ini:
- `.input-std` — input field standar
- `.btn-std-primary` — tombol primary (indigo)
- `.btn-std-secondary` — tombol secondary (border gray)
- `.btn-std-danger-icon` — icon button danger (merah)
- `.btn-std-icon` — icon button netral
- `.page-enter` — animasi fade-in container halaman
- `.modal-enter` — animasi slide-in modal

## Steps

### Step 1: Ganti isi `frontend/src/index.css` dengan:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import './styles/variables.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: #f3f4f6;
  color: #111827;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
}

@layer components {
  .input-std {
    @apply w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
           bg-white text-gray-900 placeholder:text-gray-400
           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
           transition-colors;
  }

  .btn-std-primary {
    @apply inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
           text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-std-secondary {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
           text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors;
  }

  .btn-std-danger-icon {
    @apply p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors;
  }

  .btn-std-icon {
    @apply p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors;
  }
}

@keyframes pageFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: pageFadeUp 0.3s ease-out forwards;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-enter {
  animation: modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* React Quill Custom Styles (dipertahankan) */
.ql-toolbar.ql-snow {
  background: #f9fafb !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-bottom: 1px solid #e0e7ff !important;
  padding: 12px !important;
}
.ql-container.ql-snow {
  border: none !important;
  font-family: inherit !important;
  font-size: 0.95rem !important;
  min-height: 300px;
}
.ql-editor { min-height: 300px; }
```

### Step 2: Cek `tailwind.config.js`

Jalankan: `Get-ChildItem frontend/ -Name "tailwind.config*"`

Jika tidak ada, buat `frontend/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Jika sudah ada, pastikan `content` sudah include `./src/**/*.{js,ts,jsx,tsx}`.

### Step 3: Cek `postcss.config.js`

Jalankan: `Get-ChildItem frontend/ -Name "postcss.config*"`

Jika tidak ada, buat `frontend/postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Step 4: Verifikasi build

```powershell
cd frontend; npm run build
```

Expected: build sukses, tidak ada error Tailwind/PostCSS.

### Step 5: Commit

```powershell
cd frontend
git add src/index.css
git add tailwind.config.js  # jika baru dibuat
git add postcss.config.js   # jika baru dibuat
git commit -m "feat(ui): setup tailwind css aliases (input-std, btn-std-*, page-enter, modal-enter)"
```

## Report Contract

Tulis laporan lengkap ke: `frontend/.superpowers/sdd/task-0-report.md`

Return hanya:
- Status: DONE / DONE_WITH_CONCERNS / BLOCKED
- Commit hash
- Satu baris test summary: "npm run build — sukses/gagal"
- Concerns (jika ada)
