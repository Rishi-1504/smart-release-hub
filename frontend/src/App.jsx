import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import DashboardLayout from './components/DashboardLayout';
import MetricsOverview from './components/MetricsOverview';
import AiGenerationPanel from './components/AiGenerationPanel';

function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [content, setContent] = useState('### System Ready\n\nSelect a variant to generate release notes.');
  const [readiness, setReadiness] = useState({ score: 0, verdict: 'INIT', details: [], status: 'initializing' });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchReadiness();
    const pollInterval = setInterval(() => {
      fetchReadiness();
    }, 30000);
    return () => clearInterval(pollInterval);
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

  const renderContent = () => {
    const viewTitle = {
      dashboard: 'Operations Dashboard',
      notes: 'Release Communications',
      readiness: 'Readiness Analysis',
      settings: 'System Configuration'
    }[activeView];

    return (
      <div className="py-6">
        <header className="mb-8 border-b border-gray-300 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">{viewTitle}</h1>
            <p className="text-sm text-gray-500">Global &gt; Release Operations &gt; {viewTitle}</p>
          </div>
          {activeView === 'dashboard' && (
            <button 
              onClick={fetchReadiness}
              className="sn-button-secondary text-xs"
            >
              Refresh Data
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
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
              <div className="sn-card">
                <div className="sn-card-header">System Preferences</div>
                <div className="sn-card-body space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Display Theme</label>
                    <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className="sn-button"
                    >
                      Set to {darkMode ? 'Light' : 'Dark'} Mode
                    </button>
                  </div>
                  <div className="pt-6 border-t border-gray-100">
                    <label className="block text-sm font-semibold mb-4">Integration Status</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-sm bg-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">JIRA API</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Connected</span>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-sm bg-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">GITHUB API</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <DashboardLayout 
      darkMode={darkMode} 
      setDarkMode={setDarkMode}
      activeView={activeView}
      setActiveView={setActiveView}
      lastSynced={lastSynced}
      status={readiness.status}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
