import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { View } from '../types';
import { BellIcon, SearchIcon } from './icons';
import { formatTimeAgo } from '../utils';
import GlobalSearch from './GlobalSearch';

type HeaderProps = {
  store: ReturnType<typeof useTenderStore>;
  setView: (view: View) => void;
  onNavigate: (type: 'tender' | 'client' | 'catalog', id: string) => void;
};

const Header: React.FC<HeaderProps> = ({ store, setView, onNavigate }) => {
  const { notifications, markNotificationAsRead } = store;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);


  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.isRead)
  , [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notificationId: string) => {
      markNotificationAsRead(notificationId);
      setIsPopoverOpen(false);
  };
  
  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-4 flex justify-end items-center h-16 gap-4">
      {/* Global Search */}
      <div className="relative w-full max-w-xs" ref={searchRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            className="bg-slate-700/80 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block w-full p-2.5 pl-10 transition"
          />
        </div>
        {isSearchOpen && (
           <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
             <GlobalSearch query={searchQuery} store={store} onNavigate={onNavigate} onClose={handleSearchClose} />
           </div>
        )}
      </div>
      
      {/* Notifications */}
      <div className="relative" ref={popoverRef}>
        <button onClick={() => setIsPopoverOpen(prev => !prev)} className="relative p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
          <BellIcon className="w-6 h-6" />
          {unreadNotifications.length > 0 && (
            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-slate-900">{unreadNotifications.length}</span>
          )}
        </button>
        {isPopoverOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-slate-700">
              <h3 className="font-semibold text-white">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {unreadNotifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">No new notifications</p>
              ) : (
                <ul className="divide-y divide-slate-700">
                  {unreadNotifications.slice(0, 5).map(n => (
                    <li key={n.id} className="p-3 hover:bg-slate-700/50">
                      <p className="text-sm text-slate-200">{n.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">{formatTimeAgo(n.createdAt)}</span>
                        <div>
                          {n.tenderId && (
                             <button onClick={() => { onNavigate('tender', n.tenderId!); setIsPopoverOpen(false); }} className="text-xs text-blue-400 hover:underline mr-2">View</button>
                          )}
                          <button onClick={() => handleNotificationClick(n.id)} className="text-xs text-slate-400 hover:underline">Mark as read</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-2 border-t border-slate-700">
              <button onClick={() => { setView('notifications'); setIsPopoverOpen(false); }} className="w-full text-center text-sm font-medium text-blue-400 hover:bg-slate-700/50 rounded-md py-2 transition-colors">
                View All Notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;