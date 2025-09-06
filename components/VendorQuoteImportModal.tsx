import React, { useState, useCallback } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { AIExtractedItem, CatalogItem, TechnicalDetails } from '../types';
import { SparklesIcon, UploadIcon, PlusIcon } from './icons';
import { extractCatalogItemsFromDocument } from '../services/aiService';

type VendorQuoteImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
};

type ViewState = 'upload' | 'loading' | 'review' | 'error';

const VendorQuoteImportModal: React.FC<VendorQuoteImportModalProps> = ({ isOpen, onClose, store }) => {
    const [view, setView] = useState<ViewState>('upload');
    const [error, setError] = useState<string | null>(null);
    const [extractedItems, setExtractedItems] = useState<AIExtractedItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [dragIsOver, setDragIsOver] = useState(false);

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;

        setView('loading');
        setError(null);
        
        try {
            const reader = new FileReader();
            reader.onload = async (loadEvent) => {
                try {
                    const base64Data = loadEvent.target?.result as string;
                    const document = { fileData: base64Data, mimeType: file.type };
                    const items = await extractCatalogItemsFromDocument(document, store.aiConfig);
                    setExtractedItems(items);
                    setSelectedItems(new Set(items.map((_, index) => index))); // Select all by default
                    setView('review');
                } catch (e: any) {
                    setError(e.message || "Failed to process the document.");
                    setView('error');
                }
            };
            reader.onerror = () => {
                setError("Failed to read the file.");
                setView('error');
            };
            reader.readAsDataURL(file);
        } catch (e: any) {
             setError(e.message || "An unexpected error occurred.");
             setView('error');
        }
    }, [store.aiConfig]);
    
    const handleToggleItem = (index: number) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleAddItemToCatalog = () => {
        const itemsToAdd = extractedItems.filter((_, index) => selectedItems.has(index));
        
        itemsToAdd.forEach(item => {
            const technicalSpecs: TechnicalDetails = (item.technicalSpecs || []).reduce((acc, spec) => {
                acc[spec.specName] = spec.specValue;
                return acc;
            }, {} as TechnicalDetails);

            const newCatalogItem: Omit<CatalogItem, 'id'> = {
                itemName: item.itemName,
                description: item.description,
                cost: item.cost,
                salePrice: item.cost, // Default sale price to cost
                itemType: 'Goods', // Default
                category: 'Uncategorized',
                uom: item.uom,
                manufacturer: item.manufacturer,
                model: item.model,
                vendorId: null,
                assignedPersonId: null,
                technicalSpecs,
                documents: [],
                hsnCode: item.hsnCode,
            };
            store.addCatalogItem(newCatalogItem);
        });
        onClose();
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="mt-4 text-slate-400">Analyzing your document...</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <p className="text-red-400 text-center mb-4">{error}</p>
                        <button onClick={() => setView('upload')} className="btn-secondary">Try Again</button>
                    </div>
                );
            case 'review':
                return (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-700">
                             <h3 className="font-semibold text-white">Review Extracted Items</h3>
                             <p className="text-sm text-slate-400">Select the items you want to import into your catalog.</p>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4">
                            <div className="space-y-2">
                                {extractedItems.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-md">
                                        <input type="checkbox" checked={selectedItems.has(index)} onChange={() => handleToggleItem(index)} className="mt-1 w-4 h-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600"/>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-100">{item.itemName}</p>
                                            <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                                            <p className="text-sm font-mono text-green-400 mt-2">Cost: ${item.cost?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <footer className="p-4 flex justify-between items-center border-t border-slate-700 bg-slate-800 flex-shrink-0">
                            <span className="text-sm text-slate-400">{selectedItems.size} of {extractedItems.length} items selected</span>
                            <div className="flex gap-3">
                                <button onClick={() => setView('upload')} className="btn-secondary">Upload Another</button>
                                <button onClick={handleAddItemToCatalog} className="btn-primary" disabled={selectedItems.size === 0}>
                                    <PlusIcon className="w-5 h-5 mr-2" /> Add to Catalog
                                </button>
                            </div>
                        </footer>
                    </div>
                );
            case 'upload':
            default:
                return (
                     <div 
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragIsOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragIsOver(false); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragIsOver(false); handleFileSelect(e.dataTransfer.files); }}
                        className="flex flex-col items-center justify-center h-full p-6 border-4 border-dashed rounded-md m-4 transition-colors"
                        style={{ borderColor: dragIsOver ? '#3b82f6' : '#475569' }}
                    >
                        <input type="file" onChange={e => handleFileSelect(e.target.files)} className="hidden" id="quote-upload"/>
                        <UploadIcon className="w-12 h-12 text-slate-500 mb-4"/>
                        <h3 className="text-xl font-medium text-white">Upload Vendor Quote or Proforma Invoice</h3>
                        <p className="text-slate-400 mt-2 text-center">Drag & drop a file here or click to select a file.<br/>(PDF, PNG, JPG supported)</p>
                        <label htmlFor="quote-upload" className="btn-primary mt-6 cursor-pointer">Select File</label>
                    </div>
                );
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-3 text-purple-400"/>
                        <h2 className="text-xl font-bold text-white">AI Catalog Importer</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                <div className="flex-grow min-h-0">
                    {renderContent()}
                </div>
            </div>
             <style>{`
                .btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: white; background-color: #2563eb; border-radius: 0.5rem; transition: background-color 0.2s; }
                .btn-primary:hover:not(:disabled) { background-color: #1d4ed8; }
                .btn-primary:disabled { background-color: #475569; cursor: not-allowed; }
                .btn-secondary { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #e2e8f0; background-color: #475569; border-radius: 0.5rem; }
                .btn-secondary:hover { background-color: #334155; }
            `}</style>
        </div>
    );
};

export default VendorQuoteImportModal;