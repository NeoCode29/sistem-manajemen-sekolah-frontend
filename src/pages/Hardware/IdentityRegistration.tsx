import React, { useEffect, useState } from 'react';
import { registerStudentIdentity, registerEmployeeIdentity, getRecentScans } from '../../api/hardwareService';
import { getStudents } from '../../api/studentService';
import type { Student } from '../../api/studentService';
import { getEmployees } from '../../api/employeeService';
import { Fingerprint, UserPlus, X, Search, Smartphone, Save, RadioReceiver } from 'lucide-react';
import { useDialog } from '../../contexts/DialogContext';
import '../Academic/Academic.css';

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
        // In a real app, you might want pagination here since there are many students
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
        // Poll recent scans for an UNREGISTERED tag to auto-fill
        const scans = await getRecentScans();
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
    }, 2000); // Check every 2 seconds
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
      fetchData(); // Refresh list to show updated tags
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
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserPlus size={24} className="text-blue-600" />
            Registrasi Kartu & Biometrik
          </h1>
          <p className="page-subtitle">Daftarkan Kartu RFID atau Sidik Jari ke akun Siswa / Pegawai</p>
        </div>
      </div>

      <div className="glass-panel mt-6 flex flex-col min-h-[500px]">
        {/* Tabs & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto">
            <button
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'STUDENT' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => { setActiveTab('STUDENT'); setSearchQuery(''); }}
            >
              Siswa
            </button>
            <button
              className={`flex-1 md:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'EMPLOYEE' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => { setActiveTab('EMPLOYEE'); setSearchQuery(''); }}
            >
              Guru & Pegawai
            </button>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Cari nama atau ${activeTab === 'STUDENT' ? 'NIS' : 'NIP'}...`}
              className="input-field w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data List */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(activeTab === 'STUDENT' ? filteredStudents : filteredEmployees).map((person: any) => (
                <div 
                  key={person.id} 
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => openModal(person)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-700">{person.fullName}</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mb-3">
                    {activeTab === 'STUDENT' ? (person.nis || 'NIS-') : (person.employeeNumber || 'NIP-')} 
                    {person.class && <span className="ml-2 bg-gray-100 px-1.5 rounded">{person.class.name}</span>}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                    {person.rfidTag ? (
                      <span className="text-[10px] font-medium px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-1">
                        <Smartphone size={10} /> Terdaftar
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-1 bg-gray-50 text-gray-400 rounded border border-gray-200 flex items-center gap-1">
                        <Smartphone size={10} /> Kosong
                      </span>
                    )}
                    
                    {person.fingerprintId ? (
                      <span className="text-[10px] font-medium px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-1">
                        <Fingerprint size={10} /> Terdaftar
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-1 bg-gray-50 text-gray-400 rounded border border-gray-200 flex items-center gap-1">
                        <Fingerprint size={10} /> Kosong
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(activeTab === 'STUDENT' ? filteredStudents.length : filteredEmployees.length) === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Data tidak ditemukan.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Fingerprint size={20} className="text-blue-600" />
                Registrasi ID Perangkat
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* User Info Box */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                  {selectedPerson.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedPerson.fullName}</h3>
                  <p className="text-sm text-gray-500">{activeTab === 'STUDENT' ? 'Siswa' : 'Pegawai'} • {selectedPerson.nis || selectedPerson.employeeNumber}</p>
                </div>
              </div>

              <form id="reg-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700 flex justify-between items-center mb-1">
                    <span>ID Kartu RFID</span>
                    <button 
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                        isListening ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {isListening ? (
                        <>Batal Tap...</>
                      ) : (
                        <><RadioReceiver size={12}/> Tap Kartu Sekarang</>
                      )}
                    </button>
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      className={`input-field w-full pl-10 font-mono ${isListening ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-50/30' : ''}`}
                      value={rfidTag}
                      onChange={(e) => setRfidTag(e.target.value)}
                      placeholder="Contoh: 0001234567"
                    />
                  </div>
                  {isListening && (
                    <p className="text-xs text-blue-500 mt-1 animate-pulse">
                      Silakan tap kartu pada mesin absensi terdekat...
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">ID Sidik Jari (Biometrik)</label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      className="input-field w-full pl-10 font-mono"
                      value={fingerprintId}
                      onChange={(e) => setFingerprintId(e.target.value)}
                      placeholder="Contoh: FP-001"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ID Sidik Jari biasanya berupa angka yang dihasilkan oleh mesin saat mendaftarkan jari.
                  </p>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                form="reg-form"
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                Simpan Registrasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
