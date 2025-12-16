import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Modal from '../components/ui/Modal';
import TaskForm from '../components/TaskForm';
import { Trash2,Clock, Plus, Calendar, CheckCircle2, AlertCircle, RefreshCw, Filter, ArrowUpDown, Pencil, Zap } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { confirmAction } from '../components/ui/ConfirmationToast';
import clsx from 'clsx';
import Button from '../components/ui/Button';
import HabitForm from '../components/HabitForm';
import SkeletonTaskManager from '../components/skeletons/SkeletonTaskManager';
import { toast } from 'react-hot-toast';

export default function TaskManager() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'priority' | 'newest'

  // Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState(''); // State for new subtask input
  
  // Habit Conversion
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState(null);

  // Fetch Tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (taskData) => api.post('/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      setIsAddModalOpen(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }) => api.put(`/tasks/${id}`, data),
    onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['dashboard']);
        setIsEditModalOpen(false);
        setTaskToEdit(null);
        toast.success('Task updated successfully');
    },
    onError: () => {
        toast.error('Failed to update task');
    }
  });

  const createHabitMutation = useMutation({
      mutationFn: async (habitData) => {
          // Create habit
          await api.post('/habits', { ...habitData, source_task_id: taskToConvert?._id });
          // Optionally mark task as completed or delete? 
          // Plan says: "Convert Repetitive Task -> Habit". 
          // Usually this means the task becomes a habit. 
          // I'll leave the task as is, user can delete or complete it.
          // Or asking user? For now just create habit.
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['habits']);
          queryClient.invalidateQueries(['dashboard']);
          setIsHabitModalOpen(false);
          setTaskToConvert(null);
          toast.success('Habit created from task!');
      }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }) => {
        return api.put(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task deleted');
    },
  });

  // Group Tasks
  const groupedTasks = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: []
  };

  const getSortedTasks = (taskList) => {
      return [...taskList].sort((a, b) => {
          if (sortBy === 'priority') {
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          } else if (sortBy === 'newest') {
              return new Date(b.createdAt || b._id.getTimestamp?.() || 0) - new Date(a.createdAt || a._id.getTimestamp?.() || 0); // Fallback if createdAt missing
          } else {
              // Default: date (due date)
              return new Date(a.due_date) - new Date(b.due_date);
          }
      });
  };

  tasks?.forEach(task => {
      const date = parseISO(task.due_date);
      if (task.status === 'completed') {
          groupedTasks.completed.push(task);
      } else if (isPast(date) && !isToday(date)) {
          groupedTasks.overdue.push(task);
      } else if (isToday(date)) {
          groupedTasks.today.push(task);
      } else {
          groupedTasks.upcoming.push(task);
      }
  });

  // Apply sorting to all groups
  Object.keys(groupedTasks).forEach(key => {
      groupedTasks[key] = getSortedTasks(groupedTasks[key]);
  });

  console.log(groupedTasks);

  if (isLoading) return <SkeletonTaskManager />;

  return (
    <div className="max-w-4xl mx-auto pb-10 ">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                Action Items
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {tasks?.filter(t => t.status !== 'completed').length || 0} Open
                </span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your scheduled tasks and to-dos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             {/* Sort Select */}
            <div className="relative">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-xl leading-tight focus:outline-none focus:border-black text-sm font-bold h-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                    <option value="date">Sort by Date</option>
                    <option value="priority">Sort by Priority</option>
                    <option value="newest">Sort by Newest</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ArrowUpDown size={14} />
                </div>
            </div>

            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-lg shadow-black/20 flex items-center gap-2 font-medium justify-center"
            >
                <Plus size={20} /> New Task
            </button>
        </div>
      </div>

      {/* Task Sections */}
      <div className="space-y-8">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
              <section>
                  <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2">
                      <AlertCircle size={18} /> Overdue
                  </h3>
                  <div className="space-y-2">
                      {groupedTasks.overdue.map(task => (
                          <TaskItem 
                              key={task._id} 
                              task={task} 
                              toggle={toggleMutation} 
                              remove={deleteMutation} 
                              onConvert={(t) => {
                                  setTaskToConvert(t);
                                  setIsHabitModalOpen(true);
                              }}
                              onEdit={(t) => {
                                  setTaskToEdit(t);
                                  setIsEditModalOpen(true);
                              }}
                              onClick={() => {
                                  setSelectedTask(task);
                                  setIsDetailsModalOpen(true);
                              }}
                          />
                      ))}
                  </div>
              </section>
          )}

          {/* Today */}
          <section>
              <h3 className="font-bold mb-3 flex items-center gap-2 text-lg">
                  <Calendar size={18} /> Today
              </h3>
               {groupedTasks.today.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       No tasks scheduled for today.
                   </div>
               ) : (
                  <div className="space-y-2">
                      {groupedTasks.today.map(task => (
                          <TaskItem 
                              key={task._id} 
                              task={task} 
                              toggle={toggleMutation} 
                              remove={deleteMutation} 
                              onConvert={(t) => {
                                  setTaskToConvert(t);
                                  setIsHabitModalOpen(true);
                              }}
                              onEdit={(t) => {
                                  setTaskToEdit(t);
                                  setIsEditModalOpen(true);
                              }}
                              onClick={() => {
                                  setSelectedTask(task);
                                  setIsDetailsModalOpen(true);
                              }}
                          />
                      ))}
                  </div>
               )}
          </section>

          {/* Upcoming */}
          {groupedTasks.upcoming.length > 0 && (
              <section>
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-500">
                      <Clock size={18} /> Upcoming
                  </h3>
                  <div className="space-y-2">
                      {groupedTasks.upcoming.map(task => (
                          <TaskItem 
                              key={task._id} 
                              task={task} 
                              toggle={toggleMutation} 
                              remove={deleteMutation} 
                              onConvert={(t) => {
                                  setTaskToConvert(t);
                                  setIsHabitModalOpen(true);
                              }}
                              onEdit={(t) => {
                                  setTaskToEdit(t);
                                  setIsEditModalOpen(true);
                              }}
                              onClick={() => {
                                  setSelectedTask(task);
                                  setIsDetailsModalOpen(true);
                              }}
                          />
                      ))}
                  </div>
              </section>
          )}
          
           {/* Completed (Collapsed or Bottom) */}
           {groupedTasks.completed.length > 0 && (
              <section className="pt-8 border-t border-gray-100">
                  <h3 className="font-bold mb-3 text-gray-400 text-sm uppercase tracking-wider">Completed</h3>
                  <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                      {groupedTasks.completed.map(task => (
                          <TaskItem 
                              key={task._id} 
                              task={task} 
                              toggle={toggleMutation} 
                              remove={deleteMutation} 
                              onConvert={(t) => {
                                  setTaskToConvert(t);
                                  setIsHabitModalOpen(true);
                              }}
                              onEdit={(t) => {
                                  setTaskToEdit(t);
                                  setIsEditModalOpen(true);
                              }}
                          />
                      ))}
                  </div>
              </section>
          )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Task">
          <TaskForm 
            onSubmit={(data) => addMutation.mutate(data)}
            onCancel={() => setIsAddModalOpen(false)}
          />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setTaskToEdit(null); }} title="Edit Task">
        {taskToEdit && (
            <TaskForm
                initialValues={{
                    ...taskToEdit,
                    due_date: taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : ''
                }}
                onSubmit={(data) => editMutation.mutate({ id: taskToEdit._id, data })}
                onCancel={() => { setIsEditModalOpen(false); setTaskToEdit(null); }}
                submitLabel="Save Changes"
            />
        )}
      </Modal>

      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title="Convert to Habit">
          <HabitForm 
            initialValues={{ title: taskToConvert?.title || '', description: taskToConvert?.description || '' }}
            onSubmit={(data) => createHabitMutation.mutate(data)}
            onCancel={() => setIsHabitModalOpen(false)}
            submitLabel="Start Habit"
          />
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Task Details">
          {selectedTask && (
              <div className="space-y-6">
                  <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={clsx(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                            selectedTask.priority === 'high' ? "bg-red-100 text-red-700" :
                            selectedTask.priority === 'medium' ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-700"
                        )}>
                            {selectedTask.priority} Priority
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                            <Calendar size={12} />
                            Due: {format(parseISO(selectedTask.due_date), 'MMM d, yyyy')}
                        </span>
                        {selectedTask.estimated_cost > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 font-mono">
                                Cost: ₹{selectedTask.estimated_cost}
                            </span>
                        )}
                      </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                      {selectedTask.description || <span className="text-gray-400 italic">No description provided.</span>}
                  </div>

                  {/* Subtasks Section */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        Subtasks 
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {selectedTask.subtasks?.filter(s => s.completed).length || 0}/{(selectedTask.subtasks?.length || 0)}
                        </span>
                    </h3>
                    
                    {/* Add Subtask Input */}
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            placeholder="Add a subtask..." 
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newSubtask.trim()) {
                                    const updatedSubtasks = [...(selectedTask.subtasks || []), { title: newSubtask, completed: false }];
                                    editMutation.mutate({ 
                                        id: selectedTask._id, 
                                        data: { ...selectedTask, subtasks: updatedSubtasks } 
                                    }, {
                                        onSuccess: () => {
                                            setSelectedTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
                                            setNewSubtask('');
                                        }
                                    });
                                }
                            }}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                        />
                        <button 
                            onClick={() => {
                                if (newSubtask.trim()) {
                                    const updatedSubtasks = [...(selectedTask.subtasks || []), { title: newSubtask, completed: false }];
                                    editMutation.mutate({ 
                                        id: selectedTask._id, 
                                        data: { ...selectedTask, subtasks: updatedSubtasks } 
                                    }, {
                                        onSuccess: () => {
                                            setSelectedTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
                                            setNewSubtask('');
                                        }
                                    });
                                }
                            }}
                            className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Subtasks List */}
                    <div className="space-y-2">
                        {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                            selectedTask.subtasks.map((subtask, index) => (
                                <div key={index} className="flex items-center gap-3 group">
                                    <button 
                                        onClick={() => {
                                            const updatedSubtasks = [...selectedTask.subtasks];
                                            updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
                                            editMutation.mutate({ 
                                                id: selectedTask._id, 
                                                data: { ...selectedTask, subtasks: updatedSubtasks } 
                                            }, {
                                                onSuccess: () => setSelectedTask(prev => ({ ...prev, subtasks: updatedSubtasks }))
                                            });
                                        }}
                                        className={clsx(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                            subtask.completed ? "bg-black border-black text-white" : "border-gray-300 hover:border-black"
                                        )}
                                    >
                                        {subtask.completed && <CheckCircle2 size={12} />}
                                    </button>
                                    <span className={clsx(
                                        "flex-1 text-sm transition-all",
                                        subtask.completed ? "text-gray-400 line-through" : "text-gray-700"
                                    )}>
                                        {subtask.title}
                                    </span>
                                    <button 
                                        onClick={() => {
                                            const updatedSubtasks = selectedTask.subtasks.filter((_, i) => i !== index);
                                            editMutation.mutate({ 
                                                id: selectedTask._id, 
                                                data: { ...selectedTask, subtasks: updatedSubtasks } 
                                            }, {
                                                onSuccess: () => setSelectedTask(prev => ({ ...prev, subtasks: updatedSubtasks }))
                                            });
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic">No subtasks yet.</p>
                        )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                            setTaskToEdit(selectedTask);
                            setIsDetailsModalOpen(false);
                            setIsEditModalOpen(true);
                        }}
                      >
                        <Pencil size={16} className="mr-2" />
                        Edit Task
                      </Button>
                      <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>
                          Close
                      </Button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
}

function TaskItem({ task, toggle, remove, onConvert, onEdit, onClick }) {
    const isCompleted = task.status === 'completed';
    const date = parseISO(task.due_date);
    
    return (
        <div className={clsx(
            "group flex items-start gap-3 p-4 bg-white border rounded-xl transition-all duration-300",
            isCompleted ? "border-gray-100 bg-gray-50" : "border-gray-200 hover:border-black shadow-sm hover:shadow-md"
        )}>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    toggle.mutate({ id: task._id, status: isCompleted ? 'pending' : 'completed' });
                }}
                className={clsx(
                    "mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isCompleted ? "bg-black border-black text-white" : "border-gray-300 hover:border-black text-transparent"
                )}
            >
                <CheckCircle2 size={12} strokeWidth={3} />
            </button>
            
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
                <div className="flex items-start justify-between gap-2">
                    <h4 className={clsx(
                        "font-medium truncate transition-all",
                        isCompleted ? "text-gray-400 line-through" : "text-gray-900"
                    )}>
                        {task.title}
                    </h4>
                    
                    {/* Priority Dot */}
                    {!isCompleted && (
                        <div className={clsx(
                            "w-2 h-2 rounded-full flex-shrink-0 mt-2",
                            task.priority === 'high' ? "bg-red-500" : 
                            task.priority === 'medium' ? "bg-yellow-400" : "bg-green-400"
                        )} title={`Priority: ${task.priority}`} />
                    )}
                </div>
                
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className={clsx(
                        "flex items-center gap-1",
                        isPast(date) && !isToday(date) && !isCompleted ? "text-red-500 font-bold" : ""
                    )}>
                        <Calendar size={12} />
                        {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d')}
                    </span>
                    {task.description && <span className="truncate max-w-[200px]">{task.description}</span>}
                    {task.estimated_cost > 0 && (
                        <span className="flex items-center gap-1 font-mono font-medium text-black bg-gray-50 px-1.5 py-0.5 rounded">
                            ₹{task.estimated_cost}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => onEdit(task)}
                    className="p-1.5 text-gray-300 hover:text-black hover:bg-gray-100 rounded"
                    title="Edit Task"
                >
                    <Pencil size={16} />
                </button>
                <button 
                    onClick={() => onConvert(task)}
                    className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded"
                    title="Convert to Habit"
                >
                    <Zap size={16} />
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        confirmAction('Delete this task?', () => remove.mutate(task._id));
                    }}
                    disabled={remove.isLoading || remove.isPending}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
