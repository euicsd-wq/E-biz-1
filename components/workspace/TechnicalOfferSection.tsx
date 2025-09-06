import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, QuoteItem, TechnicalDetails, ManagedDocument, CatalogItemDocument } from '../../types';
import { DEFAULT_TECH_SPEC_FIELDS, DEFAULT_SERVICE_SPEC_FIELDS } from '../../constants';
import { DocumentDownloadIcon, SparklesIcon, SaveIcon } from '../icons';
import { fillTechnicalSpecs, fillTechnicalSpecsFromDocument } from '../../services/aiService';

type TechnicalOfferSectionProps = {
    tender: WatchlistItem;
    store: ReturnType<typeof useTenderStore>;
    onGeneratePdf: () => void;
};

const ExpandableQuoteItemEditor: React.FC<{
    item: QuoteItem;
    tender: WatchlistItem;
    store: ReturnType<typeof useTenderStore>;
}> = ({ item, tender, store }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentItem, setCurrentItem] = useState(item);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDocId, setSelectedDocId] = useState<string>('');

    const { updateQuoteItem, updateCatalogItemFromQuoteItem, aiConfig, catalog } = store;

    const handleSpecChange = (fieldId: string, value: string) => {
        setCurrentItem(prev => ({
            ...prev,
            technicalDetails: { ...prev.technicalDetails, [fieldId]: value }
        }));
    };
    
    const handleFieldChange = (field: 'manufacturer' | 'model', value: string) => {
        setCurrentItem(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        updateQuoteItem(tender.tender.id, currentItem.id, currentItem);
        setIsExpanded(false);
    };

    const handleSaveToCatalog = () => {
        if (currentItem.catalogItemRef) {
            updateQuoteItem(tender.tender.id, currentItem.id, currentItem); // Save to tender first
            updateCatalogItemFromQuoteItem(currentItem.catalogItemRef, currentItem);
            store.addToast('Specifications have been saved to the master catalog item.', 'success');
        }
    };
    
    const handleAIFill = async () => {
        if (!currentItem.manufacturer || !currentItem.model) {
            setError('Please provide a Manufacturer and Model for the AI to search.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const specs = await fillTechnicalSpecs(currentItem.manufacturer, currentItem.model, aiConfig);
            if(Object.keys(specs).length === 0) {
                setError('No data found, please add manually.');
            } else {
                setCurrentItem(prev => ({ ...prev, technicalDetails: { ...prev.technicalDetails, ...specs } }));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAIFillFromDoc = async () => {
        if (!selectedDocId) {
            setError('Please select a document to analyze.');
            return;
        }
        
        const [source, docId] = selectedDocId.split(':');
        let doc: ManagedDocument | CatalogItemDocument | undefined;
        
        if (source === 'tender') {
            doc = tender.documents?.find(d => d.id === docId);
        } else if (source === 'item') {
            const catalogItem = catalog.find(ci => ci.id === item.catalogItemRef);
            doc = catalogItem?.documents.find(d => d.id === docId);
        }

        if (!doc) {
            setError('Please select a valid document to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
             // Normalize the document object for the AI service, handling 'data' vs 'fileData'
            const docForAI = {
                fileData: 'fileData' in doc ? doc.fileData! : ('data' in doc ? doc.data : undefined),
                mimeType: doc.mimeType,
            };
            if (!docForAI.fileData) {
                throw new Error("Document data is missing.");
            }
            const specs = await fillTechnicalSpecsFromDocument(docForAI, currentItem.itemName, aiConfig);
             if(Object.keys(specs).length === 0) {
                setError('No data found in the document, please add manually.');
            } else {
                setCurrentItem(prev => ({ ...prev, technicalDetails: { ...prev.technicalDetails, ...specs } }));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const specFields = (currentItem.itemType === 'Services' ? DEFAULT_SERVICE_SPEC_FIELDS : DEFAULT_TECH_SPEC_FIELDS);

    const catalogItem = useMemo(() => {
        return item.catalogItemRef ? catalog.find(ci => ci.id === item.catalogItemRef) : null;
    }, [catalog, item.catalogItemRef]);

    const itemDocuments = catalogItem?.documents || [];
    const tenderDocuments = tender.documents || [];

    return (
        <details className="bg-slate-900/50 rounded-lg border border-slate-700 group" onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}>
            <summary className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-800/80 rounded-t-lg">
                <div>
                    <span className="font-medium text-slate-200">{item.itemName}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{item.itemType || 'N/A'}</span>
                </div>
                 <span className="text-sm text-slate-400 group-open:hidden">Click to edit specs</span>
            </summary>
            {isExpanded && (
                <div className="p-4 border-t border-slate-700 space-y-6">
                    {/* AI Assistant Section */}
                    <div className="p-3 bg-slate-800/80 rounded-md border border-slate-700">
                        <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-400"/> AI Assistant</h4>
                        {isLoading && <p className="text-sm text-purple-300">AI is working...</p>}
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <input type="text" placeholder="Manufacturer" value={currentItem.manufacturer || ''} onChange={e => handleFieldChange('manufacturer', e.target.value)} className="input-style !text-xs"/>
                            <input type="text" placeholder="Model" value={currentItem.model || ''} onChange={e => handleFieldChange('model', e.target.value)} className="input-style !text-xs"/>
                            <button onClick={handleAIFill} disabled={isLoading} className="btn-secondary !text-xs">Fill from Web</button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)} className="input-style !text-xs">
                                <option value="">-- Select a document to analyze --</option>
                                {itemDocuments.length > 0 && (
                                    <optgroup label="Item Documents (Brochures, etc.)">
                                        {itemDocuments.map(doc => <option key={`item:${doc.id}`} value={`item:${doc.id}`}>{doc.name}</option>)}
                                    </optgroup>
                                )}
                                {tenderDocuments.length > 0 && (
                                    <optgroup label="Tender Documents (RFP, etc.)">
                                        {tenderDocuments.map(doc => <option key={`tender:${doc.id}`} value={`tender:${doc.id}`}>{doc.name}</option>)}
                                    </optgroup>
                                )}
                            </select>
                            <button onClick={handleAIFillFromDoc} disabled={isLoading || !selectedDocId} className="btn-secondary !text-xs">Fill from Document</button>
                        </div>
                    </div>
                    
                    {/* Specifications Section */}
                    <div className="p-3 bg-slate-800/80 rounded-md border border-slate-700">
                        <h4 className="font-semibold text-slate-200 mb-3">Specifications</h4>
                        <div className="mb-4">
                           <label className="label-style !text-xs">Item Type</label>
                            <select
                                value={currentItem.itemType || 'Goods'}
                                onChange={e => setCurrentItem(prev => ({ ...prev, itemType: e.target.value as 'Goods' | 'Services' }))}
                                className="input-style !text-sm"
                            >
                                <option value="Goods">Goods</option>
                                <option value="Services">Services</option>
                            </select>
                        </div>
                        {/* Spec Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {specFields.map(field => (
                                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                    <label className="label-style !text-xs">{field.label}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea value={currentItem.technicalDetails?.[field.id] || ''} onChange={e => handleSpecChange(field.id, e.target.value)} className="input-style min-h-[80px] !text-sm" />
                                    ) : (
                                        <input type="text" value={currentItem.technicalDetails?.[field.id] || ''} onChange={e => handleSpecChange(field.id, e.target.value)} className="input-style !text-sm" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        {item.catalogItemRef && <button onClick={handleSaveToCatalog} className="btn-secondary text-sm"><SaveIcon className="w-4 h-4 mr-2"/>Save to Catalog</button>}
                        <button onClick={handleSave} className="btn-primary text-sm">Save for this Tender</button>
                    </div>
                </div>
            )}
        </details>
    );
};

const TechnicalOfferSection: React.FC<TechnicalOfferSectionProps> = ({ tender, store, onGeneratePdf }) => {
    
    return (
        <div>
             <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                 <h2 className="text-xl font-semibold text-white">Technical Offer Specifications</h2>
                 <button onClick={() => onGeneratePdf()} className="btn-secondary text-sm"><DocumentDownloadIcon className="w-4 h-4 mr-2"/>Generate Technical PDF</button>
            </div>
            <p className="text-sm text-slate-400 mb-6">Define the item type and technical specifications for each item in your quotation. This information will be used to generate the technical offer document.</p>
            
            <div className="space-y-3">
                {tender.quoteItems && tender.quoteItems.length > 0 ? (
                    tender.quoteItems.map(item => (
                        <ExpandableQuoteItemEditor 
                            key={item.id}
                            item={item}
                            tender={tender}
                            store={store}
                        />
                    ))
                ) : (
                    <div className="text-center text-slate-400 py-8 bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
                        <p>Add items to the quotation first to define their technical specifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicalOfferSection;