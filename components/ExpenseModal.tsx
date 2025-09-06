import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { TenderStatus, type Expense, AccountType } from '../types';

type ExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  expenseToEdit: Expense | null;
};

const emptyExpense: Omit<Expense, 'id'> = {
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    tenderId: undefined,
};

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, store, expenseToEdit }) => {
  const [expense, setExpense] = useState(emptyExpense);
  const { chartOfAccounts, watchlist } = store;

  useEffect(() => {
    if (isOpen) {
      setExpense(expenseToEdit ? { ...expenseToEdit } : emptyExpense);
    }
  }, [isOpen, expenseToEdit]);

  const handleChange = (field: keyof Omit<Expense, 'id'>, value: string | number | undefined) => {
    setExpense(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expense.category) {
        alert("Please select an expense category.");
        return;
    }

    if (expenseToEdit) {
      store.updateExpense(expenseToEdit.id, expense as Expense);
    } else {
      store.addExpense(expense);
    }
    onClose();
  };

  if (!isOpen) return null;

  const expenseAccounts = chartOfAccounts.filter(acc => acc.type === AccountType.EXPENSE);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label className="label-style">Category</label>
                <select 
                    value={expense.category} 
                    onChange={e => handleChange('category', e.target.value)} 
                    required 
                    className="input-style"
                >
                    <option value="">-- Select an Expense Account --</option>
                    {expenseAccounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                </select>
            </div>
            <div><label className="label-style">Description</label><input type="text" value={expense.description} onChange={e => handleChange('description', e.target.value)} required className="input-style"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Amount (USD)</label><input type="number" value={expense.amount} onChange={e => handleChange('amount', Number(e.target.value))} min="0" step="0.01" required className="input-style"/></div>
                <div><label className="label-style">Date</label><input type="date" value={expense.date} onChange={e => handleChange('date', e.target.value)} required className="input-style"/></div>
            </div>
            <div>
                <label className="label-style">Link to Tender (Optional)</label>
                <select 
                    value={expense.tenderId || ''}
                    onChange={e => handleChange('tenderId', e.target.value || undefined)}
                    className="input-style"
                >
                    <option value="">-- No specific tender --</option>
                    {watchlist.filter(t => t.status === TenderStatus.WON).map(item => (
                        <option key={item.tender.id} value={item.tender.id}>{item.tender.title}</option>
                    ))}
                </select>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Expense</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;