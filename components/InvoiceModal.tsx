import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';

type InvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  tenderId: string;
  invoiceToEdit: Invoice | null;
};

const emptyInvoice: Omit<Invoice, 'id'> = {
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    description: '',
    amount: 0,
    status: InvoiceStatus.DRAFT,
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, store, tenderId, invoiceToEdit }) => {
  const [invoice, setInvoice] = useState(emptyInvoice);

  useEffect(() => {
    if (isOpen) {
        setInvoice(invoiceToEdit ? { ...invoiceToEdit } : { ...emptyInvoice, invoiceNumber: `INV-${Date.now().toString().slice(-6)}` });
    }
  }, [isOpen, invoiceToEdit]);

  const handleChange = (field: keyof Omit<Invoice, 'id'>, value: string | number) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoice.invoiceNumber && invoice.amount > 0) {
        if (invoiceToEdit) {
            store.updateInvoice(tenderId, invoiceToEdit.id, invoice as Invoice);
        } else {
            store.addInvoice(tenderId, invoice);
        }
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{invoiceToEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Invoice #</label><input type="text" value={invoice.invoiceNumber} onChange={e => handleChange('invoiceNumber', e.target.value)} required className="input-style"/></div>
                <div><label className="label-style">Amount</label><input type="number" value={invoice.amount} onChange={e => handleChange('amount', Number(e.target.value))} required min="0.01" step="0.01" className="input-style"/></div>
            </div>
            <div><label className="label-style">Description</label><input type="text" value={invoice.description} onChange={e => handleChange('description', e.target.value)} required className="input-style"/></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Issue Date</label><input type="date" value={invoice.issueDate} onChange={e => handleChange('issueDate', e.target.value)} required className="input-style"/></div>
                <div><label className="label-style">Due Date</label><input type="date" value={invoice.dueDate} onChange={e => handleChange('dueDate', e.target.value)} required className="input-style"/></div>
            </div>
            <div>
                <label className="label-style">Status</label>
                <select value={invoice.status} onChange={e => handleChange('status', e.target.value)} className="input-style">
                    {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Invoice</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;