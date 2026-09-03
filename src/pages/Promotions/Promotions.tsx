import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, ArrowUpRight, GraduationCap, Search, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { 
  getAcademicYears, getSemesters, getClassrooms, 
  type AcademicYear, type Semester, type Classroom 
} from '../../api/academicService';
import { 
  getStudentsByClass, processPromotion, processGraduation, 
  type Student 
} from '../../api/promotionGraduationService';

export const Promotions: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Source Filters
  const [sourceYear, setSourceYear] = useState('');
  const [sourceSemester, setSourceSemester] = useState('');
  const [sourceClass, setSourceClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // Modals
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isGraduateModalOpen, setIsGraduateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Promote Target Filters
  const [targetYear, setTargetYear] = useState('');
  const [targetSemester, setTargetSemester] = useState('');
  const [targetClass, setTargetClass] = useState('');

  // Graduate Fields
  const [graduationDate, setGraduationDate] = useState('');
  const [graduationNotes, setGraduationNotes] = useState('');

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      const [years, sems, classes] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getClassrooms()
      ]);
      setAcademicYears(years);
      setSemesters(sems);
      setClassrooms(classes);
      
      const activeYear = years.find(y => y.isActive);
      const activeSem = sems.find(s => s.isActive);
      if (activeYear) setSourceYear(activeYear.id);
      if (activeSem) setSourceSemester(activeSem.id);
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  };

  const fetchStudents = async () => {
    if (!sourceYear || !sourceSemester || !sourceClass) return;
    try {
      setLoading(true);
      const data = await getStudentsByClass(sourceYear, sourceSemester, sourceClass);
      setStudents(data);
      setSelectedStudentIds([]); // Reset selection
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [sourceYear, sourceSemester, sourceClass]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetYear || !targetSemester || !targetClass) {
      setError('Harap lengkapi semua bidang tujuan kenaikan kelas.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      await processPromotion({
        studentIds: selectedStudentIds,
        fromAcademicYearId: sourceYear,
        fromSemesterId: sourceSemester,
        fromClassId: sourceClass,
        toAcademicYearId: targetYear,
        toSemesterId: targetSemester,
        toClassId: targetClass
      });
      setSuccess(`${selectedStudentIds.length} siswa berhasil dinaikkan kelasnya.`);
      setIsPromoteModalOpen(false);
      fetchStudents();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses kenaikan kelas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGraduateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graduationDate) {
      setError('Tanggal kelulusan wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await processGraduation({
        studentIds: selectedStudentIds,
        fromAcademicYearId: sourceYear,
        fromSemesterId: sourceSemester,
        fromClassId: sourceClass,
        graduationDate,
        graduationNotes
      });
      setSuccess(`${selectedStudentIds.length} siswa berhasil diluluskan.`);
      setIsGraduateModalOpen(false);
      fetchStudents();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses kelulusan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis?.includes(searchTerm) || 
    s.nisn?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight"><Award className="text-emerald-600" /> Kenaikan & Kelulusan</h1>
          <p className="text-gray-500 mt-1">Kelola transisi siswa antar tahun ajaran dan status kelulusan</p>
        </div>
      </div>

      {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 shadow-sm border border-emerald-100 flex items-center gap-2 font-medium"><CheckCircle2 size={20} /> {success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-5 lg:col-span-1">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Search size={18} className="text-emerald-600" /> Filter Asal Siswa
          </h3>
          <div className="space-y-4">
            <div className="form-group">
              <label>Tahun Ajaran</label>
              <select 
                className="input-std bg-gray-100 cursor-not-allowed opacity-70" 
                value={sourceYear} 
                onChange={e => setSourceYear(e.target.value)}
                disabled
              >
                <option value="">Pilih Tahun Ajaran</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(Aktif)' : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select className="input-std" value={sourceSemester} onChange={e => setSourceSemester(e.target.value)}>
                <option value="">Pilih Semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Aktif)' : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Kelas/Rombel</label>
              <select className="input-std" value={sourceClass} onChange={e => setSourceClass(e.target.value)}>
                <option value="">Pilih Kelas</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm mb-6 p-6 lg:col-span-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau NIS..." 
                className="input-std pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button 
                className="btn-std-secondary flex items-center gap-2"
                disabled={selectedStudentIds.length === 0}
                onClick={() => setIsGraduateModalOpen(true)}
              >
                <GraduationCap size={18} className="text-purple-600" />
                Luluskan ({selectedStudentIds.length})
              </button>
              <button 
                className="btn-std-primary flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={selectedStudentIds.length === 0}
                onClick={() => setIsPromoteModalOpen(true)}
              >
                <ArrowUpRight size={18} />
                Naik Kelas ({selectedStudentIds.length})
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
                <tr>
                  <th className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>NIS / NISN</th>
                  <th>Nama Siswa</th>
                  <th>Kelas Saat Ini</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">Memuat data siswa...</td></tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleSelectStudent(student.id)}
                        />
                      </td>
                      <td className="font-mono text-sm text-gray-600">
                        <div className="font-medium text-gray-800">{student.nis}</div>
                        <div className="text-xs">{student.nisn}</div>
                      </td>
                      <td className="font-semibold text-gray-800">{student.user?.name}</td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {student.class?.name || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <Check size={14} /> {student.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Award size={48} className="mb-3 opacity-20" />
                        <p>{sourceClass ? 'Tidak ada siswa aktif di kelas ini.' : 'Pilih Tahun Ajaran, Semester, dan Kelas terlebih dahulu.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Promote Modal */}
      {isPromoteModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2"><ArrowUpRight className="text-emerald-600" /> Proses Kenaikan Kelas</h2>
              <button type="button" onClick={() => setIsPromoteModalOpen(false)} className="btn-close">&times;</button>
            </div>
            <form onSubmit={handlePromoteSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm mb-4">{error}</div>}
                
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm mb-2">
                  <ChevronRight className="flex-shrink-0 mt-0.5" size={18} />
                  <p>Anda akan menaikkan kelas <strong>{selectedStudentIds.length}</strong> siswa ke rombel tujuan di bawah ini.</p>
                </div>

                <div className="form-group">
                  <label>Tahun Ajaran Tujuan *</label>
                  <select className="input-std" value={targetYear} onChange={e => setTargetYear(e.target.value)} required>
                    <option value="">Pilih Tahun Ajaran</option>
                    {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester Tujuan *</label>
                  <select className="input-std" value={targetSemester} onChange={e => setTargetSemester(e.target.value)} required>
                    <option value="">Pilih Semester</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kelas/Rombel Tujuan *</label>
                  <select className="input-std" value={targetClass} onChange={e => setTargetClass(e.target.value)} required>
                    <option value="">Pilih Kelas</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" onClick={() => setIsPromoteModalOpen(false)} className="btn-std-secondary">Batal</button>
                <button type="submit" className="btn-std-primary" disabled={submitting}>
                  {submitting ? 'Memproses...' : 'Proses Kenaikan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Graduate Modal */}
      {isGraduateModalOpen && createPortal(
        <div className="modal-backdrop-v4">
          <div className="modal-content-v4" style={{ maxWidth: '500px' }}>
            <div className="modal-header-v4">
              <h2 className="flex items-center gap-2"><GraduationCap className="text-purple-600" /> Proses Kelulusan</h2>
              <button type="button" onClick={() => setIsGraduateModalOpen(false)} className="btn-close">&times;</button>
            </div>
            <form onSubmit={handleGraduateSubmit} className="modal-form-v4">
              <div className="modal-body-v4 form-grid">
                {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm mb-4">{error}</div>}
                
                <div className="bg-purple-50 text-purple-800 p-4 rounded-xl border border-purple-100 flex gap-3 text-sm mb-2">
                  <Award className="flex-shrink-0 mt-0.5" size={18} />
                  <p>Anda akan menetapkan status LULUS untuk <strong>{selectedStudentIds.length}</strong> siswa. Status ini akan tercatat permanen di riwayat akademik.</p>
                </div>

                <div className="form-group">
                  <label>Tanggal Kelulusan *</label>
                  <input 
                    type="date" 
                    className="input-std" 
                    value={graduationDate} 
                    onChange={e => setGraduationDate(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Catatan Kelulusan / No. SK (Opsional)</label>
                  <textarea 
                    className="input-std" 
                    rows={3}
                    value={graduationNotes} 
                    onChange={e => setGraduationNotes(e.target.value)} 
                    placeholder="Contoh: Lulus berdasarkan SK Kepala Sekolah Nomor 123/SK/2026..."
                  />
                </div>
              </div>
              <div className="modal-footer-v4">
                <button type="button" onClick={() => setIsGraduateModalOpen(false)} className="btn-std-secondary">Batal</button>
                <button type="submit" className="btn-std-primary" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' }} disabled={submitting}>
                  {submitting ? 'Memproses...' : 'Proses Kelulusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ,
        document.body
      )}
    </div>
  );
};
