import React, { useState, useCallback, useRef } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Vendor, TeamMember, VendorDocument } from '../types';
import { VendorDocumentCategory, TeamMemberRole } from '../types';
import { ArrowLeftIcon, BuildingOfficeIcon, DocumentTextIcon, EditIcon, UploadIcon, DocumentDownloadIcon, TrashIcon } from './icons';
import VendorModal from './VendorModal';
import { formatTimeAgo } from '../utils';

type VendorDetailViewProps = {
  vendor: Vendor;
  store: ReturnType<typeof useTenderStore>;
  onBack: () => void;
  currentUser: TeamMember;
};

type DetailTab = 'details' | 'documents';

const VendorDetailView: React.FC<VendorDetailViewProps> = ({ vendor, store, onBack, currentUser }) => {
    const [activeTab, setActiveTab] = useState<DetailTab>('details');
    const [isEditing, setIsEditing] = useState(false);
    const [dragIsOver, setDragIsOver] = useState(false);
    const [uploadCategory, setUploadCategory] = useState<VendorDocumentCategory>(VendorDocumentCategory.QUOTATION);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    const handleFiles = useCallback((files: FileList) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64Data = loadEvent.target?.result as string;
                store.addVendorDocument(vendor.id, { name: file.name, data: base64Data, type: file.type }, uploadCategory, currentUser.id);
            };
            reader.readAsDataURL(file);
        });
    }, [store, vendor.id, uploadCategory, currentUser.id]);

    const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragIsOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
        if (e.target) (e.target as HTMLInputElement).value = '';
    };

    const assignedMember = vendor.assignedTeamMemberId ? store.teamMembers.find(m => m.id === vendor.assignedTeamMemberId) : null;
    
    const TABS = [
        { id: 'details', label: 'Details', icon: BuildingOfficeIcon },
        { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    ];
    
    return (
        <div>
            <button onClick={onBack} className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white mb-4">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Vendors
            </button>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">{vendor.name}</h1>
                    <p className="text-slate-400 mt-1">{vendor.vendorType}</p>
                </div>
                {canEdit && activeTab === 'details' && <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm"><EditIcon className="w-4 h-4 mr-2"/>Edit Details</button>}
            </div>

            <div className="border-b border-slate-700/50 mb-6">
                <nav className="flex space-x-2 -mb-px overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as DetailTab)} className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}>
                            <tab.icon className="w-5 h-5 mr-2"/>{tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="p-4 bg-slate-800/50 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">Contact Information</h4>
                            <p><strong>Contact Person:</strong> {vendor.contactPerson}</p>
                            <p><strong>Email:</strong> {vendor.email}</p>
                            <p><strong>Phone:</strong> {vendor.phone}</p>
                            {vendor.whatsapp && <p><strong>WhatsApp:</strong> {vendor.whatsapp}</p>}
                            {vendor.website && <p><strong>Website:</strong> <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{vendor.website}</a></p>}
                        </div>
                         <div className="p-4 bg-slate-800/50 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">Address</h4>
                            <p>{vendor.address}</p>
                            <p>{vendor.city}, {vendor.country}</p>
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <div className="p-4 bg-slate-800/50 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">Internal Info</h4>
                            <p><strong>Assigned To:</strong> {assignedMember?.name || 'Unassigned'}</p>
                        </div>
                         <div className="p-4 bg-slate-800/50 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">Notes</h4>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{vendor.notes || 'No notes added.'}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'documents' && (
                <div className="space-y-6">
                     <div onDragEnter={(e) => { e.preventDefault(); setDragIsOver(true); }} onDragLeave={() => setDragIsOver(false)} onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop} className={`relative p-4 border-2 border-dashed rounded-md transition-colors ${dragIsOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'}`}>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary"><UploadIcon className="w-5 h-5 mr-2" /> Upload</button>
                            <div className="flex items-center gap-2">
                                <label htmlFor="upload-cat" className="text-sm">Category:</label>
                                <select id="upload-cat" value={uploadCategory} onChange={e => setUploadCategory(e.target.value as VendorDocumentCategory)} className="input-style !py-1 !text-sm"><option value="">Select Category</option>{Object.values(VendorDocumentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {(vendor.documents || []).map((doc: VendorDocument) => (
                             <div key={doc.id} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-md">
                                <DocumentTextIcon className="w-6 h-6 text-slate-400 flex-shrink-0"/>
                                <div className="flex-grow min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-200">{doc.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{doc.category} &middot; Uploaded {formatTimeAgo(doc.uploadedAt)}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <a href={doc.fileData} download={doc.name} className="btn-icon" title="Download"><DocumentDownloadIcon className="w-4 h-4"/></a>
                                    <button onClick={() => store.removeVendorDocument(vendor.id, doc.id)} className="btn-icon-danger" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                         {(vendor.documents || []).length === 0 && (
                            <p className="text-center py-8 text-slate-400">No documents uploaded for this vendor.</p>
                        )}
                    </div>
                </div>
            )}

            <VendorModal isOpen={isEditing} onClose={() => setIsEditing(false)} store={store} vendorToEdit={vendor} />
        </div>
    );
};

export default VendorDetailView;