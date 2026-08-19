import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getItems, createItem, updateItem, deleteItem, getRooms, type HardwareItem, type Room } from '../../api/inventoryService';
import { Monitor, Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react';
import '../Academic/Academic.css';

export const Items: React.FC = () => {
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterRoomId, setFilterRoomId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HardwareItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [condition, setCondition] = useState('Baik');
  const [status, setStatus] = useState('Tersedia');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [search, filterRoomId, filterStatus]);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (filterRoomId) params.roomId = filterRoomId;
      if (filterStatus) params.status = filterStatus;
      
      const data = await getItems(params);
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data barang');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setCategory('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setPurchaseDate('');
    setPurchasePrice(0);
    setCondition('Baik');
    setStatus('Tersedia');
    setRoomId('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: HardwareItem) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setCategory(item.category);
    setBrand(item.brand || '');
    setModel(item.model || '');
    setSerialNumber(item.serialNumber || '');
    setPurchaseDate(item.purchaseDate ? item.purchaseDate.split('T')[0] : '');
    setPurchasePrice(item.purchasePrice || 0);
    setCondition(item.condition);
    setStatus(item.status);
    setRoomId(item.roomId || '');
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
        category,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : undefined,
        purchasePrice: Number(purchasePrice),
        condition,
        status,
        roomId: roomId || undefined
      };
      
      if (editingItem) {
        await updateItem(editingItem.id, payload);
      } else {
        await createItem(payload);
      }
      
      closeModal();
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus barang ini?')) {
      try {
        await deleteItem(id);
        fetchItems();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus data');
      }
    }
  };

  const getStatusColor = (s: string) => {
    switch(s.toLowerCase()) {
      case 'tersedia': return 'bg-green-100 text-green-800';
      case 'dipinjam': return 'bg-blue-100 text-blue-800';
      case 'dalam perbaikan': return 'bg-yellow-100 text-yellow-800';
      case 'dihapus': return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventaris Barang</h1>
          <p className="page-subtitle">Kelola data aset, elektronik, dan peralatan sekolah</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
          <Plus size={18} /> Tambah Barang
        </button>
      </div>

      <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-end bg-gray-50/50">
        <div className="form-group w-48">
          <label className="text-xs font-semibold text-gray-500 uppercase">Lokasi Ruangan</label>
          <select className="input-field mt-1" value={filterRoomId} onChange={(e) => setFilterRoomId(e.target.value)}>
            <option value="">Semua Lokasi</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="form-group w-40">
          <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
          <select className="input-field mt-1" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Dalam Perbaikan">Dalam Perbaikan</option>
            <option value="Dihapus">Dihapus</option>
          </select>
        </div>
        <div className="form-group flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase">Pencarian Barang / Kode</label>
          <div className="relative">
            <input 
              type="text" 
              className="input-field mt-1 pl-9" 
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {error && !isModalOpen && <div className="error-message mb-4">{error}</div>}

      <div className="glass-panel">
        <div className="table-header">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Monitor size={18} /> Daftar Aset & Barang
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-y">
                  <th className="p-3 font-medium">Kode & Barang</th>
                  <th className="p-3 font-medium">Kategori / Merk</th>
                  <th className="p-3 font-medium">Lokasi</th>
                  <th className="p-3 font-medium text-center">Kondisi & Status</th>
                  <th className="p-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{item.code}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-blue-700">{item.category}</div>
                      <div className="text-xs text-gray-600 mt-1">{item.brand} {item.model}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <MapPin size={14} className="text-red-500" />
                        {item.room?.name || 'Gudang Utama'}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="mb-1 text-sm font-medium text-gray-700">{item.condition}</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" onClick={() => openEditModal(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Belum ada data barang. Silakan tambah baru.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '600px' }}>
            <div className="modal-header-v4">
              <h2>{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && <div className="error-message mb-4">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kode Inventaris *</label>
                  <input 
                    type="text" 
                    className="input-field mt-1 font-mono uppercase" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Misal: INV-2026-001"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nama Barang *</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kategori *</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Misal: Elektronik"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Merk / Brand</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Model / Tipe</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nomor Seri (S/N)</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={serialNumber} 
                    onChange={(e) => setSerialNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Lokasi / Ruangan</label>
                  <select className="input-field mt-1" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                    <option value="">(Gudang Utama)</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 border-t pt-4 border-gray-100">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Tanggal Pembelian</label>
                  <input 
                    type="date" 
                    className="input-field mt-1" 
                    value={purchaseDate} 
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Harga Beli (Rp)</label>
                  <input 
                    type="number" 
                    className="input-field mt-1" 
                    value={purchasePrice} 
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kondisi Fisik *</label>
                  <select className="input-field mt-1" value={condition} onChange={(e) => setCondition(e.target.value)} required>
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Status Keberadaan *</label>
                  <select className="input-field mt-1" value={status} onChange={(e) => setStatus(e.target.value)} required>
                    <option value="Tersedia">Tersedia</option>
                    <option value="Dipinjam">Dipinjam</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                    <option value="Dihapus">Dihapus (Afkir)</option>
                  </select>
                </div>
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
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
