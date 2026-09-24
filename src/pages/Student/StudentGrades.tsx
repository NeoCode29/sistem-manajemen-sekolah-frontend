import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, ChevronDown, ChevronUp, Award } from 'lucide-react';
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
        // Auto-expand the first report card if available
        if (data.length > 0) {
          setExpandedId(data[0].id);
        }
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
        <span className="ml-3 font-medium text-sm">Memuat data nilai...</span>
      </div>
    );
  }

  const getPredicateBadgeClass = (pred?: string) => {
    if (pred === 'A') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (pred === 'B') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (pred === 'C') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto page-enter pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs border border-blue-100 flex-shrink-0">
          <BookOpen size={22} />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
            Nilai & Rapor Akademik
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Lihat dan pantau nilai mata pelajaran serta capaian rapor per semester.
          </p>
        </div>
      </div>

      {reportCards.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 sm:p-12 border-2 border-dashed border-gray-200 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Belum Ada Rapor</h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto">
            Data nilai rapor belum dipublikasikan oleh wali kelas atau belum tersedia.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          {reportCards.map((rc) => (
            <div
              key={rc.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Accordion Trigger */}
              <div
                className={`p-4 sm:p-6 flex items-center justify-between cursor-pointer transition-colors gap-3 ${
                  expandedId === rc.id ? 'bg-indigo-50/40' : 'hover:bg-gray-50/60'
                }`}
                onClick={() => setExpandedId(expandedId === rc.id ? null : rc.id)}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 leading-snug truncate">
                    Rapor Semester {rc.semester.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-500 font-medium">
                    <span className="px-2.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[11px] font-semibold">
                      TA {rc.academicYear.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold">
                      Kelas {rc.classroom.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 font-bold text-xs sm:text-sm bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-indigo-100 shadow-2xs flex-shrink-0">
                  <span className="hidden sm:inline">
                    {expandedId === rc.id ? 'Tutup Detail' : 'Lihat Rapor'}
                  </span>
                  {expandedId === rc.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Accordion Content */}
              {expandedId === rc.id && (
                <div className="p-4 sm:p-6 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  {/* Tampilan Desktop / Tablet: Tabel */}
                  <div className="hidden sm:block mt-5 overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                        <tr>
                          <th className="p-4">Mata Pelajaran</th>
                          <th className="p-4 text-center">KKM</th>
                          <th className="p-4 text-center">Nilai Akhir</th>
                          <th className="p-4 text-center">Predikat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rc.details && rc.details.length > 0 ? (
                          rc.details.map((detail) => (
                            <tr key={detail.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900">{detail.subject.name}</td>
                              <td className="p-4 text-gray-500 font-medium text-center">{detail.kkm}</td>
                              <td className="p-4 text-gray-900 font-black text-center text-base">
                                {detail.finalScore}
                              </td>
                              <td className="p-4 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold border ${getPredicateBadgeClass(
                                    detail.predicate
                                  )}`}
                                >
                                  {detail.predicate}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                              Data nilai belum diisi untuk rapor ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Tampilan Mobile: Kartu Nilai Ringkas */}
                  <div className="sm:hidden mt-4 flex flex-col gap-2.5">
                    {rc.details && rc.details.length > 0 ? (
                      rc.details.map((detail) => (
                        <div
                          key={detail.id}
                          className="p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-gray-900 leading-tight mb-1 truncate">
                              {detail.subject.name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              KKM: <span className="font-semibold text-gray-700">{detail.kkm}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-base font-black text-gray-900 leading-tight">
                                {detail.finalScore}
                              </div>
                            </div>
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border ${getPredicateBadgeClass(
                                detail.predicate
                              )}`}
                            >
                              {detail.predicate}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-xs bg-gray-50 rounded-xl">
                        Data nilai belum diisi untuk rapor ini.
                      </div>
                    )}
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
