import React, { useMemo, useState } from 'react';
import type { WatchlistItem, TeamMember } from '../../types';
import { InvoiceStatus, TenderStatus } from '../../types';
import type { useTenderStore } from '../../hooks/useTenderStore';
import { formatCurrency, formatTenderDate, getRemainingDaysInfo, calculateRemainingDays } from '../../utils';
import { TeamMemberRole } from '../../types';
import { SparklesIcon, EditIcon, SaveIcon, CancelIcon, PencilSquareIcon, ClipboardListIcon, UsersGroupIcon, BuildingOfficeIcon } from '../icons';

type OverviewSectionProps = { 
    tender: WatchlistItem; 
    store: ReturnType<typeof useTenderStore>; 
    currentUser: TeamMember 
};

const StatCard: React.FC<{ title: string, value: string | number, subtext?: string, color: string }> = ({ title, value, subtext, color }) => (
    <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
);

const OverviewSection: React.FC<OverviewSectionProps> = ({ tender, store, currentUser }) => {
    const { updateNotes, updateWatchlistStatus, assignTenderToMember, teamMembers, shipments, assignTenderToClient, clients, generateAISummary, updateTenderCategory } = store;
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState(tender.category || '');

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        setSummaryError(null);
        try {
            await generateAISummary(tender.tender.id);
        } catch (e: any) {
            setSummaryError(e.message || 'Failed to generate summary.');
        } finally {
            setIsSummaryLoading(false);
        }
    };
    
    const handleCategorySave = () => {
        if (newCategory.trim()) {
            updateTenderCategory(tender.tender.id, newCategory.trim());
        }
        setIsEditingCategory(false);
    };

    const subtotal = tender.quoteItems?.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) || 0;
    const delivery = tender.financialDetails?.deliveryCost ?? 0;
    const installation = tender.financialDetails?.installationCost ?? 0;
    const vat = subtotal * ((tender.financialDetails?.vatPercentage ?? 0) / 100);
    const quoteTotal = subtotal + delivery + installation + vat;

    const stats = useMemo(() => {
        const totalInvoiced = tender.invoices?.reduce((acc, inv) => acc + inv.amount, 0) || 0;
        const paidInvoices = tender.invoices?.filter(inv => inv.status === InvoiceStatus.PAID).reduce((acc, inv) => acc + inv.amount, 0) || 0;
        const tenderShipments = shipments.filter(s => s.tenderId === tender.tender.id);
        
        return {
            quote: { total: quoteTotal, items: tender.quoteItems?.length || 0 },
            invoices: { total: totalInvoiced, paid: paidInvoices },
            shipments: { total: tenderShipments.length }
        };
    }, [tender, quoteTotal, shipments]);

    const remainingDays = calculateRemainingDays(tender.tender.closingDate);
    const remainingDaysInfo = getRemainingDaysInfo(remainingDays);

    const canManage = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Status" value={tender.status} color="text-blue-400" />
                <StatCard title="Quote Total" value={formatCurrency(stats.quote.total)} subtext={`${stats.quote.items} items`} color="text-green-400" />
                <StatCard title="Invoiced" value={formatCurrency(stats.invoices.total)} subtext={`${formatCurrency(stats.invoices.paid)} paid`} color="text-yellow-400" />
                <StatCard title="Closing In" value={remainingDaysInfo.text} subtext={formatTenderDate(tender.tender.closingDate)} color={remainingDaysInfo.textColor.replace('text-', 'text-')} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-white p-4 border-b border-slate-700 flex items-center gap-3"><PencilSquareIcon className="w-5 h-5 text-slate-400"/>Notes</h3>
                         <div className="p-4">
                            <textarea
                                value={tender.notes || ''}
                                onChange={(e) => updateNotes(tender.tender.id, e.target.value)}
                                placeholder="Add any relevant notes, contact info, or reminders here..."
                                className="input-style w-full min-h-[160px] bg-slate-800/60"
                            />
                         </div>
                     </div>
                     <div className="bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-white p-4 border-b border-slate-700 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-purple-400"/>AI Summary</h3>
                        <div className="p-4 min-h-[120px]">
                            {isSummaryLoading ? (
                                <div className="flex items-center text-slate-400">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Generating...</span>
                                </div>
                            ) : summaryError ? (
                                <p className="text-red-400">{summaryError}</p>
                            ) : tender.aiSummary ? (
                                <div className="prose prose-sm prose-invert max-w-none text-slate-300 whitespace-pre-wrap">{tender.aiSummary}</div>
                            ) : (
                                <p className="text-slate-400 text-sm">No summary generated yet.</p>
                            )}
                            <div className="mt-4">
                                <button
                                    onClick={handleGenerateSummary}
                                    disabled={isSummaryLoading || !tender.tender.link}
                                    className="btn-secondary text-sm disabled:opacity-50"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                    {tender.aiSummary ? 'Regenerate from Live Page' : 'Generate from Live Page'}
                                </button>
                                {!tender.tender.link && <p className="text-xs text-slate-500 mt-1">Tender has no link to summarize.</p>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-white p-4 border-b border-slate-700 flex items-center gap-3"><ClipboardListIcon className="w-5 h-5 text-slate-400"/>Management</h3>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                                {isEditingCategory ? (
                                    <div className="flex gap-2">
                                        <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-style w-full"/>
                                        <button onClick={handleCategorySave} className="btn-icon hover:bg-green-500/20"><SaveIcon className="w-4 h-4 text-green-400"/></button>
                                        <button onClick={() => setIsEditingCategory(false)} className="btn-icon hover:bg-yellow-500/20"><CancelIcon className="w-4 h-4 text-yellow-400"/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-md">
                                        <span className="text-slate-200">{tender.category}</span>
                                        <button onClick={() => setIsEditingCategory(true)} className="btn-icon"><EditIcon className="w-4 h-4 text-slate-400"/></button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Tender Status</label>
                                <select 
                                    value={tender.status}
                                    onChange={(e) => updateWatchlistStatus(tender.tender.id, e.target.value as TenderStatus)}
                                    className="input-style w-full"
                                    disabled={!canManage}
                                >
                                    {Object.values(TenderStatus).map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Assigned To</label>
                                <select 
                                    value={tender.assignedTeamMemberId || ''}
                                    onChange={(e) => assignTenderToMember(tender.tender.id, e.target.value || null, currentUser.name)}
                                    className="input-style w-full"
                                    disabled={!canManage}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {teamMembers.map(member => (
                                        <option key={member.id} value={member.id}>{member.name}</option>
                                    ))}
                                </select>
                            </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Client</label>
                                <select 
                                    value={tender.financialDetails?.clientId || ''}
                                    onChange={(e) => assignTenderToClient(tender.tender.id, e.target.value || null)}
                                    className="input-style w-full"
                                >
                                    <option value="">-- No Client --</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewSection;