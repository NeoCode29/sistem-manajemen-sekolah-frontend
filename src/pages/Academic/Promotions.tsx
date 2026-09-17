import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Undo2, History, AlertCircle, Search, RotateCcw, Filter } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePromotions } from '../../hooks/usePromotions';
import { PageHeader, Badge, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { Can } from '../../components/Common/Can';
import { notify } from '../../utils/feedback';

export const Promotions: React.FC = () => {
  const navigate = useNavigate();
  const {
    promotionsHistory,
    loading,
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    cancelPromotion
  } = usePromotions();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    variant: ConfirmVariant;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  const latestPromoIdByStudent = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of promotionsHistory) {
      const sId = item.studentId?.toString();
      if (sId && !map.has(sId) && item.status !== 'CANCELLED') {
        map.set(sId, item.id?.toString());
      }
    }
    return map;
  }, [promotionsHistory]);

  const handleCancelPromotion = (row: any) => {
    const studentName = row.student?.fullName || row.student?.name || 'Siswa';
    const fromName = row.fromClassroom?.name || 'Kelas Asal';
    const toName = row.toClassroom?.name || 'Kelas Tujuan';
    const yearName = row.toAcademicYear?.name || '';
    const isLatest = !row.studentId || latestPromoIdByStudent.get(row.studentId.toString()) === row.id?.toString();

    if (!isLatest) {
      notify.warning(
        `Kenaikan kelas siswa "${studentName}" (${fromName} ➔ ${toName}) tidak dapat dibatalkan langsung karena telah memiliki mutasi lanjutan. Batalkan kenaikan terbaru terlebih dahulu.`
      );
      return;
    }

    setConfirmConfig({
      open: true,
      variant: 'danger',
      title: `Batalkan Kenaikan Kelas "${studentName}"`,
      message: (
        <div>
          Apakah Anda yakin ingin membatalkan kenaikan kelas untuk{' '}
          <strong className="text-gray-900 font-semibold">{studentName}</strong>{' '}
          (<span className="text-gray-700 font-medium">{fromName} ➔ {toName}</span> {yearName && `[${yearName}]`})?
          <p className="mt-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Siswa akan dikembalikan ke status terdaftar aktif di kelas asal (<strong>{fromName}</strong>).
          </p>
        </div>
      ),
      confirmText: 'Ya, Batalkan Kenaikan',
      onConfirm: async () => {
        try {
          await cancelPromotion(row.id);
          notify.success(`Kenaikan kelas untuk "${studentName}" berhasil dibatalkan. Siswa dikembalikan ke kelas ${fromName}.`);
          setConfirmConfig(prev => ({ ...prev, open: false }));
        } catch (err: any) {
          notify.error(err, 'Gagal membatalkan kenaikan kelas');
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROMOTED': return <Badge variant="success">Naik Kelas</Badge>;
      case 'RETAINED': return <Badge variant="danger">Tinggal Kelas</Badge>;
      case 'CANCELLED': return <Badge variant="warning">Dibatalkan</Badge>;
      case 'DROPPED_OUT': return <Badge variant="danger">Keluar / DO</Badge>;
      case 'GRADUATED': return <Badge variant="info">Lulus</Badge>;
      default: return <span>{status}</span>;
    }
  };

  // Filtered list based on search and status
  const filteredPromotions = useMemo(() => {
    return promotionsHistory.filter(item => {
      const studentName = (item.student?.fullName || item.student?.name || '').toLowerCase();
      const studentNis = (item.student?.nis || item.student?.nisn || '').toLowerCase();
      const fromClass = (item.fromClassroom?.name || '').toLowerCase();
      const toClass = (item.toClassroom?.name || '').toLowerCase();
      const sTerm = searchTerm.toLowerCase().trim();

      const matchSearch = !sTerm || 
        studentName.includes(sTerm) || 
        studentNis.includes(sTerm) ||
        fromClass.includes(sTerm) ||
        toClass.includes(sTerm);

      const matchStatus = !filterStatus || item.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [promotionsHistory, searchTerm, filterStatus]);

  const columns: Column<any>[] = [
    { 
      key: 'student', 
      header: 'Siswa', 
      render: (row) => (
        <div className="flex flex-col">
          <span 
            className="font-semibold text-gray-900 block max-w-[200px] md:max-w-[260px] truncate"
            title={row.student?.fullName || row.student?.name}
          >
            {row.student?.fullName || row.student?.name || 'Siswa tidak ditemukan'}
          </span>
          <span className="font-mono text-xs text-gray-500">
            {row.student?.nis || row.student?.nisn || '-'}
          </span>
        </div>
      )
    },
    { 
      key: 'toAcademicYear', 
      header: 'Tahun Ajaran Baru', 
      render: (row) => (
        <span className="font-medium text-gray-800 text-xs bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
          {row.toAcademicYear?.name || '-'}
        </span>
      )
    },
    { 
      key: 'fromClassroom', 
      header: 'Kelas Asal', 
      render: (row) => (
        <span 
          className="text-gray-700 font-medium block max-w-[120px] md:max-w-[150px] truncate"
          title={row.fromClassroom?.name}
        >
          {row.fromClassroom?.name || '-'}
        </span>
      )
    },
    { 
      key: 'toClassroom', 
      header: 'Kelas Tujuan', 
      render: (row) => (
        <span 
          className="text-indigo-700 font-semibold block max-w-[120px] md:max-w-[150px] truncate"
          title={row.toClassroom?.name}
        >
          {row.toClassroom?.name || '-'}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (row) => {
        const isLatest = !row.studentId || latestPromoIdByStudent.get(row.studentId.toString()) === row.id?.toString();
        return (
          <div>
            {getStatusBadge(row.status)}
            {row.status !== 'CANCELLED' && !isLatest && (
              <span className="text-[11px] text-amber-600 font-medium block mt-0.5" title="Siswa sudah memiliki kenaikan kelas yang lebih baru">
                Telah Dimutasi Lagi
              </span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'date', 
      header: 'Tanggal Proses', 
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.promotionDate || row.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    { 
      key: 'actions', 
      header: 'Aksi', 
      render: (row) => {
        const isLatest = !row.studentId || latestPromoIdByStudent.get(row.studentId.toString()) === row.id?.toString();
        return (
          <Can permissions={['promotions.revert', 'academic.write']}>
            <div className="flex items-center justify-end">
              {row.status !== 'CANCELLED' ? (
                isLatest ? (
                  <button
                    type="button"
                    onClick={() => handleCancelPromotion(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors shadow-xs"
                    title="Batalkan Kenaikan Kelas"
                  >
                    <Undo2 size={14} /> Batalkan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCancelPromotion(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 hover:text-gray-600 transition-colors"
                    title="Siswa telah dimutasi lagi. Klik untuk info pembatalan."
                  >
                    <Undo2 size={14} /> Terkunci
                  </button>
                )
              ) : (
                <span className="text-xs text-gray-400 italic">Dibatalkan</span>
              )}
            </div>
          </Can>
        );
      }
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Kenaikan Kelas" 
        subtitle="Riwayat dan pemrosesan alur kenaikan kelas siswa antar tahun ajaran"
        action={
          <Can permissions={['promotions.execute', 'academic.write']}>
            <button 
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors" 
              onClick={() => navigate('/academic/promotions/batch')}
            >
              <TrendingUp size={16} />
              <span>Proses Kenaikan Kelas</span>
            </button>
          </Can>
        }
      />

      {/* 2. Filter Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Pencarian Siswa / Rombel
          </label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari nama siswa, NIS, atau rombel kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Status Mutasi
          </label>
          <div className="relative group">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
            >
              <option value="">Semua Status</option>
              <option value="PROMOTED">Naik Kelas</option>
              <option value="RETAINED">Tinggal Kelas</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end mb-1">
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5">
            <History size={14} className="text-gray-400" />
            Total: {filteredPromotions.length} Riwayat
          </span>
        </div>

        {Boolean(searchTerm || filterStatus) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('');
            }}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 shadow-sm"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <DataTable 
          columns={columns} 
          data={filteredPromotions} 
          loading={loading}
          emptyMessage={
            searchTerm || filterStatus
              ? 'Tidak ada riwayat kenaikan kelas yang sesuai dengan filter.'
              : 'Belum ada riwayat kenaikan kelas. Klik "Proses Kenaikan Kelas" untuk memulai.'
          }
        />
        
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 4. ConfirmDialog */}
      <ConfirmDialog
        open={confirmConfig.open}
        onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
