import React from 'react';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';

export default function SkeletonDashboard() {
  return (
    <div className="pb-10 space-y-8 animate-fade-in relative z-0">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row items-baseline gap-3 mb-4">
         <Skeleton className="h-10 w-64 md:w-96" />
         <Skeleton className="h-6 w-40 rounded-full" />
      </div>

      {/* Today's Overview Section - Detailed Cards */}
      <section>
          <div className="flex items-center gap-2 mb-4">
              <SkeletonCircle className="w-1.5 h-1.5" />
              <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="card p-5 flex flex-col justify-between h-32 relative overflow-hidden bg-white/50 border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                          <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <Skeleton className="h-full w-1/2" />
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* Overall Analytics Skeleton (Placeholder) */}
      <div className="h-64 card bg-gray-50/50 border-gray-100 p-6 flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Left Column: Habits */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Habits Section */}
        <section className="glass-panel p-6 rounded-3xl border border-white/60">
           <Skeleton className="h-7 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white/40">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-6 w-8" />
                    </div>
                </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Snapshots */}
      <div className="space-y-6">
        {/* Brain Dump & Goals Placeholders */}
        {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 bg-white/50 border-gray-100 p-5 space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="w-2/3 h-4" />
                </div>
            </div>
        ))}
      </div>
    </div>
  </div>
  );
}
