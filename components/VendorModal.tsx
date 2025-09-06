import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Vendor, TeamMember } from '../types';
import { VendorType } from '../types';

type VendorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  vendorToEdit: Vendor | null;
  defaultVendorType?: VendorType;
};

const emptyVendor: Omit<Vendor, 'id'> = {
    name: '',
    vendorType: VendorType.GOODS_SUPPLIER,
    address: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    contactPerson: '',
    assignedTeamMemberId: null,
    notes: '',
    bankName: '',
    bankAccountNumber: '',
    taxId: ''
};

const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, store, vendorToEdit, defaultVendorType }) => {
  const [vendor, setVendor] = useState(emptyVendor);

  useEffect(() => {
    if (isOpen) {
      if (vendorToEdit) {
        setVendor({ ...vendorToEdit });
      } else {
        setVendor({ ...emptyVendor, vendorType: defaultVendorType || VendorType.GOODS_SUPPLIER });
      }
    }
  }, [isOpen, vendorToEdit, defaultVendorType]);

  const handleChange = (field: keyof Omit<Vendor, 'id'>, value: string | null) => {
    setVendor(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vendorToEdit) {
      store.updateVendor(vendorToEdit.id, vendor as Vendor);
    } else {
      store.addVendor(vendor);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{vendorToEdit ? 'Edit Vendor' : 'Add New Vendor'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[85vh]">
          <div className="p-6 space-y-6">
            <section>
                <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Vendor Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="label-style">Vendor Name</label><input type="text" value={vendor.name} onChange={e => handleChange('name', e.target.value)} required className="input-style"/></div>
                     <div><label className="label-style">Vendor Type</label><select value={vendor.vendorType} onChange={e => handleChange('vendorType', e.target.value)} className="input-style">{Object.values(VendorType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                     <div className="md:col-span-2"><label className="label-style">Address</label><input type="text" value={vendor.address} onChange={e => handleChange('address', e.target.value)} className="input-style"/></div>
                     <div><label className="label-style">City</label><input type="text" value={vendor.city || ''} onChange={e => handleChange('city', e.target.value)} className="input-style"/></div>
                     <div><label className="label-style">Country</label><input type="text" value={vendor.country || ''} onChange={e => handleChange('country', e.target.value)} className="input-style"/></div>
                     <div><label className="label-style">Tax ID</label><input type="text" value={vendor.taxId || ''} onChange={e => handleChange('taxId', e.target.value)} className="input-style"/></div>
                </div>
            </section>
            <section>
                <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="label-style">Contact Person</label><input type="text" value={vendor.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} required className="input-style"/></div>
                     <div><label className="label-style">Email</label><input type="email" value={vendor.email} onChange={e => handleChange('email', e.target.value)} className="input-style"/></div>
                     <div><label className="label-style">Phone</label><input type="tel" value={vendor.phone} onChange={e => handleChange('phone', e.target.value)} className="input-style"/></div>
                     <div><label className="label-style">WhatsApp</label><input type="tel" value={vendor.whatsapp || ''} onChange={e => handleChange('whatsapp', e.target.value)} className="input-style"/></div>
                     <div className="md:col-span-2"><label className="label-style">Website</label><input type="url" value={vendor.website || ''} onChange={e => handleChange('website', e.target.value)} className="input-style"/></div>
                </div>
            </section>
             <section>
                <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label-style">Bank Name</label><input type="text" value={vendor.bankName || ''} onChange={e => handleChange('bankName', e.target.value)} className="input-style"/></div>
                    <div><label className="label-style">Bank Account Number</label><input type="text" value={vendor.bankAccountNumber || ''} onChange={e => handleChange('bankAccountNumber', e.target.value)} className="input-style"/></div>
                </div>
            </section>
            <section>
                 <h3 className="text-lg font-semibold text-white mb-3 border-b border-slate-700 pb-2">Internal Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-style">Assigned Team Member</label>
                        <select value={vendor.assignedTeamMemberId || ''} onChange={e => handleChange('assignedTeamMemberId', e.target.value || null)} className="input-style">
                            <option value="">-- Unassigned --</option>
                            {store.teamMembers.map((m: TeamMember) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="mt-4"><label className="label-style">Notes</label><textarea value={vendor.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="input-style min-h-[100px]"/></div>
            </section>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Vendor</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default VendorModal;