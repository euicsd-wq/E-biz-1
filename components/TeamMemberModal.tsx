import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { TeamMemberRole, type TeamMember } from '../types';

type TeamMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  memberToEdit: TeamMember | null;
};

const emptyMember: Omit<TeamMember, 'id'> = {
    name: '',
    email: '',
    role: TeamMemberRole.MEMBER,
};

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, onClose, store, memberToEdit }) => {
  const [member, setMember] = useState(emptyMember);

  useEffect(() => {
    if (isOpen) {
      setMember(memberToEdit ? { ...memberToEdit } : emptyMember);
    }
  }, [isOpen, memberToEdit]);

  const handleChange = (field: keyof Omit<TeamMember, 'id'>, value: string) => {
    setMember(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberToEdit) {
      store.updateTeamMember(memberToEdit.id, member as TeamMember);
    } else {
      store.addTeamMember(member);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="label-style">Full Name</label>
              <input type="text" value={member.name} onChange={e => handleChange('name', e.target.value)} required className="input-style"/>
            </div>
            <div>
              <label className="label-style">Email Address</label>
              <input type="email" value={member.email} onChange={e => handleChange('email', e.target.value)} required className="input-style"/>
            </div>
            <div>
              <label className="label-style">Role</label>
              <select value={member.role} onChange={e => handleChange('role', e.target.value)} className="input-style">
                {Object.values(TeamMemberRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Member</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberModal;