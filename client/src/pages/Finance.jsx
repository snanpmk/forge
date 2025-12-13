import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { DollarSign, TrendingUp, TrendingDown, Trash2, ArrowRightLeft, Briefcase, HandCoins, IndianRupee, Filter, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import FinanceAnalytics from '../components/FinanceAnalytics';

const TRANSACTION_TYPES = [
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'expense', label: 'Expense', icon: TrendingDown },
  { id: 'invested', label: 'Invested', icon: Briefcase },
  { id: 'lended', label: 'Lended', icon: ArrowRightLeft },
  { id: 'borrowed', label: 'Borrowed', icon: HandCoins },
];

const CATEGORIES = [
  "Food", "Rent", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Education", "Other"
];

export default function Finance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'budget' | 'analytics'
  const [filterType, setFilterType] = useState('all');
  
  // Transaction Form State
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    related_entity: ''
  });

  // Budget Form State
  const [budgetForm, setBudgetForm] = useState({
    category: 'Food',
    limit: ''
  });

  const currentMonth = format(new Date(), 'yyyy-MM');

  // Queries
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['finance'],
    queryFn: async () => (await api.get('/finance')).data,
  });

  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ['budget', currentMonth],
    queryFn: async () => (await api.get(`/budget?month=${currentMonth}`)).data,
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => (await api.get('/goals')).data,
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data,
  });

  // Transaction Mutations
  const addTransactionMutation = useMutation({
    mutationFn: async (data) => api.post('/finance', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['finance']);
      queryClient.invalidateQueries(['dashboard']);
      setFormData({ type: 'expense', amount: '', category: '', description: '', related_entity: '' });
      toast.success('Transaction added');
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id) => api.delete(`/finance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['finance']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Transaction deleted');
    },
  });

  // Budget Mutation
  const setBudgetMutation = useMutation({
    mutationFn: async (data) => api.post('/budget', { ...data, month: currentMonth }),
    onSuccess: () => {
      queryClient.invalidateQueries(['budget']);
      toast.success('Budget updated');
      setBudgetForm({ category: 'Food', limit: '' });
    },
  });

  const handleSubmitTransaction = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    addTransactionMutation.mutate({ ...formData, amount: Number(formData.amount) });
  };

  const handleSubmitBudget = (e) => {
    e.preventDefault();
    if (!budgetForm.limit) return;
    setBudgetMutation.mutate({ ...budgetForm, limit: Number(budgetForm.limit) });
  };

  // Helper to get dynamic placeholder
  const getEntityPlaceholder = (type) => {
    switch(type) {
        case 'lended': return 'Lended To (e.g. John)';
        case 'borrowed': return 'Borrowed From (e.g. Mike)';
        case 'invested': return 'Invested In (e.g. Stocks, Crypto)';
        default: return null;
    }
  };

  // Calculations
  const calculateTotal = (types) => 
    transactions?.filter(t => types.includes(t.type)).reduce((acc, t) => acc + t.amount, 0) || 0;

  const totalIn = calculateTotal(['income', 'borrowed']);
  const totalOut = calculateTotal(['expense', 'lended', 'invested']);
  const net = totalIn - totalOut;

  const filteredTransactions = transactions?.filter(t => filterType === 'all' || t.type === filterType) || [];

  // Calculate Budget Progress
  const getBudgetProgress = (category) => {
    const limit = budgets?.find(b => b.category === category)?.limit || 0;
    const spent = transactions
      ?.filter(t => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase() && t.date.startsWith(currentMonth)) // Note: t.date is ISO string, simplistic check
      // Better date check:
      ?.filter(t => {
         const tDate = t.date.substring(0, 7); // YYYY-MM
         return t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase() && tDate === currentMonth;
      })
      .reduce((acc, t) => acc + t.amount, 0) || 0;
      
    return { limit, spent, percentage: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0 };
  };

  if (loadingTransactions) return <div className="p-4">Loading...</div>;

  return (
    <div className="mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Finance</h1>
        {/* Toggle Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
           <button 
             onClick={() => setActiveTab('transactions')}
             className={clsx("flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors text-center", activeTab === 'transactions' ? "bg-white shadow text-black" : "text-gray-500 hover:text-black")}
           >
             Transactions
           </button>
            <button 
             onClick={() => setActiveTab('analytics')}
             className={clsx("flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors text-center", activeTab === 'analytics' ? "bg-white shadow text-black" : "text-gray-500 hover:text-black")}
           >
             Analytics
           </button>
           <button 
             onClick={() => setActiveTab('budget')}
             className={clsx("flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors text-center", activeTab === 'budget' ? "bg-white shadow text-black" : "text-gray-500 hover:text-black")}
           >
             Budget Planner
           </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
         <FinanceAnalytics transactions={transactions} />
      )}

      {activeTab === 'transactions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Col: Form and Summary */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="card bg-black text-white border-none space-y-4">
              <div>
                <span className="text-gray-400 text-sm">Net Balance</span>
                <div className="text-4xl font-bold font-mono">₹{net.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <div className="flex items-center gap-1 text-green-400 text-sm mb-1">
                    <TrendingUp size={14} /> In (Inc+Bor)
                  </div>
                  <div className="font-mono text-xl">₹{totalIn.toFixed(2)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-red-400 text-sm mb-1">
                    <TrendingDown size={14} /> Out (Exp+Len+Inv)
                  </div>
                  <div className="font-mono text-xl">₹{totalOut.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Add Transaction Form */}
            <div className="card">
              <h3 className="font-bold mb-4">New Transaction</h3>
              <form onSubmit={handleSubmitTransaction} className="space-y-4">
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-1">
                  {TRANSACTION_TYPES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={clsx(
                        "py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all border",
                        formData.type === id 
                          ? "bg-black text-white border-black shadow-md" 
                          : "bg-white text-gray-500 border-transparent hover:border-gray-200"
                      )}
                      onClick={() => setFormData({ ...formData, type: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                
                <div>
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    className="input-field"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                
                {/* Dynamic Entity Field for Loan/Invest */}
                {getEntityPlaceholder(formData.type) && (
                    <div>
                        <input
                            type="text"
                            placeholder={getEntityPlaceholder(formData.type)}
                            className="input-field bg-blue-50/50 border-blue-100 focus:border-blue-300"
                            value={formData.related_entity}
                            onChange={e => setFormData({...formData, related_entity: e.target.value})}
                        />
                    </div>
                )}
                
                {/* Link to Goal / Task (Expenses only) */}
                {formData.type === 'expense' && (
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            className="input-field text-xs"
                            value={formData.goal_link_id || ''}
                            onChange={e => setFormData({ ...formData, goal_link_id: e.target.value || null, task_link_id: null })}
                        >
                            <option value="">Link to Goal (Optional)</option>
                            {goals?.map(g => (
                                <option key={g._id} value={g._id}>{g.title}</option>
                            ))}
                        </select>
                         <select
                            className="input-field text-xs"
                            value={formData.task_link_id || ''}
                            onChange={e => setFormData({ ...formData, task_link_id: e.target.value || null, goal_link_id: null })}
                        >
                            <option value="">Link to Task (Optional)</option>
                            {tasks?.map(t => (
                                <option key={t._id} value={t._id}>{t.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                  <input
                    type="text" // Could act as autocomplete in future
                    placeholder="Category (e.g., Food, Salary)"
                    list="category-suggestions"
                    className="input-field"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                  <datalist id="category-suggestions">
                    {CATEGORIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    className="input-field"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Transaction
                </Button>
              </form>
            </div>
          </div>

          {/* Right Col: Transactions List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent History</h2>
                {/* Filter Dropdown */}
                <div className="relative inline-block">
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:border-black text-sm font-medium h-9"
                    >
                        <option value="all">All Transactions</option>
                        {TRANSACTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <Filter size={14} />
                    </div>
                </div>
            </div>

            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? <p className="text-gray-500">No transactions recorded.</p> : (
                filteredTransactions.map(t => {
                  const isPositive = ['income', 'borrowed'].includes(t.type);
                  return (
                  <div key={t._id} className="group bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:border-black transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center border shrink-0",
                        isPositive ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        <IndianRupee size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{t.category}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide font-bold">
                            {t.type}
                          </span>
                        </div>
                        {/* Details Row */}
                        <div className="text-xs text-gray-500 mt-1">
                            <span className="font-mono">{format(new Date(t.date), 'MMM d, yyyy')}</span>
                            {t.related_entity && (
                                <span className="ml-2 font-medium text-black">
                                    {t.type === 'lended' ? '→ ' : t.type === 'borrowed' ? '← ' : '@ '} 
                                    {t.related_entity}
                                </span>
                            )}
                            {t.description && <span className="ml-2 text-gray-400">• {t.description}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={clsx("font-mono font-bold whitespace-nowrap", isPositive ? "text-green-600" : "text-black")}>
                        {isPositive ? '+' : '-'}₹{t.amount.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => deleteTransactionMutation.mutate(t._id)}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Budget Planning Form */}
           <div className="space-y-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="text-black" />
                  <h3 className="font-bold">Set Monthly Budget</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Plan your spending limits for <span className="font-bold text-black">{format(new Date(), 'MMMM yyyy')}</span>.</p>
                
                <form onSubmit={handleSubmitBudget} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select 
                        className="input-field"
                        value={budgetForm.category}
                        onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Limit (₹)</label>
                      <input 
                        type="number"
                        className="input-field"
                        placeholder="e.g. 5000"
                        value={budgetForm.limit}
                        onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})}
                      />
                   </div>
                   <Button type="submit" className="w-full">Set Budget</Button>
                </form>
              </div>
           </div>

           {/* Budget List & Progress */}
           <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold">Budget Status</h2>
              {budgets?.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  No budgets set for this month. Start planning!
                </div>
              ) : (
                budgets?.map(budget => {
                  const { limit, spent, percentage } = getBudgetProgress(budget.category);
                  const isOver = spent > limit;
                  return (
                    <div key={budget._id} className="card">
                      <div className="flex justify-between items-end mb-2">
                         <div>
                            <h4 className="font-bold text-lg">{budget.category}</h4>
                            <div className="text-xs text-gray-500">
                              Spent <span className={isOver ? "text-red-500 font-bold" : "text-black font-bold"}>₹{spent}</span> of <span className="text-gray-800">₹{limit}</span>
                            </div>
                         </div>
                         <div className="text-right">
                           <span className={clsx("font-bold text-lg", isOver ? "text-red-500" : "text-black")}>
                             {percentage.toFixed(0)}%
                           </span>
                         </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx("h-full transition-all duration-500", isOver ? "bg-red-500" : "bg-black")}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>
      )}
    </div>
  );
}
