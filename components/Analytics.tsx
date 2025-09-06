import React, { useMemo, useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { TenderStatus, TeamMemberRole, type TeamMember } from '../types';
import { AnalyticsIcon } from './icons';
import { getStatusColors } from '../utils';
import { generateHslColorFromString } from '../utils';

type AnalyticsProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

const StatCard: React.FC<{ title: string, value: string, subtext?: string, color: string }> = ({ title, value, subtext, color }) => (
    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className={`text-4xl font-bold ${color} mt-2`}>{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
);


const Analytics: React.FC<AnalyticsProps> = ({ store, currentUser }) => {
    const { watchlist, teamMembers } = store;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [teamMemberFilter, setTeamMemberFilter] = useState('all');

    if (currentUser.role === TeamMemberRole.MEMBER) {
        return (
            <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                <h3 className="text-xl font-medium text-white mt-4">Access Denied</h3>
                <p className="text-slate-400 mt-2">You do not have permission to view analytics.</p>
            </div>
        );
    }

    const filteredWatchlist = useMemo(() => {
        let items = watchlist;
        
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
            const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
            items = items.filter(item => {
                const addedAt = new Date(item.addedAt).getTime();
                return addedAt >= start && addedAt <= end;
            });
        }
        
        if (teamMemberFilter !== 'all') {
            items = items.filter(item => item.assignedTeamMemberId === teamMemberFilter);
        }

        return items;
    }, [watchlist, startDate, endDate, teamMemberFilter]);

    const stats = useMemo(() => {
        const wonTenders = filteredWatchlist.filter(t => t.status === TenderStatus.WON);
        const lostTenders = filteredWatchlist.filter(t => t.status === TenderStatus.LOST);

        const totalWon = wonTenders.length;
        const totalLost = lostTenders.length;
        const totalValueWon = wonTenders.reduce((acc, t) => {
            const quoteTotal = t.quoteItems?.reduce((qAcc, item) => qAcc + item.quantity * item.unitPrice, 0) || 0;
            const delivery = t.financialDetails?.deliveryCost ?? 0;
            const installation = t.financialDetails?.installationCost ?? 0;
            const vat = quoteTotal * ((t.financialDetails?.vatPercentage ?? 0) / 100);
            return acc + quoteTotal + delivery + installation + vat;
        }, 0);
        
        const winRate = (totalWon + totalLost) > 0 ? (totalWon / (totalWon + totalLost)) * 100 : 0;
        
        const statusCounts = filteredWatchlist.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<TenderStatus, number>);

        const sourceStats = filteredWatchlist.reduce((acc, item) => {
            const source = item.tender.source;
            if (!acc[source]) {
                acc[source] = { total: 0, won: 0, lost: 0 };
            }
            acc[source].total++;
            if (item.status === TenderStatus.WON) acc[source].won++;
            if (item.status === TenderStatus.LOST) acc[source].lost++;
            return acc;
        }, {} as Record<string, { total: number, won: number, lost: number }>);


        return {
            totalWon,
            totalValueWon,
            winRate,
            statusCounts,
            sourceStats,
        };
    }, [filteredWatchlist]);
    
    const maxStatusCount = Math.max(...Object.values(stats.statusCounts), 1);
    const maxWonCount = Math.max(...Object.values(stats.sourceStats).map(s => s.won), 1);
    
    if (watchlist.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                <AnalyticsIcon className="mx-auto w-12 h-12 text-slate-500" />
                <h3 className="text-xl font-medium text-white mt-4">No Data for Analytics</h3>
                <p className="text-slate-400 mt-2">Add and manage tenders to see your performance metrics here.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Tender Analytics</h1>

            <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700 mb-6 flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <label htmlFor="start-date" className="text-sm font-medium text-slate-300">Date From:</label>
                    <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-style"/>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="end-date" className="text-sm font-medium text-slate-300">To:</label>
                    <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-style"/>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="team-member-filter" className="text-sm font-medium text-slate-300">Member:</label>
                  <select id="team-member-filter" value={teamMemberFilter} onChange={(e) => setTeamMemberFilter(e.target.value)} className="input-style">
                    <option value="all">All Members</option>
                    {teamMembers.map(member => (<option key={member.id} value={member.id}>{member.name}</option>))}
                  </select>
                </div>
                {(startDate || endDate || teamMemberFilter !== 'all') && (
                    <button onClick={() => { setStartDate(''); setEndDate(''); setTeamMemberFilter('all'); }} className="text-sm text-blue-400 hover:text-blue-300">Clear</button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="text-green-400" />
                <StatCard title="Tenders Won" value={stats.totalWon.toString()} color="text-slate-200" />
                <StatCard title="Value Won" value={`$${stats.totalValueWon.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} subtext="Based on quote totals" color="text-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Tender Funnel</h2>
                    <div className="space-y-4">
                        {Object.values(TenderStatus).map(status => {
                            const count = stats.statusCounts[status] || 0;
                            const percentage = (count / maxStatusCount) * 100;
                            const colors = getStatusColors(status);
                            return (
                                <div key={status} className="flex items-center gap-4 group">
                                    <span className="w-28 text-sm text-slate-300 font-medium flex-shrink-0">{status}</span>
                                    <div className="w-full bg-slate-700/50 rounded-full h-6 relative">
                                        <div className={`h-6 rounded-full ${colors.bg.replace('/30', '/80')} transition-all duration-500`} style={{ width: `${percentage}%` }}/>
                                    </div>
                                    <span className={`w-10 text-right font-semibold ${colors.text}`}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                 <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Tenders Won by Source</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                       {Object.entries(stats.sourceStats)
                          .sort(([, a], [, b]) => b.won - a.won)
                          .map(([source, data]) => {
                            const percentage = (data.won / maxWonCount) * 100;
                            const sourceColor = generateHslColorFromString(source);
                            return (
                                <div key={source} className="grid grid-cols-3 gap-4 items-center text-sm">
                                    <span className="col-span-1 truncate font-medium text-slate-300" title={source}>{source}</span>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <div className="w-full bg-slate-700/50 rounded-full h-5 relative">
                                            <div className="h-5 rounded-full transition-all duration-500 text-right pr-2 text-white font-bold text-xs flex items-center justify-end" style={{ width: `${percentage}%`, backgroundColor: sourceColor, textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}>
                                                {data.won > 0 ? data.won : ''}
                                            </div>
                                        </div>
                                        {data.won === 0 && <span className="font-semibold text-slate-500 w-4 text-right">{data.won}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;