import React, { useState, useEffect } from 'react';
import { Rocket, FileText, CheckCircle, Zap, Cpu, BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { marked } from 'marked';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [content, setContent] = useState('### System Ready\n\nSelect an operation persona above to initialize AI generation.');
  const [readiness, setReadiness] = useState({ score: 100, verdict: 'GO', details: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/readiness');
      setReadiness(response.data);
    } catch (error) {
      console.error("Readiness fetch failed");
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
    setContent('_Establishing neural link and synthesizing data..._');
    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/generate-notes`, {
        variant: type,
        raw_data: "" 
      });
      setContent(response.data.content);
      fetchReadiness(); // Refresh score after generation
    } catch (error) {
      setContent('**System Error:** Communication link with backend severed. Verify API state.');
    } finally {
      setLoading(false);
    }
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-violet-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20">
        {/* Header Section */}
        <header className="flex flex-col items-center mb-16 text-center">
          <div className="flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/60 border border-white/50 shadow-sm backdrop-blur-md">
            <Zap size={14} className="text-indigo-600 fill-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-900/60">Intelligence Hub</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Smart Release <span className="italic font-serif text-indigo-600">Hub</span>
          </h1>
          
          {/* Readiness Score Card */}
          <div className={`mt-4 mb-8 flex items-center gap-8 px-8 py-4 rounded-[24px] border backdrop-blur-md transition-all duration-500 ${
            readiness.verdict === 'GO' ? 'bg-emerald-50/40 border-emerald-200/50' : 'bg-rose-50/40 border-rose-200/50'
          }`}>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Readiness Score</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${readiness.verdict === 'GO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {readiness.score}%
                </span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
            </div>
            
            <div className="w-px h-12 bg-slate-200/50" />
            
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${readiness.verdict === 'GO' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {readiness.verdict === 'GO' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verdict</span>
                <span className={`text-xl font-black ${readiness.verdict === 'GO' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {readiness.verdict}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12 p-2 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-xl shadow-inner max-w-2xl mx-auto">
          <button 
            disabled={loading}
            onClick={() => fetchNotes('technical')} 
            className={`tab-transition flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm ${
              activeTab === 'technical' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <Cpu size={18} />
            Technical
          </button>
          
          <button 
            disabled={loading}
            onClick={() => fetchNotes('qa')} 
            className={`tab-transition flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm ${
              activeTab === 'qa' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <CheckCircle size={18} />
            QA Summary
          </button>
          
          <button 
            disabled={loading}
            onClick={() => fetchNotes('executive')} 
            className={`tab-transition flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm ${
              activeTab === 'executive' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <BarChart3 size={18} />
            Executive
          </button>
        </div>

        {/* Main Display Area */}
        <div className="glass-card rounded-[40px] overflow-hidden">
          {/* Internal Header */}
          <div className="flex items-center justify-between px-10 py-6 border-b border-slate-200/60 bg-white/20">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${loading ? 'animate-pulse' : ''} ${
                activeTab === 'technical' ? 'bg-indigo-500' : 
                activeTab === 'qa' ? 'bg-emerald-500' : 'bg-violet-500'
              }`} />
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                {capitalize(activeTab)} View
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</span>
                <span className="text-[11px] font-mono font-bold text-indigo-600">{loading ? 'Synthesizing...' : 'Live Data'}</span>
              </div>
            </div>
          </div>

          {/* Content Wrapper */}
          <div className="relative min-h-[500px] p-10 md:p-20 bg-white/40">
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <article 
              className={`relative markdown-content transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
              dangerouslySetInnerHTML={getMarkdownText()} 
            />
          </div>
        </div>

        {/* Details Footer */}
        {readiness.details.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {readiness.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/30 border border-white/50 backdrop-blur-sm">
                <AlertTriangle size={16} className="text-rose-500" />
                <span className="text-xs font-medium text-slate-600">{detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
