import React, { useState, useMemo, useCallback, useRef } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { Client, TeamMember, WatchlistItem, Contact, Interaction, ClientDocument } from '../../types';
import { InteractionType, TeamMemberRole, TenderStatus, ClientDocumentCategory } from '../../types';
import { ArrowLeftIcon, BriefcaseIcon, UsersIcon, ChatBubbleLeftRightIcon, PlusIcon, EditIcon, TrashIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, DocumentTextIcon, UploadIcon, DocumentDownloadIcon } from '../icons';
import ClientModal from '../ClientModal';
import ContactModal from './ContactModal';
import { formatTimeAgo, getStatusColors, formatTenderDate, formatCurrency, calculateTenderValue } from '../../utils';

type ClientDetailViewProps = {
  client: Client;
  store: ReturnType<typeof useTenderStore>;
  onBack: () => void;
  currentUser: TeamMember;
  onSelectTender: (item: WatchlistItem) => void;
};

type DetailTab = 'overview' | 'opportunities' | 'contacts' | 'interactions' | 'documents';

const ClientDetailView: React.FC<ClientDetailViewProps> = ({ client, store, onBack, currentUser, onSelectTender }) => {
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [newInteraction, setNewInteraction] = useState({ type: InteractionType.NOTE, notes: '' });
    
    // For document uploads
    const [dragIsOver, setDragIsOver] = useState(false);
    const [uploadCategory, setUploadCategory] = useState<ClientDocumentCategory>(ClientDocumentCategory.CONTRACT);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const clientOpportunities = useMemo(() => {
        return store.watchlist.filter(item => item.financialDetails?.clientId === client.id)
    }, [store.watchlist, client.id]);
    
    const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    const handleFiles = useCallback((files: FileList) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64Data = loadEvent.target?.result as string;
                store.addClientDocument(client.id, { name: file.name, data: base64Data, type: file.type }, uploadCategory, currentUser.id);
            };
            reader.readAsDataURL(file);
        });
    }, [store, client.id, uploadCategory, currentUser.id]);

    const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragIsOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
        if (e.target) (e.target as HTMLInputElement).value = '';
    };

    const handleAddContact = () => {
        setEditingContact(null);
        setIsContactModalOpen(true);
    };

    const handleEditContact = (contact: Contact) => {
        setEditingContact(contact);
        setIsContactModalOpen(true);
    };

    const handleInteractionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newInteraction.notes.trim()) {
            store.addInteractionToClient(client.id, {
                ...newInteraction,
                date: new Date().toISOString(),
                authorId: currentUser.id
            });
            setNewInteraction({ type: InteractionType.NOTE, notes: '' });
        }
    };

    const clientStats = useMemo(() => {
        const won = clientOpportunities.filter(o => o.status === TenderStatus.WON);
        const totalValue = won.reduce((sum, o) => sum + calculateTenderValue(o), 0);
        return {
            totalOpportunities: clientOpportunities.length,
            wonOpportunities: won.length,
            totalValue: totalValue
        };
    }, [clientOpportunities]);

    const TABS = [
        { id: 'overview', label: 'Overview', icon: BuildingOfficeIcon },
        { id: 'opportunities', label: 'Opportunities', icon: BriefcaseIcon },
        { id: 'contacts', label: 'Contacts', icon: UsersIcon },
        { id: 'interactions', label: 'Interactions', icon: ChatBubbleLeftRightIcon },
        { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    ];
    
    return (
        <div>
            <button onClick={onBack} className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white mb-4">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Clients
            </button>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">{client.name}</h1>
                    <p className="text-slate-400 mt-1">{client.address}</p>
                </div>
                {canEdit && <button onClick={() => setIsEditingClient(true)} className="btn-secondary text-sm">Edit Client</button>}
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
            
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 p-4 bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold text-white mb-2">Primary Contact</h4>
                        <p>{client.contactPerson}</p>
                        <p className="flex items-center gap-2 mt-1 text-sm text-slate-400"><EnvelopeIcon className="w-4 h-4"/>{client.email}</p>
                        <p className="flex items-center gap-2 mt-1 text-sm text-slate-400"><PhoneIcon className="w-4 h-4"/>{client.phone}</p>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                            <h5 className="text-sm text-slate-400">Total Opportunities</h5>
                            <p className="text-2xl font-bold text-white mt-1">{clientStats.totalOpportunities}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                            <h5 className="text-sm text-slate-400">Won</h5>
                            <p className="text-2xl font-bold text-green-400 mt-1">{clientStats.wonOpportunities}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                            <h5 className="text-sm text-slate-400">Total Value</h5>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(clientStats.totalValue)}</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'opportunities' && (
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50"><tr><th className="p-3 text-sm font-semibold text-slate-300">Tender</th><th className="p-3 text-sm font-semibold text-slate-300">Status</th><th className="p-3 text-sm font-semibold text-slate-300">Closing Date</th></tr></thead>
                        <tbody className="divide-y divide-slate-700">
                            {clientOpportunities.map(item => (
                                <tr key={item.tender.id} className="hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => onSelectTender(item)}>
                                    <td className="p-3 text-slate-400 font-medium text-slate-100">{item.tender.title}</td>
                                    <td className="p-3 text-slate-400"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColors(item.status).bg} ${getStatusColors(item.status).text}`}>{item.status}</span></td>
                                    <td className="p-3 text-slate-400">{formatTenderDate(item.tender.closingDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'contacts' && (
                 <div>
                    <div className="flex justify-end mb-4"><button onClick={handleAddContact} className="btn-primary text-sm"><PlusIcon className="w-4 h-4 mr-2"/>Add Contact</button></div>
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50"><tr><th className="p-3 text-sm font-semibold text-slate-300">Name</th><th className="p-3 text-sm font-semibold text-slate-300">Role</th><th className="p-3 text-sm font-semibold text-slate-300">Email</th><th className="p-3 text-sm font-semibold text-slate-300">Phone</th><th className="p-3 text-sm font-semibold text-slate-300"></th></tr></thead>
                            <tbody className="divide-y divide-slate-700">
                                {(client.contacts || []).map(contact => (
                                    <tr key={contact.id} className="hover:bg-slate-800 transition-colors">
                                        <td className="p-3 text-slate-400 font-medium text-slate-100">{contact.name}</td>
                                        <td className="p-3 text-slate-400">{contact.role}</td>
                                        <td className="p-3 text-slate-400">{contact.email}</td>
                                        <td className="p-3 text-slate-400">{contact.phone}</td>
                                        <td className="p-3 text-slate-400 text-right">
                                            <button onClick={() => handleEditContact(contact)} className="p-1"><EditIcon className="w-4 h-4 text-slate-400 hover:text-blue-400"/></button>
                                            <button onClick={() => store.removeContactFromClient(client.id, contact.id)} className="p-1"><TrashIcon className="w-4 h-4 text-slate-400 hover:text-red-400"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'interactions' && (
                <div>
                    <form onSubmit={handleInteractionSubmit} className="mb-6 bg-slate-800/50 p-4 rounded-lg">
                        <textarea value={newInteraction.notes} onChange={e => setNewInteraction(p => ({...p, notes: e.target.value}))} placeholder="Log an interaction..." className="input-style min-h-[80px] mb-2"/>
                        <div className="flex justify-between items-center">
                            <select value={newInteraction.type} onChange={e => setNewInteraction(p => ({...p, type: e.target.value as InteractionType}))} className="input-style w-40 text-sm">
                                {Object.values(InteractionType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button type="submit" className="btn-primary">Log Interaction</button>
                        </div>
                    </form>
                    <div className="space-y-4">
                        {(client.interactions || []).map(log => (
                            <div key={log.id} className="p-3 bg-slate-700/50 rounded-md">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{log.notes}</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-300 flex-shrink-0">{log.type}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">By {store.teamMembers.find(m => m.id === log.authorId)?.name} - {formatTimeAgo(log.date)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'documents' && (
                <div className="space-y-6">
                    <div 
                        onDragEnter={(e) => { e.preventDefault(); setDragIsOver(true); }} 
                        onDragLeave={() => setDragIsOver(false)} 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={handleFileDrop} 
                        className={`relative p-4 border-2 border-dashed rounded-md transition-colors ${dragIsOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'}`}
                    >
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileInput} className="hidden" />
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary"><UploadIcon className="w-5 h-5 mr-2" /> Upload</button>
                            <div className="flex items-center gap-2">
                                <label htmlFor="upload-cat" className="text-sm">Category:</label>
                                <select id="upload-cat" value={uploadCategory} onChange={e => setUploadCategory(e.target.value as ClientDocumentCategory)} className="input-style !py-1 !text-sm">
                                    {Object.values(ClientDocumentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {(client.documents || []).map((doc: ClientDocument) => (
                             <div key={doc.id} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-md">
                                <DocumentTextIcon className="w-6 h-6 text-slate-400 flex-shrink-0"/>
                                <div className="flex-grow min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-200">{doc.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{doc.category} &middot; Uploaded {formatTimeAgo(doc.uploadedAt)} by {store.teamMembers.find(m => m.id === doc.uploadedBy)?.name}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <a href={doc.fileData} download={doc.name} className="btn-icon" title="Download"><DocumentDownloadIcon className="w-4 h-4"/></a>
                                    <button onClick={() => store.removeClientDocument(client.id, doc.id)} className="btn-icon-danger" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                         {(client.documents || []).length === 0 && (
                            <p className="text-center py-8 text-slate-400">No documents uploaded for this client.</p>
                        )}
                    </div>
                </div>
            )}

            <ClientModal isOpen={isEditingClient} onClose={() => setIsEditingClient(false)} store={store} clientToEdit={client} />
            <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} store={store} contactToEdit={editingContact} clientId={client.id} />
        </div>
    );
};
export default ClientDetailView;
