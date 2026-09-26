import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { getMySchedule } from '../../api/studentPortalService';

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

  // Slider State
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollState, 350);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMySchedule();
        setWeeklySchedule(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      updateScrollState();
      const el = sliderRef.current;
      if (el) {
        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);
        return () => {
          el.removeEventListener('scroll', updateScrollState);
          window.removeEventListener('resize', updateScrollState);
        };
      }
    }
  }, [loading, weeklySchedule, updateScrollState]);

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
        icon={Calendar}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 overflow-hidden w-full max-w-full">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Jadwal Mingguan</h3>
            <p className="text-xs text-slate-500 font-normal">Geser untuk melihat jadwal pada hari lainnya</p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-lg transition-colors shadow-2xs border border-slate-200/70 ${
                canScrollLeft 
                  ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed border-transparent'
              }`}
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
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="relative mt-4 w-full min-w-0 max-w-full">
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
          )}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />
          )}

          <div 
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-1 px-1 scroll-pl-1 w-full min-w-0 max-w-full"
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
