import React from 'react';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

export const confirmAction = (message, onConfirm) => {
  toast.custom((t) => (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/5 bg-opacity-10 backdrop-blur-sm animate-fade-in w-screen h-screen -m-4">
        {/* Click outside to dismiss */}
        <div className="absolute inset-0" onClick={() => toast.dismiss(t.id)} />
        
        {/* Actual Toast Card */}
        <div
          className={`${
            t.visible ? 'animate-zoom-in' : 'animate-zoom-out'
          } max-w-sm w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col items-center p-6 relative z-10 border border-white/50`}
        >
            <div className="h-16 w-16 mb-4 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                <AlertCircle size={28} />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 text-center mb-8 px-4 font-medium">
                {message}
            </p>

            <div className="flex w-full gap-3">
                <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
                >
                Cancel
                </button>
                <button
                onClick={() => {
                    toast.dismiss(t.id);
                    onConfirm();
                }}
                className="flex-1 py-3 px-4 bg-black text-white hover:bg-gray-900 shadow-lg shadow-black/20 font-bold rounded-xl transition-all active:scale-95"
                >
                Confirm
                </button>
            </div>
        </div>
    </div>
  ), { duration: Infinity, position: 'top-center' }); // Infinite duration so it stays until action
};
