import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'favorites', 'history'
  const [favorites, setFavorites] = useState(['dashboard']);
  const [navHistory, setNavHistory] = useState([]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'notes', label: 'Release Notes', icon: <FileText size={16} /> },
    { id: 'readiness', label: 'Readiness Score', icon: <ShieldCheck size={16} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={16} /> },
  ];

  // Track History
  useEffect(() => {
    setNavHistory(prev => {
      const filtered = prev.filter(item => item !== activeView);
      return [activeView, ...filtered].slice(0, 10);
    });
  }, [activeView]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const getFilteredItems = () => {
    let baseItems = menuItems;
    if (activeTab === 'favorites') {
      baseItems = menuItems.filter(item => favorites.includes(item.id));
    } else if (activeTab === 'history') {
      baseItems = navHistory.map(hId => menuItems.find(m => m.id === hId)).filter(Boolean);
    }

    return baseItems.filter(item => 
      item.label.toLowerCase().includes(filter.toLowerCase())
    );
  };

  const displayItems = getFilteredItems();

  return (
    <aside className="sn-sidebar flex flex-col">
      {/* Navigator Tabs */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 flex justify-center transition-colors ${activeTab === 'all' ? 'text-white border-b-2 border-sn-link-color' : 'text-gray-400 hover:text-white'}`}
          title="All Applications"
        >
          <Search size={16} />
        </button>
        <button 
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-3 flex justify-center transition-colors ${activeTab === 'favorites' ? 'text-white border-b-2 border-sn-link-color' : 'text-gray-400 hover:text-white'}`}
          title="Favorites"
        >
          <Star size={16} />
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 flex justify-center transition-colors ${activeTab === 'history' ? 'text-white border-b-2 border-sn-link-color' : 'text-gray-400 hover:text-white'}`}
          title="History"
        >
          <History size={16} />
        </button>
      </div>

      {/* Filter Input */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Filter ${activeTab === 'all' ? 'navigator' : activeTab}`}
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
          {activeTab === 'all' ? 'Release Operations' : activeTab.toUpperCase()}
        </div>
        
        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sn-nav-item group flex justify-between items-center ${activeView === item.id ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <button 
                onClick={(e) => toggleFavorite(e, item.id)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-yellow-400 ${favorites.includes(item.id) ? 'opacity-100 text-yellow-500' : 'text-gray-500'}`}
              >
                <Star size={12} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-gray-500 italic">
            No items found in {activeTab}
          </div>
        )}
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
