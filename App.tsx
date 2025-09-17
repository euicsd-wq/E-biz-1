import React, { useState, useMemo } from 'react';
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
import Dashboard from './components/Dashboard';
import MailClient from './components/MailClient';
import type { View, WatchlistItem, TeamMember } from './types';
import { TeamMemberRole } from './types';
import ToastProvider from './components/ToastProvider';
import { useAuth } from './contexts/Auth';
import Auth from './components/Auth';
import type { User } from '@supabase/supabase-js';
import { ALL_PERMISSIONS } from './constants';

const App: React.FC = () => {
  const { session, user } = useAuth();
  const tenderStore = useTenderStore(user as User | null);
  
  const [view, setView] = useState<View>('home');
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const selectedTender = tenderStore.watchlist.find(item => item.tender.id === selectedTenderId) || null;
  
  const currentUser: TeamMember = useMemo(() => {
    if (user) {
      const teamMemberProfile = tenderStore.teamMembers.find(m => m.id === user.id);
      if (teamMemberProfile) {
        return teamMemberProfile;
      }
    }
    // Fallback for initial load or if profile not found (should be rare)
    return {
      id: user?.id || 'admin-user',
      name: user?.user_metadata?.full_name || user?.email || 'Admin',
      email: user?.email || '',
      role: TeamMemberRole.ADMIN,
      permissions: ALL_PERMISSIONS.map(p => p.id), // Fallback admin gets all permissions
    };
  }, [tenderStore.teamMembers, user]);


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
    // Permission Check: Redirect to home if user doesn't have access
    const hasPermission = currentUser.role === TeamMemberRole.ADMIN || (currentUser.permissions && currentUser.permissions.includes(view));
    if (!hasPermission) {
        setView('home'); // or show an 'Access Denied' component
        // Render Dashboard immediately to avoid flicker
        return <Dashboard store={tenderStore} currentUser={currentUser} setView={setView} onSelectTender={handleSelectTender} />;
    }

    switch (view) {
      case 'home':
        return <Dashboard store={tenderStore} currentUser={currentUser} setView={setView} onSelectTender={handleSelectTender} />;
      case 'operations-hub':
        return <OperationsHub store={tenderStore} currentUser={currentUser} onSelectTender={handleSelectTender} />;
      case 'crm-hub':
        return <CrmHub store={tenderStore} currentUser={currentUser} onSelectTender={handleSelectTender} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} />;
      case 'finance-hub':
        return <FinanceHub store={tenderStore} currentUser={currentUser} onSelectTender={handleSelectTender} />;
      case 'reporting-hub':
        return <ReportingHub store={tenderStore} currentUser={currentUser} />;
      case 'settings':
        return <Settings store={tenderStore} currentUser={currentUser} />;
      case 'notifications':
        return <Notifications store={tenderStore} onNavigate={handleNavigate} />;
      case 'mail':
        return <MailClient store={tenderStore} setView={setView} />;
      default:
        return <Dashboard store={tenderStore} currentUser={currentUser} setView={setView} onSelectTender={handleSelectTender} />;
    }
  };
  
  if (!session) {
    return <Auth />;
  }

  return (
    <ToastProvider store={tenderStore}>
        <div className="relative min-h-screen font-sans text-slate-200 bg-slate-950 flex justify-center items-start">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxmaWx0ZXIgaWQ9Im4iPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIuNyIgcmVzdWx0PSJub2lzZSIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhYGNpdHk9IjAuMTIiLz48L3N2ZyPg==')] opacity-10"></div>
            
            <div className="flex min-h-screen relative z-10 w-full max-w-screen-2xl">
                <Sidebar currentView={view} setView={setView} currentUser={currentUser} />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header store={tenderStore} setView={setView} onNavigate={handleNavigate} />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {selectedTender ? (
                        <TenderWorkspace
                        key={selectedTender.tender.id}
                        selectedTender={selectedTender}
                        store={tenderStore}
                        onBack={handleBack}
                        currentUser={currentUser}
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