import React, { useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem } from '../types';
import { TenderStatus } from '../types';
import { ShoppingBagIcon } from './icons';
import { formatTenderDate } from '../utils';

type ProcurementProps = {
  store: ReturnType<typeof useTenderStore>;
  onSelectTender: (item: WatchlistItem) => void;
};

const Procurement: React.FC<ProcurementProps> = ({ store, onSelectTender }) => {
    const { watchlist } = store;

    const wonTenders = useMemo(() =>
        watchlist.filter(item => item.status === TenderStatus.WON)
    , [watchlist]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Procurement Hub</h1>
            </div>

            {wonTenders.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                    <ShoppingBagIcon className="mx-auto w-12 h-12 text-slate-500" />
                    <h3 className="text-xl font-medium text-white mt-4">No Tenders Won Yet</h3>
                    <p className="text-slate-400 mt-2">When you win a tender, it will appear here to manage procurement.</p>
                </div>
            ) : (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-300">Tender Title</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Closing Date</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Purchase Orders</th>
                                <th className="p-3 text-sm font-semibold text-slate-300"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {wonTenders.map(item => (
                                <tr key={item.tender.id} className="hover:bg-slate-800 transition-colors">
                                    <td className="p-3 font-medium text-slate-100">{item.tender.title}</td>
                                    <td className="p-3 text-slate-400">{formatTenderDate(item.tender.closingDate)}</td>
                                    <td className="p-3 text-slate-400">{item.purchaseOrders?.length || 0}</td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => onSelectTender(item)}
                                            className="px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white"
                                        >
                                            Manage Procurement
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Procurement;