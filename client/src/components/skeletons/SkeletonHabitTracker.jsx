import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export default function SkeletonHabitTracker() {
  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in">
       {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between py-6 gap-6 mb-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
           <Skeleton className="h-10 w-full sm:w-64 rounded-2xl" />
           <Skeleton className="h-10 w-full sm:w-48 rounded-2xl" />
           <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>

      {/* Grid of Habit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="p-6 rounded-3xl border border-gray-100 shadow-sm transition-all h-32 flex flex-col justify-between">
                 <div className="flex items-center gap-5">
                     <Skeleton className="w-12 h-12 rounded-2xl" />
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-20" />
                     </div>
                 </div>
                 <div className="flex justify-end">
                    <Skeleton className="h-6 w-16 rounded-xl" />
                 </div>
             </div> 
          ))}
      </div>
    </div>
  );
}
