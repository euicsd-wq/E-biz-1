import React, { useState } from 'react';
import { useTenderStore } from './hooks/useTenderStore';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import TenderWorkspace from './components/TenderWorkspace';
import Header from './components/Header';
import Notifications from './components/Notifications';
import OperationsHub from './components/OperationsHub';
import CrmHub from './components/CrmHub';
import FinanceHub from './components/FinanceHub';
import ReportingHub from './components/ReportingHub';
import TenderDiscovery from './components/TenderDiscovery';
import MailClient from './components/MailClient'; // Import MailClient
import type { View, WatchlistItem, TeamMember } from './types';
import { TeamMemberRole } from './types';
import ToastProvider from './components/ToastProvider';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const tenderStore = useTenderStore();

  const selectedTender = tenderStore.watchlist.find(item => item.tender.id === selectedTenderId) || null;
  
  const currentUser = tenderStore.teamMembers.find(m => m.id === tenderStore.currentUserId) || null;
  const effectiveUser: TeamMember = currentUser || { id: 'default-admin', name: 'Admin', email: '', role: TeamMemberRole.ADMIN };

  const handleSelectTender = (item: WatchlistItem) => {
    setSelectedClientId(null);
    setSelectedTenderId(item.tender.id);
  };

  const handleBack = () => {
    setSelectedTenderId(null);
  };

  const handleNavigate = (type: 'tender' | 'client' | 'catalog', id: string) => {
      setSelectedTenderId(null);
      setSelectedClientId(null);
      
      if (type === 'tender') {
          setSelectedTenderId(id);
      } else if (type === 'client') {
          setView('crm-hub');
          setSelectedClientId(id);
      } else if (type === 'catalog') {
          setView('operations-hub');
      }
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <TenderDiscovery store={tenderStore} />;
      case 'operations-hub':
        return <OperationsHub store={tenderStore} currentUser={effectiveUser} onSelectTender={handleSelectTender} />;
      case 'crm-hub':
        return <CrmHub store={tenderStore} currentUser={effectiveUser} onSelectTender={handleSelectTender} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} />;
      case 'finance-hub':
        return <FinanceHub store={tenderStore} currentUser={effectiveUser} onSelectTender={handleSelectTender} />;
      case 'reporting-hub':
        return <ReportingHub store={tenderStore} currentUser={effectiveUser} />;
      case 'settings':
        return <Settings store={tenderStore} currentUser={effectiveUser} />;
      case 'notifications':
        return <Notifications store={tenderStore} onNavigate={handleNavigate} />;
      case 'mail': // Add mail case
        return <MailClient store={tenderStore} setView={setView} />;
      default:
        return <TenderDiscovery store={tenderStore} />;
    }
  };

  return (
    <ToastProvider store={tenderStore}>
        <div className="relative min-h-screen font-sans text-slate-200 bg-slate-950 flex justify-center items-start">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxmaWx0ZXIgaWQ9Im4iPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIuNyIgcmVzdWx0PSJub2lzZSIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhYGNpdHk9IjAuMTIiLz48L3N2ZyPg==')] opacity-10"></div>
            
            <div className="flex min-h-screen relative z-10 w-full max-w-screen-2xl">
                <Sidebar currentView={view} setView={setView} currentUser={effectiveUser} />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header store={tenderStore} setView={setView} onNavigate={handleNavigate} />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {selectedTender ? (
                        <TenderWorkspace
                        key={selectedTender.tender.id}
                        selectedTender={selectedTender}
                        store={tenderStore}
                        onBack={handleBack}
                        currentUser={effectiveUser}
                        />
                    ) : (
                        renderView()
                    )}
                    </main>
                </div>
            </div>
        </div>
    </ToastProvider>
  );
};

export default App;
