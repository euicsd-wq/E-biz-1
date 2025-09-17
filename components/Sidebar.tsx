import React, { useMemo } from 'react';
import { HomeIcon, SettingsIcon, BriefcaseIcon, BanknotesIcon, UsersGroupIcon, ChartBarIcon, EnvelopeIcon } from './icons';
import type { View, TeamMember } from '../types';
import { TeamMemberRole } from '../types';
import { useAuth } from '../contexts/Auth';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: TeamMember;
}

const ALL_NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'operations-hub', label: 'Operations Hub', icon: BriefcaseIcon },
    { id: 'crm-hub', label: 'CRM Hub', icon: UsersGroupIcon },
    { id: 'finance-hub', label: 'Finance Hub', icon: BanknotesIcon },
    { id: 'reporting-hub', label: 'Reporting Hub', icon: ChartBarIcon },
    { id: 'mail', label: 'Mail', icon: EnvelopeIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser }) => {
  const { signOut } = useAuth();

  const navItems = useMemo(() => {
    // Admins see everything, regardless of their permissions array
    if (currentUser.role === TeamMemberRole.ADMIN) {
        return ALL_NAV_ITEMS;
    }
    // Other users see only what's in their permissions list
    return ALL_NAV_ITEMS.filter(item => currentUser.permissions?.includes(item.id as View));
  }, [currentUser]);

  return (
    <aside className="w-64 bg-slate-900/70 backdrop-blur-sm text-slate-300 flex-none flex flex-col p-4 border-r border-slate-700/50">
      <div className="text-2xl font-bold text-white mb-10 p-2">Tenders Hub</div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id as View)}
                className={`flex items-center w-full px-4 py-3 my-1 rounded-lg transition-all duration-200 relative group ${
                  currentView === item.id
                    ? 'bg-slate-700/50 text-white font-semibold'
                    : 'hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <span className={`absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r-full transition-transform duration-300 ease-in-out ${currentView === item.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></span>
                <item.icon className={`w-5 h-5 mr-4 transition-colors ${currentView === item.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
       <div className="mt-auto p-2 text-center text-xs text-slate-500 border-t border-slate-700/50">
            <p className="mt-2">Logged in as:</p>
            <p className="font-bold text-slate-300 truncate">{currentUser.name}</p>
            <button onClick={signOut} className="w-full mt-2 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md text-slate-200 transition-colors">
              Sign Out
            </button>
       </div>
    </aside>
  );
};

export default Sidebar;