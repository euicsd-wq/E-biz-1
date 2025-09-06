import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, TeamMember, Task } from '../../types';
import { TaskStatus } from '../../types';
import TaskModal from '../TaskModal';
import ApplyTemplateModal from '../ApplyTemplateModal';
import { formatTenderDate, getInitials, generateHslColorFromString } from '../../utils';
import { PlusIcon, EditIcon, TrashIcon, ListViewIcon, ViewColumnsIcon, DocumentDuplicateIcon } from '../icons';

type TasksSectionProps = { 
    tender: WatchlistItem; 
    store: ReturnType<typeof useTenderStore>; 
    currentUser: TeamMember 
};

// --- Kanban Components ---
const KanbanTaskCard: React.FC<{ task: Task, teamMember: TeamMember | undefined, onEdit: () => void }> = ({ task, teamMember, onEdit }) => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
    
    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.id);
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onClick={onEdit}
            className="bg-slate-700/50 p-3 rounded-md border border-slate-600 cursor-pointer hover:bg-slate-700"
        >
            <p className="font-semibold text-slate-100 mb-2 text-sm">{task.title}</p>
            <div className="flex justify-between items-center">
                 <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOverdue ? 'text-red-300 bg-red-500/30' : 'text-slate-400'}`}>
                    {formatTenderDate(task.dueDate)}
                </span>
                {teamMember ? (
                    <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" 
                        style={{ backgroundColor: generateHslColorFromString(teamMember.name) }} 
                        title={teamMember.name}
                    >
                        {getInitials(teamMember.name)}
                    </div>
                ) : <div className="w-6 h-6 rounded-full bg-slate-600" title="Unassigned" />}
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ 
    status: TaskStatus; 
    tasks: Task[]; 
    teamMembers: TeamMember[]; 
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onEditTask: (task: Task) => void;
}> = ({ status, tasks, teamMembers, onDrop, onEditTask }) => {
    const [isOver, setIsOver] = useState(false);

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };
    
    const onDragLeave = () => setIsOver(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e);
    };

    return (
        <div 
            className={`flex-1 bg-slate-900/50 rounded-lg p-3 transition-colors ${isOver ? 'bg-slate-700' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={handleDrop}
        >
            <h3 className="text-md font-bold text-white mb-4 px-2">{status} ({tasks.length})</h3>
            <div className="space-y-3 min-h-[200px]">
                {tasks.map(task => {
                    const assignedTo = teamMembers.find(m => m.id === task.assignedToId);
                    return <KanbanTaskCard key={task.id} task={task} teamMember={assignedTo} onEdit={() => onEditTask(task)} />;
                })}
            </div>
        </div>
    );
};

// --- Main TasksSection Component ---
const TasksSection: React.FC<TasksSectionProps> = ({ tender, store, currentUser }) => {
    const { tasks, removeTask, updateTaskStatus, teamMembers } = store;
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const tenderTasks = useMemo(() => 
        tasks.filter(task => task.tenderId === tender.tender.id)
    , [tasks, tender.tender.id]);

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            updateTaskStatus(taskId, newStatus);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <h2 className="text-xl font-semibold text-white">Tasks</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsTemplateModalOpen(true)} className="btn-secondary text-sm"><DocumentDuplicateIcon className="w-4 h-4 mr-2"/> Apply Template</button>
                    <button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2" /> Add Task</button>
                    <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}><ListViewIcon className="w-5 h-5" /></button>
                        <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}><ViewColumnsIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            {tenderTasks.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
                    <p className="text-slate-400">No tasks created for this tender yet.</p>
                </div>
            ) : view === 'list' ? (
                <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-700/50 text-xs text-slate-300 uppercase">
                            <tr>
                                <th className="p-3">Task</th>
                                <th className="p-3">Assigned To</th>
                                <th className="p-3">Due Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {tenderTasks.map(task => {
                                const assignedTo = teamMembers.find(m => m.id === task.assignedToId);
                                return (
                                    <tr key={task.id} className="hover:bg-slate-800/50">
                                        <td className="p-3 font-medium text-slate-200">{task.title}</td>
                                        <td className="p-3 text-slate-400">{assignedTo?.name || 'Unassigned'}</td>
                                        <td className="p-3 text-slate-400">{formatTenderDate(task.dueDate)}</td>
                                        <td className="p-3"><select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value as TaskStatus)} className="input-style !p-1.5 !text-xs w-32"><option>To Do</option><option>In Progress</option><option>Completed</option></select></td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditTask(task)} className="btn-icon"><EditIcon className="w-4 h-4"/></button>
                                                <button onClick={() => removeTask(task.id)} className="btn-icon-danger"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex gap-4">
                    {Object.values(TaskStatus).map(status => (
                        <KanbanColumn 
                            key={status}
                            status={status}
                            tasks={tenderTasks.filter(t => t.status === status)}
                            teamMembers={teamMembers}
                            onDrop={(e) => handleDrop(e, status)}
                            onEditTask={handleEditTask}
                        />
                    ))}
                </div>
            )}

            <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} store={store} taskToEdit={editingTask} currentUser={currentUser} preselectedTenderId={tender.tender.id}/>
            <ApplyTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} store={store} tender={tender} currentUser={currentUser} />
        </div>
    );
};

export default TasksSection;