import React, { useState, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TaskTemplate, TaskTemplateItem } from '../types';
import { PlusIcon, TrashIcon } from './icons';

type TaskTemplateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
  templateToEdit: TaskTemplate | null;
};

const emptyTemplate: Omit<TaskTemplate, 'id'> = {
  name: '',
  tasks: [],
};

const TaskTemplateModal: React.FC<TaskTemplateModalProps> = ({ isOpen, onClose, store, templateToEdit }) => {
  const [template, setTemplate] = useState(emptyTemplate);

  useEffect(() => {
    if (isOpen) {
      setTemplate(templateToEdit ? { ...templateToEdit } : emptyTemplate);
    }
  }, [isOpen, templateToEdit]);

  const handleNameChange = (name: string) => {
    setTemplate(prev => ({ ...prev, name }));
  };

  const handleTaskChange = (index: number, field: keyof Omit<TaskTemplateItem, 'id'>, value: string | number) => {
    const updatedTasks = [...template.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setTemplate(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const addTask = () => {
    const newTask: TaskTemplateItem = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      dueDays: 7,
    };
    setTemplate(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const removeTask = (index: number) => {
    const updatedTasks = template.tasks.filter((_, i) => i !== index);
    setTemplate(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (template.name.trim() && template.tasks.length > 0) {
      if (templateToEdit) {
        store.updateTaskTemplate(templateToEdit.id, template as TaskTemplate);
      } else {
        store.addTaskTemplate(template);
      }
      onClose();
    } else {
      alert('Please provide a template name and at least one task.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{templateToEdit ? 'Edit Task Template' : 'Create Task Template'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
          <div className="p-6 flex-grow overflow-y-auto">
            <div className="mb-4">
              <label className="label-style">Template Name</label>
              <input type="text" value={template.name} onChange={e => handleNameChange(e.target.value)} required className="input-style"/>
            </div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-white">Tasks</h3>
                <button type="button" onClick={addTask} className="btn-secondary text-sm">
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Task
                </button>
            </div>
            <div className="space-y-4">
              {template.tasks.map((task, index) => (
                <div key={task.id} className="p-4 bg-slate-700/50 rounded-lg relative">
                  <button type="button" onClick={() => removeTask(index)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-400">
                    <TrashIcon className="w-4 h-4"/>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <label className="label-style text-xs">Title</label>
                        <input type="text" value={task.title} onChange={e => handleTaskChange(index, 'title', e.target.value)} required className="input-style text-sm p-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label-style text-xs">Description</label>
                        <input type="text" value={task.description} onChange={e => handleTaskChange(index, 'description', e.target.value)} className="input-style text-sm p-2" />
                    </div>
                    <div>
                        <label className="label-style text-xs">Due (days after)</label>
                        <input type="number" value={task.dueDays} onChange={e => handleTaskChange(index, 'dueDays', Number(e.target.value))} required min="0" className="input-style text-sm p-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <footer className="p-4 flex justify-end gap-3 border-t border-slate-700 bg-slate-800 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Template</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TaskTemplateModal;