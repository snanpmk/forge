import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import clsx from 'clsx';
import { TrendingUp, Activity, Zap } from 'lucide-react';

export default function DashboardAnalytics() {
  const [days, setDays] = useState(7); // Default to Weekly (7 days)

  const { data: trends, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', days],
    queryFn: async () => (await api.get(`/analytics/dashboard?days=${days}`)).data,
  });

  if (isLoading) return <div className="h-48 flex items-center justify-center text-gray-400">Loading insights...</div>;
  if (!trends || trends.length === 0) return null;

  // Calculate averages for the "Score Cards"
  // If viewing 30 days, maybe still show last 7 days avg? Or avg of selected period?
  // Let's show avg of selected period for consistency.
  const avgOverall = Math.round(trends.reduce((acc, d) => acc + d.overallScore, 0) / trends.length);
  const avgHabit = Math.round(trends.reduce((acc, d) => acc + d.habitScore, 0) / trends.length);
  const avgPrayer = Math.round(trends.reduce((acc, d) => acc + d.prayerScore, 0) / trends.length);

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
                    { label: 'Weekly', val: 7 }, 
                    { label: 'Monthly', val: 30 }
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
                <Zap size={14} className="text-yellow-400" /> Overall Score
            </div>
            <div className="text-4xl font-display font-bold">{avgOverall}</div>
            <div className="text-[10px] text-gray-400 mt-2 font-medium">Avg for last {days} days</div>
        </div>
        <div className="card bg-white border-2 border-transparent hover:border-wellness-lavender/50 p-5 group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-soft">
             <div className="text-muted text-xs uppercase tracking-wider mb-2 font-semibold">Habit Consistency</div>
             <div className="text-4xl font-display font-bold text-gray-800">{avgHabit}%</div>
        </div>
        <div className="card bg-white border-2 border-transparent hover:border-wellness-blue/50 p-5 group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-soft">
             <div className="text-muted text-xs uppercase tracking-wider mb-2 font-semibold">Prayer On-Time</div>
             <div className="text-4xl font-display font-bold text-gray-800">{avgPrayer}%</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card h-72 sm:h-96 flex flex-col p-6 border border-gray-100 shadow-soft">
        <h3 className="font-bold text-lg mb-6 text-primary">{days === 7 ? 'Weekly' : 'Monthly'} Trend</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f2937" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1f2937" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHabit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrayer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={15} stroke="#9ca3af" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} stroke="#9ca3af" />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <Tooltip 
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-white/90 backdrop-blur-md p-4 border border-white/50 shadow-xl rounded-2xl">
                        <p className="font-bold text-sm mb-3 text-primary">{label}</p>
                        <div className="space-y-2">
                            {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-3 text-xs font-medium">
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.stroke }}></span>
                                <span className="text-gray-500 capitalize min-w-[60px]">{entry.name}:</span>
                                <span className="font-bold text-primary">{entry.value}%</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
              <Area 
                type="monotone" 
                dataKey="overallScore" 
                name="Overall" 
                stroke="#1f2937" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOverall)" 
              />
              <Area 
                type="monotone" 
                dataKey="habitScore" 
                name="Habits" 
                stroke="#a78bfa" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHabit)" 
              />
               <Area 
                type="monotone" 
                dataKey="prayerScore" 
                name="Prayers" 
                stroke="#2dd4bf" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrayer)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
