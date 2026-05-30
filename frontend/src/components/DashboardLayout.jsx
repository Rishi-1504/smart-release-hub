import React from 'react';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, darkMode, setDarkMode, activeView, setActiveView, lastSynced, syncCountdown, status, onRefresh }) => {
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <TopHeader lastSynced={lastSynced} syncCountdown={syncCountdown} status={status} setActiveView={setActiveView} onRefresh={onRefresh} />
      <Sidebar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      <main className="sn-content">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
