import React, { useState, useMemo } from 'react';
import type { CatalogItem, QuoteItem, Vendor } from '../types';
import { SearchIcon, BookOpenIcon, PlusIcon } from './icons';

type CatalogPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: Omit<QuoteItem, 'id'>[]) => void;
  catalog: CatalogItem[];
  existingQuoteItems: QuoteItem[];
  vendors: Vendor[];
};

const CatalogPickerModal: React.FC<CatalogPickerModalProps> = ({ isOpen, onClose, onAddItems, catalog, existingQuoteItems, vendors }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const vendorMap = useMemo(() => {
    return vendors.reduce((acc, vendor) => {
        acc[vendor.id] = vendor.name;
        return acc;
    }, {} as Record<string, string>);
  }, [vendors]);

  const existingCatalogItemIds = useMemo(() => 
    new Set(existingQuoteItems.map(item => item.catalogItemRef).filter(Boolean))
  , [existingQuoteItems]);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const lowercasedQuery = searchQuery.toLowerCase();
    return catalog.filter(item => 
        item.item_name.toLowerCase().includes(lowercasedQuery) ||
        item.category.toLowerCase().includes(lowercasedQuery) ||
        item.description.toLowerCase().includes(lowercasedQuery)
    );
  }, [catalog, searchQuery]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        return newSet;
    });
  };

  const handleAddSelected = () => {
    const itemsToAdd = catalog.filter(item => selectedItems.has(item.id));
    const newQuoteItems = itemsToAdd.map(ci => ({
        itemName: ci.item_name,
        description: ci.description,
        manufacturer: ci.manufacturer,
        model: ci.model,
        quantity: 1,
        unitPrice: ci.sale_price,
        cost: ci.cost,
        uom: ci.uom,
        technicalDetails: { ...ci.technical_specs },
        catalogItemRef: ci.id,
        itemType: ci.item_type,
        hsnCode: ci.hsn_code,
    }));

    onAddItems(newQuoteItems);
    onClose();
    setSelectedItems(new Set());
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-slate-700 flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
             <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center">
                    <BookOpenIcon className="w-6 h-6 mr-3 text-slate-400"/>
                    <h2 className="text-xl font-bold text-white">Add Items from Catalog</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, category, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-style pl-10"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900/50 sticky top-0">
                        <tr>
                            <th className="p-3 w-12"></th>
                            <th className="p-3 text-sm font-semibold text-slate-300">Item Name</th>
                            <th className="p-3 text-sm font-semibold text-slate-300">Category</th>
                            <th className="p-3 text-sm font-semibold text-slate-300">Sale Price</th>
                            <th className="p-3 text-sm font-semibold text-slate-300">Vendor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredCatalog.map(item => {
                            const isSelected = selectedItems.has(item.id);
                            const isDisabled = existingCatalogItemIds.has(item.id);
                            return (
                                <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-blue-900/50' : 'hover:bg-slate-700/50'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !isDisabled && handleToggleItem(item.id)}>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={isDisabled}
                                            onChange={() => {}}
                                            className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                    </td>
                                    <td className="p-3 font-medium text-slate-100">{item.item_name}</td>
                                    <td className="p-3 text-slate-400">{item.category}</td>
                                    <td className="p-3 text-slate-400">${item.sale_price.toFixed(2)}</td>
                                    <td className="p-3 text-slate-400">{item.vendor_id ? vendorMap[item.vendor_id] || 'N/A' : 'N/A'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredCatalog.length === 0 && (
                    <p className="text-center py-10 text-slate-400">No matching items found.</p>
                )}
            </div>
            
            <footer className="p-4 flex justify-between items-center border-t border-slate-700 flex-shrink-0">
                <span className="text-sm text-slate-400">{selectedItems.size} item(s) selected</span>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={handleAddSelected} className="btn-primary" disabled={selectedItems.size === 0}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Selected Items
                    </button>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default CatalogPickerModal;