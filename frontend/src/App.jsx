import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, Calendar, Shield, Activity, RefreshCw } from 'lucide-react';
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);
  
  const lastStateHashRef = useRef(null); // Tracks if Jira/GitHub data actually changed
  const abortControllerRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`/api/history?t=${Date.now()}`);
      setHistory(response.data);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  }, []);

  const fetchNotes = useCallback(async (type) => {
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
    } catch (error) {
      if (!axios.isCancel(error)) {
        setContent('**System Error:** Communication link with backend severed.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const fetchReadiness = useCallback(async (save = false) => {
    setReadiness(prev => ({ ...prev, status: 'updating' }));
    try {
      const url = `/api/readiness?t=${Date.now()}`;
      const response = await axios.get(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const newScore = response.data.score;
      // Simple hash to detect ANY change in Jira/GitHub data
      const currentStateHash = JSON.stringify(response.data.details) + newScore;
      
      setReadiness({ ...response.data, status: 'live' });
      setLastSynced(new Date().toLocaleTimeString());
      setSyncCountdown(30);

      // SAVE LOGIC: Manual trigger OR actual data change
      if (save || (lastStateHashRef.current !== null && lastStateHashRef.current !== currentStateHash)) {
        await axios.get(`/api/readiness?save=true&t=${Date.now()}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        fetchHistory(); // Refresh the list immediately

        // AUTO-UPDATE QA SUMMARY: If data changed, regenerate the QA summary automatically
        if (lastStateHashRef.current !== null && lastStateHashRef.current !== currentStateHash) {
          console.log("DEBUG: Data change detected. Auto-regenerating QA Summary...");
          fetchNotes('qa');
        }

        if (save) {
          setShowSyncToast(true);
          setTimeout(() => setShowSyncToast(false), 3000);
        }
      }
      lastStateHashRef.current = currentStateHash;
    } catch (error) {
      console.error("Readiness fetch failed:", error.message);
      setReadiness(prev => ({ ...prev, status: 'error' }));
    }
  }, [fetchHistory, fetchNotes]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`/api/settings?t=${Date.now()}`);
      setSettings(response.data);
    } catch (e) { console.error(e); }
  }, []);

  // Initialization: Fetch immediately on load
  useEffect(() => {
    fetchReadiness();
    fetchSettings();
  }, [fetchReadiness, fetchSettings]);

  // Sync Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncCountdown(prev => {
        if (prev <= 1) {
          fetchReadiness(); 
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchReadiness]);

  useEffect(() => {
    if (activeView === 'history') fetchHistory();
    if (activeView === 'settings') fetchSettings();
  }, [activeView, fetchHistory, fetchSettings]);

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
      let html = marked && typeof marked.parse === 'function' ? marked.parse(processedContent) : processedContent;
      return { __html: html };
    } catch (err) {
      return { __html: '<p>Error parsing content.</p>' };
    }
  };

  const cancelNotes = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setContent(prev => prev + '\n\n**Generation Cancelled by User.**');
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
        <header className="mb-8 flex justify-between items-end border-b border-gray-200 dark:border-slate-700 pb-6">
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
                  <button 
                    onClick={fetchHistory} 
                    disabled={historyLoading}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-bold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />
                    Refresh Logs
                  </button>
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
                      {history.length > 0 ? history.map(h => (
                        <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="whitespace-nowrap font-mono text-gray-500 dark:text-slate-400">
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
                          <td className="font-bold text-lg dark:text-white">
                            {h.score}%
                          </td>
                          <td>
                            <ul className="space-y-1">
                              {h.details.map((d, i) => (
                                <li key={i} className="text-[11px] text-gray-600 dark:text-slate-300 flex items-start gap-2">
                                  <Shield size={10} className="mt-1 text-blue-500 flex-shrink-0" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="text-center py-20 text-gray-400 italic">No change history recorded yet.</td>
                        </tr>
                      )}
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
                      <div key={key} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-gray-400">Impact on the final readiness score</span>
                        </div>
                        <input 
                          type="number" 
                          value={value} 
                          onChange={(e) => updateSetting(key, e.target.value)}
                          className="w-24 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-right font-mono dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sn-card">
                  <div className="sn-card-header">Display Preferences</div>
                  <div className="sn-card-body flex justify-between items-center">
                    <div>
                      <p className="font-bold dark:text-white">Dark Mode</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Enable high-contrast slate interface</p>
                    </div>
                    <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className="sn-button-secondary dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
