import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Brain, Trash2, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GoalForm from '../components/GoalForm';
import HabitForm from '../components/HabitForm';
import toast from 'react-hot-toast';
import SkeletonBrainDump from '../components/skeletons/SkeletonBrainDump';
import { confirmAction } from '../components/ui/ConfirmationToast';

export default function BrainDump() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  
  // Conversion State
  const [convertItem, setConvertItem] = useState(null); // The item being processed
  const [convertType, setConvertType] = useState('habit'); // 'habit' | 'goal' | 'task'
  const [convertTitle, setConvertTitle] = useState('');
  // Task specific
  const [convertDate, setConvertDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertPriority, setConvertPriority] = useState('medium');

  // Fetch Items
  const { data: items, isLoading } = useQuery({
    queryKey: ['dump'],
    queryFn: async () => {
      const { data } = await api.get('/dump');
      return data;
    },
  });

  // Add Item
  const addMutation = useMutation({
    mutationFn: async (content) => {
      return api.post('/dump', { content, type: 'note' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dump']);
      queryClient.invalidateQueries(['dashboard']);
      setContent('');
      toast.success('Thought captured');
    },
  });

  // Delete Item
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/dump/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dump']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Item deleted');
    },
  });



  // Conversion Mutation (Create Goal/Habit/Task + Archive Dump)
  const convertMutation = useMutation({
    mutationFn: async (payload) => {
      // payload can be the goal/task object from form, or null (using state)
      
      const sourceId = convertItem?._id;
      
      if (convertType === 'habit') {
        await api.post('/habits', { 
            ...payload
        });
      } else if (convertType === 'goal') {
        // payload is the GoalForm data
        await api.post('/goals', { 
            ...payload, 
            milestones: [],
            source_thought_id: sourceId 
        });
        // Update Brain Dump item
        if (convertItem) await api.put(`/dump/${convertItem._id}`, { 
            processed: true,
            converted_to: { id: null, type: 'Goal' } // We don't get ID back easily without separate call, but backend could return it.
            // For now just marking processed. To link ID we need the response.
        });
      } else if (convertType === 'task') {
        await api.post('/tasks', { 
            title: convertTitle, 
            due_date: convertDate,
            priority: convertPriority,
            source_thought_id: sourceId
        });
        if (convertItem) await api.put(`/dump/${convertItem._id}`, { 
            processed: true,
            converted_to: { id: null, type: 'Task' }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dump']);
      queryClient.invalidateQueries(['habits']);
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(`Converted to ${convertType}`);
      setConvertItem(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addMutation.mutate(content);
  };

  const openConvertModal = (item) => {
    setConvertItem(item);
    setConvertTitle(item.content); // Pre-fill
    setConvertType('task'); // Default to task as it's most common
    setConvertDate(new Date().toISOString().split('T')[0]);
    setConvertPriority('medium');
  };

  if (isLoading) return <SkeletonBrainDump />;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary text-white rounded-2xl shadow-soft">
          <Brain size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Brain Dump</h1>
          <p className="text-muted text-sm font-medium">Capture ideas now, process later. Keep your mind clear.</p>
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mb-10 relative group">
        <div className="relative z-10">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-40 p-6 bg-white/80 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl focus:border-primary/20 focus:bg-white outline-none resize-none shadow-soft transition-all text-lg placeholder:text-gray-300"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="absolute bottom-4 right-4 text-xs font-bold text-muted uppercase tracking-wider opacity-50 group-hover:opacity-100 transition-opacity">
            Press Enter to save
          </div>
        </div>
        {/* Decorative background blob */}
        <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-r from-wellness-blue/30 to-wellness-lavender/30 rounded-3xl blur-xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <Button 
            type="submit" 
            className="mt-4 w-full py-4 rounded-xl shadow-soft hover:shadow-soft-hover"
            disabled={!content.trim()}
        >
            Capture Thought
        </Button>
      </form>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-300 py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Brain size={32} className="opacity-20" />
            </div>
            <p className="italic font-medium">Your mind is clear.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div 
                key={item._id} 
                className="group bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-soft hover:border-gray-200 transition-all flex justify-between items-start animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
            >
              <p className="whitespace-pre-wrap text-primary text-base leading-relaxed flex-1 mr-6">{item.content}</p>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                 {/* Process Button opens Modal */}
                <button 
                  onClick={() => openConvertModal(item)}
                  className="p-2 hover:bg-black hover:text-white rounded-xl text-muted transition-colors shadow-sm bg-gray-50 top-action-btn"
                  title="Process / Convert"
                >
                  <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => confirmAction('Delete this thought?', () => deleteMutation.mutate(item._id))}
                  disabled={deleteMutation.isLoading || deleteMutation.isPending}
                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl text-muted transition-colors shadow-sm bg-gray-50 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Conversion Modal */}
      <Modal 
        isOpen={!!convertItem} 
        onClose={() => setConvertItem(null)} 
        title="Process Thought"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Convert To</label>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              <button 
                className={`py-1.5 rounded-md text-sm font-medium transition-colors ${convertType === 'task' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                onClick={() => setConvertType('task')}
              >
                Task
              </button>
              <button 
                className={`py-1.5 rounded-md text-sm font-medium transition-colors ${convertType === 'habit' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                onClick={() => setConvertType('habit')}
              >
                Habit
              </button>
              <button 
                className={`py-1.5 rounded-md text-sm font-medium transition-colors ${convertType === 'goal' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                onClick={() => setConvertType('goal')}
              >
                Goal
              </button>
            </div>
          </div>

          {convertType === 'goal' ? (
              <GoalForm 
                initialValues={{ title: convertItem?.content || '' }}
                onSubmit={(data) => convertMutation.mutate(data)}
                submitLabel="Convert to Goal"
              />
          ) : convertType === 'habit' ? (
              <HabitForm 
                initialValues={{ title: convertItem?.content || '' }}
                onSubmit={(data) => convertMutation.mutate(data)}
                submitLabel="Convert to Habit"
              />
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="input-field w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5" 
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                />
              </div>

              {convertType === 'task' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <input 
                          type="date" 
                          className="input-field w-full appearance-none" 
                          style={{ WebkitAppearance: 'none' }}
                          value={convertDate}
                          onChange={(e) => setConvertDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                            value={convertPriority}
                            onChange={e => setConvertPriority(e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                      </div>
                  </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConvertItem(null)}>Cancel</Button>
                <Button onClick={() => convertMutation.mutate()}>Convert & Archive</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

    </div>
  );
}
