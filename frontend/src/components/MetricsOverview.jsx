import React, { memo } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, ListFilter, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const JIRA_BASE = 'https://rishigtripathi1979.atlassian.net/browse/';

const MetricsOverview = memo(({ readiness, darkMode = false }) => {
  const isGo = readiness.verdict === 'GO';
  const scoreColor = isGo ? '#278efc' : '#e91e63';
  const trackColor = darkMode ? '#334155' : '#f2f2f2';

  const pieData = [
    { name: 'Readiness', value: readiness.score },
    { name: 'Remaining', value: Math.max(0, 100 - readiness.score) },
  ];

  // Match backend scoring logic to extract ticket groups
  const rawJira = readiness.raw_jira || [];
  const blockers = rawJira.filter(
    i => (i.priority === 'Highest' || i.priority === 'High') && i.status !== 'Done'
  );
  const untested = rawJira.filter(
    i => i.status !== 'Done' && !(i.priority === 'Highest' || i.priority === 'High')
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Readiness Score Widget */}
      <div className="lg:col-span-1 sn-card">
        <div className="sn-card-header">
          <span>Readiness Score</span>
          <ShieldCheck size={16} className={isGo ? 'text-green-500' : 'text-red-500'} />
        </div>
        <div className="sn-card-body flex flex-col items-center">
          {/* Donut chart */}
          <div className="relative w-44 h-44 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={58}
                  outerRadius={72}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                  stroke="none"
                  isAnimationActive={true}
                >
                  <Cell fill={scoreColor} />
                  <Cell fill={trackColor} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold" style={{ color: 'var(--sn-text-main)' }}>
                {readiness.score}%
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400">Target: 70%</span>
            </div>
          </div>

          {/* Target progress bar */}
          <div className="w-full px-1 mb-3">
            <div className="flex justify-between text-[9px] text-gray-400 mb-1">
              <span>0</span>
              <span className="font-bold text-blue-500">▲ 70% target</span>
              <span>100</span>
            </div>
            <div className="relative w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-visible">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${readiness.score}%`, backgroundColor: scoreColor }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 rounded-full"
                style={{ left: '70%' }}
              />
            </div>
          </div>

          <div className={`w-full p-3 rounded-sm text-center font-bold text-sm border ${
            isGo
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            VERDICT: {readiness.verdict}
          </div>
        </div>
      </div>

      {/* Quality Gates */}
      <div className="lg:col-span-2 sn-card">
        <div className="sn-card-header">
          <div className="flex items-center gap-2">
            <ListFilter size={16} />
            <span>Quality Gates</span>
          </div>
          <span className="text-[10px] font-normal text-gray-500">{readiness.details.length} Active Checks</span>
        </div>

        <div className="sn-card-body overflow-y-auto" style={{ minHeight: 220 }}>
          {readiness.details.length > 0 ? (
            <div className="space-y-1">
              {readiness.details.map((detail, index) => {
                const isPenalty = detail.includes('(-');
                const isCritical = detail.includes('Blockers') || detail.includes('Failed');
                const isUntested = isPenalty && detail.includes('untested');

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isCritical ? (
                          <AlertTriangle size={18} className="text-red-500" />
                        ) : isPenalty ? (
                          <AlertTriangle size={18} className="text-amber-500" />
                        ) : (
                          <CheckCircle2 size={18} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{detail}</p>
                    </div>

                    {/* Blocker ticket chips */}
                    {isCritical && blockers.length > 0 && (
                      <div className="ml-10 flex flex-wrap gap-1.5">
                        {blockers.map(ticket => (
                          <a
                            key={ticket.key}
                            href={`${JIRA_BASE}${ticket.key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={ticket.summary}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          >
                            {ticket.key}
                            <ExternalLink size={8} />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Untested ticket chips */}
                    {isUntested && untested.length > 0 && (
                      <div className="ml-10 flex flex-wrap gap-1.5">
                        {untested.slice(0, 8).map(ticket => (
                          <a
                            key={ticket.key}
                            href={`${JIRA_BASE}${ticket.key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={ticket.summary}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          >
                            {ticket.key}
                            <ExternalLink size={8} />
                          </a>
                        ))}
                        {untested.length > 8 && (
                          <span className="text-[10px] text-gray-400 self-center">+{untested.length - 8} more</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle2 size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">All quality gates passed</p>
              <p className="text-xs mt-1 opacity-60">No blockers or incomplete tickets found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.readiness.score === next.readiness.score &&
  prev.readiness.verdict === next.readiness.verdict &&
  prev.readiness.details.length === next.readiness.details.length &&
  prev.darkMode === next.darkMode
);

export default MetricsOverview;
