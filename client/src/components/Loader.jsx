import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ size = 32, className = '' }) {
  return (
    <div className={`flex items-center justify-center p-8 w-full ${className}`}>
      <Loader2 size={size} className="animate-spin text-gray-400" />
    </div>
  );
}
