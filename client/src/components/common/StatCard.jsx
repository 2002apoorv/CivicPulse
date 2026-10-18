import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend, trendLabel }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${scheme.bg} ${scheme.text} ${scheme.border}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {(subtitle || trendLabel) && (
        <p className="mt-1 text-xs text-slate-500 truncate">
          {subtitle || trendLabel}
        </p>
      )}
    </div>
  );
};
