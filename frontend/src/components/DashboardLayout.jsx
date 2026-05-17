import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen transition-colors duration-300 overflow-x-hidden bg-[#f2f2f2] dark:bg-black font-sans relative">
      {/* 
         CYBER-INDUSTRIAL OVERLAYS 
         Permanent visual texture for 'World No. 1' vibe
      */}
      <div className="cyber-overlay">
        <div className="scanline" />
        <div className="noise" />
      </div>

      {/* Main Content Area - Full width, centered layout */}
      <main className="min-h-screen px-8 md:px-24 py-24 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
