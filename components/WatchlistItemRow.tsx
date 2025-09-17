import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TenderStatus, type TeamMember, type WatchlistItem } from '../types';
import { TeamMemberRole } from '../types';
import { ExternalLinkIcon, TrashIcon, EditIcon, SaveIcon, CancelIcon } from './icons';
import { formatTenderDate, calculateRemainingDays, getRemainingDaysInfo, getInitials, generateHslColorFromString, getStatusColors } from '../utils';

type WatchlistItemRowProps = {
  item: WatchlistItem;
  onStatusChange: (tenderId: string, status: TenderStatus) => void;
  onRemove: (itemId: string) => void;
  onClosingDateChange: (tenderId: string, newDate: string) => void;
  onSelectTender: (item: WatchlistItem) => void;
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  assignTenderToMember: (tenderId: string, memberId: string | null, assignerName: string) => void;
};

export const WatchlistItemRow: React.FC<WatchlistItemRowProps> = ({
  item,
  onStatusChange,
  onRemove,
  onClosingDateChange,
  onSelectTender,
  teamMembers,
  currentUser,
  assignTenderToMember,
}) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newClosingDate, setNewClosingDate] = useState(item.tender.closingDate.split('T')[0]);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const canManage = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;
  const remainingDays = calculateRemainingDays(item.tender.closingDate);
  const assignedMember = useMemo(() => teamMembers.find(m => m.id === item.assignedTeamMemberId), [teamMembers, item.assignedTeamMemberId]);

  useEffect(() => {
    if (isEditingDate && dateInputRef.current) {
        dateInputRef.current.focus();
    }
  }, [isEditingDate]);

  const handleDateSave = () => {
    if (newClosingDate) {
      onClosingDateChange(item.tender.id, newClosingDate);
    }
    setIsEditingDate(false);
  };
  
  const handleDateCancel = () => {
    setNewClosingDate(item.tender.closingDate.split('T')[0]);
    setIsEditingDate(false);
  };

  const statusColors = getStatusColors(item.status);
  const remainingDaysInfo = getRemainingDaysInfo(remainingDays);

  return (
    <div className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-800 transition-colors">
      <div className="col-span-12 md:col-span-5 cursor-pointer" onClick={() => onSelectTender(item)}>
        <p className="font-medium text-slate-100">{item.tender.title}</p>
        <p className="text-sm text-slate-400">{item.tender.source}</p>
      </div>
      <div className="col-span-6 md:col-span-2">
        {canManage ? (
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item.tender.id, e.target.value as TenderStatus)}
              className={`w-full text-sm rounded-md border-0 focus:ring-2 focus:ring-opacity-50 transition-colors ${statusColors.bg} ${statusColors.text} ${statusColors.ring}`}
              style={{ backgroundColor: 'transparent' }} // Let the Tailwind classes control bg
            >
              {Object.values(TenderStatus).map((status) => (
                <option key={status} value={status} style={{ backgroundColor: '#334155' }}>{status}</option>
              ))}
            </select>
        ) : (
             <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}>{item.status}</span>
        )}
      </div>
       <div className="col-span-6 md:col-span-2">
        {isEditingDate ? (
            <div className="flex items-center gap-1">
                <input
                    ref={dateInputRef}
                    type="date"
                    value={newClosingDate}
                    onChange={(e) => setNewClosingDate(e.target.value)}
                    className="input-style !p-1.5 text-sm w-full"
                />
                <button onClick={handleDateSave} className="btn-icon hover:bg-green-500/20"><SaveIcon className="w-4 h-4 text-green-400"/></button>
                <button onClick={handleDateCancel} className="btn-icon hover:bg-yellow-500/20"><CancelIcon className="w-4 h-4 text-yellow-400"/></button>
            </div>
        ) : (
            <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${remainingDaysInfo.bgColor} ${remainingDaysInfo.textColor}`}>
                    {remainingDaysInfo.text}
                </span>
                {canManage && <button onClick={() => setIsEditingDate(true)} className="btn-icon"><EditIcon className="w-4 h-4 text-slate-400"/></button>}
            </div>
        )}
      </div>
      <div className="col-span-6 md:col-span-2">
         {canManage ? (
            <select
              value={item.assignedTeamMemberId || ''}
              onChange={(e) => assignTenderToMember(item.tender.id, e.target.value || null, currentUser.name)}
              className="input-style w-full !p-2 text-sm"
            >
                <option value="">-- Unassigned --</option>
                {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                ))}
            </select>
         ) : (
            assignedMember ? (
                <div className="flex items-center gap-2" title={assignedMember.name}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: generateHslColorFromString(assignedMember.name) }}>
                        {getInitials(assignedMember.name)}
                    </div>
                    <span className="text-xs">{assignedMember.name}</span>
                </div>
            ) : <span className="text-xs text-slate-500">Unassigned</span>
         )}
      </div>
      <div className="col-span-6 md:col-span-1 flex justify-end gap-1">
        <a href={item.tender.link} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="View original tender">
          <ExternalLinkIcon className="w-5 h-5"/>
        </a>
        {canManage && (
            <button onClick={() => window.confirm("Are you sure?") && onRemove(item.id)} className="btn-icon-danger" aria-label="Remove tender from watchlist">
                <TrashIcon className="w-5 h-5"/>
            </button>
        )}
      </div>
    </div>
  );
};
