import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export default function SkeletonBrainDump() {
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <Skeleton className="w-full h-40 rounded-3xl mb-10" />

      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
