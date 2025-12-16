import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import clsx from 'clsx';

export default function FinanceAnalytics({ transactions }) {
  if (!transactions || transactions.length === 0) return null;

  // 1. Spending by Category (Pie Chart)
  // Filter only expenses
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const categoryData = Object.values(expenses.reduce((acc, t) => {
    const cat = t.category;
    if (!acc[cat]) acc[cat] = { name: cat, value: 0 };
    acc[cat].value += t.amount;
    return acc;
  }, {}));

  // Sort by value desc
  categoryData.sort((a, b) => b.value - a.value);

  // Colors for Pie Chart (Vibrant Palette)
  const COLORS = ['#3b82f6', '#ec4899', '#06b6d4', '#f59e0b', '#8b5cf6', '#10b981']; // Blue, Pink, Cyan, Amber, Violet, Emerald

  // 2. Weekly Spending Trend (Bar Chart)
  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'MMM dd'),
      fullDate: d,
      income: 0,
      expense: 0
    };
  });

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const dayStat = last7Days.find(d => isSameDay(d.fullDate, tDate));
    if (dayStat) {
      if (t.type === 'income') dayStat.income += t.amount;
      if (t.type === 'expense') dayStat.expense += t.amount;
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fade-in">
      {/* Category Breakdown */}
      <div className="card h-80 sm:h-96 flex flex-col relative">
        <h3 className="font-bold text-lg mb-4">Expense Breakdown</h3>
        <div className="flex-1 w-full min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `₹${value}`} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 opacity-0 md:opacity-100 transition-opacity">
               <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</span>
               <span className="text-xl font-bold text-gray-900">₹{expenses.reduce((acc, t) => acc + t.amount, 0)}</span>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="card h-64 sm:h-96 flex flex-col">
        <h3 className="font-bold text-lg mb-4">Weekly Activity</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7Days}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                 <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3}/>
                 </linearGradient>
                 <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                 </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                 cursor={{fill: '#f9fafb'}}
                 content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                        <p className="font-bold text-xs mb-2 text-gray-400 uppercase">{label}</p>
                        <div className="space-y-1">
                            {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-xs min-w-[120px]">
                                <span className={clsx("font-medium", entry.name === 'Income' ? 'text-green-600' : 'text-red-500')}>{entry.name}</span>
                                <span className="font-mono font-bold">₹{entry.value}</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              <Legend IconType="circle" />
              <Bar dataKey="income" name="Income" fill="url(#colorIncome)" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="expense" name="Expense" fill="url(#colorExpense)" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
