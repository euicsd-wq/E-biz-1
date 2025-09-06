import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Shipment, Vendor, TeamMember } from '../types';
import { TeamMemberRole, VendorType } from '../types';
import { PlusIcon, GlobeAltIcon, TrashIcon, EditIcon, DocumentDownloadIcon, LinkIcon, TruckIcon, UsersIcon } from './icons';
import ShipmentModal from './ShipmentModal';
import VendorModal from './VendorModal';
import { formatTenderDate } from '../utils';

type LogisticsProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

type LogisticsTab = 'shipments' | 'vendors';

const Logistics: React.FC<LogisticsProps> = ({ store, currentUser }) => {
    const { shipments, vendors, watchlist, removeShipment, removeVendor } = store;
    const [activeTab, setActiveTab] = useState<LogisticsTab>('shipments');
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

    const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    const tenderMap = useMemo(() => watchlist.reduce((acc, item) => {
        acc[item.tender.id] = item.tender.title;
        return acc;
    }, {} as Record<string, string>), [watchlist]);

    const vendorMap = useMemo(() => vendors.reduce((acc, vendor) => {
        acc[vendor.id] = vendor.name;
        return acc;
    }, {} as Record<string, string>), [vendors]);

    const logisticsVendors = useMemo(() => vendors.filter(v => v.vendorType === VendorType.LOGISTICS_PARTNER), [vendors]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Logistics Hub</h1>
                {canEdit && (
                  <button 
                      onClick={() => activeTab === 'shipments' ? setIsShipmentModalOpen(true) : setIsVendorModalOpen(true)}
                      className="btn-primary">
                      <PlusIcon className="w-5 h-5 mr-2"/>
                      {activeTab === 'shipments' ? 'Add Shipment' : 'Add Logistics Vendor'}
                  </button>
                )}
            </div>

            <div className="border-b border-slate-700 mb-6">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <button onClick={() => setActiveTab('shipments')} className={`inline-flex items-center py-2 px-4 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === 'shipments' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><TruckIcon className="w-5 h-5 mr-2" />Shipments</button>
                    <button onClick={() => setActiveTab('vendors')} className={`inline-flex items-center py-2 px-4 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === 'vendors' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><UsersIcon className="w-5 h-5 mr-2" />Logistics Vendors</button>
                </nav>
            </div>

            {activeTab === 'shipments' && (
                <div>
                    {shipments.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                            <GlobeAltIcon className="mx-auto w-12 h-12 text-slate-500" />
                            <h3 className="text-xl font-medium text-white mt-4">No Shipments Logged</h3>
                            <p className="text-slate-400 mt-2">Add a shipment to start tracking your logistics.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Tender</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">AWB #</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Vendor</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Status</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Delivery Date</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Cost</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {shipments.map(shipment => (
                                        <tr key={shipment.id} className="hover:bg-slate-800 transition-colors">
                                            <td className="p-3 text-slate-400 font-medium text-slate-100 truncate" title={tenderMap[shipment.tenderId]}>{tenderMap[shipment.tenderId] || 'N/A'}</td>
                                            <td className="p-3 text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <span>{shipment.awbNumber}</span>
                                                    {shipment.trackingLink && (
                                                        <a href={shipment.trackingLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" title="Track Shipment">
                                                            <LinkIcon className="w-4 h-4"/>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-400">{vendorMap[shipment.vendorId] || 'N/A'}</td>
                                            <td className="p-3 text-slate-400">{shipment.status}</td>
                                            <td className="p-3 text-slate-400">{formatTenderDate(shipment.deliveryDate)}</td>
                                            <td className="p-3 text-slate-400">${shipment.cost.toFixed(2)}</td>
                                            <td className="p-3 text-slate-400 text-right">
                                                <div className="flex justify-end gap-1">
                                                     {shipment.awbDocument && <a href={shipment.awbDocument.data} download={shipment.awbDocument.name} className="btn-icon" title="Download AWB"><DocumentDownloadIcon className="w-5 h-5"/></a>}
                                                     {shipment.podDocument && <a href={shipment.podDocument.data} download={shipment.podDocument.name} className="btn-icon" title="Download POD"><DocumentDownloadIcon className="w-5 h-5"/></a>}
                                                    {canEdit && (
                                                        <>
                                                            <button onClick={() => { setEditingShipment(shipment); setIsShipmentModalOpen(true); }} className="btn-icon" aria-label="Edit shipment"><EditIcon className="w-5 h-5" /></button>
                                                            <button onClick={() => window.confirm('Delete this shipment?') && removeShipment(shipment.id)} className="btn-icon-danger" aria-label="Delete shipment"><TrashIcon className="w-5 h-5" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'vendors' && (
                <div>
                     {logisticsVendors.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                            <GlobeAltIcon className="mx-auto w-12 h-12 text-slate-500" />
                            <h3 className="text-xl font-medium text-white mt-4">No Logistics Vendors Added</h3>
                            <p className="text-slate-400 mt-2">Add a vendor to manage your shipping partners.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                             <table className="w-full text-left">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Name</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Contact Person</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Email</th>
                                        <th className="p-3 text-sm font-semibold text-slate-300">Phone</th>
                                        {canEdit && <th className="p-3 text-sm font-semibold text-slate-300"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {logisticsVendors.map(vendor => (
                                        <tr key={vendor.id} className="hover:bg-slate-800 transition-colors">
                                            <td className="p-3 text-slate-400 font-medium text-slate-100">{vendor.name}</td>
                                            <td className="p-3 text-slate-400">{vendor.contactPerson}</td>
                                            <td className="p-3 text-slate-400">{vendor.email}</td>
                                            <td className="p-3 text-slate-400">{vendor.phone}</td>
                                            {canEdit && (
                                                <td className="p-3 text-slate-400 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => { setEditingVendor(vendor); setIsVendorModalOpen(true); }} className="btn-icon" aria-label="Edit vendor"><EditIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => window.confirm('Delete this vendor?') && removeVendor(vendor.id)} className="btn-icon-danger" aria-label="Delete vendor"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            <ShipmentModal isOpen={isShipmentModalOpen} onClose={() => setIsShipmentModalOpen(false)} store={store} shipmentToEdit={editingShipment} />
            <VendorModal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} store={store} vendorToEdit={editingVendor} defaultVendorType={VendorType.LOGISTICS_PARTNER} />
        </div>
    );
};

export default Logistics;