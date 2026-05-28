import React, { memo } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, ListFilter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const MetricsOverview = memo(({ readiness }) => {
  const isGo = readiness.verdict === 'GO';
  
  const data = [
    { name: 'Readiness', value: readiness.score },
    { name: 'Remaining', value: 100 - readiness.score },
  ];
  
  const COLORS = [isGo ? '#278efc' : '#e91e63', '#f2f2f2'];
  const DARK_COLORS = [isGo ? '#278efc' : '#e91e63', '#404040'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Readiness Score Widget */}
      <div className="lg:col-span-1 sn-card">
        <div className="sn-card-header">
          <span>Readiness Score</span>
          <ShieldCheck size={16} className={isGo ? 'text-green-500' : 'text-red-500'} />
        </div>
        <div className="sn-card-body flex flex-col items-center">
          <div className="relative w-48 h-48 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={65}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  stroke="none"
                  isAnimationActive={true}
                >
                  <Cell fill={document.documentElement.classList.contains('dark') ? DARK_COLORS[0] : COLORS[0]} />
                  <Cell fill={document.documentElement.classList.contains('dark') ? DARK_COLORS[1] : COLORS[1]} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-800 dark:text-white">
                {readiness.score}%
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400">Target: 70%</span>
            </div>
          </div>
          
          <div className={`w-full mt-4 p-3 rounded-sm text-center font-bold text-sm border ${
            isGo 
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            VERDICT: {readiness.verdict}
          </div>
        </div>
      </div>

      {/* Quality Gates / Checks List */}
      <div className="lg:col-span-2 sn-card">
        <div className="sn-card-header">
          <div className="flex items-center gap-2">
            <ListFilter size={16} />
            <span>Quality Gates</span>
          </div>
          <span className="text-[10px] font-normal text-gray-500">{readiness.details.length} Active Checks</span>
        </div>
        
        <div className="sn-card-body h-[280px] overflow-y-auto">
          {readiness.details.length > 0 ? (
            <div className="space-y-1">
              {readiness.details.map((detail, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    {detail.includes('Blockers') || detail.includes('Failed') ? (
                      <AlertTriangle size={18} className="text-red-500" />
                    ) : (
                      <CheckCircle2 size={18} className="text-green-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CheckCircle2 size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">All systems optimal</p>
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
