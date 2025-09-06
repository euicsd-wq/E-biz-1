import React, { useState, useMemo, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember, WatchlistItem, Vendor } from '../types';
import Vendors from './Vendors';
import { UsersGroupIcon, ViewColumnsIcon, UsersIcon } from './icons';
import CrmDashboard from './crm/CrmDashboard';
import ClientDetailView from './crm/ClientDetailView';
import SalesPipeline from './crm/SalesPipeline';
import VendorDetailView from './VendorDetailView';

type CrmHubProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
  onSelectTender: (item: WatchlistItem) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
};

type CrmView = 'directory' | 'pipeline' | 'vendors';

const CrmHub: React.FC<CrmHubProps> = ({ store, currentUser, onSelectTender, selectedClientId, setSelectedClientId }) => {
    const [view, setView] = useState<CrmView>('directory');
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    useEffect(() => {
        // If a client is selected from outside, switch to directory view
        if (selectedClientId) {
            setView('directory');
            setSelectedVendorId(null); // Ensure no vendor is also selected
        }
    }, [selectedClientId]);

    const selectedClient = useMemo(() => 
        store.clients.find(c => c.id === selectedClientId) || null
    , [store.clients, selectedClientId]);
    
    const selectedVendor = useMemo(() =>
        store.vendors.find(v => v.id === selectedVendorId) || null
    , [store.vendors, selectedVendorId]);

    const handleBackToDashboard = () => setSelectedClientId(null);
    const handleBackToVendors = () => setSelectedVendorId(null);
    
    const renderContent = () => {
        switch (view) {
            case 'pipeline':
                return <SalesPipeline store={store} onSelectTender={onSelectTender} />;
            case 'vendors':
                if (selectedVendor) {
                    return <VendorDetailView vendor={selectedVendor} store={store} onBack={handleBackToVendors} currentUser={currentUser} />;
                }
                return <Vendors store={store} currentUser={currentUser} onSelectVendor={setSelectedVendorId} />;
            case 'directory':
            default:
                if (selectedClient) {
                    return <ClientDetailView client={selectedClient} store={store} onBack={handleBackToDashboard} currentUser={currentUser} onSelectTender={onSelectTender} />;
                }
                return <CrmDashboard store={store} onSelectClient={setSelectedClientId} currentUser={currentUser} />;
        }
    };
    
    const handleSetView = (newView: CrmView) => {
        setSelectedClientId(null);
        setSelectedVendorId(null);
        setView(newView);
    };
    
    return (
        <div>
            <div className="border-b border-slate-700/50 mb-6">
                <nav className="flex space-x-2 -mb-px overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => handleSetView('directory')}
                        className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors
                            ${view === 'directory'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`
                        }
                    >
                       <UsersGroupIcon className="w-5 h-5 mr-2" />
                       Client Directory
                    </button>
                     <button
                        onClick={() => handleSetView('pipeline')}
                        className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors
                            ${view === 'pipeline'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`
                        }
                    >
                       <ViewColumnsIcon className="w-5 h-5 mr-2" />
                       Sales Pipeline
                    </button>
                    <button
                        onClick={() => handleSetView('vendors')}
                        className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors
                            ${view === 'vendors'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`
                        }
                    >
                       <UsersIcon className="w-5 h-5 mr-2" />
                       Vendors
                    </button>
                </nav>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default CrmHub;