import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export default function SkeletonGoalPlanner() {
  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-3">
                              <Skeleton className="w-10 h-10 rounded-xl" />
                              <div className="space-y-2">
                                  <Skeleton className="h-6 w-48" />
                                  <Skeleton className="h-4 w-64" />
                              </div>
                          </div>
                      </div>
                      <Skeleton className="w-full h-2.5 rounded-full mb-3" />
                      <div className="flex gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                      </div>
                  </div>
              ))}
          </div>

          {/* Sidebar - Right Column (1/3 width) */}
          <div className="lg:col-span-1 space-y-8">
              <div className="card h-64 border-gray-100 shadow-soft p-6 space-y-4">
                  <div className="flex gap-2 items-center">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="w-full h-40 rounded-2xl" />
              </div>
          </div>
      </div>
    </div>
  );
}
