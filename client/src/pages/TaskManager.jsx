import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, Calendar, Clock, AlertCircle, CheckCircle2, Circle, Trash2, Zap, Pencil } from 'lucide-react';
import { format, isToday, isPast, isTomorrow, addDays, parseISO } from 'date-fns';
import clsx from 'clsx';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import TaskForm from '../components/TaskForm';
import HabitForm from '../components/HabitForm';
import SkeletonTaskManager from '../components/skeletons/SkeletonTaskManager';

import { useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function TaskManager() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
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
    },
  });

  // Group Tasks
  const groupedTasks = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: []
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
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-lg shadow-black/20 flex items-center gap-2 font-medium w-full sm:w-auto justify-center"
        >
            <Plus size={20} /> New Task
        </button>
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
                    onClick={() => remove.mutate(task._id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
