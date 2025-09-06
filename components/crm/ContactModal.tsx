import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { Contact } from '../../types';

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  contactToEdit: Contact | null;
  clientId: string;
};

const emptyContact: Omit<Contact, 'id'> = {
    name: '',
    role: '',
    email: '',
    phone: '',
};

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, store, contactToEdit, clientId }) => {
  const [contact, setContact] = useState(emptyContact);

  useEffect(() => {
    if (isOpen) {
      setContact(contactToEdit ? { ...contactToEdit } : emptyContact);
    }
  }, [isOpen, contactToEdit]);

  const handleChange = (field: keyof Omit<Contact, 'id'>, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.name) {
        if (contactToEdit) {
            store.updateContactInClient(clientId, contact as Contact);
        } else {
            store.addContactToClient(clientId, contact);
        }
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Full Name</label><input type="text" value={contact.name} onChange={e => handleChange('name', e.target.value)} required className="input-style"/></div>
                <div><label className="label-style">Role / Title</label><input type="text" value={contact.role} onChange={e => handleChange('role', e.target.value)} className="input-style"/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label-style">Email</label><input type="email" value={contact.email} onChange={e => handleChange('email', e.target.value)} className="input-style"/></div>
              <div><label className="label-style">Phone</label><input type="tel" value={contact.phone} onChange={e => handleChange('phone', e.target.value)} className="input-style"/></div>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Contact</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;