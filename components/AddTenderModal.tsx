import React, { useState, useEffect, useRef } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Tender } from '../types';
import { PlusIcon, LinkIcon, UploadIcon, PencilSquareIcon, SparklesIcon } from './icons';
import { extractTenderDetailsFromUrl, extractTenderDetailsFromDocument } from '../services/aiService';

type AddTenderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  store: ReturnType<typeof useTenderStore>;
};

const AddTenderModal: React.FC<AddTenderModalProps> = ({ isOpen, onClose, store }) => {
  const [activeTab, setActiveTab] = useState<'link' | 'upload' | 'manual'>('link');
  const [tenderData, setTenderData] = useState<Partial<Tender>>({ title: '', summary: '', closingDate: '', link: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setActiveTab('link');
    setTenderData({ title: '', summary: '', closingDate: '', link: '' });
    setIsLoading(false);
    setError(null);
    setUrl('');
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleDataChange = (field: keyof Tender, value: string) => {
    setTenderData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAnalyzeUrl = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const details = await extractTenderDetailsFromUrl(url, store.aiConfig);
      setTenderData(details);
      setActiveTab('manual'); // Switch to manual tab for review
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileData = event.target?.result as string;
        const document = { fileData, mimeType: file.type };
        const details = await extractTenderDetailsFromDocument(document, store.aiConfig);
        setTenderData(details);
        setActiveTab('manual'); // Switch to manual tab for review
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { title, summary, closingDate, link } = tenderData;
    if (title?.trim() && closingDate) {
      store.addManualTender({ title, summary: summary || '', closingDate, link: link || '' });
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const TABS = [
    { id: 'link', label: 'From Link', icon: LinkIcon },
    { id: 'upload', label: 'Upload Document', icon: UploadIcon },
    { id: 'manual', label: 'Manual Entry', icon: PencilSquareIcon },
  ];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-slate-700 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
         <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-4"><PlusIcon className="inline-block w-6 h-6 mr-2"/> Add Tender</h2>
        
        <div className="border-b border-slate-700 mb-4">
            <nav className="flex space-x-2 -mb-px">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                        <tab.icon className="w-5 h-5"/> {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
          <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {activeTab === 'link' && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-slate-400">Paste a link to a tender page and let AI extract the details for you.</p>
                <div>
                  <label htmlFor="url" className="label-style">Tender URL</label>
                  <input type="url" id="url" value={url} onChange={e => setUrl(e.target.value)} required className="input-style" placeholder="https://..."/>
                </div>
                <button type="button" onClick={handleAnalyzeUrl} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Analyzing...' : <><SparklesIcon className="w-5 h-5 mr-2"/> Fetch & Analyze</>}
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              </div>
            )}
            {activeTab === 'upload' && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-slate-400">Upload an RFP, RFQ, or other tender document (PDF, DOCX, TXT) for AI analysis.</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt,image/*"/>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="btn-secondary w-full">
                  {isLoading ? 'Processing...' : <><UploadIcon className="w-5 h-5 mr-2"/> Select Document</>}
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              </div>
            )}
            {activeTab === 'manual' && (
               <div className="space-y-4 animate-fade-in">
                {tenderData.title && <p className="text-sm text-green-400 bg-green-500/10 p-2 rounded-md">AI has populated the fields below. Please review and edit as needed before adding.</p>}
                <div>
                  <label htmlFor="title" className="label-style">Tender Title</label>
                  <input type="text" id="title" value={tenderData.title} onChange={e => handleDataChange('title', e.target.value)} required className="input-style" />
                </div>
                <div>
                  <label htmlFor="summary" className="label-style">Summary</label>
                  <textarea id="summary" value={tenderData.summary} onChange={e => handleDataChange('summary', e.target.value)} className="input-style min-h-[100px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label htmlFor="closingDate" className="label-style">Closing Date</label>
                    <input type="date" id="closingDate" value={tenderData.closingDate?.split('T')[0]} onChange={e => handleDataChange('closingDate', e.target.value)} required className="input-style" />
                    </div>
                    <div>
                    <label htmlFor="link" className="label-style">Link (Optional)</label>
                    <input type="url" id="link" value={tenderData.link} onChange={e => handleDataChange('link', e.target.value)} className="input-style" />
                    </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-700/50 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!tenderData.title || !tenderData.closingDate}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Tender
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTenderModal;
