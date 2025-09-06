import React, { useState, useRef, useEffect } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { Source, CompanyProfile, TeamMember, TaskTemplate, Account, CloudSyncConfig, DocumentSettings, MailSettings } from '../types';
import { TeamMemberRole, AccountType, CloudProvider, StorageMode, DocumentTemplateStyle } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, LinkIcon, EditIcon, SaveIcon, CancelIcon, InfoIcon, CheckCircleIcon, BuildingOfficeIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, UsersGroupIcon, BrainCircuitIcon, ClipboardDocumentCheckIcon, CloudArrowUpIcon, CloudArrowDownIcon, CheckCircleIconSolid, XCircleIconSolid, DocumentDuplicateIcon, SupabaseLogoIcon, FirebaseLogoIcon, AWSLogoIcon, AzureLogoIcon, EnvelopeIcon, BookOpenIcon } from './icons';
import { CORS_PROXY_URL } from '../constants';
import AIConfigModal from './AIConfigModal';
import TaskTemplateModal from './TaskTemplateModal';
import Team from './Team';
import { formatTimeAgo } from '../utils';
import Documentation from './Documentation';

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

const SourceItem: React.FC<{ source: Source; onRemove: (id: string) => void; onUpdate: (id: string, newUrl: string) => void; }> = ({ source, onRemove, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState(source.url);

  const handleSave = () => {
    if (editedUrl.trim() && editedUrl.trim() !== source.url) {
      onUpdate(source.id, editedUrl.trim());
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

type SettingsTab = 'profile' | 'sources' | 'team' | 'workflows' | 'appearance' | 'ai' | 'mail' | 'data' | 'documentation';

const AppearanceSettings: React.FC<{store: ReturnType<typeof useTenderStore>}> = ({ store }) => {
    const { documentSettings, updateDocumentSettings } = store;

    const handleSettingChange = (field: keyof DocumentSettings, value: any) => {
        updateDocumentSettings({ [field]: value });
    };

    return (
        <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white">Document Appearance</h2>
            <p className="text-sm text-slate-400 mb-6">Customize the look of generated PDFs like quotes and invoices.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="accentColor" className="label-style">Accent Color</label>
                    <div className="flex items-center gap-2">
                        <input id="accentColor" type="color" value={documentSettings.accentColor} onChange={e => handleSettingChange('accentColor', e.target.value)} className="p-1 h-10 w-10 block bg-slate-700 border-slate-600 cursor-pointer rounded-lg"/>
                        <input type="text" value={documentSettings.accentColor} onChange={e => handleSettingChange('accentColor', e.target.value)} className="input-style"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="fontFamily" className="label-style">Font</label>
                    <select id="fontFamily" value={documentSettings.fontFamily} onChange={e => handleSettingChange('fontFamily', e.target.value)} className="input-style">
                        <option value="Inter">Inter (Modern)</option>
                        <option value="Roboto">Roboto (Clean)</option>
                        <option value="Times New Roman">Times New Roman (Classic)</option>
                    </select>
                </div>
                 <div>
                    <label className="label-style">Quote Title</label>
                    <input type="text" value={documentSettings.documentTitleQuote} onChange={e => handleSettingChange('documentTitleQuote', e.target.value)} className="input-style"/>
                </div>
                 <div>
                    <label className="label-style">Invoice Title</label>
                    <input type="text" value={documentSettings.documentTitleInvoice} onChange={e => handleSettingChange('documentTitleInvoice', e.target.value)} className="input-style"/>
                </div>
                 <div>
                    <label className="label-style">Purchase Order Title</label>
                    <input type="text" value={documentSettings.documentTitlePO} onChange={e => handleSettingChange('documentTitlePO', e.target.value)} className="input-style"/>
                </div>
                 <div>
                    <label className="label-style">Delivery Note Title</label>
                    <input type="text" value={documentSettings.documentTitleDeliveryNote} onChange={e => handleSettingChange('documentTitleDeliveryNote', e.target.value)} className="input-style"/>
                </div>
                <div className="md:col-span-2">
                    <label className="flex items-center cursor-pointer">
                         <input type="checkbox" checked={documentSettings.showLogo} onChange={e => handleSettingChange('showLogo', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                        <span className="ml-2 text-sm text-slate-300">Show Company Logo on Documents</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ store, currentUser }) => {
  const { 
      sources, addSource, removeSource, updateSource, addMultipleSources, 
      companyProfile, updateCompanyProfile, 
      importData, exportData, 
      aiConfig, updateAIConfig, 
      mailSettings, updateMailSettings,
      taskTemplates, removeTaskTemplate, 
      storageMode, setStorageMode,
      cloudSyncConfig, updateCloudSyncConfig, 
      cloudSyncState, syncToCloud, pullFromCloud, addToast
  } = store;
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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
  const backupInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (currentUser.role !== TeamMemberRole.ADMIN) {
    return (
        <div className="text-center py-16 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
            <h3 className="text-xl font-medium text-white mt-4">Access Denied</h3>
            <p className="text-slate-400 mt-2">You do not have permission to view this page.</p>
        </div>
    );
  }
  
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
      addSource(newSourceUrl.trim());
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
    updateCompanyProfile({ [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 1024 * 1024) { // 1MB limit
          addToast("File is too large. Please select an image smaller than 1MB.", 'error');
          return;
      }

      const reader = new FileReader();
      reader.onload = () => {
          updateCompanyProfile({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
  };
  
  const handleRemoveLogo = () => {
      updateCompanyProfile({ logo: undefined });
  };

  const handleExportData = () => {
    const data = exportData();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `tenders_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text === 'string') {
                  const data = JSON.parse(text);
                  importData(data);
              }
          } catch (error) {
              console.error("Error parsing backup file:", error);
              addToast("Failed to read or parse the backup file. Please ensure it's a valid JSON backup from this application.", 'error');
          }
      };
      reader.readAsText(file);

      if (backupInputRef.current) {
        backupInputRef.current.value = '';
      }
  };
  
  const handleSaveMailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMailSettings(currentMailSettings);
    addToast('Mail settings saved successfully!', 'success');
  };

  const TABS = [
        { id: 'profile', label: 'Company Profile', icon: BuildingOfficeIcon },
        { id: 'team', label: 'Team & Permissions', icon: UsersGroupIcon },
        { id: 'sources', label: 'Tenders Sources', icon: LinkIcon },
        { id: 'workflows', label: 'Workflow Templates', icon: ClipboardDocumentCheckIcon },
        { id: 'appearance', label: 'Document Appearance', icon: DocumentDuplicateIcon },
        { id: 'ai', label: 'AI & Integrations', icon: BrainCircuitIcon },
        { id: 'mail', label: 'Mail Services', icon: EnvelopeIcon },
        { id: 'data', label: 'Data Management', icon: ArrowDownTrayIcon },
        { id: 'documentation', label: 'Documentation', icon: BookOpenIcon },
    ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-1/4">
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                {TABS.map(tab => (
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
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">
            {activeTab === 'profile' && (
                <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center mb-4">
                        <BuildingOfficeIcon className="w-6 h-6 mr-3 text-slate-400"/>
                        <h2 className="text-xl font-semibold text-white">Company Profile</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">This information will be used to automatically populate your generated offer documents.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label htmlFor="companyName" className="label-style">Company Name</label>
                                <input type="text" id="companyName" value={companyProfile.name} onChange={e => handleProfileChange('name', e.target.value)} className="input-style" />
                            </div>
                            <div>
                                <label htmlFor="companyAddress" className="label-style">Address</label>
                                <input type="text" id="companyAddress" value={companyProfile.address} onChange={e => handleProfileChange('address', e.target.value)} className="input-style" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="companyPhone" className="label-style">Phone</label>
                                    <input type="text" id="companyPhone" value={companyProfile.phone} onChange={e => handleProfileChange('phone', e.target.value)} className="input-style" />
                                </div>
                                <div>
                                    <label htmlFor="companyEmail" className="label-style">Email</label>
                                    <input type="email" id="companyEmail" value={companyProfile.email} onChange={e => handleProfileChange('email', e.target.value)} className="input-style" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="companyRegNo" className="label-style">Reg No.</label>
                                    <input type="text" id="companyRegNo" value={companyProfile.regNo} onChange={e => handleProfileChange('regNo', e.target.value)} className="input-style" />
                                </div>
                                <div>
                                    <label htmlFor="companyTIN" className="label-style">TIN</label>
                                    <input type="text" id="companyTIN" value={companyProfile.tin} onChange={e => handleProfileChange('tin', e.target.value)} className="input-style" />
                                </div>
                                <div>
                                    <label htmlFor="companyUNGM" className="label-style">UNGM</label>
                                    <input type="text" id="companyUNGM" value={companyProfile.ungm} onChange={e => handleProfileChange('ungm', e.target.value)} className="input-style" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="label-style">Company Logo</label>
                            <div className="mt-2 flex flex-col items-center justify-center p-4 bg-slate-700/60 rounded-lg border-2 border-dashed border-slate-600 h-full">
                                <div className="w-24 h-24 mb-4 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                    {companyProfile.logo ? (
                                        <img src={companyProfile.logo} alt="Company Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <BuildingOfficeIcon className="w-12 h-12 text-slate-500" />
                                    )}
                                </div>
                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/png, image/jpeg, image/svg+xml" />
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="btn-secondary text-xs">
                                    <UploadIcon className="w-4 h-4 mr-2" />
                                    {companyProfile.logo ? 'Change Logo' : 'Upload Logo'}
                                </button>
                                {companyProfile.logo && ( <button type="button" onClick={handleRemoveLogo} className="mt-2 text-xs text-red-400 hover:text-red-300"> Remove Logo </button> )}
                                <p className="text-xs text-slate-500 mt-2">PNG, JPG, SVG up to 1MB</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'sources' && (
                 <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Manage RSS Feed Sources</h2>
                    <form onSubmit={handleAddSource} className="flex gap-2">
                        <input type="url" value={newSourceUrl} onChange={(e) => setNewSourceUrl(e.target.value)} placeholder="Add single feed URL..." className="input-style flex-grow" required />
                        <button type="submit" className="flex-shrink-0 btn-primary"><PlusIcon className="w-5 h-5" /></button>
                    </form>
                    <div className="flex items-center my-4"><div className="flex-grow border-t border-slate-600"></div><span className="flex-shrink mx-4 text-slate-500 text-sm">OR</span><div className="flex-grow border-t border-slate-600"></div></div>
                    <div className="space-y-4">
                        <form onSubmit={handleUrlImport} className="flex gap-2">
                            <input type="url" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Import from URL (OPML, JSON, CSV)..." className="input-style flex-grow" required />
                            <button type="submit" className="flex-shrink-0 btn-secondary"><LinkIcon className="w-5 h-5" /></button>
                        </form>
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json,.xml,.opml,.csv,.txt" />
                            <button onClick={triggerFileInput} className="w-full btn-secondary">
                                <UploadIcon className="w-5 h-5 mr-2" /> Import from Local File
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-slate-700 my-6"></div>
                    <div className="space-y-3">
                        {sources.length > 0 ? sources.map((source) => (<SourceItem key={source.id} source={source} onRemove={removeSource} onUpdate={updateSource}/>)) : (<p className="text-slate-400 text-center py-4">No sources added.</p>)}
                    </div>
                 </div>
            )}
            {activeTab === 'team' && ( <Team store={store} currentUser={currentUser} /> )}
            {activeTab === 'workflows' && (
                <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Workflow Templates</h2>
                    <p className="text-sm text-slate-400 mb-4">Create and manage task templates to standardize your tender processes and save time.</p>
                    <button onClick={handleAddNewTemplate} className="w-full btn-secondary"><PlusIcon className="w-5 h-5 mr-2" /> Create New Task Template</button>
                    <div className="space-y-3 mt-4">
                        {taskTemplates.map(template => (
                        <div key={template.id} className="flex items-center justify-between bg-slate-700/60 p-3 rounded-md">
                            <div><p className="font-medium text-slate-200">{template.name}</p><p className="text-xs text-slate-400">{template.tasks.length} tasks</p></div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEditTemplate(template)} className="btn-icon"><EditIcon className="w-5 h-5" /></button>
                                <button onClick={() => window.confirm("Delete this template?") && removeTaskTemplate(template.id)} className="btn-icon-danger"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>))}
                    </div>
                </div>
            )}
            {activeTab === 'appearance' && (
                <AppearanceSettings store={store} />
            )}
             {activeTab === 'ai' && (
                <div className="space-y-6">
                    <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white">AI Configuration</h2>
                        <p className="text-sm text-slate-400 mb-4">Configure the AI provider and API key for features like tender summarization.</p>
                        <div className="flex items-center justify-between bg-slate-700/60 p-3 rounded-md">
                            <div><span className="text-sm text-slate-400">Current Provider</span><p className="font-semibold text-white">{aiConfig.provider}</p></div>
                            <button onClick={() => setIsAIModalOpen(true)} className="btn-primary">Configure AI</button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'mail' && (
                <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white">Mail Service Configuration</h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Enter the full URL for your webmail client (e.g., Roundcube) to embed it within the Mail Hub.
                    </p>
                    <form onSubmit={handleSaveMailSettings}>
                        <div>
                            <label htmlFor="mail-url" className="label-style">Webmail URL</label>
                            <input
                                type="url"
                                id="mail-url"
                                placeholder="https://webmail.yourdomain.com"
                                value={currentMailSettings.url}
                                onChange={e => setCurrentMailSettings({ url: e.target.value })}
                                className="input-style"
                                required
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button type="submit" className="btn-primary">Save Mail URL</button>
                        </div>
                    </form>
                </div>
            )}
            {activeTab === 'data' && (
                <div className="space-y-6">
                    <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white">Data Storage & Backup</h2>
                        <p className="text-sm text-slate-400 mb-4">Choose how your data is stored and managed.</p>
                        <div>
                            <label className="label-style">Storage Mode</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <label className={`flex-1 p-3 border-2 rounded-md cursor-pointer ${storageMode === StorageMode.LOCAL_ONLY ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'}`}>
                                    <input type="radio" name="storageMode" value={StorageMode.LOCAL_ONLY} checked={storageMode === StorageMode.LOCAL_ONLY} onChange={e => setStorageMode(e.target.value as StorageMode)} className="sr-only"/>
                                    <p className="font-semibold text-white">Local Only</p>
                                    <p className="text-xs text-slate-400">All data is stored exclusively in your browser. Fast and private.</p>
                                </label>
                                 <label className={`flex-1 p-3 border-2 rounded-md cursor-pointer ${storageMode === StorageMode.CLOUD_BACKUP ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'}`}>
                                    <input type="radio" name="storageMode" value={StorageMode.CLOUD_BACKUP} checked={storageMode === StorageMode.CLOUD_BACKUP} onChange={e => setStorageMode(e.target.value as StorageMode)} className="sr-only"/>
                                    <p className="font-semibold text-white">Local with Cloud Backup</p>
                                    <p className="text-xs text-slate-400">Data is local, but you can manually sync to the cloud.</p>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-white">Manual Data Actions</h3>
                             <p className="text-sm text-slate-400 mb-4">Export all data for backup or import from a previously exported file. <span className="font-bold text-yellow-400">Importing will overwrite all current data.</span></p>
                             <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleExportData} className="btn-secondary w-full sm:w-auto"><ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Export All Data</button>
                                <input type="file" ref={backupInputRef} onChange={handleImportData} className="hidden" accept=".json"/>
                                <button onClick={() => backupInputRef.current?.click()} className="btn-secondary w-full sm:w-auto"><ArrowUpTrayIcon className="w-5 h-5 mr-2" /> Import from Backup</button>
                            </div>
                        </div>
                    </div>
                     <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white">Cloud Sync</h2>
                        <p className="text-sm text-slate-400 mb-4">Sync your workspace data to a cloud project for backup and cross-device access.</p>
                        
                        <div>
                            <label className="label-style">Cloud Provider</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               {Object.values(CloudProvider).map(p => (
                                   <label key={p} className={`flex items-center justify-center gap-2 p-3 border-2 rounded-md cursor-pointer ${cloudSyncConfig.provider === p ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'}`}>
                                       <input type="radio" name="cloudProvider" value={p} checked={cloudSyncConfig.provider === p} onChange={e => updateCloudSyncConfig({provider: e.target.value as CloudProvider})} className="sr-only"/>
                                       {p === CloudProvider.SUPABASE && <SupabaseLogoIcon className="w-5 h-5 text-emerald-400" />}
                                       {p === CloudProvider.FIREBASE && <FirebaseLogoIcon className="w-5 h-5 text-yellow-400" />}
                                       {p === CloudProvider.AWS && <AWSLogoIcon className="w-5 h-5 text-orange-400" />}
                                       {p === CloudProvider.AZURE && <AzureLogoIcon className="w-5 h-5 text-sky-400" />}
                                       <span className="text-sm font-medium text-white">{p.replace('S3', '').replace('Blob Storage', '')}</span>
                                   </label>
                               ))}
                            </div>
                        </div>
                        
                        {cloudSyncConfig.provider === CloudProvider.SUPABASE && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="label-style">Project URL</label><input type="url" placeholder="https://<id>.supabase.co" value={cloudSyncConfig.projectUrl || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, projectUrl: e.target.value})} className="input-style" /></div>
                                    <div><label className="label-style">Public API Key (anon)</label><input type="password" value={cloudSyncConfig.apiKey || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, apiKey: e.target.value})} className="input-style" /></div>
                                </div>
                                <details className="mt-4 text-sm text-slate-400 group"><summary className="cursor-pointer hover:text-white">View Setup Instructions</summary><div className="mt-2 p-4 bg-slate-900/50 rounded-md prose prose-sm prose-invert max-w-none"><ol><li>Go to your Supabase project's "SQL Editor", click "+ New query", paste the script below, and run it.</li></ol><pre className="bg-slate-800 p-2 rounded-md text-xs"><code>{`CREATE TABLE app_state (id BIGINT PRIMARY KEY, data JSONB, updated_at TIMESTAMPTZ DEFAULT NOW());\nALTER TABLE app_state ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Enable access for anon users" ON app_state FOR ALL TO anon USING (true) WITH CHECK (true);\nINSERT INTO app_state (id, data) VALUES (1, '{}');`}</code></pre></div></details>
                            </div>
                        )}

                        {cloudSyncConfig.provider === CloudProvider.FIREBASE && (
                           <div className="mt-4 space-y-4">
                                <div><label className="label-style">Firebase Config (JSON)</label><textarea placeholder='Paste your Firebase config object here...' value={cloudSyncConfig.firebaseConfig || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, firebaseConfig: e.target.value})} className="input-style min-h-[100px]" /></div>
                                <details className="mt-4 text-sm text-slate-400 group"><summary className="cursor-pointer hover:text-white">View Setup Instructions</summary><div className="mt-2 p-4 bg-slate-900/50 rounded-md prose prose-sm prose-invert max-w-none"><ol><li>Go to your Firebase project, add a Web App.</li><li>Copy the `firebaseConfig` object and paste it above.</li><li>Go to "Firestore Database" -> "Rules" and set them to `allow read, write: if true;` for development. <strong>(Warning: Not for production)</strong></li></ol></div></details>
                           </div>
                        )}

                        {cloudSyncConfig.provider === CloudProvider.AWS && (
                           <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="label-style">Bucket Name</label><input type="text" value={cloudSyncConfig.awsBucket || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, awsBucket: e.target.value})} className="input-style" /></div>
                                    <div><label className="label-style">Region</label><input type="text" placeholder="e.g., us-east-1" value={cloudSyncConfig.awsRegion || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, awsRegion: e.target.value})} className="input-style" /></div>
                                    <div><label className="label-style">Access Key ID</label><input type="password" value={cloudSyncConfig.awsAccessKeyId || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, awsAccessKeyId: e.target.value})} className="input-style" /></div>
                                    <div><label className="label-style">Secret Access Key</label><input type="password" value={cloudSyncConfig.awsSecretAccessKey || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, awsSecretAccessKey: e.target.value})} className="input-style" /></div>
                                </div>
                                <details className="mt-4 text-sm text-slate-400 group"><summary className="cursor-pointer hover:text-white">View Setup Instructions</summary><div className="mt-2 p-4 bg-slate-900/50 rounded-md prose prose-sm prose-invert max-w-none"><ol><li>Create an S3 bucket and an IAM user with S3 read/write permissions for that bucket.</li><li>Enable CORS on your bucket with a rule allowing GET/PUT from your app's origin.</li></ol></div></details>
                           </div>
                        )}

                        {cloudSyncConfig.provider === CloudProvider.AZURE && (
                           <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="label-style">Storage Account Name</label><input type="text" value={cloudSyncConfig.azureAccountName || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, azureAccountName: e.target.value})} className="input-style" /></div>
                                    <div><label className="label-style">Container Name</label><input type="text" value={cloudSyncConfig.azureContainerName || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, azureContainerName: e.target.value})} className="input-style" /></div>
                                </div>
                                <div><label className="label-style">SAS Token</label><textarea placeholder="Paste your Shared Access Signature (SAS) token here" value={cloudSyncConfig.azureSasToken || ''} onChange={e => updateCloudSyncConfig({...cloudSyncConfig, azureSasToken: e.target.value})} className="input-style min-h-[80px]" /></div>
                                <details className="mt-4 text-sm text-slate-400 group"><summary className="cursor-pointer hover:text-white">View Setup Instructions</summary><div className="mt-2 p-4 bg-slate-900/50 rounded-md prose prose-sm prose-invert max-w-none"><ol><li>In your Azure Storage Account, go to "Containers" and create one.</li><li>Go to "Shared access signature" to generate a SAS token with Read, Write, and List permissions for the service.</li><li>Enable CORS for your storage account.</li></ol></div></details>
                           </div>
                        )}


                        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
                            <button onClick={() => syncToCloud()} disabled={cloudSyncState.status === 'syncing' || cloudSyncState.status === 'pulling'} className="btn-secondary w-full sm:w-auto"><CloudArrowUpIcon className="w-5 h-5 mr-2"/> {cloudSyncState.status === 'syncing' ? 'Syncing...' : 'Sync to Cloud'}</button>
                            <button onClick={() => pullFromCloud()} disabled={cloudSyncState.status === 'syncing' || cloudSyncState.status === 'pulling'} className="btn-secondary w-full sm:w-auto"><CloudArrowDownIcon className="w-5 h-5 mr-2"/> {cloudSyncState.status === 'pulling' ? 'Pulling...' : 'Pull from Cloud'}</button>
                        </div>
                        {cloudSyncState.status !== 'idle' && (
                             <div className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${cloudSyncState.status === 'success' ? 'bg-green-500/20 text-green-300' : cloudSyncState.status === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                {cloudSyncState.status === 'success' && <CheckCircleIconSolid className="w-5 h-5" />}
                                {cloudSyncState.status === 'error' && <XCircleIconSolid className="w-5 h-5" />}
                                {cloudSyncState.status === 'syncing' && <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>}
                                {cloudSyncState.status === 'pulling' && <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>}
                                <span>
                                    {cloudSyncState.status === 'success' && `Sync successful. Last sync: ${formatTimeAgo(cloudSyncState.lastSync!)}`}
                                    {cloudSyncState.status === 'error' && `Error: ${cloudSyncState.error}`}
                                    {cloudSyncState.status === 'syncing' && 'Syncing data to the cloud...'}
                                    {cloudSyncState.status === 'pulling' && 'Pulling data from the cloud...'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
             {activeTab === 'documentation' && (
                <Documentation />
             )}
          </main>
      </div>
      
      <AIConfigModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} currentConfig={aiConfig} onSave={updateAIConfig} />
      <TaskTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} store={store} templateToEdit={editingTemplate} />

    </div>
  );
};

export default Settings;