import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { TeamMember, Client } from '../../types';
import { TenderStatus, TeamMemberRole } from '../../types';
import { PlusIcon, BriefcaseIcon, SearchIcon, BanknotesIcon, UsersIcon, HashtagIcon } from '../icons';
import ClientModal from '../ClientModal';
import Clients from '../Clients';
import { formatCurrency, calculateTenderValue } from '../../utils';

type CrmDashboardProps = {
  store: ReturnType<typeof useTenderStore>;
  onSelectClient: (clientId: string) => void;
  currentUser: TeamMember;
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-800/80 p-5 rounded-lg border border-slate-700 flex items-start gap-4">
        <div className="p-3 rounded-full bg-slate-700/50">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);

const CrmDashboard: React.FC<CrmDashboardProps> = ({ store, onSelectClient, currentUser }) => {
    const { clients, watchlist, removeClient } = store;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const canEdit = currentUser.role === TeamMemberRole.ADMIN || currentUser.role === TeamMemberRole.MANAGER;

    const stats = useMemo(() => {
        const wonTenders = watchlist.filter(t => t.status === TenderStatus.WON);
        const activeOpportunities = watchlist.filter(t => [TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(t.status)).length;
        
        const totalWonValue = wonTenders.reduce((acc, t) => acc + calculateTenderValue(t), 0);
        const averageDealSize = wonTenders.length > 0 ? totalWonValue / wonTenders.length : 0;
        
        const valueByClient = wonTenders.reduce((acc: Record<string, number>, t) => {
            if(t.financialDetails?.clientId) {
                acc[t.financialDetails.clientId] = (acc[t.financialDetails.clientId] || 0) + calculateTenderValue(t);
            }
            return acc;
        }, {} as Record<string, number>);

        const topClients = Object.entries(valueByClient)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([clientId, value]) => ({
                client: clients.find(c => c.id === clientId),
                value
            }));

        return {
            totalClients: clients.length,
            activeOpportunities,
            averageDealSize,
            topClients,
        };
    }, [clients, watchlist]);

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [clients, searchQuery]);

    const handleEditClient = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClient = (clientId: string) => {
        if (window.confirm('Are you sure you want to delete this client? This will also remove them from any associated tenders.')) {
            removeClient(clientId);
        }
    };
    
    const openAddModal = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Clients Dashboard</h1>
                    <p className="text-slate-400 mt-1">An overview of your customer relationships.</p>
                </div>
                {canEdit && (
                  <button onClick={openAddModal} className="btn-primary">
                      <PlusIcon className="w-5 h-5 mr-2"/> Add New Client
                  </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Clients" value={stats.totalClients} icon={<UsersIcon className="w-6 h-6 text-blue-400" />} />
                <StatCard title="Active Opportunities" value={stats.activeOpportunities} icon={<BriefcaseIcon className="w-6 h-6 text-yellow-400" />} />
                <StatCard title="Average Deal Size" value={formatCurrency(stats.averageDealSize)} icon={<BanknotesIcon className="w-6 h-6 text-green-400" />} />
                <StatCard title="Top Client Value" value={formatCurrency(stats.topClients[0]?.value || 0)} icon={<HashtagIcon className="w-6 h-6 text-indigo-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-white mb-4">Client Directory</h2>
                    <div className="relative mb-4">
                        <input type="text" placeholder="Search clients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-style pl-10" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <Clients 
                        clients={filteredClients}
                        onSelectClient={onSelectClient}
                        onEditClient={handleEditClient}
                        onDeleteClient={handleDeleteClient}
                        canEdit={canEdit}
                    />
                </div>
                <div>
                     <h2 className="text-xl font-semibold text-white mb-4">Top Clients by Value</h2>
                     <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-3">
                        {stats.topClients.map(({ client, value }) => client ? (
                            <div key={client.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-700/50">
                                <span className="font-medium text-slate-200">{client.name}</span>
                                <span className="font-semibold text-green-400">{formatCurrency(value)}</span>
                            </div>
                        ) : null)}
                     </div>
                </div>
            </div>
            
            <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} store={store} clientToEdit={editingClient} />
        </div>
    );
};

export default CrmDashboard;