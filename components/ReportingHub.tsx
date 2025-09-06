import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember } from '../types';
import Analytics from './Analytics';
import TeamPerformance from './TeamPerformance';
import ProfitabilityAnalysis from './ProfitabilityAnalysis';
import { AnalyticsIcon, UsersGroupIcon, ChartBarIcon } from './icons';

type ReportingHubProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

type ReportingTab = 'tender-performance' | 'team-performance' | 'profitability-analysis';

const TABS = [
    { id: 'tender-performance', label: 'Tender Performance', icon: AnalyticsIcon },
    { id: 'team-performance', label: 'Team Performance', icon: UsersGroupIcon },
    { id: 'profitability-analysis', label: 'Profitability Analysis', icon: ChartBarIcon },
];

const ReportingHub: React.FC<ReportingHubProps> = ({ store, currentUser }) => {
    const [activeTab, setActiveTab] = useState<ReportingTab>('tender-performance');
    
    const renderContent = () => {
        switch (activeTab) {
            case 'team-performance':
                return <TeamPerformance store={store} currentUser={currentUser} />;
            case 'profitability-analysis':
                return <ProfitabilityAnalysis store={store} />;
            case 'tender-performance':
            default:
                return <Analytics store={store} currentUser={currentUser} />;
        }
    };
    
    return (
        <div>
            <div className="border-b border-slate-700/50 mb-6">
                <nav className="flex space-x-2 -mb-px overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ReportingTab)}
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
            
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default ReportingHub;