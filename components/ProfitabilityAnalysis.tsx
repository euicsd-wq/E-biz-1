import React, { useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { TenderStatus } from '../types';
import { AnalyticsIcon } from './icons';
import { formatCurrency } from '../utils';

type ProfitabilityAnalysisProps = {
  store: ReturnType<typeof useTenderStore>;
};

const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({ store }) => {
    const { watchlist, expenses } = store;

    const profitabilityData = useMemo(() => {
        return watchlist
            .filter(item => item.status === TenderStatus.WON)
            .map(item => {
                const revenue = (item.invoices || [])
                    .filter(inv => inv.status === 'Paid')
                    .reduce((sum, inv) => sum + inv.amount, 0);

                const cogs = (item.quoteItems || []).reduce((sum, qItem) => sum + ((qItem.cost || 0) * qItem.quantity), 0);
                const tenderSpecificExpenses = (expenses || []).filter(exp => exp.tenderId === item.tender.id).reduce((sum, exp) => sum + exp.amount, 0);

                const totalCosts = cogs + tenderSpecificExpenses;
                const netProfit = revenue - totalCosts;
                const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                return {
                    tenderId: item.tender.id,
                    tenderTitle: item.tender.title,
                    revenue,
                    totalCosts,
                    netProfit,
                    netMargin
                };
            })
            .sort((a,b) => b.netProfit - a.netProfit);
    }, [watchlist, expenses]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Profitability Analysis</h1>
            {profitabilityData.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                    <AnalyticsIcon className="mx-auto w-12 h-12 text-slate-500" />
                    <h3 className="text-xl font-medium text-white mt-4">No Profitability Data</h3>
                    <p className="text-slate-400 mt-2">Win tenders and mark their invoices as 'Paid' to analyze profitability.</p>
                </div>
            ) : (
                <div className="bg-slate-800/80 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="th-style">Tender</th>
                                <th className="th-style text-right">Revenue</th>
                                <th className="th-style text-right">Total Costs</th>
                                <th className="th-style text-right">Net Profit</th>
                                <th className="th-style text-right">Net Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {profitabilityData.map(item => (
                                <tr key={item.tenderId} className="hover:bg-slate-800 transition-colors">
                                    <td className="td-style font-medium text-slate-100 truncate max-w-xs" title={item.tenderTitle}>{item.tenderTitle}</td>
                                    <td className="td-style text-right text-green-400">{formatCurrency(item.revenue)}</td>
                                    <td className="td-style text-right text-yellow-400">{formatCurrency(item.totalCosts)}</td>
                                    <td className={`td-style text-right font-semibold ${item.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(item.netProfit)}</td>
                                    <td className={`td-style text-right font-semibold ${item.netMargin >= 0 ? 'text-slate-200' : 'text-red-400'}`}>{item.netMargin.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProfitabilityAnalysis;