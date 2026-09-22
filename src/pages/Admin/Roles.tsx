import React, { useEffect, useState, useMemo } from 'react';
import { 
  getRoles, 
  createRole, 
  updateRole,
  deleteRole, 
  assignPermissionsToRole, 
  getPermissions, 
  type Role, 
  type Permission 
} from '../../api/rbacService';
import { 
  Plus, 
  UserCheck, 
  Shield, 
  Trash2, 
  Edit2,
  Search, 
  Check, 
  CheckSquare, 
  Square, 
  Save,
  GraduationCap,
  Calendar,
  Briefcase,
  Users,
  Clock,
  Cpu,
  Award,
  Mail,
  Sliders,
  RotateCcw,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { PageHeader, Modal, FormField, ConfirmDialog, type ConfirmVariant } from '../../components/ui';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSION_GROUPS, type PermissionGroup } from '../../constants/permissionsCatalog';
import { notify } from '../../utils/feedback';

const SYSTEM_ROLES = [
  'Super Admin',
  'Admin Sekolah',
  'Kepala Sekolah',
  'Guru / Wali Kelas',
  'Siswa',
  'Orang Tua / Wali'
];

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { canManageRbac } = usePermissions();

  // Selected Role & Permissions State (IDs normalized as strings)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [originalPermIds, setOriginalPermIds] = useState<string[]>([]);

  // Accordion: Set of group IDs yang sedang di-collapse
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // Filtering & Search State
  const [roleSearch, setRoleSearch] = useState('');
  const [permSearch, setPermSearch] = useState('');

  // Create Role Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [guardName, setGuardName] = useState('jwt');
  const [maxUsers, setMaxUsers] = useState<string>('');

  // Edit Role Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [editGuardName, setEditGuardName] = useState('jwt');
  const [editMaxUsers, setEditMaxUsers] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ConfirmDialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    variant: ConfirmVariant;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    variant: 'danger',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    onConfirm: () => {},
  });

  // Map of permission name to permission object (with id from backend)
  const permNameToObject = useMemo(() => {
    const map = new Map<string, Permission>();
    allPermissions.forEach(p => map.set(p.name, p));
    return map;
  }, [allPermissions]);

  // Dynamic group for permissions not in static catalog (e.g. custom or legacy)
  const allGroups: PermissionGroup[] = useMemo(() => {
    const knownNames = new Set<string>();
    PERMISSION_GROUPS.forEach(g => g.permissions.forEach(p => knownNames.add(p.name)));
    const unmapped = allPermissions.filter(p => !knownNames.has(p.name));

    if (unmapped.length === 0) return PERMISSION_GROUPS;

    const extraGroup: PermissionGroup = {
      id: 'custom_general',
      name: 'Hak Akses Kustom & Sistem Lainnya',
      icon: 'Sliders',
      description: 'Hak akses tambahan atau kustom yang terdaftar di database sistem',
      permissions: unmapped.map(p => ({
        name: p.name,
        label: p.name,
        resource: 'Umum',
        domain: 'Sistem',
        description: `Wewenang sistem: ${p.name} (Guard: ${p.guardName})`
      }))
    };

    return [...PERMISSION_GROUPS, extraGroup];
  }, [allPermissions]);

  const fetchData = async (overrideRoleId?: string) => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getPermissions()
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);

      // Auto-select target role or first role
      if (rolesData.length > 0) {
        const activeId = overrideRoleId !== undefined ? overrideRoleId : selectedRoleId;
        const targetRole = activeId 
          ? rolesData.find(r => String(r.id) === String(activeId)) || rolesData[0]
          : rolesData[0];
        
        setSelectedRoleId(String(targetRole.id));
        const permIds = (targetRole.permissions || []).map(p => String(p.id));
        setSelectedPermIds(permIds);
        setOriginalPermIds(permIds);
      }
    } catch (error) {
      console.error('Failed to fetch roles data:', error);
      notify.error(error, 'Gagal memuat data peran & hak akses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedRole = useMemo(() => {
    return roles.find(r => String(r.id) === String(selectedRoleId)) || null;
  }, [roles, selectedRoleId]);

  const isSuperAdmin = selectedRole?.name === 'Super Admin';

  // Check if current permissions have unsaved changes
  const isDirty = useMemo(() => {
    if (isSuperAdmin) return false;
    if (selectedPermIds.length !== originalPermIds.length) return true;
    const originalSet = new Set(originalPermIds);
    return selectedPermIds.some(id => !originalSet.has(id));
  }, [selectedPermIds, originalPermIds, isSuperAdmin]);

  const doSelectRole = (role: Role) => {
    setSelectedRoleId(String(role.id));
    const permIds = (role.permissions || []).map(p => String(p.id));
    setSelectedPermIds(permIds);
    setOriginalPermIds(permIds);
  };

  // Handle Role Selection (with unsaved changes check)
  const handleSelectRole = (role: Role) => {
    if (String(role.id) === String(selectedRoleId)) return;

    if (isDirty) {
      setConfirmConfig({
        variant: 'warning',
        title: 'Perubahan Belum Disimpan',
        message: `Ada perubahan hak akses pada peran "${selectedRole?.name}" yang belum disimpan. Tetap ingin berpindah ke peran "${role.name}" tanpa menyimpan?`,
        confirmText: 'Ya, Tinggalkan Perubahan',
        onConfirm: () => {
          doSelectRole(role);
          setConfirmOpen(false);
        }
      });
      setConfirmOpen(true);
    } else {
      doSelectRole(role);
    }
  };

  // Toggle Single Permission
  const togglePermission = (permId: string) => {
    if (isSuperAdmin) return;
    setSelectedPermIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  // Toggle All in a specific Group
  const toggleGroup = (group: PermissionGroup) => {
    if (isSuperAdmin) return;

    const groupPermIds = group.permissions
      .map(p => {
        const obj = permNameToObject.get(p.name);
        return obj ? String(obj.id) : null;
      })
      .filter((id): id is string => id !== null);

    const allSelected = groupPermIds.length > 0 && groupPermIds.every(id => selectedPermIds.includes(id));

    if (allSelected) {
      // Deselect all in group
      setSelectedPermIds(prev => prev.filter(id => !groupPermIds.includes(id)));
    } else {
      // Select all in group
      setSelectedPermIds(prev => Array.from(new Set([...prev, ...groupPermIds])));
    }
  };

  // Global Select All / Clear All
  const handleSelectAll = () => {
    if (isSuperAdmin) return;
    setSelectedPermIds(allPermissions.map(p => String(p.id)));
  };

  const handleDeselectAll = () => {
    if (isSuperAdmin) return;
    setSelectedPermIds([]);
  };

  // Reset to original
  const handleReset = () => {
    setSelectedPermIds([...originalPermIds]);
  };

  // Save Permissions for selected role
  const handleSavePermissions = async () => {
    if (!selectedRole || isSuperAdmin) return;
    try {
      setSaving(true);
      await assignPermissionsToRole(selectedRole.id, selectedPermIds);
      setOriginalPermIds([...selectedPermIds]);
      
      // Update local state in roles list
      setRoles(prev => prev.map(r => {
        if (String(r.id) === String(selectedRole.id)) {
          const updatedPerms = allPermissions.filter(p => selectedPermIds.includes(String(p.id)));
          return { ...r, permissions: updatedPerms };
        }
        return r;
      }));

      notify.success(`Hak akses untuk "${selectedRole.name}" berhasil disimpan!`);
    } catch (error: any) {
      notify.error(error, 'Gagal menyimpan hak akses peran');
    } finally {
      setSaving(false);
    }
  };

  // Create Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      const parsedMaxUsers = maxUsers.trim() ? parseInt(maxUsers, 10) : null;
      const newRole = await createRole({
        name: name.trim(),
        guardName: guardName.trim(),
        maxUsers: parsedMaxUsers,
      });
      setShowCreateModal(false);
      setName('');
      setGuardName('jwt');
      setMaxUsers('');
      setSelectedRoleId(String(newRole.id));
      setSelectedPermIds([]);
      setOriginalPermIds([]);
      await fetchData(String(newRole.id));
      notify.success(`Peran baru "${newRole.name}" berhasil ditambahkan!`);
    } catch (error: any) {
      notify.error(error, 'Gagal membuat peran baru');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRole(role);
    setEditName(role.name);
    setEditGuardName(role.guardName || 'jwt');
    setEditMaxUsers(role.maxUsers !== null && role.maxUsers !== undefined ? String(role.maxUsers) : '');
    setShowEditModal(true);
  };

  // Submit Edit Role
  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      setEditSubmitting(true);
      const parsedMaxUsers = editMaxUsers.trim() ? parseInt(editMaxUsers, 10) : null;
      await updateRole(editingRole.id, {
        name: editName.trim(),
        guardName: editGuardName.trim(),
        maxUsers: parsedMaxUsers,
      });
      notify.success(`Peran "${editName}" berhasil diperbarui!`);
      setShowEditModal(false);
      setEditingRole(null);
      await fetchData();
    } catch (error: any) {
      notify.error(error, 'Gagal memperbarui peran');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Role
  const handleDeleteRole = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmConfig({
      variant: 'danger',
      title: `Hapus Peran "${role.name}"`,
      message: `Apakah Anda yakin ingin menghapus peran "${role.name}"? Jika peran ini masih terhubung dengan pengguna, sistem akan mencegah penghapusan demi keamanan.`,
      confirmText: 'Ya, Hapus Peran',
      onConfirm: async () => {
        try {
          await deleteRole(role.id);
          notify.success(`Peran "${role.name}" berhasil dihapus!`);
          await fetchData();
          setConfirmOpen(false);
        } catch (error: any) {
          notify.error(error, 'Gagal menghapus peran');
        }
      }
    });
    setConfirmOpen(true);
  };

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    return roles.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase()));
  }, [roles, roleSearch]);

  // Group Icons Map
  const renderGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap size={18} className="text-indigo-600" />;
      case 'Calendar': return <Calendar size={18} className="text-blue-600" />;
      case 'Briefcase': return <Briefcase size={18} className="text-emerald-600" />;
      case 'Users': return <Users size={18} className="text-amber-600" />;
      case 'Clock': return <Clock size={18} className="text-purple-600" />;
      case 'Cpu': return <Cpu size={18} className="text-cyan-600" />;
      case 'Award': return <Award size={18} className="text-rose-600" />;
      case 'Mail': return <Mail size={18} className="text-teal-600" />;
      case 'Shield': return <Shield size={18} className="text-slate-600" />;
      default: return <Sliders size={18} className="text-indigo-600" />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <PageHeader 
        title="Peran & Hak Akses (Roles & Permissions)" 
        subtitle="Atur daftar peran dan konfigurasi wewenang granular per submodul"
        action={
          canManageRbac ? (
            <button 
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-std-primary flex items-center gap-2"
            >
              <Plus size={18} /> Tambah Peran Baru
            </button>
          ) : undefined
        }
      />

      {/* 2. 2-Panel Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL KIRI: DAFTAR ROLE */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <UserCheck size={16} className="text-indigo-600" />
                Daftar Peran ({filteredRoles.length})
              </h3>
            </div>
            {/* Role Search */}
            <div className="relative group">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
              <input 
                type="text" 
                placeholder="Cari peran..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Memuat data peran...</div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">Tidak ada peran ditemukan.</div>
            ) : (
              filteredRoles.map((role) => {
                const isSelected = String(role.id) === String(selectedRoleId);
                const isSystem = SYSTEM_ROLES.includes(role.name);
                const permCount = role.name === 'Super Admin' 
                  ? allPermissions.length 
                  : (role.permissions?.length || 0);

                return (
                  <div
                    key={String(role.id)}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 text-indigo-950 font-medium' 
                        : 'hover:bg-gray-50/80 text-gray-700 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-gray-900 flex items-center gap-1.5">
                          {role.name}
                          {isSystem && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                              System
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{permCount} Hak Akses</span>
                          <span>•</span>
                          {role.maxUsers ? (
                            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                              (role.userCount ?? 0) >= role.maxUsers
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              Kuota: {role.userCount ?? 0}/{role.maxUsers}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">Tanpa Batas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-1"></span>
                      )}
                      {canManageRbac && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditRole(role, e)}
                            title={isSystem ? "Atur Kuota Peran" : "Edit Nama / Kuota Peran"}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!isSystem && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRole(role, e)}
                              title="Hapus Peran"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL KANAN: DETAIL HAK AKSES ROLE */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedRole ? (
            <>
              {/* Sticky Top Header Panel Kanan */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sticky top-4 z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">
                        Hak Akses: <span className="text-indigo-600">{selectedRole.name}</span>
                      </h2>
                      {isDirty && (
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200 animate-pulse">
                          Belum Disimpan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isSuperAdmin 
                        ? 'Super Admin otomatis memiliki wewenang penuh tanpa batas ke semua modul.'
                        : `Diberikan ${selectedPermIds.length} dari ${allPermissions.length} total hak akses sistem.`}
                    </p>
                  </div>

                  {/* Save Button */}
                  {!isSuperAdmin && canManageRbac && (
                    <div className="flex items-center gap-2">
                      {isDirty && (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                          title="Batalkan perubahan"
                        >
                          <RotateCcw size={14} /> Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSavePermissions}
                        disabled={saving || !isDirty}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                          isDirty
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save size={14} /> Simpan Perubahan
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter & Batch Actions */}
                {!isSuperAdmin && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <div className="relative flex-1 group">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Filter hak akses (misal: 'siswa', 'academic', 'kelas')..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
                      />
                    </div>
                    {canManageRbac && (
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <button 
                          type="button"
                          onClick={handleSelectAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                        >
                          <CheckSquare size={13} className="text-indigo-600" /> Centang Semua
                        </button>
                        <button 
                          type="button"
                          onClick={handleDeselectAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                        >
                          <Square size={13} className="text-gray-400" /> Hapus Semua
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Super Admin Notice Banner */}
              {isSuperAdmin && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-indigo-900">
                  <Shield size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-indigo-950">Akses Penuh Otomatis (Full Access Bypass)</p>
                    <p className="text-indigo-800 mt-1 leading-relaxed">
                      Role <strong>Super Admin</strong> dilindungi oleh sistem keamanan. Semua hak akses otomatis aktif secara permanen dan tidak dapat diubah guna mencegah terkuncinya hak akses administrator sekolah.
                    </p>
                  </div>
                </div>
              )}

              {/* Group Cards Container */}
              <div className="flex flex-col gap-4">
                {allGroups.map((group) => {
                  // Filter permissions inside this group
                  const filteredGroupPerms = group.permissions.filter(p => {
                    if (!permSearch.trim()) return true;
                    const q = permSearch.toLowerCase();
                    return (
                      p.label.toLowerCase().includes(q) ||
                      p.name.toLowerCase().includes(q) ||
                      p.resource.toLowerCase().includes(q) ||
                      p.description.toLowerCase().includes(q)
                    );
                  });

                  if (filteredGroupPerms.length === 0) return null;

                  // Calculate group active count
                  const groupPermIds = group.permissions
                    .map(p => {
                      const obj = permNameToObject.get(p.name);
                      return obj ? String(obj.id) : null;
                    })
                    .filter((id): id is string => id !== null);

                  const activeInGroup = isSuperAdmin 
                    ? group.permissions.length 
                    : groupPermIds.filter(id => selectedPermIds.includes(id)).length;

                  const allGroupSelected = isSuperAdmin || (
                    groupPermIds.length > 0 && groupPermIds.every(id => selectedPermIds.includes(id))
                  );

                  return (
                    <div key={group.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-gray-50/70 border-b border-gray-100 flex items-center">
                        {/* Klik area kiri untuk toggle collapse */}
                        <div
                          onClick={() => toggleGroupCollapse(group.id)}
                          className="flex-1 flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-gray-100/70 transition-colors min-w-0"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center shrink-0">
                            {renderGroupIcon(group.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900">{group.name}</h3>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                activeInGroup > 0 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                                {activeInGroup} / {group.permissions.length} Aktif
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{group.description}</p>
                          </div>
                        </div>
                        {/* Area tombol — lebar tetap agar chevron selalu rata */}
                        <div className="w-32 shrink-0 flex items-center justify-end pr-3 select-auto">
                          {!isSuperAdmin && canManageRbac && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors text-gray-600 cursor-pointer select-auto"
                            >
                              {allGroupSelected ? (
                                <><Check size={12} className="text-indigo-600" /> Batal Pilih</>
                              ) : (
                                <><Plus size={12} /> Pilih Semua</>
                              )}
                            </button>
                          )}
                        </div>
                        {/* Chevron — selalu di posisi sama (paling kanan, lebar tetap) */}
                        <div
                          onClick={() => toggleGroupCollapse(group.id)}
                          className="w-10 shrink-0 flex items-center justify-center self-stretch cursor-pointer hover:bg-gray-100/70 transition-colors border-l border-gray-100"
                        >
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${
                              collapsedGroups.has(group.id) ? '' : 'rotate-180'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Group Permissions Checkbox Grid — tersembunyi jika collapsed */}
                      {!collapsedGroups.has(group.id) && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {filteredGroupPerms.map((perm) => {
                            const permObj = permNameToObject.get(perm.name);
                            const permId = permObj ? String(permObj.id) : null;
                            const isChecked = isSuperAdmin || (permId ? selectedPermIds.includes(permId) : false);

                            return (
                              <label
                                key={perm.name}
                                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                } ${isSuperAdmin ? 'cursor-default opacity-85' : ''}`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  disabled={isSuperAdmin || !canManageRbac || !permId}
                                  onChange={() => permId && togglePermission(permId)}
                                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-gray-900 flex items-center justify-between">
                                    <span>{perm.label}</span>
                                  </div>
                                  <div className="text-[11px] font-mono text-gray-400 mt-0.5 truncate" title={perm.name}>
                                    {perm.name}
                                  </div>
                                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                                    {perm.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
              <Shield size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Pilih salah satu peran di panel kiri untuk mengatur hak akses.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Tambah Peran Baru */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Peran Baru"
      >
        <form onSubmit={handleCreateRole} className="flex flex-col gap-5 p-6">
          <FormField label="Nama Peran" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Waka Kurikulum" 
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

          <FormField label="Batas Kuota Pemakai (Max Users)" hint="Kosongkan jika tidak ada batas kuota pengguna yang dapat memakai peran ini. Contoh: 1 untuk Kepala Sekolah">
            <input 
              type="number" 
              min="1"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={maxUsers} 
              onChange={(e) => setMaxUsers(e.target.value)} 
              placeholder="Tanpa batas (unlimited)" 
            />
          </FormField>
          
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer" 
              onClick={() => setShowCreateModal(false)}
              disabled={createSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={createSubmitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {createSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Peran'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Peran */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingRole && SYSTEM_ROLES.includes(editingRole.name) ? `Atur Batas Kuota - ${editingRole.name}` : 'Edit Peran'}
      >
        <form onSubmit={handleEditRoleSubmit} className="flex flex-col gap-5 p-6">
          <FormField label="Nama Peran" required hint={editingRole && SYSTEM_ROLES.includes(editingRole.name) ? "Nama peran bawaan sistem dilindungi dari perubahan nama" : undefined}>
            <input 
              type="text" 
              disabled={editingRole ? SYSTEM_ROLES.includes(editingRole.name) : false}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              placeholder="Contoh: Waka Kurikulum" 
              required 
            />
          </FormField>
          
          <FormField label="Guard Name" required>
            <input 
              type="text" 
              disabled={editingRole ? SYSTEM_ROLES.includes(editingRole.name) : false}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed" 
              value={editGuardName} 
              onChange={(e) => setEditGuardName(e.target.value)} 
              placeholder="jwt" 
              required 
            />
          </FormField>

          <FormField label="Batas Kuota Pemakai (Max Users)" hint="Tentukan batas maksimal user yang boleh memiliki role ini. Kosongkan untuk tanpa batas.">
            <input 
              type="number" 
              min="1"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800" 
              value={editMaxUsers} 
              onChange={(e) => setEditMaxUsers(e.target.value)} 
              placeholder="Tanpa batas (unlimited)" 
            />
          </FormField>
          
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer" 
              onClick={() => setShowEditModal(false)}
              disabled={editSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={editSubmitting}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {editSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Standard ConfirmDialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant={confirmConfig.variant}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
