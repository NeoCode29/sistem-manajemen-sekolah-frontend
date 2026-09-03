import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Undo2, AlertCircle } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePromotions } from '../../hooks/usePromotions';
import { useDialog } from '../../contexts/DialogContext';
import { Badge } from '../../components/ui/Badge';

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

  const handleCancelPromotion = async (id: string) => {
    showConfirm('Yakin ingin membatalkan status kenaikan kelas ini?', async () => {
      setActionError('');
      try {
        await cancelPromotion(id);
      } catch (err: any) {
        setActionError(err.message || 'Gagal membatalkan');
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
    { key: 'status', header: 'Status', render: (row) => getStatusBadge(row.status) },
    { key: 'date', header: 'Tanggal Proses', render: (row) => new Date(row.promotionDate || row.createdAt).toLocaleDateString('id-ID') },
    { key: 'actions', header: 'Aksi', render: (row) => (
      <button
        onClick={() => handleCancelPromotion(row.id)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        title="Batalkan Kenaikan Kelas"
      >
        <Undo2 size={16} /> Batal
      </button>
    )}
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kenaikan Kelas</h1>
          <p className="text-gray-500 mt-1">Riwayat dan pemrosesan kenaikan kelas siswa</p>
        </div>
        <div className="header-actions">
          <button className="btn-std-primary" onClick={() => navigate('/academic/promotions/batch')}>
            <TrendingUp size={18} />
            <span>Proses Kenaikan Kelas</span>
          </button>
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
