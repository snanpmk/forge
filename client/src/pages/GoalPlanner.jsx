import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import GoalForm from '../components/GoalForm';
import TaskForm from '../components/TaskForm';
import {  
  Target, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle, 
  Circle, Clock, Layout, Tag, AlertCircle, BarChart2, Info
} from 'lucide-react';
import clsx from 'clsx';
import { differenceInDays, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import Loader from '../components/Loader';

export default function GoalPlanner() {
  const queryClient = useQueryClient();
  // Fetch Goals
  const [expandedGoals, setExpandedGoals] = useState({}); // { [id]: boolean }

  // Fetch Goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals');
      return data;
    },
  });

  // Fetch Tasks for linking
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  // Create Task Linked to Goal
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => api.post('/tasks', { ...taskData, goal_link_id: selectedGoalId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      setIsTaskModalOpen(false);
      setSelectedGoalId(null);
    },
  });


  // ... (keep existing state and queries)

  // Create Goal
  const createGoalMutation = useMutation({
    mutationFn: async (goalData) => api.post('/goals', { ...goalData, milestones: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
      setIsModalOpen(false); // Close modal on success
    },
  });

  // Delete Goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
    },
  });

  // Update Goal (Milestones, Status, etc)
  const updateGoalMutation = useMutation({
    mutationFn: async (goal) => api.put(`/goals/${goal._id}`, goal),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
    },
  });

  const handleToggleExpand = (id) => {
    setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddMilestone = (goal, title) => {
    if (!title.trim()) return;
    const updatedGoal = {
      ...goal,
      milestones: [...goal.milestones, { title, completed: false }]
    };
    updateGoalMutation.mutate(updatedGoal);
  };

  const handleToggleMilestone = (goal, index) => {
    const newMilestones = [...goal.milestones];
    newMilestones[index].completed = !newMilestones[index].completed;
    updateGoalMutation.mutate({ ...goal, milestones: newMilestones });
  };
  
  const handleStatusChange = (goal, newStatus) => {
      updateGoalMutation.mutate({ ...goal, status: newStatus });
  };

  // Analytics Data Preparation

  // Analytics Data Preparation
  const getAnalyticsData = () => {
      if (!goals) return [];
      
      const last6Months = eachMonthOfInterval({
          start: subMonths(new Date(), 5),
          end: new Date()
      });

      return last6Months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          const completedCount = goals.filter(g => {
              if (g.status !== 'Completed' || !g.completed_at) return false;
              const date = new Date(g.completed_at);
              return date >= monthStart && date <= monthEnd;
          }).length;
          
          return {
              name: format(month, 'MMM'),
              completed: completedCount
          };
      });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Goal Planner</h1>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
            <Plus size={18} /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* Modal for Goal Creation */}
              <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create S.M.A.R.T Goal">
                <GoalForm 
                    onSubmit={(data) => createGoalMutation.mutate(data)}
                />
              </Modal>

              {/* Modal for Task Creation (Breakdown) */}
              <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Add Task to Goal">
                  <TaskForm 
                    onSubmit={(data) => createTaskMutation.mutate(data)}
                    onCancel={() => setIsTaskModalOpen(false)}
                    submitLabel="Add Task"
                  />
              </Modal>

              {/* Goals List */}
              <div className="grid gap-6">
                {goals?.map(goal => (
                  <div key={goal._id} className={clsx("card p-0 overflow-hidden group border", goal.status === 'Completed' ? 'border-green-100 bg-green-50/30' : 'border-gray-100')}>
                    {/* Header */}
                    <div 
                      className="p-6 flex items-start sm:items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors gap-4"
                      onClick={() => handleToggleExpand(goal._id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <Target className={clsx("flex-shrink-0", goal.status === 'Completed' ? "text-green-600" : "text-black")} size={20} />
                          <h3 className={clsx("text-xl font-bold truncate", goal.status === 'Completed' && "text-gray-500 line-through")}>{goal.title}</h3>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 text-xs">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium border border-gray-200">
                                  {goal.category}
                              </span>
                              <span className={clsx("px-2 py-0.5 rounded-full font-medium border", 
                                  goal.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                                  goal.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                  'bg-blue-50 text-blue-600 border-blue-100'
                              )}>
                                  {goal.priority}
                              </span>
                              {goal.status === 'Completed' && (
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-xs border border-green-200">
                                      Completed
                                  </span>
                              )}
                          </div>
                        </div>

                        {/* S.M.A.R.T Summary in one line or simplified description */}
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                            {goal.smart_criteria?.specific || goal.description || "No specific details."}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                          <div 
                            className={clsx("h-full transition-all duration-500", goal.status === 'Completed' ? "bg-green-500" : "bg-black")}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500 flex flex-wrap justify-between gap-4 max-w-md">
                            <span>{goal.progress}% Completed</span>
                            {goal.budget_allocated > 0 && (
                                <div className="flex flex-col gap-1 w-full mt-2 pt-2 border-t border-gray-50">
                                   <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400">
                                       <span>Budget</span>
                                       <span className={clsx(goal.actual_spend > goal.budget_allocated ? "text-red-500" : "text-gray-600")}>
                                           ₹{goal.actual_spend || 0} / ₹{goal.budget_allocated}
                                       </span>
                                   </div>
                                   <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                       <div 
                                           className={clsx("h-full", goal.actual_spend > goal.budget_allocated ? "bg-red-500" : "bg-blue-500")}
                                           style={{ width: `${Math.min(((goal.actual_spend || 0) / goal.budget_allocated) * 100, 100)}%` }}
                                       />
                                   </div>
                                </div>
                            )}
                            {goal.target_date && (
                                <span className="flex items-center gap-1 font-medium text-black mt-2">
                                    <Clock size={12} />
                                    {(() => {
                                        const days = differenceInDays(new Date(goal.target_date), new Date());
                                        if (days < 0) return <span className="text-red-500">Overdue by {Math.abs(days)} days</span>;
                                        if (days === 0) return <span className="text-orange-500">Due Today</span>;
                                        return <span>{days} days left</span>;
                                    })()}
                                </span>
                            )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 flex-shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm('Delete goal?')) deleteGoalMutation.mutate(goal._id);
                          }}
                          className="text-gray-300 hover:text-red-500 p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        {expandedGoals[goal._id] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded Content (Details & Milestones) */}
                    {expandedGoals[goal._id] && (
                      <div className="bg-gray-50 border-t border-gray-100 p-6 animate-fade-in">
                        
                        {/* Status Check */}
                        <div className="flex justify-end mb-4">
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-gray-400 font-medium uppercase">Status:</span>
                                 <select 
                                    value={goal.status}
                                    onChange={(e) => handleStatusChange(goal, e.target.value)}
                                    className="bg-white border border-gray-200 text-xs rounded px-2 py-1 outline-none focus:border-black"
                                 >
                                     <option value="Active">Active</option>
                                     <option value="Completed">Completed</option>
                                     <option value="Archived">Archived</option>
                                 </select>
                             </div>
                        </div>

                        {/* S.M.A.R.T Details View */}
                        {goal.smart_criteria && ( goal.smart_criteria.specific || goal.smart_criteria.measurable ) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-lg border border-gray-100">
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Specific</h5>
                                    <p className="text-sm text-gray-700">{goal.smart_criteria.specific}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Measurable</h5>
                                    <p className="text-sm text-gray-700">{goal.smart_criteria.measurable}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Achievable</h5>
                                    <p className="text-sm text-gray-700">{goal.smart_criteria.achievable}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Relevant</h5>
                                    <p className="text-sm text-gray-700">{goal.smart_criteria.relevant}</p>
                                </div>
                            </div>
                        )}

                        <h4 className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">Milestones</h4>
                        
                        <div className="space-y-3 mb-6">
                            {goal.milestones.length === 0 && <p className="text-sm text-gray-400 italic">No milestones yet. Break down your goal.</p>}
                            {goal.milestones.map((milestone, idx) => (
                            <div key={idx} className="flex items-center gap-3 group/item bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <button 
                                onClick={() => handleToggleMilestone(goal, idx)}
                                className={clsx("transition-colors", milestone.completed ? "text-green-500" : "text-gray-300 hover:text-black")}
                                >
                                    {milestone.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                                </button>
                                <span className={clsx("flex-1 text-sm font-medium", milestone.completed && "line-through text-gray-400")}>
                                    {milestone.title}
                                </span>
                            </div>
                            ))}
                        </div>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddMilestone(goal, e.target.elements.milestone.value);
                            e.target.reset();
                          }}
                          className="flex gap-2"
                        >
                          <input name="milestone" type="text" placeholder="Add a milestone..." className="input-field text-sm py-2 bg-white flex-1" />
                          <button type="submit" className="btn-secondary whitespace-nowrap px-4 py-2 text-sm">Add Milestone</button>
                        </form>

                        {/* Linked Tasks Section */}
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-sm text-gray-500 uppercase tracking-widest">Actionable Tasks</h4>
                                <button 
                                    onClick={() => {
                                        setSelectedGoalId(goal._id);
                                        setIsTaskModalOpen(true);
                                    }}
                                    className="text-xs font-medium text-black hover:underline flex items-center gap-1"
                                >
                                    <Plus size={14} /> Break into Tasks
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {tasks?.filter(t => t.goal_link_id === goal._id).length === 0 && (
                                    <p className="text-sm text-gray-400 italic">No scheduled tasks linked to this goal.</p>
                                )}
                                {tasks?.filter(t => t.goal_link_id === goal._id).map(task => (
                                    <div key={task._id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("w-2 h-2 rounded-full", task.status === 'completed' ? 'bg-green-400' : 'bg-gray-300')} />
                                            <span className={clsx("text-sm", task.status === 'completed' && "line-through text-gray-400")}>{task.title}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {task.due_date ? format(new Date(task.due_date), 'MMM d') : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                      </div>
                    )}
                  </div>
                ))}

                {goals?.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Target size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No goals set yet. Start by creating one above!</p>
                    </div>
                )}
              </div>
          </div>

          {/* Sidebar - Right Column (1/3 width) */}
          <div className="lg:col-span-1 space-y-8">
              {/* Analytics Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-8">
                  <div className="flex items-center gap-2 mb-6">
                      <BarChart2 className="text-black" size={20} />
                      <h2 className="text-lg font-bold">Insights</h2>
                  </div>
                  
                  <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Accomplished Goals</p>
                      <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getAnalyticsData()}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} hide />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                  />
                                  <defs>
                                      <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#000000" stopOpacity={0.8}/>
                                          <stop offset="100%" stopColor="#000000" stopOpacity={0.4}/>
                                      </linearGradient>
                                  </defs>
                                  <Bar dataKey="completed" fill="url(#colorGoals)" radius={[4, 4, 0, 0]} barSize={30} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-gray-50 rounded-lg text-center">
                           <span className="block text-2xl font-bold">{goals?.filter(g => g.status === 'Active').length || 0}</span>
                           <span className="text-xs text-gray-500 font-medium uppercase">Active</span>
                       </div>
                       <div className="p-4 bg-green-50 rounded-lg text-center">
                           <span className="block text-2xl font-bold text-green-600">{goals?.filter(g => g.status === 'Completed').length || 0}</span>
                           <span className="text-xs text-green-600 font-medium uppercase">Completed</span>
                       </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
