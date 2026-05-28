import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, Calendar, Shield, Activity } from 'lucide-react';
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
  const [syncCountdown, setSyncCountdown] = useState(30);
  const [settings, setSettings] = useState({});
  const [history, setHistory] = useState([]);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const lastScoreRef = useRef(null); // To track score changes
  const abortControllerRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchReadiness = useCallback(async (save = false) => {
    setReadiness(prev => ({ ...prev, status: 'updating' }));
    try {
      // If manually triggered, we always save. If automatic, we save only on change.
      const url = `/api/readiness?t=${Date.now()}`;
      const response = await axios.get(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const newScore = response.data.score;
      setReadiness({ ...response.data, status: 'live' });
      setLastSynced(new Date().toLocaleTimeString());
      setSyncCountdown(30);

      // Save logic: Manual trigger OR score changed
      if (save || (lastScoreRef.current !== null && lastScoreRef.current !== newScore)) {
        await axios.get(`/api/readiness?save=true&t=${Date.now()}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        fetchHistory(); // Update history list immediately
        if (save) {
          setShowSyncToast(true);
          setTimeout(() => setShowSyncToast(false), 3000);
        }
      }
      lastScoreRef.current = newScore;
    } catch (error) {
      console.error("Readiness fetch failed:", error.message);
      setReadiness(prev => ({ ...prev, status: 'error' }));
    }
  }, [fetchHistory]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (e) { console.error(e); }
  }, []);

  const cancelNotes = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setContent(prev => prev + '\n\n**Generation Cancelled by User.**');
    }
  };

  // Immediate fetch on mount + Sync Countdown logic
  useEffect(() => {
    fetchReadiness(); // Fetch immediately on load
    const timer = setInterval(() => {
      setSyncCountdown(prev => {
        if (prev <= 1) {
          fetchReadiness(); // Automatic sync (no save unless score changes)
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchReadiness]);

  useEffect(() => {
    if (activeView === 'settings') fetchSettings();
    if (activeView === 'history') fetchHistory();
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
      if (!axios.isCancel(error)) {
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
      history: 'Release Audit Log',
      settings: 'System Configuration'
    }[activeView];

    return (
      <div className="py-2">
        <header className="mb-8 flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{viewTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">Operational Control &gt; {viewTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {showSyncToast && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2"
                >
                  <CheckCircle2 size={12} /> RECORD SAVED TO AUDIT LOG
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => fetchReadiness(true)}
              disabled={readiness.status === 'updating'}
              className="sn-button flex items-center gap-2 px-6"
            >
              <Activity size={16} className={readiness.status === 'updating' ? 'animate-spin' : ''} />
              {readiness.status === 'updating' ? 'SYNCING...' : 'TRIGGER MANUAL AUDIT'}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
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
            
            {activeView === 'history' && (
              <div className="sn-card">
                <div className="sn-card-header">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Permanent Release History</span>
                  </div>
                  <button onClick={fetchHistory} className="text-blue-500 hover:underline">Refresh Logs</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="sn-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Detailed Breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id}>
                          <td className="whitespace-nowrap font-mono text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar size={12} />
                              {new Date(h.timestamp).toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${h.verdict === 'GO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {h.verdict}
                            </span>
                          </td>
                          <td className="font-bold text-lg">
                            {h.score}%
                          </td>
                          <td>
                            <ul className="space-y-1">
                              {h.details.map((d, i) => (
                                <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                  <Shield size={10} className="mt-1 flex-shrink-0" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView === 'settings' && (
              <div className="max-w-3xl">
                <div className="sn-card">
                  <div className="sn-card-header">
                    <div className="flex items-center gap-2">
                      <Shield size={16} />
                      <span>Release Gate Weights</span>
                    </div>
                  </div>
                  <div className="sn-card-body space-y-4">
                    {Object.entries(settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-gray-400">Impact on the final readiness score</span>
                        </div>
                        <input 
                          type="number" 
                          value={value} 
                          onChange={(e) => updateSetting(key, e.target.value)}
                          className="w-24 bg-gray-50 dark:bg-[#091e42] border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm text-right font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sn-card">
                  <div className="sn-card-header">Display Preferences</div>
                  <div className="sn-card-body flex justify-between items-center">
                    <div>
                      <p className="font-bold">Dark Mode</p>
                      <p className="text-xs text-gray-500">Enable high-contrast dark interface</p>
                    </div>
                    <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className="sn-button-secondary"
                    >
                      {darkMode ? 'Switch to Light' : 'Switch to Dark'}
                    </button>
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
      syncCountdown={syncCountdown}
      status={readiness.status}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
