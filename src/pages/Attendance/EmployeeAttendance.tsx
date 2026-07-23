import React, { useEffect, useState } from 'react';
import { getEmployees } from '../../api/employeeService';
import { getEmployeeAttendances, upsertEmployeeAttendanceBatch, type EmployeeAttendance, type EmployeeAttendanceBatchItem } from '../../api/attendanceService';
import { Save, Calendar } from 'lucide-react';
import '../Academic/Academic.css';

interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  nip: string;
  status: string;
  checkinTime: string;
  checkoutTime: string;
  notes: string;
}

export const EmployeeAttendancePage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    if (date) {
      fetchAttendanceData();
    }
  }, [date]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [employeesData, attendancesData] = await Promise.all([
        getEmployees(),
        getEmployeeAttendances({ date })
      ]);
      
      // Filter active employees
      const activeEmployees = employeesData.filter(emp => emp.isActive);
      
      const attendanceMap = new Map<string, EmployeeAttendance>();
      attendancesData.forEach((att: EmployeeAttendance) => {
        attendanceMap.set(att.employeeId, att);
      });
      
      const newRows = activeEmployees.map(emp => {
        const att = attendanceMap.get(emp.id);
        return {
          employeeId: emp.id,
          employeeName: emp.fullName,
          nip: emp.employeeNumber || '-',
          status: att ? att.status : 'Hadir',
          checkinTime: att?.checkinTime || '',
          checkoutTime: att?.checkoutTime || '',
          notes: att?.notes || ''
        };
      });
      
      setRows(newRows);
    } catch (err: any) {
      setError('Gagal memuat data absensi pegawai');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof AttendanceRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
  };

  const handleSave = async () => {
    if (!date) {
      setError('Harap pilih tanggal.');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const attendances: EmployeeAttendanceBatchItem[] = rows.map(r => ({
        employeeId: r.employeeId,
        status: r.status,
        checkinTime: r.checkinTime || undefined,
        checkoutTime: r.checkoutTime || undefined,
        notes: r.notes || undefined
      }));
      
      await upsertEmployeeAttendanceBatch(date, attendances);
      setSuccess('Data absensi pegawai berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh to get potentially auto-updated statuses (like Terlambat)
      await fetchAttendanceData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="academic-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Absensi Pegawai / Guru</h1>
          <p className="page-subtitle">Kelola kehadiran harian staf dan pengajar</p>
        </div>
      </div>

      {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      {success && <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200">{success}</div>}

      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-blue-600 border-b pb-2">
          <Calendar size={20} />
          <h2 className="text-lg font-semibold">Filter Tanggal</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="text-sm font-medium text-gray-700">Pilih Tanggal</label>
            <input type="date" className="input-field mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Kehadiran</h2>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={handleSave}
            disabled={saving || rows.length === 0}
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data absensi...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data pegawai aktif.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>NIP</th>
                  <th>Nama Pegawai</th>
                  <th className="w-40">Status</th>
                  <th className="w-32">Check In</th>
                  <th className="w-32">Check Out</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.employeeId}>
                    <td className="text-center text-gray-500">{index + 1}</td>
                    <td className="font-mono text-sm text-gray-600">{row.nip}</td>
                    <td className="font-semibold">{row.employeeName}</td>
                    <td>
                      <select 
                        className={`w-full p-2 border rounded-md text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                          row.status === 'Hadir' ? 'bg-green-50 text-green-700 border-green-200' :
                          row.status === 'Terlambat' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          row.status === 'Izin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          row.status === 'Sakit' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          row.status === 'Cuti' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                        value={row.status}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Cuti">Cuti</option>
                        <option value="Alpa">Alpa</option>
                        <option value="Terlambat">Terlambat</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="time" 
                        className="input-field py-1.5 px-2"
                        value={row.checkinTime}
                        onChange={(e) => handleRowChange(index, 'checkinTime', e.target.value)}
                        disabled={row.status !== 'Hadir' && row.status !== 'Terlambat'}
                      />
                    </td>
                    <td>
                      <input 
                        type="time" 
                        className="input-field py-1.5 px-2"
                        value={row.checkoutTime}
                        onChange={(e) => handleRowChange(index, 'checkoutTime', e.target.value)}
                        disabled={row.status !== 'Hadir' && row.status !== 'Terlambat'}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="input-field py-1.5 px-2"
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder="Keterangan..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
