import React, { useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { GlobalSearchResult, WatchlistItem, Client, CatalogItem } from '../types';
import { BriefcaseIcon, UsersIcon, CubeIcon, HashtagIcon } from './icons';

type GlobalSearchProps = {
  query: string;
  store: ReturnType<typeof useTenderStore>;
  onNavigate: (type: 'tender' | 'client' | 'catalog', id: string) => void;
  onClose: () => void;
};

const ResultIcon: React.FC<{ type: GlobalSearchResult['type'] }> = ({ type }) => {
    const iconMap = {
        tender: <BriefcaseIcon className="w-5 h-5 text-blue-400" />,
        client: <UsersIcon className="w-5 h-5 text-green-400" />,
        catalog: <CubeIcon className="w-5 h-5 text-yellow-400" />,
    };
    return iconMap[type] || <HashtagIcon className="w-5 h-5 text-slate-400" />;
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({ query, store, onNavigate, onClose }) => {
  const { watchlist, clients, catalog } = store;

  const results = useMemo((): GlobalSearchResult[] => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const allResults: GlobalSearchResult[] = [];

    // Search Tenders
    watchlist.forEach((item: WatchlistItem) => {
        if (item.tender.title.toLowerCase().includes(lowerQuery)) {
            allResults.push({ type: 'tender', id: item.tender.id, title: item.tender.title, subtitle: `Tender • ${item.status}`, item });
        }
    });

    // Search Clients
    clients.forEach((item: Client) => {
        if (item.name.toLowerCase().includes(lowerQuery) || item.contactPerson.toLowerCase().includes(lowerQuery)) {
            allResults.push({ type: 'client', id: item.id, title: item.name, subtitle: `Client • ${item.contactPerson}`, item });
        }
    });

    // Search Catalog
    catalog.forEach((item: CatalogItem) => {
        if (item.itemName.toLowerCase().includes(lowerQuery) || item.description.toLowerCase().includes(lowerQuery)) {
            allResults.push({ type: 'catalog', id: item.id, title: item.itemName, subtitle: `Catalog • ${item.category}`, item });
        }
    });

    return allResults.slice(0, 10); // Limit results
  }, [query, watchlist, clients, catalog]);

  if (!query || query.length < 2) {
    return (
        <div className="p-4 text-center text-sm text-slate-400">
            Start typing to search for tenders, clients, or catalog items.
        </div>
    );
  }
  
  const handleResultClick = (result: GlobalSearchResult) => {
    onNavigate(result.type, result.id);
    onClose();
  };

  return (
    <div>
        {results.length > 0 ? (
            <ul className="divide-y divide-slate-700">
                {results.map(result => (
                    <li key={`${result.type}-${result.id}`}>
                        <button 
                            onClick={() => handleResultClick(result)}
                            className="w-full text-left p-3 flex items-center gap-4 hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex-shrink-0"><ResultIcon type={result.type} /></div>
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-medium text-slate-100 truncate">{result.title}</p>
                                <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        ) : (
            <div className="p-4 text-center text-sm text-slate-400">No results found for "{query}".</div>
        )}
    </div>
  );
};

export default GlobalSearch;
