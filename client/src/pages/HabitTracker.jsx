import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, Flame,Zap, Calendar as CalIcon, ChevronLeft, ChevronRight, Check, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SkeletonHabitTracker from '../components/skeletons/SkeletonHabitTracker';
import { confirmAction } from '../components/ui/ConfirmationToast';
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
        const dateStr = format(date, 'yyyy-MM-dd');
        const timezoneOffset = new Date().getTimezoneOffset();
        return api.put(`/habits/${id}/log`, { date: dateStr, completed, timezoneOffset });
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
      toast.success('Habit deleted');
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

  if (isLoading) return <SkeletonHabitTracker />;

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in">
      <div className="flex flex-col lg:flex-row items-center justify-between py-6 gap-6 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold soft-gradient-text tracking-tight">Habit Tracker</h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* View Toggle */}
            <div className="bg-white p-1 rounded-2xl shadow-soft flex text-sm font-bold w-full sm:w-auto border border-gray-100">
                {['today', 'week', 'month'].map((mode) => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={clsx(
                            "px-5 py-2.5 rounded-xl transition-all capitalize flex-1 sm:flex-none text-center", 
                            viewMode === mode 
                                ? "bg-primary text-white shadow-md transform scale-105" 
                                : "text-muted hover:text-primary hover:bg-gray-50"
                        )}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center h-full">
                {/* Navigation */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-soft border border-gray-100 flex-1 sm:flex-none justify-between sm:justify-start h-full">
                    <button onClick={handlePrev} className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-muted hover:text-primary">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold min-w-[140px] text-center text-sm text-primary truncate px-2">
                        {viewMode === 'today' && format(currentDate, 'EEEE, MMM d')}
                        {viewMode === 'week' && `${format(gridDays[0], 'MMM d')} - ${format(gridDays[6], 'MMM d')}`}
                        {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button onClick={handleNext} className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-muted hover:text-primary">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Add Button */}
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary text-white p-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-soft hover:shadow-glow flex-shrink-0"
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

      {/* Today View (Card List) */}
      {viewMode === 'today' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits?.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-muted font-medium mb-2">No habits added yet.</p>
                      <button onClick={() => setIsAddModalOpen(true)} className="text-primary font-bold hover:underline">Create your first habit</button>
                  </div>
              ) : (
                  habits?.filter(h => isHabitScheduledForDate(h, currentDate)).map((habit, idx) => {
                      const completed = isCompleted(habit, currentDate);
                      return (
                          <div 
                              key={habit._id} 
                              onClick={() => toggleMutation.mutate({ id: habit._id, date: currentDate, completed: !completed })}
                              className={clsx(
                                  "cursor-pointer group relative p-6 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between animate-fade-in hover:scale-[1.02]",
                                  completed 
                                      ? "bg-green-50 border-green-400 shadow-md" 
                                      : "bg-white border-gray-100 shadow-sm hover:shadow-soft-hover hover:border-gray-200"
                              )}
                              style={{ animationDelay: `${idx * 50}ms` }}
                          >
                               <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                              <div className="flex items-center gap-5 z-10">
                                  <div className={clsx(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                                      completed ? "bg-green-600 text-white shadow-green-200" : "bg-gray-50 text-gray-300 group-hover:bg-white group-hover:text-gray-400 group-hover:shadow-inner-soft"
                                  )}>
                                      <Check size={24} strokeWidth={3} className={clsx("transition-transform duration-300", completed ? "scale-100" : "scale-0")} />
                                  </div>
                                  <div>
                                     <h3 className={clsx("font-bold text-lg transition-colors", completed ? "text-green-900 line-through decoration-green-500/50 decoration-2" : "text-primary")}>{habit.title}</h3>
                                     <span className={clsx("text-xs font-extra-bold uppercase tracking-wider", completed ? "text-green-700 bg-green-100 px-2 py-0.5 rounded-full" : "text-muted")}>
                                         {completed ? "Completed" : "Pending"}
                                     </span>
                                  </div>
                              </div>
                              
                              <div className={clsx("flex items-center gap-1.5 text-sm font-display font-bold px-3 py-1.5 rounded-xl z-10", completed ? "bg-white/50 text-green-700" : "bg-gray-50 text-muted")}>
                                  <Zap size={16} fill="currentColor" /> {habit.streak}
                              </div>
                              
                              <button 
                                  onClick={(e) => { 
                                      e.stopPropagation();
                                      confirmAction('Delete this habit?', () => deleteMutation.mutate(habit._id));
                                  }}
                                  disabled={deleteMutation.isLoading || deleteMutation.isPending}
                                  className={clsx(
                                      "absolute top-3 right-3 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 disabled:opacity-50",
                                      completed ? "hover:bg-green-200/50 text-green-700/50 hover:text-green-800" : "hover:bg-red-50 text-gray-300 hover:text-red-500"
                                  )}
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      );
                  })
              )}
          </div>
      )}

      {/* Grid View (Week/Month) */}
      {viewMode !== 'today' && (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden flex flex-col animate-fade-in">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="sticky left-0 top-0 z-30 bg-white p-4 text-left min-w-[180px] md:min-w-[220px] border-b border-r border-gray-100 font-bold text-primary shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                            Habit
                        </th>
                        {gridDays.map(day => (
                            <th key={day.toISOString()} className={clsx(
                                "sticky top-0 z-20 p-2 min-w-[40px] md:min-w-[48px] text-center border-b border-gray-100 text-xs",
                                isToday(day) ? "bg-primary text-white" : "bg-white text-muted"
                            )}>
                                <div className="font-bold text-sm">{format(day, 'd')}</div>
                                <div className={clsx("text-[10px] font-bold uppercase", isToday(day) ? "opacity-80" : "text-gray-400")}>{format(day, 'EEE')}</div>
                            </th>
                        ))}
                        <th className="sticky top-0 z-20 bg-white p-4 text-center min-w-[80px] border-b border-gray-100 font-bold text-primary text-xs uppercase tracking-wider">
                            Streak
                        </th>
                        <th className="sticky top-0 z-20 bg-white p-4 text-center min-w-[60px] border-b border-gray-100"></th>
                    </tr>
                </thead>
                <tbody>
                    {habits?.length === 0 ? (
                        <tr>
                            <td colSpan={gridDays.length + 3} className="p-16 text-center text-muted bg-gray-50/30">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 bg-gray-100 rounded-full">
                                        <CalendarIcon size={24} className="text-gray-400" />
                                    </div>
                                    <p>No habits to display.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        habits?.map((habit, idx) => (
                            <tr key={habit._id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 p-4 border-r border-gray-100 font-bold text-primary shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap text-sm md:text-base">
                                    {habit.title}
                                </td>
                                {gridDays.map(day => {
                                    const isScheduled = isHabitScheduledForDate(habit, day);
                                    if (!isScheduled) {
                                        return (
                                            <td key={day.toISOString()} className="p-1 border-r border-gray-50/50 bg-gray-50/30">
                                                <div className="w-full h-full flex items-center justify-center opacity-30">
                                                     <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                </div>
                                            </td>
                                        );
                                    }

                                    const completed = isCompleted(habit, day);
                                    return (
                                        <td 
                                            key={day.toISOString()} 
                                            className="p-1 border-r border-gray-50/50 text-center cursor-pointer hover:bg-gray-100/50 transition-colors"
                                            onClick={() => toggleMutation.mutate({ id: habit._id, date: day, completed: !completed })}
                                        >
                                            <div className="flex items-center justify-center h-10 w-full group/cell">
                                                <div className={clsx(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                                                    completed 
                                                        ? "bg-wellness-green text-green-700 scale-100 shadow-soft" 
                                                        : "bg-white border border-gray-100 text-transparent hover:border-gray-300 hover:scale-90"
                                                )}>
                                                    <Check size={16} strokeWidth={4} className={clsx("transition-transform", completed ? "scale-100" : "scale-0")} />
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="p-4 text-center border-l border-gray-100">
                                    <div className="flex items-center justify-center gap-1.5 font-display font-bold text-sm text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                        <Zap size={14} fill="currentColor" /> {habit.streak}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => confirmAction('Delete this habit?', () => deleteMutation.mutate(habit._id))}
                                        disabled={deleteMutation.isLoading || deleteMutation.isPending}
                                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
