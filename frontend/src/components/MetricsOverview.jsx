import React, { memo } from 'react';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const MetricsOverview = memo(({ readiness }) => {
  const isGo = readiness.verdict === 'GO';
  
  const data = [
    { name: 'Readiness', value: readiness.score },
    { name: 'Remaining', value: 100 - readiness.score },
  ];
  
  const COLORS = [isGo ? '#000000' : '#FF0000', '#f2f2f2'];
  const DARK_COLORS = [isGo ? '#FFFFFF' : '#FF0000', '#333333'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
      {/* Main Score Card - Brutalist */}
      <div className="lg:col-span-1 premium-card p-12">
        <div className="flex flex-col items-center text-center">
          <span className="text-[12px] font-black uppercase tracking-[0.4em] text-black dark:text-white mb-10 border-b-4 border-black dark:border-white pb-2">Readiness Score</span>
          
          <div className="relative w-64 h-64 mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={85}
                  outerRadius={105}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  stroke={document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'}
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  <Cell fill={document.documentElement.classList.contains('dark') ? DARK_COLORS[0] : COLORS[0]} />
                  <Cell fill={document.documentElement.classList.contains('dark') ? DARK_COLORS[1] : COLORS[1]} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-black tracking-tighter text-black dark:text-white">
                {readiness.score}%
              </span>
            </div>
          </div>
          
          <div className={`inline-flex items-center gap-4 px-8 py-4 border-4 font-black text-sm tracking-tighter uppercase ${
            isGo ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]' : 'bg-red-600 text-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]'
          }`}>
            {isGo ? <ShieldCheck size={24} strokeWidth={3} /> : <AlertTriangle size={24} strokeWidth={3} />}
            {readiness.verdict} VERDICT
          </div>
        </div>
      </div>

      {/* Details Card - Stark Grid Style */}
      <div className="lg:col-span-2 premium-card p-12">
        <div className="flex items-center justify-between mb-12 border-b-4 border-black dark:border-white pb-4">
          <h3 className="text-3xl font-black text-black dark:text-white flex items-center gap-4 uppercase tracking-tighter">
            <div className="p-2 bg-black dark:bg-white text-white dark:text-black">
              <Info size={28} />
            </div>
            Neural Checks
          </h3>
        </div>
        
        <div className="space-y-6 h-[320px] overflow-y-auto pr-6 custom-scrollbar">
          {readiness.details.length > 0 ? (
            readiness.details.map((detail, index) => (
              <div 
                key={index} 
                className="flex items-center gap-6 p-6 border-[2.5px] border-black dark:border-white bg-[#f2f2f2] dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-100 group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <div className="flex-shrink-0">
                  {detail.includes('Blockers') ? (
                    <AlertTriangle size={28} strokeWidth={3} className="text-red-600 group-hover:text-white dark:group-hover:text-black" />
                  ) : detail.includes('Failed') ? (
                    <AlertTriangle size={28} strokeWidth={3} className="text-red-600 group-hover:text-white dark:group-hover:text-black" />
                  ) : (
                    <CheckCircle2 size={28} strokeWidth={3} className="text-black dark:text-white group-hover:text-white dark:group-hover:text-black" />
                  )}
                </div>
                <p className="text-lg font-black uppercase tracking-tighter leading-none text-black dark:text-white group-hover:text-white dark:group-hover:text-black">
                  {detail}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full border-4 border-dashed border-black/20 dark:border-white/20">
              <CheckCircle2 size={64} className="mb-4 opacity-10" />
              <p className="font-black text-xl uppercase tracking-widest opacity-20">System Optimal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.readiness.score === nextProps.readiness.score &&
    prevProps.readiness.verdict === nextProps.readiness.verdict &&
    prevProps.readiness.details.length === nextProps.readiness.details.length
  );
});

export default MetricsOverview;
