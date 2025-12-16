import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ShoppingCart, Plus, Check, Trash2, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { confirmAction } from '../components/ui/ConfirmationToast';

export default function ShoppingList() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  // Fetch Items
  const { data: shoppingItems, isLoading } = useQuery({
    queryKey: ['shopping'],
    queryFn: async () => (await api.get('/shopping')).data,
  });

  // Add Item Mutation
  const addItemMutation = useMutation({
    mutationFn: async (content) => api.post('/shopping', { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping']);
      setNewItemText('');
      toast.success('Item added');
    },
  });

  // Toggle Check Mutation
  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, is_checked }) => api.put(`/shopping/${id}`, { is_checked }),
    onSuccess: () => queryClient.invalidateQueries(['shopping']),
  });

  // Delete Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id) => api.delete(`/shopping/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping']);
      toast.success('Item deleted');
    },
  });
  
  // Convert to Task Mutation
  const convertToTaskMutation = useMutation({
      mutationFn: async (item) => {
          // 1. Create Task
          await api.post('/tasks', { 
              title: `Buy ${item.content}`,
              priority: 'medium',
              due_date: new Date().toISOString().split('T')[0] // Today
          });
          // 2. Delete from Shopping List
          await api.delete(`/shopping/${item._id}`);
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['shopping']);
          queryClient.invalidateQueries(['tasks']); // Refresh tasks too if we navigated there
          toast.success('Converted to Task');
      }
  });

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addItemMutation.mutate(newItemText);
  };

  if (isLoading) return <div className="p-8"><div className="animate-pulse h-10 w-full bg-gray-200 rounded mb-4" /></div>;

  return (
    <div className="mx-auto pb-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold soft-gradient-text">Shopping List</h1>
      </div>

      {/* Add Item Input */}
      <form onSubmit={handleAddItem} className="mb-8 relative group">
        <input
          type="text"
          placeholder="What do you need to buy?"
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-6 pr-14 text-lg shadow-sm focus:shadow-md focus:border-primary transition-all outline-none"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
          disabled={!newItemText.trim()}
        >
          <Plus size={20} />
        </button>
      </form>

      {/* List */}
      <div className="space-y-3">
        {shoppingItems?.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Your list is empty.</p>
            <p className="text-sm">Add items to keep track of your shopping.</p>
          </div>
        ) : (
          shoppingItems?.map((item) => (
            <div
              key={item._id}
              className={clsx(
                "group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all",
                item.is_checked && "bg-gray-50/50"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleItemMutation.mutate({ id: item._id, is_checked: !item.is_checked })}
                  className={clsx(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    item.is_checked
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-green-400 text-transparent"
                  )}
                >
                  <Check size={14} strokeWidth={3} />
                </button>
                <span className={clsx("text-lg font-medium transition-all", item.is_checked ? "text-gray-400 line-through" : "text-gray-800")}>
                    {item.content}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                 {/* Convert to Task */}
                 {!item.is_checked && (
                     <button
                        onClick={() => convertToTaskMutation.mutate(item)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                        title="Convert to Task"
                     >
                         Task <ArrowRight size={14} />
                     </button>
                 )}
                 
                 <button
                    onClick={() => confirmAction('Delete this item?', () => deleteItemMutation.mutate(item._id))}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
