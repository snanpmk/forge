import React from 'react';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';

export default function SkeletonFinance() {
  return (
    <div className="mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left Col: Form and Summary */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="card h-48 bg-black/5 border-none p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                    <Skeleton className="h-3 w-20 bg-gray-300" />
                    <Skeleton className="h-10 w-40 mt-2 bg-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                        <Skeleton className="h-3 w-12 mb-1 bg-gray-300" />
                        <Skeleton className="h-6 w-24 bg-gray-300" />
                    </div>
                    <div>
                        <Skeleton className="h-3 w-12 mb-1 bg-gray-300" />
                        <Skeleton className="h-6 w-24 bg-gray-300" />
                    </div>
                </div>
            </div>

            {/* Form Skeleton */}
            <div className="card shadow-soft p-6 space-y-5">
              <Skeleton className="h-6 w-40 mb-5" />
              <div className="grid grid-cols-5 gap-1">
                  {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full rounded-lg" />
                  ))}
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>

          {/* Right Col: Transactions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-9 w-32 rounded-xl" />
            </div>

            <div className="space-y-3">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-2xl" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16 rounded-md" />
                        </div>
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
            </div>
          </div>
        </div>
    </div>
  );
}
