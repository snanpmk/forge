import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Sun, Moon, Cloud, Sunrise, Sunset, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { 
    format, addDays, subDays, isSameDay, isToday, 
    startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
    eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths 
} from 'date-fns';
import clsx from 'clsx';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Loader from '../components/Loader';

const PRAYERS = [
  { name: 'Fajr', icon: Sunrise },
  { name: 'Dhuhr', icon: Sun },
  { name: 'Asr', icon: Cloud },
  { name: 'Maghrib', icon: Sunset },
  { name: 'Isha', icon: Moon },
];

export default function PrayerTracker() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'week' | 'month'
  
  // Selection State
  const [activePrayer, setActivePrayer] = useState(null); // { name: 'Fajr', rect: DOMRect }
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Generate days for grid
  const gridDays = useMemo(() => {
    if (viewMode === 'today') {
        return [currentDate];
    } else if (viewMode === 'week') {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    } else {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Navigation Handlers
  const handlePrev = () => {
      if (viewMode === 'today') setCurrentDate(prev => subDays(prev, 1));
      else setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1));
  };

  const handleNext = () => {
      if (viewMode === 'today') setCurrentDate(prev => addDays(prev, 1));
      else setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1));
  };

  // Fetch Prayers
  const { data: prayers, isLoading } = useQuery({
    queryKey: ['prayers', viewMode, currentDate.toISOString(), gridDays[0]?.toISOString()],
    queryFn: async () => {
        let url = '';
        if (viewMode === 'today') {
            url = `/prayers?date=${currentDate.toISOString()}`;
        } else {
            const start = gridDays[0].toISOString();
            const end = gridDays[gridDays.length - 1].toISOString();
            url = `/prayers?startDate=${start}&endDate=${end}`;
        }
        const { data } = await api.get(url);
        return data;
    },
  });

  // Update Status
  const statusMutation = useMutation({
    mutationFn: async ({ name, status, date, type }) => {
      return api.post('/prayers/log', { 
        name, 
        status, 
        date,
        type
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prayers']);
      queryClient.invalidateQueries(['dashboard']);
      setActivePrayer(null);
    },
  });

  const getPrayerRecord = (name, date) => {
    return prayers?.find(p => p.name === name && isSameDay(new Date(p.date), date));
  };

  // Open Selection Menu
  const handleCardClick = (e, name) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setActivePrayer({ name, top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
  };

  const submitStatus = (status, type = 'normal') => {
      if (!activePrayer) return;
      statusMutation.mutate({ name: activePrayer.name, status, date: currentDate, type });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 relative pointer-events-auto animate-fade-in" onClick={() => setActivePrayer(null)}>
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold self-start md:self-auto soft-gradient-text tracking-tight">Prayer Tracker</h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* View Toggle */}
            <div className="bg-white p-1 rounded-2xl shadow-soft flex text-sm font-bold w-full sm:w-auto border border-gray-100">
                {['today', 'week', 'month'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
                        className={clsx(
                            "flex-1 sm:flex-none px-5 py-2.5 rounded-xl transition-all capitalize text-center", 
                            viewMode === mode 
                                ? "bg-primary text-white shadow-md transform scale-105" 
                                : "text-muted hover:text-primary hover:bg-gray-50"
                        )}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg shadow-soft border border-gray-100 w-full sm:w-auto h-full">
                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-muted hover:text-primary">
                    <ChevronLeft size={20} />
                </button>
                 <span className="font-bold flex-1 text-center text-sm px-4 text-primary whitespace-nowrap min-w-[140px]">
                    {viewMode === 'today' && format(currentDate, 'EEEE, MMM d')}
                    {viewMode === 'week' && `${format(gridDays[0], 'MMM d')} - ${format(gridDays[6], 'MMM d')}`}
                    {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                </span>
                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-muted hover:text-primary">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'today' && (
          <PrayerTodayList 
             prayers={PRAYERS} 
             getPrayerRecord={(name) => getPrayerRecord(name, currentDate)}
             onCardClick={handleCardClick}
          />
      )}

      {/* Selection Menu (Bottom Sheet on Mobile, Popover on Desktop) */}
      {activePrayer && (
        <PrayerStatusMenu 
            activePrayer={activePrayer}
            onSubmit={submitStatus}
            onClose={() => setActivePrayer(null)}
            isMobile={isMobile}
        />
      )}

      {viewMode !== 'today' && (
        <PrayerGrid 
            prayers={PRAYERS}
            gridDays={gridDays}
            getPrayerRecord={getPrayerRecord}
            onStatusToggle={(name, day, status) => {
                const newStatus = status === 'pending' ? 'on-time' : 'pending';
                statusMutation.mutate({ name, status: newStatus, date: day, type: 'normal' });
            }}
        />
      )}
    </div>
  );
}



// Sub-components

function PrayerTodayList({ prayers, getPrayerRecord, onCardClick }) {
    return (
        <div className="space-y-4 max-w-2xl mx-auto">
        {prayers.map(({ name, icon: Icon }, idx) => {
          const record = getPrayerRecord(name);
          const status = record?.status || 'pending';
          const type = record?.type || 'normal';

          return (
            <div 
              key={name}
              onClick={(e) => onCardClick(e, name)}
              className={clsx(
                "cursor-pointer group relative overflow-hidden transition-all duration-300 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-soft hover:scale-[1.02] border animate-fade-in",
                status === 'on-time' ? "bg-gradient-to-br from-wellness-mint to-teal-50 border-teal-100" : 
                status === 'missed' ? "bg-wellness-rose/30 border-red-100" : 
                "bg-white border-gray-100 hover:border-gray-200"
              )}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <div className="flex items-center gap-5 z-10">
                <div className={clsx("p-3 rounded-2xl transition-colors", status === 'on-time' ? "bg-teal-500 text-white shadow-md" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600")}>
                    <Icon size={24} weight={status === 'on-time' ? "fill" : "regular"} />
                </div>
                <div>
                    <span className={clsx("text-xl font-bold block", status === 'on-time' ? "text-teal-900" : "text-primary")}>{name}</span>
                    {status === 'on-time' && type !== 'normal' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/40 border border-white/20 uppercase text-teal-800 tracking-wider">
                            {type === 'jamm-kasar' ? 'Jamm + Kasar' : type}
                        </span>
                    )}
                </div>
              </div>
              
              <div className="z-10 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                {status === 'on-time' && <span className="text-teal-600 flex items-center gap-1"><Check size={16} /> Completed</span>}
                {status === 'missed' && <span className="text-red-500 bg-red-100 px-3 py-1 rounded-lg">Missed</span>}
                {status === 'pending' && <span className="text-muted bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-gray-100 transition-colors">Pending</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
}

function PrayerStatusMenu({ activePrayer, onSubmit, onClose, isMobile }) {
    if (!activePrayer) return null;

    return (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
          
          <div 
            className={clsx(
                isMobile 
                  ? "fixed bottom-0 left-0 right-0 w-full z-50 bg-white rounded-t-3xl shadow-soft-hover border-t border-gray-100 p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-10 duration-300"
                  : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-soft-hover border border-gray-100 p-6 w-80 animate-in fade-in zoom-in-95 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xl text-primary">Update {activePrayer.name}</h3>
                  <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors">
                      <X size={20} />
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onSubmit('on-time', 'normal')} 
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-black/10 hover:bg-gray-100 hover:shadow-soft transition-all text-center group"
                  >
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                          <Check size={20} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Completed</span>
                  </button>

                  <button 
                    onClick={() => onSubmit('on-time', 'jamm')} 
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-wellness-blue/20 border border-blue-100 hover:border-blue-200 hover:bg-wellness-blue/40 hover:shadow-soft transition-all text-center group"
                  >
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                          <span className="text-sm font-bold">J</span>
                      </div>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Jamm</span>
                  </button>

                  <button 
                    onClick={() => onSubmit('on-time', 'kasar')} 
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-wellness-lavender/40 border border-purple-100 hover:border-purple-200 hover:bg-wellness-lavender/60 hover:shadow-soft transition-all text-center group"
                  >
                      <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                          <span className="text-sm font-bold">Q</span>
                      </div>
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Qasar</span>
                  </button>

                   <button 
                    onClick={() => onSubmit('on-time', 'jamm-kasar')} 
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-wellness-indigo/40 border border-indigo-100 hover:border-indigo-200 hover:bg-wellness-indigo/60 hover:shadow-soft transition-all text-center group"
                  >
                      <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                          <span className="text-[10px] font-bold">J+Q</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Both</span>
                  </button>
              </div>

              <div className="mt-2">
                  <button 
                    onClick={() => onSubmit('missed')} 
                    className="w-full p-3 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                      Mark as Missed
                  </button>
              </div>
          </div>
        </>
    );
}

function PrayerGrid({ prayers, gridDays, getPrayerRecord, onStatusToggle }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden flex flex-col animate-fade-in">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="sticky left-0 top-0 z-30 bg-white p-4 text-left min-w-[160px] md:min-w-[200px] border-b border-r border-gray-100 font-bold text-primary shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                            Prayer
                        </th>
                        {gridDays.map(day => (
                            <th key={day.toISOString()} className={clsx(
                                "sticky top-0 z-20 p-2 min-w-[48px] md:min-w-[56px] text-center border-b border-gray-100 text-xs",
                                isToday(day) ? "bg-primary text-white" : "bg-white text-muted"
                            )}>
                                <div className="font-bold text-sm">{format(day, 'd')}</div>
                                <div className={clsx("text-[10px] font-bold uppercase", isToday(day) ? "opacity-80" : "text-gray-400")}>{format(day, 'EEE')}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {prayers.map(({ name, icon: Icon }) => (
                        <tr key={name} className="group hover:bg-gray-50/50 transition-colors">
                             <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 p-4 border-r border-gray-100 font-bold text-primary shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap flex items-center gap-3 transition-colors text-sm md:text-base">
                                <Icon size={18} className="text-muted" />
                                {name}
                            </td>
                            {gridDays.map(day => {
                                const record = getPrayerRecord(name, day);
                                const status = record?.status || 'pending';
                                const type = record?.type || 'normal';
                                return (
                                    <td 
                                        key={day.toISOString()} 
                                        className="p-1 border-r border-gray-50/50 text-center cursor-pointer hover:bg-gray-100/50 transition-colors"
                                        title={type !== 'normal' ? type : ''}
                                        onClick={() => onStatusToggle(name, day, status)}
                                    >
                                        <div className="flex items-center justify-center h-12 w-full">
                                            <div className={clsx(
                                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 relative shadow-sm",
                                                status === 'on-time' ? "bg-wellness-mint text-teal-700 shadow-soft" : 
                                                status === 'missed' ? "bg-wellness-rose text-red-500 shadow-soft" : 
                                                "bg-white border border-gray-100 text-gray-300 hover:border-gray-300 hover:scale-90"
                                            )}>
                                                {status === 'on-time' && <Check size={16} strokeWidth={3} />}
                                                {status === 'missed' && <X size={16} strokeWidth={3} />}
                                                {status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                                                
                                                {/* Mini Indicator for Type */}
                                                {type === 'kasar' && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] flex items-center justify-center rounded-full bg-purple-500 text-white font-bold border-2 border-white shadow-sm">Q</div>}
                                                {type === 'jamm' && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] flex items-center justify-center rounded-full bg-blue-500 text-white font-bold border-2 border-white shadow-sm">J</div>}
                                                {type === 'jamm-kasar' && <div className="absolute -top-1.5 -right-1.5 w-5 h-4 text-[8px] flex items-center justify-center rounded-full bg-indigo-500 text-white font-bold border-2 border-white shadow-sm">JQ</div>}
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
}
