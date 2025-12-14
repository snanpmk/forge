import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export default function SkeletonTaskManager() {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="space-y-8">
          {[...Array(2)].map((_, sectionIdx) => (
             <div key={sectionIdx} className="space-y-3">
                 <Skeleton className="h-6 w-24 mb-3" />
                 <div className="space-y-2">
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        </div>
                     ))}
                 </div>
             </div>
          ))}
      </div>
    </div>
  );
}
