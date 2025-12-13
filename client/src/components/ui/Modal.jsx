import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
    }
    
    return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed  inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in text-left my-8 relative flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-lg">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
