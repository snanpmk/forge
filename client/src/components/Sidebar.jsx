import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, Brain, DollarSign, Sun, X, Calendar, Shield, FileText, LogOut, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import UserLevel from './UserLevel';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      clsx(
        "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 relative group mb-4",
        isActive 
            ? "text-white bg-primary shadow-soft-hover transform scale-105" 
            : "text-muted hover:text-primary hover:bg-white hover:shadow-soft hover:scale-105"
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        {/* Tooltip style label */}
        <span className="absolute left-16 ml-3 px-3 py-1.5 bg-white/90 backdrop-blur-md text-primary text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-soft border border-white/50 translate-x-[-10px] group-hover:translate-x-0">
            {label}
        </span>
      </>
    )}
  </NavLink>
);

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  
  return (
    <>
      <div 
        className={clsx(
          "fixed inset-0 bg-black/50 z-20 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <nav 
        className={clsx(
          "fixed top-0 bottom-0 left-0 flex flex-col items-center py-6 h-full z-50 transition-transform duration-500 w-20 lg:w-24 isolate", 
          "lg:translate-x-0 lg:static bg-white lg:bg-white/40 backdrop-blur-2xl border-r border-white/40 shadow-soft",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full" 
        )}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden w-full flex justify-center mb-4 pt-4">
             <button 
                onClick={onClose} 
                className="p-3 text-muted hover:text-primary hover:bg-white rounded-2xl transition-all shadow-sm active:scale-90"
                aria-label="Close Sidebar"
            >
                <X size={24} />
            </button>
        </div>





        <div className="flex-1 w-full space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar px-2">
          <NavItem to="/" icon={LayoutDashboard} label="Hub" onClick={onClose} />
          <NavItem to="/prayer" icon={Sun} label="Prayer" onClick={onClose} />
          <NavItem to="/tasks" icon={Calendar} label="Tasks" onClick={onClose} />
          <NavItem to="/habits" icon={CheckSquare} label="Habits" onClick={onClose} />
          <NavItem to="/goals" icon={Target} label="Goals" onClick={onClose} />
          <NavItem to="/dump" icon={Brain} label="Dump" onClick={onClose} />
          <NavItem to="/finance" icon={DollarSign} label="Finance" onClick={onClose} />
          <div className="border-t border-gray-200 my-2 pt-2 w-10 mx-auto"></div>
          <NavItem to="/settings" icon={SettingsIcon} label="Settings" onClick={onClose} />
          <NavItem to="/privacy" icon={Shield} label="Privacy" onClick={onClose} />
          <NavItem to="/terms" icon={FileText} label="Terms" onClick={onClose} />
        </div>

       <div className="px-2 pb-2 mt-auto">
          <button
            onClick={() => {
                if(confirm('Are you sure you want to logout?')) {
                    logout();
                    onClose();
                }
            }}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 text-muted hover:text-red-500 hover:bg-red-50 hover:shadow-soft group relative"
          >
            <LogOut size={22} />
             <span className="absolute left-16 ml-3 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-soft border border-white/50 translate-x-[-10px] group-hover:translate-x-0">
                Logout
            </span>
          </button>
       </div>
      </nav>
    </>
  );
}
