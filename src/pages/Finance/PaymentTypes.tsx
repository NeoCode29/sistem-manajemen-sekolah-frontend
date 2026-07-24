import React, { useEffect, useState } from 'react';
import { getPaymentTypes, createPaymentType, updatePaymentType, deletePaymentType, type PaymentType } from '../../api/financeService';
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react';
import '../Academic/Academic.css';

export const PaymentTypes: React.FC = () => {
  const [types, setTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<PaymentType | null>(null);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [defaultAmount, setDefaultAmount] = useState<string>('0');
  const [isRecurring, setIsRecurring] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getPaymentTypes();
      setTypes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data jenis tagihan');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingType(null);
    setCode('');
    setName('');
    setDefaultAmount('0');
    setIsRecurring(true);
    setDescription('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: PaymentType) => {
    setEditingType(item);
    setCode(item.code);
    setName(item.name);
    setDefaultAmount(item.defaultAmount.toString());
    setIsRecurring(item.isRecurring);
    setDescription(item.description || '');
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        code,
        name,
        defaultAmount: Number(defaultAmount),
        isRecurring,
        description
      };
      
      if (editingType) {
        await updatePaymentType(editingType.id, payload);
      } else {
        await createPaymentType(payload);
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
    if (window.confirm('Yakin ingin menghapus jenis tagihan ini? Data yang sudah berelasi tidak dapat dihapus.')) {
      try {
        await deletePaymentType(id);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus data');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Jenis Tagihan</h1>
          <p className="page-subtitle">Kelola kategori dan besaran dasar tagihan keuangan</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
          <Plus size={18} /> Tambah Jenis Tagihan
        </button>
      </div>

      {error && !isModalOpen && <div className="error-message mb-4">{error}</div>}

      <div className="glass-panel">
        <div className="table-header">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Wallet size={18} /> Daftar Jenis Tagihan
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
                  <th className="w-32">Kode</th>
                  <th>Nama Tagihan</th>
                  <th className="text-right w-40">Nominal Default</th>
                  <th className="text-center w-32">Rutin (Bulanan)?</th>
                  <th className="text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {types.map((type, index) => (
                  <tr key={type.id}>
                    <td className="text-center text-gray-500">{index + 1}</td>
                    <td className="font-mono text-sm text-gray-600">{type.code}</td>
                    <td>
                      <div className="font-semibold text-gray-800">{type.name}</div>
                      {type.description && <div className="text-xs text-gray-500 mt-1 font-normal">{type.description}</div>}
                    </td>
                    <td className="text-right font-semibold text-gray-700">{formatCurrency(type.defaultAmount)}</td>
                    <td className="text-center">
                      <span className={`status-badge ${type.isRecurring ? 'active' : 'inactive'}`}>
                        {type.isRecurring ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons justify-center">
                        <button className="btn-icon text-blue-600" onClick={() => openEditModal(type)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon text-red-600" onClick={() => handleDelete(type.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {types.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Belum ada data jenis tagihan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>{editingType ? 'Edit Jenis Tagihan' : 'Tambah Jenis Tagihan'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && <div className="error-message mb-4">{error}</div>}
              
              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Kode Tagihan *</label>
                <input 
                  type="text" 
                  className="input-field mt-1 uppercase" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required 
                  placeholder="Misal: SPP, UANG_GEDUNG"
                />
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Nama Tagihan *</label>
                <input 
                  type="text" 
                  className="input-field mt-1" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Nominal Default (Rp) *</label>
                <input 
                  type="number" 
                  className="input-field mt-1" 
                  value={defaultAmount} 
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  min={0}
                  required 
                />
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Jenis Rutinitas</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="isRecurring"
                      checked={isRecurring}
                      onChange={() => setIsRecurring(true)}
                    />
                    Rutin Bulanan (contoh: SPP)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="isRecurring"
                      checked={!isRecurring}
                      onChange={() => setIsRecurring(false)}
                    />
                    Sekali Bayar (Insidental)
                  </label>
                </div>
              </div>

              <div className="form-group mb-6">
                <label className="text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
                <textarea 
                  className="input-field mt-1" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                ></textarea>
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
