import React, { useState, useEffect } from 'react';
import { Target, Info, Plus, X, List } from 'lucide-react';

export default function GoalForm({ initialValues, onSubmit, submitLabel = 'Create Goal' }) {
    const [goalData, setGoalData] = useState({ 
        title: '', 
        description: '',
        category: 'Personal',
        priority: 'Medium',
        target_date: '',
        smart_criteria: {
            specific: '',
            measurable: '',
            achievable: '',
            relevant: '',
            time_bound: ''
        },
        milestones: [],
        ...initialValues // Override defaults if provided
    });

    const [hasBudget, setHasBudget] = useState(false);
    const [newMilestone, setNewMilestone] = useState('');

    useEffect(() => {
        if (initialValues) {
            setGoalData(prev => ({ ...prev, ...initialValues }));
            if (initialValues.budget_allocated && initialValues.budget_allocated > 0) {
                setHasBudget(true);
            }
        }
    }, [initialValues]);

    const updateSmartField = (field, value) => {
        setGoalData(prev => ({
            ...prev,
            smart_criteria: { ...prev.smart_criteria, [field]: value }
        }));
    };

    const addMilestone = (e) => {
        e.preventDefault();
        if (newMilestone.trim()) {
            setGoalData(prev => ({
                ...prev,
                milestones: [...prev.milestones, { title: newMilestone, completed: false }]
            }));
            setNewMilestone('');
        }
    };

    const removeMilestone = (index) => {
        setGoalData(prev => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (goalData.title.trim()) {
            onSubmit(goalData);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="grid gap-6 pr-2"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                    <input
                        type="text"
                        value={goalData.title}
                        onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
                        placeholder="E.g., Learn Spanish"
                        className="input-field"
                        required
                    />
                </div>
            </div>
            
            {/* S.M.A.R.T Fields Accordion/Grid */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                        <Info size={16} />
                        <span className="text-sm font-bold">S.M.A.R.T Framework</span>
                </div>
                
                <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specific (What?)</label>
                        <textarea 
                        value={goalData.smart_criteria.specific}
                        onChange={(e) => updateSmartField('specific', e.target.value)}
                        placeholder="What exactly do you want to accomplish?" 
                        className="input-field min-h-[60px] text-sm"
                        />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Measurable (How?)</label>
                            <input 
                            type="text" 
                            value={goalData.smart_criteria.measurable}
                            onChange={(e) => updateSmartField('measurable', e.target.value)}
                            placeholder="How will you measure success?" 
                            className="input-field text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Achievable (Realistic?)</label>
                            <input 
                            type="text" 
                            value={goalData.smart_criteria.achievable}
                            onChange={(e) => updateSmartField('achievable', e.target.value)}
                            placeholder="Is it realistic?" 
                            className="input-field text-sm"
                            />
                        </div>
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relevant (Why?)</label>
                            <input 
                            type="text" 
                            value={goalData.smart_criteria.relevant}
                            onChange={(e) => updateSmartField('relevant', e.target.value)}
                            placeholder="Why does this matter?" 
                            className="input-field text-sm"
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time-bound (When?)</label>
                            <input 
                            type="date"
                            className="input-field w-full sm:w-auto min-w-0 appearance-none"
                            style={{ WebkitAppearance: 'none' }}
                            value={goalData.target_date} 
                            onChange={(e) => {
                                setGoalData({ ...goalData, target_date: e.target.value });
                                updateSmartField('time_bound', e.target.value); 
                            }}
                        />
                        </div>
                </div>
            </div>

            {/* Milestones Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <List size={16} />
                    <span className="text-sm font-bold">Milestones</span>
                </div>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMilestone}
                        onChange={(e) => setNewMilestone(e.target.value)}
                        placeholder="Add a milestone step..." 
                        className="input-field text-sm flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && addMilestone(e)}
                    />
                    <button 
                        type="button"
                        onClick={addMilestone}
                        className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 mt-2">
                    {goalData.milestones?.map((milestone, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200/50 shadow-sm text-sm">
                            <span className="text-primary truncate">{typeof milestone === 'string' ? milestone : milestone.title}</span>
                            <button 
                                type="button" 
                                onClick={() => removeMilestone(idx)}
                                className="text-gray-400 hover:text-red-500 p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {goalData.milestones?.length === 0 && (
                        <p className="text-xs text-muted italic text-center py-2">No milestones added yet.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                    value={goalData.category}
                    onChange={(e) => setGoalData({ ...goalData, category: e.target.value })}
                    className="input-field"
                >
                    <option value="Personal">Personal</option>
                    <option value="Career">Career</option>
                    <option value="Financial">Financial</option>
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
                </select>

                <select 
                    value={goalData.priority}
                    onChange={(e) => setGoalData({ ...goalData, priority: e.target.value })}
                    className="input-field"
                >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                </select>

                <div className="flex flex-col gap-2">
                   <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${hasBudget ? 'bg-primary border-primary' : 'bg-white border-gray-300 group-hover:border-primary'}`}>
                            {hasBudget && <Plus size={14} className="text-white rotate-45" />} 
                             <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={hasBudget} 
                                onChange={(e) => {
                                    setHasBudget(e.target.checked);
                                    if (!e.target.checked) setGoalData(prev => ({ ...prev, budget_allocated: 0 }));
                                }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Set Budget?</span>
                   </label>
                   
                   {hasBudget && (
                        <input 
                            type="number"
                            min="0"
                            placeholder="Allocated Amount (₹)"
                            className="input-field animate-fade-in"
                            value={goalData.budget_allocated || ''}
                            onChange={(e) => setGoalData({ ...goalData, budget_allocated: Number(e.target.value) })}
                        />
                   )}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary flex items-center justify-center gap-2 px-8 py-2.5">
                    <Plus size={18} /> {submitLabel}
                </button>
            </div>
        </form>
    );
}
