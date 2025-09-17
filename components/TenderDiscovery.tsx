import React, { useState, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { Tender, WatchlistItem, TeamMember, TeamMemberRole } from '../types';
import { ExternalLinkIcon, StarIcon, RefreshIcon, StarIconSolid, SearchIcon, FileSearchIcon, GridViewIcon, ListViewIcon, SparklesIcon, CalendarIcon, ClockIcon } from './icons';
import { formatTenderDate, formatTimeAgo, generateHslColorFromString, calculateRemainingDays, getRemainingDaysInfo } from '../../utils';
import AISummaryModal from './AISummaryModal';

type TenderDiscoveryProps = {
  store: ReturnType<typeof useTenderStore>;
  // FIX: Added 'currentUser' to props to receive the current user's data.
  currentUser: TeamMember;
};

const AssignTenderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (assignedTeamMemberId: string | null) => void;
    tender: Tender;
    teamMembers: TeamMember[];
}> = ({ isOpen, onClose, onConfirm, tender, teamMembers }) => {
    const [assignedId, setAssignedId] = useState<string | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">Assign Tender</h3>
                <p className="text-sm text-slate-400 mb-4 truncate" title={tender.title}>{tender.title}</p>
                <div>
                    <label htmlFor="assignee" className="label-style">Assign to Team Member</label>
                    <select id="assignee" value={assignedId || ''} onChange={(e) => setAssignedId(e.target.value || null)} className="input-style">
                        <option value="">-- Unassigned --</option>
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={() => onConfirm(assignedId)} className="btn-primary">Add to Watchlist</button>
                </div>
            </div>
        </div>
    );
};


const RemainingDaysBadge: React.FC<{ days: number }> = ({ days }) => {
  const { text, textColor, bgColor, ringColor, animation } = getRemainingDaysInfo(days);
  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors duration-300 ${textColor} ${bgColor} ${ringColor} ${animation}`}>{text}</span>;
};

const SkeletonCard: React.FC = () => (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700 animate-pulse flex flex-col">
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-slate-700 rounded w-3/4"></div>
                <div className="h-5 bg-slate-700 rounded w-1/6"></div>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg mb-4">
                 <div className="h-4 bg-slate-700 rounded w-full"></div>
                 <div className="h-4 bg-slate-700 rounded w-5/6 mt-2"></div>
            </div>
        </div>
        <div className="border-t border-slate-700/80 pt-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-8 bg-slate-700 rounded"></div>
                <div className="h-8 bg-slate-700 rounded"></div>
                <div className="h-8 bg-slate-700 rounded"></div>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="h-5 bg-slate-700 rounded w-24"></div>
                <div className="h-8 bg-slate-700 rounded-md w-36"></div>
            </div>
        </div>
    </div>
);

const SkeletonListItem: React.FC = () => (
    <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700 animate-pulse flex items-center gap-4">
        <div className="flex-grow space-y-3">
            <div className="h-5 bg-slate-700 rounded w-1/2"></div>
            <div className="border-t border-slate-700/80 mt-2 pt-2 grid grid-cols-3 gap-4">
                <div className="h-6 bg-slate-700 rounded"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
                <div className="h-6 bg-slate-700 rounded"></div>
            </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="h-6 bg-slate-700 rounded-full w-28"></div>
            <div className="h-8 bg-slate-700 rounded-md w-20"></div>
        </div>
    </div>
);

const TenderCard: React.FC<{ tender: Tender; onAdd: (tender: Tender) => void; onRemove: (watchlistItemId: string) => void; isWatched: boolean; watchlistItemId?: string; sourceColor: string; onSummarize: (tender: Tender) => void; }> = ({ tender, onAdd, onRemove, isWatched, watchlistItemId, sourceColor, onSummarize }) => {
    const remainingDays = calculateRemainingDays(tender.closingDate);
    const isClosed = remainingDays < 0;

    const handleToggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isWatched && watchlistItemId) {
            onRemove(watchlistItemId);
        } else {
            onAdd(tender);
        }
    };

    return (
         <div className={`
            relative rounded-xl p-px transition-all duration-300 group
            bg-slate-800/80
            hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/60
            ${isWatched ? 'bg-gradient-to-r from-blue-700 to-cyan-700 shadow-lg shadow-blue-900/80' : 'bg-slate-800/80'}
            ${isClosed && !isWatched ? 'opacity-60 saturate-50' : ''}
        `}>
            <div className="relative bg-slate-900/95 rounded-[11px] h-full flex flex-col justify-between p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <span 
                        title={tender.source}
                        className="font-semibold text-white/90 text-[11px] px-2.5 py-1 rounded-full inline-block max-w-[60%] truncate" 
                        style={{ backgroundColor: sourceColor, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                        {tender.source}
                    </span>
                    <RemainingDaysBadge days={remainingDays} />
                </div>
                
                {/* Body */}
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-slate-100 pr-4 mb-2">{tender.title}</h3>
                    <p className="text-sm text-slate-400 max-h-24 overflow-hidden mask-fadeout mb-4">{tender.summary}</p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-400 border-t border-slate-700/80 pt-3">
                        <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-slate-500"/> <span>Published: {formatTenderDate(tender.publishedDate)}</span></div>
                        <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-slate-500"/> <span>Closing: {formatTenderDate(tender.closingDate)}</span></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700/80 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <a href={tender.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
                                View <ExternalLinkIcon className="ml-1.5 w-4 h-4"/>
                            </a>
                            <button onClick={() => onSummarize(tender)} className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm font-medium gap-1.5">
                                <SparklesIcon className="w-4 h-4"/> AI Summary
                            </button>
                        </div>

                        <button
                            onClick={handleToggleWatchlist}
                            className={`
                                px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200
                                flex items-center justify-center
                                ${isWatched 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-slate-700 text-slate-200 hover:text-white group/btn relative overflow-hidden'
                                }
                            `}
                        >
                            {!isWatched && <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>}
                            
                            <span className="relative flex items-center">
                                {isWatched ? <StarIconSolid className="w-4 h-4 mr-2" /> : <StarIcon className="w-4 h-4 mr-2" />}
                                {isWatched ? 'Added' : 'Add'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <style>{`.mask-fadeout { mask-image: linear-gradient(to bottom, black 50%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%); }`}</style>
        </div>
    );
}

const TenderListItem: React.FC<{ tender: Tender; onAdd: (tender: Tender) => void; onRemove: (watchlistItemId: string) => void; isWatched: boolean; watchlistItemId?: string; sourceColor: string; onSummarize: (tender: Tender) => void; }> = ({ tender, onAdd, onRemove, isWatched, watchlistItemId, sourceColor, onSummarize }) => {
    const remainingDays = calculateRemainingDays(tender.closingDate);
    const isClosed = remainingDays < 0;

    const handleToggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isWatched && watchlistItemId) {
            onRemove(watchlistItemId);
        } else {
            onAdd(tender);
        }
    };

    return (
        <div className={`
            bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-slate-700
            grid grid-cols-12 items-center gap-4 transition-all duration-200
            hover:border-blue-500/40 hover:bg-slate-800 relative
            ${isClosed && !isWatched ? 'opacity-60 saturate-50' : ''}
        `}>
            {isWatched && <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-lg"></div>}
            <div className="col-span-12 md:col-span-5">
                <div className="flex items-center gap-4 mb-2">
                    <span 
                        title={tender.source}
                        className="px-2.5 py-0.5 rounded-full font-semibold text-white/90 text-[11px] inline-block max-w-full truncate" 
                        style={{ backgroundColor: sourceColor, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{tender.source}
                    </span>
                </div>
                <h3 className="text-md font-bold text-slate-100">{tender.title}</h3>
            </div>
            <div className="col-span-6 md:col-span-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-slate-500"/> <span>Published: {formatTenderDate(tender.publishedDate)}</span></div>
            </div>
             <div className="col-span-6 md:col-span-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-slate-500"/> <span>Closing: {formatTenderDate(tender.closingDate)}</span></div>
            </div>
            <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-2">
                <RemainingDaysBadge days={remainingDays} />
                <a href={tender.link} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="View tender"><ExternalLinkIcon className="w-5 h-5"/></a>
                <button onClick={() => onSummarize(tender)} className="btn-icon" aria-label="AI Summary"><SparklesIcon className="w-5 h-5"/></button>
                <button onClick={handleToggleWatchlist} className="btn-icon" aria-label={isWatched ? "Remove" : "Add"}>
                    {isWatched ? <StarIconSolid className="w-5 h-5 text-yellow-400"/> : <StarIcon className="w-5 h-5"/>}
                </button>
            </div>
        </div>
    );
};


const TenderDiscovery: React.FC<TenderDiscoveryProps> = ({ store, currentUser }) => {
  const { tenders, loading, error, refreshTenders, lastFetched, addToWatchlist, watchlist, removeFromWatchlist, teamMembers } = store;
  const [sortOption, setSortOption] = useState('publishedDate-desc');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [view, setView] = useState<'card' | 'list'>('card');
  const [publishedAfter, setPublishedAfter] = useState('');
  const [publishedBefore, setPublishedBefore] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedTenderForSummary, setSelectedTenderForSummary] = useState<Tender | null>(null);
  const [tenderToAssign, setTenderToAssign] = useState<Tender | null>(null);

  const canAssign = currentUser?.role === TeamMemberRole.ADMIN || currentUser?.role === TeamMemberRole.MANAGER;

  const handleSummarize = (tender: Tender) => {
    setSelectedTenderForSummary(tender);
    setIsAiModalOpen(true);
  };

  const handleAddToWatchlist = (tender: Tender) => {
    if (canAssign) {
        setTenderToAssign(tender);
    } else {
        addToWatchlist(tender, null);
    }
  };

  const handleConfirmAssignment = (assignedTeamMemberId: string | null) => {
    if (tenderToAssign) {
        addToWatchlist(tenderToAssign, assignedTeamMemberId);
    }
    setTenderToAssign(null);
  };


  const watchedTendersMap = useMemo(() => new Map<string, WatchlistItem>(watchlist.map(item => [item.tender.id, item])), [watchlist]);

  const uniqueSources: string[] = useMemo(() => {
    return [...new Set(tenders.map(t => t.source))].sort();
  }, [tenders]);
  
  const sourceColors = useMemo(() => {
    const colors: Record<string, string> = {};
    uniqueSources.forEach(source => {
      colors[source] = generateHslColorFromString(source);
    });
    return colors;
  }, [uniqueSources]);
  
  const displayedTenders = useMemo(() => {
    let filteredTenders = [...tenders];

    if (publishedAfter) {
      const afterDate = new Date(publishedAfter + 'T00:00:00');
      filteredTenders = filteredTenders.filter(t => new Date(t.publishedDate) >= afterDate);
    }
    if (publishedBefore) {
      const beforeDate = new Date(publishedBefore + 'T23:59:59');
      filteredTenders = filteredTenders.filter(t => new Date(t.publishedDate) <= beforeDate);
    }

    if (!showClosed) {
        filteredTenders = filteredTenders.filter(t => {
            const remainingDays = calculateRemainingDays(t.closingDate);
            const isWatched = watchedTendersMap.has(t.id);
            return remainingDays >= 0 || isWatched;
        });
    }

    if (sourceFilter !== 'all') {
      filteredTenders = filteredTenders.filter(t => t.source === sourceFilter);
    }
    
    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filteredTenders = filteredTenders.filter(t => 
        t.title.toLowerCase().includes(lowercasedQuery) ||
        t.summary.toLowerCase().includes(lowercasedQuery)
      );
    }

    filteredTenders.sort((a, b) => {
        const [key, direction] = sortOption.split('-');
        const valA = key === 'closingDate' ? new Date(a.closingDate).getTime() : new Date(a.publishedDate).getTime();
        const valB = key === 'closingDate' ? new Date(b.closingDate).getTime() : new Date(b.publishedDate).getTime();
        
        if (direction === 'asc') {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });
    
    return filteredTenders;
  }, [tenders, sortOption, sourceFilter, searchQuery, showClosed, watchedTendersMap, publishedAfter, publishedBefore]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white">Tender Discovery</h1>
        <div className="flex items-center gap-4">
          {lastFetched && <span className="text-sm text-slate-400">Last updated: {new Date(lastFetched).toLocaleTimeString()}</span>}
          <button onClick={() => refreshTenders(true)} disabled={loading} className="p-2 rounded-full bg-slate-700/80 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait transition-colors">
            <RefreshIcon className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700 mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap">
          <div className="relative flex-grow w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search tenders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block w-full p-2.5 pl-10 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-slate-300">Sort:</label>
            <select 
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2.5 transition"
            >
              <option value="publishedDate-desc">Newest Published</option>
              <option value="publishedDate-asc">Oldest Published</option>
              <option value="closingDate-asc">Closing Soonest</option>
              <option value="closingDate-desc">Closing Latest</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="source-filter" className="text-sm font-medium text-slate-300">Source:</label>
            <select 
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2.5 transition"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
           <label htmlFor="show-closed-toggle" className="flex items-center cursor-pointer">
              <span className="mr-3 text-sm font-medium text-slate-300">Show Closed</span>
              <div className="relative">
                  <input type="checkbox" id="show-closed-toggle" className="sr-only" checked={showClosed} onChange={() => setShowClosed(!showClosed)} />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${showClosed ? 'bg-blue-600' : 'bg-slate-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showClosed ? 'transform translate-x-6' : ''}`}></div>
              </div>
          </label>
          <div className="ml-auto flex items-center gap-1 bg-slate-700/50 p-1 rounded-md">
              <button onClick={() => setView('card')} className={`p-1.5 rounded-md transition-colors ${view === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`} aria-label="Card View">
                  <GridViewIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`} aria-label="List View">
                  <ListViewIcon className="w-5 h-5" />
              </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <label htmlFor="published-after" className="text-sm font-medium text-slate-300">Published After:</label>
            <input
              type="date"
              id="published-after"
              value={publishedAfter}
              onChange={(e) => setPublishedAfter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="published-before" className="text-sm font-medium text-slate-300">Published Before:</label>
            <input
              type="date"
              id="published-before"
              value={publishedBefore}
              onChange={(e) => setPublishedBefore(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-2 transition"
            />
          </div>
          {(publishedAfter || publishedBefore) && (
            <button onClick={() => { setPublishedAfter(''); setPublishedBefore(''); }} className="text-sm text-blue-400 hover:text-blue-300">
              Clear Dates
            </button>
          )}
        </div>
      </div>
      
      {loading && tenders.length === 0 && (
          view === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
          ) : (
              <div className="space-y-3">
                  {[...Array(6)].map((_, i) => <SkeletonListItem key={i} />)}
              </div>
          )
      )}

      {error && <p className="text-red-400 text-center">{error}</p>}
      
      {!loading && displayedTenders.length === 0 && !error && (
        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
          <FileSearchIcon className="mx-auto w-12 h-12 text-slate-500" />
          {tenders.length > 0 ? (
            <>
              <h3 className="text-xl font-medium text-white mt-4">No Tenders Match Your Filters</h3>
              <p className="text-slate-400 mt-2">Try adjusting your search, sort, and filter options.</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-medium text-white mt-4">No Tenders Found</h3>
              <p className="text-slate-400 mt-2">Try adding more RSS feeds in the Settings page or refresh.</p>
            </>
          )}
        </div>
      )}

      {view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTenders.map((tender) => {
             const watchlistItem = watchedTendersMap.get(tender.id);
             return <TenderCard key={tender.id} tender={tender} onAdd={handleAddToWatchlist} onRemove={removeFromWatchlist} isWatched={!!watchlistItem} watchlistItemId={watchlistItem?.id} sourceColor={sourceColors[tender.source]} onSummarize={handleSummarize} />
          })}
        </div>
      ) : (
         <div className="space-y-3">
          {displayedTenders.map((tender) => {
             const watchlistItem = watchedTendersMap.get(tender.id);
             return <TenderListItem key={tender.id} tender={tender} onAdd={handleAddToWatchlist} onRemove={removeFromWatchlist} isWatched={!!watchlistItem} watchlistItemId={watchlistItem?.id} sourceColor={sourceColors[tender.source]} onSummarize={handleSummarize} />
          })}
        </div>
      )}

      <AISummaryModal 
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        tender={selectedTenderForSummary}
        store={store}
      />
      <AssignTenderModal 
        isOpen={!!tenderToAssign}
        onClose={() => setTenderToAssign(null)}
        onConfirm={handleConfirmAssignment}
        tender={tenderToAssign!}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default TenderDiscovery;
