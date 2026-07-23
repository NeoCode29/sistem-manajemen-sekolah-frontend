import React, { useEffect, useState } from 'react';
import { getReceipts, getReceiptPdfUrl, type PaymentReceipt } from '../../api/financeService';
import { useSearchParams } from 'react-router-dom';
import { FileText, Printer, Search } from 'lucide-react';
import '../Academic/Academic.css';

export const Receipts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');

  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      
      const res = await getReceipts(params);
      setReceipts(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat kuitansi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceipts();
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Kuitansi Pembayaran</h1>
          <p className="page-subtitle">Daftar transaksi pembayaran yang telah berhasil dan cetak kuitansi PDF</p>
        </div>
      </div>

      <div className="glass-panel p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="form-group flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Cari Kuitansi / Nama / NIS</label>
            <div className="relative">
              <input 
                type="text" 
                className="input-field mt-1 pl-9" 
                placeholder="No. Kuitansi atau Siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
          <div className="form-group w-40">
            <label className="text-xs font-semibold text-gray-500 uppercase">Dari Tanggal</label>
            <input 
              type="date" 
              className="input-field mt-1" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group w-40">
            <label className="text-xs font-semibold text-gray-500 uppercase">Sampai Tanggal</label>
            <input 
              type="date" 
              className="input-field mt-1" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary h-[42px] px-6">Filter</button>
        </form>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}
      
      {highlightId && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-bold">Pembayaran Berhasil Diterima!</h3>
            <p className="text-sm mt-1">Kuitansi telah diterbitkan. Anda dapat mencetaknya sekarang.</p>
          </div>
          <a 
            href={getReceiptPdfUrl(highlightId)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded font-medium text-sm flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Printer size={16} /> Cetak Kuitansi
          </a>
        </div>
      )}

      <div className="glass-panel">
        <div className="table-header">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FileText size={18} /> Riwayat Kuitansi
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data kuitansi...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-48">No. Kuitansi</th>
                  <th className="w-40">Tanggal Bayar</th>
                  <th>Siswa</th>
                  <th className="text-right">Total Nominal</th>
                  <th className="text-center">Metode</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className={`${highlightId === receipt.id ? 'bg-green-50/30' : ''}`}>
                    <td>
                      <div className="font-mono font-semibold text-blue-700 text-sm">{receipt.receiptNumber}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase">Kasir: {receipt.recordedBy || 'System'}</div>
                    </td>
                    <td className="text-sm text-gray-600">
                      {new Date(receipt.paymentDate).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <div className="font-medium text-gray-800">{receipt.student?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">NIS: {receipt.student?.nis || '-'}</div>
                    </td>
                    <td className="text-right font-bold text-gray-800">
                      {formatCurrency(receipt.totalAmount)}
                    </td>
                    <td className="text-center">
                      <span className="status-badge inactive border border-gray-200">
                        {receipt.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons justify-center">
                        <a 
                          href={getReceiptPdfUrl(receipt.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded text-xs font-medium transition-colors border border-gray-200 hover:border-blue-200"
                        >
                          <Printer size={14} /> Cetak
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Tidak ada riwayat kuitansi yang ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
