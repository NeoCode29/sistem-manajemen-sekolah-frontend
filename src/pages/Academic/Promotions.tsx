import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Undo2, AlertCircle } from 'lucide-react';
import { Pagination } from '../../components/Common/Pagination';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { usePromotions } from '../../hooks/usePromotions';
import { useDialog } from '../../contexts/DialogContext';
import './Academic.css';

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
      case 'PROMOTED': return <span className="status-badge active">Naik Kelas</span>;
      case 'RETAINED': return <span className="status-badge inactive">Tinggal Kelas</span>;
      case 'CANCELLED': return <span className="status-badge inactive" style={{ background: '#fef2f2', color: '#991b1b' }}>Dibatalkan</span>;
      case 'DROPPED_OUT': return <span className="status-badge inactive" style={{ background: '#fef2f2', color: '#991b1b' }}>Keluar / DO</span>;
      case 'GRADUATED': return <span className="status-badge active" style={{ background: '#eff6ff', color: '#1e40af' }}>Lulus</span>;
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
        className="action-btn"
        style={{ color: '#ea580c', border: '1px solid transparent' }}
        title="Batalkan Kenaikan Kelas"
      >
        <Undo2 size={16} style={{ marginRight: '0.25rem' }} /> Batal
      </button>
    )}
  ];

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kenaikan Kelas</h1>
          <p className="page-subtitle">Riwayat dan pemrosesan kenaikan kelas siswa</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/academic/promotions/batch')}>
            <TrendingUp size={18} />
            <span>Proses Kenaikan Kelas</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="glass-panel">
        <DataTable 
          columns={columns} 
          data={promotionsHistory} 
          loading={loading}
          emptyMessage="Belum ada riwayat kenaikan kelas."
        />
        
        {!loading && totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};
