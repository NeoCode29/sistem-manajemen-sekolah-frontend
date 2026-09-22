import React, { useEffect, useState, useMemo } from 'react';
import { 
  getLetterTemplates, 
  createLetterTemplate, 
  updateLetterTemplate, 
  deleteLetterTemplate, 
  uploadTemplateAttachment,
  type LetterTemplate 
} from '../../api/letterService';
import { 
  getSchoolProfile, 
  updateSchoolProfile, 
  uploadSchoolLogo, 
  downloadTemplateDocx 
} from '../../api/schoolProfileService';
import { 
  FileCode, 
  Plus, 
  Download, 
  Settings, 
  FileText, 
  Filter, 
  Search, 
  RotateCcw,
  Building2,
  Loader2,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { ActionButtons } from '../../components/Common/ActionButtons';
import { Pagination } from '../../components/Common/Pagination';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ContextAccessHeader } from '../../components/ui/ContextAccessHeader';
import { generateLetterTemplateCode } from '../../utils/codeGenerator';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const LetterTemplates: React.FC = () => {
  const { user } = useAuth();
  const {
    canManageLetterTemplates,
    canCreateLetterTemplate,
    canUpdateLetterTemplate,
    canDeleteLetterTemplate,
    canUpdateSchoolProfile,
    hasPermission,
  } = usePermissions();

  const isManagementRole = user?.roles?.some((r) =>
    ['Super Admin', 'Admin Sekolah', 'Kepala Sekolah', 'Staf TU'].includes(r.name),
  );

  const canManageTemplates =
    canManageLetterTemplates ||
    isManagementRole ||
    hasPermission('letter_templates.manage') ||
    hasPermission('letters.manage') ||
    hasPermission('letters.write');

  const canCreate =
    canCreateLetterTemplate ||
    canManageTemplates ||
    hasPermission('letter_templates.create') ||
    hasPermission('letters.write');

  const canUpdate =
    canUpdateLetterTemplate ||
    canManageTemplates ||
    hasPermission('letter_templates.update') ||
    hasPermission('letters.write');

  const canDelete =
    canDeleteLetterTemplate ||
    canManageTemplates ||
    hasPermission('letter_templates.delete');

  const canUpdateProfile =
    canUpdateSchoolProfile ||
    isManagementRole ||
    hasPermission('school_profile.update') ||
    hasPermission('school_profile.manage') ||
    hasPermission('letters.write');

  const hasActions = canUpdate || canDelete;
  
  const [activeTab, setActiveTab] = useState<'KOP_SURAT' | 'TEMPLATE'>('KOP_SURAT');
  
  // Tab: KOP_SURAT
  const [profile, setProfile] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Tab: TEMPLATE
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    action: async () => {},
  });
  
  const [formData, setFormData] = useState<Partial<LetterTemplate>>({
    name: '',
    code: '',
    category: 'UMUM',
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'KOP_SURAT') {
        const data = await getSchoolProfile();
        setProfile(data);
      } else {
        const data = await getLetterTemplates();
        setTemplates(data);
      }
    } catch (err: any) {
      notify.error(err, 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // --- KOP_SURAT HANDLERS ---
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateProfile) {
      notify.error(null, 'Anda tidak memiliki izin untuk mengubah kop surat sekolah');
      return;
    }
    if (!profile) return;
    try {
      setProfileSaving(true);
      await updateSchoolProfile({
        code: profile.code || 'SCH001',
        headerText: profile.headerText,
      });

      if (logoFile) {
        await uploadSchoolLogo(logoFile);
      }
      
      notify.success('Pengaturan Kop Surat berhasil disimpan');
      fetchData();
      setLogoFile(null);
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan profil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const blob = await downloadTemplateDocx();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_surat_kosong.docx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      notify.success('Contoh template docx berhasil diunduh');
    } catch (error: any) {
      notify.error(error, 'Gagal mengunduh template docx');
    }
  };

  // --- TEMPLATE HANDLERS ---
  const openModal = (template?: LetterTemplate) => {
    if (template) {
      setFormData({
        name: template.name,
        code: template.code,
        category: template.category,
        isActive: template.isActive,
      });
      setEditingId(template.id);
    } else {
      setFormData({
        name: '',
        code: '',
        category: 'UMUM',
        isActive: true,
      });
      setEditingId(null);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !canUpdate) {
      notify.error(null, 'Anda tidak memiliki izin untuk mengubah template surat');
      return;
    }
    if (!editingId && !canCreate) {
      notify.error(null, 'Anda tidak memiliki izin untuk membuat template surat');
      return;
    }
    try {
      setIsSubmitting(true);
      let savedTemplate: any;
      if (editingId) {
        savedTemplate = await updateLetterTemplate(editingId, formData);
      } else {
        savedTemplate = await createLetterTemplate(formData);
      }

      if (selectedFile) {
        await uploadTemplateAttachment(savedTemplate.id, selectedFile);
      }
      
      notify.success(editingId ? 'Template surat berhasil diperbarui' : 'Template surat berhasil ditambahkan');
      closeModal();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan template surat');
      notify.error(err, 'Gagal menyimpan template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!canDelete) {
      notify.error(null, 'Anda tidak memiliki izin untuk menghapus template surat');
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'Hapus Template Surat',
      message: `Apakah Anda yakin ingin menghapus template surat "${name}"? Dokumen surat yang telah dicetak menggunakan template ini tidak akan terhapus.`,
      variant: 'danger',
      action: async () => {
        try {
          await deleteLetterTemplate(id);
          notify.success('Template surat berhasil dihapus');
          fetchData();
        } catch (err: any) {
          notify.error(err, 'Gagal menghapus template');
        }
      },
    });
  };

  // Filtered & Paginated templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.code.toLowerCase().includes(q);

      const matchesCategory =
        filterCategory === 'ALL' || template.category === filterCategory;

      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && template.isActive) ||
        (filterStatus === 'INACTIVE' && !template.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [templates, searchTerm, filterCategory, filterStatus]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const paginatedTemplates = useMemo(() => {
    return filteredTemplates.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredTemplates, currentPage, itemsPerPage]);

  const columns: Column<LetterTemplate>[] = [
    {
      key: 'name',
      header: 'Nama Template',
      render: (item) => (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
            <FileCode size={17} />
          </div>
          <div className="overflow-hidden">
            <span className="font-bold text-sm text-slate-900 truncate block" title={item.name}>
              {item.name}
            </span>
            <span className="text-xs font-mono text-indigo-700 bg-indigo-50/70 border border-indigo-200/60 px-2 py-0.5 rounded-md inline-block mt-1">
              {item.code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (item) => {
        const categoryVariants: Record<string, BadgeVariant> = {
          UMUM: 'default',
          PANGGILAN: 'warning',
          UNDANGAN: 'info',
          KETERANGAN: 'purple',
        };
        return (
          <Badge variant={categoryVariants[item.category] || 'default'} className="font-semibold">
            {item.category}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'default'}>
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'file',
      header: 'File Master',
      render: (item) =>
        item.attachmentUrl ? (
          <a
            href={`http://localhost:3000${item.attachmentUrl}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all border border-indigo-200"
          >
            <Download size={13} /> Unduh File
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 w-max inline-block">
            Belum ada berkas
          </span>
        ),
    },
    ...(hasActions
      ? [
          {
            key: 'actions',
            header: 'Aksi',
            render: (item: LetterTemplate) => (
              <div className="flex justify-end">
                <ActionButtons
                  onEdit={canUpdate ? () => openModal(item) : undefined}
                  onDelete={canDelete ? () => handleDelete(item.id, item.name) : undefined}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  const hasActiveFilters = searchTerm !== '' || filterCategory !== 'ALL' || filterStatus !== 'ALL';

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Template & Kop Surat"
        subtitle="Kelola standardisasi format kop surat resmi dan bank template dokumen sekolah"
      />

      {/* 2. Modern Tab Switcher */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-max border border-slate-200/60 shadow-inner">
        <button
          className={`px-5 py-2.5 text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'KOP_SURAT'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('KOP_SURAT')}
        >
          <Settings size={16} />
          <span>Pengaturan Kop Surat</span>
        </button>
        <button
          className={`px-5 py-2.5 text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'TEMPLATE'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('TEMPLATE')}
        >
          <FileText size={16} />
          <span>Bank File Template</span>
        </button>
      </div>

      {/* 3. ContextAccessHeader Adaptif */}
      {activeTab === 'KOP_SURAT' ? (
        <ContextAccessHeader
          icon={<Building2 size={20} />}
          title="Pengaturan Kop Surat Sekolah"
          subtitle="Konfigurasi logo instansi dan baris header teks kop resmi yang otomatis dicetak pada lembar surat keluar."
          actions={
            <button
              type="button"
              onClick={handleDownloadDocx}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 shadow-sm transition-all hover:shadow"
            >
              <Download size={14} />
              <span>Unduh Contoh Kop</span>
            </button>
          }
        />
      ) : (
        <ContextAccessHeader
          icon={<FileCode size={20} />}
          title="Bank File Template Surat"
          subtitle={`Kelola berkas master template surat format docx/pdf. Menampilkan ${filteredTemplates.length} dari ${templates.length} template terdaftar.`}
          actions={
            canCreate ? (
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:shadow"
              >
                <Plus size={16} />
                <span>Upload Template Baru</span>
              </button>
            ) : undefined
          }
        />
      )}

      {/* 4. Tab Content Area */}
      {activeTab === 'KOP_SURAT' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
              <span>Memuat profil sekolah...</span>
            </div>
          ) : profile ? (
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField label="Logo Sekolah Resmi" hint="Format yang didukung: PNG atau JPG transparan (disarankan maks. 2MB).">
                  <div className="flex items-center gap-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
                    {/* Preview Logo */}
                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-200/80 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Pratinjau Baru" className="max-w-full max-h-full object-contain" />
                      ) : profile.logoUrl ? (
                        <img src={`http://localhost:3000${profile.logoUrl}`} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Building2 size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer w-full text-slate-600"
                        disabled={!canUpdateProfile}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {logoFile ? `File terpilih: ${logoFile.name}` : profile.logoUrl ? 'Logo saat ini aktif' : 'Belum ada logo terunggah'}
                      </p>
                    </div>
                  </div>
                </FormField>
              </div>

              <FormField 
                label="Teks Header Kop Surat" 
                hint="Teks ini otomatis dicetak rata tengah (center) pada bagian kop surat. Gunakan baris baru (enter) untuk memisahkan setiap tingkatan instansi."
              >
                <textarea
                  name="headerText"
                  value={profile.headerText || ''}
                  onChange={handleProfileChange}
                  disabled={!canUpdateProfile}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 min-h-[150px] resize-none font-medium leading-relaxed"
                  placeholder={"PEMERINTAH DAERAH PROVINSI JAWA BARAT\nDINAS PENDIDIKAN\nSMK NEGERI CONTOH\nJl. Pendidikan No. 123, Telp. (022) 123456"}
                />
              </FormField>

              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                {canUpdateProfile && (
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-xs md:text-sm flex items-center justify-center gap-2 w-full sm:w-auto" 
                    disabled={profileSaving}
                  >
                    {profileSaving && <Loader2 className="animate-spin" size={16} />}
                    <span>{profileSaving ? 'Menyimpan Perubahan...' : 'Simpan Pengaturan Kop'}</span>
                  </button>
                )}
                <button 
                  type="button" 
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm w-full sm:w-auto" 
                  onClick={handleDownloadDocx}
                >
                  <Download size={16} /> 
                  <span>Unduh Format Template Docx</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-slate-500">Gagal memuat informasi profil sekolah.</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar Standar (Hardware Logs & Glassmorphism Pattern) */}
          <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Pencarian Template
                </label>
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={17} />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama atau kode template..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="w-full md:w-56 min-w-[170px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Kategori
                </label>
                <div className="relative group">
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={17} />
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="UMUM">UMUM</option>
                    <option value="PANGGILAN">PANGGILAN</option>
                    <option value="UNDANGAN">UNDANGAN</option>
                    <option value="KETERANGAN">KETERANGAN</option>
                  </select>
                </div>
              </div>

              <div className="w-full md:w-48 min-w-[160px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Status
                </label>
                <div className="relative group">
                  <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={17} />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif Saja</option>
                    <option value="INACTIVE">Nonaktif Saja</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('ALL');
                    setFilterStatus('ALL');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm self-stretch md:self-end cursor-pointer shrink-0"
                  title="Reset seluruh filter"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* DataTable Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <DataTable 
              columns={columns}
              data={paginatedTemplates}
              loading={loading}
              emptyMessage={
                hasActiveFilters 
                  ? "Tidak ada template surat yang cocok dengan filter yang dipilih." 
                  : "Belum ada template surat yang terdaftar."
              }
            />

            {/* Pagination Component */}
            {!loading && filteredTemplates.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTemplates.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal Form Template Surat */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Template Surat' : 'Upload Template Baru'}
        size="lg"
      >
        <div className="p-6">
          <form id="template-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-medium">
                {error}
              </div>
            )}
            
            <FormField label="Nama Template" required>
              <input
                type="text"
                name="name"
                className="input-std w-full px-4 py-2.5 text-sm font-bold text-slate-900"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Misal: Surat Keterangan Aktif Belajar"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Kategori" required>
                <select
                  name="category"
                  className="input-std w-full px-4 py-2.5 text-sm font-medium text-slate-900"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="UMUM">UMUM</option>
                  <option value="PANGGILAN">PANGGILAN</option>
                  <option value="UNDANGAN">UNDANGAN</option>
                  <option value="KETERANGAN">KETERANGAN</option>
                </select>
              </FormField>

              <FormField label="Kode Unik" required>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="code"
                    className="input-std flex-1 min-w-0 px-4 py-2.5 text-sm uppercase font-mono font-semibold"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="Misal: SK-AKTIF-01"
                  />
                  <button
                    type="button"
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap shrink-0"
                    onClick={() => setFormData(prev => ({ ...prev, code: generateLetterTemplateCode(prev.category, prev.name) }))}
                    title="Buat kode acak otomatis"
                  >
                    Buat Otomatis
                  </button>
                </div>
              </FormField>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/70">
              <FormField 
                label="Berkas Master Template (.docx / .pdf)" 
                hint="Unggah file surat master yang sudah memiliki format standar layout dokumen." 
                required={!editingId}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-xs mt-2 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-colors w-full bg-white p-1.5 rounded-xl border border-slate-200"
                  required={!editingId}
                />
              </FormField>
            </div>

            <div>
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors w-full ${
                formData.isActive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm font-semibold ${formData.isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                    Template Aktif (Dapat dipilih saat pembuatan surat keluar)
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
              <button 
                type="button" 
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs md:text-sm" 
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-xs md:text-sm flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                <span>{editingId ? 'Simpan Perubahan' : 'Simpan Template'}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 5. Modern ConfirmDialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};
