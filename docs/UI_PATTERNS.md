# 🎨 Frontend UI/UX Design System & Pattern Guide

Dokumen ini adalah **Single Source of Truth** untuk pola UI, UX, struktur halaman, dan penanganan feedback/error di frontend `manajemen-sekolah`.

---

## 1. Aturan Mutlak (Hard Constraints)
1. **Dilarang keras menggunakan `window.alert()` atau `window.confirm()` bawaan browser.**
2. **Dilarang membuat state dialog alert ad-hoc di dalam setiap file halaman.**
3. **Semua feedback aksi (sukses/gagal/info/warning) wajib menggunakan `notify` dari `@/utils/feedback`.**
4. **Semua konfirmasi aksi destruktif/kritis (Hapus, Nonaktifkan, Generate Massal) wajib menggunakan `<ConfirmDialog />`.**

---

## 2. Struktur Anatomi Halaman Standar

Setiap halaman modul data master atau operasional wajib mengikuti hierarki 5 blok:

```tsx
export const MasterDataPage = () => {
  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Manajemen ..."
        subtitle="Kelola data ..."
        action={<button onClick={...}>+ Tambah Data</button>}
      />

      {/* 2. Filter & Pencarian Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari data..."
        filters={<select ...>...</select>}
        showReset={Boolean(search || filter)}
        onReset={handleReset}
      />

      {/* 3. Tabel Data Master */}
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        emptyMessage="Tidak ada data yang ditemukan."
      />

      {/* 4. Dialog Konfirmasi Standar */}
      <ConfirmDialog
        open={confirmState.open}
        onClose={() => setConfirmState({ ...confirmState, open: false })}
        onConfirm={handleDelete}
        variant="danger"
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data ini?"
      />

      {/* 5. Modal Tambah / Edit */}
      <Modal open={modalOpen} onClose={...} title="...">
        ...
      </Modal>
    </div>
  );
};
```

---

## 3. Penanganan Error API Backend (NestJS Error Handling)

Backend NestJS menghasilkan format respons validasi `class-validator` yang bervariasi:
- Multi error array: `{ message: ["NISN harus 10 digit", "Email tidak valid"] }`
- String message: `{ message: "Data tidak ditemukan" }`
- Network error: `Error: Network Error`

### Cara Pakai yang Benar:
```typescript
import { notify } from '@/utils/feedback';

try {
  await api.post('/endpoint', payload);
  notify.success('Data berhasil disimpan!');
  closeModal();
} catch (err) {
  // Otomatis mengekstrak array atau string dan menampilkan toast error rapi
  notify.error(err, 'Gagal menyimpan data');
}
```

---

## 4. Standar Token Status Badge

Gunakan `<Badge variant="...">` dari `@/components/ui`:
- `success`: Aktif, Hadir, Lunas, Approved, Terverifikasi.
- `warning`: Cuti, Izin, Sebagian (Partial), Pending Review.
- `danger`: Nonaktif, Alpa/Bolos, Belum Bayar, Ditolak, Surat Peringatan (SP).
- `info`: Siswa Baru, Draft, Terjadwal.
- `purple`: Role Superadmin / Hak Khusus.
- `default`: Status netral atau arsip.

---

## 5. Live Showcase / Demo Komponen
Halaman showcase interaktif dapat diakses pada URL:
- **`http://localhost:5173/design-system`**
- Atau saat login di dalam navigasi: **`/ui-demo`**

---

## 6. Proteksi Overflow & Nilai Kolom Berlebih (Column Overflow Protection)

Setiap tabel data (`<DataTable />`) dan sel kolomnya **wajib memiliki pengaman teks berlebih**:
1. **Aturan Truncation**: Untuk kolom teks bebas (nama, jurusan, deskripsi, alamat, kontak/email), bungkus dengan `truncate block max-w-[...]` dan sertakan atribut `title={value}`.
   ```tsx
   render: (row) => (
     <span 
       className="block max-w-[200px] md:max-w-[260px] truncate" 
       title={row.name}
     >
       {row.name}
     </span>
   )
   ```
2. **Atribut `title`**: Pengguna tetap dapat membaca teks lengkap ketika mengarahkan kursor (hover) tanpa membuat layout tabel melar.
3. **Penyekat DataTable Core**:
   - Komponen `DataTable` otomatis membatasi teks primitif (string/number) dengan `max-w-[240px] md:max-w-[280px] truncate` dan `title`.
   - Mendukung properti `width`, `className`, dan `headerClassName` pada interface `Column<T>`.
   - Dilarang menempatkan `whitespace-nowrap` global pada tag `<table>` agar tidak memaksa kolom melebar tak terbatas.
