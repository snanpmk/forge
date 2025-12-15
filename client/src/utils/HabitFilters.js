import { 
    isSameDay, getDay, getDate 
} from 'date-fns';

export function isHabitScheduledForDate(habit, date) {
    const { frequency, schedule } = habit;
    
    // Default to daily if not specified
    if (!frequency || frequency === 'daily') return true;
    
    // Weekly Check
    if (frequency === 'weekly') {
      const dayOfWeek = getDay(date); // 0 (Sun) - 6 (Sat)
      // Check if schedule.daysOfWeek exists and acts as an array
      return schedule?.daysOfWeek?.includes(dayOfWeek);
    }
    
    // Monthly Check
    if (frequency === 'monthly') {
      const dayOfMonth = getDate(date); // 1-31
      return schedule?.daysOfMonth?.includes(dayOfMonth);
    }
    
    return true;
}

export function isHabitCompleted(habit, date) {
    if (!habit || !habit.logs) return false;
    return habit.logs.some(log => isSameDay(new Date(log.date), date) && log.completed);
}
