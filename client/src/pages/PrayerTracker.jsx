import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Sun, Moon, Cloud, Sunrise, Sunset, ChevronLeft, ChevronRight, Check, X, MapPin, Clock } from 'lucide-react';
import { 
    format, addDays, subDays, isSameDay, isToday, 
    startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
    eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths,
    isAfter, isBefore, differenceInSeconds
} from 'date-fns';
import clsx from 'clsx';
import { useMediaQuery } from '../hooks/useMediaQuery';
import SkeletonPrayerTracker from '../components/skeletons/SkeletonPrayerTracker';
import axios from 'axios';

const PRAYERS_CONFIG = [
  { name: 'Fajr', icon: Sunrise, key: 'Fajr', endKey: 'Sunrise' },
  { name: 'Dhuhr', icon: Sun, key: 'Dhuhr', endKey: 'Asr' },
  { name: 'Asr', icon: Cloud, key: 'Asr', endKey: 'Maghrib' },
  { name: 'Maghrib', icon: Sunset, key: 'Maghrib', endKey: 'Isha' },
  { name: 'Isha', icon: Moon, key: 'Isha', endKey: 'Fajr' }, // Handled specially for next day
];

export default function PrayerTracker() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'week' | 'month'
  const [location, setLocation] = useState(null);
  const [, setCurrentTime] = useState(new Date());

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Selection State
  const [activePrayer, setActivePrayer] = useState(null); // { name: 'Fajr', rect: DOMRect }
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.error("Error getting location:", error);
                // Fallback (e.g., Calicut/Kerala coordinates or IP based via API default)
                // Using a default generic location if blocked, or letting API guess by IP if we omitted params, 
                // but aladhan requires params or city. Let's default to a known location if failed or keep null to try IP based if api supports it (it doesn't easily without city).
                // For now, we'll just leave it null and handle loading state or prompt.
            }
        );
    }
  }, []);

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

  // Fetch Prayer Times (External API)
  const { data: prayerTimesData } = useQuery({
      queryKey: ['external-prayer-times', currentDate.toISOString().split('T')[0], location],
      queryFn: async () => {
          if (!location) return null;
          // Fetching for the specific date
          const dateStr = format(currentDate, 'dd-MM-yyyy'); // Aladhan format
          const response = await axios.get('https://api.aladhan.com/v1/timings/' + dateStr, {
              params: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  method: 2, // ISNA usually, or 1 (Egyptian), 3 (Muslim World League). Let's use 2 or make generic. 
                  // 2 is ISNA. 3 is Muslim World League.
                  // Defaulting to auto-detection/general ISNA might be safe, or 3. 
                  // Let's stick to standard params.
              }
          });
          return response.data.data;
      },
      enabled: !!location
  });

  // Also need next day Fajr for Isha countdown
   const { data: nextDayPrayerTimes } = useQuery({
      queryKey: ['external-prayer-times-next', addDays(currentDate, 1).toISOString().split('T')[0], location],
      queryFn: async () => {
          if (!location) return null;
          const dateStr = format(addDays(currentDate, 1), 'dd-MM-yyyy');
          const response = await axios.get('https://api.aladhan.com/v1/timings/' + dateStr, {
              params: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  method: 2, 
              }
          });
          return response.data.data;
      },
      enabled: !!location && viewMode === 'today' // Only needed for today view really
  });


  // Fetch User Records (Our Backend)
  const { data: prayers, isLoading } = useQuery({
    queryKey: ['prayers', viewMode, currentDate.toISOString(), gridDays[0]?.toISOString(), location],
    queryFn: async () => {
        const params = new URLSearchParams();
        if (location) {
            params.append('latitude', location.latitude);
            params.append('longitude', location.longitude);
        }

        if (viewMode === 'today') {
            params.append('date', currentDate.toISOString());
        } else {
            const start = gridDays[0].toISOString();
            const end = gridDays[gridDays.length - 1].toISOString();
            params.append('startDate', start);
            params.append('endDate', end);
        }
        
        const { data } = await api.get(`/prayers?${params.toString()}`);
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

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return 'Missed';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getPrayerTimeInfo = (prayerKey, endKey, timings, nextDayTimings) => {
      if (!timings) return { time: '--:--', timeLeft: null, status: 'unknown' };

      const timeStr = timings.timings[prayerKey]; // "05:30"
      if (!timeStr) return { time: '--:--', timeLeft: null };

      // Parse current prayer time
      const [h, m] = timeStr.split(':').map(Number);
      const prayerDate = new Date(currentDate);
      prayerDate.setHours(h, m, 0, 0);

      // Determine End Time (Kalah)
      let endDate = new Date(currentDate);
      let endTimeStr = timings.timings[endKey]; // "18:45"
      
      // Special case for Isha ending at Fajr next day
      if (prayerKey === 'Isha' && endKey === 'Fajr') {
          if (nextDayTimings) {
             const [nextH, nextM] = nextDayTimings.timings['Fajr'].split(':');
             endDate = addDays(currentDate, 1);
             endDate.setHours(nextH, nextM, 0, 0);
          } else {
             // Fallback if next day not loaded yet, assume same time approximately or skip
              return { time: timeStr, timeLeft: null, isCurrent: false };
          }
      } else {
          // Standard case
          const [endH, endM] = endTimeStr.split(':');
          endDate.setHours(endH, endM, 0, 0);
      }
      
      const now = new Date();
      // Check if this prayer window is currently active
      // It is active if NOW is between prayerDate and endDate
      // BUT we only show countdown if it is technically 'time for this prayer'
      
      // Calculate seconds remaining until 'Kalah'
      const secondsLeft = differenceInSeconds(endDate, now);
      
      const isWindowActive = isAfter(now, prayerDate) && isBefore(now, endDate);
      const isUpcoming = isBefore(now, prayerDate);
      
      return {
          time: timeStr,
          timeLeft: isWindowActive ? secondsLeft : null,
          isCurrent: isWindowActive,
          isUpcoming
      };
  };

  if (isLoading) return <SkeletonPrayerTracker />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 relative pointer-events-auto animate-fade-in" onClick={() => setActivePrayer(null)}>
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-col items-start gap-1 w-full md:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold self-start soft-gradient-text tracking-tight">Prayer Tracker</h1>
            {location && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100/50">
                    <MapPin size={12} className="text-primary/70" />
                    <span>Location Active</span>
                </div>
            )}
             {!location && (
                <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 hover:bg-red-100 cursor-pointer">
                    <MapPin size={12} />
                    <span>Enable Location</span>
                </button>
            )}
        </div>
        
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
          <div className="space-y-4 max-w-2xl mx-auto">
             {/* Global Countdown Card (Optional - showing next prayer or current active) */}
             
             {PRAYERS_CONFIG.map(({ name, icon: Icon, key, endKey }, idx) => {
                const record = getPrayerRecord(name, currentDate);
                const status = record?.status || 'pending';
                const type = record?.type || 'normal';
                
                // Get Time Info
                const { time, timeLeft, isCurrent } = getPrayerTimeInfo(key, endKey, prayerTimesData, nextDayPrayerTimes);

                return (
                    <div 
                    key={name}
                    onClick={(e) => handleCardClick(e, name)}
                    className={clsx(
                        "cursor-pointer group relative overflow-hidden transition-all duration-300 rounded-3xl p-6 shadow-sm hover:shadow-soft hover:scale-[1.02] border animate-fade-in",
                        status === 'on-time' ? "bg-gradient-to-br from-wellness-mint to-teal-50 border-teal-100" : 
                        status === 'missed' ? "bg-wellness-rose/30 border-red-100" : 
                        isCurrent ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-100" :
                        "bg-white border-gray-100 hover:border-gray-200"
                    )}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        {isCurrent && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        )}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10" />
                    
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
                            <div className="flex items-center gap-5">
                                <div className={clsx(
                                    "p-3 rounded-2xl transition-colors shrink-0", 
                                    status === 'on-time' ? "bg-teal-500 text-white shadow-md" : 
                                    isCurrent ? "bg-blue-500 text-white shadow-md" :
                                    "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
                                )}>
                                    <Icon size={24} weight={(status === 'on-time' || isCurrent) ? "fill" : "regular"} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className={clsx("text-xl font-bold", status === 'on-time' ? "text-teal-900" : "text-primary")}>{name}</span>
                                        {time !== '--:--' && (
                                            <span className="text-sm font-semibold text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                {time}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Additional Status Text */}
                                    {status === 'on-time' && type !== 'normal' && (
                                        <span className="mt-1 inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/40 border border-white/20 uppercase text-teal-800 tracking-wider">
                                            {type === 'jamm-kasar' ? 'Jamm + Kasar' : type}
                                        </span>
                                    )}
                                </div>
                            </div>
                    
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                {/* Timer Display if active and pending */}
                                {isCurrent && status === 'pending' && timeLeft !== null && (
                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm animate-pulse-slow">
                                        <Clock size={16} />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Time Left</span>
                                            <span className="text-sm font-monofont-bold font-mono min-w-[70px]">{formatCountdown(timeLeft)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    {status === 'on-time' && <span className="text-teal-600 flex items-center gap-1"><Check size={16} /> Completed</span>}
                                    {status === 'missed' && <span className="text-red-500 bg-red-100 px-3 py-1 rounded-lg">Missed</span>}
                                    {status === 'pending' && !isCurrent && <span className="text-muted bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-gray-100 transition-colors">Pending</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
          </div>
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
            prayers={PRAYERS_CONFIG}
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
