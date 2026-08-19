import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPromotions, cancelPromotion } from '../../api/promotionService';
import { TrendingUp, Undo2 } from 'lucide-react';
import './Academic.css';

export const Promotions: React.FC = () => {
  const navigate = useNavigate();
  const [promotionsHistory, setPromotionsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getPromotions({ page, limit: 15 });
      setPromotionsHistory(response.data || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(page);
    } catch (err: any) {
      setError('Gagal memuat riwayat kenaikan kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);


  const handleCancelPromotion = async (id: string) => {
    if (window.confirm('Yakin ingin membatalkan status kenaikan kelas ini?')) {
      try {
        await cancelPromotion(id);
        fetchHistory();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal membatalkan');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROMOTED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Naik Kelas</span>;
      case 'STAYED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Tinggal Kelas</span>;
      case 'DROPPED_OUT': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Keluar / DO</span>;
      case 'GRADUATED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Lulus</span>;
      default: return <span>{status}</span>;
    }
  };

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

      <div className="glass-panel mt-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Tahun Ajaran Baru</th>
                  <th>Kelas Asal</th>
                  <th>Kelas Tujuan</th>
                  <th>Status</th>
                  <th>Tanggal Proses</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {promotionsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      Belum ada riwayat kenaikan kelas
                    </td>
                  </tr>
                ) : (
                  promotionsHistory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium text-gray-900">{item.student?.fullName || item.student?.name || 'Siswa tidak ditemukan'}</div>
                        <div className="text-xs text-gray-500">{item.student?.nis || item.student?.nisn}</div>
                      </td>
                      <td>{item.toAcademicYear?.name || '-'}</td>
                      <td>{item.fromClassroom?.name || '-'}</td>
                      <td>{item.toClassroom?.name || '-'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{new Date(item.promotionDate || item.createdAt).toLocaleDateString('id-ID')}</td>
                      <td>
                        <button
                          onClick={() => handleCancelPromotion(item.id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded flex items-center gap-1 text-xs font-medium border border-transparent hover:border-orange-200"
                          title="Batalkan Kenaikan Kelas"
                        >
                          <Undo2 size={14} /> Batal
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-xl">
              <div className="flex justify-between flex-1 sm:hidden">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">Menampilkan halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span></p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                      <span>Sebelumnya</span>
                    </button>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                      <span>Selanjutnya</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

    </div>
  );
};
