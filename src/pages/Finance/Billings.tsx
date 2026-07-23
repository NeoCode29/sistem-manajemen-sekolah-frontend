import React, { useEffect, useState } from 'react';
import { getBillings, generateBatchBillings, updateBilling, cancelBilling, getPaymentPeriods, type StudentBilling, type PaymentPeriod } from '../../api/financeService';
import { getGrades, getClassrooms, type Grade, type Classroom } from '../../api/academicService';
import { FileText, Wand2, Search, Edit3, Trash2 } from 'lucide-react';
import '../Academic/Academic.css';

export const Billings: React.FC = () => {
  const [billings, setBillings] = useState<StudentBilling[]>([]);
  const [periods, setPeriods] = useState<PaymentPeriod[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [filterPeriodId, setFilterPeriodId] = useState('');
  
  // Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchPeriodId, setBatchPeriodId] = useState('');
  const [batchGradeId, setBatchGradeId] = useState('');
  const [batchClassroomId, setBatchClassroomId] = useState('');
  const [batchDueDate, setBatchDueDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<StudentBilling | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [status, filterPeriodId]);

  useEffect(() => {
    if (batchGradeId) fetchClassrooms(batchGradeId);
    else setClassrooms([]);
  }, [batchGradeId]);

  const fetchDependencies = async () => {
    try {
      const [periodsData, gradesData] = await Promise.all([
        getPaymentPeriods(),
        getGrades()
      ]);
      setPeriods(periodsData);
      setGrades(gradesData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassrooms = async (gradeId: string) => {
    try {
      const data = await getClassrooms(gradeId);
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (filterPeriodId) params.paymentPeriodId = filterPeriodId;
      
      const res = await getBillings(params);
      setBillings(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat daftar tagihan');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBillings();
  };

  const openBatchModal = () => {
    setBatchResult(null);
    setBatchPeriodId('');
    setBatchGradeId('');
    setBatchClassroomId('');
    setBatchDueDate('');
    setIsBatchModalOpen(true);
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const payload: any = {
        paymentPeriodId: batchPeriodId,
        dueDate: new Date(batchDueDate).toISOString(),
      };
      if (batchGradeId) payload.gradeId = batchGradeId;
      if (batchClassroomId) payload.classroomId = batchClassroomId;
      
      const result = await generateBatchBillings(payload);
      setBatchResult(result);
      fetchBillings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat tagihan massal');
    } finally {
      setIsGenerating(false);
    }
  };

  const openEditModal = (billing: StudentBilling) => {
    setEditingBilling(billing);
    setDiscountAmount(Number(billing.discountAmount) || 0);
    setDiscountReason(billing.discountReason || '');
    setIsEditModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBilling) return;
    try {
      setIsSaving(true);
      await updateBilling(editingBilling.id, {
        discountAmount: Number(discountAmount),
        discountReason
      });
      setIsEditModalOpen(false);
      fetchBillings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan penyesuaian/diskon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBilling = async (id: string) => {
    if (window.confirm('Yakin ingin membatalkan tagihan ini? (Tagihan berstatus PAID atau PARTIAL tidak dapat dibatalkan)')) {
      try {
        await cancelBilling(id);
        fetchBillings();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal membatalkan tagihan');
      }
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">LUNAS</span>;
      case 'PARTIAL': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">SEBAGIAN</span>;
      case 'UNPAID': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">BELUM BAYAR</span>;
      case 'CANCELLED': return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-semibold">BATAL</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Tagihan (Billings)</h1>
          <p className="page-subtitle">Buat tagihan massal per kelas, kelola diskon, dan pantau status lunas</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openBatchModal}>
          <Wand2 size={18} /> Generate Tagihan Massal
        </button>
      </div>

      <div className="glass-panel p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="form-group flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Cari Siswa / NIS</label>
            <div className="relative">
              <input 
                type="text" 
                className="input-field mt-1 pl-9" 
                placeholder="Ketik nama atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
          <div className="form-group w-48">
            <label className="text-xs font-semibold text-gray-500 uppercase">Periode Tagihan</label>
            <select className="input-field mt-1" value={filterPeriodId} onChange={(e) => setFilterPeriodId(e.target.value)}>
              <option value="">Semua Periode</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="form-group w-40">
            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
            <select className="input-field mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="UNPAID">Belum Bayar</option>
              <option value="PARTIAL">Cicilan (Sebagian)</option>
              <option value="PAID">Lunas</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
          <button type="submit" className="btn-secondary h-[42px] px-6">Filter</button>
        </form>
      </div>

      {error && !isBatchModalOpen && !isEditModalOpen && <div className="error-message mb-4">{error}</div>}

      <div className="glass-panel">
        <div className="table-header">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FileText size={18} /> Daftar Tagihan Siswa
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data tagihan...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Tagihan & Periode</th>
                  <th className="text-right">Nominal Dasar</th>
                  <th className="text-right">Diskon/Beasiswa</th>
                  <th className="text-right">Sisa Tagihan</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {billings.map((billing) => (
                  <tr key={billing.id}>
                    <td>
                      <div className="font-semibold text-gray-800">{billing.student?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">NIS: {billing.student?.nis || '-'}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-blue-700">{billing.paymentType?.name || 'Tagihan'}</div>
                      <div className="text-xs text-gray-500 mt-1">{billing.paymentPeriod?.title || '-'}</div>
                    </td>
                    <td className="text-right text-gray-600">
                      {formatCurrency(billing.amount)}
                    </td>
                    <td className="text-right">
                      {Number(billing.discountAmount) > 0 ? (
                        <div>
                          <div className="text-green-600 font-medium">-{formatCurrency(billing.discountAmount)}</div>
                          <div className="text-[10px] text-gray-500 mt-1 uppercase max-w-[120px] truncate ml-auto" title={billing.discountReason}>{billing.discountReason}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-right font-bold text-gray-800">
                      {formatCurrency(billing.remainingAmount)}
                    </td>
                    <td className="text-center">
                      {getStatusBadge(billing.status)}
                    </td>
                    <td>
                      <div className="action-buttons justify-center">
                        <button 
                          className="btn-icon text-blue-600 disabled:opacity-50" 
                          title="Beri Diskon / Edit Nominal"
                          onClick={() => openEditModal(billing)}
                          disabled={billing.status === 'PAID' || billing.status === 'CANCELLED'}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="btn-icon text-red-600 disabled:opacity-50" 
                          title="Batalkan Tagihan"
                          onClick={() => handleCancelBilling(billing.id)}
                          disabled={billing.status === 'PAID' || billing.status === 'PARTIAL' || billing.status === 'CANCELLED'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {billings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">Tidak ada tagihan yang sesuai filter pencarian</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL BATCH GENERATION */}
      {isBatchModalOpen && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>Generate Tagihan Massal</h2>
              <button type="button" className="btn-close" onClick={() => setIsBatchModalOpen(false)}>&times;</button>
            </div>
            
            {batchResult ? (
              <div className="modal-body text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wand2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Proses Selesai!</h3>
                <p className="text-gray-600 mb-6">Tagihan berhasil dibuat (atau dilewati jika sudah ada tagihan sebelumnya).</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded border">
                    <div className="text-3xl font-bold text-gray-800">{batchResult.totalTargetStudents}</div>
                    <div className="text-xs text-gray-500 font-semibold uppercase mt-1">Total Target</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded border border-green-100">
                    <div className="text-3xl font-bold text-green-600">{batchResult.generatedCount}</div>
                    <div className="text-xs text-green-700 font-semibold uppercase mt-1">Berhasil Dibuat</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded border border-blue-100">
                    <div className="text-3xl font-bold text-blue-600">{batchResult.skippedCount}</div>
                    <div className="text-xs text-blue-700 font-semibold uppercase mt-1">Dilewati (Duplikat)</div>
                  </div>
                </div>
                
                <button className="btn-primary w-full" onClick={() => setIsBatchModalOpen(false)}>Tutup</button>
              </div>
            ) : (
              <form onSubmit={handleGenerateBatch} className="modal-form-v4">
                <div className="modal-body-v4 form-grid">
                {error && <div className="error-message mb-4">{error}</div>}
                
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                  Fitur ini akan secara otomatis membuatkan tagihan untuk <strong>seluruh siswa aktif</strong> pada kelas atau tingkat yang dipilih, menggunakan Nominal Dasar dari Jenis Tagihan. Sistem akan melewati siswa yang sudah ditagih (Idempotent).
                </p>

                <div className="form-group mb-4">
                  <label className="text-sm font-medium text-gray-700">Pilih Periode Tagihan *</label>
                  <select 
                    className="input-field mt-1" 
                    value={batchPeriodId} 
                    onChange={(e) => setBatchPeriodId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Periode --</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.title} (Jatuh Tempo: {new Date(p.dueDate).toLocaleDateString('id-ID')})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tingkat Kelas (Opsional)</label>
                    <select 
                      className="input-field mt-1" 
                      value={batchGradeId} 
                      onChange={(e) => { setBatchGradeId(e.target.value); setBatchClassroomId(''); }}
                    >
                      <option value="">-- Semua Tingkat --</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Rombel/Kelas (Opsional)</label>
                    <select 
                      className="input-field mt-1" 
                      value={batchClassroomId} 
                      onChange={(e) => setBatchClassroomId(e.target.value)}
                      disabled={!batchGradeId}
                    >
                      <option value="">-- Semua Kelas di Tingkat Ini --</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group mb-6">
                  <label className="text-sm font-medium text-red-600">Tetapkan Jatuh Tempo Baru (Opsional)</label>
                  <input 
                    type="date" 
                    className="input-field mt-1" 
                    value={batchDueDate} 
                    onChange={(e) => setBatchDueDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika ingin mengikuti Jatuh Tempo bawaan dari Master Periode.</p>
                </div>

                </div>
                <div className="modal-footer-v4">
                  <button type="button" className="btn-secondary" onClick={() => setIsBatchModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn-primary flex items-center gap-2" disabled={isGenerating || !batchPeriodId}>
                    {isGenerating ? 'Memproses...' : <><Wand2 size={16} /> Jalankan Generator</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT/DISCOUNT */}
      {isEditModalOpen && editingBilling && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>Penyesuaian & Diskon Tagihan</h2>
              <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveDiscount} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              
              <div className="bg-gray-50 p-4 rounded-md border mb-5">
                <div className="text-sm text-gray-500 mb-1">Siswa: <span className="font-semibold text-gray-800">{editingBilling.student?.fullName}</span></div>
                <div className="text-sm text-gray-500 mb-1">Tagihan: <span className="font-semibold text-gray-800">{editingBilling.paymentType?.name} ({editingBilling.paymentPeriod?.title})</span></div>
                <div className="text-sm text-gray-500">Nominal Dasar: <span className="font-semibold text-gray-800">{formatCurrency(editingBilling.amount)}</span></div>
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-green-700">Potongan Harga / Beasiswa (Rp)</label>
                <input 
                  type="number" 
                  className="input-field mt-1 border-green-200 focus:border-green-500" 
                  value={discountAmount} 
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  min={0}
                  max={Number(editingBilling.amount)}
                />
                <p className="text-xs text-gray-500 mt-1">Sisa tagihan akhir akan menjadi: <strong>{formatCurrency(Number(editingBilling.amount) - discountAmount)}</strong></p>
              </div>

              <div className="form-group mb-6">
                <label className="text-sm font-medium text-gray-700">Alasan Diskon / Keterangan Beasiswa</label>
                <input 
                  type="text" 
                  className="input-field mt-1" 
                  value={discountReason} 
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Misal: Anak Guru, Beasiswa Prestasi"
                  required={discountAmount > 0}
                />
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
