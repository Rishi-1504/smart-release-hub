import React from 'react';
import { Cpu, CheckCircle, BarChart3, FileText, Sparkles } from 'lucide-react';

const AiGenerationPanel = ({ activeTab, fetchNotes, content, loading, getMarkdownText }) => {
  const tabs = [
    { id: 'technical', label: 'Technical', icon: <Cpu size={18} /> },
    { id: 'qa', label: 'QA Summary', icon: <CheckCircle size={18} /> },
    { id: 'executive', label: 'Executive', icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="premium-card overflow-hidden flex flex-col min-h-[600px]">
      {/* Header / Tabs - Stark Brutalist Style */}
      <div className="px-10 py-10 border-b-[2.5px] border-black dark:border-white flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#f2f2f2] dark:bg-black/50">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => fetchNotes(tab.id)}
              disabled={loading}
              className={`flex items-center gap-3 px-6 py-3 border-[2.5px] transition-all font-black text-xs uppercase tracking-tighter whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                  : 'bg-white text-black border-black dark:bg-black dark:text-white dark:border-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-black dark:text-white font-black text-[10px] uppercase tracking-[0.25em] border-2 border-black dark:border-white px-4 py-2 bg-white dark:bg-black">
          <Sparkles size={14} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'Synthesizing...' : 'AI Engine Active'}
        </div>
      </div>

      {/* Content Area - Stark White/Black */}
      <div className="p-12 md:p-20 flex-1 relative bg-white dark:bg-black">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <article 
            className="markdown-content"
            dangerouslySetInnerHTML={getMarkdownText()} 
          />
        )}
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4" />
    <div className="space-y-3">
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6" />
    </div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2 mt-10" />
    <div className="space-y-3">
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-4/5" />
    </div>
  </div>
);

export default AiGenerationPanel;
