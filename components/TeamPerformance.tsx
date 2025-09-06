import React, { useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember } from '../types';
import { TenderStatus, TaskStatus } from '../types';
import { generateHslColorFromString, getInitials } from '../utils';

type TeamPerformanceProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

const MiniStat: React.FC<{ title: string, value: string | number, color?: string }> = ({ title, value, color = 'text-white' }) => (
    <div className="bg-slate-800/50 p-3 rounded-lg text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <h4 className="text-xs font-medium text-slate-400">{title}</h4>
    </div>
);


const TeamPerformance: React.FC<TeamPerformanceProps> = ({ store }) => {
    const { teamMembers, watchlist, tasks } = store;

    const teamStats = useMemo(() => {
        return teamMembers.map(member => {
            const assignedTenders = watchlist.filter(t => t.assignedTeamMemberId === member.id);
            const wonTenders = assignedTenders.filter(t => t.status === TenderStatus.WON).length;
            const lostTenders = assignedTenders.filter(t => t.status === TenderStatus.LOST).length;
            const winRate = (wonTenders + lostTenders) > 0 ? (wonTenders / (wonTenders + lostTenders)) * 100 : 0;

            const assignedTasks = tasks.filter(t => t.assignedToId === member.id);
            const completedTasks = assignedTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
            const openTasks = assignedTasks.length - completedTasks;

            return {
                memberId: member.id,
                memberName: member.name,
                tendersAssigned: assignedTenders.length,
                tendersWon: wonTenders,
                winRate,
                tasksAssigned: assignedTasks.length,
                tasksCompleted: completedTasks,
                tasksOpen: openTasks,
            };
        });
    }, [teamMembers, watchlist, tasks]);
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Team Performance</h1>
            <div className="space-y-6">
                {teamStats.map(stats => (
                    <div key={stats.memberId} className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0" style={{ backgroundColor: generateHslColorFromString(stats.memberName) }}>
                                {getInitials(stats.memberName)}
                            </div>
                            <h3 className="font-bold text-xl text-white">{stats.memberName}</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <MiniStat title="Tenders Assigned" value={stats.tendersAssigned} />
                            <MiniStat title="Tenders Won" value={stats.tendersWon} />
                            <MiniStat title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="text-green-400" />
                            <MiniStat title="Open Tasks" value={stats.tasksOpen} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamPerformance;