import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import { MegaphoneIcon } from './icons';
import { formatTimeAgo } from '../utils';

type NotificationsProps = {
  store: ReturnType<typeof useTenderStore>;
  onNavigate: (type: 'tender' | 'client' | 'catalog', id: string) => void;
};

const Notifications: React.FC<NotificationsProps> = ({ store, onNavigate }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = store;
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
            <button onClick={markAllNotificationsAsRead} className="text-sm font-medium text-blue-400 hover:underline">
                Mark all as read
            </button>
        )}
      </div>
      <div className="flex justify-start mb-4">
        <div className="flex items-center border border-slate-700 rounded-lg p-1 bg-slate-800/80">
            <button onClick={() => setFilter('unread')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'unread' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Unread</button>
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>All</button>
        </div>
      </div>
      
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
            <MegaphoneIcon className="mx-auto w-12 h-12 text-slate-500" />
            <h3 className="text-xl font-medium text-white mt-4">All Caught Up!</h3>
            <p className="text-slate-400 mt-2">You have no {filter} notifications.</p>
        </div>
      ) : (
        <div className="bg-slate-800/80 rounded-lg border border-slate-700">
          <ul className="divide-y divide-slate-700">
            {filteredNotifications.map(n => (
              <li key={n.id} className={`p-4 flex items-start gap-4 ${n.isRead ? 'opacity-60' : ''}`}>
                <div className="flex-grow">
                  <p className="text-slate-200">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.type} &middot; {formatTimeAgo(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {n.tenderId && (
                         <button onClick={() => onNavigate('tender', n.tenderId!)} className="text-xs font-medium text-blue-400 hover:underline">View</button>
                    )}
                    {!n.isRead && (
                        <button onClick={() => markNotificationAsRead(n.id)} className="text-xs font-medium text-slate-400 hover:underline">
                            Mark as read
                        </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
export default Notifications;