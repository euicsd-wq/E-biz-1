import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Client } from '../types';

type ClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  clientToEdit: Client | null;
};

const emptyClient: Omit<Client, 'id'> = {
    name: '',
    address: '',
    email: '',
    phone: '',
    contactPerson: '',
};

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, store, clientToEdit }) => {
  const [client, setClient] = useState(emptyClient);

  useEffect(() => {
    if (isOpen) {
      setClient(clientToEdit ? { ...clientToEdit } : emptyClient);
    }
  }, [isOpen, clientToEdit]);

  const handleChange = (field: keyof Omit<Client, 'id'>, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientToEdit) {
      store.updateClient(clientToEdit.id, client as Client);
    } else {
      store.addClient(client);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{clientToEdit ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="label-style">Client Name</label>
              <input type="text" value={client.name} onChange={e => handleChange('name', e.target.value)} required className="input-style"/>
            </div>
            <div>
              <label className="label-style">Address</label>
              <input type="text" value={client.address} onChange={e => handleChange('address', e.target.value)} className="input-style"/>
            </div>
             <div>
              <label className="label-style">Contact Person</label>
              <input type="text" value={client.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} className="input-style"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-style">Email</label>
                <input type="email" value={client.email} onChange={e => handleChange('email', e.target.value)} className="input-style"/>
              </div>
              <div>
                <label className="label-style">Phone</label>
                <input type="tel" value={client.phone} onChange={e => handleChange('phone', e.target.value)} className="input-style"/>
              </div>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Client</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;