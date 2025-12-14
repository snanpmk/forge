import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import SkeletonDashboard from './SkeletonDashboard';

export default function SkeletonFullPage() {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex w-64 flex-col border-r border-gray-100 bg-white p-4 space-y-4">
            <Skeleton className="h-8 w-32 mb-8" />
            {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
             {/* Header Skeleton */}
             <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-10 w-10 rounded-full" />
             </div>
             
             {/* Main Content */}
             <div className="flex-1 overflow-auto p-6">
                 <SkeletonDashboard />
             </div>
        </div>
    </div>
  );
}
