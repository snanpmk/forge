import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from './ui/Button';

export default function TaskForm({ initialValues, onSubmit, submitLabel = 'Create Task', onCancel }) {
    const [taskData, setTaskData] = useState({ 
        title: '', 
        description: '', 
        // Use local date for default to avoid timezone issues (e.g. yesterday if late night in UTC)
        due_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format local time
        priority: 'medium',
        ...initialValues
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (taskData.title.trim()) {
            onSubmit(taskData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="e.g. Schedule Dentist Appt"
                    value={taskData.title}
                    onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                    autoFocus
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={taskData.due_date}
                    onChange={e => setTaskData({ ...taskData, due_date: e.target.value })}
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                    value={taskData.priority}
                    onChange={e => setTaskData({ ...taskData, priority: e.target.value })}
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[80px]"
                    placeholder="Details..."
                    value={taskData.description}
                    onChange={e => setTaskData({ ...taskData, description: e.target.value })}
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
                    disabled={!taskData.title.trim()}
                    className="flex-1 sm:flex-none"
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
