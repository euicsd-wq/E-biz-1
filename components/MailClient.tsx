import React from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { View } from '../types';
import { EnvelopeIcon, SettingsIcon, ExternalLinkIcon } from './icons';

type MailClientProps = {
  store: ReturnType<typeof useTenderStore>;
  setView: (view: View) => void;
};

const MailClient: React.FC<MailClientProps> = ({ store, setView }) => {
  const { mailSettings } = store;

  // View for when mail service is NOT configured
  if (!mailSettings?.url) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-8">
        <EnvelopeIcon className="w-16 h-16 text-slate-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Mail Service Not Configured</h1>
        <p className="text-slate-400 max-w-md mb-6">
          To use the integrated mail client, please go to the settings and enter the URL for your webmail service (e.g., Roundcube).
        </p>
        <button onClick={() => setView('settings')} className="btn-primary">
          <SettingsIcon className="w-5 h-5 mr-2" />
          Go to Settings
        </button>
      </div>
    );
  }

  // View for when mail service IS configured
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-8">
      <EnvelopeIcon className="w-16 h-16 text-slate-500 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Open Your Mail Client</h1>
      <p className="text-slate-400 max-w-md mb-6">
        Your webmail client is ready. For security, it will open in a new browser tab.
      </p>
      <a
        href={mailSettings.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        <ExternalLinkIcon className="w-5 h-5 mr-2" />
        Open Webmail
      </a>
    </div>
  );
};

export default MailClient;