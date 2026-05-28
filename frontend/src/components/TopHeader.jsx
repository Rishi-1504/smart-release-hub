import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, User, Rocket } from 'lucide-react';

const TopHeader = ({ lastSynced, status, setActiveView }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const navigationOptions = [
    { id: 'dashboard', label: 'Operations Dashboard', category: 'Views' },
    { id: 'notes', label: 'Release Communications', category: 'Views' },
    { id: 'readiness', label: 'Readiness Analysis', category: 'Views' },
    { id: 'settings', label: 'System Configuration', category: 'Admin' },
  ];

  const filteredOptions = searchQuery.trim() === '' 
    ? [] 
    : navigationOptions.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    setActiveView(id);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <header className="sn-header flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div 
          className="flex items-center gap-2 font-bold text-lg cursor-pointer"
          onClick={() => setActiveView('dashboard')}
        >
          <Rocket size={20} className="text-white" />
          <span>SmartRelease Hub</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Global search..." 
            className="w-full bg-[#3d5659] border-none rounded-sm py-1 pl-8 pr-4 text-sm text-white placeholder-gray-300 focus:ring-1 focus:ring-white/20 transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          <Search className="absolute left-2 top-1.5 text-gray-300" size={16} />
        </div>

        {/* Search Results Dropdown */}
        {showResults && filteredOptions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2b2b2b] border border-sn-border-color shadow-lg rounded-sm z-[2000] overflow-hidden">
            {filteredOptions.map((opt) => (
              <div 
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">{opt.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-r border-white/10 pr-6 mr-2">
          <div className="sn-sync-widget">
            <div className={`sn-led ${status === 'error' ? 'bg-red-500' : 'bg-green-500 animate-sn-pulse'}`} />
            <span className="hidden md:inline">Synced: {lastSynced.split(' ')[0]}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Bell size={18} className="cursor-pointer hover:text-gray-300 transition-colors" />
          <Settings 
            size={18} 
            className="cursor-pointer hover:text-gray-300 transition-colors" 
            onClick={() => setActiveView('settings')}
          />
          <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
              <User size={14} />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
