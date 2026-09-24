import React, { useEffect, useState } from 'react';
import { AlertTriangle, Award, ShieldAlert, Calendar, Star, Info } from 'lucide-react';
import { getMyDiscipline, type DisciplineData } from '../../api/studentPortalService';

export const StudentDiscipline: React.FC = () => {
  const [data, setData] = useState<DisciplineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'violations'>('achievements');

  useEffect(() => {
    const fetchDiscipline = async () => {
      try {
        const response = await getMyDiscipline();
        setData(response);
      } catch (error) {
        console.error('Failed to fetch discipline data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscipline();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 font-medium text-sm">Memuat data kedisiplinan...</span>
      </div>
    );
  }

  const totalAchievementPoints =
    data?.achievements?.reduce((sum, item) => sum + (item.points || 0), 0) || 0;
  const totalViolationPoints =
    data?.violations?.reduce((sum, item) => sum + (item.points || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto page-enter pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-2xs border border-orange-100 flex-shrink-0">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
            Kedisiplinan & Prestasi
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Pantau catatan prestasi yang diraih dan rekam jejak kedisiplinan siswa.
          </p>
        </div>
      </div>

      {/* Ringkasan Poin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 sm:p-6 text-white shadow-md shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-emerald-100" />
            <span className="font-bold text-emerald-100 uppercase tracking-wider text-[11px]">
              Total Poin Prestasi
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black">{totalAchievementPoints}</div>
          <div className="text-xs text-emerald-100/80 mt-1 font-medium">Poin apresiasi akademik & non-akademik</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-md shadow-red-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-100" />
            <span className="font-bold text-red-100 uppercase tracking-wider text-[11px]">
              Total Poin Penalti
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black">{totalViolationPoints}</div>
          <div className="text-xs text-red-100/80 mt-1 font-medium">Akumulasi poin teguran tata tertib</div>
        </div>
      </div>

      {/* Responsive Tab Buttons */}
      <div className="flex w-full sm:w-max gap-1.5 sm:gap-2 mb-5 sm:mb-6 bg-gray-100 p-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'achievements'
              ? 'bg-white text-emerald-600 shadow-xs border border-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Award size={16} />
          <span>Prestasi ({data?.achievements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('violations')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'violations'
              ? 'bg-white text-red-600 shadow-xs border border-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <AlertTriangle size={16} />
          <span>Pelanggaran ({data?.violations?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'achievements' && (
          <div className="animate-in fade-in duration-300">
            {data?.achievements && data.achievements.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.achievements.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 hover:bg-emerald-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 leading-snug">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-500 font-medium mb-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                            {item.category}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>Tingkat {item.level}</span>
                          {item.rank && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1 text-amber-600 font-bold">
                                <Star size={13} className="text-amber-500 fill-amber-500" />
                                Juara {item.rank}
                              </span>
                            </>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-xs sm:text-sm bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex items-start gap-2 leading-relaxed">
                            <Info size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                            <span>{item.description}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {new Date(item.eventDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200 shadow-2xs">
                          +{item.points} Poin
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award size={26} className="text-emerald-500" />
                </div>
                <p className="font-semibold text-sm text-gray-800">Belum ada catatan prestasi.</p>
                <p className="text-xs text-gray-400 mt-1">Raihlah prestasi terbaikmu bersama sekolah!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="animate-in fade-in duration-300">
            {data?.violations && data.violations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.violations.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 hover:bg-red-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 leading-snug">
                          {item.title || 'Pelanggaran Tata Tertib'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${
                              item.category === 'BERAT'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : item.category === 'SEDANG'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            Kategori {item.category || 'RINGAN'}
                          </span>
                        </div>
                        {item.actionTaken && (
                          <div className="text-gray-600 text-xs sm:text-sm bg-gray-50/80 p-3 rounded-xl border border-gray-100 leading-relaxed">
                            <span className="text-gray-900 font-bold block mb-1">Tindakan / Sanksi:</span>
                            {item.actionTaken}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {new Date(item.violationDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-black border border-red-200 shadow-2xs">
                          +{item.points} Poin Penalti
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert size={26} className="text-emerald-500" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Bagus Sekali! 🎉</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Tidak ada catatan pelanggaran tata tertib sekolah. Pertahankan kedisiplinanmu!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
