import React, { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { Megaphone, Plus, Edit2, Trash2, X, Pin, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Academic/Academic.css'; // Reuse existing styles

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    targetAudience: 'SEMUA',
    isPinned: false,
    isActive: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        targetAudience: announcement.targetAudience,
        isPinned: announcement.isPinned,
        isActive: announcement.isActive,
        publishDate: announcement.publishDate ? new Date(announcement.publishDate).toISOString().split('T')[0] : '',
        expireDate: announcement.expireDate ? new Date(announcement.expireDate).toISOString().split('T')[0] : '',
      });
      setEditingId(announcement.id);
    } else {
      setFormData({
        title: '',
        content: '',
        targetAudience: 'SEMUA',
        isPinned: false,
        isActive: true,
        publishDate: new Date().toISOString().split('T')[0],
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        publishDate: formData.publishDate ? new Date(formData.publishDate).toISOString() : undefined,
        expireDate: formData.expireDate ? new Date(formData.expireDate).toISOString() : undefined,
      };

      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement({ ...payload, createdById: user?.id?.toString() || '1' });
      }
      
      closeModal();
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengumuman');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus pengumuman ini?')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal menghapus pengumuman');
      }
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Papan Pengumuman</h1>
          <p className="page-subtitle">Kelola pengumuman untuk siswa, guru, dan staf</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Buat Pengumuman</span>
          </button>
        </div>
      </div>

      <div className="glass-panel mt-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pengumuman</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Tanggal Tayang</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Belum ada pengumuman
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${item.isPinned ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Megaphone size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              {item.title}
                              {item.isPinned && <Pin size={12} className="text-orange-500" />}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.content}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                          ${item.targetAudience === 'SEMUA' ? 'bg-purple-100 text-purple-700' : 
                            item.targetAudience === 'SISWA' ? 'bg-green-100 text-green-700' : 
                            item.targetAudience === 'GURU' ? 'bg-blue-100 text-blue-700' : 
                            'bg-gray-100 text-gray-700'}`}>
                          {item.targetAudience}
                        </span>
                      </td>
                      <td>
                        {item.isActive ? (
                          <span className="text-green-600 text-sm font-medium">Aktif</span>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">Nonaktif</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Calendar size={12}/> Mulai: {new Date(item.publishDate).toLocaleDateString('id-ID')}</span>
                          {item.expireDate && (
                            <span className="flex items-center gap-1 text-red-500"><Calendar size={12}/> Akhir: {new Date(item.expireDate).toLocaleDateString('id-ID')}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Megaphone size={20} className="text-blue-600" />
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              
              <form id="announcement-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Judul Pengumuman *</label>
                  <input
                    type="text"
                    name="title"
                    className="input-field mt-1 w-full"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: Libur Hari Raya"
                  />
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Isi Pengumuman *</label>
                  <textarea
                    name="content"
                    className="input-field mt-1 w-full"
                    rows={5}
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    placeholder="Tulis pesan pengumuman secara detail di sini..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Users size={14}/> Target Audiens *
                    </label>
                    <select
                      name="targetAudience"
                      className="input-field mt-1 w-full"
                      value={formData.targetAudience}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="SEMUA">Semua (Siswa, Guru, Staf)</option>
                      <option value="SISWA">Hanya Siswa & Wali</option>
                      <option value="GURU">Hanya Guru & Wali Kelas</option>
                      <option value="STAFF">Hanya Staf TU / Admin</option>
                    </select>
                  </div>

                  <div className="form-group flex flex-col justify-center gap-2 mt-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isPinned"
                        checked={formData.isPinned}
                        onChange={handleInputChange}
                        className="rounded text-orange-500 focus:ring-orange-500"
                      />
                      <Pin size={16} className="text-orange-500"/>
                      Pin (Sematkan di Atas)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      Status Aktif (Tampilkan)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tanggal Mulai Tayang</label>
                    <input
                      type="date"
                      name="publishDate"
                      className="input-field mt-1 w-full"
                      value={formData.publishDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="text-sm font-medium text-gray-700">Tanggal Selesai (Opsional)</label>
                    <input
                      type="date"
                      name="expireDate"
                      className="input-field mt-1 w-full"
                      value={formData.expireDate}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">Biarkan kosong jika berlaku selamanya.</p>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="announcement-form"
                className="btn-primary"
              >
                {editingId ? 'Simpan Perubahan' : 'Sebarkan Pengumuman'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
