
import React, { useState, useEffect } from 'react';
import type { DocumentAnalysis, ManagedDocument } from '../types';
import type { useTenderStore } from '../hooks/useTenderStore';
import { SparklesIcon } from './icons';

type AIDocumentAnalysisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  document: ManagedDocument;
  store: ReturnType<typeof useTenderStore>;
};

const AIDocumentAnalysisModal: React.FC<AIDocumentAnalysisModalProps> = ({ isOpen, onClose, tenderId, document, store }) => {
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(document.analysis || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && document && !document.analysis) {
      setAnalysisResult(null);
      setError(null);
      setLoading(true);
      
      store.generateDocumentAnalysis(tenderId, document.id)
        .then(result => {
          setAnalysisResult(result);
        })
        .catch(err => {
          setError(err.message || 'An unknown error occurred.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (isOpen && document && document.analysis) {
        setAnalysisResult(document.analysis);
        setLoading(false);
        setError(null);
    }
  }, [isOpen, document, tenderId, store]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
                <SparklesIcon className="w-6 h-6 mr-3 text-purple-400"/>
                <h2 className="text-xl font-bold text-white">AI Document Analysis</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        <div className="p-6 flex-grow overflow-y-auto">
            <p className="text-sm text-slate-400 mb-4">Analysis for: <span className="font-semibold text-slate-200">{document.fileName}</span></p>
            {loading && (
                <div className="flex flex-col items-center justify-center h-48">
                    <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-4 text-slate-400">Analyzing document...</p>
                </div>
            )}
            {error && <div className="p-4 bg-red-500/20 text-red-300 rounded-md">{error}</div>}
            {analysisResult && (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-slate-100 mb-2">Summary</h4>
                        <p className="text-slate-300 text-sm">{analysisResult.summary}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-100 mb-2">Key Requirements</h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                            {analysisResult.keyRequirements.map((req, i) => <li key={i}>{req}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-100 mb-2">Deadlines</h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                            {analysisResult.deadlines.length > 0 ? analysisResult.deadlines.map((d, i) => <li key={i}>{d}</li>) : <li>No specific deadlines found.</li>}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-slate-100 mb-2">Risks & Red Flags</h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                            {analysisResult.risksOrRedFlags.length > 0 ? analysisResult.risksOrRedFlags.map((r, i) => <li key={i}>{r}</li>) : <li>No specific risks identified.</li>}
                        </ul>
                    </div>
                </div>
            )}
        </div>
        <footer className="p-4 flex justify-end gap-3 border-t border-slate-700/50 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-600 text-slate-200 hover:bg-slate-700">Close</button>
        </footer>
      </div>
    </div>
  );
};

export default AIDocumentAnalysisModal;
