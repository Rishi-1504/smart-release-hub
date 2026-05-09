import React, { useState } from 'react';
import { Rocket, FileText, CheckCircle, Zap, Cpu, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { marked } from 'marked';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [content, setContent] = useState('### System Ready\n\nSelect an operation persona above to initialize AI generation.');

  const getMarkdownText = () => {
    // Strip email-like headers (To, From, Subject, Date) from all variants
    const processedContent = content.replace(/^(To|From|Subject|Date):.*$/gmi, '').trim();
    const rawMarkup = marked.parse(processedContent);
    return { __html: rawMarkup };
  };

  const fetchNotes = async (type) => {
    setActiveTab(type);
    setContent('_Establishing neural link and synthesizing data..._');
    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/generate-notes`, {
        variant: type,
        raw_data: "" 
      });
      setContent(response.data.content);
    } catch (error) {
      setContent('**System Error:** Communication link with backend severed. Verify API state.');
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
          <p className="text-xl text-slate-500/80 max-w-2xl font-medium leading-relaxed">
            Revolutionizing release operations with calibrated, persona-driven AI synthesis.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12 p-2 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-xl shadow-inner max-w-2xl mx-auto">
          <button 
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
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                activeTab === 'technical' ? 'bg-indigo-500' : 
                activeTab === 'qa' ? 'bg-emerald-500' : 'bg-violet-500'
              }`} />
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                {capitalize(activeTab)} View
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Latency</span>
                <span className="text-[11px] font-mono font-bold text-indigo-600">24ms</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Protocol</span>
                <span className="text-[11px] font-mono font-bold text-indigo-600">Gemini-2.0</span>
              </div>
            </div>
          </div>

          {/* Content Wrapper */}
          <div className="relative min-h-[500px] p-10 md:p-20 bg-white/40">
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <article 
              className="relative markdown-content"
              dangerouslySetInnerHTML={getMarkdownText()} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
