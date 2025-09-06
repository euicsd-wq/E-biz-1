

import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Task, TeamMember } from '../types';
import { TaskStatus } from '../types';
import { getInitials, generateHslColorFromString, formatTenderDate } from '../utils';

type TaskKanbanBoardProps = {
  tasks: Task[];
  store: ReturnType<typeof useTenderStore>;
  tenderMap: Record<string, string>;
};

const TaskCard: React.FC<{ task: Task, teamMember: TeamMember | undefined, tenderName: string }> = ({ task, teamMember, tenderName }) => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
    
    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.id);
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            className="bg-slate-700/50 p-3 rounded-md border border-slate-600 cursor-grab active:cursor-grabbing"
        >
            <p className="font-semibold text-slate-100 mb-2">{task.title}</p>
            <p className="text-xs text-slate-400 mb-3 truncate" title={tenderName}>{tenderName}</p>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {teamMember && (
                        <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs" 
                            style={{ backgroundColor: generateHslColorFromString(teamMember.name) }} 
                            title={teamMember.name}
                        >
                            {getInitials(teamMember.name)}
                        </div>
                    )}
                    <span className="text-xs text-slate-300">{teamMember?.name || 'Unassigned'}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOverdue ? 'text-red-300 bg-red-500/30' : 'text-slate-400'}`}>
                    {formatTenderDate(task.dueDate)}
                </span>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ 
    status: TaskStatus; 
    tasks: Task[]; 
    teamMembers: TeamMember[]; 
    tenderMap: Record<string, string>;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ status, tasks, teamMembers, tenderMap, onDrop }) => {
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
            className={`flex-1 bg-slate-800/50 rounded-lg p-3 transition-colors ${isOver ? 'bg-slate-700' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={handleDrop}
        >
            <h3 className="text-md font-bold text-white mb-4 px-2">{status} ({tasks.length})</h3>
            <div className="space-y-3 min-h-[200px]">
                {tasks.map(task => {
                    const assignedTo = teamMembers.find(m => m.id === task.assignedToId);
                    const tenderName = tenderMap[task.tenderId] || 'Unknown Project';
                    return <TaskCard key={task.id} task={task} teamMember={assignedTo} tenderName={tenderName} />;
                })}
            </div>
        </div>
    );
};

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ tasks, store, tenderMap }) => {
    const { teamMembers, updateTaskStatus } = store;

    const columns: { status: TaskStatus; tasks: Task[] }[] = [
        { status: TaskStatus.TODO, tasks: tasks.filter(t => t.status === TaskStatus.TODO) },
        { status: TaskStatus.IN_PROGRESS, tasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS) },
        { status: TaskStatus.COMPLETED, tasks: tasks.filter(t => t.status === TaskStatus.COMPLETED) },
    ];
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            updateTaskStatus(taskId, newStatus);
        }
    };

    return (
        <div className="flex gap-4">
            {columns.map(col => (
                <KanbanColumn 
                    key={col.status}
                    status={col.status}
                    tasks={col.tasks}
                    teamMembers={teamMembers}
                    tenderMap={tenderMap}
                    onDrop={(e) => handleDrop(e, col.status)}
                />
            ))}
        </div>
    );
};

export default TaskKanbanBoard;