import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getRooms, createRoom, updateRoom, deleteRoom, type Room } from '../../api/inventoryService';
import { Box, Plus, Edit2, Trash2, Search } from 'lucide-react';
import '../Academic/Academic.css';

export const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Room | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [search]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      
      const data = await getRooms(params);
      setRooms(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data ruangan');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setCapacity(0);
    setBuilding('');
    setFloor('');
    setDescription('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (item: Room) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code || '');
    setCapacity(item.capacity || 0);
    setBuilding(item.building || '');
    setFloor(item.floor || '');
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
        name,
        code,
        capacity: Number(capacity),
        building,
        floor,
        description
      };
      
      if (editingItem) {
        await updateRoom(editingItem.id, payload);
      } else {
        await createRoom(payload);
      }
      
      closeModal();
      fetchRooms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus ruangan ini?')) {
      try {
        await deleteRoom(id);
        fetchRooms();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus data');
      }
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Ruangan</h1>
          <p className="page-subtitle">Kelola master data gedung dan ruangan sekolah</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
          <Plus size={18} /> Tambah Ruangan
        </button>
      </div>

      <div className="glass-panel p-4 mb-6">
        <div className="form-group max-w-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase">Cari Ruangan</label>
          <div className="relative">
            <input 
              type="text" 
              className="input-field mt-1 pl-9" 
              placeholder="Nama atau kode ruangan..."
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
            <Box size={18} /> Daftar Ruangan
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-y">
                  <th className="p-3 font-medium">Nama Ruangan</th>
                  <th className="p-3 font-medium">Gedung & Lantai</th>
                  <th className="p-3 font-medium text-center">Kapasitas</th>
                  <th className="p-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{item.code || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-700">{item.building || '-'}</div>
                      <div className="text-xs text-gray-500">{item.floor ? `Lantai ${item.floor}` : ''}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium text-sm">
                        {item.capacity ? `${item.capacity} Orang` : '-'}
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
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">Belum ada data ruangan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2>{editingItem ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</h2>
              <button type="button" className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
              {error && <div className="error-message mb-4">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Nama Ruangan *</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Kode Ruangan</label>
                  <input 
                    type="text" 
                    className="input-field mt-1 font-mono uppercase" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Gedung</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={building} 
                    onChange={(e) => setBuilding(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Lantai</label>
                  <input 
                    type="text" 
                    className="input-field mt-1" 
                    value={floor} 
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-medium text-gray-700">Kapasitas (Orang)</label>
                <input 
                  type="number" 
                  className="input-field mt-1" 
                  value={capacity} 
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div className="form-group mb-6">
                <label className="text-sm font-medium text-gray-700">Deskripsi / Keterangan Tambahan</label>
                <textarea 
                  className="input-field mt-1" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                ></textarea>
              </div>

              </div>
              <div className="modal-footer-v4">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
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
