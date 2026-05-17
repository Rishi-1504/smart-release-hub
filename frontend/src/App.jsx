import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import DashboardLayout from './components/DashboardLayout';
import MetricsOverview from './components/MetricsOverview';
import AiGenerationPanel from './components/AiGenerationPanel';
import NavigationOverlay from './components/NavigationOverlay';
import CustomCursor from './components/CustomCursor';

function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [content, setContent] = useState('### Neural Hub Ready\n\nAccess COMMAND to navigate.');
  const [readiness, setReadiness] = useState({ score: 0, verdict: 'INIT', details: [], status: 'initializing' });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());
  const [nextSyncIn, setNextSyncIn] = useState(30);

  useEffect(() => {
    fetchReadiness();
    const pollInterval = setInterval(() => {
      fetchReadiness();
      setNextSyncIn(30);
    }, 30000);
    const tickInterval = setInterval(() => {
      setNextSyncIn(prev => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchReadiness = async () => {
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
      fetchReadiness();
    } catch (error) {
      setContent('**System Error:** Communication link with backend severed.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  const renderContent = () => {
    return (
      <motion.div
        key={activeView}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        {activeView === 'dashboard' && (
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
        )}
        {activeView === 'notes' && (
          <AiGenerationPanel 
            activeTab={activeTab}
            fetchNotes={fetchNotes}
            content={content}
            loading={loading}
            getMarkdownText={getMarkdownText}
          />
        )}
        {activeView === 'readiness' && <MetricsOverview readiness={readiness} />}
        {activeView === 'settings' && (
          <div className="premium-card p-12">
            <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter">System Settings</h2>
            <div className="space-y-8">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="bg-black text-white dark:bg-white dark:text-black px-12 py-6 border-4 border-black dark:border-white font-black uppercase tracking-widest text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                TOGGLE {darkMode ? 'LIGHT' : 'DARK'} MODE
              </button>
              <div className="pt-10 border-t-4 border-black dark:border-white">
                <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Neural Architecture Status</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 border-4 border-black dark:border-white font-black text-xs uppercase bg-white dark:bg-black">JIRA: SYNCED</div>
                  <div className="p-6 border-4 border-black dark:border-white font-black text-xs uppercase bg-white dark:bg-black">GITHUB: SYNCED</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <CustomCursor />
      <NavigationOverlay 
        isOpen={isNavOpen} 
        setIsOpen={setIsNavOpen} 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
      <DashboardLayout>
        {/* Header Area - Avant Garde */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div>
            <motion.h1 
              className="text-massive mb-4"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {activeView}
            </motion.h1>
            <p className="text-2xl font-black uppercase tracking-tighter opacity-40">
              Neural Intel Hub // Operations Terminal
            </p>
          </div>
          
          <div className="flex items-center gap-6 p-8 border-8 border-black dark:border-white bg-white dark:bg-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
            <div className={`h-8 w-8 border-4 border-black dark:border-white ${readiness.status === 'error' ? 'animate-led-error' : 'animate-led'}`} />
            <div className="flex flex-col">
              <span className="text-xl font-black uppercase tracking-[0.2em] leading-none mb-2">Neural Sync</span>
              <div className="flex gap-4">
                <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Last: {lastSynced.split(' ')[0]}</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Next: {nextSyncIn}s</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>

        <footer className="mt-32 py-16 border-t-[10px] border-black dark:border-white flex flex-col md:flex-row justify-between items-center gap-12">
          <span className="text-xl font-black uppercase tracking-[0.4em]">NEURAL INTELLIGENCE HUB // © 2026</span>
          <div className="flex gap-8">
            <span className="text-sm font-black uppercase px-8 py-4 border-4 border-black dark:border-white">Build v3.0.0-EXPERIMENTAL</span>
            <span className="text-sm font-black uppercase px-8 py-4 bg-black text-white dark:bg-white dark:text-black">Stable Neural Link</span>
          </div>
        </footer>
      </DashboardLayout>
    </>
  );
}

export default App;
