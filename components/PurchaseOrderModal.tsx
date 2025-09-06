import React, { useState, useEffect, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem, PurchaseOrder, POItem, QuoteItem } from '../types';
import { POStatus } from '../types';

type PurchaseOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  tender: WatchlistItem;
  poToEdit: PurchaseOrder | null;
};

const emptyPO: Omit<PurchaseOrder, 'id'> = {
    poNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    vendorId: '',
    status: POStatus.DRAFT,
    items: [],
};

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ isOpen, onClose, store, tender, poToEdit }) => {
  const [po, setPo] = useState(emptyPO);
  const [selectedQuoteItems, setSelectedQuoteItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
        if (poToEdit) {
            setPo(poToEdit);
            setSelectedQuoteItems(new Set(poToEdit.items.map(item => item.quoteItemRef)));
        } else {
            setPo(emptyPO);
            setSelectedQuoteItems(new Set());
        }
    }
  }, [isOpen, poToEdit]);

  const availableQuoteItems = useMemo(() => {
    const poItemRefs = po.items.map(item => item.quoteItemRef);
    return tender.quoteItems?.filter(qItem => !poItemRefs.includes(qItem.id) || selectedQuoteItems.has(qItem.id)) || [];
  }, [tender.quoteItems, po.items, selectedQuoteItems]);


  const handleChange = (field: keyof Omit<PurchaseOrder, 'id' | 'items'>, value: string) => {
    setPo(prev => ({ ...prev, [field]: value }));
  };
  
  const handleItemToggle = (quoteItem: QuoteItem) => {
    const newSelected = new Set(selectedQuoteItems);
    let newPoItems = [...po.items];

    if (newSelected.has(quoteItem.id)) {
        newSelected.delete(quoteItem.id);
        newPoItems = newPoItems.filter(item => item.quoteItemRef !== quoteItem.id);
    } else {
        newSelected.add(quoteItem.id);
        const newPoItem: POItem = {
            id: crypto.randomUUID(),
            description: quoteItem.itemName || quoteItem.description,
            uom: quoteItem.uom,
            quantity: quoteItem.quantity,
            unitPrice: quoteItem.cost || quoteItem.unitPrice,
            quoteItemRef: quoteItem.id,
            hsnCode: quoteItem.hsnCode,
        };
        newPoItems.push(newPoItem);
    }
    setSelectedQuoteItems(newSelected);
    setPo(prev => ({ ...prev, items: newPoItems }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (po.poNumber && po.vendorId && po.items.length > 0) {
        if (poToEdit) {
            store.updatePurchaseOrder(tender.tender.id, po as PurchaseOrder);
        } else {
            store.addPurchaseOrder(tender.tender.id, po);
        }
        onClose();
    } else {
        alert('Please fill in PO Number, select a vendor, and add at least one item.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-slate-700 flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
            <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold text-white">{poToEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
                <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
                    <div><label className="label-style">PO Number</label><input type="text" value={po.poNumber} onChange={e => handleChange('poNumber', e.target.value)} required className="input-style"/></div>
                    <div><label className="label-style">Issue Date</label><input type="date" value={po.issueDate} onChange={e => handleChange('issueDate', e.target.value)} required className="input-style"/></div>
                    <div><label className="label-style">Vendor</label><select value={po.vendorId} onChange={e => handleChange('vendorId', e.target.value)} required className="input-style"><option value="">-- Select a Vendor --</option>{store.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                </div>
                
                <div className="px-6 pb-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-white mb-2">Select Items from Quote</h3>
                </div>

                <div className="flex-grow overflow-y-auto px-6">
                    <div className="space-y-2">
                         {availableQuoteItems.map(qItem => (
                            <div key={qItem.id} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md">
                                <input type="checkbox" checked={selectedQuoteItems.has(qItem.id)} onChange={() => handleItemToggle(qItem)} className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600 cursor-pointer"/>
                                <div className="flex-grow grid grid-cols-4 gap-2 text-sm">
                                    <span className="col-span-2 text-slate-200">{qItem.itemName || qItem.description}</span>
                                    <span className="text-slate-400">Qty: {qItem.quantity}</span>
                                    <span className="text-slate-400">@ ${qItem.cost?.toFixed(2) || qItem.unitPrice.toFixed(2)}</span>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>

                <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800 flex-shrink-0">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Purchase Order</button>
                </footer>
            </form>
        </div>
    </div>
  );
};

export default PurchaseOrderModal;