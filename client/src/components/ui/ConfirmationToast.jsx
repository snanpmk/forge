import React from 'react';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

export const confirmAction = (message, onConfirm) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-soft rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
    >
      <div className="flex-1 w-full p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
             <div className="h-10 w-10 full rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={20} />
             </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-bold text-gray-900">
              Are you sure?
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col border-l border-gray-100 bg-gray-50">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="w-full border-b border-gray-100 p-4 flex items-center justify-center text-sm font-bold text-red-600 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors focus:outline-none"
        >
          No
        </button>
      </div>
    </div>
  ), { duration: 5000 });
};
