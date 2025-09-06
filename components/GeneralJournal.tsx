import React, { useState, useMemo, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { JournalEntry, JournalEntryTransaction } from '../types';
import { PlusIcon, TrashIcon, BookOpenIcon, EditIcon } from './icons';
import { formatTenderDate, formatCurrency } from '../utils';

type GeneralJournalProps = {
  store: ReturnType<typeof useTenderStore>;
};

const emptyEntryData: Omit<JournalEntry, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    transactions: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]
};

const GeneralJournal: React.FC<GeneralJournalProps> = ({ store }) => {
    const { journalEntries, addJournalEntry, updateJournalEntry, removeJournalEntry, chartOfAccounts } = store;
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [formData, setFormData] = useState<Omit<JournalEntry, 'id'>>(emptyEntryData);

    const accountMap = useMemo(() => chartOfAccounts.reduce((acc, accnt) => {
        acc[accnt.id] = accnt.name;
        return acc;
    }, {} as Record<string, string>), [chartOfAccounts]);

    useEffect(() => {
        if (editingEntry) {
            setFormData({
                date: editingEntry.date.substring(0, 10),
                description: editingEntry.description,
                transactions: editingEntry.transactions,
            });
            setIsFormVisible(true);
        } else {
            setFormData(emptyEntryData);
        }
    }, [editingEntry]);

    const handleTransactionChange = (index: number, field: keyof JournalEntryTransaction, value: string | number) => {
        const updatedTransactions = [...formData.transactions];
        const transactionToUpdate = { ...updatedTransactions[index] };

        if (field === 'accountId' && typeof value === 'string') {
            transactionToUpdate.accountId = value;
        } else if (field === 'debit' && typeof value === 'number') {
            transactionToUpdate.debit = value;
            if (value > 0) transactionToUpdate.credit = 0;
        } else if (field === 'credit' && typeof value === 'number') {
            transactionToUpdate.credit = value;
            if (value > 0) transactionToUpdate.debit = 0;
        }

        updatedTransactions[index] = transactionToUpdate;
        setFormData(prev => ({ ...prev, transactions: updatedTransactions }));
    };

    const addTransactionRow = () => {
        setFormData(prev => ({ ...prev, transactions: [...prev.transactions, { accountId: '', debit: 0, credit: 0 }] }));
    };

    const removeTransactionRow = (index: number) => {
        const filtered = formData.transactions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, transactions: filtered }));
    };

    const totals = useMemo(() => {
        return formData.transactions.reduce((acc, t) => {
            acc.debits += t.debit;
            acc.credits += t.credit;
            return acc;
        }, { debits: 0, credits: 0 });
    }, [formData.transactions]);

    const isBalanced = totals.debits > 0 && Math.abs(totals.debits - totals.credits) < 0.001;

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingEntry(null);
    };

    const handleEdit = (entry: JournalEntry) => {
        setEditingEntry(entry);
    };

    const handleNewEntryClick = () => {
        setEditingEntry(null);
        setIsFormVisible(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isBalanced) {
            if (editingEntry) {
                updateJournalEntry(editingEntry.id, { ...formData, id: editingEntry.id });
            } else {
                addJournalEntry(formData);
            }
            handleCancel();
        } else {
            alert('Journal entry must be balanced (total debits must equal total credits) and not be zero.');
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">General Journal</h2>
                <button onClick={isFormVisible ? handleCancel : handleNewEntryClick} className="btn-secondary text-sm">
                    {isFormVisible ? 'Cancel' : <><PlusIcon className="w-4 h-4 mr-2"/>New Entry</>}
                </button>
            </div>

            {isFormVisible && (
                <form onSubmit={handleSubmit} className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="label-style">Date</label>
                            <input type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} className="input-style"/>
                        </div>
                         <div className="sm:col-span-2">
                            <label className="label-style">Description</label>
                            <input type="text" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="input-style"/>
                        </div>
                    </div>
                    {/* Transactions */}
                    <div className="space-y-2">
                        {formData.transactions.map((t, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                <select value={t.accountId} onChange={e => handleTransactionChange(i, 'accountId', e.target.value)} className="input-style col-span-5 text-sm">
                                    <option value="">-- Select Account --</option>
                                    {chartOfAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                                <input type="number" placeholder="Debit" value={t.debit || ''} onChange={e => handleTransactionChange(i, 'debit', e.target.valueAsNumber || 0)} className="input-style col-span-3 text-sm"/>
                                <input type="number" placeholder="Credit" value={t.credit || ''} onChange={e => handleTransactionChange(i, 'credit', e.target.valueAsNumber || 0)} className="input-style col-span-3 text-sm"/>
                                <button type="button" onClick={() => removeTransactionRow(i)} className="btn-icon-danger col-span-1"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addTransactionRow} className="text-sm text-blue-400 hover:underline mt-2">Add Row</button>

                    <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                        <div className="text-sm">
                            <span className="mr-4">Debits: {formatCurrency(totals.debits)}</span>
                            <span className="mr-4">Credits: {formatCurrency(totals.credits)}</span>
                            <span className={`font-bold ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>{isBalanced ? 'Balanced' : 'Unbalanced'}</span>
                        </div>
                        <button type="submit" disabled={!isBalanced} className="btn-primary disabled:opacity-50">
                            {editingEntry ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            )}

            {journalEntries.length === 0 ? (
                 <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                    <BookOpenIcon className="mx-auto w-12 h-12 text-slate-500" />
                    <h3 className="text-xl font-medium text-white mt-4">Journal is Empty</h3>
                    <p className="text-slate-400 mt-2">Create a new entry or perform financial actions to see transactions here.</p>
                </div>
            ) : (
                <div className="bg-slate-800/80 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="th-style w-1/6">Date</th>
                                <th className="th-style w-2/6">Description</th>
                                <th className="th-style w-2/6">Account</th>
                                <th className="th-style w-1/6 text-right">Debit</th>
                                <th className="th-style w-1/6 text-right">Credit</th>
                                <th className="th-style w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                        {journalEntries.map(entry => (
                            <React.Fragment key={entry.id}>
                                <tr className="bg-slate-800/50">
                                    <td className="td-style font-semibold text-slate-100">{formatTenderDate(entry.date)}</td>
                                    <td className="td-style font-semibold text-slate-100 col-span-4" colSpan={4}>{entry.description}</td>
                                    <td className="td-style text-right">
                                        <button onClick={() => handleEdit(entry)} className="btn-icon"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => window.confirm('Delete this entry?') && removeJournalEntry(entry.id)} className="btn-icon-danger"><TrashIcon className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                                {entry.transactions.map((t, i) => (
                                     <tr key={`${entry.id}-${i}`} className="hover:bg-slate-800">
                                        <td className="td-style"></td>
                                        <td className="td-style"></td>
                                        <td className={`td-style ${t.debit > 0 ? 'pl-8' : 'pl-12'}`}>{accountMap[t.accountId] || 'N/A'}</td>
                                        <td className="td-style text-right font-mono">{t.debit > 0 ? formatCurrency(t.debit) : ''}</td>
                                        <td className="td-style text-right font-mono">{t.credit > 0 ? formatCurrency(t.credit) : ''}</td>
                                        <td className="td-style"></td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GeneralJournal;