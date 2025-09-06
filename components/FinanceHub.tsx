import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember, Invoice, Expense, WatchlistItem, Account } from '../types';
import { InvoiceStatus, AccountType } from '../types';
import { BanknotesIcon, PlusIcon, EditIcon, TrashIcon, ChartBarIcon, SearchIcon, BuildingLibraryIcon, TagIcon, BookOpenIcon, UsersGroupIcon } from './icons';
import ExpenseModal from './ExpenseModal';
import { formatTenderDate, formatCurrency } from '../utils';
import { BarChart, PieChart } from './charts';
import AccountingHub from './AccountingHub';
import GeneralJournal from './GeneralJournal';

type FinanceHubProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
  onSelectTender: (item: WatchlistItem) => void;
};

type FinanceTab = 'dashboard' | 'invoices' | 'expenses' | 'journal-entries' | 'reports' | 'accounts';

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700 flex items-start gap-4">
        <div className="p-3 rounded-full bg-slate-700/50">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);


const FinanceHub: React.FC<FinanceHubProps> = ({ store, onSelectTender }) => {
    const { watchlist, expenses, removeExpense, chartOfAccounts, addAccount, removeAccount } = store;
    const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [expenseSearch, setExpenseSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState<AccountType>(AccountType.EXPENSE);

    const allInvoices = useMemo(() => {
        return watchlist.flatMap(item => 
            (item.invoices || []).map(invoice => ({ ...invoice, tenderTitle: item.tender.title, tenderId: item.tender.id }))
        );
    }, [watchlist]);
    
    const financialStats = useMemo(() => {
        const totalRevenue = allInvoices
            .filter(inv => inv.status === InvoiceStatus.PAID)
            .reduce((sum, inv) => sum + inv.amount, 0);

        const outstandingRevenue = allInvoices
            .filter(inv => [InvoiceStatus.SENT, InvoiceStatus.OVERDUE].includes(inv.status))
            .reduce((sum, inv) => sum + inv.amount, 0);
            
        const totalExpenses = (expenses || []).reduce((sum, exp) => sum + exp.amount, 0);

        const netProfit = totalRevenue - totalExpenses;

        return { totalRevenue, outstandingRevenue, totalExpenses, netProfit };
    }, [allInvoices, expenses]);
    
    const chartData = useMemo(() => {
        const monthlyPerformance = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                revenue: 0,
                expenses: 0,
            };
        }).reverse();

        allInvoices.forEach(inv => {
            if (inv.status === InvoiceStatus.PAID) {
                const date = new Date(inv.issueDate + 'T00:00:00');
                const monthName = date.toLocaleString('default', { month: 'short' });
                const monthData = monthlyPerformance.find(m => m.name === monthName);
                if (monthData) monthData.revenue += inv.amount;
            }
        });

        (expenses || []).forEach(exp => {
            const date = new Date(exp.date + 'T00:00:00');
            const monthName = date.toLocaleString('default', { month: 'short' });
            const monthData = monthlyPerformance.find(m => m.name === monthName);
            if (monthData) monthData.expenses += exp.amount;
        });

        const expenseBreakdown = (expenses || []).reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);

        return { monthlyPerformance, expenseBreakdown };
    }, [allInvoices, expenses]);
    
    const handleInvoiceClick = (tenderId: string) => {
        const tender = store.watchlist.find(t => t.tender.id === tenderId);
        if (tender) {
            onSelectTender(tender);
        }
    };
    
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedFilteredInvoices = useMemo(() => {
        let items = allInvoices.filter(inv => inv.tenderTitle.toLowerCase().includes(invoiceSearch.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()));
        if (sortConfig !== null) {
            items.sort((a, b) => {
                if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [allInvoices, invoiceSearch, sortConfig]);

    const sortedFilteredExpenses = useMemo(() => {
        let items = (expenses || []).filter(exp => exp.description.toLowerCase().includes(expenseSearch.toLowerCase()) || exp.category.toLowerCase().includes(expenseSearch.toLowerCase()));
         if (sortConfig !== null) {
            items.sort((a, b) => {
                if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return items;
    }, [expenses, expenseSearch, sortConfig]);

    const handleAddAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAccountName.trim()) {
            addAccount({ name: newAccountName.trim(), type: newAccountType });
            setNewAccountName('');
        }
      };

    const TABS: { id: FinanceTab, label: string, icon: React.FC<any> }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
        { id: 'invoices', label: 'Invoices (A/R)', icon: BanknotesIcon },
        { id: 'expenses', label: 'Expenses (A/P)', icon: UsersGroupIcon },
        { id: 'journal-entries', label: 'Journal Entries', icon: BookOpenIcon },
        { id: 'reports', label: 'Accounting Reports', icon: BuildingLibraryIcon },
        { id: 'accounts', label: 'Chart of Accounts', icon: TagIcon },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <div className="border-b border-slate-700/50">
                    <nav className="flex space-x-2 -mb-px overflow-x-auto" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}>
                                <tab.icon className="w-5 h-5 mr-2"/>{tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                 {activeTab === 'expenses' && (
                    <button 
                        onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                        className="btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2"/> Add Expense
                    </button>
                 )}
            </div>
            
            {activeTab === 'dashboard' && (
                <div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Revenue (Paid)" value={formatCurrency(financialStats.totalRevenue)} icon={<BanknotesIcon className="w-6 h-6 text-green-400" />} />
                        <StatCard title="Outstanding Invoices" value={formatCurrency(financialStats.outstandingRevenue)} icon={<BanknotesIcon className="w-6 h-6 text-yellow-400" />} />
                        <StatCard title="Total Expenses" value={formatCurrency(financialStats.totalExpenses)} icon={<UsersGroupIcon className="w-6 h-6 text-red-400" />} />
                        <StatCard title="Net Profit" value={formatCurrency(financialStats.netProfit)} icon={<ChartBarIcon className="w-6 h-6 text-indigo-400" />} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-slate-800/80 p-5 rounded-lg border border-slate-700">
                           <h3 className="font-semibold text-white mb-4">Monthly Performance (Last 6 Months)</h3>
                           <BarChart data={chartData.monthlyPerformance} />
                        </div>
                        <div className="lg:col-span-2 bg-slate-800/80 p-5 rounded-lg border border-slate-700">
                            <h3 className="font-semibold text-white mb-4">Expense Breakdown</h3>
                            <PieChart data={chartData.expenseBreakdown} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                 <div>
                    {allInvoices.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                            <BanknotesIcon className="mx-auto w-12 h-12 text-slate-500" />
                            <h3 className="text-xl font-medium text-white mt-4">No Invoices Found</h3>
                            <p className="text-slate-400 mt-2">Create invoices from within a tender's workspace.</p>
                        </div>
                    ) : (
                        <>
                        <div className="relative mb-4">
                            <input type="text" placeholder="Search invoices..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="input-style pl-10" />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <div className="bg-slate-800/80 rounded-lg border border-slate-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('invoiceNumber')}>Invoice #</th>
                                        <th className="th-style">Tender</th>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('amount')}>Amount</th>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('status')}>Status</th>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('dueDate')}>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {sortedFilteredInvoices.map(invoice => (
                                        <tr key={invoice.id} className="hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => handleInvoiceClick(invoice.tenderId)}>
                                            <td className="td-style font-medium text-slate-100">{invoice.invoiceNumber}</td>
                                            <td className="td-style truncate max-w-xs" title={invoice.tenderTitle}>{invoice.tenderTitle}</td>
                                            <td className="td-style">{formatCurrency(invoice.amount)}</td>
                                            <td className="td-style">{invoice.status}</td>
                                            <td className="td-style">{formatTenderDate(invoice.dueDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}
                </div>
            )}
            
            {activeTab === 'expenses' && (
                 <div>
                    {expenses.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                            <BanknotesIcon className="mx-auto w-12 h-12 text-slate-500" />
                            <h3 className="text-xl font-medium text-white mt-4">No Expenses Logged</h3>
                            <p className="text-slate-400 mt-2">Add your first business expense to start tracking.</p>
                        </div>
                    ) : (
                        <>
                        <div className="relative mb-4">
                            <input type="text" placeholder="Search expenses..." value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} className="input-style pl-10" />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <div className="bg-slate-800/80 rounded-lg border border-slate-700 overflow-hidden">
                             <table className="w-full text-left">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('date')}>Date</th>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('category')}>Category</th>
                                        <th className="th-style">Description</th>
                                        <th className="th-style cursor-pointer" onClick={() => requestSort('amount')}>Amount</th>
                                        <th className="th-style"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {sortedFilteredExpenses.map(expense => (
                                        <tr key={expense.id} className="hover:bg-slate-800 transition-colors">
                                            <td className="td-style">{formatTenderDate(expense.date)}</td>
                                            <td className="td-style font-medium text-slate-100">{expense.category}</td>
                                            <td className="td-style">{expense.description}</td>
                                            <td className="td-style">{formatCurrency(expense.amount)}</td>
                                            <td className="td-style text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setEditingExpense(expense); setIsExpenseModalOpen(true); }} className="btn-icon"><EditIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => window.confirm('Delete this expense?') && removeExpense(expense.id)} className="btn-icon-danger"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'journal-entries' && <GeneralJournal store={store} />}
            
            {activeTab === 'reports' && <AccountingHub store={store} />}

            {activeTab === 'accounts' && (
                 <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white">Chart of Accounts</h2>
                    <p className="text-sm text-slate-400 mb-4">Define your revenue and expense accounts for accurate reporting.</p>
                    <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 items-end">
                        <div className="col-span-1 sm:col-span-2">
                            <label className="text-xs font-medium text-slate-400">Account Name</label>
                            <input type="text" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="e.g., Software Licensing" className="input-style" required/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400">Type</label>
                            <select value={newAccountType} onChange={e => setNewAccountType(e.target.value as AccountType)} className="input-style">
                                {Object.values(AccountType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="col-span-1 sm:col-span-3 btn-secondary mt-2">
                            <PlusIcon className="w-5 h-5 mr-2" /> Add Account
                        </button>
                    </form>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {chartOfAccounts.map((acc: Account) => (
                            <div key={acc.id} className="flex items-center justify-between bg-slate-700/60 p-2 rounded-md">
                                <div>
                                    <span className="text-sm text-slate-300">{acc.name}</span>
                                    <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${acc.type === AccountType.REVENUE ? 'bg-green-500/20 text-green-300' : acc.type === AccountType.EXPENSE ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{acc.type}</span>
                                </div>
                                <button onClick={() => window.confirm('Are you sure you want to delete this account?') && removeAccount(acc.id)} className="btn-icon-danger" aria-label={`Remove ${acc.name}`}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ExpenseModal 
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                store={store}
                expenseToEdit={editingExpense}
            />
        </div>
    );
};

export default FinanceHub;