import React, { useEffect, useState, useMemo } from 'react';
import { 
  getRoles, 
  createRole, 
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
  Search, 
  Check, 
  CheckSquare, 
  Square, 
  AlertCircle, 
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
  RotateCcw
} from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSION_GROUPS, type PermissionGroup } from '../../constants/permissionsCatalog';

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
  const { showConfirm, showAlert } = useDialog();

  // Selected Role & Permissions State
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [originalPermIds, setOriginalPermIds] = useState<number[]>([]);

  // Filtering & Search State
  const [roleSearch, setRoleSearch] = useState('');
  const [permSearch, setPermSearch] = useState('');

  // Create Role Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [guardName, setGuardName] = useState('jwt');

  // Map of permission name to permission object (with id from backend)
  const permNameToObject = useMemo(() => {
    const map = new Map<string, Permission>();
    allPermissions.forEach(p => map.set(p.name, p));
    return map;
  }, [allPermissions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getPermissions()
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);

      // Auto-select first role if none selected or selected not in list
      if (rolesData.length > 0) {
        const targetRole = selectedRoleId 
          ? rolesData.find(r => r.id === selectedRoleId) || rolesData[0]
          : rolesData[0];
        
        setSelectedRoleId(targetRole.id);
        const permIds = targetRole.permissions?.map(p => p.id) || [];
        setSelectedPermIds(permIds);
        setOriginalPermIds(permIds);
      }
    } catch (error) {
      console.error('Failed to fetch roles data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedRole = useMemo(() => {
    return roles.find(r => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const isSuperAdmin = selectedRole?.name === 'Super Admin';

  // Check if current permissions have unsaved changes
  const isDirty = useMemo(() => {
    if (isSuperAdmin) return false;
    if (selectedPermIds.length !== originalPermIds.length) return true;
    const originalSet = new Set(originalPermIds);
    return selectedPermIds.some(id => !originalSet.has(id));
  }, [selectedPermIds, originalPermIds, isSuperAdmin]);

  // Handle Role Selection (with unsaved changes check)
  const handleSelectRole = (role: Role) => {
    if (role.id === selectedRoleId) return;

    if (isDirty) {
      showConfirm(
        'Ada perubahan hak akses yang belum disimpan. Tetap ingin berpindah peran?',
        () => {
          doSelectRole(role);
        },
        'Peringatan Perubahan'
      );
    } else {
      doSelectRole(role);
    }
  };

  const doSelectRole = (role: Role) => {
    setSelectedRoleId(role.id);
    const permIds = role.permissions?.map(p => p.id) || [];
    setSelectedPermIds(permIds);
    setOriginalPermIds(permIds);
  };

  // Toggle Single Permission
  const togglePermission = (permId: number) => {
    if (isSuperAdmin) return;
    setSelectedPermIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  // Toggle All in a specific Group
  const toggleGroup = (group: PermissionGroup) => {
    if (isSuperAdmin) return;

    const groupPermIds = group.permissions
      .map(p => permNameToObject.get(p.name)?.id)
      .filter((id): id is number => id !== undefined);

    const allSelected = groupPermIds.every(id => selectedPermIds.includes(id));

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
    setSelectedPermIds(allPermissions.map(p => p.id));
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
        if (r.id === selectedRole.id) {
          const updatedPerms = allPermissions.filter(p => selectedPermIds.includes(p.id));
          return { ...r, permissions: updatedPerms };
        }
        return r;
      }));

      showAlert(`Hak akses untuk "${selectedRole.name}" berhasil disimpan!`, 'Berhasil');
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Gagal menyimpan hak akses', 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  // Create Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRole = await createRole({ name, guardName });
      setShowModal(false);
      setName('');
      setGuardName('jwt');
      await fetchData();
      setSelectedRoleId(newRole.id);
      showAlert(`Peran "${newRole.name}" berhasil ditambahkan!`, 'Berhasil');
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Gagal membuat peran baru', 'Gagal');
    }
  };

  // Delete Role
  const handleDeleteRole = async (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      `Apakah Anda yakin ingin menghapus peran "${role.name}"? Aksi ini tidak dapat dibatalkan.`,
      async () => {
        try {
          await deleteRole(role.id);
          showAlert('Peran berhasil dihapus', 'Berhasil');
          await fetchData();
        } catch (error: any) {
          showAlert(error.response?.data?.message || 'Gagal menghapus peran', 'Gagal');
        }
      },
      'Hapus Peran'
    );
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title="Peran & Hak Akses (Roles & Permissions)" 
          subtitle="Atur daftar peran dan konfigurasi wewenang granular per submodul"
        />
        {canManageRbac && (
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={18} /> Tambah Peran Baru
          </button>
        )}
      </div>

      {/* 2-Panel Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL KIRI: DAFTAR ROLE (Master ~35% / 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <UserCheck size={16} className="text-indigo-600" />
                Daftar Peran ({filteredRoles.length})
              </h3>
            </div>
            {/* Role Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Cari peran..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                const isSelected = role.id === selectedRoleId;
                const isSystem = SYSTEM_ROLES.includes(role.name);
                const permCount = role.name === 'Super Admin' 
                  ? allPermissions.length 
                  : (role.permissions?.length || 0);

                return (
                  <div
                    key={role.id}
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
                          <span className="text-[11px] font-mono text-gray-400">{role.guardName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                      {!isSystem && canManageRbac && (
                        <button
                          onClick={(e) => handleDeleteRole(role, e)}
                          title="Hapus Peran"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL KANAN: DETAIL HAK AKSES ROLE (Detail ~65% / 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedRole ? (
            <>
              {/* Sticky Top Header Panel Kanan */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sticky top-4 z-10">
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
                          onClick={handleReset}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Batalkan perubahan"
                        >
                          <RotateCcw size={14} /> Reset
                        </button>
                      )}
                      <button
                        onClick={handleSavePermissions}
                        disabled={saving || !isDirty}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                          isDirty
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter & Batch Actions */}
                {!isSuperAdmin && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Filter hak akses (misal: 'siswa', 'kelas.manage')..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    {canManageRbac && (
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <button 
                          onClick={handleSelectAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                          <CheckSquare size={13} className="text-indigo-600" /> Centang Semua
                        </button>
                        <button 
                          onClick={handleDeselectAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
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
                {PERMISSION_GROUPS.map((group) => {
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
                    .map(p => permNameToObject.get(p.name)?.id)
                    .filter((id): id is number => id !== undefined);

                  const activeInGroup = isSuperAdmin 
                    ? group.permissions.length 
                    : groupPermIds.filter(id => selectedPermIds.includes(id)).length;

                  const allGroupSelected = isSuperAdmin || (
                    groupPermIds.length > 0 && groupPermIds.every(id => selectedPermIds.includes(id))
                  );

                  return (
                    <div key={group.id} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                      {/* Group Header */}
                      <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center">
                            {renderGroupIcon(group.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900">{group.name}</h3>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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

                        {!isSuperAdmin && canManageRbac && (
                          <button
                            type="button"
                            onClick={() => toggleGroup(group)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors text-gray-600"
                          >
                            {allGroupSelected ? (
                              <>
                                <Check size={12} className="text-indigo-600" /> Batal Pilih
                              </>
                            ) : (
                              <>
                                <Plus size={12} /> Pilih Semua
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Group Permissions Checkbox Grid */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {filteredGroupPerms.map((perm) => {
                          const permObj = permNameToObject.get(perm.name);
                          const permId = permObj?.id;
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
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <Shield size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Pilih salah satu peran di panel kiri untuk mengatur hak akses.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Tambah Peran Baru */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Peran Baru"
      >
        <form onSubmit={handleCreateRole} className="flex flex-col gap-5 p-6">
          <FormField label="Nama Peran" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Contoh: Waka Kurikulum" 
              required 
            />
          </FormField>
          
          <FormField label="Guard Name" required>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
              value={guardName} 
              onChange={(e) => setGuardName(e.target.value)} 
              placeholder="jwt" 
              required 
            />
          </FormField>
          
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button 
              type="button" 
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors" 
              onClick={() => setShowModal(false)}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-xs"
            >
              Simpan Peran
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
