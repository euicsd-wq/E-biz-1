import React, { useState, useEffect, useRef } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Shipment, ShipmentDocument } from '../types';
import { ShipmentStatus, VendorType } from '../types';

type ShipmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  shipmentToEdit: Shipment | null;
  preselectedTenderId?: string;
};

const emptyShipment: Omit<Shipment, 'id'> = {
    tenderId: '',
    vendorId: '',
    status: ShipmentStatus.PENDING,
    awbNumber: '',
    trackingLink: '',
    pickupLocation: '',
    pickupDate: '',
    deliveryLocation: '',
    deliveryDate: '',
    cost: 0,
};

const fileToBase64 = (file: File): Promise<ShipmentDocument> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            name: file.name,
            data: reader.result as string,
            mimeType: file.type,
        });
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const ShipmentModal: React.FC<ShipmentModalProps> = ({ isOpen, onClose, store, shipmentToEdit, preselectedTenderId }) => {
  const [shipment, setShipment] = useState(emptyShipment);
  const awbInputRef = useRef<HTMLInputElement>(null);
  const podInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initialData = shipmentToEdit ? { ...shipmentToEdit } : { ...emptyShipment };
      if (preselectedTenderId && !shipmentToEdit) {
        initialData.tenderId = preselectedTenderId;
      }
      setShipment(initialData);
    }
  }, [isOpen, shipmentToEdit, preselectedTenderId]);

  const handleChange = (field: keyof Omit<Shipment, 'id' | 'awbDocument' | 'podDocument'>, value: string | number) => {
    setShipment(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'awbDocument' | 'podDocument') => {
      const file = e.target.files?.[0];
      if (file) {
          const doc = await fileToBase64(file);
          setShipment(prev => ({...prev, [docType]: doc}));
      }
      if(e.target) e.target.value = '';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shipment.tenderId && shipment.vendorId) {
        if (shipmentToEdit) {
            store.updateShipment(shipmentToEdit.id, shipment as Shipment);
        } else {
            store.addShipment(shipment);
        }
        onClose();
    } else {
        alert('Please select a tender and a logistics vendor.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{shipmentToEdit ? 'Edit Shipment' : 'Add New Shipment'}</h2>
                <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[85vh]">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                          <label className="label-style">Tender</label>
                          <select 
                              value={shipment.tenderId} 
                              onChange={e => handleChange('tenderId', e.target.value)} 
                              required 
                              disabled={!!preselectedTenderId}
                              className="input-style"
                          >
                              <option value="">-- Select a Tender --</option>
                              {store?.watchlist?.filter(t=>t.status === 'Won').map(item => <option key={item.tender.id} value={item.tender.id}>{item.tender.title}</option>)}
                          </select>
                      </div>
                      <div><label className="label-style">Logistics Vendor</label><select value={shipment.vendorId} onChange={e => handleChange('vendorId', e.target.value)} required className="input-style"><option value="">-- Select a Vendor --</option>{store.vendors.filter(v => v.vendorType === VendorType.LOGISTICS_PARTNER).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                    </div>

                    <div className="md:col-span-2 border-t border-slate-700 my-2"></div>
                    
                    <div><label className="label-style">AWB Number</label><input type="text" value={shipment.awbNumber} onChange={e => handleChange('awbNumber', e.target.value)} className="input-style"/></div>
                    <div><label className="label-style">Tracking Link</label><input type="url" placeholder="https://tracking.vendor.com/..." value={shipment.trackingLink || ''} onChange={e => handleChange('trackingLink', e.target.value)} className="input-style"/></div>
                    
                    <div className="md:col-span-2 border-t border-slate-700 my-2"></div>

                    <div><label className="label-style">Pickup Location</label><input type="text" value={shipment.pickupLocation} onChange={e => handleChange('pickupLocation', e.target.value)} className="input-style"/></div>
                    <div><label className="label-style">Pickup Date</label><input type="date" value={shipment.pickupDate} onChange={e => handleChange('pickupDate', e.target.value)} className="input-style"/></div>
                    <div><label className="label-style">Delivery Location</label><input type="text" value={shipment.deliveryLocation} onChange={e => handleChange('deliveryLocation', e.target.value)} className="input-style"/></div>
                    <div><label className="label-style">Delivery Date</label><input type="date" value={shipment.deliveryDate} onChange={e => handleChange('deliveryDate', e.target.value)} className="input-style"/></div>

                    <div className="md:col-span-2 border-t border-slate-700 my-2"></div>

                    <div><label className="label-style">Status</label><select value={shipment.status} onChange={e => handleChange('status', e.target.value)} className="input-style">{Object.values(ShipmentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label className="label-style">Cost (USD)</label><input type="number" value={shipment.cost} onChange={e => handleChange('cost', Number(e.target.value))} min="0" step="0.01" className="input-style"/></div>
                    
                    <div className="md:col-span-2 border-t border-slate-700 my-2"></div>
                    
                    <div>
                        <label className="label-style">AWB Document</label>
                        <button type="button" onClick={() => awbInputRef.current?.click()} className="btn-secondary w-full text-sm">Upload AWB</button>
                        <input type="file" ref={awbInputRef} onChange={e => handleFileChange(e, 'awbDocument')} className="hidden"/>
                        {shipment.awbDocument && <span className="text-xs text-slate-400 mt-1 block truncate">{shipment.awbDocument.name}</span>}
                    </div>
                    <div>
                        <label className="label-style">Proof of Delivery</label>
                        <button type="button" onClick={() => podInputRef.current?.click()} className="btn-secondary w-full text-sm">Upload POD</button>
                        <input type="file" ref={podInputRef} onChange={e => handleFileChange(e, 'podDocument')} className="hidden"/>
                        {shipment.podDocument && <span className="text-xs text-slate-400 mt-1 block truncate">{shipment.podDocument.name}</span>}
                    </div>
                </div>
                <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Shipment</button>
                </footer>
            </form>
        </div>
    </div>
  );
};

export default ShipmentModal;