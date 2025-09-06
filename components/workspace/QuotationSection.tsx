import React, { useState, useEffect, useRef } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, QuoteItem, FinancialDetails, Client } from '../../types';
import { DocumentType, DocumentCategory } from '../../types';
import { PlusIcon, TrashIcon, BookOpenIcon, DocumentDownloadIcon, SaveIcon } from '../icons';
import CatalogPickerModal from '../CatalogPickerModal';
import { formatCurrency } from '../../utils';
import { generatePdf } from '../../services/pdfService';


type QuotationSectionProps = {
    tender: WatchlistItem;
    store: ReturnType<typeof useTenderStore>;
};

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <details className="bg-slate-900/50 rounded-lg border border-slate-700" open>
        <summary className="px-4 py-3 font-semibold text-white cursor-pointer hover:bg-slate-800/50 rounded-t-lg">{title}</summary>
        <div className="p-4 border-t border-slate-700">{children}</div>
    </details>
);

const QuotationSection: React.FC<QuotationSectionProps> = ({ tender, store }) => {
    const { updateFinancialDetails, addQuoteItem, updateQuoteItem, removeQuoteItem, addMultipleQuoteItems, catalog, vendors, clients, assignTenderToClient, addClient, addDocument, companyProfile, documentSettings } = store;
    const { financialDetails = {}, quoteItems = [] } = tender;

    const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
    const [manualClient, setManualClient] = useState<Omit<Client, 'id'>>({ name: '', address: '', email: '', phone: '', contactPerson: '' });
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const generateBtnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (generateBtnRef.current && !generateBtnRef.current.contains(event.target as Node)) {
                setIsGenerateOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleGeneratePdf = async (type: DocumentType) => {
        setIsGenerateOpen(false);
        try {
            const docToSave = await generatePdf(type, tender, companyProfile, clients, documentSettings);
            if (docToSave) {
                 addDocument(tender.tender.id, docToSave, DocumentCategory.GENERATED, 'System', true);
                 store.addToast(`${docToSave.name} generated and saved to Documents.`, 'success');
            }
        } catch (error) {
             console.error("PDF generation failed", error);
             store.addToast(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };


    useEffect(() => {
        if (!financialDetails.quoteNumber) {
            const suggestedQuoteNumber = `QUO-${tender.tender.id.slice(-4)}-${new Date().getFullYear()}`;
            updateFinancialDetails(tender.tender.id, { quoteNumber: suggestedQuoteNumber });
        }
    }, [financialDetails.quoteNumber, tender.tender.id, updateFinancialDetails]);
    
    const handleDetailChange = (field: keyof FinancialDetails, value: string | number) => {
        updateFinancialDetails(tender.tender.id, { [field]: value });
    };

    const handleAddFromCatalog = (newQuoteItems: Omit<QuoteItem, "id">[]) => {
        addMultipleQuoteItems(tender.tender.id, newQuoteItems);
        setIsCatalogPickerOpen(false);
    };
    
    const handleNewItem = () => {
        const newItem: Omit<QuoteItem, 'id'> = { itemName: '', description: '', quantity: 1, unitPrice: 0, cost: 0, itemType: 'Goods' };
        addQuoteItem(tender.tender.id, newItem);
    };

    const handleSaveNewClient = () => {
        if (manualClient.name) {
            const newClient = addClient(manualClient);
            assignTenderToClient(tender.tender.id, newClient.id);
            setManualClient({ name: '', address: '', email: '', phone: '', contactPerson: '' }); // Clear form
        }
    };

    const subtotal = quoteItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const delivery = financialDetails.deliveryCost || 0;
    const installation = financialDetails.installationCost || 0;
    const vat = subtotal * ((financialDetails.vatPercentage || 0) / 100);
    const total = subtotal + delivery + installation + vat;

    const selectedClient = clients.find(c => c.id === financialDetails.clientId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                 <h2 className="text-xl font-semibold text-white">Financial Offer Details</h2>
                 <div className="relative" ref={generateBtnRef}>
                    <button onClick={() => setIsGenerateOpen(prev => !prev)} className="btn-primary text-sm flex items-center">
                        <DocumentDownloadIcon className="w-4 h-4 mr-2"/>Generate<svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isGenerateOpen && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10">
                            <button onClick={() => handleGeneratePdf(DocumentType.QUOTE)} className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-600">Quotation</button>
                            <button onClick={() => handleGeneratePdf(DocumentType.PROFORMA_INVOICE)} className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-600">Proforma Invoice</button>
                        </div>
                    )}
                 </div>
            </div>

            <Section title="Client & Quote Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-style">Quote Number</label>
                        <input type="text" value={financialDetails.quoteNumber || ''} onChange={e => handleDetailChange('quoteNumber', e.target.value)} className="input-style"/>
                    </div>
                     <div>
                        <label className="label-style">Issue Date</label>
                        <input type="date" value={financialDetails.issueDate || new Date().toISOString().split('T')[0]} onChange={e => handleDetailChange('issueDate', e.target.value)} className="input-style"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <h4 className="font-medium text-slate-300 mb-2">BILL TO:</h4>
                        <select
                            value={financialDetails.clientId || ''}
                            onChange={e => assignTenderToClient(tender.tender.id, e.target.value || null)}
                            className="input-style mb-2"
                        >
                            <option value="">-- Select Existing Client or Add New --</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="p-3 bg-slate-800/50 rounded-md space-y-2 text-sm">
                           {selectedClient ? (
                               <>
                                   <p className="font-bold">{selectedClient.name}</p>
                                   <p className="text-slate-400">{selectedClient.address}</p>
                                   <p className="text-slate-400">{selectedClient.email}</p>
                                   <p className="text-slate-400">{selectedClient.phone}</p>
                               </>
                           ) : (
                               <div className="space-y-2">
                                   <input type="text" placeholder="Name" value={manualClient.name} onChange={e => setManualClient(p => ({...p, name: e.target.value}))} className="input-style text-xs" />
                                   <textarea placeholder="Address" value={manualClient.address} onChange={e => setManualClient(p => ({...p, address: e.target.value}))} className="input-style text-xs min-h-[50px]" />
                                   <input type="email" placeholder="Email" value={manualClient.email} onChange={e => setManualClient(p => ({...p, email: e.target.value}))} className="input-style text-xs" />
                                   <input type="text" placeholder="Phone" value={manualClient.phone} onChange={e => setManualClient(p => ({...p, phone: e.target.value}))} className="input-style text-xs" />
                                   {manualClient.name && <button onClick={handleSaveNewClient} className="btn-secondary w-full text-xs mt-1"><SaveIcon className="w-4 h-4 mr-1"/>Save as New Client</button>}
                               </div>
                           )}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-medium text-slate-300 mb-2">SHIP TO:</h4>
                        <div className="p-3 bg-slate-800/50 rounded-md space-y-2 text-sm">
                            <input type="text" placeholder="Name" value={financialDetails.shipToName || ''} onChange={e => handleDetailChange('shipToName', e.target.value)} className="input-style text-xs" />
                            <textarea placeholder="Address" value={financialDetails.shipToAddress || ''} onChange={e => handleDetailChange('shipToAddress', e.target.value)} className="input-style text-xs min-h-[50px]" />
                            <input type="email" placeholder="Email" value={financialDetails.shipToEmail || ''} onChange={e => handleDetailChange('shipToEmail', e.target.value)} className="input-style text-xs" />
                            <input type="text" placeholder="Phone" value={financialDetails.shipToPhone || ''} onChange={e => handleDetailChange('shipToPhone', e.target.value)} className="input-style text-xs" />
                        </div>
                    </div>
                </div>
            </Section>

            {/* Line Items */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Line Items</h3>
                <div className="flex gap-2">
                    <button onClick={handleNewItem} className="btn-secondary text-sm"><PlusIcon className="w-4 h-4 mr-2"/>Add Manual</button>
                    <button onClick={() => setIsCatalogPickerOpen(true)} className="btn-primary text-sm"><BookOpenIcon className="w-4 h-4 mr-2"/>Add from Catalog</button>
                </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                   <thead className="bg-slate-700/50 text-xs text-slate-300 uppercase">
                        <tr>
                            <th className="p-2 w-10">#</th>
                            <th className="p-2 min-w-[150px]">Item</th>
                            <th className="p-2 min-w-[200px]">Description</th>
                            <th className="p-2 w-24">Qty</th>
                            <th className="p-2 w-28">Unit Price</th>
                            <th className="p-2 w-28">Total</th>
                            <th className="p-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {quoteItems.length > 0 ? quoteItems.map((item, index) => (
                            <tr key={item.id}>
                                <td className="p-2 text-slate-400">{index+1}</td>
                                <td className="p-1"><input type="text" value={item.itemName} onChange={e => updateQuoteItem(tender.tender.id, item.id, {...item, itemName: e.target.value})} placeholder="Item Name" className="input-style !p-1.5 text-sm"/></td>
                                <td className="p-1"><textarea value={item.description} onChange={e => updateQuoteItem(tender.tender.id, item.id, {...item, description: e.target.value})} placeholder="Item Description" className="input-style !p-1.5 text-sm min-h-[40px]"/></td>
                                <td className="p-1"><input type="number" value={item.quantity} onChange={e => updateQuoteItem(tender.tender.id, item.id, {...item, quantity: Number(e.target.value)})} className="input-style !p-1.5 text-sm"/></td>
                                <td className="p-1"><input type="number" value={item.unitPrice} onChange={e => updateQuoteItem(tender.tender.id, item.id, {...item, unitPrice: Number(e.target.value)})} className="input-style !p-1.5 text-sm"/></td>
                                <td className="p-2 font-mono text-slate-300 text-sm">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeQuoteItem(tender.tender.id, item.id)} className="btn-icon-danger"><TrashIcon className="w-4 h-4"/></button></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} className="text-center p-8 text-slate-400">No items added to this quote yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">Delivery</span><input type="number" value={delivery} onChange={e => handleDetailChange('deliveryCost', Number(e.target.value))} className="input-style !p-1 w-24 text-right"/></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">Installation</span><input type="number" value={installation} onChange={e => handleDetailChange('installationCost', Number(e.target.value))} className="input-style !p-1 w-24 text-right"/></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">VAT (%)</span><input type="number" value={financialDetails.vatPercentage || 0} onChange={e => handleDetailChange('vatPercentage', Number(e.target.value))} className="input-style !p-1 w-24 text-right"/></div>
                        <div className="flex justify-between pt-2 border-t border-slate-600 font-bold text-lg"><span className="text-white">Total</span><span className="font-mono text-blue-400">{formatCurrency(total)}</span></div>
                    </div>
                </div>
            </div>

            {/* Terms */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="Terms and Conditions"><textarea value={financialDetails.termsAndConditions || ''} onChange={e => handleDetailChange('termsAndConditions', e.target.value)} className="input-style min-h-[100px]"/></Section>
                <Section title="Installation and Training"><textarea value={financialDetails.installationAndTraining || ''} onChange={e => handleDetailChange('installationAndTraining', e.target.value)} className="input-style min-h-[100px]"/></Section>
                <Section title="Validity"><textarea value={financialDetails.validity || ''} onChange={e => handleDetailChange('validity', e.target.value)} className="input-style min-h-[100px]"/></Section>
                <Section title="Delivery"><textarea value={financialDetails.deliveryTerms || ''} onChange={e => handleDetailChange('deliveryTerms', e.target.value)} className="input-style min-h-[100px]"/></Section>
                <Section title="Payment Terms"><textarea value={financialDetails.paymentMethod || ''} onChange={e => handleDetailChange('paymentMethod', e.target.value)} className="input-style min-h-[100px]"/></Section>
                <Section title="Remarks"><textarea value={financialDetails.remarks || ''} onChange={e => handleDetailChange('remarks', e.target.value)} className="input-style min-h-[100px]"/></Section>
            </div>


            <CatalogPickerModal isOpen={isCatalogPickerOpen} onClose={() => setIsCatalogPickerOpen(false)} onAddItems={handleAddFromCatalog} catalog={catalog} existingQuoteItems={quoteItems} vendors={vendors} />
        </div>
    );
};

export default QuotationSection;