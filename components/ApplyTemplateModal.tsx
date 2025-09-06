import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember, WatchlistItem } from '../types';

type ApplyTemplateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  tender: WatchlistItem;
  currentUser: TeamMember;
};

const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({ isOpen, onClose, store, tender, currentUser }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplateId) {
      store.applyTaskTemplate(tender.tender.id, selectedTemplateId, assignedToId, currentUser.id);
      onClose();
    } else {
      alert('Please select a template.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Apply Task Template</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="label-style">Select Template</label>
              <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} required className="input-style">
                <option value="">-- Choose a template --</option>
                {store.taskTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-style">Assign All Tasks To (Optional)</label>
              <select value={assignedToId ?? ''} onChange={e => setAssignedToId(e.target.value || null)} className="input-style">
                <option value="">-- Unassigned --</option>
                {store.teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Apply Template</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ApplyTemplateModal;