import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Brain, Target, DollarSign, Loader2 } from 'lucide-react';
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

  const { habits, prayers, goals, brainDumpCount, finance } = data;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="pb-10 space-y-8 animate-fade-in relative z-0">
      {/* Greeting Header - Clean & Minimal */}
      <div className="flex flex-col md:flex-row items-baseline gap-3 mb-4">
         <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary">
            {getGreeting()}, <span className="opacity-60">{user?.username || 'Simian'}</span>
         </h1>
         <div className="text-sm text-muted font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
             {format(new Date(), 'EEEE, MMMM do')}
         </div>
      </div>

      {/* Prayers Section - Soft Horizontal Scroll or Grid */}
      <section className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-wellness-blue/50 rounded-full blur-3xl -z-10" />
        <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold flex items-center gap-3 text-primary">
                Prayer Schedule
            </h2>
            <Link to="/prayer" className="text-sm font-medium text-muted hover:text-primary transition-colors">View Calendar</Link>
        </div>
       
        <div className="grid grid-cols-5 gap-3 md:gap-6">
        {[
            { name: 'Fajr', icon: 'Sunrise' },
            { name: 'Dhuhr', icon: 'Sun' },
            { name: 'Asr', icon: 'Cloud' },
            { name: 'Maghrib', icon: 'Sunset' },
            { name: 'Isha', icon: 'Moon' }
        ].map(p => {
            const prayerRecord = prayers.find(pr => pr.name === p.name);
            const status = prayerRecord?.status || 'pending';
            
            let statusClasses = 'bg-white/40 border border-white/20 text-muted hover:bg-white/60';
            if (status === 'on-time') statusClasses = 'bg-gradient-to-br from-wellness-mint to-teal-50 border border-teal-100 text-teal-800 shadow-sm';
            if (status === 'missed') statusClasses = 'bg-wellness-rose/50 border border-red-100 text-red-400 border-dashed';
            
            return (
            <div key={p.name} className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 group cursor-default ${statusClasses}`}>
                 {p.icon === 'Sunrise' && <div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg></div>}
                 {p.icon === 'Sun' && <div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93 1.41 1.41"/></svg></div>}
                 {p.icon === 'Cloud' && <div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3"/><path d="M13 16c0-2.8-2.2-5-5-5"/><path d="M5 19c0-4.4 3.6-8 8-8"/><path d="M19 19H5a3 3 0 0 1 0-6h.1a6.83 6.83 0 0 1 12.8 2.3"/></svg></div>}
                 {p.icon === 'Sunset' && <div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg></div>}
                 {p.icon === 'Moon' && <div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></div>}

                <span className="font-bold text-xs md:text-sm">{p.name}</span>
                <span className={`text-[10px] uppercase tracking-wider font-semibold hidden md:block mt-1 ${status === 'pending' ? 'text-gray-400' : 'text-current opacity-80'}`}>
                    {status === 'on-time' ? 'Done' : status}
                </span>
            </div>
            );
        })}
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
