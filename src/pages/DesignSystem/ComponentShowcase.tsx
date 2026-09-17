import React, { useState } from 'react';
import { 
  PageHeader, 
  Badge, 
  EmptyState, 
  ConfirmDialog, 
  FilterBar,
  Modal,
  FormField,
  Select
} from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { notify } from '../../utils/feedback';
import { Toaster } from 'react-hot-toast';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  WifiOff, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles,
  Layers,
  Database,
  ShieldAlert
} from 'lucide-react';

interface DemoItem {
  id: string;
  code: string;
  name: string;
  role: string;
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
}

export const ComponentShowcase: React.FC = () => {
  // State for ConfirmDialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info'>('danger');
  const [confirmConfig, setConfirmConfig] = useState({
    title: 'Hapus Data Pegawai',
    message: 'Apakah Anda yakin ingin menghapus pegawai "Budi Santoso, S.Pd"? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, Hapus',
  });

  // State for Table
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isTableEmpty, setIsTableEmpty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // State for Modal Form Demo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');

  const demoData: DemoItem[] = [
    { id: '1', code: 'PEG-001', name: 'Ahmad Dahlan, M.Pd', role: 'Guru Matematika', status: 'Aktif' },
    { id: '2', code: 'PEG-002', name: 'Siti Aminah, S.Pd', role: 'Wali Kelas X-A', status: 'Aktif' },
    { id: '3', code: 'PEG-003', name: 'Budi Santoso, S.T', role: 'Staff Tata Usaha', status: 'Cuti' },
    { id: '4', code: 'PEG-004', name: 'Dewi Lestari, S.Si', role: 'Guru Biologi', status: 'Nonaktif' },
  ];

  const filteredData = isTableEmpty
    ? []
    : demoData.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter ? item.role.includes(roleFilter) : true;
        return matchesSearch && matchesRole;
      });

  const columns: Column<DemoItem>[] = [
    {
      key: 'code',
      header: 'Kode',
      render: (row) => <span className="font-mono text-xs font-semibold text-gray-500">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Nama Lengkap',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-400">{row.role}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (row.status === 'Aktif') return <Badge variant="success">Aktif</Badge>;
        if (row.status === 'Cuti') return <Badge variant="warning">Cuti</Badge>;
        return <Badge variant="danger">Nonaktif</Badge>;
      },
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => notify.info(`Membuka form edit untuk ${row.name}`)}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmVariant('danger');
              setConfirmConfig({
                title: 'Hapus Data Pegawai',
                message: `Apakah Anda yakin ingin menghapus pegawai "${row.name}"? Data riwayat mengajar akan diarsipkan.`,
                confirmText: 'Ya, Hapus Data',
              });
              setConfirmOpen(true);
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Helper simulated API errors
  const triggerSingleError = () => {
    const fakeError = {
      response: {
        data: {
          statusCode: 404,
          message: 'Data siswa dengan NIS 2026099 tidak ditemukan di sistem.',
        },
      },
    };
    notify.error(fakeError, 'Gagal mengambil data');
  };

  const triggerArrayError = () => {
    const fakeNestJsError = {
      response: {
        data: {
          statusCode: 400,
          error: 'Bad Request',
          message: [
            'NISN harus berupa 10 digit numerik unik',
            'Email wali murid tidak valid',
            'Tanggal lahir siswa tidak boleh di masa depan',
          ],
        },
      },
    };
    notify.error(fakeNestJsError);
  };

  const triggerNetworkError = () => {
    const fakeNetError = new Error('Network Error');
    notify.error(fakeNetError);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Toaster position="top-right" />
      {/* 1. Header Halaman */}
      <PageHeader
        title="UI Pattern & Component Showcase"
        subtitle="Template acuan standar desain UI/UX, sistem error handling, dan interaksi komponen frontend."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Buka Form Modal Demo
          </button>
        }
      />

      {/* 2. Seksi Notifikasi & Error Handling */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">1. Sistem Notifikasi & Error Handling (Unified Toast)</h2>
            <p className="text-xs text-gray-500">Uji langsung parsing pesan error dari backend NestJS dan notifikasi sukses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => notify.success('Data tahun ajaran berhasil diaktifkan!')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Toast: Sukses
          </button>

          <button
            type="button"
            onClick={triggerSingleError}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Toast: Error String (404)
          </button>

          <button
            type="button"
            onClick={triggerArrayError}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Toast: NestJS Multi-Validation
          </button>

          <button
            type="button"
            onClick={triggerNetworkError}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <WifiOff className="w-4 h-4" />
            Toast: Network Error
          </button>
        </div>
      </div>

      {/* 3. Seksi Dialog Konfirmasi (ConfirmDialog) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">2. Dialog Konfirmasi Interaktif (ConfirmDialog)</h2>
            <p className="text-xs text-gray-500">Pengganti modal alert lokal dan window.confirm() bawaan browser.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setConfirmVariant('danger');
              setConfirmConfig({
                title: 'Hapus Rekening / Tagihan SPP',
                message: 'Apakah Anda yakin ingin menghapus tagihan ini? Rekam jejak pembayaran siswa akan hilang.',
                confirmText: 'Hapus Tagihan',
              });
              setConfirmOpen(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-red-200"
          >
            Varian Danger (Hapus/Arsip)
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmVariant('warning');
              setConfirmConfig({
                title: 'Ubah Status Menjadi Nonaktif?',
                message: 'Guru ini tidak akan dapat dijadwalkan mengajar pada semester aktif bila dinonaktifkan.',
                confirmText: 'Ya, Nonaktifkan',
              });
              setConfirmOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-amber-200"
          >
            Varian Warning (Peringatan Aksi)
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmVariant('info');
              setConfirmConfig({
                title: 'Generate E-Rapor Massal',
                message: 'Sistem akan mengompilasi nilai akhir seluruh siswa di kelas X-A menjadi draf rapor.',
                confirmText: 'Mulai Generate',
              });
              setConfirmOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            Varian Info (Konfirmasi Operasi)
          </button>
        </div>
      </div>

      {/* 4. Seksi Filter & Data Table Standar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">3. Standard Filter Bar & DataTable</h2>
              <p className="text-xs text-gray-500">Struktur layout tabel master data dengan skeleton & empty state.</p>
            </div>
          </div>

          {/* Test Control Toggles */}
          <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTableLoading}
                onChange={(e) => setIsTableLoading(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Simulasi Loading</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTableEmpty}
                onChange={(e) => setIsTableEmpty(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Simulasi Kosong</span>
            </label>
          </div>
        </div>

        {/* Reusable Filter Bar */}
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari nama pegawai atau kode..."
          showReset={Boolean(searchQuery || roleFilter)}
          onReset={() => {
            setSearchQuery('');
            setRoleFilter('');
          }}
          filters={
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: '', label: 'Semua Peran / Jabatan' },
                { value: 'Guru', label: 'Guru' },
                { value: 'Wali Kelas', label: 'Wali Kelas' },
                { value: 'Tata Usaha', label: 'Tata Usaha' },
              ]}
            />
          }
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          loading={isTableLoading}
          emptyMessage="Tidak ada data pegawai yang sesuai dengan kriteria filter."
        />
      </div>

      {/* 5. Seksi Standar Badge Status */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">4. Status Badges & Tokens</h2>
            <p className="text-xs text-gray-500">Palet warna status standar untuk seluruh modul.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Badge variant="success">Success / Aktif / Hadir</Badge>
          <Badge variant="warning">Warning / Cuti / Izin</Badge>
          <Badge variant="danger">Danger / Terlambat / SP 1</Badge>
          <Badge variant="info">Info / Siswa Baru</Badge>
          <Badge variant="purple">Purple / Role Khusus</Badge>
          <Badge variant="default">Default / Draft</Badge>
        </div>
      </div>

      {/* Active ConfirmDialog Instance */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant={confirmVariant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={async () => {
          // Simulasi aksi asinkron
          await new Promise((res) => setTimeout(res, 800));
          notify.success('Aksi berhasil diproses!');
          setConfirmOpen(false);
        }}
      />

      {/* Demo Modal Form */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormError('');
        }}
        title="Tambah Pegawai Baru (Standar Form Modal)"
        footer={
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formName.trim()) {
                  setFormError('Nama lengkap wajib diisi');
                  notify.error('Validasi gagal: Nama lengkap wajib diisi');
                  return;
                }
                notify.success(`Pegawai "${formName}" berhasil ditambahkan!`);
                setIsModalOpen(false);
                setFormName('');
                setFormError('');
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              Simpan Data
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <FormField label="Nama Lengkap Pegawai" required error={formError}>
            <input
              type="text"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Contoh: Dr. H. Mulyono, M.Pd"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800"
            />
          </FormField>

          <FormField label="Jabatan">
            <Select
              wrapperClassName="w-full"
              options={[
                { value: 'guru', label: 'Guru Mata Pelajaran' },
                { value: 'wali_kelas', label: 'Wali Kelas' },
                { value: 'tu', label: 'Staff Administrasi' },
              ]}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};
