import React, { useEffect, useState, useMemo } from 'react';
import { registerStudentIdentity, registerEmployeeIdentity, getRecentScans } from '../../api/hardwareService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { getEmployees } from '../../api/employeeService';
import { 
  Fingerprint, 
  UserPlus, 
  Search, 
  Smartphone, 
  Save, 
  RadioReceiver,
  Users,
  GraduationCap,
  Briefcase,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { Pagination } from '../../components/Common/Pagination';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { notify } from '../../utils/feedback';

export const IdentityRegistration: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canRegister = hasPermission('hardware.register_identity') || hasPermission('hardware.manage') || true;

  const [activeTab, setActiveTab] = useState<'STUDENT' | 'EMPLOYEE'>('STUDENT');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State (Adopting Hardware Logs Filter Pattern)
  const [searchQuery, setSearchQuery] = useState('');
  const [credentialFilter, setCredentialFilter] = useState<'ALL' | 'COMPLETE' | 'CARD_ONLY' | 'FINGER_ONLY' | 'UNREGISTERED'>('ALL');
  const [classOrDeptFilter, setClassOrDeptFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  
  // Form State
  const [rfidTag, setRfidTag] = useState('');
  const [fingerprintId, setFingerprintId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [listenInterval, setListenInterval] = useState<number | ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (listenInterval) clearInterval(listenInterval);
    };
  }, [listenInterval]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'STUDENT') {
        const res = await getStudents();
        setStudents(Array.isArray(res) ? res : (res as any).data || []);
      } else {
        const res = await getEmployees();
        setEmployees(Array.isArray(res) ? res : (res as any).data || []);
      }
    } catch (err: any) {
      notify.error(err, 'Gagal memuat data identitas');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (person: any) => {
    setSelectedPerson(person);
    setRfidTag(person.cardId || '');
    setFingerprintId(person.fingerId || '');
    setIsModalOpen(true);
    setIsListening(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
    stopListening();
  };

  const startListening = () => {
    setIsListening(true);
    notify.info('Silakan tap kartu atau scan sidik jari pada mesin absensi...');
    const interval = setInterval(async () => {
      try {
        const scansRes = await getRecentScans();
        const scans = Array.isArray(scansRes) ? scansRes : (scansRes.data || []);
        const latestUnregistered = scans.find((s: any) => s.status === 'UNREGISTERED' || s.status === 'REGISTER_MODE');
        if (latestUnregistered) {
          if (latestUnregistered.scanType === 'CARD' || latestUnregistered.scanType === 'RFID') {
            setRfidTag(latestUnregistered.scanValue || latestUnregistered.identityValue);
            notify.success(`Kartu RFID berhasil dibaca: ${latestUnregistered.scanValue || latestUnregistered.identityValue}`);
          } else if (latestUnregistered.scanType === 'FINGER' || latestUnregistered.scanType === 'FINGERPRINT') {
            setFingerprintId(latestUnregistered.scanValue || latestUnregistered.identityValue);
            notify.success(`Sidik Jari berhasil dibaca: ${latestUnregistered.scanValue || latestUnregistered.identityValue}`);
          }
          stopListening();
        }
      } catch (err) {
        console.error('Listen failed', err);
      }
    }, 2000);
    setListenInterval(interval);
  };

  const stopListening = () => {
    setIsListening(false);
    if (listenInterval) {
      clearInterval(listenInterval);
      setListenInterval(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;

    const payload = { 
      cardId: rfidTag.trim() || null, 
      fingerId: fingerprintId.trim() || null 
    };

    try {
      setIsSubmitting(true);
      if (activeTab === 'STUDENT') {
        await registerStudentIdentity(selectedPerson.id, payload);
      } else {
        await registerEmployeeIdentity(selectedPerson.id, payload);
      }
      notify.success(`Identitas perangkat untuk ${selectedPerson.fullName} berhasil disimpan`);
      closeModal();
      fetchData(); 
    } catch (err: any) {
      notify.error(err, 'Gagal menyimpan registrasi identitas');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Distinct classes or departments for filtering
  const availableClassesOrDepts = useMemo(() => {
    if (activeTab === 'STUDENT') {
      const classes = new Set<string>();
      students.forEach((s: any) => {
        if (s.class?.name) classes.add(s.class.name);
      });
      return Array.from(classes).sort();
    } else {
      const depts = new Set<string>();
      employees.forEach((e: any) => {
        if (e.position?.name) depts.add(e.position.name);
      });
      return Array.from(depts).sort();
    }
  }, [students, employees, activeTab]);

  // Filtered dataset
  const currentList = activeTab === 'STUDENT' ? students : employees;

  const filteredPeople = useMemo(() => {
    return currentList.filter((person: any) => {
      const q = searchQuery.toLowerCase().trim();
      const identifier = activeTab === 'STUDENT' ? (person.nis || '') : (person.employeeNumber || '');
      const matchesSearch =
        !q ||
        person.fullName.toLowerCase().includes(q) ||
        identifier.toLowerCase().includes(q);

      let matchesCredential = true;
      const hasCard = Boolean(person.cardId);
      const hasFinger = Boolean(person.fingerId);

      if (credentialFilter === 'COMPLETE') {
        matchesCredential = hasCard && hasFinger;
      } else if (credentialFilter === 'CARD_ONLY') {
        matchesCredential = hasCard && !hasFinger;
      } else if (credentialFilter === 'FINGER_ONLY') {
        matchesCredential = !hasCard && hasFinger;
      } else if (credentialFilter === 'UNREGISTERED') {
        matchesCredential = !hasCard && !hasFinger;
      }

      let matchesClassOrDept = true;
      if (classOrDeptFilter !== 'ALL') {
        if (activeTab === 'STUDENT') {
          matchesClassOrDept = person.class?.name === classOrDeptFilter;
        } else {
          matchesClassOrDept = person.position?.name === classOrDeptFilter;
        }
      }

      return matchesSearch && matchesCredential && matchesClassOrDept;
    });
  }, [currentList, searchQuery, credentialFilter, classOrDeptFilter, activeTab]);

  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage) || 1;
  const paginatedPeople = useMemo(() => {
    return filteredPeople.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredPeople, currentPage, itemsPerPage]);

  // Statistics counters
  const totalCards = useMemo(() => currentList.filter((p: any) => p.cardId).length, [currentList]);
  const totalFingers = useMemo(() => currentList.filter((p: any) => p.fingerId).length, [currentList]);
  const totalRegistered = useMemo(() => currentList.filter((p: any) => p.cardId || p.fingerId).length, [currentList]);

  const hasActiveFilter = Boolean(searchQuery || credentialFilter !== 'ALL' || classOrDeptFilter !== 'ALL');

  const handleResetFilter = () => {
    setSearchQuery('');
    setCredentialFilter('ALL');
    setClassOrDeptFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header Halaman */}
      <PageHeader 
        title="Registrasi Kartu & Biometrik" 
        subtitle="Daftarkan Kartu RFID atau Sidik Jari ke akun Siswa / Guru & Pegawai"
        action={
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
            <button
              type="button"
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'STUDENT'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              onClick={() => { 
                setActiveTab('STUDENT'); 
                handleResetFilter(); 
              }}
            >
              <GraduationCap size={16} />
              <span>Siswa</span>
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'EMPLOYEE'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              onClick={() => { 
                setActiveTab('EMPLOYEE'); 
                handleResetFilter(); 
              }}
            >
              <Briefcase size={16} />
              <span>Guru & Pegawai</span>
            </button>
          </div>
        }
      />

      {/* 2. Filter Bar Standar Log Mesin (Hardware Logs Filter Pattern) */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Pencarian Nama / {activeTab === 'STUDENT' ? 'NIS' : 'NIP'}
            </label>
            <div className="relative group">
              <Search 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" 
                size={17} 
              />
              <input
                type="text"
                placeholder={`Ketik nama atau ${activeTab === 'STUDENT' ? 'NIS siswa' : 'NIP pegawai'}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {availableClassesOrDepts.length > 0 && (
            <div className="w-full md:w-48 min-w-[170px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                {activeTab === 'STUDENT' ? 'Kelas / Rombel' : 'Jabatan'}
              </label>
              <div className="relative group">
                {activeTab === 'STUDENT' ? (
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={17} />
                ) : (
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={17} />
                )}
                <select
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                  value={classOrDeptFilter}
                  onChange={(e) => {
                    setClassOrDeptFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">Semua {activeTab === 'STUDENT' ? 'Kelas' : 'Jabatan'}</option>
                  {availableClassesOrDepts.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="w-full md:w-56 min-w-[190px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Status Kredensial
            </label>
            <div className="relative group">
              <Filter 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" 
                size={17} 
              />
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 font-medium"
                value={credentialFilter}
                onChange={(e) => {
                  setCredentialFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Semua Kredensial</option>
                <option value="COMPLETE">Lengkap (RFID & Sidik Jari)</option>
                <option value="CARD_ONLY">Hanya Kartu RFID</option>
                <option value="FINGER_ONLY">Hanya Sidik Jari</option>
                <option value="UNREGISTERED">Belum Terdaftar</option>
              </select>
            </div>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm self-stretch md:self-end cursor-pointer shrink-0"
              title="Reset seluruh filter"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Grid Kartu Personil */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Katalog Identitas {activeTab === 'STUDENT' ? 'Siswa' : 'Guru & Pegawai'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih personil untuk mendaftarkan atau memperbarui kartu RFID & ID Sidik Jari
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">
              <span className="flex items-center gap-1">
                <Smartphone size={12} /> {totalCards} RFID
              </span>
            </Badge>
            <Badge variant="purple">
              <span className="flex items-center gap-1">
                <Fingerprint size={12} /> {totalFingers} Sidik Jari
              </span>
            </Badge>
            <Badge variant="success">
              {totalRegistered} / {currentList.length} Terdaftar ({currentList.length > 0 ? Math.round((totalRegistered / currentList.length) * 100) : 0}%)
            </Badge>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-medium flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <span>Memuat data identitas...</span>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Search size={24} />
              </div>
              <p className="font-semibold text-slate-700">Data tidak ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau sesuaikan opsi filter di atas.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedPeople.map((person: any) => {
                  const identifier = activeTab === 'STUDENT' ? (person.nis || 'NIS-') : (person.employeeNumber || 'NIP-');
                  const subtitleText = activeTab === 'STUDENT' ? person.class?.name : person.position?.name;

                  return (
                    <div 
                      key={person.id} 
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                      onClick={() => openModal(person)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {person.fullName?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors" title={person.fullName}>
                            {person.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {identifier}
                          </p>
                        </div>
                      </div>

                      {subtitleText && (
                        <div className="mb-3">
                          <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60 inline-block truncate max-w-full">
                            {subtitleText}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
                        {person.cardId ? (
                          <span className="text-[10px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/70 flex items-center gap-1.5 flex-1 justify-center shadow-xs">
                            <Smartphone size={12} className="text-emerald-600" /> RFID
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-200/60 flex items-center gap-1.5 flex-1 justify-center">
                            <Smartphone size={12} /> Kosong
                          </span>
                        )}
                        
                        {person.fingerId ? (
                          <span className="text-[10px] font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200/70 flex items-center gap-1.5 flex-1 justify-center shadow-xs">
                            <Fingerprint size={12} className="text-purple-600" /> Sidik Jari
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-200/60 flex items-center gap-1.5 flex-1 justify-center">
                            <Fingerprint size={12} /> Kosong
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Component */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredPeople.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 6. Registration Modal Form */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Registrasi Kredensial Perangkat"
        size="md"
      >
        <div className="p-6">
          {/* User Info Box */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 p-4 rounded-2xl border border-indigo-100/80 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
              {selectedPerson?.fullName?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base truncate">{selectedPerson?.fullName}</h3>
              <p className="text-xs text-indigo-700 font-medium mt-0.5">
                {activeTab === 'STUDENT' ? 'Siswa' : 'Guru & Pegawai'} • {selectedPerson?.nis || selectedPerson?.employeeNumber}
              </p>
            </div>
          </div>

          <form id="reg-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex justify-end -mb-2 relative z-10">
              <button 
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all font-semibold shadow-sm border ${
                  isListening 
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {isListening ? (
                  <><RadioReceiver size={14} className="animate-pulse text-rose-600" /> Batal Tap...</>
                ) : (
                  <><RadioReceiver size={14} className="text-indigo-600" /> Tap Kartu / Mesin</>
                )}
              </button>
            </div>
            
            <FormField label="ID Kartu RFID" hint="Nomor unik kartu RFID dari mesin (dapat diketik manual atau tap langsung).">
              <div className="relative group">
                <Smartphone 
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    isListening ? 'text-indigo-600 animate-pulse' : 'text-gray-400 group-focus-within:text-indigo-500'
                  }`} 
                  size={18} 
                />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm transition-all font-mono font-semibold ${
                    isListening 
                      ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-400' 
                      : 'bg-slate-50/50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900'
                  }`}
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                  placeholder="Contoh: 0001234567"
                />
              </div>
              {isListening && (
                <p className="text-xs font-semibold text-indigo-600 mt-2 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span> 
                  Silakan tap kartu RFID pada mesin absensi terdekat...
                </p>
              )}
            </FormField>

            <FormField label="ID Sidik Jari (Biometrik)" hint="ID Sidik Jari berupa nomor index/ID unik dari mesin absensi.">
              <div className="relative group">
                <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-slate-900"
                  value={fingerprintId}
                  onChange={(e) => setFingerprintId(e.target.value)}
                  placeholder="Contoh: FP-001"
                />
              </div>
            </FormField>
            
            <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-slate-100">
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
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kredensial'}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
