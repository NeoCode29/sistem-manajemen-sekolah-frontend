import React, { useEffect, useState } from 'react';
import { registerStudentIdentity, registerEmployeeIdentity, getRecentScans } from '../../api/hardwareService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { getEmployees } from '../../api/employeeService';
import { Fingerprint, UserPlus, Search, Smartphone, Save, RadioReceiver } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';

export const IdentityRegistration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'EMPLOYEE'>('STUDENT');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // Using any for employee for now if type isn't fully defined
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const { showConfirm, showAlert } = useDialog();
  
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
    } catch (err) {
      console.error('Failed to fetch people data', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (person: any) => {
    setSelectedPerson(person);
    setRfidTag(person.rfidTag || '');
    setFingerprintId(person.fingerprintId || '');
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
    const interval = setInterval(async () => {
      try {
        const scansRes = await getRecentScans();
        const scans = Array.isArray(scansRes) ? scansRes : (scansRes.data || []);
        const latestUnregistered = scans.find((s: any) => s.status === 'UNREGISTERED');
        if (latestUnregistered) {
          if (latestUnregistered.scanType === 'RFID') {
            setRfidTag(latestUnregistered.identityValue);
          } else if (latestUnregistered.scanType === 'FINGERPRINT') {
            setFingerprintId(latestUnregistered.identityValue);
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

    const payload = { rfidTag, fingerprintId };

    try {
      if (activeTab === 'STUDENT') {
        await registerStudentIdentity(selectedPerson.id, payload);
      } else {
        await registerEmployeeIdentity(selectedPerson.id, payload);
      }
      showAlert('Registrasi kartu/sidik jari berhasil disimpan', 'Berhasil');
      closeModal();
      fetchData(); 
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Gagal menyimpan registrasi', 'Gagal');
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.employeeNumber && e.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Registrasi Kartu & Biometrik" 
          subtitle="Daftarkan Kartu RFID atau Sidik Jari ke akun Siswa / Pegawai"
        />
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 flex flex-col min-h-[500px]">
        {/* Tabs & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 rounded-t-2xl">
          <div className="flex bg-gray-200/80 p-1 rounded-xl w-full md:w-auto">
            <button
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'STUDENT' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => { setActiveTab('STUDENT'); setSearchQuery(''); }}
            >
              Siswa
            </button>
            <button
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'EMPLOYEE' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => { setActiveTab('EMPLOYEE'); setSearchQuery(''); }}
            >
              Guru & Pegawai
            </button>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={`Cari nama atau ${activeTab === 'STUDENT' ? 'NIS' : 'NIP'}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data List */}
        <div className="flex-1 overflow-auto p-5 bg-gray-50/30 rounded-b-2xl">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium">Memuat data...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(activeTab === 'STUDENT' ? filteredStudents : filteredEmployees).map((person: any) => (
                <div 
                  key={person.id} 
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => openModal(person)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-700 transition-colors">{person.fullName}</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mb-4 bg-gray-50 w-max px-2 py-0.5 rounded border border-gray-100">
                    {activeTab === 'STUDENT' ? (person.nis || 'NIS-') : (person.employeeNumber || 'NIP-')} 
                    {person.class && <span className="ml-2 bg-indigo-50 text-indigo-700 px-1.5 rounded border border-indigo-100">{person.class.name}</span>}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                    {person.rfidTag ? (
                      <span className="text-[10px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center gap-1.5 flex-1 justify-center">
                        <Smartphone size={12} /> Terdaftar
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-1 bg-gray-50 text-gray-400 rounded-md border border-gray-200 flex items-center gap-1.5 flex-1 justify-center">
                        <Smartphone size={12} /> Kosong
                      </span>
                    )}
                    
                    {person.fingerprintId ? (
                      <span className="text-[10px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center gap-1.5 flex-1 justify-center">
                        <Fingerprint size={12} /> Terdaftar
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-1 bg-gray-50 text-gray-400 rounded-md border border-gray-200 flex items-center gap-1.5 flex-1 justify-center">
                        <Fingerprint size={12} /> Kosong
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(activeTab === 'STUDENT' ? filteredStudents.length : filteredEmployees.length) === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <Search size={32} className="text-gray-300" />
                    <p className="font-medium text-gray-600">Data tidak ditemukan.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Registrasi ID Perangkat"
      >
        <div className="p-6">
          {/* User Info Box */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
              {selectedPerson?.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{selectedPerson?.fullName}</h3>
              <p className="text-sm text-indigo-700 font-medium mt-0.5">{activeTab === 'STUDENT' ? 'Siswa' : 'Pegawai'} • {selectedPerson?.nis || selectedPerson?.employeeNumber}</p>
            </div>
          </div>

          <form id="reg-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex justify-end -mb-3 relative z-10">
              <button 
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-semibold shadow-sm border ${
                  isListening ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {isListening ? (
                  <><RadioReceiver size={14} className="animate-pulse" /> Batal Tap...</>
                ) : (
                  <><RadioReceiver size={14}/> Tap Kartu Sekarang</>
                )}
              </button>
            </div>
            
            <FormField label="ID Kartu RFID">
              <div className="relative group">
                <Smartphone className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isListening ? 'text-indigo-500 animate-pulse' : 'text-gray-400 group-focus-within:text-indigo-500'}`} size={18} />
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all font-mono tracking-wider font-semibold ${
                    isListening 
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-300' 
                      : 'bg-gray-50/50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900'
                  }`}
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                  placeholder="Contoh: 0001234567"
                />
              </div>
              {isListening && (
                <p className="text-xs font-semibold text-indigo-600 mt-2 flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Silakan tap kartu pada mesin absensi terdekat...
                </p>
              )}
            </FormField>

            <FormField label="ID Sidik Jari (Biometrik)" hint="ID Sidik Jari berupa angka dari mesin.">
              <div className="relative group">
                <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-semibold text-gray-900"
                  value={fingerprintId}
                  onChange={(e) => setFingerprintId(e.target.value)}
                  placeholder="Contoh: FP-001"
                />
              </div>
            </FormField>
            
            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
              <button type="button" className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors" onClick={closeModal}>Tutup</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm flex items-center gap-2">
                <Save size={16} /> Simpan Registrasi
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
