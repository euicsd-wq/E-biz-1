import React, { useState, useRef, useEffect } from 'react';
import { TenderStatus, type TeamMember, type WatchlistItem } from '../types';
import { TeamMemberRole } from '../types';
import { ExternalLinkIcon, TrashIcon, EditIcon, SaveIcon } from './icons';
import { formatTenderDate, calculateRemainingDays, getRemainingDaysInfo, getInitials, generateHslColorFromString, getStatusColors } from '../utils';

const RemainingDaysBadge: React.FC<{ days: number }> = ({ days }) => {
  const { text, textColor, bgColor, ringColor, animation } = getRemainingDaysInfo(days);
  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${textColor} ${bgColor} ${ringColor} ${animation}`}>{text}</span>;
};

const StatusSelector: React.FC<{ currentStatus: TenderStatus; onStatusChange: (status: TenderStatus) => void; disabled: boolean; }> = ({ currentStatus, onStatusChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { bg, text } = getStatusColors(currentStatus);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (status: TenderStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative w-40" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${bg} ${text} ${!disabled ? `hover:ring-2 ${getStatusColors(currentStatus).ring}` : 'cursor-not-allowed opacity-70'}`}
      >
        <span>{currentStatus}</span>
        <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg">
          <ul className="py-1">
            {Object.values(TenderStatus).map(status => (
              <li key={status}>
                <button
                  onClick={() => handleSelect(status)}
                  className="flex items-center w-full px-3 py-2 text-sm text-left text-slate-200 hover:bg-slate-700"
                >
                  <span className={`w-3 h-3 rounded-full mr-3 ${getStatusColors(status).bg}`}></span>
                  {status}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

type WatchlistItemRowProps = {
  item: WatchlistItem;
  onStatusChange: (tenderId: string, status: TenderStatus) => void;
  onRemove: (tenderId: string) => void;
  onClosingDateChange: (tenderId: string, newDate: string) => void;
  onSelectTender: (item: WatchlistItem) => void;
  teamMembers: TeamMember[];
  currentUser: TeamMember;
};

export const WatchlistItemRow: React.FC<WatchlistItemRowProps> = ({
  item,
  onStatusChange,
  onRemove,
  onClosingDateChange,
  onSelectTender,
  teamMembers,
  currentUser,
}) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(item.tender.closingDate.split('T')[0]);

  const handleDateSave = () => {
    onClosingDateChange(item.tender.id, newDate);
    setIsEditingDate(false);
  };

  const remainingDays = calculateRemainingDays(item.tender.closingDate);
  const assignedMember = teamMembers.find(m => m.id === item.assignedTeamMemberId);
  const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

  return (
    <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-700/50 transition-colors">
      <div className="flex-grow cursor-pointer" onClick={() => onSelectTender(item)}>
        <h3 className="font-bold text-slate-100">{item.tender.title}</h3>
        <p className="text-xs text-slate-400 mt-1">{item.tender.source}</p>
      </div>
      <div className="w-full sm:w-auto flex-shrink-0 grid grid-cols-2 sm:flex sm:items-center gap-4">
        <div className="flex flex-col items-start sm:items-center">
            <span className="text-xs text-slate-500 mb-1">Closing</span>
            {isEditingDate ? (
            <div className="flex items-center gap-1">
                <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-slate-600 border border-slate-500 text-white text-xs rounded-md p-1 w-32"
                />
                <button onClick={handleDateSave} className="p-1 rounded-full hover:bg-green-500/20 text-green-400"><SaveIcon className="w-4 h-4" /></button>
            </div>
            ) : (
            <div className="flex items-center gap-1 group">
                <span className="font-medium text-slate-200">{formatTenderDate(item.tender.closingDate)}</span>
                {canEdit && <button onClick={() => setIsEditingDate(true)} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-blue-500/20 text-blue-400"><EditIcon className="w-4 h-4" /></button>}
            </div>
            )}
        </div>
        <div className="flex flex-col items-start sm:items-center">
            <span className="text-xs text-slate-500 mb-1">Remaining</span>
            <RemainingDaysBadge days={remainingDays} />
        </div>
        <div className="flex flex-col items-start sm:items-center">
            <span className="text-xs text-slate-500 mb-1">Assigned</span>
            {assignedMember ? (
                <div className="flex items-center gap-2" title={assignedMember.name}>
                    <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" 
                        style={{ backgroundColor: generateHslColorFromString(assignedMember.name) }}
                    >
                        {getInitials(assignedMember.name)}
                    </div>
                </div>
            ) : (
                <span className="text-xs text-slate-400">Unassigned</span>
            )}
        </div>
        <div className="flex flex-col items-start sm:items-center">
            <span className="text-xs text-slate-500 mb-1">Status</span>
            <StatusSelector
                currentStatus={item.status}
                onStatusChange={(status) => onStatusChange(item.tender.id, status)}
                disabled={!canEdit}
            />
        </div>
        <div className="flex items-center gap-1 col-span-2 justify-end sm:justify-start">
            <a href={item.tender.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors" aria-label="View original tender">
                <ExternalLinkIcon className="w-5 h-5"/>
            </a>
            {canEdit && (
                <button
                    onClick={(e) => {
                        // This is critical to prevent the row's main onClick (which opens the workspace) from firing.
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this tender?')) {
                            onRemove(item.tender.id);
                        }
                    }}
                    className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    aria-label="Remove from watchlist"
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};