import React from 'react';
import { Check, Trash2, Zap, Calendar as CalIcon } from 'lucide-react';
import clsx from 'clsx';
import { format, isToday } from 'date-fns';
import { isHabitScheduledForDate, isHabitCompleted } from '../../utils/HabitFilters';
import { confirmAction } from '../ui/ConfirmationToast';

export default function HabitGridView({ habits, gridDays, onToggle, onDelete }) {
    return (
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
                                        <CalIcon size={24} className="text-gray-400" />
                                    </div>
                                    <p>No habits to display.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        habits?.map((habit) => (
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

                                    const completed = isHabitCompleted(habit, day);
                                    return (
                                        <td 
                                            key={day.toISOString()} 
                                            className="p-1 border-r border-gray-50/50 text-center cursor-pointer hover:bg-gray-100/50 transition-colors"
                                            onClick={() => onToggle({ id: habit._id, date: day, completed: !completed })}
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
                                        onClick={() => confirmAction('Delete this habit?', () => onDelete(habit._id))}
                                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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
    );
}
