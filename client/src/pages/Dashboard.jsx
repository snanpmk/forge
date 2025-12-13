import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Brain, Target, DollarSign, Loader2, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardAnalytics from '../components/DashboardAnalytics';

import clsx from 'clsx';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-accent">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading dashboard: {error.message}</div>;
  }

  const { habits, prayers, goals, brainDumpCount, finance, tasks } = data;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="pb-10 space-y-8 animate-fade-in relative z-0">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row items-baseline gap-3 mb-4">
         <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary">
            {getGreeting()}, <span className="opacity-60">{user?.username || 'Simian'}</span>
         </h1>
         <div className="text-sm text-muted font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
             {format(new Date(), 'EEEE, MMMM do')}
         </div>
      </div>

      {/* Today's Overview Section - Detailed Cards */}
      <section>
          <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Today's Snapshot</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Habits: Consistency Score & Progress */}
              <div className="card p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-wellness-green/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Consistency</span>
                        <span className="text-3xl font-display font-bold text-gray-800">
                             {habits.length > 0 ? Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Activity size={20} /></div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${habits.length > 0 ? (habits.filter(h => h.completedToday).length / habits.length) * 100 : 0}%` }}></div>
                  </div>
                  <div className="text-xs text-muted font-medium flex justify-between">
                      <span>{habits.filter(h => h.completedToday).length} completed</span>
                      <span>{habits.length} total</span>
                  </div>
              </div>

              {/* Prayers: Visual Status Dots */}
              <div className="card p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-wellness-blue/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex justify-between items-start mb-4">
                       <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Prayers</span>
                        <span className="text-3xl font-display font-bold text-gray-800">
                             {new Set(prayers.filter(p => p.status === 'on-time').map(p => p.name)).size}<span className="text-lg text-gray-400 font-medium">/5</span>
                        </span>
                      </div>
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Zap size={20} /></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                      {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((pName) => {
                          const p = prayers.find(pr => pr.name === pName);
                          const status = p?.status || 'pending';
                          let colorClass = 'bg-gray-200 border-gray-300'; // pending
                          if (status === 'on-time') colorClass = 'bg-emerald-400 border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
                          if (status === 'missed') colorClass = 'bg-rose-400 border-rose-500';
                          
                          return (
                              <div key={pName} className="flex flex-col items-center gap-1 group/p relative">
                                  <div className={`w-3 h-3 rounded-full border ${colorClass} transition-all`} />
                                  <span className="text-[9px] font-bold text-muted uppercase opacity-60">{pName.substring(0,1)}</span>
                                   {/* Tooltip */}
                                  <div className="absolute bottom-full mb-2 hidden group-hover/p:block bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10">
                                      {pName}: {status}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>

              {/* Tasks: Upcoming List + Done Count */}
              <div className="card p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-wellness-lavender/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Tasks</span>
                        <div className="flex items-baseline gap-2">
                             <span className="text-3xl font-display font-bold text-gray-800">{tasks?.doneCount || 0}</span>
                             <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Done</span>
                        </div>
                      </div>
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle size={20} /></div>
                  </div>
                  <div className="space-y-2 mt-2">
                      {tasks?.upcoming && tasks.upcoming.length > 0 ? (
                          tasks.upcoming.slice(0, 2).map(t => (
                              <div key={t._id} className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                  <div className={`w-1.5 h-1.5 rounded-full ${t.priority === 'high' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                  <span className="truncate">{t.title}</span>
                              </div>
                          ))
                      ) : (
                          <div className="text-xs text-muted italic p-2">No upcoming tasks today</div>
                      )}
                      {tasks?.upcoming?.length > 2 && <div className="text-[10px] text-center text-muted">+{tasks.upcoming.length - 2} more</div>}
                  </div>
              </div>

              {/* Finance: Today vs Month */}
              <div className="card p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform border-red-50 hover:border-red-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-2xl -mr-6 -mt-6 opacity-60" />
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Spent Today</span>
                        <span className="text-3xl font-display font-bold text-gray-800">₹{finance.todayExpense || 0}</span>
                      </div>
                      <div className="p-2 bg-red-50 text-red-500 rounded-lg"><DollarSign size={20} /></div>
                  </div>
                   <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                       <span className="text-xs font-medium text-muted">Total Monthly</span>
                       <span className="text-xs font-bold text-primary">₹{finance.expense}</span>
                   </div>
              </div>
          </div>
      </section>

      {/* Overall Analytics */}
      <DashboardAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Left Column: Habits */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Habits Section */}
        <section className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-white/60">
           <div className="absolute top-0 left-0 w-24 h-full bg-wellness-green/20 blur-2xl -z-10" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
            Today's Habits
          </h2>
          <div className="space-y-4">
            {habits.length === 0 ? (
              <p className="text-muted italic pl-4">No habits set. Go to Habits page to add some.</p>
            ) : (
              habits.map((habit, idx) => (
                <div 
                    key={habit._id} 
                    className="group bg-white/40 border border-white/40 hover:bg-white/80 flex items-center justify-between cursor-pointer p-4 rounded-2xl hover:scale-[1.01] hover:shadow-soft transition-all duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${habit.completedToday ? 'bg-wellness-green text-green-700 shadow-sm scale-110' : 'bg-white border border-gray-100 text-gray-300 group-hover:border-green-200'}`}>
                      {habit.completedToday ? <CheckCircle size={20} /> : <div className="w-3 h-3 rounded-full bg-gray-100 group-hover:bg-green-100 transition-colors" />}
                    </button>
                    <div>
                        <span className={`text-lg font-medium transition-colors ${habit.completedToday ? 'text-muted line-through decoration-gray-300' : 'text-primary'}`}>
                        {habit.title}
                        </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end px-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Streak</div>
                    <div className="text-xl font-bold font-display text-primary">{habit.streak} <span className="text-sm font-normal text-muted">days</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Snapshots */}
      <div className="space-y-6">
        
        {/* Brain Dump CTA */}
        <div className="card bg-gradient-to-br from-wellness-lavender/30 to-white border-white/50 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 bg-wellness-lavender w-24 h-24 rounded-full blur-2xl opacity-50" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className="font-bold text-primary flex items-center gap-2 text-base">
              <Brain size={18} className="text-primary" /> Brain Dump
            </h3>
            {brainDumpCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                {brainDumpCount} Pending
                </span>
            )}
          </div>
          <p className="text-sm text-muted mb-5 leading-relaxed relative z-10">Clear your mind. Processing these items helps you focus.</p>
          <Link to="/dump" className="block w-full text-center py-2.5 bg-white border border-gray-100 hover:bg-wellness-lavender hover:border-violet-100 rounded-xl text-sm transition-all shadow-sm hover:shadow-md font-bold text-primary relative z-10">
            Process Now
          </Link>
        </div>

        {/* Goals Snapshot */}
        <div className="card bg-white border-white/50">
          <h3 className="font-bold text-primary mb-5 flex items-center gap-2 text-base">
            <Target size={18} className="text-primary" /> Upcoming Goals
          </h3>
          <div className="space-y-4">
            {goals.length === 0 ? (
               <p className="text-sm text-muted">No active goals.</p>
            ) : (
              goals.map(goal => {
                const daysLeft = goal.target_date 
                    ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)) 
                    : null;
                
                return (
                <div key={goal._id} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold truncate max-w-[150px] text-primary">{goal.title}</span>
                    {daysLeft !== null && (
                        <span className={clsx("font-mono font-medium", daysLeft < 0 ? "text-error" : daysLeft <= 7 ? "text-orange-400" : "text-muted")}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-1 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Finance Snapshot */}
        <div className="card bg-gradient-to-br from-wellness-blue/20 to-white border-white/50">
          <h3 className="font-bold text-primary mb-4 flex items-center gap-2 text-base">
            <DollarSign size={18} className="text-primary" /> Monthly Finance
          </h3>
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-sm text-muted">Income</span>
            <span className="text-emerald-500 font-mono font-bold">+₹{finance.income}</span>
          </div>
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-sm text-muted">Expense</span>
            <span className="text-red-400 font-mono font-bold">-₹{finance.expense}</span>
          </div>
          <div className="bg-white/60 rounded-xl p-3 flex justify-between items-center border border-white/50">
            <span className="text-sm font-bold text-primary">Net</span>
            <span className={`font-mono font-bold text-lg ${finance.income - finance.expense >= 0 ? 'text-primary' : 'text-red-400'}`}>
              ₹{finance.income - finance.expense}
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
