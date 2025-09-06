import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { TaskStatus, type Task, type TeamMember } from '../types';

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  taskToEdit: Task | null;
  preselectedTenderId?: string;
  currentUser: TeamMember;
};

const emptyTask: Omit<Task, 'id'> = {
    title: '',
    description: '',
    tenderId: '',
    assignedToId: null,
    assignedById: null,
    dueDate: '',
    status: TaskStatus.TODO,
};

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, store, taskToEdit, preselectedTenderId, currentUser }) => {
  const [task, setTask] = useState(emptyTask);

  useEffect(() => {
    if (isOpen) {
      const initialData = taskToEdit ? { ...taskToEdit } : { ...emptyTask };
      if (preselectedTenderId && !taskToEdit) {
        initialData.tenderId = preselectedTenderId;
      }
      setTask(initialData);
    }
  }, [isOpen, taskToEdit, preselectedTenderId]);

  const handleChange = (field: keyof Omit<Task, 'id'>, value: string | null) => {
    setTask(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.title && task.tenderId) {
        if (taskToEdit) {
            store.updateTask(taskToEdit.id, task as Task);
        } else {
            store.addTask({...task, assignedById: currentUser.id });
        }
        onClose();
    } else {
        alert('Please provide a title and select a project.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div><label className="label-style">Title</label><input type="text" value={task.title} onChange={e => handleChange('title', e.target.value)} required className="input-style"/></div>
            <div><label className="label-style">Description</label><textarea value={task.description} onChange={e => handleChange('description', e.target.value)} className="input-style min-h-[100px]"/></div>
            <div>
                <label className="label-style">Project (Tender)</label>
                <select value={task.tenderId} onChange={e => handleChange('tenderId', e.target.value)} required disabled={!!preselectedTenderId} className="input-style">
                    <option value="">-- Select Project --</option>
                    {store?.watchlist?.map(w => <option key={w.tender.id} value={w.tender.id}>{w.tender.title}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label-style">Assigned To</label>
                    <select value={task.assignedToId ?? ''} onChange={e => handleChange('assignedToId', e.target.value || null)} className="input-style">
                        <option value="">-- Unassigned --</option>
                        {store.teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label-style">Assigned By</label>
                     <select value={task.assignedById ?? currentUser.id} className="input-style" disabled>
                        <option value={currentUser.id}>{currentUser.name}</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label-style">Due Date</label><input type="date" value={task.dueDate} onChange={e => handleChange('dueDate', e.target.value)} required className="input-style"/></div>
                <div>
                    <label className="label-style">Status</label>
                    <select value={task.status} onChange={e => handleChange('status', e.target.value)} className="input-style">
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Task</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;