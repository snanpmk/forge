import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SkeletonHabitTracker from '../components/skeletons/SkeletonHabitTracker';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, 
  startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays
} from 'date-fns';

import Modal from '../components/ui/Modal';
import HabitForm from '../components/HabitForm';
import HabitListView from '../components/habits/HabitListView';
import HabitGridView from '../components/habits/HabitGridView';
import { isHabitScheduledForDate } from '../utils/HabitFilters';

export default function HabitTracker() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Calculate streak helper (Client-side mirror of backend)
  const calculateStreak = useCallback((logs) => {
    if (!logs || logs.length === 0) return 0;
    
    // Normalize dates to YYYY-MM-DD
    const completedDates = logs
      .filter(l => l.completed)
      .map(l => {
        const d = new Date(l.date);
        return format(d, 'yyyy-MM-dd');
      })
      .sort((a, b) => b.localeCompare(a)); // Descending order

    const uniqueDates = [...new Set(completedDates)];
    if (uniqueDates.length === 0) return 0;

    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // If last completion was before yesterday, streak is broken
    // Exception: If current streak is based on today, checking < yesterday is fine.
    // Logic: Streak breaks if not done yesterday AND not done today.
    // But simplistic check:
    if (uniqueDates[0] < yesterday) return 0;

    let streak = 0;
    let expectedDate = uniqueDates[0];

    for (let date of uniqueDates) {
      if (date === expectedDate) {
        streak++;
        expectedDate = format(subDays(new Date(expectedDate), 1), 'yyyy-MM-dd');
      } else {
        break;
      }
    }
    return streak;
  }, []);

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
    onMutate: async ({ id, date, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);

      queryClient.setQueryData(['habits'], (old) => {
        return old.map((habit) => {
          if (habit._id === id) {

            const existingLogIndex = habit.logs.findIndex((log) => 
               isSameDay(new Date(log.date), date)
            );

            let newLogs = [...habit.logs];
            if (existingLogIndex > -1) {
               newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], completed, date: date };
            } else {
               newLogs.push({ date: date, completed });
            }
            
            // Recalculate streak optimistically
            const newStreak = calculateStreak(newLogs);
            
            return { ...habit, logs: newLogs, streak: newStreak };
          }
          return habit;
        });
      });

      return { previousHabits };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['habits'], context.previousHabits);
      toast.error('Failed to update habit');
    },
    onSettled: () => {
      // Only invalidate dashboard since habits are already optimistically updated
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['habits']);
      toast.success('Habit deleted');
    },
  });

  // Filter habits for current view properties
  const filteredHabits = habits; // We filter per row for grid, or per card for list.
  
  // For List View (Today), we only show scheduled - memoized to avoid recalculation
  const todayHabits = useMemo(() => 
    habits?.filter(h => isHabitScheduledForDate(h, currentDate)) || [],
    [habits, currentDate]
  );

  // Early return AFTER all hooks to comply with Rules of Hooks
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
          <HabitListView 
            habits={todayHabits}
            currentDate={currentDate}
            onToggle={(data) => toggleMutation.mutate(data)}
            onDelete={(id) => deleteMutation.mutate(id)}
            onAddClick={() => setIsAddModalOpen(true)}
          />
      )}

      {/* Grid View (Week/Month) */}
      {viewMode !== 'today' && (
        <HabitGridView 
            habits={filteredHabits}
            gridDays={gridDays}
            onToggle={(data) => toggleMutation.mutate(data)}
            onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}
