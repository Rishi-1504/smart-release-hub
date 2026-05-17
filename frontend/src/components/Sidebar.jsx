import React from 'react';
import { Rocket, Zap, Moon, Sun, LayoutDashboard, FileText, Settings, ShieldCheck } from 'lucide-react';

const Sidebar = ({ darkMode, setDarkMode, activeView, setActiveView }) => {
  return (
    <aside className="w-64 min-h-screen border-r-4 border-black dark:border-white flex flex-col transition-colors duration-300 bg-[#f2f2f2] dark:bg-black">
      <div className="p-8">
        {/* Branding - Stark Brutalist */}
        <div 
          className="flex items-center gap-3 mb-16 cursor-pointer border-b-4 border-black dark:border-white pb-8" 
          onClick={() => setActiveView('dashboard')}
        >
          <div className="p-2.5 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <Rocket size={24} strokeWidth={3} />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase text-black dark:text-white">
            Smart<span className="bg-black text-white dark:bg-white dark:text-black px-1">Hub</span>
          </span>
        </div>

        <nav className="space-y-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Release Notes" 
            active={activeView === 'notes'} 
            onClick={() => setActiveView('notes')}
          />
          <NavItem 
            icon={<ShieldCheck size={20} />} 
            label="Readiness" 
            active={activeView === 'readiness'} 
            onClick={() => setActiveView('readiness')}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeView === 'settings'} 
            onClick={() => setActiveView('settings')}
          />
        </nav>
      </div>

      {/* Theme Toggle - Brutalist Button */}
      <div className="mt-auto p-8 border-t-4 border-black dark:border-white">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center justify-center gap-3 w-full px-5 py-4 border-4 border-black dark:border-white bg-white dark:bg-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all font-black text-xs uppercase tracking-widest text-black dark:text-white"
        >
          {darkMode ? <Sun size={18} strokeWidth={3} /> : <Moon size={18} strokeWidth={3} />}
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`w-full flex items-center gap-4 px-5 py-4 border-4 transition-all font-black text-xs uppercase tracking-tighter ${
      active
        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]'
        : 'bg-transparent text-black dark:text-white border-transparent hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5'
    }`}
  >
    <span className={active ? 'scale-110' : ''}>{icon}</span>
    {label}
  </button>
);

export default Sidebar;
