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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2">
                <Activity className="text-black" />
                <h2 className="text-xl md:text-2xl font-bold">Performance Analysis</h2>
            </div>
            
            {/* Filter Controls */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                {[
                    { label: 'Weekly', val: 7 }, 
                    { label: 'Monthly', val: 30 }
                ].map((opt) => (
                    <button
                        key={opt.val}
                        onClick={() => setDays(opt.val)}
                        className={clsx(
                            "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all text-center",
                            days === opt.val 
                                ? "bg-black text-white shadow-md" 
                                : "text-gray-500 hover:text-black"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
        <div className="card bg-black text-white border-none p-3 md:p-4">
            <div className="flex items-center gap-2 text-gray-400 text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">
                <Zap size={14} className="text-gray-400" /> Overall Score
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold">{avgOverall}</div>
            <div className="text-[10px] text-gray-500 mt-1">Avg for last {days} days</div>
        </div>
        <div className="card p-3 md:p-4">
             <div className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">Habit Consistency</div>
             <div className="text-2xl md:text-3xl font-mono font-bold">{avgHabit}%</div>
        </div>
        <div className="card p-3 md:p-4">
             <div className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">Prayer On-Time</div>
             <div className="text-2xl md:text-3xl font-mono font-bold">{avgPrayer}%</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card h-64 sm:h-80 flex flex-col">
        <h3 className="font-bold text-lg mb-4">{days === 7 ? 'Weekly' : 'Monthly'} Trend</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHabit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrayer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d1d5db" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d1d5db" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <Tooltip 
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                    return (
                        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                        <p className="font-bold text-sm mb-2">{label}</p>
                        <div className="space-y-1">
                            {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></span>
                                <span className="text-gray-500 capitalize">{entry.name}:</span>
                                <span className="font-mono font-bold">{entry.value}%</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="overallScore" 
                name="Overall" 
                stroke="#000000" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOverall)" 
              />
              <Area 
                type="monotone" 
                dataKey="habitScore" 
                name="Habits" 
                stroke="#6b7280" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHabit)" 
              />
               <Area 
                type="monotone" 
                dataKey="prayerScore" 
                name="Prayers" 
                stroke="#d1d5db" 
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
