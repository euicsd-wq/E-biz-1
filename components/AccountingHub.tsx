import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { AccountType } from '../types';
import { formatTenderDate, formatCurrency } from '../utils';

type AccountingHubProps = {
  store: ReturnType<typeof useTenderStore>;
};

const AccountingHub: React.FC<AccountingHubProps> = ({ store }) => {
    const [activeTab, setActiveTab] = useState<'pnl' | 'balance-sheet'>('pnl');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        const start = startDate ? new Date(startDate+'T00:00:00').getTime() : 0;
        const end = endDate ? new Date(endDate+'T23:59:59').getTime() : Infinity;
        
        const accountBalances: Record<string, number> = {};
        store.chartOfAccounts.forEach(acc => accountBalances[acc.id] = 0);

        (store.journalEntries || []).forEach(entry => {
            const entryDate = new Date(entry.date + 'T00:00:00').getTime();
            if (entryDate >= start && entryDate <= end) {
                entry.transactions.forEach(t => {
                    accountBalances[t.accountId] = (accountBalances[t.accountId] || 0) + t.debit - t.credit;
                });
            }
        });

        const allTimeBalances: Record<string, number> = {};
        store.chartOfAccounts.forEach(acc => allTimeBalances[acc.id] = 0);
         (store.journalEntries || []).forEach(entry => {
             const entryDate = new Date(entry.date + 'T00:00:00').getTime();
            if (entryDate <= end) { // Only entries up to the end date
                entry.transactions.forEach(t => {
                    allTimeBalances[t.accountId] = (allTimeBalances[t.accountId] || 0) + t.debit - t.credit;
                });
            }
        });


        // P&L Data (uses period-specific balances)
        const revenues = store.chartOfAccounts
            .filter(acc => acc.type === AccountType.REVENUE)
            .reduce((sum, acc) => sum - accountBalances[acc.id], 0);
        
        const expensesByCategory: Record<string, number> = {};
        store.chartOfAccounts.filter(acc => acc.type === AccountType.EXPENSE).forEach(acc => {
            expensesByCategory[acc.name] = accountBalances[acc.id];
        });
        const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
        const netProfit = revenues - totalExpenses;

        // Balance Sheet Data (uses all-time balances up to end date)
        const assets: Record<string, number> = {};
        store.chartOfAccounts.filter(acc => acc.type === AccountType.ASSET).forEach(acc => {
            assets[acc.name] = allTimeBalances[acc.id];
        });
        const totalAssets = Object.values(assets).reduce((sum, amount) => sum + amount, 0);
        
        const liabilities: Record<string, number> = {};
         store.chartOfAccounts.filter(acc => acc.type === AccountType.LIABILITY).forEach(acc => {
            liabilities[acc.name] = -allTimeBalances[acc.id];
        });
        const totalLiabilities = Object.values(liabilities).reduce((sum, amount) => sum + amount, 0);

        const equityAccounts: Record<string, number> = {};
         store.chartOfAccounts.filter(acc => acc.type === AccountType.EQUITY).forEach(acc => {
            equityAccounts[acc.name] = -allTimeBalances[acc.id];
        });
        
        const retainedEarnings = Object.values(equityAccounts).reduce((sum, amount) => sum + amount, 0);
        const totalEquity = retainedEarnings + netProfit; // Add current period profit
        
        return { 
            revenues, 
            expensesByCategory, 
            totalExpenses, 
            netProfit,
            assets,
            totalAssets,
            liabilities,
            totalLiabilities,
            retainedEarnings,
            totalEquity,
        };
    }, [store.journalEntries, store.chartOfAccounts, startDate, endDate]);

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center border border-slate-700 rounded-lg p-1 bg-slate-900/50">
                    <button onClick={() => setActiveTab('pnl')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'pnl' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>P&L Statement</button>
                    <button onClick={() => setActiveTab('balance-sheet')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'balance-sheet' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Balance Sheet</button>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-300">From:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-style"/>
                    <label className="text-sm font-medium text-slate-300">To:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-style"/>
                </div>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                <div className="max-w-3xl mx-auto">
                    {activeTab === 'pnl' && (
                        <>
                            <h4 className="text-center text-xl font-bold text-white">Profit & Loss Statement</h4>
                            <p className="text-center text-sm text-slate-400 mb-6">For the period from {startDate ? formatTenderDate(startDate) : 'the beginning'} to {formatTenderDate(endDate)}</p>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold text-lg text-green-300">Revenue</h5>
                                    <div className="flex justify-between py-2 border-b border-slate-700"><span className="text-slate-300">Sales Revenue</span><span className="font-mono text-slate-200">{formatCurrency(reportData.revenues)}</span></div>
                                    <div className="flex justify-between py-2 font-bold"><span className="text-slate-200">Total Revenue</span><span className="font-mono text-green-400">{formatCurrency(reportData.revenues)}</span></div>
                                </div>
                                <div className="pt-4">
                                    <h5 className="font-semibold text-lg text-yellow-300">Expenses</h5>
                                    {Object.entries(reportData.expensesByCategory).map(([category, amount]) => (<div key={category} className="flex justify-between py-2 border-b border-slate-700"><span className="text-slate-300">{category}</span><span className="font-mono text-slate-200">{formatCurrency(amount)}</span></div>))}
                                    <div className="flex justify-between py-2 font-bold"><span className="text-slate-200">Total Expenses</span><span className="font-mono text-yellow-400">{formatCurrency(reportData.totalExpenses)}</span></div>
                                </div>
                                <div className="pt-4 border-t-2 border-slate-500"><div className="flex justify-between py-2 text-lg font-bold"><span className="text-white">Net Profit</span><span className={`font-mono ${reportData.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(reportData.netProfit)}</span></div></div>
                            </div>
                        </>
                    )}
                     {activeTab === 'balance-sheet' && (
                        <>
                            <h4 className="text-center text-xl font-bold text-white">Balance Sheet</h4>
                            <p className="text-center text-sm text-slate-400 mb-6">As of {formatTenderDate(endDate)}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h5 className="font-semibold text-lg text-blue-300 mb-2">Assets</h5>
                                    {Object.entries(reportData.assets).map(([name, amount]) => (<div key={name} className="flex justify-between py-2 border-b border-slate-700"><span className="text-slate-300">{name}</span><span className="font-mono text-slate-200">{formatCurrency(amount)}</span></div>))}
                                    <div className="flex justify-between py-2 mt-2 font-bold"><span className="text-slate-200">Total Assets</span><span className="font-mono text-blue-400">{formatCurrency(reportData.totalAssets)}</span></div>
                                </div>
                                 <div>
                                    <h5 className="font-semibold text-lg text-orange-300 mb-2">Liabilities & Equity</h5>
                                    {Object.entries(reportData.liabilities).map(([name, amount]) => (<div key={name} className="flex justify-between py-2 border-b border-slate-700"><span className="text-slate-300">{name}</span><span className="font-mono text-slate-200">{formatCurrency(amount)}</span></div>))}
                                    <div className="flex justify-between py-2 border-b border-slate-700"><span className="text-slate-300">Retained Earnings</span><span className="font-mono text-slate-200">{formatCurrency(reportData.retainedEarnings)}</span></div>
                                     <div className="flex justify-between py-2 border-b border-slate-700"><span className="text-slate-300">Net Profit (Current Period)</span><span className="font-mono text-slate-200">{formatCurrency(reportData.netProfit)}</span></div>
                                    <div className="flex justify-between py-2 mt-2 font-bold"><span className="text-slate-200">Total Liabilities & Equity</span><span className="font-mono text-orange-400">{formatCurrency(reportData.totalLiabilities + reportData.totalEquity)}</span></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountingHub;