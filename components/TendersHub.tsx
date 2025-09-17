import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem, TeamMember } from '../types';
import { TenderStatus, TeamMemberRole } from '../types';
import { ClipboardListIcon, PlusIcon, ArrowDownTrayIcon, ListViewIcon, ViewColumnsIcon, TrashIcon } from './icons';
import { AddTenderModal } from './AddTenderModal';
import { WatchlistItemRow } from './WatchlistItemRow';
import { exportToCsv, calculateRemainingDays, getRemainingDaysInfo, getStatusColors, getInitials, generateHslColorFromString } from '../utils';

type TendersHubProps = {
  store: ReturnType<typeof useTenderStore>;
  onSelectTender: (item: WatchlistItem) => void;
  currentUser: TeamMember;
};

type StatusFilter = 'watching' | 'active' | 'completed' | 'all';
type ViewMode = 'list' | 'kanban';

const TenderKanbanCard: React.FC<{ 
    item: WatchlistItem; 
    assignedMember: TeamMember | undefined;
    onSelectTender: (item: WatchlistItem) => void; 
    onRemove: (itemId: string) => void;
}> = ({ item, assignedMember, onSelectTender, onRemove }) => {
    const remainingDays = calculateRemainingDays(item.tender.closingDate);
    const { text, textColor } = getRemainingDaysInfo(remainingDays);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('watchlistId', item.id);
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onClick={() => onSelectTender(item)}
            className="bg-slate-700/50 p-3 rounded-md border border-slate-600 cursor-pointer hover:bg-slate-700 relative group"
        >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this tender?')) {
                        onRemove(item.id);
                    }
                }}
                className="absolute top-1 right-1 p-1.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Delete tender"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
            <h4 className="font-semibold text-slate-100 mb-2 text-sm pr-6">{item.tender.title}</h4>
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 truncate pr-2" title={item.tender.source}>{item.tender.source}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${textColor}`}>{text}</span>
            </div>
            <div className="flex justify-end mt-2">
                {assignedMember ? (
                    <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" 
                        style={{ backgroundColor: generateHslColorFromString(assignedMember.name) }} 
                        title={`Assigned to ${assignedMember.name}`}
                    >
                        {getInitials(assignedMember.name)}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-600" title="Unassigned" />
                )}
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    status: TenderStatus;
    tenders: WatchlistItem[];
    teamMemberMap: Record<string, TeamMember>;
    onDrop: (watchlistId: string, status: TenderStatus) => void;
    onSelectTender: (item: WatchlistItem) => void;
    onRemove: (itemId: string) => void;
}> = ({ status, tenders, teamMemberMap, onDrop, onSelectTender, onRemove }) => {
    const [isOver, setIsOver] = useState(false);
    const { bg, text } = getStatusColors(status);

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };
    const onDragLeave = () => setIsOver(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const watchlistId = e.dataTransfer.getData('watchlistId');
        if (watchlistId) {
            onDrop(watchlistId, status);
        }
    };

    return (
        <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={handleDrop}
            className={`w-72 flex-shrink-0 bg-slate-800/50 rounded-lg h-full flex flex-col transition-colors ${isOver ? 'bg-slate-700' : ''}`}
        >
            <div className={`p-3 border-b-2 ${bg.replace('/30', '/50')}`} style={{borderColor: getStatusColors(status).ring.replace('ring-','').replace('/30', '')}}>
                 <h3 className={`font-bold text-md ${text}`}>{status} <span className="text-sm font-normal opacity-70">({tenders.length})</span></h3>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-grow">
                {tenders.map(item => {
                     const assignedMember = item.assignedTeamMemberId ? teamMemberMap[item.assignedTeamMemberId] : undefined;
                    return <TenderKanbanCard key={item.id} item={item} assignedMember={assignedMember} onSelectTender={onSelectTender} onRemove={onRemove} />
                })}
            </div>
        </div>
    );
};

const TendersHub: React.FC<TendersHubProps> = ({ store, onSelectTender, currentUser }) => {
  const { watchlist, updateWatchlistStatus, removeFromWatchlist, updateTenderClosingDate, teamMembers, assignTenderToMember } = store;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [view, setView] = useState<ViewMode>('list');

  const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;
  
  const teamMemberMap = useMemo(() => {
    return teamMembers.reduce((acc, member) => {
        acc[member.id] = member;
        return acc;
    }, {} as Record<string, TeamMember>);
  }, [teamMembers]);

  const filteredTenders = useMemo(() => {
    let tenders = [...watchlist];

    // Role-based filtering
    if (currentUser.role === TeamMemberRole.MEMBER) {
      tenders = tenders.filter(item => item.assignedTeamMemberId === currentUser.id);
    }

    // Filter by status tab
    if (statusFilter === 'watching') {
        tenders = tenders.filter(item => item.status === TenderStatus.WATCHING);
    } else if (statusFilter === 'active') {
        tenders = tenders.filter(item => [TenderStatus.APPLYING, TenderStatus.SUBMITTED, TenderStatus.WATCHING].includes(item.status));
    } else if (statusFilter === 'completed') {
        tenders = tenders.filter(item => [TenderStatus.WON, TenderStatus.LOST, TenderStatus.ARCHIVED].includes(item.status));
    }

    // Filter by assigned member
    if (assignedToFilter !== 'all') {
        if (assignedToFilter === 'unassigned') {
            tenders = tenders.filter(item => !item.assignedTeamMemberId);
        } else {
            tenders = tenders.filter(item => item.assignedTeamMemberId === assignedToFilter);
        }
    }
    
    // Sort for list view
    if (view === 'list') {
      tenders.sort((a,b) => calculateRemainingDays(a.tender.closingDate) - calculateRemainingDays(b.tender.closingDate));
    }

    return tenders;
  }, [watchlist, statusFilter, assignedToFilter, currentUser, view]);

  const handleExport = () => {
    const dataToExport = filteredTenders.map(item => {
      const assignedMember = teamMembers.find(m => m.id === item.assignedTeamMemberId);
      const subtotal = item.quoteItems?.reduce((acc, q) => acc + (q.quantity * q.unitPrice), 0) ?? 0;
      const delivery = item.financialDetails?.deliveryCost ?? 0;
      const installation = item.financialDetails?.installationCost ?? 0;
      const vat = subtotal * ((item.financialDetails?.vatPercentage ?? 0) / 100);
      const total = subtotal + delivery + installation + vat;
      
      return {
        'Tender Title': item.tender.title,
        'Status': item.status,
        'Closing Date': new Date(item.tender.closingDate).toLocaleDateString(),
        'Assigned To': assignedMember ? assignedMember.name : 'Unassigned',
        'Quote Value': total.toFixed(2),
        'Source': item.tender.source,
      };
    });
    exportToCsv(dataToExport, `tenders_hub_export_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const statusTabs: {id: StatusFilter, label: string}[] = [
      { id: 'active', label: 'Active Pipeline' },
      { id: 'completed', label: 'Completed' },
      { id: 'all', label: 'All' },
  ];

  const handleDrop = (watchlistId: string, newStatus: TenderStatus) => {
      updateWatchlistStatus(watchlistId, newStatus);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-white">Tenders Hub</h1>
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleExport}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700">
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2"/>
                    Export CSV
                </button>
                {canEdit && (
                  <button 
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                      <PlusIcon className="w-5 h-5 mr-2"/>
                      Add Tender
                  </button>
                )}
            </div>
        </div>

        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex items-center border border-slate-700 rounded-lg p-1 bg-slate-800/80">
                {statusTabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === tab.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-4">
                {currentUser.role !== TeamMemberRole.MEMBER && (
                <div className="flex items-center gap-2">
                    <label htmlFor="assigned-to-filter" className="text-sm font-medium text-slate-300">Assigned To:</label>
                    <select 
                        id="assigned-to-filter"
                        value={assignedToFilter}
                        onChange={(e) => setAssignedToFilter(e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2.5 transition"
                    >
                        <option value="all">All Members</option>
                        <option value="unassigned">Unassigned</option>
                        {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                </div>
                )}
                <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
                    <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}><ListViewIcon className="w-5 h-5" /></button>
                    <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}><ViewColumnsIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>

      {filteredTenders.length === 0 ? (
         <div className="text-center flex-grow flex flex-col justify-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
            <ClipboardListIcon className="mx-auto w-12 h-12 text-slate-500" />
            <h3 className="text-xl font-medium text-white mt-4">No Tenders Match Your Criteria</h3>
            <p className="text-slate-400 mt-2">Try adjusting the filters or add tenders from the Dashboard.</p>
        </div>
      ) : view === 'list' ? (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="divide-y divide-slate-700">
                {filteredTenders.map(item => (
                    <WatchlistItemRow 
                        key={item.id}
                        item={item}
                        onStatusChange={updateWatchlistStatus}
                        onRemove={removeFromWatchlist}
                        onClosingDateChange={updateTenderClosingDate}
                        onSelectTender={onSelectTender}
                        teamMembers={teamMembers}
                        currentUser={currentUser}
                        assignTenderToMember={assignTenderToMember}
                    />
                ))}
            </div>
        </div>
      ) : (
        <div className="flex-grow flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
            {Object.values(TenderStatus).map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    tenders={filteredTenders.filter(t => t.status === status)}
                    teamMemberMap={teamMemberMap}
                    onDrop={handleDrop}
                    onSelectTender={onSelectTender}
                    onRemove={removeFromWatchlist}
                />
            ))}
        </div>
      )}

      <AddTenderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        store={store}
      />
    </div>
  );
};

export default TendersHub;