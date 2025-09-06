import React, { useState, useEffect } from 'react';
import type { Tender } from '../types';
import type { useTenderStore } from '../hooks/useTenderStore';
import { SparklesIcon } from './icons';
import { summarizeLivePage } from '../services/aiService';

type AISummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tender: Tender | null;
  store: ReturnType<typeof useTenderStore>;
};

const AISummaryModal: React.FC<AISummaryModalProps> = ({ isOpen, onClose, tender, store }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { aiConfig } = store;

  useEffect(() => {
    if (isOpen && tender) {
      setSummary('');
      setError(null);
      setLoading(true);

      if (!aiConfig.apiKey) {
        setError('AI provider is not configured. Please add an API key in the Settings page.');
        setLoading(false);
        return;
      }
      
      summarizeLivePage(tender.link, aiConfig)
        .then(result => {
          setSummary(result);
        })
        .catch(err => {
          setError(err.message || 'An unknown error occurred.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, tender, aiConfig]);

  if (!isOpen || !tender) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 relative flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 mr-3 text-purple-400"/>
              <h2 className="text-xl font-bold text-white">AI-Powered Summary</h2>
          </div>
          <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close modal"
          >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <div className="p-6 flex-grow overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{tender.title}</h3>
            {loading && (
                <div className="flex flex-col items-center justify-center h-48">
                    <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-slate-400">Fetching live page and generating summary...</p>
                </div>
            )}
            {error && <div className="p-4 bg-red-500/20 text-red-300 rounded-md">{error}</div>}
            {summary && (
                <div className="prose prose-sm prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                    {summary}
                </div>
            )}
        </div>

        <footer className="p-4 flex justify-end gap-3 border-t border-slate-700/50 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AISummaryModal;