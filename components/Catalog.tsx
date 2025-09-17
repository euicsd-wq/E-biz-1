import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { CatalogItem, TeamMember } from '../types';
import { TeamMemberRole } from '../types';
import { PlusIcon, CubeIcon, TrashIcon, EditIcon, SparklesIcon } from './icons';
import CatalogItemModal from './CatalogItemModal';
import VendorQuoteImportModal from './VendorQuoteImportModal';
import { formatCurrency } from '../utils';

type CatalogProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

const Catalog: React.FC<CatalogProps> = ({ store, currentUser }) => {
    const { catalog, vendors, removeCatalogItem } = store;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

    const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    const vendorMap = useMemo(() => {
        return vendors.reduce((acc, vendor) => {
            acc[vendor.id] = vendor.name;
            return acc;
        }, {} as Record<string, string>);
    }, [vendors]);

    const handleAddNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: CatalogItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            removeCatalogItem(itemId);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h1 className="text-3xl font-bold text-white">Goods & Services Catalog</h1>
                {canEdit && (
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-200 bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors">
                            <SparklesIcon className="w-5 h-5 mr-2 text-purple-400"/>
                            Import from Quote
                        </button>
                        <button 
                            onClick={handleAddNew}
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2"/>
                            Add New Item
                        </button>
                    </div>
                )}
            </div>

            {catalog.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                    <CubeIcon className="mx-auto w-12 h-12 text-slate-500" />
                    <h3 className="text-xl font-medium text-white mt-4">Your Catalog is Empty</h3>
                    <p className="text-slate-400 mt-2">Add goods and services to build your catalog.</p>
                </div>
            ) : (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-300">Item Name</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Type</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Category</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Cost</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Sale Price</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Margin</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Vendor</th>
                                {canEdit && <th className="p-3 text-sm font-semibold text-slate-300"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {catalog.map(item => (
                                <tr key={item.id} className="hover:bg-slate-800 transition-colors">
                                    <td className="p-3 font-medium text-slate-100">{item.item_name}</td>
                                    <td className="p-3 text-slate-400">{item.item_type}</td>
                                    <td className="p-3 text-slate-400">{item.category}</td>
                                    <td className="p-3 text-slate-400">{formatCurrency(item.cost)}</td>
                                    <td className="p-3 text-slate-400">{formatCurrency(item.sale_price)}</td>
                                    <td className="p-3 text-slate-400">
                                        {item.sale_price > 0 ? `${(((item.sale_price - item.cost) / item.sale_price) * 100).toFixed(1)}%` : 'N/A'}
                                    </td>
                                    <td className="p-3 text-slate-400">{item.vendor_id ? vendorMap[item.vendor_id] || 'N/A' : 'N/A'}</td>
                                    {canEdit && (
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(item)} className="p-2 rounded-full hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors" aria-label="Edit item">
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" aria-label="Delete item">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CatalogItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                store={store}
                itemToEdit={editingItem}
            />
            <VendorQuoteImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                store={store}
            />
        </div>
    );
};

export default Catalog;