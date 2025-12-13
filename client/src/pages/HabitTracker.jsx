import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Check, Plus, Trash2, Zap, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Loader from '../components/Loader';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday, 
  startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, getDay, getDate
} from 'date-fns';

import Modal from '../components/ui/Modal';
import HabitForm from '../components/HabitForm';

export default function HabitTracker() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  /* Removed unused handlers */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'week' | 'month'

  // Generate days for grid
  const gridDays = useMemo(() => {
    if (viewMode === 'today') {
        return [currentDate];
    } else if (viewMode === 'week') {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
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

  // Fetch Habits
  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data } = await api.get('/habits');
      return data;
    },
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (habitData) => api.post('/habits', habitData),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries(['dashboard']);
      setIsAddModalOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, date, completed }) => {
        return api.put(`/habits/${id}/log`, { date, completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries(['dashboard']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newHabit.title.trim()) return;
    addMutation.mutate(newHabit);
  };

  const isCompleted = (habit, date) => {
    return habit.logs.some(log => isSameDay(new Date(log.date), date) && log.completed);
  };

  const isHabitScheduledForDate = (habit, date) => {
    const { frequency, schedule } = habit;
    if (!frequency || frequency === 'daily') return true;
    
    if (frequency === 'weekly') {
      const dayOfWeek = getDay(date); // 0-6
      return schedule?.daysOfWeek?.includes(dayOfWeek);
    }
    
    if (frequency === 'monthly') {
      const dayOfMonth = getDate(date); // 1-31
      return schedule?.daysOfMonth?.includes(dayOfMonth);
    }
    
    return true;
  };

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col lg:flex-row items-center justify-between py-3 gap-6">
        <h1 className="text-2xl md:text-3xl font-bold">Habit Tracker</h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium w-full sm:w-auto justify-center">
                {['today', 'week', 'month'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={clsx(
                            "px-3 py-1.5 md:px-4 rounded-md transition-all capitalize flex-1 sm:flex-none text-center", 
                            viewMode === mode ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                {/* Navigation */}
                <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl shadow-sm border border-gray-100 flex-1 sm:flex-none justify-between sm:justify-start">
                    <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold min-w-[120px] text-center text-xs md:text-sm truncate px-2">
                        {viewMode === 'today' && format(currentDate, 'EEE, MMM d')}
                        {viewMode === 'week' && `${format(gridDays[0], 'MMM d')} - ${format(gridDays[6], 'MMM d')}`}
                        {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-full">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Add Button */}
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-black text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20 flex-shrink-0"
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Habit">
          <HabitForm 
            onSubmit={(data) => addMutation.mutate(data)}
            onCancel={() => setIsAddModalOpen(false)}
          />
      </Modal>

      {/* Today View (Simple List) */}
      {viewMode === 'today' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits?.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-gray-400">
                      No habits added yet. Start tracking!
                  </div>
              ) : (
                  habits?.filter(h => isHabitScheduledForDate(h, currentDate)).map(habit => {
                      const completed = isCompleted(habit, currentDate);
                      return (
                          <div 
                              key={habit._id} 
                              onClick={() => toggleMutation.mutate({ id: habit._id, date: currentDate, completed: !completed })}
                              className={clsx(
                                  "cursor-pointer group relative p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                                  completed 
                                      ? "bg-black text-white border-black shadow-lg shadow-black/10" 
                                      : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-md"
                              )}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={clsx(
                                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                      completed ? "border-white bg-white/20" : "border-gray-300 group-hover:border-black"
                                  )}>
                                      {completed && <Check size={14} strokeWidth={3} />}
                                  </div>
                                  <span className="font-bold text-lg">{habit.title}</span>
                              </div>
                              
                              <div className={clsx("flex items-center gap-1 text-sm font-mono font-bold", completed ? "text-orange-300" : "text-orange-500")}>
                                  <Zap size={14} fill="currentColor" /> {habit.streak}
                              </div>
                              
                              <button 
                                  onClick={(e) => { 
                                      e.stopPropagation();
                                      if(confirm('Delete?')) deleteMutation.mutate(habit._id); 
                                  }}
                                  className={clsx(
                                      "absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                                      completed ? "hover:bg-white/20 text-white/50 hover:text-white" : "hover:bg-gray-100 text-gray-300 hover:text-red-500"
                                  )}
                              >
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      );
                  })
              )}
          </div>
      )}

      {/* Grid View (Week/Month) */}
      {viewMode !== 'today' && (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="sticky left-0 top-0 z-30 bg-white p-3 md:p-4 text-left min-w-[160px] md:min-w-[200px] border-b border-r border-gray-100 font-bold text-gray-900 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                            Habit
                        </th>
                        {gridDays.map(day => (
                            <th key={day.toISOString()} className={clsx(
                                "sticky top-0 z-20 p-1 md:p-2 min-w-[36px] md:min-w-[40px] text-center border-b border-gray-100 text-xs bg-white",
                                isToday(day) ? "text-black" : "text-gray-500"
                            )}>
                                <div className={clsx("font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-black text-white" : "")}>
                                    {format(day, 'd')}
                                </div>
                                <div className="text-[10px] font-normal opacity-80 uppercase">{format(day, 'EEEEE')}</div>
                            </th>
                        ))}
                        <th className="sticky top-0 z-20 bg-white p-2 md:p-4 text-center min-w-[60px] md:min-w-[80px] border-b border-gray-100 font-bold text-gray-900 text-xs md:text-sm">
                            Streak
                        </th>
                        <th className="sticky top-0 z-20 bg-white p-2 md:p-4 text-center min-w-[50px] md:min-w-[60px] border-b border-gray-100"></th>
                    </tr>
                </thead>
                <tbody>
                    {habits?.length === 0 ? (
                        <tr>
                            <td colSpan={gridDays.length + 3} className="p-10 text-center text-gray-400">
                                No habits added yet. Start tracking!
                            </td>
                        </tr>
                    ) : (
                        habits?.map(habit => (
                            <tr key={habit._id} className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 p-3 md:p-4 border-r border-gray-100 font-medium text-gray-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap text-sm md:text-base">
                                    {habit.title}
                                </td>
                                {gridDays.map(day => {
                                    const isScheduled = isHabitScheduledForDate(habit, day);
                                    if (!isScheduled) {
                                        return (
                                            <td key={day.toISOString()} className="p-1 border-r border-gray-50 bg-gray-50/30">
                                            </td>
                                        );
                                    }

                                    const completed = isCompleted(habit, day);
                                    return (
                                        <td 
                                            key={day.toISOString()} 
                                            className="p-1 border-r border-gray-50 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                                            onClick={() => toggleMutation.mutate({ id: habit._id, date: day, completed: !completed })}
                                        >
                                            <div className="flex items-center justify-center">
                                                <div className={clsx(
                                                    "w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center transition-all duration-300",
                                                    completed ? "bg-black scale-100" : "bg-gray-100 scale-75 opacity-50 hover:scale-90"
                                                )}>
                                                    {completed && <Check size={12} className="text-white" />}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="p-2 md:p-4 text-center border-l border-gray-100">
                                    <div className="flex items-center justify-center gap-1 font-mono text-xs md:text-sm text-orange-500 font-bold">
                                        <Zap size={14} fill="currentColor" /> {habit.streak}
                                    </div>
                                </td>
                                <td className="p-2 md:p-4 text-center">
                                    <button 
                                        onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(habit._id); }}
                                        className="opacity-100 md:opacity-50 hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
      )}
    </div>
  );
}
