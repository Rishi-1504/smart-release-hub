import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [settings, setSettings] = useState({});
  const [history, setHistory] = useState([]);
  const abortControllerRef = useRef(null);

  const cancelNotes = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setContent(prev => prev + '\n\n**Generation Cancelled by User.**');
    }
  };

  const fetchReadiness = useCallback(async (save = false) => {
    setReadiness(prev => ({ ...prev, status: 'updating' }));
    try {
      const url = `/api/readiness?t=${Date.now()}${save ? '&save=true' : ''}`;
      const response = await axios.get(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setReadiness({ ...response.data, status: 'live' });
      setLastSynced(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Readiness fetch failed:", error.message);
      setReadiness(prev => ({ ...prev, status: 'error' }));
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchReadiness();
    const pollInterval = setInterval(() => {
      fetchReadiness();
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchReadiness]);

  useEffect(() => {
    if (activeView === 'settings') {
      fetchSettings();
      fetchHistory();
    }
  }, [activeView, fetchSettings, fetchHistory]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const updateSetting = async (key, value) => {
    try {
      await axios.post('/api/settings', { [key]: value });
      fetchSettings();
    } catch (e) { console.error(e); }
  };

  const getMarkdownText = () => {
    try {
      if (typeof content !== 'string') return { __html: '' };
      const processedContent = content.replace(/^(To|From|Subject|Date):.*$/gmi, '').trim();
      
      // Handle both ESM and older bundle styles for marked
      let html = '';
      if (marked && typeof marked.parse === 'function') {
        html = marked.parse(processedContent);
      } else if (typeof marked === 'function') {
        html = marked(processedContent);
      } else {
        html = processedContent;
      }
        
      return { __html: html };
    } catch (err) {
      console.error("Markdown parsing failed:", err);
      return { __html: '<p>Error parsing content.</p>' };
    }
  };

  const fetchNotes = async (type) => {
    setActiveTab(type);
    setLoading(true);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await axios.post(`/api/generate-notes`, {
        variant: type,
        raw_data: "" 
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: abortControllerRef.current.signal
      });
      setContent(response.data.content);
      fetchReadiness();
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message);
      } else {
        setContent('**System Error:** Communication link with backend severed.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
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
              onClick={() => fetchReadiness(true)}
              className="sn-button-secondary text-xs"
            >
              Sync & Record Audit
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
                  cancelNotes={cancelNotes}
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
                cancelNotes={cancelNotes}
                content={content}
                loading={loading}
                getMarkdownText={getMarkdownText}
              />
            )}
            {activeView === 'readiness' && <MetricsOverview readiness={readiness} />}
            {activeView === 'settings' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="sn-card">
                  <div className="sn-card-header">Scoring Configuration</div>
                  <div className="sn-card-body space-y-4">
                    {Object.entries(settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                        <input 
                          type="number" 
                          value={value} 
                          onChange={(e) => updateSetting(key, e.target.value)}
                          className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-sn-link-color"
                        />
                      </div>
                    ))}
                    <div className="pt-4 flex justify-between items-center">
                      <span className="text-sm font-bold">Theme Mode</span>
                      <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="sn-button text-xs"
                      >
                        Switch to {darkMode ? 'Light' : 'Dark'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sn-card">
                  <div className="sn-card-header">Release Audit Log</div>
                  <div className="sn-card-body max-h-[400px] overflow-y-auto">
                    {history.length > 0 ? (
                      <div className="space-y-2">
                        {history.map((h) => (
                          <div key={h.id} className="p-3 border border-gray-100 rounded-sm bg-gray-50 dark:bg-white/5 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
                              <p className="text-xs font-semibold">Score: <span className={h.score >= (settings.target_score || 70) ? 'text-green-600' : 'text-red-600'}>{h.score}%</span></p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.verdict === 'GO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {h.verdict}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-10 text-xs text-gray-400 italic">No history recorded yet.</p>
                    )}
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
