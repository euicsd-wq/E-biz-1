import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem, TeamMember } from '../types';
import { DocumentType, DocumentCategory } from '../types';
import {
  ArrowLeftIcon, InformationCircleIcon, ShieldCheckIcon, ClipboardDocumentListIcon,
  DocumentTextIcon, DocumentDuplicateIcon, FolderIcon, ShoppingBagIcon,
  TruckIcon, CurrencyDollarIcon, ClockIcon, ChatBubbleLeftRightIcon
} from './icons';
import OverviewSection from './workspace/OverviewSection';
import RiskAssessmentSection from './RiskAssessmentSection';
import TasksSection from './workspace/TasksSection';
import QuotationSection from './workspace/QuotationSection';
import TechnicalOfferSection from './workspace/TechnicalOfferSection';
import DocumentManager from './DocumentManager';
import ProcurementSection from './workspace/ProcurementSection';
import LogisticsSection from './workspace/LogisticsSection';
import InvoicingSection from './workspace/InvoicingSection';
import ActivitySection from './workspace/ActivitySection';
import CollaborationSection from './workspace/CollaborationSection';
import { getStatusColors, calculateRemainingDays, getRemainingDaysInfo } from '../utils';
import { generatePdf } from '../services/pdfService';

type TenderWorkspaceProps = {
  selectedTender: WatchlistItem;
  store: ReturnType<typeof useTenderStore>;
  onBack: () => void;
  currentUser: TeamMember;
};

type WorkspaceView = 'overview' | 'risk' | 'tasks' | 'quotation' | 'technical' | 'documents' | 'procurement' | 'logistics' | 'invoicing' | 'activity' | 'collaboration';

const TenderWorkspace: React.FC<TenderWorkspaceProps> = ({ selectedTender, store, onBack, currentUser }) => {
    const [activeView, setActiveView] = useState<WorkspaceView>('overview');

    const navGroups = [
        {
            title: 'Planning',
            items: [
                { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
                { id: 'activity', label: 'Activity', icon: ClockIcon },
                { id: 'collaboration', label: 'Collaboration', icon: ChatBubbleLeftRightIcon },
                { id: 'tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
                { id: 'risk', label: 'Risk Assessment', icon: ShieldCheckIcon },
            ]
        },
        {
            title: 'Offer Preparation',
            items: [
                { id: 'quotation', label: 'Quotation', icon: DocumentTextIcon },
                { id: 'technical', label: 'Technical Offer', icon: DocumentDuplicateIcon },
                { id: 'documents', label: 'Documents', icon: FolderIcon },
            ]
        },
        {
            title: 'Post-Award',
            items: [
                { id: 'procurement', label: 'Procurement', icon: ShoppingBagIcon },
                { id: 'logistics', label: 'Delivery', icon: TruckIcon },
                { id: 'invoicing', label: 'Invoicing', icon: CurrencyDollarIcon },
            ]
        }
    ];

    const handleGenerateTechnicalPdf = async () => {
        try {
            const docToSave = await generatePdf(DocumentType.TECHNICAL_OFFER, selectedTender, store.companyProfile, store.clients, store.documentSettings);
            if (docToSave) {
                 store.addDocument(selectedTender.tender.id, docToSave, DocumentCategory.GENERATED, 'System', true);
                 store.addToast(`${docToSave.name} generated and saved to Documents.`, 'success');
            }
        } catch (error) {
             console.error("PDF generation failed", error);
             store.addToast(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    const renderView = () => {
        switch (activeView) {
            case 'overview':
                return <OverviewSection tender={selectedTender} store={store} currentUser={currentUser} />;
            case 'activity':
                return <ActivitySection activityLog={selectedTender.activityLog || []} />;
            case 'collaboration':
                return <CollaborationSection tender={selectedTender} store={store} currentUser={currentUser} />;
            case 'tasks':
                return <TasksSection tender={selectedTender} store={store} currentUser={currentUser} />;
            case 'risk':
                return <RiskAssessmentSection tender={selectedTender} store={store} />;
            case 'quotation':
                return <QuotationSection tender={selectedTender} store={store} />;
            case 'technical':
                return <TechnicalOfferSection tender={selectedTender} store={store} onGeneratePdf={handleGenerateTechnicalPdf} />;
            case 'documents':
                return <DocumentManager tenderId={selectedTender.tender.id} store={store} tender={selectedTender} currentUser={currentUser} />;
            case 'procurement':
                return <ProcurementSection tender={selectedTender} store={store} />;
            case 'logistics':
                return <LogisticsSection tender={selectedTender} store={store} />;
            case 'invoicing':
                return <InvoicingSection tender={selectedTender} store={store} />;
            default:
                return <OverviewSection tender={selectedTender} store={store} currentUser={currentUser} />;
        }
    };
    
    const remainingDays = calculateRemainingDays(selectedTender.tender.closingDate);
    const remainingDaysInfo = getRemainingDaysInfo(remainingDays);
    const statusColors = getStatusColors(selectedTender.status);


    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors flex-shrink-0" aria-label="Back to tenders list">
                        <ArrowLeftIcon />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-white truncate" title={selectedTender.tender.title}>{selectedTender.tender.title}</h1>
                        <p className="text-sm text-slate-400">{selectedTender.tender.source}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 self-end sm:self-center">
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}>
                        {selectedTender.status}
                    </span>
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${remainingDaysInfo.bgColor} ${remainingDaysInfo.textColor}`}>
                        {remainingDaysInfo.text}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-60 lg:w-64 flex-shrink-0">
                    <nav className="space-y-6">
                        {navGroups.map(group => (
                            <div key={group.title}>
                                <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{group.title}</h3>
                                <div className="mt-2 space-y-1">
                                    {group.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveView(item.id as WorkspaceView)}
                                            className={`relative flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                                activeView === item.id
                                                ? 'bg-slate-700/50 text-white'
                                                : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                                            }`}
                                        >
                                            <span className={`absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r-full transition-transform duration-300 ease-in-out ${activeView === item.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></span>
                                            <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${activeView === item.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                <main key={activeView} className="flex-1 bg-slate-800/80 p-6 rounded-lg border border-slate-700 min-w-0 animate-fade-in">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default TenderWorkspace;
