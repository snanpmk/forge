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
import SkeletonGoalPlanner from '../components/skeletons/SkeletonGoalPlanner';
import { confirmAction } from '../components/ui/ConfirmationToast';
import toast from 'react-hot-toast';

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
    mutationFn: async (goalData) => api.post('/goals', { 
        ...goalData, 
        milestones: goalData.milestones || [] 
    }),
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
      toast.success('Goal deleted');
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

  if (isLoading) return <SkeletonGoalPlanner />;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold soft-gradient-text tracking-tight">Goal Planner</h1>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center shadow-soft hover:shadow-glow transition-all"
        >
            <Plus size={18} /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
              
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
                  <div key={goal._id} className={clsx("rounded-3xl p-0 overflow-hidden group transition-all duration-300", 
                      goal.status === 'Completed' ? 'bg-green-50/50 border border-green-100 opacity-80' : 'bg-white border border-gray-100 shadow-soft hover:shadow-soft-hover'
                  )}>
                    {/* Header */}
                    <div 
                      className="p-6 flex items-start sm:items-center justify-between cursor-pointer hover:bg-gray-50/30 transition-colors gap-4"
                      onClick={() => handleToggleExpand(goal._id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <div className={clsx("p-2 rounded-xl", goal.status === 'Completed' ? "bg-green-100 text-green-600" : "bg-primary text-white shadow-md")}>
                             <Target size={18} />
                          </div>
                          <h3 className={clsx("text-xl font-bold truncate tracking-tight text-primary", goal.status === 'Completed' && "text-muted line-through")}>{goal.title}</h3>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 text-xs">
                              <span className="bg-gray-100/80 backdrop-blur-sm px-3 py-1 rounded-lg text-muted font-bold border border-gray-200">
                                  {goal.category}
                              </span>
                              <span className={clsx("px-3 py-1 rounded-lg font-bold border shadow-sm", 
                                  goal.priority === 'High' ? 'bg-red-50 text-red-500 border-red-100' : 
                                  goal.priority === 'Medium' ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                                  'bg-blue-50 text-blue-500 border-blue-100'
                              )}>
                                  {goal.priority}
                              </span>
                              {goal.status === 'Completed' && (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold text-xs border border-green-200 shadow-sm">
                                      Completed
                                  </span>
                              )}
                          </div>
                        </div>

                        {/* Summary */}
                        <p className="text-muted text-sm mb-4 line-clamp-2 leading-relaxed">
                            {goal.smart_criteria?.specific || goal.description || "No specific details."}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md bg-gray-100 h-2.5 rounded-full overflow-hidden mb-3 shadow-inner-soft">
                          <div 
                            className={clsx("h-full transition-all duration-1000 ease-out relative overflow-hidden", goal.status === 'Completed' ? "bg-green-500" : "bg-primary")}
                            style={{ width: `${goal.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted flex flex-wrap justify-between gap-4 max-w-md font-medium">
                            <span className="text-primary">{goal.progress}% Completed</span>
                            {goal.budget_allocated > 0 && (
                                <div className="flex flex-col gap-1 w-full mt-2 pt-3 border-t border-gray-100">
                                   <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                       <span>Budget</span>
                                       <span className={clsx(goal.actual_spend > goal.budget_allocated ? "text-error" : "text-primary")}>
                                           ₹{goal.actual_spend || 0} / ₹{goal.budget_allocated}
                                       </span>
                                   </div>
                                </div>
                            )}
                            {goal.target_date && (
                                <span className="flex items-center gap-1.5 font-bold text-primary mt-2 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                    <Clock size={12} className="text-muted" />
                                    {(() => {
                                        const days = differenceInDays(new Date(goal.target_date), new Date());
                                        if (days < 0) return <span className="text-error">Overdue by {Math.abs(days)} days</span>;
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
                            confirmAction('Delete this goal?', () => deleteGoalMutation.mutate(goal._id));
                          }}
                          disabled={deleteGoalMutation.isLoading || deleteGoalMutation.isPending}
                          className="text-gray-300 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="p-2 bg-gray-50 rounded-full">
                            {expandedGoals[goal._id] ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-muted" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content (Details & Milestones) */}
                    {expandedGoals[goal._id] && (
                      <div className="bg-gray-50/50 border-t border-gray-100 p-6 animate-fade-in relative">
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
                        
                        {/* Status Check */}
                        <div className="flex justify-end mb-6">
                             <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                 <span className="text-xs text-muted font-bold uppercase tracking-wider">Status</span>
                                 <select 
                                    value={goal.status}
                                    onChange={(e) => handleStatusChange(goal, e.target.value)}
                                    className="bg-transparent text-sm font-semibold outline-none text-primary cursor-pointer"
                                 >
                                     <option value="Active">Active</option>
                                     <option value="Completed">Completed</option>
                                     <option value="Archived">Archived</option>
                                 </select>
                             </div>
                        </div>

                        {/* S.M.A.R.T Details View */}
                        {goal.smart_criteria && ( goal.smart_criteria.specific || goal.smart_criteria.measurable ) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="card bg-white p-5 border-gray-100 shadow-sm">
                                    <h5 className="text-xs font-bold text-muted uppercase mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Specific</h5>
                                    <p className="text-sm text-primary leading-relaxed">{goal.smart_criteria.specific}</p>
                                </div>
                                <div className="card bg-white p-5 border-gray-100 shadow-sm">
                                    <h5 className="text-xs font-bold text-muted uppercase mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> Measurable</h5>
                                    <p className="text-sm text-primary leading-relaxed">{goal.smart_criteria.measurable}</p>
                                </div>
                                <div className="card bg-white p-5 border-gray-100 shadow-sm">
                                    <h5 className="text-xs font-bold text-muted uppercase mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Achievable</h5>
                                    <p className="text-sm text-primary leading-relaxed">{goal.smart_criteria.achievable}</p>
                                </div>
                                <div className="card bg-white p-5 border-gray-100 shadow-sm">
                                    <h5 className="text-xs font-bold text-muted uppercase mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Relevant</h5>
                                    <p className="text-sm text-primary leading-relaxed">{goal.smart_criteria.relevant}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-sm text-primary uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-4 bg-primary rounded-full"></div> Milestones</h4>
                        </div>
                        
                        <div className="space-y-3 mb-8">
                            {goal.milestones.length === 0 && <p className="text-sm text-muted italic pl-2">No milestones yet. Break down your goal.</p>}
                            {goal.milestones.map((milestone, idx) => (
                            <div key={idx} className="flex items-center gap-4 group/item bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <button 
                                onClick={() => handleToggleMilestone(goal, idx)}
                                className={clsx("transition-all duration-300 transform active:scale-95", milestone.completed ? "text-green-500 scale-110" : "text-gray-300 hover:text-primary")}
                                >
                                    {milestone.completed ? <CheckCircle size={22} weight="fill" /> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>}
                                </button>
                                <span className={clsx("flex-1 text-sm font-medium transition-colors", milestone.completed ? "line-through text-muted" : "text-primary")}>
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
                          className="flex gap-3"
                        >
                          <input name="milestone" type="text" placeholder="Add a new milestone..." className="input-field bg-white shadow-sm flex-1" />
                          <button type="submit" className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-soft hover:bg-gray-800 transition-all">Add</button>
                        </form>

                        {/* Linked Tasks Section */}
                        <div className="mt-10 border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-5">
                                <h4 className="font-bold text-xs text-muted uppercase tracking-widest">Linked Tasks</h4>
                                <button 
                                    onClick={() => {
                                        setSelectedGoalId(goal._id);
                                        setIsTaskModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-wellness-lavender text-primary rounded-lg text-xs font-bold hover:bg-wellness-lavender/80 transition-colors flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Add Task
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {tasks?.filter(t => t.goal_link_id === goal._id).length === 0 && (
                                    <p className="text-sm text-muted italic pl-1">No scheduled tasks linked.</p>
                                )}
                                {tasks?.filter(t => t.goal_link_id === goal._id).map(task => (
                                    <div key={task._id} className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-gray-100/50 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("w-2.5 h-2.5 rounded-full shadow-sm", task.status === 'completed' ? 'bg-green-400' : 'bg-gray-200')} />
                                            <span className={clsx("text-sm font-medium", task.status === 'completed' ? "line-through text-muted" : "text-primary")}>{task.title}</span>
                                        </div>
                                        <span className="text-xs font-mono font-medium text-muted bg-gray-50 px-2 py-1 rounded">
                                            {task.due_date ? format(new Date(task.due_date), 'MMM d') : '-'}
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
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <Target size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-bold text-gray-400 mb-1">No goals yet</h3>
                        <p className="text-muted text-sm mb-4">Start by creating your first S.M.A.R.T. goal</p>
                        <button onClick={() => setIsModalOpen(true)} className="btn-primary mx-auto">Create Goal</button>
                    </div>
                )}
              </div>
          </div>

          {/* Sidebar - Right Column (1/3 width) */}
          <div className="lg:col-span-1 space-y-8">
              {/* Analytics Section */}
              <div className="card sticky top-8 border-gray-100 shadow-soft">
                  <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-white shadow-md">
                        <BarChart2 size={18} />
                      </div>
                      <h2 className="text-lg font-bold text-primary">Insights</h2>
                  </div>
                  
                  <div className="mb-8">
                      <p className="text-xs text-muted mb-4 font-bold uppercase tracking-wider pl-1">Accomplished Goals Trend</p>
                      <div className="h-48 w-full bg-gray-50 rounded-2xl p-2 border border-blue-50/50">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getAnalyticsData()}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={5} />
                                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} hide />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '8px 12px' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                  />
                                  <defs>
                                      <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#1f2937" stopOpacity={0.8}/>
                                          <stop offset="100%" stopColor="#374151" stopOpacity={0.4}/>
                                      </linearGradient>
                                  </defs>
                                  <Bar dataKey="completed" fill="url(#colorGoals)" radius={[6, 6, 6, 6]} barSize={24} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-wellness-blue/30 rounded-2xl text-center border border-wellness-blue/20">
                           <span className="block text-3xl font-display font-bold text-primary mb-1">{goals?.filter(g => g.status === 'Active').length || 0}</span>
                           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active</span>
                       </div>
                       <div className="p-5 bg-wellness-green/30 rounded-2xl text-center border border-wellness-green/20">
                           <span className="block text-3xl font-display font-bold text-green-700 mb-1">{goals?.filter(g => g.status === 'Completed').length || 0}</span>
                           <span className="text-[10px] text-green-700/70 font-bold uppercase tracking-wider">Completed</span>
                       </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
