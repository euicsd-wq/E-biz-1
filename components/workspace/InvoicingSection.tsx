import React, { useState } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, Invoice } from '../../types';
import { InvoiceStatus, TenderStatus, DocumentType, DocumentCategory } from '../../types';
import { PlusIcon, TrashIcon, EditIcon, DocumentDownloadIcon } from '../icons';
import InvoiceModal from '../InvoiceModal';
import { formatCurrency, formatTenderDate } from '../../utils';
import { generatePdf } from '../../services/pdfService';

type InvoicingSectionProps = { 
    tender: WatchlistItem; 
    store: ReturnType<typeof useTenderStore>
};

const InvoicingSection: React.FC<InvoicingSectionProps> = ({ tender, store }) => {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    const { createInvoiceFromQuote, removeInvoice, addDocument, companyProfile, clients, documentSettings } = store;

    if (tender.status !== TenderStatus.WON && tender.status !== TenderStatus.SUBMITTED && tender.status !== TenderStatus.APPLYING) {
        return <p className="text-center text-slate-400 py-8">Invoices can be managed once the tender is in progress or won.</p>
    }
    
    const getStatusStyles = (status: InvoiceStatus) => {
        switch(status) {
            case InvoiceStatus.PAID: return 'bg-green-500/30 text-green-200';
            case InvoiceStatus.OVERDUE: return 'bg-red-500/30 text-red-200';
            case InvoiceStatus.SENT: return 'bg-blue-500/30 text-blue-200';
            case InvoiceStatus.DRAFT:
            default: return 'bg-slate-600/50 text-slate-300';
        }
    };

    const handlePrintInvoice = async (invoice: Invoice) => {
        // Create a temporary WatchlistItem with just this one invoice for the PDF service
        const singleInvoiceTender = { ...tender, invoices: [invoice] };
        try {
            const docToSave = await generatePdf(DocumentType.COMMERCIAL_INVOICE, singleInvoiceTender, companyProfile, clients, documentSettings);
             if (docToSave) {
                 addDocument(tender.tender.id, docToSave, DocumentCategory.GENERATED, 'System', true);
                 store.addToast(`${docToSave.name} generated and saved to Documents.`, 'success');
            }
        } catch (error) {
             console.error("Invoice PDF generation failed", error);
             store.addToast(`Failed to generate Invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Invoices</h2>
                <div className="flex gap-2">
                    <button onClick={() => createInvoiceFromQuote(tender.tender.id)} className="btn-secondary text-sm">Create from Quote</button>
                    <button onClick={() => { setEditingInvoice(null); setIsInvoiceModalOpen(true); }} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2"/>New Invoice</button>
                </div>
            </div>

            {tender.invoices && tender.invoices.length > 0 ? (
                <div className="space-y-4">
                     {tender.invoices.map(invoice => (
                        <div key={invoice.id} className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <p className="font-bold text-white">{invoice.invoiceNumber}</p>
                                <p className="text-sm text-slate-400">{invoice.description}</p>
                                <p className="text-xs text-slate-500 mt-1">Due: {formatTenderDate(invoice.dueDate)}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                                <div className="flex flex-col sm:text-right">
                                    <p className="text-lg font-mono font-semibold text-blue-400">{formatCurrency(invoice.amount)}</p>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full self-start sm:self-end mt-1 ${getStatusStyles(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handlePrintInvoice(invoice)} className="btn-icon" title="Print Invoice"><DocumentDownloadIcon className="w-5 h-5"/></button>
                                    <button onClick={() => { setEditingInvoice(invoice); setIsInvoiceModalOpen(true); }} className="btn-icon" title="Edit Invoice"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => removeInvoice(tender.tender.id, invoice.id)} className="btn-icon-danger" title="Delete Invoice"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">No invoices created for this tender yet.</p>
            )}
            
            <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} store={store} tenderId={tender.tender.id} invoiceToEdit={editingInvoice} />
        </div>
    );
};

export default InvoicingSection;