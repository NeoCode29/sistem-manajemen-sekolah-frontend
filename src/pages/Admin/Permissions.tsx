import React, { useEffect, useState, useMemo } from 'react';
import { getPermissions, createPermission, type Permission } from '../../api/rbacService';
import { Plus, Shield, Loader2, Search, Filter, RotateCcw } from 'lucide-react';
import { PageHeader, Modal, FormField, Badge } from '../../components/ui';
import { DataTable, type Column } from '../../components/Common/DataTable';
import { Pagination } from '../../components/Common/Pagination';
import { PERMISSION_GROUPS } from '../../constants/permissionsCatalog';
import { notify } from '../../utils/feedback';

export const Permissions: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Search, Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Form State
  const [name, setName] = useState('');
  const [guardName, setGuardName] = useState('jwt');

  // Build catalog mapping for label & group
  const permCatalogMap = useMemo(() => {
    const map = new Map<string, { label: string; groupName: string; description: string }>();
    PERMISSION_GROUPS.forEach(group => {
      group.permissions.forEach(p => {
        map.set(p.name, {
          label: p.label,
          groupName: group.name,
          description: p.description
        });
      });
    });
    return map;
  }, []);

  const moduleOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Modul' },
      ...PERMISSION_GROUPS.map(g => ({ value: g.name, label: g.name }))
    ];
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      notify.error(error, 'Gagal memuat data hak akses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createPermission({ name, guardName });
      notify.success(`Hak akses "${name}" berhasil ditambahkan!`);
      setShowModal(false);
      setName('');
      setGuardName('jwt');
      fetchPermissions();
    } catch (error: any) {
      notify.error(error, 'Gagal membuat hak akses baru');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Permissions computation
  const filteredPermissions = useMemo(() => {
    return permissions.filter(perm => {
      const meta = permCatalogMap.get(perm.name);
      const groupName = meta?.groupName || 'Lainnya';
      const label = meta?.label || '';
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        perm.name.toLowerCase().includes(q) ||
        perm.guardName.toLowerCase().includes(q) ||
        label.toLowerCase().includes(q) ||
        String(perm.id).includes(q);

      const matchesModule = !moduleFilter || groupName === moduleFilter;

      return matchesSearch && matchesModule;
    });
  }, [permissions, searchQuery, moduleFilter, permCatalogMap]);

  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const currentPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPermissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermissions, currentPage, itemsPerPage]);

  const hasActiveFilter = Boolean(searchQuery || moduleFilter);

  const columns: Column<Permission>[] = [
    { 
      key: 'id', 
      header: 'ID', 
      render: (perm) => (
        <span className="font-mono text-xs font-semibold text-gray-500">#{perm.id}</span>
      )
    },
    { 
      key: 'name', 
      header: 'Nama Hak Akses (Permission)', 
      render: (perm) => {
        const meta = permCatalogMap.get(perm.name);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
              <Shield size={16} />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-xs font-bold text-slate-900 block truncate" title={perm.name}>
                {perm.name}
              </span>
              {meta?.label && (
                <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={meta.description}>
                  {meta.label}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'module',
      header: 'Modul / Kategori',
      render: (perm) => {
        const meta = permCatalogMap.get(perm.name);
        return (
          <Badge variant="info">
            {meta?.groupName || 'Sistem Umum'}
          </Badge>
        );
      }
    },
    { 
      key: 'guardName', 
      header: 'Guard Name', 
      render: (perm) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-medium">
          {perm.guardName}
        </span>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 page-enter">
      {/* 1. Page Header */}
      <PageHeader 
        title="Hak Akses (Permissions)" 
        subtitle="Kelola daftar wewenang hak akses sistem secara terperinci (RBAC)"
        action={
          <button 
            type="button"
            className="btn-std-primary flex items-center gap-2" 
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} /> Tambah Hak Akses
          </button>
        }
      />

      {/* 2. Filter Bar (Glassmorphism Standard - No Header, Icon Group Focus) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Pencarian Hak Akses</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium" 
                placeholder="Cari nama izin, label, atau guard (mis: students.read, academic)..." 
                value={searchQuery} 
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }} 
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Modul / Kategori</label>
            <div className="relative group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" size={17} />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {moduleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setModuleFilter('');
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

      {/* 3. Table Card Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Daftar Hak Akses Sistem</h3>
            <p className="text-xs text-slate-500 mt-0.5">Katalog wewenang permission granular untuk pembatasan wewenang pengguna (RBAC)</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total <span className="font-bold text-slate-800">{filteredPermissions.length}</span> Izin Terdaftar
          </div>
        </div>

        <DataTable 
          columns={columns}
          data={currentPermissions}
          loading={loading}
          emptyMessage={
            hasActiveFilter
              ? 'Tidak ada hak akses yang cocok dengan kriteria pencarian.'
              : 'Belum ada data hak akses.'
          }
          hasPagination={filteredPermissions.length > 0}
        />

        {/* 4. Pagination */}
        {!loading && filteredPermissions.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPermissions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              hasNextPage={currentPage < totalPages}
              onItemsPerPageChange={() => {}}
            />
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Hak Akses Baru"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <FormField label="Nama Hak Akses (Permission)" hint="Gunakan format dot-notation: modul.aksi" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: academic.read, students.create" 
              required 
            />
          </FormField>
          
          <FormField label="Guard Name" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={guardName} 
              onChange={(e) => setGuardName(e.target.value)} 
              placeholder="jwt" 
              required 
            />
          </FormField>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" 
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
