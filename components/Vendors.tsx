

import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Vendor, TeamMember } from '../types';
import { TeamMemberRole, VendorType } from '../types';
import { PlusIcon, UsersIcon, TrashIcon } from './icons';
import VendorModal from './VendorModal';
import { getInitials, generateHslColorFromString } from '../utils';

type VendorsProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
  onSelectVendor: (vendorId: string) => void;
};

const Vendors: React.FC<VendorsProps> = ({ store, currentUser, onSelectVendor }) => {
    const { vendors, removeVendor, teamMembers } = store;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [typeFilter, setTypeFilter] = useState<VendorType | 'all'>('all');

    const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    const handleAddNew = () => {
        setEditingVendor(null);
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, vendorId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this vendor? This will also remove them from any associated catalog items or shipments.')) {
            removeVendor(vendorId);
        }
    };
    
    const teamMemberMap = useMemo(() => {
        return teamMembers.reduce((acc, member) => {
            acc[member.id] = member;
            return acc;
        }, {} as Record<string, TeamMember>);
    }, [teamMembers]);

    const filteredVendors = useMemo(() => {
        if (typeFilter === 'all') return vendors;
        return vendors.filter(v => v.vendorType === typeFilter);
    }, [vendors, typeFilter]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-white">Vendors</h1>
                     <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as VendorType | 'all')}
                        className="input-style !p-2 !text-sm"
                    >
                        <option value="all">All Vendor Types</option>
                        {Object.values(VendorType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                {canEdit && (
                  <button 
                      onClick={handleAddNew}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 transition-colors">
                      <PlusIcon className="w-5 h-5 mr-2"/>
                      Add New Vendor
                  </button>
                )}
            </div>

            {vendors.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                    <UsersIcon className="mx-auto w-12 h-12 text-slate-500" />
                    <h3 className="text-xl font-medium text-white mt-4">Your Vendor List is Empty</h3>
                    <p className="text-slate-400 mt-2">Add vendors to manage your contacts and suppliers.</p>
                </div>
            ) : (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-300">Name</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Type</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Contact Person</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Email</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Assigned To</th>
                                {canEdit && <th className="p-3 text-sm font-semibold text-slate-300"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredVendors.map(vendor => {
                                const assignedMember = vendor.assignedTeamMemberId ? teamMemberMap[vendor.assignedTeamMemberId] : null;
                                return (
                                    <tr key={vendor.id} onClick={() => onSelectVendor(vendor.id)} className="hover:bg-slate-800 transition-colors cursor-pointer">
                                        <td className="p-3 font-medium text-slate-100">{vendor.name}</td>
                                        <td className="p-3 text-slate-400">{vendor.vendorType}</td>
                                        <td className="p-3 text-slate-400">{vendor.contactPerson}</td>
                                        <td className="p-3 text-slate-400">{vendor.email}</td>
                                        <td className="p-3 text-slate-400">
                                            {assignedMember ? (
                                                <div className="flex items-center gap-2" title={assignedMember.name}>
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: generateHslColorFromString(assignedMember.name) }}>
                                                        {getInitials(assignedMember.name)}
                                                    </div>
                                                    <span className="text-xs">{assignedMember.name}</span>
                                                </div>
                                            ) : 'Unassigned'}
                                        </td>
                                        {canEdit && (
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={(e) => handleDelete(e, vendor.id)} className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" aria-label="Delete vendor">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <VendorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                store={store}
                vendorToEdit={editingVendor}
            />
        </div>
    );
};

export default Vendors;