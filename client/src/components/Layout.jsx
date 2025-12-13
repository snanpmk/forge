import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-transparent text-gray-900 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background Gradients/Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-white -z-20" />

        {/* Desktop Top Right Avatar */}
        <div className="hidden lg:flex absolute top-6 right-8 z-50 items-center gap-3">
             <div className="text-right hidden xl:block">
                <div className="text-sm font-bold">{user?.username || 'User'}</div>
                <div className="text-xs text-gray-500">Level {user?.level || 1}</div>
             </div>
             <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform bg-white">
                {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                )}
             </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 hover:bg-black/5 rounded-lg text-black transition-colors"
            >
                <Menu size={24} />
            </button>
            <span className="font-bold text-lg tracking-tight">Forge</span>
          </div>

          <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-white">
                {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs font-bold">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
           <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
             <Outlet />
           </div>
        </div>
      </main>
    </div>
  );
}
