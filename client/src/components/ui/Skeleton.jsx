import clsx from 'clsx';
import React from 'react';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx("animate-pulse rounded-md bg-gray-200/80", className)}
      {...props}
    />
  );
}

export function SkeletonCircle({ className, ...props }) {
    return (
        <Skeleton 
            className={clsx("rounded-full", className)} 
            {...props} 
        />
    )
}
