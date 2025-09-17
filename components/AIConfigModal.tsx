import React, { useState, useEffect } from 'react';
import type { AIConfig } from '../types';
import { AIProvider } from '../types';

type AIConfigModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AIConfig;
  onSave: (config: AIConfig) => void;
};

const modelsByProvider: Record<AIProvider, {id: string, name: string}[]> = {
    [AIProvider.GEMINI]: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
    ],
    [AIProvider.OPENAI]: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    [AIProvider.DEEPSEEK]: [
        { id: 'deepseek-chat', name: 'DeepSeek-V2' },
        { id: 'deepseek-coder', name: 'DeepSeek-Coder' }
    ],
    [AIProvider.ANTHROPIC]: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ]
};

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
  const [config, setConfig] = useState<AIConfig>(currentConfig);

  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
    }
  }, [isOpen, currentConfig]);
  
  const handleProviderChange = (provider: AIProvider) => {
    const defaultModel = modelsByProvider[provider][0]?.id || '';
    setConfig(prev => ({ ...prev, provider, model: defaultModel }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  if (!isOpen) {
    return null;
  }
  
  const providerName = config.provider.split(' ')[0];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700 relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-4 p-6 border-b border-slate-700">AI Configuration</h2>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="ai-provider" className="label-style">AI Provider</label>
              <select
                id="ai-provider"
                value={config.provider}
                onChange={e => handleProviderChange(e.target.value as AIProvider)}
                className="input-style w-full"
              >
                {Object.values(AIProvider).map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="ai-model" className="label-style">Model</label>
              <select
                id="ai-model"
                value={config.model}
                onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="input-style w-full"
                disabled={!modelsByProvider[config.provider]}
              >
                <option value="">-- Select a model --</option>
                {(modelsByProvider[config.provider] || []).map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            <div>
                <label htmlFor="api-key" className="label-style">{providerName} API Key</label>
                <input
                  id="api-key"
                  type="password"
                  value={config.apiKey}
                  onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="input-style w-full"
                  placeholder={`Enter your ${providerName} API key`}
                />
                <p className="text-xs text-slate-500 mt-1">Your API key is stored securely in the database.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-4 bg-slate-800/80 border-t border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIConfigModal;