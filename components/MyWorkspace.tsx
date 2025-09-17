import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember, WatchlistItem, Task } from '../types';
import { TenderStatus, TaskStatus, TeamMemberRole } from '../types';
import { ClipboardListIcon, CheckCircleIcon, ClockIcon, CalendarIcon, InformationCircleIcon, PlusIcon, ListViewIcon, ViewColumnsIcon, EditIcon, TrashIcon } from './icons';
import { WatchlistItemRow } from './WatchlistItemRow';
import { formatTenderDate, getInitials, generateHslColorFromString } from '../utils';
import Calendar from './Calendar';
import TaskModal from './TaskModal';
import TaskKanbanBoard from './TaskKanbanBoard';

type MyWorkspaceProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
  onSelectTender: (item: WatchlistItem) => void;
};

type WorkspaceTab = 'overview' | 'tasks' | 'calendar';

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number }> = ({ icon, title, value }) => (
    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700 flex items-center gap-4">
        <div className="p-3 rounded-full bg-slate-700/50">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);

const MyTasksBoard: React.FC<{store: ReturnType<typeof useTenderStore>, currentUser: TeamMember}> = ({ store, currentUser }) => {
    const { tasks, removeTask, watchlist, teamMembers } = store;
    const [taskView, setTaskView] = useState<'kanban' | 'list'>('kanban');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [projectFilter, setProjectFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('active');

    const myTasks = useMemo(() => 
        tasks.filter(task => task.assignedToId === currentUser.id || (currentUser.role !== TeamMemberRole.MEMBER && task.assignedToId === null))
    , [tasks, currentUser]);

    const filteredTasks = useMemo(() => {
        let filtered = [...myTasks];
        if (projectFilter !== 'all') {
            filtered = filtered.filter(t => t.tenderId === projectFilter);
        }
        if (statusFilter === 'active') {
            filtered = filtered.filter(t => t.status !== TaskStatus.COMPLETED);
        } else if (statusFilter === 'completed') {
            filtered = filtered.filter(t => t.status === TaskStatus.COMPLETED);
        }
        return filtered;
    }, [myTasks, projectFilter, statusFilter]);

    const tenderMap = useMemo(() => watchlist.reduce((acc, item) => {
        acc[item.tender.id] = item.tender.title;
        return acc;
    }, {} as Record<string, string>), [watchlist]);
    
    const projectsWithTasks = useMemo(() => {
        const projectIds = new Set(myTasks.map(t => t.tenderId));
        return watchlist.filter(w => projectIds.has(w.tender.id));
    }, [myTasks, watchlist]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg p-2">
                        <option value="all">All Projects</option>
                        {projectsWithTasks.map(p => <option key={p.tender.id} value={p.tender.id}>{p.tender.title}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg p-2">
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2" /> Add Task</button>
                    <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
                        <button onClick={() => setTaskView('list')} className={`p-1.5 rounded-md transition-colors ${taskView === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}><ListViewIcon className="w-5 h-5" /></button>
                        <button onClick={() => setTaskView('kanban')} className={`p-1.5 rounded-md transition-colors ${taskView === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}><ViewColumnsIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            {filteredTasks.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/80 rounded-lg border border-slate-700">
                    <p className="text-slate-400">No tasks match your filters.</p>
                </div>
            ) : taskView === 'list' ? (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                         <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-300">Task</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Project</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Due Date</th>
                                <th className="p-3 text-sm font-semibold text-slate-300">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-300"></th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-700">
                            {filteredTasks.map(task => (
                                <tr key={task.id} className="hover:bg-slate-800 transition-colors">
                                    <td className="p-3 text-slate-400 font-medium text-slate-100">{task.title}</td>
                                    <td className="p-3 text-slate-400 truncate max-w-xs" title={tenderMap[task.tenderId]}>{tenderMap[task.tenderId]}</td>
                                    <td className="p-3 text-slate-400">{formatTenderDate(task.dueDate)}</td>
                                    <td className="p-3 text-slate-400">{task.status}</td>
                                    <td className="p-3 text-slate-400 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }} className="btn-icon" aria-label="Edit task"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => removeTask(task.id)} className="btn-icon-danger" aria-label="Delete task"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <TaskKanbanBoard tasks={filteredTasks} store={store} tenderMap={tenderMap} />
            )}
            <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} store={store} taskToEdit={editingTask} currentUser={currentUser} />
        </div>
    );
};


const MyWorkspace: React.FC<MyWorkspaceProps> = ({ store, currentUser, onSelectTender }) => {
    const { watchlist, tasks, updateWatchlistStatus, removeFromWatchlist, updateTenderClosingDate, assignTenderToMember } = store;
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

    const myTenders = useMemo(() => 
        watchlist.filter(item => item.assignedTeamMemberId === currentUser.id)
    , [watchlist, currentUser.id]);

    const myTasks = useMemo(() => 
        tasks.filter(task => task.assignedToId === currentUser.id)
    , [tasks, currentUser.id]);

    const stats = useMemo(() => {
        const activeTenders = myTenders.filter(t => [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(t.status)).length;
        const tasksToDo = myTasks.filter(t => t.status !== TaskStatus.COMPLETED).length;
        const upcomingDeadlines = myTenders.filter(t => {
            const closingDate = new Date(t.tender.closingDate);
            const today = new Date();
            today.setHours(0,0,0,0);
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);
            return closingDate >= today && closingDate <= sevenDaysFromNow;
        }).length;

        return { activeTenders, tasksToDo, upcomingDeadlines };
    }, [myTenders, myTasks]);

    const renderContent = () => {
        switch (activeTab) {
            case 'calendar':
                return <Calendar store={store} onSelectTender={onSelectTender} />;
            case 'tasks':
                return <MyTasksBoard store={store} currentUser={currentUser} />;
            case 'overview':
            default:
                return (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <StatCard icon={<ClipboardListIcon className="w-6 h-6 text-blue-400" />} title="My Active Tenders" value={stats.activeTenders} />
                            <StatCard icon={<CheckCircleIcon className="w-6 h-6 text-yellow-400" />} title="My Tasks To Do" value={stats.tasksToDo} />
                            <StatCard icon={<ClockIcon className="w-6 h-6 text-orange-400" />} title="Upcoming Deadlines (7d)" value={stats.upcomingDeadlines} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">My Assigned Tenders</h2>
                            {myTenders.length === 0 ? (
                                <div className="text-center py-10 bg-slate-800/80 rounded-lg border border-slate-700">
                                    <p className="text-slate-400">You have no tenders assigned to you.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                                    <div className="divide-y divide-slate-700">
                                        {myTenders.map(item => (
                                            <WatchlistItemRow 
                                                key={item.id}
                                                item={item}
                                                onStatusChange={updateWatchlistStatus}
                                                onRemove={removeFromWatchlist}
                                                onClosingDateChange={updateTenderClosingDate}
                                                onSelectTender={onSelectTender}
                                                teamMembers={store.teamMembers}
                                                currentUser={currentUser}
                                                assignTenderToMember={assignTenderToMember}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
        { id: 'tasks', label: 'Tasks', icon: ViewColumnsIcon },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Workspace</h1>
            <p className="text-slate-400 mb-6">A summary of your assigned tenders, tasks, and schedule.</p>
            
            <div className="border-b border-slate-700/50 mb-6">
                <nav className="flex space-x-2 -mb-px overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                            className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`
                            }
                        >
                           <tab.icon className="w-5 h-5 mr-2" />
                           {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {renderContent()}
        </div>
    );
};

export default MyWorkspace;