import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Undo2, AlertCircle } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePromotions } from '../../hooks/usePromotions';
import { useDialog } from '../../contexts/DialogContext';
import { Badge } from '../../components/ui/Badge';
import { Can } from '../../components/Common/Can';

export const Promotions: React.FC = () => {
  const navigate = useNavigate();
  const {
    promotionsHistory,
    loading,
    error: fetchError,
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    cancelPromotion
  } = usePromotions();

  const [actionError, setActionError] = useState('');
  const error = actionError || fetchError;
  const { showConfirm, showAlert } = useDialog();

  const latestPromoIdByStudent = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of promotionsHistory) {
      const sId = item.studentId?.toString();
      if (sId && !map.has(sId) && item.status !== 'CANCELLED') {
        map.set(sId, item.id?.toString());
      }
    }
    return map;
  }, [promotionsHistory]);

  const handleCancelPromotion = async (row: any) => {
    const studentName = row.student?.fullName || row.student?.name || 'Siswa';
    const fromName = row.fromClassroom?.name || 'Kelas Asal';
    const toName = row.toClassroom?.name || 'Kelas Tujuan';
    const yearName = row.toAcademicYear?.name || '';
    const isLatest = !row.studentId || latestPromoIdByStudent.get(row.studentId.toString()) === row.id?.toString();

    if (!isLatest) {
      showAlert(
        `Kenaikan kelas untuk siswa "${studentName}" (${fromName} ➔ ${toName}) tidak dapat dibatalkan langsung karena siswa telah memiliki kenaikan kelas lanjutan yang lebih baru.\n\nUntuk menjaga keutuhan riwayat akademik, silakan cari dan batalkan kenaikan kelas yang paling baru untuk siswa ini terlebih dahulu secara berurutan.`,
        'Urutan Pembatalan Diperlukan',
        'warning'
      );
      return;
    }

    showConfirm(
      `Apakah Anda yakin ingin membatalkan kenaikan kelas untuk ${studentName} (${fromName} ➔ ${toName} ${yearName})?\n\nSiswa akan dikembalikan ke status terdaftar aktif di kelas ${fromName}.`,
      async () => {
        setActionError('');
        try {
          await cancelPromotion(row.id);
          showAlert(`Kenaikan kelas untuk ${studentName} berhasil dibatalkan. Siswa telah dikembalikan ke kelas ${fromName}.`, 'Berhasil Dibatalkan', 'success');
        } catch (err: any) {
          const errorMsg =
            err.response?.data?.message ||
            err.response?.data?.error?.message ||
            (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : null) ||
            err.message ||
            'Gagal membatalkan kenaikan kelas.';
          setActionError(errorMsg);
          showAlert(errorMsg, 'Tidak Dapat Membatalkan Kenaikan Kelas', 'error');
        }
      },
      'Konfirmasi Pembatalan Kenaikan'
    );
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

  const columns: Column<any>[] = [
    { key: 'student', header: 'Siswa', render: (row) => (
      <div>
        <div className="font-medium text-gray-900">{row.student?.fullName || row.student?.name || 'Siswa tidak ditemukan'}</div>
        <div className="text-xs text-gray-500">{row.student?.nis || row.student?.nisn}</div>
      </div>
    )},
    { key: 'toAcademicYear', header: 'Tahun Ajaran Baru', render: (row) => row.toAcademicYear?.name || '-' },
    { key: 'fromClassroom', header: 'Kelas Asal', render: (row) => row.fromClassroom?.name || '-' },
    { key: 'toClassroom', header: 'Kelas Tujuan', render: (row) => row.toClassroom?.name || '-' },
    { key: 'status', header: 'Status', render: (row) => {
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
    }},
    { key: 'date', header: 'Tanggal Proses', render: (row) => new Date(row.promotionDate || row.createdAt).toLocaleDateString('id-ID') },
    { key: 'actions', header: 'Aksi', render: (row) => {
      const isLatest = !row.studentId || latestPromoIdByStudent.get(row.studentId.toString()) === row.id?.toString();
      return (
        <Can permissions={['promotions.revert', 'academic.write']}>
          {row.status !== 'CANCELLED' ? (
            isLatest ? (
              <button
                onClick={() => handleCancelPromotion(row)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                title="Batalkan Kenaikan Kelas"
              >
                <Undo2 size={16} /> Batal
              </button>
            ) : (
              <button
                onClick={() => handleCancelPromotion(row)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors"
                title="Siswa telah dinaikkan lagi. Klik untuk melihat instruksi pembatalan."
              >
                <Undo2 size={16} /> Batal (Terkunci)
              </button>
            )
          ) : (
            <span className="text-xs text-gray-400 italic">Telah dibatalkan</span>
          )}
        </Can>
      );
    }}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kenaikan Kelas</h1>
          <p className="text-gray-500 mt-1">Riwayat dan pemrosesan kenaikan kelas siswa</p>
        </div>
        <div className="header-actions">
          <Can permissions={['promotions.execute', 'academic.write']}>
            <button className="btn-std-primary" onClick={() => navigate('/academic/promotions/batch')}>
              <TrendingUp size={18} />
              <span>Proses Kenaikan Kelas</span>
            </button>
          </Can>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 flex flex-col overflow-hidden">
        <DataTable 
          containerClassName="w-full overflow-x-auto"
          columns={columns} 
          data={promotionsHistory} 
          loading={loading}
          emptyMessage="Belum ada riwayat kenaikan kelas."
        />
        
        {!loading && totalPages > 1 && (
          <div className="border-t border-gray-100 bg-gray-50/50">
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
    </div>
  );
};
