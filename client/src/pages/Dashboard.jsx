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
    <div className="pb-10 space-y-6 md:space-y-8 animate-fade-in">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row items-baseline gap-2 mb-2">
         <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {getGreeting()}, <span className="text-gray-500">{user?.username || 'Simian'}</span>
         </h1>
         <div className="text-sm text-gray-500 font-medium">
             {format(new Date(), 'EEEE, MMMM do')}
         </div>
      </div>

      {/* Prayers Section - MOVED TO VERY TOP */}


      {/* Prayers Section */}
      <section className="card bg-white border-2 border-black/5">
        <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-black">
                Prayer Schedule
            </h2>
            <Link to="/prayer" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">View Calendar</Link>
        </div>
       
        <div className="grid grid-cols-5 gap-2 md:gap-4">
        {[
            { name: 'Fajr', icon: 'Sunrise' },
            { name: 'Dhuhr', icon: 'Sun' },
            { name: 'Asr', icon: 'Cloud' },
            { name: 'Maghrib', icon: 'Sunset' },
            { name: 'Isha', icon: 'Moon' }
        ].map(p => {
            const prayerRecord = prayers.find(pr => pr.name === p.name);
            const status = prayerRecord?.status || 'pending';
            
            // Clean white cards for prayer items for contrast against lavender
            let statusClasses = 'border-black/5 bg-gray-50 hover:bg-gray-100 text-gray-400';
            if (status === 'on-time') statusClasses = 'border-black bg-black text-white shadow-md';
            if (status === 'missed') statusClasses = 'border-gray-300 bg-white text-gray-900 border-dashed';
            
            return (
            <div key={p.name} className={`flex flex-col items-center justify-center py-3 md:py-4 border rounded-2xl transition-all duration-300 group cursor-default ${statusClasses}`}>
                {/* Icon rendering logic */}
                 {p.icon === 'Sunrise' && <div className="mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg></div>}
                 {p.icon === 'Sun' && <div className="mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93 1.41 1.41"/></svg></div>}
                 {p.icon === 'Cloud' && <div className="mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3"/><path d="M13 16c0-2.8-2.2-5-5-5"/><path d="M5 19c0-4.4 3.6-8 8-8"/><path d="M19 19H5a3 3 0 0 1 0-6h.1a6.83 6.83 0 0 1 12.8 2.3"/></svg></div>}
                 {p.icon === 'Sunset' && <div className="mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg></div>}
                 {p.icon === 'Moon' && <div className="mb-1"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></div>}


                <span className="font-bold text-xs md:text-sm">{p.name}</span>
                <span className={`text-[10px] uppercase tracking-wider opacity-90 hidden md:block mt-1 ${status === 'pending' ? 'text-gray-400' : 'text-white'}`}>
                    {status === 'on-time' ? 'Done' : status}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full mt-1 md:hidden ${status === 'pending' ? 'bg-gray-300' : 'bg-white'}`} />
            </div>
            );
        })}
        </div>
      </section>

      {/* Overall Analytics */}
      <DashboardAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Left Column: Habits */}
      <div className="lg:col-span-2 space-y-6 md:space-y-8">
        
        {/* Habits Section */}
        {/* Habits Section */}
        <section className="card bg-white border-2 border-black/5">
          <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 text-black">
            <span className="w-2 h-8 bg-black rounded-full"></span>
            Today's Habits
          </h2>
          <div className="space-y-4">
            {habits.length === 0 ? (
              <p className="text-gray-500 italic pl-4">No habits set. Go to Habits page to add some.</p>
            ) : (
              habits.map((habit, idx) => (
                <div 
                    key={habit._id} 
                    className="card bg-white flex items-center justify-between group cursor-pointer p-5 hover:scale-[1.01] transition-all duration-300 shadow-sm border-transparent"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <button className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${habit.completedToday ? 'bg-black border-black scale-110' : 'border-gray-200 group-hover:border-black'}`}>
                      {habit.completedToday && <CheckCircle className="text-white" size={18} />}
                    </button>
                    <div>
                        <span className={`text-lg font-medium transition-colors ${habit.completedToday ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {habit.title}
                        </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Streak</div>
                    <div className="text-xl font-bold font-display text-black">{habit.streak} <span className="text-sm font-normal text-gray-400">days</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Removed Prayers from here */}
      </div>

      {/* Right Column: Snapshots */}
      <div className="space-y-6">
        
        {/* Brain Dump CTA */}
        <div className="card bg-white border-2 border-black/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
              <Brain size={18} className="text-black" /> Brain Dump
            </h3>
            <span className="bg-black text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full">
              {brainDumpCount} Pending
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-600 mb-4 leading-relaxed">Clear your mind. processing these items helps you focus.</p>
          <Link to="/dump" className="block w-full text-center py-2 bg-black hover:bg-black/80 rounded-xl text-xs md:text-sm transition-colors shadow-sm font-bold text-white">
            Process Now
          </Link>
        </div>

        {/* Goals Snapshot */}
        <div className="card bg-white border-2 border-black/5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm md:text-base">
            <Target size={18} className="text-black" /> Upcoming Goals
          </h3>
          <div className="space-y-4">
            {goals.length === 0 ? (
               <p className="text-sm text-gray-500">No active goals.</p>
            ) : (
              goals.map(goal => {
                const daysLeft = goal.target_date 
                    ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)) 
                    : null;
                
                return (
                <div key={goal._id} className="bg-white/60 p-3 rounded-2xl">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold truncate max-w-[150px] text-gray-800">{goal.title}</span>
                    {daysLeft !== null && (
                        <span className={clsx("font-mono font-medium", daysLeft < 0 ? "text-red-500" : daysLeft <= 7 ? "text-orange-500" : "text-gray-500")}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                    )}
                  </div>
                  <div className="w-full bg-white rounded-full h-2 mb-1">
                    <div 
                      className="bg-black h-full rounded-full transition-all duration-500" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Finance Snapshot */}
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm md:text-base">
            <DollarSign size={18} className="text-black" /> Monthly Finance
          </h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Income</span>
            <span className="text-black font-mono font-bold">+₹{finance.income}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Expense</span>
            <span className="text-red-500 font-mono font-bold">-₹{finance.expense}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">Net</span>
            <span className={`font-mono font-bold text-lg ${finance.income - finance.expense >= 0 ? 'text-black' : 'text-red-500'}`}>
              ₹{finance.income - finance.expense}
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
