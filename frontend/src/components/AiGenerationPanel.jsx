import React from 'react';
import { Cpu, CheckCircle, BarChart3, Sparkles, Wand2 } from 'lucide-react';

const AiGenerationPanel = ({ activeTab, fetchNotes, content, loading, getMarkdownText }) => {
  const tabs = [
    { id: 'technical', label: 'Technical', icon: <Cpu size={14} /> },
    { id: 'qa', label: 'QA Summary', icon: <CheckCircle size={14} /> },
    { id: 'executive', label: 'Executive', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="sn-card min-h-[500px] flex flex-col">
      {/* ServiceNow Workspace Tabs */}
      <div className="bg-[#f8f9fa] dark:bg-[#333] border-b border-sn-border-color">
        <div className="flex px-4 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => fetchNotes(tab.id)}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-medium transition-all border-t border-l border-r rounded-t-sm -mb-[1px] ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#2b2b2b] border-sn-border-color border-b-white dark:border-b-[#2b2b2b] text-sn-link-color'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header Actions Area */}
      <div className="px-6 py-3 border-b border-sn-border-color flex justify-between items-center bg-white dark:bg-[#2b2b2b]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
          <Wand2 size={14} />
          <span>AI Content Generator</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Sparkles size={12} className={loading ? 'animate-pulse text-sn-link-color' : ''} />
            {loading ? 'Processing...' : 'Engine Ready'}
          </div>
          <button 
            onClick={() => fetchNotes(activeTab)}
            disabled={loading}
            className="sn-button text-xs py-1.5"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Content Workspace */}
      <div className="p-8 md:p-12 flex-1 bg-white dark:bg-[#2b2b2b]">
        {loading ? (
          <SkeletonLoader />
        ) : (
          <article 
            className="markdown-content max-w-none"
            dangerouslySetInnerHTML={getMarkdownText()} 
          />
        )}
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
    <div className="space-y-3">
      <div className="h-3 bg-gray-50 dark:bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-50 dark:bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-50 dark:bg-gray-800 rounded w-5/6" />
    </div>
    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mt-10" />
    <div className="space-y-3">
      <div className="h-3 bg-gray-50 dark:bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-50 dark:bg-gray-800 rounded w-4/5" />
    </div>
  </div>
);

export default AiGenerationPanel;
