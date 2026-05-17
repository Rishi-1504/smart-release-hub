import React from 'react';

const DashboardLayout = ({ sidebar, children }) => {
  return (
    <div className="flex min-h-screen transition-colors duration-300 overflow-hidden bg-[#f2f2f2] dark:bg-black font-sans">
      {/* Sidebar Stays Fixed with Stark Border */}
      <div className="fixed inset-y-0 left-0 z-50">
        {sidebar}
      </div>
      
      {/* Main Content Area - No Gradients, Stark Layout */}
      <main className="flex-1 ml-64 min-h-screen px-16 py-16 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
