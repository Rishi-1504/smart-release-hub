import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Search, 
  History, 
  Star,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = ({ darkMode, setDarkMode, activeView, setActiveView }) => {
  const [filter, setFilter] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'notes', label: 'Release Notes', icon: <FileText size={16} /> },
    { id: 'readiness', label: 'Readiness Score', icon: <ShieldCheck size={16} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={16} /> },
  ];

  const filteredItems = menuItems.filter(item => 
    item.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <aside className="sn-sidebar flex flex-col">
      {/* Navigator Tabs (Mock) */}
      <div className="flex border-b border-white/10">
        <button className="flex-1 py-3 flex justify-center text-white border-b-2 border-sn-link-color">
          <Search size={16} />
        </button>
        <button className="flex-1 py-3 flex justify-center text-gray-400 hover:text-white transition-colors">
          <Star size={16} />
        </button>
        <button className="flex-1 py-3 flex justify-center text-gray-400 hover:text-white transition-colors">
          <History size={16} />
        </button>
      </div>

      {/* Filter Input */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Filter navigator" 
            className="w-full bg-[#3d4853] border border-white/10 rounded-sm py-1.5 pl-3 pr-8 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button 
              className="absolute right-2 top-1.5 text-gray-400 hover:text-white"
              onClick={() => setFilter('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider">
          Release Operations
        </div>
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`sn-nav-item ${activeView === item.id ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Theme Toggle Utility */}
      <div className="mt-auto border-t border-white/10 p-3">
        <div 
          onClick={() => setDarkMode(!darkMode)}
          className="sn-nav-item rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span>{darkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
