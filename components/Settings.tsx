import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Source, CompanyProfile, TeamMember, TaskTemplate, MailSettings } from '../types';
import { TeamMemberRole } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, LinkIcon, EditIcon, SaveIcon, CancelIcon, BuildingOfficeIcon, UsersGroupIcon, BrainCircuitIcon, ClipboardDocumentCheckIcon, DocumentDuplicateIcon, EnvelopeIcon, BuildingLibraryIcon, UserCircleIcon } from './icons';
import { CORS_PROXY_URL } from '../constants';
import AIConfigModal from './AIConfigModal';
import TaskTemplateModal from './TaskTemplateModal';
import Team from './Team';
import DocumentSettings from './DocumentSettings';
import SqlSchema from './SqlSchema';
import MyProfile from './MyProfile';

// --- Start of parsing logic ---
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
};

const parseJson = (content: string): string[] => {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data.filter(item => typeof item === 'string' && isValidUrl(item));
    }
  } catch (e) {
    console.error("Failed to parse JSON file", e);
  }
  return [];
};

const parseXml = (content: string): string[] => {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(content, "application/xml");
    const outlines = xml.querySelectorAll("outline[xmlUrl]");
    return Array.from(outlines)
      .map(outline => outline.getAttribute('xmlUrl'))
      .filter((url): url is string => url !== null && isValidUrl(url));
  } catch (e) {
    console.error("Failed to parse XML/OPML file", e);
  }
  return [];
};

const parseCsvTxt = (content: string): string[] => {
  return content
    .split(/\r?\n/)
    .map(line => line.split(',')[0].trim()) // Assume URL is in the first column for CSV
    .filter(line => line.length > 0 && isValidUrl(line));
};

const parseSourceFile = (content: string, extension: string | undefined): string[] => {
  switch (extension) {
    case 'json':
      return parseJson(content);
    case 'xml':
    case 'opml':
      return parseXml(content);
    case 'csv':
    case 'txt':
      return parseCsvTxt(content);
    default:
      console.warn(`Unsupported file type: ${extension}`);
      return [];
  }
};
// --- End of parsing logic ---

const SourceItem: React.FC<{ source: Source; onRemove: (id: string) => void; onUpdate: (id: string, updates: Partial<Source>) => void; }> = ({ source, onRemove, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState(source.url);

  const handleSave = () => {
    if (editedUrl.trim() && editedUrl.trim() !== source.url) {
      onUpdate(source.id, { url: editedUrl.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUrl(source.url);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between bg-slate-700/60 p-3 rounded-md">
      {isEditing ? (
        <input
          type="url"
          value={editedUrl}
          onChange={(e) => setEditedUrl(e.target.value)}
          className="flex-grow bg-slate-600 border border-slate-500 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block w-full p-2 transition mr-2"
        />
      ) : (
        <span className="text-sm text-slate-300 truncate pr-4">{source.url}</span>
      )}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="p-2 rounded-full hover:bg-green-500/20 text-slate-400 hover:text-green-400" aria-label="Save source">
              <SaveIcon className="w-5 h-5" />
            </button>
            <button onClick={handleCancel} className="p-2 rounded-full hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400" aria-label="Cancel edit">
              <CancelIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-blue-500/20 text-slate-400 hover:text-blue-400" aria-label="Edit source">
              <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onRemove(source.id)} className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400" aria-label="Remove source">
              <TrashIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

type SettingsProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

const TABS = [
    { id: 'my-profile', label: 'My Profile', icon: UserCircleIcon, roles: [TeamMemberRole.ADMIN, TeamMemberRole.MANAGER, TeamMemberRole.MEMBER] },
    { id: 'profile', label: 'Company Profile', icon: BuildingOfficeIcon, roles: [TeamMemberRole.ADMIN] },
    { id: 'team', label: 'Team & Permissions', icon: UsersGroupIcon, roles: [TeamMemberRole.ADMIN] },
    { id: 'sources', label: 'Tenders Sources', icon: LinkIcon, roles: [TeamMemberRole.ADMIN] },
    { id: 'workflows', label: 'Workflow Templates', icon: ClipboardDocumentCheckIcon, roles: [TeamMemberRole.ADMIN] },
    { id: 'appearance', label: 'Document Appearance', icon: DocumentDuplicateIcon, roles: [TeamMemberRole.ADMIN] },
    { id: 'ai', label: 'AI & Integrations', icon: BrainCircuitIcon, roles: [TeamMemberRole.ADMIN] },
    { id: 'mail', label: 'Mail Services', icon: EnvelopeIcon, roles: [TeamMemberRole.ADMIN] },
];
type SettingsTab = 'my-profile' | 'profile' | 'sources' | 'team' | 'workflows' | 'appearance' | 'ai' | 'mail' | 'database';


const Settings: React.FC<SettingsProps> = ({ store, currentUser }) => {
  const { 
      sources, addSource, removeSource, updateSource, addMultipleSources, 
      companyProfile, updateCompanyProfile, 
      aiConfig, updateAIConfig, 
      mailSettings, updateMailSettings,
      taskTemplates, removeTaskTemplate, 
      addToast
  } = store;
  
  const visibleTabs = useMemo(() => {
    return TABS.filter(tab => tab.roles.includes(currentUser.role));
  }, [currentUser.role]);

  const [activeTab, setActiveTab] = useState<SettingsTab>(visibleTabs[0]?.id as SettingsTab || 'my-profile');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [currentMailSettings, setCurrentMailSettings] = useState<MailSettings>(mailSettings);

  useEffect(() => {
    setCurrentMailSettings(mailSettings);
  }, [mailSettings]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };
  
  const handleAddNewTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSourceUrl.trim()) {
      addSource({ url: newSourceUrl.trim() } as Partial<Source>);
      setNewSourceUrl('');
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(importUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fileContent = await response.text();
        const extension = new URL(importUrl).pathname.split('.').pop()?.toLowerCase();
        
        const urls = parseSourceFile(fileContent, extension);

        if (urls.length > 0) {
            addMultipleSources(urls);
            addToast(`${urls.length} new valid and unique source(s) were added.`, 'success');
        } else {
            addToast("No new valid sources found at the URL.", 'error');
        }
    } catch (error) {
        console.error("Error processing URL:", error);
        addToast("Failed to process the provided URL.", 'error');
    } finally {
        setImportUrl('');
    }
  };


  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      const urls = parseSourceFile(fileContent, extension);

      if (urls.length > 0) {
        addMultipleSources(urls);
        addToast(`${urls.length} new valid and unique source(s) were added.`, 'success');
      } else {
        addToast("No new valid sources found in the file.", 'error');
      }

    } catch (error) {
        console.error("Error processing file:", error);
        addToast("Failed to process the file.", 'error');
    } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProfileChange = (field: keyof CompanyProfile, value: string) => {
    updateCompanyProfile({ ...companyProfile, [field]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          addToast("File is too large. Please select an image smaller than 2MB.", 'error');
          return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateCompanyProfile({ ...companyProfile, logo: base64 });
        addToast('Logo updated successfully!', 'success');
      };
      reader.onerror = () => {
        addToast('Failed to read logo file.', 'error');
      };
      reader.readAsDataURL(file);
  };
  
  const handleRemoveLogo = () => {
      updateCompanyProfile({ ...companyProfile, logo: undefined });
  };
  
  const handleSaveMailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMailSettings(currentMailSettings);
    addToast('Mail settings saved successfully!', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-1/4">
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                {visibleTabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200 group whitespace-nowrap ${
                            activeTab === tab.id
                            ? 'bg-slate-700/50 text-white font-semibold'
                            : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-300'
                        }`}
                    >
                        <tab.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        {tab.label}
                    </button>
                ))}
            </nav>
          </aside>
          
          <main className="flex-1 min-w-0">
                {activeTab === 'my-profile' && <MyProfile store={store} currentUser={currentUser} /> }
                {activeTab === 'profile' && (
                    <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Company Profile</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label-style">Company Name</label><input type="text" value={companyProfile.name} onChange={e => handleProfileChange('name', e.target.value)} className="input-style"/></div>
                             <div><label className="label-style">Email</label><input type="email" value={companyProfile.email} onChange={e => handleProfileChange('email', e.target.value)} className="input-style"/></div>
                            <div className="md:col-span-2"><label className="label-style">Address</label><textarea value={companyProfile.address} onChange={e => handleProfileChange('address', e.target.value)} className="input-style"/></div>
                            <div><label className="label-style">Phone</label><input type="tel" value={companyProfile.phone} onChange={e => handleProfileChange('phone', e.target.value)} className="input-style"/></div>
                            <div><label className="label-style">Registration No.</label><input type="text" value={companyProfile.regNo} onChange={e => handleProfileChange('regNo', e.target.value)} className="input-style"/></div>
                            <div><label className="label-style">TIN</label><input type="text" value={companyProfile.tin} onChange={e => handleProfileChange('tin', e.target.value)} className="input-style"/></div>
                            <div><label className="label-style">UNGM No.</label><input type="text" value={companyProfile.ungm} onChange={e => handleProfileChange('ungm', e.target.value)} className="input-style"/></div>
                        </div>
                         <div className="mt-4">
                            <label className="label-style">Company Logo</label>
                            <div className="flex items-center gap-4">
                                {companyProfile.logo && <img src={companyProfile.logo} alt="Company Logo" className="w-16 h-16 rounded-md object-contain bg-slate-700"/>}
                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg" className="hidden"/>
                                <button onClick={() => logoInputRef.current?.click()} className="btn-secondary text-sm">Upload Logo</button>
                                {companyProfile.logo && <button onClick={handleRemoveLogo} className="text-xs text-red-400 hover:underline">Remove</button>}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'sources' && (
                    <div className="space-y-6">
                        <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-4">Add & Manage RSS/JSON Sources</h2>
                            <form onSubmit={handleAddSource} className="flex items-center gap-2 mb-4">
                                <input type="url" value={newSourceUrl} onChange={(e) => setNewSourceUrl(e.target.value)} placeholder="Enter RSS/JSON feed URL" required className="input-style flex-grow" />
                                <button type="submit" className="btn-primary"><PlusIcon className="w-5 h-5 mr-2"/>Add Source</button>
                            </form>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {sources.map(source => <SourceItem key={source.id} source={source} onRemove={removeSource} onUpdate={updateSource} />)}
                            </div>
                        </div>
                        <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                            <h2 className="text-xl font-semibold text-white mb-4">Import Sources</h2>
                             <form onSubmit={handleUrlImport} className="flex items-center gap-2 mb-4">
                                <input type="url" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Import from URL (OPML, XML, JSON, CSV)" className="input-style flex-grow" />
                                <button type="submit" className="btn-secondary">Import</button>
                            </form>
                            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xml,.opml,.json,.csv,.txt" className="hidden" />
                            <button onClick={triggerFileInput} className="w-full btn-secondary"><UploadIcon className="w-5 h-5 mr-2" />Import from File</button>
                        </div>
                    </div>
                )}
                {activeTab === 'team' && (
                  <div className="space-y-6">
                    <Team store={store} currentUser={currentUser} />
                    <details className="bg-slate-800/80 rounded-lg border border-slate-700">
                      <summary className="px-4 py-3 font-semibold text-white cursor-pointer hover:bg-slate-800/50 rounded-t-lg flex items-center gap-3">
                        <BuildingLibraryIcon className="w-5 h-5 text-slate-400"/>
                        <span>Database Setup</span>
                      </summary>
                      <div className="p-4 border-t border-slate-700">
                        <SqlSchema/>
                      </div>
                    </details>
                  </div>
                )}
                {activeTab === 'workflows' && (
                     <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-semibold text-white">Task Templates</h2>
                           <button onClick={handleAddNewTemplate} className="btn-primary"><PlusIcon className="w-5 h-5 mr-2"/>New Template</button>
                        </div>
                        <div className="space-y-2">
                          {taskTemplates.map(template => (
                              <div key={template.id} className="flex justify-between items-center p-3 bg-slate-700/60 rounded-md">
                                  <span>{template.name} ({template.tasks.length} tasks)</span>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleEditTemplate(template)} className="btn-icon"><EditIcon className="w-4 h-4"/></button>
                                      <button onClick={() => removeTaskTemplate(template.id)} className="btn-icon-danger"><TrashIcon className="w-4 h-4"/></button>
                                  </div>
                              </div>
                          ))}
                        </div>
                    </div>
                )}
                {activeTab === 'appearance' && <DocumentSettings store={store} />}
                {activeTab === 'ai' && (
                     <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-2">AI & Integrations</h2>
                        <p className="text-sm text-slate-400 mb-4">Configure your AI provider for features like summarization and data extraction.</p>
                        <div className="p-4 bg-slate-900/50 rounded-md">
                            <p><strong>Provider:</strong> {aiConfig.provider}</p>
                            <p><strong>Model:</strong> {aiConfig.model || 'Default'}</p>
                            <button onClick={() => setIsAIModalOpen(true)} className="btn-secondary mt-4">Change Provider</button>
                        </div>
                    </div>
                )}
                {activeTab === 'mail' && (
                    <form onSubmit={handleSaveMailSettings} className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                         <h2 className="text-xl font-semibold text-white mb-2">Mail Service</h2>
                         <p className="text-sm text-slate-400 mb-4">Integrate your webmail client (e.g., Roundcube) by providing its URL.</p>
                         <div>
                            <label htmlFor="mailUrl" className="label-style">Webmail URL</label>
                            <input id="mailUrl" type="url" value={currentMailSettings.url} onChange={e => setCurrentMailSettings({url: e.target.value})} placeholder="https://webmail.yourdomain.com" className="input-style"/>
                         </div>
                         <div className="mt-4 flex justify-end">
                            <button type="submit" className="btn-primary">Save Mail Settings</button>
                         </div>
                    </form>
                )}
          </main>
      </div>
      <AIConfigModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} currentConfig={aiConfig} onSave={updateAIConfig} />
      <TaskTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} store={store} templateToEdit={editingTemplate} />
    </div>
  );
};

export default Settings;