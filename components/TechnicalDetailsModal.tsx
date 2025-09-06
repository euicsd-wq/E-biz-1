import React, { useState, useEffect } from 'react';
import type { QuoteItem, TechnicalDetails } from '../types';

type TechnicalDetailsModalProps = { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (updatedItem: QuoteItem) => void; 
    item: QuoteItem; 
    sopFields: { id: string; label: string; type: 'text' | 'textarea' }[];
};

const TechnicalDetailsModal: React.FC<TechnicalDetailsModalProps> = ({ isOpen, onClose, onSave, item, sopFields }) => {
    const [details, setDetails] = useState<TechnicalDetails>(item.technicalDetails || {});

    useEffect(() => {
        if (isOpen) {
            setDetails(item.technicalDetails || {});
        }
    }, [isOpen, item]);

    const handleChange = (fieldId: string, value: string) => {
        setDetails(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = () => {
        onSave({ ...item, technicalDetails: details });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 relative flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Technical Specifications</h2>
                    <p className="text-sm text-slate-400">For item: {item.description}</p>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {sopFields.map(field => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
                            {field.type === 'text' ? (
                                <input
                                    type="text"
                                    value={details[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className="input-style"
                                />
                            ) : (
                                <textarea
                                    value={details[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    className="input-style min-h-[80px]"
                                    rows={3}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <footer className="p-4 flex justify-end gap-3 border-t border-slate-700">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary">Save Specs</button>
                </footer>
            </div>
        </div>
    );
};

export default TechnicalDetailsModal;
