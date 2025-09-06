import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, TeamMember } from '../../types';
import { TenderStatus } from '../../types';
import { getStatusColors, calculateTenderValue, formatCurrency, getInitials, generateHslColorFromString } from '../../utils';

type SalesPipelineProps = {
  store: ReturnType<typeof useTenderStore>;
  onSelectTender: (item: WatchlistItem) => void;
};

const TenderKanbanCard: React.FC<{ 
    item: WatchlistItem; 
    clientName: string; 
    assignedMember: TeamMember | undefined;
    onSelectTender: (item: WatchlistItem) => void;
}> = ({ item, clientName, assignedMember, onSelectTender }) => {
    const value = calculateTenderValue(item);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('tenderId', item.tender.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onClick={() => onSelectTender(item)}
            className="bg-slate-700/50 p-3 rounded-md border border-slate-600 cursor-pointer hover:bg-slate-700 hover:border-blue-500/50 transition-all"
        >
            <h4 className="font-semibold text-slate-100 mb-2 text-sm">{item.tender.title}</h4>
            <p className="text-xs text-slate-400 mb-3 truncate" title={clientName}>{clientName}</p>
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-300">{formatCurrency(value)}</span>
                {assignedMember ? (
                    <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0" 
                        style={{ backgroundColor: generateHslColorFromString(assignedMember.name) }} 
                        title={`Assigned to ${assignedMember.name}`}
                    >
                        {getInitials(assignedMember.name)}
                    </div>
                ) : (
                    <div 
                        className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 text-xs flex-shrink-0"
                        title="Unassigned"
                    >?</div>
                )}
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    status: TenderStatus;
    tenders: WatchlistItem[];
    clientMap: Record<string, string>;
    teamMemberMap: Record<string, TeamMember>;
    onDrop: (tenderId: string, status: TenderStatus) => void;
    onSelectTender: (item: WatchlistItem) => void;
}> = ({ status, tenders, clientMap, teamMemberMap, onDrop, onSelectTender }) => {
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
        const tenderId = e.dataTransfer.getData('tenderId');
        if (tenderId) {
            onDrop(tenderId, status);
        }
    };

    return (
        <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={handleDrop}
            className={`w-80 flex-shrink-0 bg-slate-800/50 rounded-lg h-full flex flex-col transition-colors ${isOver ? 'bg-slate-700 ring-2 ring-blue-500' : ''}`}
        >
            <div className={`p-3 border-b-2 ${bg.replace('/30', '/50')}`} style={{borderColor: getStatusColors(status).ring.replace('ring-','').replace('/30', '')}}>
                 <h3 className={`font-bold text-md ${text}`}>{status} <span className="text-sm font-normal opacity-70">({tenders.length})</span></h3>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-grow">
                {tenders.map(item => {
                    const assignedMember = item.assignedTeamMemberId ? teamMemberMap[item.assignedTeamMemberId] : undefined;
                    return (
                        <TenderKanbanCard 
                            key={item.tender.id} 
                            item={item} 
                            clientName={clientMap[item.financialDetails?.clientId || ''] || 'No Client'} 
                            assignedMember={assignedMember}
                            onSelectTender={onSelectTender} 
                        />
                    );
                })}
            </div>
        </div>
    );
};


const SalesPipeline: React.FC<SalesPipelineProps> = ({ store, onSelectTender }) => {
    const { watchlist, clients, updateWatchlistStatus, teamMembers } = store;

    const pipelineTenders = useMemo(() => {
        return watchlist.filter(item => 
            [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(item.status)
        );
    }, [watchlist]);
    
    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
            acc[client.id] = client.name;
            return acc;
        }, {} as Record<string, string>);
    }, [clients]);

    const teamMemberMap = useMemo(() => {
        return teamMembers.reduce((acc, member) => {
            acc[member.id] = member;
            return acc;
        }, {} as Record<string, TeamMember>);
    }, [teamMembers]);

    const handleDrop = (tenderId: string, newStatus: TenderStatus) => {
        updateWatchlistStatus(tenderId, newStatus);
    };
    
    const columns: TenderStatus[] = [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED];

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Sales Pipeline</h1>
                <p className="text-slate-400 mt-1">Drag and drop tenders to update their status.</p>
            </div>
            <div className="flex-grow flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
                {columns.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tenders={pipelineTenders.filter(t => t.status === status)}
                        clientMap={clientMap}
                        teamMemberMap={teamMemberMap}
                        onDrop={handleDrop}
                        onSelectTender={onSelectTender}
                    />
                ))}
            </div>
        </div>
    );
};

export default SalesPipeline;
