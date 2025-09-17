import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember } from '../types';
import { TeamMemberRole } from '../types';
import { PlusIcon, UsersGroupIcon, TrashIcon, EditIcon } from './icons';
import TeamMemberModal from './TeamMemberModal';

type TeamProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

const Team: React.FC<TeamProps> = ({ store, currentUser }) => {
    const { teamMembers, removeTeamMember, currentUserId, setCurrentUserId } = store;
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    const canManageTeam = currentUser.role === TeamMemberRole.ADMIN;

    if (!canManageTeam) {
        return <p>You do not have permission to manage team members.</p>
    }

    const handleEdit = (member: TeamMember) => {
        setEditingMember(member);
        setIsTeamModalOpen(true);
    };

    const handleDelete = (memberId: string) => {
        if (memberId === currentUser.id) {
            store.addToast("You cannot delete your own account.", 'error');
            return;
        }
        if (window.confirm('Are you sure? This will unassign the member from all tenders and tasks.')) {
            removeTeamMember(memberId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Team & Permissions</h2>
                        <p className="text-sm text-slate-400 mt-1">Add, edit, or remove team members and manage their roles and permissions.</p>
                    </div>
                    <button 
                        onClick={() => { setEditingMember(null); setIsTeamModalOpen(true); }}
                        className="btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2"/> Add Member
                    </button>
                </div>
                
                {teamMembers.length === 0 ? (
                    <div className="text-center py-10">
                        <UsersGroupIcon className="mx-auto w-12 h-12 text-slate-500" />
                        <h3 className="text-lg font-medium text-white mt-4">No Team Members Yet</h3>
                        <p className="text-slate-400 mt-2">Add members to start assigning tasks and tenders.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-slate-300">Name</th>
                                    <th className="p-3 text-sm font-semibold text-slate-300">Email</th>
                                    <th className="p-3 text-sm font-semibold text-slate-300">Role</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {teamMembers.map(member => (
                                    <tr key={member.id} className="hover:bg-slate-800 transition-colors">
                                        <td className="p-3 font-medium text-slate-100">{member.name}</td>
                                        <td className="p-3 text-slate-400">{member.email}</td>
                                        <td className="p-3 text-slate-400">{member.role}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(member)} className="btn-icon"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleDelete(member.id)} disabled={member.id === currentUser.id} className="btn-icon-danger disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                <h2 className="text-xl font-semibold text-white">User Simulation</h2>
                <p className="text-sm text-slate-400 mb-4">Select a user to simulate their view of the application for testing permissions.</p>
                <div>
                    <label htmlFor="user-select" className="block text-sm font-medium text-slate-300 mb-1">Simulate View As</label>
                    <select id="user-select" value={currentUserId || 'admin'} onChange={e => setCurrentUserId(e.target.value === 'admin' ? null : e.target.value)} className="input-style">
                        <option value="admin">Admin (Default View)</option>
                        {teamMembers.map(member => (<option key={member.id} value={member.id}>{member.name} ({member.role})</option>))}
                    </select>
                </div>
            </div>

            <TeamMemberModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} store={store} memberToEdit={editingMember} />
        </div>
    );
};

export default Team;