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
    <div className="max-w-7xl mx-auto space-y-6 pb-10 relative pointer-events-auto" onClick={() => setActivePrayer(null)}>
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold self-start md:self-auto">Prayer Tracker</h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium w-full sm:w-auto">
                {['today', 'week', 'month'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={(e) => { e.stopPropagation(); setViewMode(mode); }}
                        className={clsx(
                            "flex-1 sm:flex-none px-4 py-2 rounded-md transition-all capitalize text-center", 
                            viewMode === mode ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft size={20} />
                </button>
                 <span className="font-bold flex-1 text-center text-sm px-2">
                    {viewMode === 'today' && format(currentDate, 'EEEE, MMM d')}
                    {viewMode === 'week' && `${format(gridDays[0], 'MMM d')} - ${format(gridDays[6], 'MMM d')}`}
                    {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                </span>
                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-1 hover:bg-gray-100 rounded-full">
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
        {prayers.map(({ name, icon: Icon }) => {
          const record = getPrayerRecord(name);
          const status = record?.status || 'pending';
          const type = record?.type || 'normal';

          return (
            <div 
              key={name}
              onClick={(e) => onCardClick(e, name)}
              className={clsx(
                "cursor-pointer group relative overflow-hidden transition-all duration-300 border rounded-xl p-6 flex items-center justify-between",
                status === 'on-time' ? "bg-black text-white border-black" : 
                status === 'missed' ? "bg-white border-red-200" : 
                "bg-white border-gray-200 hover:border-black"
              )}
            >
              <div className="flex items-center gap-4 z-10">
                <Icon size={24} className={status === 'on-time' ? 'text-white' : 'text-gray-400'} />
                <span className="text-xl font-medium">{name}</span>
                {status === 'on-time' && type !== 'normal' && (
                    <span className="px-2 py-0.5 rounded textxs font-bold bg-white/20 uppercase text-[10px]">
                        {type === 'jamm-kasar' ? 'Jamm + Kasar' : type}
                    </span>
                )}
              </div>
              
              <div className="z-10 text-sm font-bold uppercase tracking-wider">
                {status === 'on-time' && 'Completed'}
                {status === 'missed' && <span className="text-red-500">Missed</span>}
                {status === 'pending' && <span className="text-gray-400">Pending</span>}
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
          <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
          
          <div 
            className={clsx(
                isMobile 
                  ? "fixed bottom-0 left-0 right-0 w-full z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-200"
                  : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">Update {activePrayer.name}</h3>
                  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                      <X size={16} />
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onSubmit('on-time', 'normal')} 
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-black hover:bg-gray-100 transition-all text-center group"
                  >
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Check size={16} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">Completed</span>
                  </button>

                  <button 
                    onClick={() => onSubmit('on-time', 'jamm')} 
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:bg-blue-100 transition-all text-center group"
                  >
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-xs font-bold">J</span>
                      </div>
                      <span className="text-xs font-bold text-blue-700">Jamm</span>
                  </button>

                  <button 
                    onClick={() => onSubmit('on-time', 'kasar')} 
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-300 hover:bg-purple-100 transition-all text-center group"
                  >
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-xs font-bold">Q</span>
                      </div>
                      <span className="text-xs font-bold text-purple-700">Qasar</span>
                  </button>

                   <button 
                    onClick={() => onSubmit('on-time', 'jamm-kasar')} 
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100 transition-all text-center group"
                  >
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-[8px] font-bold">J+Q</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-700">Both</span>
                  </button>
              </div>

              <div className="mt-2">
                  <button 
                    onClick={() => onSubmit('missed')} 
                    className="w-full p-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="sticky left-0 z-20 bg-white p-4 text-left min-w-[150px] border-b border-r border-gray-100 font-bold text-gray-900 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                            Prayer
                        </th>
                        {gridDays.map(day => (
                            <th key={day.toISOString()} className={clsx(
                                "p-2 min-w-[40px] text-center border-b border-gray-100 text-xs",
                                isToday(day) ? "bg-black text-white" : "text-gray-500"
                            )}>
                                <div className="font-bold">{format(day, 'd')}</div>
                                <div className="text-[10px] font-normal opacity-80">{format(day, 'EEEEE')}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {prayers.map(({ name, icon: Icon }) => (
                        <tr key={name} className="group hover:bg-gray-50 transition-colors">
                             <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 p-4 border-r border-gray-100 font-medium text-gray-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap flex items-center gap-3">
                                <Icon size={16} className="text-gray-400" />
                                {name}
                            </td>
                            {gridDays.map(day => {
                                const record = getPrayerRecord(name, day);
                                const status = record?.status || 'pending';
                                const type = record?.type || 'normal';
                                return (
                                    <td 
                                        key={day.toISOString()} 
                                        className="p-1 border-r border-gray-50 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                                        title={type !== 'normal' ? type : ''}
                                        onClick={() => onStatusToggle(name, day, status)}
                                    >
                                        <div className="flex items-center justify-center">
                                            <div className={clsx(
                                                "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 relative",
                                                status === 'on-time' ? "bg-black" : 
                                                status === 'missed' ? "bg-red-100" : "bg-gray-100 opacity-50"
                                            )}>
                                                {status === 'on-time' && <Check size={12} className="text-white" />}
                                                {status === 'missed' && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                                                {/* Mini Indicator for Type */}
                                                {type === 'kasar' && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500" />}
                                                {type === 'jamm' && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />}
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
