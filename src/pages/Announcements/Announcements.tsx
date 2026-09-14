import React, { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/announcementService';
import type { Announcement } from '../../api/announcementService';
import { Megaphone, Plus, Edit2, Trash2, Pin, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { usePermissions } from '../../hooks/usePermissions';

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('announcements.create') || hasPermission('announcements.write');
  const canUpdate = hasPermission('announcements.update') || hasPermission('announcements.write');
  const canDelete = hasPermission('announcements.delete') || hasPermission('announcements.write');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showAlert } = useDialog();
  
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
        await createAnnouncement({ ...payload, createdById: user?.employeeId?.toString() || '1' });
      }
      
      closeModal();
      fetchAnnouncements();
    } catch (err: any) {
      console.error("Save error:", err);
      let errMsg = 'Gagal menyimpan pengumuman';
      if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errMsg = err.response.data.message.join('\n');
        } else {
          errMsg = err.response.data.message;
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Yakin ingin menghapus pengumuman ini?', async () => {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements();
      } catch (err: any) {
        showAlert(err.response?.data?.message || 'Gagal menghapus pengumuman', 'Gagal');
      }
    });
  };

  const columns: Column<Announcement>[] = [
    { key: 'announcement', header: 'Pengumuman', render: (item) => (
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl flex-shrink-0 ${item.isPinned ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
          <Megaphone size={18} />
        </div>
        <div>
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            {item.title}
            {item.isPinned && <Pin size={12} className="text-orange-500 fill-orange-500" />}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[300px]">{item.content}</p>
        </div>
      </div>
    )},
    { key: 'target', header: 'Target', render: (item) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        item.targetAudience === 'SEMUA' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
        item.targetAudience === 'SISWA' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
        item.targetAudience === 'GURU' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
        'bg-gray-100 text-gray-700 border border-gray-200'
      }`}>
        {item.targetAudience}
      </span>
    )},
    { key: 'status', header: 'Status', render: (item) => (
      <Badge variant={item.isActive ? 'success' : 'default'}>
        {item.isActive ? 'Aktif' : 'Nonaktif'}
      </Badge>
    )},
    { key: 'date', header: 'Tanggal Tayang', render: (item) => (
      <div className="flex flex-col text-xs font-medium text-gray-600 gap-1">
        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100 w-max"><Calendar size={12} className="text-gray-400"/> Mulai: {new Date(item.publishDate).toLocaleDateString('id-ID')}</span>
        {item.expireDate && (
          <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 w-max"><Calendar size={12}/> Akhir: {new Date(item.expireDate).toLocaleDateString('id-ID')}</span>
        )}
      </div>
    )},
    ...(canUpdate || canDelete ? [{
      key: 'actions',
      header: 'Aksi',
      render: (item: Announcement) => (
        <div className="flex gap-2 justify-end">
          {canUpdate && (
            <button
              onClick={() => openModal(item)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Papan Pengumuman" 
          subtitle="Kelola pengumuman untuk siswa, guru, dan staf"
        />
        {canCreate && (
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Buat Pengumuman</span>
          </button>
        )}
      </div>

      <DataTable 
        columns={columns}
        data={announcements}
        loading={loading}
        emptyMessage="Belum ada pengumuman. Klik 'Buat Pengumuman' untuk menambahkan."
      />

      {/* Modal Form */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
        size="lg"
      >
        <div className="p-6">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 whitespace-pre-wrap font-medium">{error}</div>}
          
          <form id="announcement-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FormField label="Judul Pengumuman" required>
              <input
                type="text"
                name="title"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-900"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Contoh: Libur Hari Raya"
              />
            </FormField>

            <FormField label="Isi Pengumuman" required>
              <textarea
                name="content"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900"
                rows={5}
                value={formData.content}
                onChange={handleInputChange}
                required
                placeholder="Tulis pesan pengumuman secara detail di sini..."
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Target Audiens" required>
                <div className="relative group">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                  <select
                    name="targetAudience"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium cursor-pointer"
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
              </FormField>

              <div className="flex flex-col gap-2 pt-1">
                <label className="text-sm font-semibold text-gray-700">Pengaturan Tambahan</label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${formData.isPinned ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <Pin size={16} className={formData.isPinned ? 'text-orange-500' : 'text-gray-400'}/>
                    <span className={`text-sm font-medium ${formData.isPinned ? 'text-orange-900' : 'text-gray-700'}`}>Sematkan (Pin) di Atas</span>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${formData.isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm font-medium ${formData.isActive ? 'text-emerald-900' : 'text-gray-700'}`}>Status Aktif</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <FormField label="Tanggal Mulai Tayang">
                <input
                  type="date"
                  name="publishDate"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  value={formData.publishDate}
                  onChange={handleInputChange}
                />
              </FormField>
              
              <FormField label="Tanggal Selesai (Opsional)" hint="Biarkan kosong jika berlaku selamanya.">
                <input
                  type="date"
                  name="expireDate"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  value={formData.expireDate}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
              >
                {editingId ? 'Simpan Perubahan' : 'Sebarkan Pengumuman'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
