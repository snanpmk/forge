import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Brain, Trash2, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GoalForm from '../components/GoalForm';
import HabitForm from '../components/HabitForm';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

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

  // Archive Item (Mark Processed)
  const archiveMutation = useMutation({
    mutationFn: async (id) => {
      return api.put(`/dump/${id}`, { processed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dump']);
      queryClient.invalidateQueries(['dashboard']);
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

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-black text-white rounded-lg">
          <Brain size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Brain Dump</h1>
          <p className="text-gray-500 text-sm">Capture ideas now, process later.</p>
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-32 p-4 bg-white border border-gray-300 rounded-xl focus:border-black outline-none resize-none shadow-sm text-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            Press Enter to save
          </div>
        </div>
        <Button 
            type="submit" 
            className="mt-2 w-full py-3"
            disabled={!content.trim()}
        >
            Capture Thought
        </Button>
      </form>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-300 py-10 italic">
            Your mind is clear.
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="group bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:border-gray-400 transition-colors flex justify-between items-start animate-fade-in">
              <p className="whitespace-pre-wrap text-gray-800 flex-1 mr-4">{item.content}</p>
              
              <div className="flex items-center gap-1 opacity-100 md:opacity-50 md:group-hover:opacity-100 transition-opacity">
                 {/* Process Button opens Modal */}
                <button 
                  onClick={() => openConvertModal(item)}
                  className="p-1.5 hover:bg-black hover:text-white rounded text-gray-600 transition-colors"
                  title="Process / Convert"
                >
                  <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => deleteMutation.mutate(item._id)}
                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
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
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button 
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${convertType === 'task' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                onClick={() => setConvertType('task')}
              >
                Task
              </button>
              <button 
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${convertType === 'habit' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                onClick={() => setConvertType('habit')}
              >
                Habit
              </button>
              <button 
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${convertType === 'goal' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
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
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5" 
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

              <div className="pt-4 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setConvertItem(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => convertMutation.mutate()}>Convert & Archive</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

    </div>
  );
}
