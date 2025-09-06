import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem, TeamMember, ManagedDocument } from '../types';
import { DocumentCategory } from '../types';
import { UploadIcon, TrashIcon, FolderIcon, DocumentTextIcon, SparklesIcon } from './icons';
import { formatTimeAgo } from '../utils';
import AIDocumentAnalysisModal from './AIDocumentAnalysisModal';

type DocumentManagerProps = {
  tenderId: string;
  store: ReturnType<typeof useTenderStore>;
  tender: WatchlistItem;
  currentUser: TeamMember;
};

const DocumentManager: React.FC<DocumentManagerProps> = ({ tenderId, store, tender, currentUser }) => {
  const [dragIsOver, setDragIsOver] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(DocumentCategory.CLIENT);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzingDoc, setAnalyzingDoc] = useState<ManagedDocument | null>(null);

  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64Data = loadEvent.target?.result as string;
        store.addDocument(tenderId, { name: file.name, data: base64Data, type: file.type }, uploadCategory, currentUser.name);
      };
      reader.readAsDataURL(file);
    });
  }, [store, tenderId, uploadCategory, currentUser.name]);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragIsOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleFiles]);
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  const documentsByCategory = useMemo(() => {
    return (tender.documents || []).reduce((acc, doc) => {
      (acc[doc.category] = acc[doc.category] || []).push(doc);
      return acc;
    }, {} as Record<DocumentCategory, ManagedDocument[]>);
  }, [tender.documents]);

  const categories = Object.values(DocumentCategory);

  return (
    <div className="space-y-6">
       <h2 className="text-xl font-semibold text-white">Document Hub</h2>
      <div 
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragIsOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragIsOver(false); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleFileDrop}
        className={`relative p-4 border-2 border-dashed rounded-lg transition-colors ${dragIsOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'}`}
      >
        <input type="file" multiple ref={fileInputRef} onChange={handleFileInput} className="hidden" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <UploadIcon className="w-10 h-10 text-slate-500"/>
            <div>
                <button onClick={() => fileInputRef.current?.click()} className="font-semibold text-blue-400 hover:text-blue-300">Click to upload</button>
                <span className="text-slate-400"> or drag and drop</span>
                 <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <label htmlFor="upload-category" className="text-sm text-slate-400">to category:</label>
                    <select id="upload-category" value={uploadCategory} onChange={e => setUploadCategory(e.target.value as DocumentCategory)} className="input-style !py-1.5 !text-sm !w-auto">
                        {categories.filter(c => c !== DocumentCategory.GENERATED).map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                </div>
            </div>
        </div>
        {dragIsOver && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white font-bold text-lg rounded-lg">Drop files to upload</div>}
      </div>

      {categories.map(category => {
          const docs = documentsByCategory[category] || [];
          if (docs.length === 0) return null;

          return (
              <details key={category} className="bg-slate-900/50 rounded-lg border border-slate-700" open>
                  <summary className="px-4 py-3 font-semibold text-white cursor-pointer hover:bg-slate-800/50 rounded-t-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <FolderIcon className="w-5 h-5 text-slate-400"/>
                          <span>{category}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700">{docs.length}</span>
                      </div>
                  </summary>
                  <div className="p-4 border-t border-slate-700">
                      {docs.length > 0 ? (
                          <div className="space-y-3">
                              {docs.map(doc => (
                                  <div key={doc.id} className="flex items-center gap-4 p-3 bg-slate-800/80 rounded-md border border-slate-700">
                                      <DocumentTextIcon className="w-6 h-6 text-slate-400 flex-shrink-0"/>
                                      <div className="flex-grow min-w-0">
                                          <a href={doc.fileData} download={doc.fileName} className="text-blue-400 hover:underline truncate block text-sm font-medium" title={doc.fileName}>
                                              {doc.fileName}
                                          </a>
                                          <p className="text-xs text-slate-500 mt-1">
                                              Uploaded by {doc.uploadedBy} {formatTimeAgo(doc.uploadedAt)}
                                          </p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                          <button
                                              onClick={() => setAnalyzingDoc(doc)}
                                              className={`btn-secondary text-sm px-3 py-1.5 flex items-center ${doc.analysis ? 'text-purple-300 border-purple-500/50' : ''}`}
                                          >
                                              <SparklesIcon className="w-4 h-4 mr-1.5" />
                                              {doc.analysis ? 'View Analysis' : 'Analyze'}
                                          </button>
                                          {!doc.isGenerated && (
                                              <button onClick={() => window.confirm('Are you sure?') && store.removeDocument(tenderId, doc.id, currentUser.name)} className="btn-icon-danger">
                                                  <TrashIcon className="w-4 h-4"/>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : null}
                  </div>
              </details>
          );
      })}

      {analyzingDoc && (
          <AIDocumentAnalysisModal
              isOpen={!!analyzingDoc}
              onClose={() => setAnalyzingDoc(null)}
              tenderId={tenderId}
              document={analyzingDoc}
              store={store}
          />
      )}
    </div>
  );
};

export default DocumentManager;