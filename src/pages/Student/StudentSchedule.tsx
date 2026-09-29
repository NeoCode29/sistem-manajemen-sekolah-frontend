import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { getMySchedule } from '../../api/studentPortalService';
import { useHorizontalSlider } from '../../hooks/useHorizontalSlider';

interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

interface DailySchedule {
  dayName: string;
  schedules: ScheduleItem[];
}

export const StudentSchedule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [weeklySchedule, setWeeklySchedule] = useState<DailySchedule[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const {
    sliderRef,
    canScrollLeft,
    canScrollRight,
    scrollSlider,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  } = useHorizontalSlider({
    gap: 16,
    dependencies: [weeklySchedule, loading]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMySchedule();
        const scheduleList = Array.isArray(data) ? data : [];
        setWeeklySchedule(scheduleList);

        if (scheduleList.length > 0) {
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const todayName = dayNames[new Date().getDay()];
          const foundIdx = scheduleList.findIndex(
            (s) => s.dayName.toLowerCase() === todayName.toLowerCase()
          );
          if (foundIdx !== -1) {
            setSelectedDayIndex(foundIdx);
          } else {
            setSelectedDayIndex(0);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-indigo-600 gap-3">
        <RefreshCw size={32} className="animate-spin" />
        <span className="font-medium text-sm text-slate-500">Memuat Jadwal Pelajaran...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Jadwal Pelajaran" 
        subtitle="Lihat jadwal mata pelajaran Anda selama satu minggu penuh"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 md:p-8 overflow-hidden w-full max-w-full">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Jadwal Mingguan</h3>
            <p className="text-xs text-slate-500 font-normal">
              {weeklySchedule.length > 0 ? 'Pilih hari atau geser untuk melihat jadwal kelas' : 'Belum ada jadwal'}
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-lg transition-colors shadow-2xs border border-slate-200/70 ${
                canScrollLeft 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed border-transparent'
              }`}
              title="Geser ke kiri"
              aria-label="Geser ke kiri"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider('right')}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-lg transition-colors shadow-2xs border border-slate-200/70 ${
                canScrollRight 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed border-transparent'
              }`}
              title="Geser ke kanan"
              aria-label="Geser ke kanan"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Mobile View: Day Selector Pills */}
        <div className="block md:hidden mt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            {weeklySchedule.map((day, idx) => (
              <button
                key={day.dayName}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedDayIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span>{day.dayName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedDayIndex === idx ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {day.schedules.length}
                </span>
              </button>
            ))}
          </div>

          {/* Active Single Day Timeline */}
          {weeklySchedule[selectedDayIndex] && (
            <div className="mt-2 space-y-3">
              {weeklySchedule[selectedDayIndex].schedules.length > 0 ? (
                weeklySchedule[selectedDayIndex].schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-2xs hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-bold text-slate-700 font-mono shadow-2xs">
                        <Clock size={12} className="text-indigo-600" />
                        <span>{schedule.time}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                        <MapPin size={11} className="text-purple-600" />
                        <span>{schedule.room || 'Kelas'}</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug break-words">
                      {schedule.subject}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{schedule.teacher || 'Guru Pengampu'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                    <BookOpen size={20} />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Tidak ada jadwal pelajaran</p>
                  <p className="text-xs text-slate-400">
                    Tidak ada agenda pembelajaran di hari {weeklySchedule[selectedDayIndex]?.dayName}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tablet & Desktop View: Horizontal Weekly Cards Slider */}
        <div className="hidden md:block relative mt-4 w-full min-w-0 max-w-full">
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
          )}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />
          )}

          <div 
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="flex gap-4 overflow-x-auto snap-x snap-proximity scroll-smooth pb-4 pt-1 px-1 scroll-pl-1 w-full min-w-0 max-w-full select-none cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'thin' }}
          >
            {weeklySchedule?.map((daySchedule, idx) => (
              <div 
                key={idx} 
                className="w-[280px] sm:w-[320px] shrink-0 snap-start flex flex-col border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:border-indigo-300 transition-colors bg-white h-auto"
              >
                <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">{daySchedule.dayName}</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-indigo-100 rounded-md text-indigo-600 shadow-2xs">
                    {daySchedule.schedules.length} Kelas
                  </span>
                </div>
                
                <div className="p-4 flex-1 flex flex-col gap-3 h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {daySchedule.schedules.length > 0 ? (
                    daySchedule.schedules.map((schedule) => (
                      <div key={schedule.id} className="relative pl-4 py-2 border-l-2 border-slate-200 hover:border-indigo-500 transition-colors group">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono mb-1.5 bg-slate-100/70 w-fit px-2 py-0.5 rounded-md">
                          <Clock size={12} className="text-indigo-500" />
                          <span>{schedule.time}</span>
                        </div>
                        
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-2">
                          {schedule.subject}
                        </h4>
                        
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                            <User size={13} className="shrink-0 mt-0.5 text-slate-400" />
                            <span className="leading-tight">{schedule.teacher}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <MapPin size={13} className="shrink-0 text-slate-400" />
                            <span className="leading-tight">{schedule.room}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 h-full">
                      <BookOpen size={24} className="mb-2 opacity-30" />
                      <span className="text-xs font-medium">Tidak ada jadwal</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
