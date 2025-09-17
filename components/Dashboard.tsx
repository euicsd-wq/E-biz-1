import React from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember, Task, WatchlistItem, View, ActivityLog } from '../types';
import { ActivityType, TeamMemberRole } from '../types';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatCurrency, formatTenderDate, getRemainingDaysInfo, getInitials, generateHslColorFromString, formatTimeAgo } from '../utils';
import { BriefcaseIcon, BanknotesIcon, CheckCircleIcon, ClipboardListIcon, PlusIcon, ClockIcon, UserCircleIcon, UsersGroupIcon, TagIcon, PencilSquareIcon } from './icons';
import { AddTenderModal } from './AddTenderModal';

type DashboardProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
  setView: (view: View) => void;
  onSelectTender: (item: WatchlistItem) => void;
};

// --- Sub-components for the new dashboard ---

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <div 
        className={`bg-slate-800/80 p-5 rounded-lg border border-slate-700 flex items-start gap-4 transition-all hover:border-blue-500/50 hover:bg-slate-800 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="p-3 rounded-full bg-slate-700/50">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);

const TenderFunnel: React.FC<{ stats: Record<string, number> }> = ({ stats }) => {
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const max = Math.max(...Object.values(stats), 1);
    
    return (
        <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-4">Active Tender Pipeline</h3>
            <div className="space-y-3">
                {Object.entries(stats).map(([status, count]) => {
                    const percentage = total > 0 ? (count / max) * 100 : 0;
                    return (
                        <div key={status} className="flex items-center gap-4 text-sm group">
                            <span className="w-28 text-slate-300 font-medium flex-shrink-0">{status}</span>
                            <div className="w-full bg-slate-700/50 rounded-full h-5 relative">
                                <div className="h-5 rounded-full bg-blue-600 group-hover:bg-blue-500 transition-all duration-300" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="w-10 text-right font-semibold text-white">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
    const styles: Record<string, { icon: React.FC<any>, color: string }> = {
        [ActivityType.TENDER_ADDED]: { icon: PlusIcon, color: 'bg-green-500/20 text-green-400' },
        [ActivityType.STATUS_CHANGE]: { icon: TagIcon, color: 'bg-blue-500/20 text-blue-400' },
        [ActivityType.NOTE_UPDATED]: { icon: PencilSquareIcon, color: 'bg-yellow-500/20 text-yellow-400' },
        [ActivityType.TASK_ASSIGNED]: { icon: ClipboardListIcon, color: 'bg-cyan-500/20 text-cyan-400' },
        [ActivityType.TENDER_ASSIGNED]: { icon: UsersGroupIcon, color: 'bg-purple-500/20 text-purple-400' },
    };
    const { icon: Icon, color } = styles[type] || { icon: ClockIcon, color: 'bg-slate-600/50 text-slate-300' };
    return <div className={`p-2 rounded-full ${color}`}><Icon className="h-4 w-4" /></div>;
};

const RecentActivity: React.FC<{ activity: ActivityLog[], store: DashboardProps['store'], onSelectTender: DashboardProps['onSelectTender'] }> = ({ activity, store, onSelectTender }) => {
    const handleActivityClick = (log: ActivityLog) => {
        const tender = store.watchlist.find(item => item.tender.id === log.tenderId);
        if (tender) onSelectTender(tender);
    };
    
    return (
        <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-slate-400"/>Recent Activity</h3>
            <div className="space-y-4">
                {activity.length > 0 ? activity.map(log => (
                    <div key={log.id} onClick={() => handleActivityClick(log)} className="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded-md hover:bg-slate-700/50">
                        <ActivityIcon type={log.type} />
                        <div className="flex-grow">
                            <p className="text-sm text-slate-200">{log.description}</p>
                            <p className="text-xs text-slate-500">{formatTimeAgo(log.timestamp)}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-slate-500 py-4">No recent activity.</p>}
            </div>
        </div>
    );
};

const UpcomingDeadlineItem: React.FC<{ item: WatchlistItem & { remainingDays: number }, onSelectTender: (item: WatchlistItem) => void }> = ({ item, onSelectTender }) => {
    const { text, textColor } = getRemainingDaysInfo(item.remainingDays);
    return (
        <div onClick={() => onSelectTender(item)} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-700/50 cursor-pointer -mx-3">
            <div className="truncate pr-4">
                <p className="text-sm font-medium text-slate-200 truncate">{item.tender.title}</p>
                <p className="text-xs text-slate-500">{formatTenderDate(item.tender.closingDate)}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${textColor}`}>{text}</span>
        </div>
    );
};

const PriorityTaskItem: React.FC<{ task: Task, tenderTitle: string, assignedMember?: TeamMember }> = ({ task, tenderTitle, assignedMember }) => (
    <div className="flex items-center justify-between p-3 rounded-md hover:bg-slate-700/50 -mx-3">
        <div>
            <p className="text-sm font-medium text-slate-200">{task.title}</p>
            <p className="text-xs text-slate-500">{tenderTitle}</p>
        </div>
        <div className="flex items-center gap-2">
             <span className="text-xs text-slate-400">{formatTenderDate(task.dueDate)}</span>
             {assignedMember && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{ backgroundColor: generateHslColorFromString(assignedMember.name) }} title={assignedMember.name}>
                    {getInitials(assignedMember.name)}
                </div>
            )}
        </div>
    </div>
);


// --- Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({ store, currentUser, setView, onSelectTender }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const isMember = currentUser.role === TeamMemberRole.MEMBER;

    const { 
        activeTenders, totalRevenue, netProfit, pendingTasks, 
        upcomingDeadlines, priorityTasks, tenderFunnelStats, 
        recentActivity, myActiveTenders, myOpenTasks
    } = useDashboardStats(store, currentUser);

    const memberMap = React.useMemo(() => 
        store.teamMembers.reduce((acc, member) => {
            acc[member.id] = member;
            return acc;
        }, {} as Record<string, TeamMember>), 
    [store.teamMembers]);
    
    const tenderMap = React.useMemo(() => 
        store.watchlist.reduce((acc, item) => {
            acc[item.tender.id] = item.tender.title;
            return acc;
        }, {} as Record<string, string>), 
    [store.watchlist]);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Welcome, {currentUser.name.split(' ')[0]}</h1>
                    <p className="text-slate-400 mt-1">{isMember ? "Here's your personal workspace summary." : "Here's a snapshot of your operations today."}</p>
                </div>
                 <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2"/>Add Tender</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {!isMember && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <StatCard title="Active Tenders" value={activeTenders} icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />} onClick={() => setView('operations-hub')} />
                            <StatCard title="Pending Tasks" value={pendingTasks} icon={<CheckCircleIcon className="w-6 h-6 text-yellow-400" />} onClick={() => setView('operations-hub')} />
                            <StatCard title="Total Revenue (Paid)" value={formatCurrency(totalRevenue)} icon={<BanknotesIcon className="w-6 h-6 text-green-400" />} onClick={() => setView('finance-hub')} />
                            <StatCard title="Net Profit" value={formatCurrency(netProfit)} icon={<ClipboardListIcon className="w-6 h-6 text-indigo-400" />} onClick={() => setView('reporting-hub')} />
                        </div>
                    )}
                    {!isMember && <TenderFunnel stats={tenderFunnelStats} />}
                    <RecentActivity activity={recentActivity} store={store} onSelectTender={onSelectTender} />
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><UserCircleIcon className="w-5 h-5 text-cyan-400"/>My Workspace</h3>
                        <div className="flex justify-around">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-white">{myActiveTenders}</p>
                                <p className="text-xs text-slate-400 mt-1">My Active Tenders</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-bold text-white">{myOpenTasks}</p>
                                <p className="text-xs text-slate-400 mt-1">My Open Tasks</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-orange-400"/>Upcoming Deadlines</h3>
                        <div className="space-y-1">
                            {upcomingDeadlines.length > 0 ? (
                                upcomingDeadlines.map(item => <UpcomingDeadlineItem key={item.tender.id} item={item} onSelectTender={onSelectTender} />)
                            ) : (
                                <p className="text-sm text-slate-500 text-center p-4">No deadlines in the next 7 days.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-yellow-400"/>Priority Tasks</h3>
                         <div className="space-y-1">
                            {priorityTasks.length > 0 ? (
                                priorityTasks.map(task => <PriorityTaskItem key={task.id} task={task} tenderTitle={tenderMap[task.tenderId] || 'N/A'} assignedMember={memberMap[task.assignedToId || '']} />)
                            ) : (
                                 <p className="text-sm text-slate-500 text-center p-4">No tasks due in the next 3 days.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <AddTenderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} store={store} />
        </div>
    );
};

export default Dashboard;