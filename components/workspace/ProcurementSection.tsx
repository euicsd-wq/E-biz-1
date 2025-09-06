import React, { useState } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, PurchaseOrder } from '../../types';
import { POStatus, TenderStatus, DocumentType, DocumentCategory } from '../../types';
import { PlusIcon, TrashIcon, EditIcon, DocumentDownloadIcon } from '../icons';
import PurchaseOrderModal from '../PurchaseOrderModal';
import { formatCurrency, formatTenderDate } from '../../utils';
import { generatePdf } from '../../services/pdfService';

type ProcurementSectionProps = {
    tender: WatchlistItem;
    store: ReturnType<typeof useTenderStore>
};

const ProcurementSection: React.FC<ProcurementSectionProps> = ({ tender, store }) => {
    const [isPoModalOpen, setIsPoModalOpen] = useState(false);
    const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

    const { removePurchaseOrder, vendors, addDocument, companyProfile, clients, documentSettings } = store;

    if (tender.status !== TenderStatus.WON) {
        return <p className="text-center text-slate-400 py-8">Procurement can be managed after the tender is marked as 'Won'.</p>
    }

    const vendorMap = vendors.reduce((acc, v) => ({ ...acc, [v.id]: v }), {} as Record<string, any>);
    
    const handlePrintPO = async (po: PurchaseOrder) => {
        try {
            const docToSave = await generatePdf(DocumentType.PURCHASE_ORDER, tender, companyProfile, clients, documentSettings, po, vendors);
            if (docToSave) {
                 addDocument(tender.tender.id, docToSave, DocumentCategory.PURCHASE_ORDER, 'System', true);
                 store.addToast(`${docToSave.name} generated and saved to Documents.`, 'success');
            }
        } catch (error) {
            console.error("PO PDF generation failed", error);
            store.addToast(`Failed to generate PO PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Purchase Orders</h2>
                <button onClick={() => { setEditingPo(null); setIsPoModalOpen(true); }} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2" />Create PO</button>
            </div>
            {tender.purchaseOrders && tender.purchaseOrders.length > 0 ? (
                <div className="space-y-4">
                    {tender.purchaseOrders.map(po => {
                         const total = po.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                         const vendorName = vendorMap[po.vendorId]?.name || 'Unknown Vendor';
                         return (
                            <div key={po.id} className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <p className="font-bold text-white">{po.poNumber}</p>
                                    <p className="text-sm text-slate-400">{vendorName}</p>
                                    <p className="text-xs text-slate-500 mt-1">Issued: {formatTenderDate(po.issueDate)}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                                    <div className="flex flex-col sm:text-right">
                                        <p className="text-lg font-mono font-semibold text-blue-400">{formatCurrency(total)}</p>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full self-start sm:self-end mt-1 ${po.status === POStatus.ISSUED ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-600/50 text-slate-300'}`}>
                                            {po.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handlePrintPO(po)} className="btn-icon" title="Print PO"><DocumentDownloadIcon className="w-5 h-5" /></button>
                                        <button onClick={() => { setEditingPo(po); setIsPoModalOpen(true); }} className="btn-icon" title="Edit PO"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => removePurchaseOrder(tender.tender.id, po.id)} className="btn-icon-danger" title="Delete PO"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                         );
                    })}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">No purchase orders created for this tender yet.</p>
            )}

            <PurchaseOrderModal isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} store={store} tender={tender} poToEdit={editingPo} />
        </div>
    );
};

export default ProcurementSection;