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
        <span className="ml-3 font-medium">Memuat data kedisiplinan...</span>
      </div>
    );
  }

  const totalAchievementPoints = data?.achievements?.reduce((sum, item) => sum + (item.points || 0), 0) || 0;
  const totalViolationPoints = data?.violations?.reduce((sum, item) => sum + (item.points || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shadow-sm border border-orange-100">
          <ShieldAlert size={24} className="text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Kedisiplinan & Prestasi</h2>
          <p className="text-sm text-gray-500 font-medium">Pantau catatan prestasi yang membanggakan dan rekam jejak kedisiplinan.</p>
        </div>
      </div>

      {/* Ringkasan Poin */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-2 mb-2">
            <Award size={20} className="text-emerald-100" />
            <span className="font-semibold text-emerald-100 uppercase tracking-wider text-xs">Total Poin Prestasi</span>
          </div>
          <div className="text-4xl font-black">{totalAchievementPoints}</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-100" />
            <span className="font-semibold text-red-100 uppercase tracking-wider text-xs">Total Poin Penalti</span>
          </div>
          <div className="text-4xl font-black">{totalViolationPoints}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-max">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'achievements' 
              ? 'bg-white text-emerald-600 shadow-sm border border-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Award size={18} /> Daftar Prestasi
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'violations' 
              ? 'bg-white text-red-600 shadow-sm border border-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <AlertTriangle size={18} /> Daftar Pelanggaran
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'achievements' && (
          <div className="animate-in fade-in duration-300">
            {data?.achievements && data.achievements.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.achievements.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-emerald-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 font-medium mb-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">{item.category}</span>
                          <span className="text-gray-300">|</span>
                          <span>{item.level}</span>
                          {item.rank && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1"><Star size={14} className="text-amber-500" /> Peringkat {item.rank}</span>
                            </>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2">
                            <Info size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                          <Calendar size={16} /> {new Date(item.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200 shadow-sm ml-auto sm:ml-0">
                          +{item.points} Poin
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={28} className="text-emerald-400" />
                </div>
                <p className="font-medium">Belum ada catatan prestasi yang diraih.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="animate-in fade-in duration-300">
            {data?.violations && data.violations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.violations.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-red-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5">{item.title || 'Pelanggaran Kedisiplinan'}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-3">
                          <span className={`px-2.5 py-0.5 rounded-md border font-bold ${
                            item.category === 'BERAT' ? 'bg-red-50 text-red-700 border-red-200' : 
                            item.category === 'SEDANG' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {item.category || 'RINGAN'}
                          </span>
                        </div>
                        {item.actionTaken && (
                          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <strong className="text-gray-900 block mb-1">Tindakan / Sanksi:</strong> 
                            {item.actionTaken}
                          </p>
                        )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                          <Calendar size={16} /> {new Date(item.violationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold border border-red-200 shadow-sm ml-auto sm:ml-0">
                          +{item.points} Poin Penalti
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Bagus Sekali!</h3>
                <p className="font-medium">Tidak ada catatan pelanggaran kedisiplinan.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
