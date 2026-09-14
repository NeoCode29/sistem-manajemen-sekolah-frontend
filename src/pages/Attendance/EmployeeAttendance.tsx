import React, { useEffect, useState } from 'react';
import { getEmployees } from '../../api/employeeService';
import { getEmployeeAttendances, upsertEmployeeAttendanceBatch, type EmployeeAttendance, type EmployeeAttendanceBatchItem } from '../../api/attendanceService';
import { Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../../components/Common/TableSkeleton';
import { usePermissions } from '../../hooks/usePermissions';

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
  const { hasPermission } = usePermissions();
  const canRecordEmployeeAttendance = hasPermission('employee_attendance.record') || hasPermission('attendance.write');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    if (date) {
      fetchAttendanceData();
    }
  }, [date]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
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
          status: att ? att.status : 'Belum Absen',
          checkinTime: att?.checkinTime || '',
          checkoutTime: att?.checkoutTime || '',
          notes: att?.notes || ''
        };
      });
      
      setRows(newRows);
    } catch (err: any) {
      toast.error('Gagal memuat data absensi pegawai');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof AttendanceRow, value: string) => {
    const updatedRows = [...rows];
    const updatedRow = { ...updatedRows[index], [field]: value };
    
    if (field === 'status' && value !== 'Hadir' && value !== 'Terlambat') {
      updatedRow.checkinTime = '';
      updatedRow.checkoutTime = '';
    }
    
    updatedRows[index] = updatedRow;
    setRows(updatedRows);
  };

  const handleSave = async () => {
    if (!date) {
      toast.error('Harap pilih tanggal.');
      return;
    }
    
    try {
      setSaving(true);
      
      const attendances: EmployeeAttendanceBatchItem[] = rows
        .filter(r => r.status !== 'Belum Absen')
        .map(r => {
          const isPresent = r.status === 'Hadir' || r.status === 'Terlambat';
          return {
            employeeId: r.employeeId,
            status: r.status,
            checkinTime: isPresent ? (r.checkinTime || undefined) : undefined,
            checkoutTime: isPresent ? (r.checkoutTime || undefined) : undefined,
            notes: r.notes || undefined
          };
        });
      
      if (attendances.length === 0) {
        toast.error('Tidak ada perubahan absensi untuk disimpan. Silakan pilih status kehadiran pegawai terlebih dahulu.');
        setSaving(false);
        return;
      }
      
      await upsertEmployeeAttendanceBatch(date, attendances);
      toast.success('Data absensi pegawai berhasil disimpan!');
      
      // Refresh to get potentially auto-updated statuses (like Terlambat)
      await fetchAttendanceData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Absensi Pegawai / Guru</h1>
          <p className="text-gray-500 mt-1">Kelola kehadiran harian staf dan pengajar</p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl border border-white shadow-lg shadow-slate-200/40 rounded-3xl p-6 md:p-8 mb-8 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-3 mb-6 text-indigo-600 border-b border-indigo-100/50 pb-4">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/50">
            <Calendar size={22} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600">
            Filter Data Absensi
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Pilih Tanggal</label>
            <input type="date" className="input-std w-full shadow-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-slate-200/30 mb-8 overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">Daftar Kehadiran Pegawai</h2>
          </div>
          {canRecordEmployeeAttendance && (
            <button 
              className="btn-std-primary flex items-center gap-2 px-6 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-300"
              onClick={handleSave}
              disabled={saving || rows.length === 0}
            >
              <Save size={18} className={saving ? 'animate-pulse' : ''} />
              <span className="font-semibold">{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="w-12 text-center py-4">No</th>
                  <th className="py-4 px-2">NIP</th>
                  <th className="py-4 px-2">Nama Pegawai</th>
                  <th className="w-48 py-4 px-2">Status</th>
                  <th className="w-36 py-4 px-2">Check In</th>
                  <th className="w-36 py-4 px-2">Check Out</th>
                  <th className="py-4 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <TableSkeleton columns={7} rows={5} />
              </tbody>
            </table>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data pegawai aktif.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="w-12 text-center py-4">No</th>
                  <th className="py-4 px-2">NIP</th>
                  <th className="py-4 px-2">Nama Pegawai</th>
                  <th className="w-48 py-4 px-2">Status</th>
                  <th className="w-36 py-4 px-2">Check In</th>
                  <th className="w-36 py-4 px-2">Check Out</th>
                  <th className="py-4 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, index) => (
                  <tr key={row.employeeId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="text-center text-gray-500 py-3">{index + 1}</td>
                    <td className="font-mono text-sm text-gray-500 py-3 px-2">{row.nip}</td>
                    <td className="font-bold text-gray-800 py-3 px-2">{row.employeeName}</td>
                    <td className="py-3 px-2">
                      <select 
                        disabled={!canRecordEmployeeAttendance}
                        className={`w-full p-2.5 rounded-xl font-medium outline-none transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent ${canRecordEmployeeAttendance ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${
                          row.status === 'Belum Absen' ? 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400/50' :
                          row.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400/50' :
                          row.status === 'Terlambat' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400/50' :
                          row.status === 'Izin' ? 'bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-400/50' :
                          row.status === 'Sakit' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-400/50' :
                          row.status === 'Cuti' ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400/50' :
                          'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400/50'
                        }`}
                        value={row.status}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      >
                        <option value="Belum Absen">Belum Absen</option>
                        <option value="Hadir">Hadir</option>
                        <option value="Izin">Izin</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Cuti">Cuti</option>
                        <option value="Alpa">Alpa</option>
                        <option value="Terlambat">Terlambat</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="time" 
                        className="input-std py-2 px-3 shadow-sm w-full bg-white/50 focus:bg-white transition-colors"
                        value={row.checkinTime}
                        onChange={(e) => handleRowChange(index, 'checkinTime', e.target.value)}
                        disabled={!canRecordEmployeeAttendance || (row.status !== 'Hadir' && row.status !== 'Terlambat')}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="time" 
                        className="input-std py-2 px-3 shadow-sm w-full bg-white/50 focus:bg-white transition-colors"
                        value={row.checkoutTime}
                        onChange={(e) => handleRowChange(index, 'checkoutTime', e.target.value)}
                        disabled={!canRecordEmployeeAttendance || (row.status !== 'Hadir' && row.status !== 'Terlambat')}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input 
                        type="text" 
                        disabled={!canRecordEmployeeAttendance}
                        className={`input-std py-2 px-3 shadow-sm w-full transition-colors ${canRecordEmployeeAttendance ? 'bg-white/50 focus:bg-white' : 'bg-gray-100 cursor-not-allowed opacity-80'}`}
                        value={row.notes}
                        onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        placeholder={canRecordEmployeeAttendance ? "Tambahkan keterangan opsional..." : "-"}
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
