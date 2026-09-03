import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getMyGrades, type ReportCard } from '../../api/studentPortalService';

export const StudentGrades: React.FC = () => {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await getMyGrades();
        setReportCards(data);
      } catch (error) {
        console.error('Failed to fetch grades', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 font-medium">Memuat data nilai...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shadow-sm border border-blue-100">
          <BookOpen size={24} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Nilai & Rapor</h2>
          <p className="text-sm text-gray-500 font-medium">Lihat dan pantau perkembangan nilai akademik Anda per semester.</p>
        </div>
      </div>

      {reportCards.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Rapor</h3>
          <p className="text-gray-500">Data nilai rapor belum dipublikasikan atau belum tersedia.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {reportCards.map((rc) => (
            <div key={rc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              
              <div 
                className={`p-6 flex justify-between items-center cursor-pointer transition-colors ${expandedId === rc.id ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
                onClick={() => setExpandedId(expandedId === rc.id ? null : rc.id)}
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Rapor Semester {rc.semester.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200">TA {rc.academicYear.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Kelas {rc.classroom.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-semibold bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-colors">
                  <span className="hidden sm:inline">{expandedId === rc.id ? 'Tutup Detail' : 'Lihat Rapor'}</span>
                  {expandedId === rc.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedId === rc.id && (
                <div className="p-6 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="p-4">Mata Pelajaran</th>
                          <th className="p-4 text-center">KKM</th>
                          <th className="p-4 text-center">Nilai Akhir</th>
                          <th className="p-4 text-center">Predikat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rc.details && rc.details.length > 0 ? rc.details.map((detail) => {
                          let badgeClass = 'bg-gray-100 text-gray-700';
                          if (detail.predicate === 'A') badgeClass = 'bg-emerald-100 text-emerald-700';
                          else if (detail.predicate === 'B') badgeClass = 'bg-blue-100 text-blue-700';
                          else if (detail.predicate === 'C') badgeClass = 'bg-amber-100 text-amber-700';
                          else if (detail.predicate === 'D' || detail.predicate === 'E') badgeClass = 'bg-red-100 text-red-700';

                          return (
                            <tr key={detail.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900">{detail.subject.name}</td>
                              <td className="p-4 text-gray-500 font-medium text-center">{detail.kkm}</td>
                              <td className="p-4 text-gray-900 font-extrabold text-center text-base">{detail.finalScore}</td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                                  {detail.predicate}
                                </span>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500">Data nilai belum diisi untuk rapor ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
