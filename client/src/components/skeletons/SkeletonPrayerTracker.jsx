import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export default function SkeletonPrayerTracker() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 animate-fade-in">
       {/* Header */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <Skeleton className="h-10 w-64" />
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <Skeleton className="h-10 w-64 rounded-xl" />
             <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
       </div>

       {/* Prayer Cards List */}
       <div className="space-y-4 max-w-2xl mx-auto">
          {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-3xl p-6 flex items-center justify-between border border-gray-100 shadow-sm h-24">
                  <div className="flex items-center gap-5">
                      <Skeleton className="p-3 w-12 h-12 rounded-2xl" />
                      <div className="space-y-2">
                          <Skeleton className="h-6 w-24" />
                      </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
          ))}
       </div>
    </div>
  );
}
