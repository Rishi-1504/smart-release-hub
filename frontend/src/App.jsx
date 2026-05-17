import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import DashboardLayout from './components/DashboardLayout';
import MetricsOverview from './components/MetricsOverview';
import AiGenerationPanel from './components/AiGenerationPanel';

function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [content, setContent] = useState('### System Ready\n\nSelect an operation persona above to initialize AI generation.');
  const [readiness, setReadiness] = useState({ score: 0, verdict: 'INIT', details: [], status: 'initializing' });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchReadiness();

    // AUTO-SYNC HEARTBEAT: Poll every 30 seconds
    const interval = setInterval(() => {
      fetchReadiness();
    }, 30000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchReadiness = async () => {
    console.log("DEBUG: Auto-Syncing Data...");
    setReadiness(prev => ({ ...prev, status: 'updating' }));
    try {
      const url = `/api/readiness?t=${Date.now()}`;
      const response = await axios.get(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setReadiness({ ...response.data, status: 'live' });
      setLastSynced(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Readiness fetch failed:", error.message);
      setReadiness(prev => ({ ...prev, status: 'error' }));
    }
  };

  const getMarkdownText = () => {
    const processedContent = content.replace(/^(To|From|Subject|Date):.*$/gmi, '').trim();
    const rawMarkup = marked.parse(processedContent);
    return { __html: rawMarkup };
  };

  const fetchNotes = async (type) => {
    setActiveTab(type);
    setLoading(true);
    try {
      const response = await axios.post(`/api/generate-notes`, {
        variant: type,
        raw_data: "" 
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setContent(response.data.content);
      fetchReadiness(); // Refresh score after generation
    } catch (error) {
      setContent('**System Error:** Communication link with backend severed. Verify API state.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return (
          <>
            <MetricsOverview readiness={readiness} />
            <AiGenerationPanel 
              activeTab={activeTab}
              fetchNotes={fetchNotes}
              content={content}
              loading={loading}
              getMarkdownText={getMarkdownText}
            />
          </>
        );
      case 'notes':
        return (
          <AiGenerationPanel 
            activeTab={activeTab}
            fetchNotes={fetchNotes}
            content={content}
            loading={loading}
            getMarkdownText={getMarkdownText}
          />
        );
      case 'readiness':
        return <MetricsOverview readiness={readiness} />;
      case 'settings':
        return (
          <div className="premium-card p-12">
            <h2 className="text-4xl font-black text-black dark:text-white mb-8 uppercase tracking-tighter">System Settings</h2>
            
            <div className="space-y-8">
              <div className="pt-6 border-t-4 border-black dark:border-white">
                <p className="text-xs font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">Integrations Status</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-black dark:border-white font-black text-[10px] uppercase bg-[#f2f2f2] dark:bg-black">Jira: Connected</div>
                  <div className="p-4 border-2 border-black dark:border-white font-black text-[10px] uppercase bg-[#f2f2f2] dark:bg-black">GitHub: Connected</div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest italic">
                * Single-Origin Deployment Active. Neural link is automatic.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      sidebar={
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
      }
    >
      {/* Header Area - Brutalist Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b-8 border-black dark:border-white pb-10">
        <div>
          <h1 className="text-6xl font-black text-black dark:text-white tracking-tighter uppercase mb-4">
            {activeView === 'notes' ? 'Release Notes' : activeView}
          </h1>
          <p className="text-xl font-bold text-black dark:text-white uppercase tracking-tight opacity-60">
            Neural Intelligence for Software Operations
          </p>
        </div>
        
        <div className="flex items-center gap-4 px-6 py-3 border-4 border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className={`h-4 w-4 border-2 border-black dark:border-white ${readiness.status === 'error' ? 'animate-led-error' : 'animate-led'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em] leading-none mb-1">Neural Sync</span>
            <span className="text-[9px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest leading-none">Last: {lastSynced}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Content Section */}
      {renderContent()}

      <footer className="mt-20 py-10 border-t-8 border-black dark:border-white flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-sm font-black text-black dark:text-white uppercase tracking-[0.3em]">Smart Release Intelligence Hub // 2026</span>
        <div className="flex items-center gap-6">
          <span className="text-xs font-black text-black dark:text-white uppercase px-4 py-2 border-2 border-black dark:border-white">Build v2.0.5-AUTO</span>
          <span className="text-xs font-black text-black dark:text-white uppercase px-4 py-2 bg-black text-white dark:bg-white dark:text-black">Stable Link</span>
        </div>
      </footer>
    </DashboardLayout>
  );
}

export default App;
