import React from 'react';
import type { Client } from '../types';
import { BriefcaseIcon, EditIcon, TrashIcon } from './icons';

type ClientsProps = {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  canEdit: boolean;
};

const Clients: React.FC<ClientsProps> = ({ clients, onSelectClient, onEditClient, onDeleteClient, canEdit }) => {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
        <BriefcaseIcon className="mx-auto w-12 h-12 text-slate-500" />
        <h3 className="text-xl font-medium text-white mt-4">No Clients Found</h3>
        <p className="text-slate-400 mt-2">Add your first client to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clients.map(client => (
        <div key={client.id} className="bg-slate-800/80 p-5 rounded-lg border border-slate-700 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-white cursor-pointer hover:underline" onClick={() => onSelectClient(client.id)}>{client.name}</h3>
              {canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEditClient(client)} className="p-1.5 rounded-full hover:bg-blue-500/20 text-slate-400 hover:text-blue-400" aria-label={`Edit ${client.name}`}><EditIcon className="w-4 h-4" /></button>
                  <button onClick={() => onDeleteClient(client.id)} className="p-1.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400" aria-label={`Delete ${client.name}`}><TrashIcon className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">{client.contactPerson}</p>
            <p className="text-sm text-slate-400">{client.email}</p>
          </div>
          <button onClick={() => onSelectClient(client.id)} className="btn-secondary mt-4 text-sm w-full">
            View Details
          </button>
        </div>
      ))}
    </div>
  );
};

export default Clients;
