import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { DollarSign, TrendingUp, TrendingDown, Trash2, ArrowRightLeft, Briefcase, HandCoins, IndianRupee, Filter, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import FinanceAnalytics from '../components/FinanceAnalytics';

import SkeletonFinance from '../components/skeletons/SkeletonFinance';
import { confirmAction } from '../components/ui/ConfirmationToast';

const TRANSACTION_TYPES = [
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'expense', label: 'Expense', icon: TrendingDown },
  { id: 'invested', label: 'Invested', icon: Briefcase },
  { id: 'lended', label: 'Lended', icon: ArrowRightLeft },
  { id: 'borrowed', label: 'Borrowed', icon: HandCoins },
];


// Default Fallbacks
const DEFAULT_INCOME_CATEGORIES = [
  "Salary", "Freelance", "Business Profit", "Investments", "Dividends", 
  "Rental Income", "Refunds", "Grants/Awards", "Gifts", "Allowance", 
  "Bonus", "Side Hustle", "Pension", "Other"
];

const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent/Mortgage", "Maintenance", "Electricity", "Water", "Internet/WiFi", "Phone Bill", "Gas",
  "Groceries", "Dining Out", "Coffee/Snacks", "Alcohol",
  "Fuel", "Public Transport", "Taxi/Uber", "Car Maintenance", "Parking", "Vehicle Insurance",
  "Health Insurance", "Doctor/Medical", "Pharmacy", "Gym/Fitness", "Personal Care", "Hair/Beauty",
  "Clothing", "Electronics", "Home Decor", "Subscriptions", "Hobbies", "Entertainment",
  "Tuition", "Books/Courses", "Stationery", "Software",
  "Loan Repayment", "Credit Card Bill", "Tax", "Insurance", "Fees/Charges",
  "Gifts", "Donations", "Family Support", "Pet Care", "Childcare",
  "Travel", "Emergency", "Other"
];

import { useAuth } from '../context/AuthContext';

export default function Finance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'budget' | 'analytics'
  const [filterType, setFilterType] = useState('all');
  
  const INCOME_CATEGORIES = user?.finance_settings?.categories?.income || DEFAULT_INCOME_CATEGORIES;
  const EXPENSE_CATEGORIES = user?.finance_settings?.categories?.expense || DEFAULT_EXPENSE_CATEGORIES;

  // Transaction Form State
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    related_entity: '' // For loans/debts
  });

  // Budget Form State
  const [budgetForm, setBudgetForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    limit: ''
  });

  const currentMonth = format(new Date(), 'yyyy-MM');

  // Queries
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['finance'],
    queryFn: async () => (await api.get('/finance')).data,
  });

  const { data: budgets } = useQuery({
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
      setFormData(prev => ({ ...prev, amount: '', description: '', related_entity: '' })); // Keep type/category for rapid entry
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
      setBudgetForm({ category: EXPENSE_CATEGORIES[0], limit: '' });
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
      ?.filter(t => {
         const tDate = t.date.substring(0, 7); // YYYY-MM
         // Match category loosely to allow for legacy data
         return t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase() && tDate === currentMonth;
      })
      .reduce((acc, t) => acc + t.amount, 0) || 0;
      
    return { limit, spent, percentage: limit > 0 ? Math.min((spent / limit) * 100, 100) : 0 };
  };

  const activeCategories = ['income', 'borrowed'].includes(formData.type) ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Initialize category if empty or mismatch
  React.useEffect(() => {
      if (!activeCategories.includes(formData.category)) {
          setFormData(prev => ({ ...prev, category: activeCategories[0] }));
      }
  }, [formData.type]);

  if (loadingTransactions) return <SkeletonFinance />;

  return (
    <div className="mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold soft-gradient-text tracking-tight">Finance</h1>
        {/* Toggle Tabs */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl w-full sm:w-auto shadow-inner">
           {['transactions', 'analytics', 'budget'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={clsx(
                     "flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize", 
                     activeTab === tab ? "bg-white shadow-sm text-primary scale-105" : "text-gray-500 hover:text-gray-900"
                 )}
               >
                 {tab === 'budget' ? 'Budgeting' : tab}
               </button>
           ))}
        </div>
      </div>

      {activeTab === 'analytics' && (
         <FinanceAnalytics transactions={transactions} />
      )}

      {activeTab === 'transactions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">

          {/* Left Col: Form and Summary */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="card bg-black text-white border-none space-y-5 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative z-10">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Net Balance</span>
                <div className="text-4xl sm:text-5xl font-bold font-mono mt-1 tracking-tight">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase mb-1">
                    <div className="p-1 bg-green-400/20 rounded"><TrendingUp size={12} /></div> In
                  </div>
                  <div className="font-mono text-lg font-bold">₹{totalIn.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase mb-1">
                     <div className="p-1 bg-red-400/20 rounded"><TrendingDown size={12} /></div> Out
                  </div>
                  <div className="font-mono text-lg font-bold">₹{totalOut.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Add Transaction Form */}
            <div className="card shadow-soft p-6">
              <h3 className="font-bold text-lg mb-5">New Transaction</h3>
              <form onSubmit={handleSubmitTransaction} className="space-y-5">
                {/* Type Selection */}
                <div className="p-1 bg-gray-50 rounded-xl grid grid-cols-5 gap-1">
                  {TRANSACTION_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      className={clsx(
                        "py-2 rounded-lg flex items-center justify-center transition-all",
                        formData.type === id 
                          ? "bg-white text-black shadow-sm ring-1 ring-black/5" 
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      )}
                      onClick={() => setFormData({ ...formData, type: id })}
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
                
                {/* Amount */}
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                        type="number"
                        placeholder="0.00"
                        className="input-field pl-8 font-mono text-lg font-bold"
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
                            className="input-field bg-blue-50/50 border-blue-100 focus:border-blue-300 placeholder:text-blue-300"
                            value={formData.related_entity}
                            onChange={e => setFormData({...formData, related_entity: e.target.value})}
                        />
                    </div>
                )}
                
                {/* Link to Goal / Task (Expenses only) */}
                {formData.type === 'expense' && (
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            className="input-field text-xs py-2.5"
                            value={formData.goal_link_id || ''}
                            onChange={e => setFormData({ ...formData, goal_link_id: e.target.value || null, task_link_id: null })}
                        >
                            <option value="">Link Goal (Opt)</option>
                            {goals?.map(g => (
                                <option key={g._id} value={g._id}>{g.title}</option>
                            ))}
                        </select>
                         <select
                            className="input-field text-xs py-2.5"
                            value={formData.task_link_id || ''}
                            onChange={e => setFormData({ ...formData, task_link_id: e.target.value || null, goal_link_id: null })}
                        >
                            <option value="">Link Task (Opt)</option>
                            {tasks?.map(t => (
                                <option key={t._id} value={t._id}>{t.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Category Selection - REVERTED TO SELECT + CUSTOM */}
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Category</label>
                   <div className="flex flex-col gap-2">
                       <select
                           className="input-field appearance-none"
                           value={activeCategories.includes(formData.category) ? formData.category : 'Other'}
                           onChange={e => {
                               const val = e.target.value;
                               if (val === 'Other') {
                                   setFormData({...formData, category: ''}); // Clear for custom input
                               } else {
                                   setFormData({...formData, category: val});
                               }
                           }}
                       >
                            <option value="" disabled>Select Category</option>
                            {activeCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="Other">Other (Custom)</option>
                       </select>
                       
                       {/* Show Input if 'Other' is selected implicitly or explicitly */}
                       {(!activeCategories.includes(formData.category) || formData.category === 'Other') && (
                           <input
                               type="text"
                               placeholder="Enter Custom Category..."
                               className="input-field bg-gray-50 border-gray-200"
                               value={formData.category === 'Other' ? '' : formData.category}
                               onChange={e => setFormData({...formData, category: e.target.value})}
                               autoFocus
                           />
                       )}
                   </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Note / Description"
                    className="input-field text-sm"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <Button type="submit" className="w-full py-3 text-sm font-bold shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all active:scale-[0.98]">
                  Add Transaction
                </Button>
              </form>
            </div>
          </div>

          {/* Right Col: Transactions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Recent History</h2>
                {/* Filter Dropdown */}
                <div className="relative inline-block">
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded-xl leading-tight focus:outline-none focus:border-black text-xs font-bold h-9 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <option value="all">All Transactions</option>
                        {TRANSACTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <Filter size={14} />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <DollarSign size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No transactions found.</p>
                  </div>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const isPositive = ['income', 'borrowed'].includes(t.type);
                  return (
                  <div 
                    key={t._id} 
                    className="group bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:border-gray-300 hover:shadow-soft transition-all animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                        isPositive ? "bg-green-50 text-green-600 group-hover:bg-green-100" : "bg-red-50 text-red-600 group-hover:bg-red-100"
                      )}>
                        {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{t.category}</span>
                          <span className={clsx(
                              "text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wide font-bold",
                              isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {t.type}
                          </span>
                        </div>
                        {/* Details Row */}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span className="font-mono">{format(new Date(t.date), 'MMM d')}</span>
                            {(t.related_entity || t.description) && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                            <span className="truncate max-w-[150px] sm:max-w-[300px]">
                                {t.related_entity && <span className="font-bold text-gray-700 mr-1">{t.related_entity}</span>}
                                {t.description}
                            </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={clsx("font-mono font-bold whitespace-nowrap text-lg", isPositive ? "text-green-600" : "text-gray-900")}>
                        {isPositive ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                      </span>
                      <button 
                        onClick={() => confirmAction('Delete this transaction?', () => deleteTransactionMutation.mutate(t._id))}
                        disabled={deleteTransactionMutation.isLoading || deleteTransactionMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg transform scale-90 active:scale-95 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
           {/* Budget Planning Form */}
           <div className="space-y-6">
              <div className="card shadow-soft p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-black text-white rounded-xl shadow-lg">
                      <PieChart size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Monthly Budget</h3>
                    <p className="text-xs text-gray-500 font-medium">{format(new Date(), 'MMMM yyyy')}</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitBudget} className="space-y-5">
                   <div>
                      <label className="label">Category</label>
                      <select 
                        className="input-field"
                        value={budgetForm.category}
                        onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                      >
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="label">Monthly Limit</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                          <input 
                            type="number"
                            className="input-field pl-8 font-mono font-bold"
                            placeholder="5000"
                            value={budgetForm.limit}
                            onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})}
                          />
                      </div>
                   </div>
                   <Button type="submit" className="w-full shadow-lg shadow-primary/20">Set Limit</Button>
                </form>
              </div>
           </div>

           {/* Budget List & Progress */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-bold">Your Budgets</h2>
                 <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{budgets?.length || 0} Categories</span>
              </div>
              
              {budgets?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                      <PieChart size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">No budgets set for this month.</p>
                  <p className="text-xs text-gray-400 mt-1">Start by adding a category limit on the left.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets?.map(budget => {
                  const { limit, spent, percentage } = getBudgetProgress(budget.category);
                  const isOver = spent > limit;
                  const isNear = percentage > 80 && !isOver;
                  
                  return (
                    <div key={budget._id} className="card group hover:shadow-soft transition-all border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h4 className="font-bold text-lg">{budget.category}</h4>
                            <div className="text-xs font-medium text-gray-400 mt-0.5">
                              Budget: ₹{limit.toLocaleString()}
                            </div>
                         </div>
                         <div className={clsx(
                             "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                             isOver ? "bg-red-100 text-red-600" : isNear ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                         )}>
                             {percentage.toFixed(0)}%
                         </div>
                      </div>
                      
                      {/* Detailed Stats */}
                      <div className="flex items-end justify-between text-sm mb-2">
                          <span className={clsx("font-bold", isOver ? "text-red-500" : "text-gray-900")}>₹{spent.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 font-medium">remaining: ₹{Math.max(0, limit - spent).toLocaleString()}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx("h-full transition-all duration-1000 ease-out rounded-full", 
                              isOver ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-black"
                          )}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
