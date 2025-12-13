import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, Brain, DollarSign, Sun, X, Calendar, Shield, FileText } from 'lucide-react';
import clsx from 'clsx';
import UserLevel from './UserLevel';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      clsx(
        "flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 relative group mb-3",
        isActive 
            ? "text-white bg-black shadow-lg shadow-black/20 scale-105" 
            : "text-gray-400 hover:text-black hover:bg-gray-100/50 hover:scale-105"
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        {/* Tooltip style label instead of text below */}
        <span className="absolute left-16 ml-4 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
            {label}
        </span>
      </>
    )}
  </NavLink>
);

export default function Sidebar({ isOpen, onClose }) {
  
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
          "fixed top-0 bottom-0 left-0 flex flex-col items-center py-6 h-full z-30 transition-transform duration-300 w-20 lg:w-24 isolate", 
          "lg:translate-x-0 lg:static bg-white/50 backdrop-blur-xl border-r border-white/40",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full" 
        )}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden w-full flex justify-center mb-4 pt-4">
             <button 
                onClick={onClose} 
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close Sidebar"
            >
                <X size={28} />
            </button>
        </div>





        <div className="flex-1 w-full space-y-2 overflow-y-auto no-scrollbar px-2">
          <NavItem to="/" icon={LayoutDashboard} label="Hub" onClick={onClose} />
          <NavItem to="/prayer" icon={Sun} label="Prayer" onClick={onClose} />
          <NavItem to="/tasks" icon={Calendar} label="Tasks" onClick={onClose} />
          <NavItem to="/habits" icon={CheckSquare} label="Habits" onClick={onClose} />
          <NavItem to="/goals" icon={Target} label="Goals" onClick={onClose} />
          <NavItem to="/dump" icon={Brain} label="Dump" onClick={onClose} />
          <NavItem to="/finance" icon={DollarSign} label="Finance" onClick={onClose} />
          <NavItem to="/finance" icon={DollarSign} label="Finance" onClick={onClose} />
          <div className="border-t border-gray-200 my-2 pt-2 w-10 mx-auto"></div>
          <NavItem to="/privacy" icon={Shield} label="Privacy" onClick={onClose} />
          <NavItem to="/terms" icon={FileText} label="Terms" onClick={onClose} />
        </div>

        {/* User Level Display */}
        <div className="w-full px-2 mt-4 hidden lg:block">
            <UserLevel />
        </div>
      </nav>
    </>
  );
}
