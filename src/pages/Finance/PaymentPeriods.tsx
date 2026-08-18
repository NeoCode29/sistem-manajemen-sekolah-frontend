import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPaymentPeriods, createPaymentPeriod, updatePaymentPeriod, deletePaymentPeriod, getPaymentTypes, type PaymentPeriod, type PaymentType } from '../../api/financeService';
import { getAcademicYears, getSemesters, type AcademicYear, type Semester } from '../../api/academicService';
import { Plus, Edit2, Trash2, CalendarDays } from 'lucide-react';
import '../Academic/Academic.css';

export const PaymentPeriods: React.FC = () => {
  const [periods, setPeriods] = useState<PaymentPeriod[]>([]);
  const [types, setTypes] = useState<PaymentType[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterPaymentTypeId, setFilterPaymentTypeId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PaymentPeriod | null>(null);
  
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterAcademicYearId, filterSemesterId, filterPaymentTypeId]);

  const fetchDependencies = async () => {
    try {
      const [typesData, ayData, semData] = await Promise.all([
        getPaymentTypes(),
        getAcademicYears(),
        getSemesters()
      ]);
      setTypes(typesData);
      setAcademicYears(ayData);
      setSemesters(semData);
      
      const activeAy = ayData.find(a => a.isActive);
      const activeSem = semData.find(s => s.isActive);
      
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
      
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterAcademicYearId) params.academicYearId = filterAcademicYearId;
      if (filterSemesterId) params.semesterId = filterSemesterId;
      if (filterPaymentTypeId) params.paymentTypeId = filterPaymentTypeId;
      
      const data = await getPaymentPeriods(params);
      setPeriods(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data periode tagihan');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPeriod(null);
    setPaymentTypeId(types.length > 0 ? types[0].id : '');
    setAcademicYearId(filterAcademicYearId || (academicYears.length > 0 ? academicYears[0].id : ''));
    setSemesterId(filterSemesterId || (semesters.length > 0 ? semesters[0].id : ''));
    setMonth(String(new Date().getMonth() + 1));
    setYear(String(new Date().getFullYear()));
    setTitle('');
    setDueDate('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: PaymentPeriod) => {
    setEditingPeriod(item);
    setPaymentTypeId(item.paymentTypeId);
    setAcademicYearId(item.academicYearId);
    setSemesterId(item.semesterId);
    setMonth(item.month ? String(item.month) : '');
    setYear(item.year ? String(item.year) : '');
    setTitle(item.title);
    setDueDate(item.dueDate.split('T')[0]); // assuming ISO string
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const generateTitle = () => {
    const type = types.find(t => t.id === paymentTypeId);
    if (!type) return;
    
    if (type.isRecurring && month && year) {
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      setTitle(`${type.name} ${monthNames[Number(month) - 1]} ${year}`);
    } else {
      const ay = academicYears.find(a => a.id === academicYearId);
      setTitle(`${type.name} ${ay ? ay.name : ''}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const type = types.find(t => t.id === paymentTypeId);
      
      const payload: any = {
        paymentTypeId,
        academicYearId,
        semesterId,
        title,
        dueDate: new Date(dueDate).toISOString(),
      };
      
      if (type?.isRecurring) {
        payload.month = Number(month);
        payload.year = Number(year);
      }
      
      if (editingPeriod) {
        await updatePaymentPeriod(editingPeriod.id, payload);
      } else {
        await createPaymentPeriod(payload);
      }
      
      closeModal();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus periode tagihan ini? (Hanya bisa dihapus jika belum ada tagihan siswa yang menaut ke periode ini)')) {
      try {
        await deletePaymentPeriod(id);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus data');
      }
    }
  };

  const isSelectedTypeRecurring = types.find(t => t.id === paymentTypeId)?.isRecurring;

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Periode Pembayaran</h1>
          <p className="page-subtitle">Tetapkan periode waktu dan batas jatuh tempo (due date) tagihan</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
          <Plus size={18} /> Tambah Periode
        </button>
      </div>

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-end bg-gray-50/50">
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Tahun Ajaran</label>
          <select className="input-field mt-1" value={filterAcademicYearId} onChange={(e) => setFilterAcademicYearId(e.target.value)}>
            <option value="">Semua</option>
            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </select>
        </div>
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Semester</label>
          <select className="input-field mt-1" value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}>
            <option value="">Semua</option>
            {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
          </select>
        </div>
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Jenis Tagihan</label>
          <select className="input-field mt-1" value={filterPaymentTypeId} onChange={(e) => setFilterPaymentTypeId(e.target.value)}>
            <option value="">Semua</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {error && !isModalOpen && <div className="error-message mb-4">{error}</div>}

      <div className="glass-panel">
        <div className="table-header">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <CalendarDays size={18} /> Daftar Periode Tagihan Aktif
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16 text-center">No</th>
                  <th>Jenis Tagihan</th>
                  <th>Judul Tagihan</th>
                  <th>Jatuh Tempo</th>
                  <th className="text-center w-32">Bulan/Tahun</th>
                  <th className="text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period, index) => (
                  <tr key={period.id}>
                    <td className="text-center text-gray-500">{index + 1}</td>
                    <td>
                      <span className="status-badge active border border-blue-100">
                        {period.paymentType?.name}
                      </span>
                    </td>
                    <td className="font-semibold text-gray-700">{period.title}</td>
                    <td>
                      <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
                        <CalendarDays size={14} />
                        {new Date(period.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="text-center text-gray-600 text-sm font-medium">
                      {period.month ? `${period.month}/${period.year}` : '-'}
                    </td>
                    <td>
                      <div className="action-buttons justify-center">
                        <button className="btn-icon text-blue-600" onClick={() => openEditModal(period)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon text-red-600" onClick={() => handleDelete(period.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {periods.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Belum ada data periode pembayaran</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '550px' }}>
            <div className="modal-header-v4">
              <h2>{editingPeriod ? 'Edit Periode' : 'Tambah Periode Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && <div className="error-message mb-4">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Jenis Tagihan *</label>
                  <select 
                    className="input-field mt-1" 
                    value={paymentTypeId} 
                    onChange={(e) => setPaymentTypeId(e.target.value)}
                    required
                  >
                    <option value="">Pilih Jenis</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tahun Ajaran *</label>
                  <select 
                    className="input-field mt-1" 
                    value={academicYearId} 
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    required
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Semester *</label>
                  <select 
                    className="input-field mt-1" 
                    value={semesterId} 
                    onChange={(e) => setSemesterId(e.target.value)}
                    required
                  >
                    <option value="">Pilih Semester</option>
                    {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-red-600">Jatuh Tempo (Due Date) *</label>
                  <input 
                    type="date" 
                    className="input-field mt-1 border-red-200 focus:border-red-500" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {isSelectedTypeRecurring && (
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-blue-50/50 rounded border border-blue-100">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Bulan Target *</label>
                    <select className="input-field mt-1" value={month} onChange={(e) => setMonth(e.target.value)} required={isSelectedTypeRecurring}>
                      <option value="">Pilih Bulan</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tahun Target *</label>
                    <input 
                      type="number" 
                      className="input-field mt-1" 
                      value={year} 
                      onChange={(e) => setYear(e.target.value)}
                      required={isSelectedTypeRecurring} 
                      min={2000} max={2100}
                    />
                  </div>
                </div>
              )}

              <div className="form-group mb-6">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-sm font-medium text-gray-700">Judul Tagihan (Otomatis) *</label>
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={generateTitle}>Buat Otomatis</button>
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: SPP Juli 2026"
                  required 
                />
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    </div>
  );
};
