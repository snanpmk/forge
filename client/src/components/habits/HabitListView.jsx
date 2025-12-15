import React from 'react';
import { Check, Trash2, Zap } from 'lucide-react';
import clsx from 'clsx';
import { isHabitCompleted } from '../../utils/HabitFilters';
import { confirmAction } from '../ui/ConfirmationToast';

export default function HabitListView({ habits, currentDate, onToggle, onDelete, onAddClick }) {
    
    if (!habits || habits.length === 0) {
        return (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-muted font-medium mb-2">No habits scheduled for today.</p>
                <button onClick={onAddClick} className="text-primary font-bold hover:underline">Create a new habit</button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit, idx) => {
                const completed = isHabitCompleted(habit, currentDate);
                return (
                    <div 
                        key={habit._id} 
                        onClick={() => onToggle({ id: habit._id, date: currentDate, completed: !completed })}
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
                                confirmAction('Delete this habit?', () => onDelete(habit._id));
                            }}
                            className={clsx(
                                "absolute top-3 right-3 p-2 rounded-xl transition-all z-20",
                                "opacity-100 lg:opacity-0 lg:group-hover:opacity-100", // Visible on mobile, hover-only on large screens
                                "lg:pointer-events-none lg:group-hover:pointer-events-auto", // Prevent blocking clicks when hidden on desktop
                                completed ? "hover:bg-green-200/50 text-green-700/50 hover:text-green-800" : "hover:bg-red-50 text-gray-300 hover:text-red-500"
                            )}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
