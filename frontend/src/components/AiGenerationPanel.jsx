import React from 'react';
import { Cpu, CheckCircle, BarChart3, Sparkles, Wand2, FileText } from 'lucide-react';

const AiGenerationPanel = ({ activeTab, fetchNotes, cancelNotes, content, loading, getMarkdownText }) => {
  const tabs = [
    { id: 'technical', label: 'Technical', icon: <Cpu size={14} /> },
    { id: 'qa', label: 'QA Summary', icon: <CheckCircle size={14} /> },
    { id: 'executive', label: 'Executive', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="sn-card min-h-[500px] flex flex-col">
      {/* ServiceNow Workspace Tabs */}
      <div className="ai-panel-tab-bar bg-[#f8f9fa] dark:bg-[#333] border-b border-sn-border-color">
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
      <div className="ai-panel-toolbar px-6 py-3 border-b border-sn-border-color flex justify-between items-center bg-white dark:bg-[#2b2b2b]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
          <Wand2 size={14} />
          <span>AI Content Generator</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Sparkles size={12} className={loading ? 'animate-pulse text-sn-link-color' : ''} />
            {loading ? (
              <div className="flex items-center gap-3">
                <span>Processing...</span>
                <button 
                  onClick={cancelNotes}
                  className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-sm hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  STOP
                </button>
              </div>
            ) : 'Engine Ready'}
          </div>
          <div className="flex items-center gap-2 border-l border-sn-border-color pl-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(content);
                alert('Copied to clipboard!');
              }}
              disabled={loading || !content}
              className="p-1.5 text-gray-500 hover:text-sn-link-color transition-colors"
              title="Copy to Clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
            <button 
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([content], {type: 'text/markdown'});
                element.href = URL.createObjectURL(file);
                element.download = `release-notes-${activeTab}.md`;
                document.body.appendChild(element);
                element.click();
              }}
              disabled={loading || !content}
              className="p-1.5 text-gray-500 hover:text-sn-link-color transition-colors"
              title="Download as Markdown"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
            <button 
              onClick={() => fetchNotes(activeTab)}
              disabled={loading}
              className="sn-button text-xs py-1.5 ml-2"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Content Workspace */}
      <div className="ai-panel-body p-8 md:p-12 flex-1 bg-white dark:bg-[#2b2b2b]">
        {loading ? (
          <SkeletonLoader />
        ) : content.startsWith('### System Ready') ? (
          <EmptyState tabs={tabs} fetchNotes={fetchNotes} />
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

const EmptyState = ({ tabs, fetchNotes }) => (
  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <FileText size={28} className="text-gray-300 dark:text-slate-500" />
    </div>
    <p className="text-base font-semibold text-gray-500 dark:text-slate-400 mb-1">No content generated yet</p>
    <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">Choose a report type below to generate AI-powered release notes</p>
    <div className="flex gap-3">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => fetchNotes(tab.id)}
          className="flex items-center gap-2 px-4 py-2 rounded border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-800"
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

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
