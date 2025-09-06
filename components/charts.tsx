import React from 'react';
import { generateHslColorFromString } from '../utils';

type BarChartProps = {
  data: { name: string; revenue: number; expenses: number }[];
};

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.flatMap(d => [d.revenue, d.expenses]));
  const yAxisLabels = [0, maxValue / 4, maxValue / 2, (maxValue * 3) / 4, maxValue].map(v => Math.round(v));
  
  return (
    <div className="h-64 flex flex-col">
      <div className="flex-grow flex items-end gap-4 px-4">
        {data.map(item => (
          <div key={item.name} className="flex-1 flex justify-center items-end gap-1 h-full">
            <div className="w-1/2 bg-green-500/50 hover:bg-green-500/80 rounded-t-md transition-all" style={{ height: `${(item.revenue / maxValue) * 100}%` }} title={`Revenue: $${item.revenue.toFixed(2)}`}></div>
            <div className="w-1/2 bg-red-500/50 hover:bg-red-500/80 rounded-t-md transition-all" style={{ height: `${(item.expenses / maxValue) * 100}%` }} title={`Expenses: $${item.expenses.toFixed(2)}`}></div>
          </div>
        ))}
      </div>
      <div className="flex justify-around border-t border-slate-700 mt-2 pt-1">
        {data.map(item => <span key={item.name} className="text-xs text-slate-400">{item.name}</span>)}
      </div>
      <div className="flex items-center justify-center gap-4 text-xs mt-2">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500/50"></div> Revenue</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/50"></div> Expenses</span>
      </div>
    </div>
  );
};

type PieChartProps = {
  data: Record<string, number>;
};

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
    const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a);
    const total = sortedData.reduce((sum, [, value]) => sum + value, 0);
    if (total === 0) {
        return <p className="text-center text-slate-500 py-10">No expense data available.</p>;
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-36 h-36 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                    {(() => {
                        let cumulativePercent = 0;
                        return sortedData.map(([key, value]) => {
                            const percent = (value / total) * 100;
                            const color = generateHslColorFromString(key);
                            const strokeDasharray = `${percent} ${100 - percent}`;
                            const strokeDashoffset = -cumulativePercent;
                            cumulativePercent += percent;
                            
                            return (
                                <circle
                                    key={key}
                                    cx="18" cy="18" r="15.915"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="3.8"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    transform="rotate(-90 18 18)"
                                />
                            );
                        });
                    })()}
                </svg>
            </div>
            <div className="w-full text-xs space-y-2 overflow-y-auto max-h-40">
                {sortedData.map(([key, value]) => {
                    const color = generateHslColorFromString(key);
                    const percent = (value / total) * 100;
                    return (
                        <div key={key} className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></span>
                                <span className="text-slate-300 truncate">{key}</span>
                            </span>
                            <span className="font-semibold text-slate-200">{percent.toFixed(1)}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
