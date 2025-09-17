import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { TeamMemberRole, type TeamMember, type View } from '../types';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from '../constants';

type TeamMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  memberToEdit: TeamMember | null;
};

type MemberFormData = Omit<TeamMember, 'id'> & { password?: string };

const emptyMember: MemberFormData = {
    name: '',
    email: '',
    role: TeamMemberRole.MEMBER,
    password: '',
    permissions: ROLE_PERMISSIONS[TeamMemberRole.MEMBER],
};

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, onClose, store, memberToEdit }) => {
  const [member, setMember] = useState<MemberFormData>(emptyMember);

  useEffect(() => {
    if (isOpen) {
      setMember(memberToEdit ? { ...memberToEdit } : emptyMember);
    }
  }, [isOpen, memberToEdit]);

  const handleChange = (field: keyof MemberFormData, value: string) => {
    setMember(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (newRole: TeamMemberRole) => {
    setMember(prev => ({
        ...prev,
        role: newRole,
        permissions: ROLE_PERMISSIONS[newRole], // Set default permissions for the new role
    }));
  };
  
  const handlePermissionChange = (permissionId: View, isChecked: boolean) => {
    setMember(prev => {
        const newPermissions = new Set(prev.permissions);
        if (isChecked) {
            newPermissions.add(permissionId);
        } else {
            newPermissions.delete(permissionId);
        }
        return { ...prev, permissions: Array.from(newPermissions) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberToEdit) {
      const { password, ...memberData } = member;
      store.updateTeamMember(memberToEdit.id, memberData as TeamMember);
    } else {
      store.addTeamMember(member);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{memberToEdit ? 'Edit Team Member' : 'Invite New Team Member'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="label-style">Full Name</label>
              <input type="text" value={member.name} onChange={e => handleChange('name', e.target.value)} required className="input-style"/>
            </div>
            <div>
              <label className="label-style">Email Address</label>
              <input type="email" value={member.email} onChange={e => handleChange('email', e.target.value)} required className="input-style" disabled={!!memberToEdit} />
            </div>
            {!memberToEdit && (
              <div>
                <label className="label-style">Initial Password</label>
                <input type="password" value={member.password || ''} onChange={e => handleChange('password', e.target.value)} required className="input-style" />
              </div>
            )}
            <div>
              <label className="label-style">Role</label>
              <select value={member.role} onChange={e => handleRoleChange(e.target.value as TeamMemberRole)} className="input-style">
                {Object.values(TeamMemberRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            {/* Permissions Checklist for editing */}
            {memberToEdit && (
                 <div>
                    <label className="label-style">Permissions</label>
                    <p className="text-xs text-slate-400 mb-2">Changing the role will reset permissions to default for that role.</p>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/50 rounded-md border border-slate-700">
                        {ALL_PERMISSIONS.map(permission => (
                            <label key={permission.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600"
                                    checked={member.permissions?.includes(permission.id)}
                                    onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                />
                                <span className="text-sm text-slate-200">{permission.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
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