import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import clsx from 'clsx';
import { TrendingUp, Activity, Zap } from 'lucide-react';

export default function DashboardAnalytics() {
  const [days, setDays] = useState(7); // 7, 30, 365

  const { data: trends, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', days],
    queryFn: async () => (await api.get(`/analytics/dashboard?days=${days}`)).data,
  });

  if (isLoading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading insights...</div>;
  if (!trends || trends.length === 0) return null;

  // Compute Averages
  const avgOverall = Math.round(trends.reduce((acc, d) => acc + (d.overallScore || 0), 0) / trends.length);
  const totalTasks = trends.reduce((acc, d) => acc + (d.tasks || 0), 0);
  const totalExpense = trends.reduce((acc, d) => acc + (d.expense || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-wellness-indigo rounded-xl text-indigo-700">
                    <Activity size={18} />
                </div>
                <h2 className="text-xl font-bold text-primary">Performance Analysis</h2>
            </div>
            
            {/* Filter Controls */}
            <div className="flex bg-white border border-gray-100 p-1 rounded-xl w-full sm:w-auto shadow-sm">
                {[
                    { label: 'Week', val: 7 }, 
                    { label: 'Month', val: 30 },
                    { label: 'Year', val: 365 }
                ].map((opt) => (
                    <button
                        key={opt.val}
                        onClick={() => setDays(opt.val)}
                        className={clsx(
                            "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all text-center",
                            days === opt.val 
                                ? "bg-primary text-white shadow-md" 
                                : "text-muted hover:text-primary hover:bg-gray-50"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <div className="card bg-primary text-white border-none p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6" />
            <div className="flex items-center gap-2 text-gray-300 text-xs uppercase tracking-wider mb-2 font-semibold">
                <Zap size={14} className="text-yellow-400" /> Overall Consistency
            </div>
            <div className="text-4xl font-display font-bold">{avgOverall}%</div>
        </div>
        <div className="card bg-white border-2 border-transparent hover:border-blue-100 p-5 group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-soft">
             <div className="text-muted text-xs uppercase tracking-wider mb-2 font-semibold">Total Tasks Done</div>
             <div className="text-4xl font-display font-bold text-blue-600">{totalTasks}</div>
        </div>
        <div className="card bg-white border-2 border-transparent hover:border-red-100 p-5 group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-soft">
             <div className="text-muted text-xs uppercase tracking-wider mb-2 font-semibold">Total Spent</div>
             <div className="text-4xl font-display font-bold text-red-500">₹{totalExpense.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card h-72 sm:h-96 flex flex-col p-6 border border-gray-100 shadow-soft">
        <h3 className="font-bold text-lg mb-6 text-primary">{days === 365 ? 'Yearly Overview' : days === 30 ? 'Monthly Trend' : 'Weekly Trend'}</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f2937" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1f2937" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={15} stroke="#9ca3af" />
              <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} stroke="#cbd5e1" hide={days===365}/>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <Tooltip 
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-white/90 backdrop-blur-md p-4 border border-white/50 shadow-xl rounded-2xl min-w-[200px]">
                        <p className="font-bold text-sm mb-3 text-primary border-b border-gray-100 pb-2">{label}</p>
                        <div className="space-y-2">
                             {/* Consistency Code */}
                            {payload.find(p => p.name === 'Consistency') && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Consistency</span>
                                <span className="font-bold text-primary">{payload.find(p => p.name === 'Consistency').value}%</span>
                              </div>
                            )}
                            {/* Tasks */}
                            {payload.find(p => p.name === 'Tasks Completed') && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Tasks</span>
                                <span className="font-bold text-blue-600">{payload.find(p => p.name === 'Tasks Completed').value}</span>
                              </div>
                            )}
                             {/* Expense */}
                             {payload.find(p => p.name !== 'Consistency' && p.name !== 'Tasks Completed') && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">Expense</span>
                                    <span className="font-bold text-red-500">₹{payload.find(p => p.dataKey === 'expense')?.value}</span>
                                </div>
                             )}
                        </div>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
              
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="overallScore" 
                name="Consistency" 
                stroke="#1f2937" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOverall)" 
              />
              
              {days !== 365 && <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="tasks" 
                name="Tasks Completed" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTasks)" 
              />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
