import React, { useState, useEffect, useRef } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { CatalogItem, CatalogItemDocument, TechnicalDetails } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, SparklesIcon } from './icons';
import { DEFAULT_TECH_SPEC_FIELDS, DEFAULT_SERVICE_SPEC_FIELDS } from '../constants';
import { fillTechnicalSpecs, fillTechnicalSpecsFromDocument } from '../services/aiService';

type CatalogItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  itemToEdit: CatalogItem | null;
};

const emptyItem: Omit<CatalogItem, 'id'> = {
    itemType: 'Goods',
    category: '',
    itemName: '',
    description: '',
    manufacturer: '',
    model: '',
    salePrice: 0,
    cost: 0,
    uom: '',
    vendorId: null,
    assignedPersonId: null,
    technicalSpecs: {},
    documents: [],
    hsnCode: '',
};

const CatalogItemModal: React.FC<CatalogItemModalProps> = ({ isOpen, onClose, store, itemToEdit }) => {
  const [item, setItem] = useState<Omit<CatalogItem, 'id'>>(emptyItem);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItem(itemToEdit ? { ...itemToEdit } : { ...emptyItem, technicalSpecs: {}, documents: [] });
      setAiError(null);
      setIsAiLoading(false);
    }
  }, [isOpen, itemToEdit]);

  const handleChange = (field: keyof Omit<CatalogItem, 'id' | 'technicalSpecs' | 'documents'>, value: string | number | null) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (fieldId: string, value: string) => {
    setItem(prev => ({ 
        ...prev, 
        technicalSpecs: {
            ...prev.technicalSpecs,
            [fieldId]: value
        }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const base64Data = loadEvent.target?.result as string;
            const newDoc: CatalogItemDocument = {
                id: crypto.randomUUID(),
                name: file.name,
                data: base64Data,
                mimeType: file.type
            };
            setItem(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
        };
        reader.readAsDataURL(file);
    });

    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDocument = (docId: string) => {
    setItem(prev => ({ ...prev, documents: prev.documents.filter(doc => doc.id !== docId) }));
  };
  
  const handleAIFillFromWeb = async () => {
    if (!item.manufacturer || !item.model) {
        setAiError('Please provide a Manufacturer and Model for the AI to search.');
        return;
    }
    setIsAiLoading(true);
    setAiError(null);
    try {
        const specs = await fillTechnicalSpecs(item.manufacturer, item.model, store.aiConfig);
        if(Object.keys(specs).length === 0) {
            setAiError('No data found, please add manually.');
        } else {
            setItem(prev => ({ ...prev, technicalSpecs: { ...prev.technicalSpecs, ...specs } }));
        }
    } catch (e: any) {
        setAiError(e.message);
    } finally {
        setIsAiLoading(false);
    }
  };
  
  const handleAIFileAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!item.itemName) {
          setAiError('Please enter an item name first to help the AI find it in the document.');
          return;
      }

      setIsAiLoading(true);
      setAiError(null);
      
      const reader = new FileReader();
      reader.onload = async (loadEvent) => {
          try {
              const base64Data = loadEvent.target?.result as string;
              const document = { fileData: base64Data, mimeType: file.type };
              const specs = await fillTechnicalSpecsFromDocument(document, item.itemName, store.aiConfig);
               if(Object.keys(specs).length === 0) {
                  setAiError('No matching specs found in the document.');
              } else {
                  setItem(prev => ({ ...prev, technicalSpecs: { ...prev.technicalSpecs, ...specs } }));
              }
          } catch (err: any) {
              setAiError(err.message);
          } finally {
              setIsAiLoading(false);
          }
      };
      reader.readAsDataURL(file);

      if (aiFileInputRef.current) aiFileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(itemToEdit) {
        store.updateCatalogItem(itemToEdit.id, item as CatalogItem);
    } else {
        store.addCatalogItem(item);
    }
    onClose();
  };

  if (!isOpen) return null;

  const specFields = item.itemType === 'Goods' ? DEFAULT_TECH_SPEC_FIELDS : DEFAULT_SERVICE_SPEC_FIELDS;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
             <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{itemToEdit ? 'Edit Item' : 'Add New Item'}</h2>
                <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[85vh]">
                <div className="p-6 space-y-6">
                    {/* Item Details */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Item Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="label-style">Item Type</label>
                                <select value={item.itemType} onChange={e => { handleChange('itemType', e.target.value); if (e.target.value === 'Services') { handleChange('hsnCode', '') } }} className="input-style">
                                    <option value="Goods">Goods</option>
                                    <option value="Services">Services</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-style">Category</label>
                                <input type="text" value={item.category} onChange={e => handleChange('category', e.target.value)} className="input-style"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="label-style">Item Name</label>
                                <input type="text" value={item.itemName} onChange={e => handleChange('itemName', e.target.value)} required className="input-style"/>
                            </div>
                            <div>
                                <label className="label-style">Manufacturer</label>
                                <input type="text" value={item.manufacturer || ''} onChange={e => handleChange('manufacturer', e.target.value)} placeholder="e.g., Apple" className="input-style"/>
                            </div>
                            <div>
                                <label className="label-style">Model</label>
                                <input type="text" value={item.model || ''} onChange={e => handleChange('model', e.target.value)} placeholder="e.g., MacBook Pro 16" className="input-style"/>
                            </div>
                             <div className="md:col-span-2">
                                <label className="label-style">Description</label>
                                <textarea value={item.description} onChange={e => handleChange('description', e.target.value)} className="input-style min-h-[80px]"/>
                            </div>
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="sm:col-span-1">
                                    <label className="label-style">Cost (USD)</label>
                                    <input type="number" value={item.cost} onChange={e => handleChange('cost', Number(e.target.value))} min="0" step="0.01" className="input-style"/>
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="label-style">Sale Price (USD)</label>
                                    <input type="number" value={item.salePrice} onChange={e => handleChange('salePrice', Number(e.target.value))} min="0" step="0.01" className="input-style"/>
                                </div>
                                 <div className="sm:col-span-1">
                                    <label className="label-style">UoM</label>
                                    <input type="text" value={item.uom || ''} onChange={e => handleChange('uom', e.target.value)} placeholder="e.g., Pcs" className="input-style"/>
                                </div>
                                {item.itemType === 'Goods' && (
                                <div className="sm:col-span-1">
                                    <label className="label-style">HSN Code</label>
                                    <input type="text" value={item.hsnCode || ''} onChange={e => handleChange('hsnCode', e.target.value)} placeholder="e.g., 847130" className="input-style"/>
                                </div>
                                )}
                            </div>
                        </div>
                    </section>
                    {/* Vendor Information */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Vendor Information</h3>
                        <div>
                            <label className="label-style">Vendor</label>
                            <select value={item.vendorId ?? ''} onChange={e => handleChange('vendorId', e.target.value || null)} className="input-style">
                                <option value="">-- No Vendor --</option>
                                {store.vendors.map(vendor => (
                                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                ))}
                            </select>
                        </div>
                    </section>
                    {/* AI Assistant */}
                     <section>
                        <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-purple-400"/>AI Assistant
                        </h3>
                         <div className="p-3 bg-slate-900/50 rounded-md border border-slate-700 space-y-3">
                            {isAiLoading && <p className="text-sm text-purple-300 text-center">AI is working, this may take a moment...</p>}
                            {aiError && <p className="text-sm text-red-400 text-center">{aiError}</p>}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button type="button" onClick={handleAIFillFromWeb} disabled={isAiLoading || !item.manufacturer || !item.model} className="btn-secondary w-full text-sm">Fill Specs from Web</button>
                                <input type="file" ref={aiFileInputRef} onChange={handleAIFileAnalysis} className="hidden" accept="image/*,application/pdf" />
                                <button type="button" onClick={() => aiFileInputRef.current?.click()} disabled={isAiLoading} className="btn-secondary w-full text-sm">Upload & Fill from Document</button>
                            </div>
                         </div>
                    </section>
                    {/* Technical Specs */}
                    <section>
                         <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Technical Specifications</h3>
                         <div className="space-y-4">
                            {specFields.map(field => (
                                <div key={field.id}>
                                    <label className="label-style">{field.label}</label>
                                    {field.type === 'text' ? (
                                        <input
                                            type="text"
                                            value={item.technicalSpecs[field.id] || ''}
                                            onChange={(e) => handleSpecChange(field.id, e.target.value)}
                                            className="input-style"
                                        />
                                    ) : (
                                        <textarea
                                            value={item.technicalSpecs[field.id] || ''}
                                            onChange={(e) => handleSpecChange(field.id, e.target.value)}
                                            className="input-style min-h-[80px]"
                                            rows={3}
                                        />
                                    )}
                                </div>
                            ))}
                         </div>
                    </section>
                     {/* Documents */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Documents</h3>
                        <div className="space-y-2">
                             {item.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-slate-700/50 p-2 rounded-md">
                                    <a href={doc.data} download={doc.name} className="text-sm text-blue-300 hover:underline truncate pr-4">{doc.name}</a>
                                    <button type="button" onClick={() => removeDocument(doc.id)} className="p-1 rounded-full text-slate-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                             ))}
                        </div>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 w-full btn-secondary text-sm">
                            <UploadIcon className="w-5 h-5 mr-2"/>Upload Documents (Catalogues, Certificates, etc.)
                        </button>
                    </section>
                </div>
                <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Item</button>
                </footer>
            </form>
        </div>
    </div>
  );
};

export default CatalogItemModal;