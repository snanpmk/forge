import React, { useState } from 'react';
import Button from './ui/Button';
import clsx from 'clsx';

export default function HabitForm({ initialValues, onSubmit, submitLabel = 'Create Habit', onCancel }) {
    const [habitData, setHabitData] = useState({ 
        title: '', 
        description: '',
        frequency: 'daily',
        schedule: {
            daysOfWeek: [], // 0-6
            daysOfMonth: [] // 1-31
        },
        ...initialValues
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (habitData.title.trim()) {
            onSubmit(habitData);
        }
    };

    const toggleDayOfWeek = (dayIndex) => {
        const currentDays = habitData.schedule.daysOfWeek || [];
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex];
        
        setHabitData({
            ...habitData,
            schedule: { ...habitData.schedule, daysOfWeek: newDays }
        });
    };

    const toggleDayOfMonth = (day) => {
        const currentDays = habitData.schedule.daysOfMonth || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        
        setHabitData({
            ...habitData,
            schedule: { ...habitData.schedule, daysOfMonth: newDays }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Habit Title</label>
                <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="e.g. Morning Run"
                    value={habitData.title}
                    onChange={e => setHabitData({ ...habitData, title: e.target.value })}
                    autoFocus
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['daily', 'weekly', 'monthly'].map(freq => (
                        <button
                            key={freq}
                            type="button"
                            onClick={() => setHabitData({ ...habitData, frequency: freq })}
                            className={clsx(
                                "flex-1 py-1.5 px-3 rounded-md text-sm font-medium capitalize transition-all",
                                habitData.frequency === freq ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {freq}
                        </button>
                    ))}
                </div>
            </div>

            {habitData.frequency === 'weekly' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                    <div className="flex justify-between gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                            const isSelected = habitData.schedule.daysOfWeek?.includes(index);
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => toggleDayOfWeek(index)}
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                        isSelected 
                                            ? "bg-black text-white shadow-md scale-105" 
                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Selected: {habitData.schedule.daysOfWeek?.length 
                            ? habitData.schedule.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') 
                            : 'None'}
                    </p>
                </div>
            )}

            {habitData.frequency === 'monthly' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Dates</label>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                            const isSelected = habitData.schedule.daysOfMonth?.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayOfMonth(day)}
                                    className={clsx(
                                        "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all",
                                        isSelected 
                                            ? "bg-black text-white shadow-sm" 
                                            : "bg-gray-50 text-gray-400 hover:bg-gray-200"
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px]"
                    placeholder="Why do you want to build this habit?"
                    value={habitData.description}
                    onChange={e => setHabitData({ ...habitData, description: e.target.value })}
                />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button 
                    type="submit" 
                    disabled={!habitData.title.trim()}
                    className="flex-1 sm:flex-none"
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
