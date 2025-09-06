import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember, WatchlistItem } from '../types';
import MyWorkspace from './MyWorkspace';
import TendersHub from './TendersHub';
import Procurement from './Procurement';
import Catalog from './Catalog';
import TenderDiscovery from './TenderDiscovery';
import Logistics from './Logistics';
import { UserCircleIcon, ClipboardListIcon, ShoppingBagIcon, CubeIcon, SearchIcon, TruckIcon } from './icons';

type OperationsHubProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
  onSelectTender: (item: WatchlistItem) => void;
};

type OperationsTab = 'tender-discovery' | 'tender-pipeline' | 'my-workspace' | 'procurement' | 'catalog' | 'logistics';

const TABS = [
    { id: 'tender-discovery', label: 'Tender Discovery', icon: SearchIcon },
    { id: 'tender-pipeline', label: 'Tender Pipeline', icon: ClipboardListIcon },
    { id: 'my-workspace', label: 'My Workspace', icon: UserCircleIcon },
    { id: 'procurement', label: 'Procurement', icon: ShoppingBagIcon },
    { id: 'catalog', label: 'Catalog', icon: CubeIcon },
    { id: 'logistics', label: 'Logistics', icon: TruckIcon },
];

const OperationsHub: React.FC<OperationsHubProps> = ({ store, currentUser, onSelectTender }) => {
    const [activeTab, setActiveTab] = useState<OperationsTab>('tender-discovery');
    
    const renderContent = () => {
        switch (activeTab) {
            case 'tender-discovery':
                return <TenderDiscovery store={store} />;
            case 'tender-pipeline':
                return <TendersHub store={store} currentUser={currentUser} onSelectTender={onSelectTender} />;
            case 'my-workspace':
                return <MyWorkspace store={store} currentUser={currentUser} onSelectTender={onSelectTender} />;
            case 'procurement':
                return <Procurement store={store} onSelectTender={onSelectTender} />;
            case 'catalog':
                return <Catalog store={store} currentUser={currentUser} />;
            case 'logistics':
                return <Logistics store={store} currentUser={currentUser} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-slate-700/50 mb-6">
                <nav className="flex space-x-2 -mb-px overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as OperationsTab)}
                            className={`whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`
                            }
                        >
                           <tab.icon className="w-5 h-5 mr-2" />
                           {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};

export default OperationsHub;
