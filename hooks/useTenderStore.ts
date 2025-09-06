import { useState, useEffect, useCallback } from 'react';
import { 
    TenderStatus, 
    DocumentStatus,
    InvoiceStatus,
    TechnicalOfferType,
    ActivityType,
    ShipmentStatus,
    TaskStatus,
    AIProvider,
    DocumentCategory,
    NotificationType,
    AccountType,
    CloudProvider,
    VendorType,
    POStatus,
    StorageMode,
    DocumentTemplateStyle,
    type Source, 
    type Tender, 
    type WatchlistItem,
    type QuoteItem,
    type Invoice,
    type FinancialDetails,
    type ManagedDocument,
    type CompanyProfile,
    type OfferDocumentType,
    type ActivityLog,
    type CatalogItem,
    type Vendor,
    type TeamMember,
    type Client,
    type Shipment,
    type BackupData,
    type Task,
    type AIConfig,
    type PurchaseOrder,
    type Expense,
    type Notification,
    type TaskTemplate,
    type RiskAssessment,
    type DocumentAnalysis,
    type Account,
    type JournalEntry,
    type CloudSyncConfig,
    type CloudSyncState,
    type DocumentSettings,
    type TechnicalDetails,
    type Comment,
    type Contact,
    type Interaction,
    type VendorDocument,
    VendorDocumentCategory,
    type ClientDocument,
    ClientDocumentCategory,
    type Toast,
    type AIInsights,
    type MailSettings,
} from '../types';
import { DEFAULT_SOURCES } from '../constants';
import { fetchAndParseRss } from '../services/rssService';
import { assessTenderRisk, analyzeDocument, generateWorkspaceSummary, categorizeTender, extractTenderInsights } from '../services/aiService';

const createActivityLog = (type: ActivityType, description: string, tenderId: string, tenderTitle: string): ActivityLog => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    description,
    tenderId,
    tenderTitle,
});


export const useTenderStore = () => {
  const [sources, setSources] = useState<Source[]>(() => {
    try {
      const localSources = localStorage.getItem('tender_sources');
      return localSources ? JSON.parse(localSources) : DEFAULT_SOURCES;
    } catch (e) {
      return DEFAULT_SOURCES;
    }
  });

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const localWatchlist = localStorage.getItem('tender_watchlist');
      // Migration step for old data structure
      const parsed = localWatchlist ? JSON.parse(localWatchlist) : [];
      return parsed.map((item: WatchlistItem) => {
          if (item.clientDocuments && !item.documents) {
              item.documents = item.clientDocuments.map(doc => ({
                  ...doc,
                  category: DocumentCategory.CLIENT,
                  uploadedBy: 'System (migrated)',
                  uploadedAt: new Date().toISOString(),
              }));
              delete item.clientDocuments;
          }
          return item;
      });
    } catch(e) {
      return [];
    }
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
        const localProfile = localStorage.getItem('tender_company_profile');
        return localProfile ? JSON.parse(localProfile) : {
            name: 'EMPIRE UNITED FOR INVESTMENT CO. LTD',
            address: '4th Floor, Home Plaza Building, Mamoun El-Briar Street, Khartoum, Sudan',
            phone: '+249123811911',
            email: 'info@euic.sd',
            regNo: '57964',
            tin: '300001078438',
            ungm: '#909605',
        };
    } catch(e) {
      return { name: '', address: '', phone: '', email: '', regNo: '', tin: '', ungm: '', logo: undefined };
    }
  });

  const updateCompanyProfile = useCallback((profileUpdate: Partial<CompanyProfile>) => {
    setCompanyProfile(prev => ({ ...prev, ...profileUpdate }));
  }, []);

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    try {
      const localCatalog = localStorage.getItem('tender_catalog');
      return localCatalog ? JSON.parse(localCatalog) : [];
    } catch(e) {
      return [];
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const localVendors = localStorage.getItem('tender_vendors');
      const localLogisticsVendors = localStorage.getItem('tender_logistics_vendors');
      
      let parsedVendors = localVendors ? JSON.parse(localVendors) : [];
      const parsedLogistics = localLogisticsVendors ? JSON.parse(localLogisticsVendors) : [];

      if (parsedLogistics.length > 0) {
        const merged = [
          ...parsedVendors.map((v: any) => ({ ...v, vendorType: v.vendorType || VendorType.GOODS_SUPPLIER })),
          ...parsedLogistics.map((lv: any) => ({ ...lv, id: `lv_${lv.id}`, vendorType: VendorType.LOGISTICS_PARTNER, assignedTeamMemberId: null, notes: '' }))
        ];
        
        const uniqueVendors = Array.from(new Map(merged.map(v => [v.name, v])).values());
        
        localStorage.setItem('tender_vendors', JSON.stringify(uniqueVendors));
        localStorage.removeItem('tender_logistics_vendors');
        return uniqueVendors;
      }
      
      return parsedVendors.map((v: any) => ({ ...v, vendorType: v.vendorType || VendorType.GOODS_SUPPLIER }));
    } catch (e) {
      return [];
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const localTeam = localStorage.getItem('tender_team');
      return localTeam ? JSON.parse(localTeam) : [];
    } catch (e) {
      return [];
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const localClients = localStorage.getItem('tender_clients');
      return localClients ? JSON.parse(localClients) : [];
    } catch (e) {
      return [];
    }
  });

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
        const localData = localStorage.getItem('tender_shipments');
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
        const localData = localStorage.getItem('tender_tasks');
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
  });

  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(() => {
    try {
        const localData = localStorage.getItem('tender_task_templates');
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
        const localId = localStorage.getItem('tender_current_user_id');
        return localId ? JSON.parse(localId) : null;
    } catch (e) {
        return null;
    }
  });

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
        const localConfig = localStorage.getItem('tender_ai_config');
        return localConfig ? JSON.parse(localConfig) : {
            provider: AIProvider.GEMINI,
            apiKey: '',
            model: 'gemini-2.5-flash',
        };
    } catch (e) {
        return { provider: AIProvider.GEMINI, apiKey: '', model: 'gemini-2.5-flash' };
    }
  });

  const updateAIConfig = useCallback((config: AIConfig) => {
    setAiConfig(config);
  }, []);

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
        const localData = localStorage.getItem('tender_expenses');
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
  });
  
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
        const localData = localStorage.getItem('tender_notifications');
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
        const localData = localStorage.getItem('tender_expense_categories');
        return localData ? JSON.parse(localData) : ['Travel', 'Software', 'Office Supplies', 'Marketing'];
    } catch (e) {
        return ['Travel', 'Software', 'Office Supplies', 'Marketing'];
    }
  });

  const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>(() => {
    try {
        const localData = localStorage.getItem('tender_chart_of_accounts');
        return localData ? JSON.parse(localData) : [
            { id: 'asset_cash', name: 'Cash', type: AccountType.ASSET },
            { id: 'asset_ar', name: 'Accounts Receivable', type: AccountType.ASSET },
            { id: 'asset_inventory', name: 'Inventory', type: AccountType.ASSET },
            { id: 'liability_ap', name: 'Accounts Payable', type: AccountType.LIABILITY },
            { id: 'equity_oe', name: "Owner's Equity", type: AccountType.EQUITY },
            { id: 'rev_sales', name: 'Sales Revenue', type: AccountType.REVENUE },
            { id: 'exp_cogs', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
            { id: 'exp_travel', name: 'Travel', type: AccountType.EXPENSE },
            { id: 'exp_software', name: 'Software', type: AccountType.EXPENSE },
        ];
    } catch (e) {
        return [];
    }
  });
  
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
        const localData = localStorage.getItem('tender_journal_entries');
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
  });
  
  const [storageMode, setStorageMode] = useState<StorageMode>(() => {
    try {
        const localMode = localStorage.getItem('tender_storage_mode');
        return localMode ? JSON.parse(localMode) : StorageMode.LOCAL_ONLY;
    } catch (e) {
        return StorageMode.LOCAL_ONLY;
    }
  });
  
  const [cloudSyncConfig, setCloudSyncConfig] = useState<CloudSyncConfig>(() => {
    try {
        const localConfig = localStorage.getItem('tender_cloud_sync_config');
        return localConfig ? JSON.parse(localConfig) : {
            provider: CloudProvider.SUPABASE,
        };
    } catch (e) {
        return { provider: CloudProvider.SUPABASE };
    }
  });

  const updateCloudSyncConfig = useCallback((config: Partial<CloudSyncConfig>) => {
    setCloudSyncConfig(prev => ({ ...prev, ...config }));
  }, []);

  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    status: 'idle',
  });

  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>(() => {
    const defaults: DocumentSettings = {
        accentColor: '#007bff',
        fontFamily: 'Inter',
        fontSize: 10,
        showLogo: true,
        logoSize: 'medium',
        pageMargin: 'medium',
        documentTitleQuote: 'QUOTATION',
        documentTitleProforma: 'PROFORMA INVOICE',
        documentTitleInvoice: 'COMMERCIAL INVOICE',
        documentTitleDeliveryNote: 'DELIVERY NOTE',
        documentTitlePO: 'PURCHASE ORDER',
        notesLabel: 'Notes',
        termsLabel: 'Terms & Conditions',
        templateStyle: DocumentTemplateStyle.MODERN,
        logoPosition: 'left',
        tableTheme: 'striped',
        secondaryColor: '#f3f4f6',
        textColor: '#111827',
        footerText: 'Thank you for your business!',
        showPageNumbers: true,
    };
    try {
        const localSettings = localStorage.getItem('tender_document_settings');
        const parsed = localSettings ? JSON.parse(localSettings) : {};
        return { ...defaults, ...parsed };
    } catch (e) {
        return defaults;
    }
  });

  const updateDocumentSettings = useCallback((settingsUpdate: Partial<DocumentSettings>) => {
    setDocumentSettings(prev => ({ ...prev, ...settingsUpdate }));
  }, []);
  
  const [mailSettings, setMailSettings] = useState<MailSettings>(() => {
    try {
      const localSettings = localStorage.getItem('tender_mail_settings');
      return localSettings ? JSON.parse(localSettings) : { url: '' };
    } catch (e) {
      return { url: '' };
    }
  });

  const updateMailSettings = useCallback((settings: MailSettings) => {
    setMailSettings(settings);
  }, []);

  const [poCounter, setPoCounter] = useState<number>(() => {
    try {
        const localCounter = localStorage.getItem('tender_po_counter');
        return localCounter ? JSON.parse(localCounter) : 0;
    } catch (e) {
        return 0;
    }
  });


  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  }, []);


  useEffect(() => {
    localStorage.setItem('tender_sources', JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem('tender_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('tender_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('tender_catalog', JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem('tender_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('tender_team', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('tender_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('tender_shipments', JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem('tender_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tender_task_templates', JSON.stringify(taskTemplates));
  }, [taskTemplates]);

  useEffect(() => {
    localStorage.setItem('tender_current_user_id', JSON.stringify(currentUserId));
  }, [currentUserId]);
  
  useEffect(() => {
    localStorage.setItem('tender_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem('tender_expenses', JSON.stringify(expenses));
  }, [expenses]);
  
  useEffect(() => {
    localStorage.setItem('tender_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('tender_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('tender_chart_of_accounts', JSON.stringify(chartOfAccounts));
  }, [chartOfAccounts]);
  
  useEffect(() => {
    localStorage.setItem('tender_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('tender_storage_mode', JSON.stringify(storageMode));
  }, [storageMode]);

  useEffect(() => {
    localStorage.setItem('tender_cloud_sync_config', JSON.stringify(cloudSyncConfig));
  }, [cloudSyncConfig]);

  useEffect(() => {
    localStorage.setItem('tender_document_settings', JSON.stringify(documentSettings));
  }, [documentSettings]);

  useEffect(() => {
    localStorage.setItem('tender_mail_settings', JSON.stringify(mailSettings));
  }, [mailSettings]);
  
  useEffect(() => {
    localStorage.setItem('tender_po_counter', JSON.stringify(poCounter));
  }, [poCounter]);


  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const exists = notifications.some(n => !n.isRead && n.message === notification.message);
    if (exists) return;

    const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, [notifications]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Smart notification generation - run once on load
  useEffect(() => {
    const generateInitialNotifications = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Deadline approaching (within 7 days and not passed)
        watchlist.forEach(item => {
            const closingDate = new Date(item.tender.closingDate);
            closingDate.setHours(0,0,0,0);
            if (closingDate < today) return; // Don't notify for past deadlines
            const diffDays = Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            if (diffDays <= 7) {
                addNotification({
                    type: NotificationType.DEADLINE_APPROACHING,
                    message: `Deadline for "${item.tender.title}" is in ${diffDays} day(s).`,
                    tenderId: item.tender.id,
                });
            }
        });

        // Overdue invoices
        watchlist.forEach(item => {
            (item.invoices || []).forEach(invoice => {
                const dueDate = new Date(invoice.dueDate + 'T00:00:00');
                if (dueDate < today && invoice.status !== InvoiceStatus.PAID) {
                    addNotification({
                        type: NotificationType.INVOICE_OVERDUE,
                        message: `Invoice #${invoice.invoiceNumber} for "${item.tender.title}" is overdue.`,
                        tenderId: item.tender.id,
                    });
                }
            });
        });

        // Overdue tasks
        tasks.forEach(task => {
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            if (dueDate < today && task.status !== TaskStatus.COMPLETED) {
                addNotification({
                    type: NotificationType.TASK_OVERDUE,
                    message: `Task "${task.title}" is overdue.`,
                    tenderId: task.tenderId,
                });
            }
        });
    };

    generateInitialNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withActivityLog = useCallback((tenderId: string, type: ActivityType, description: string, updateFn: (item: WatchlistItem) => WatchlistItem) => {
    setWatchlist(prev => prev.map(item => {
      if (item.tender.id === tenderId) {
        const newLog = createActivityLog(type, description, item.tender.id, item.tender.title);
        const updatedItem = updateFn(item);
        return {
          ...updatedItem,
          activityLog: [newLog, ...(item.activityLog || [])],
        };
      }
      return item;
    }));
  }, []);

  const refreshTenders = useCallback(async (force = false) => {
    if (!force && lastFetched && (Date.now() - lastFetched < 1000 * 60 * 5)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allTendersPromises = sources.map(source => fetchAndParseRss(source.url));
      const allTendersArrays = await Promise.all(allTendersPromises);
      const flattenedTenders = allTendersArrays.flat();
      const uniqueTenders = Array.from(new Map(flattenedTenders.map(t => [t.id, t])).values());
      setTenders(uniqueTenders);
      setLastFetched(Date.now());
    } catch (e: any) {
      setError(e.message || "Failed to fetch tenders.");
    } finally {
      setLoading(false);
    }
  }, [sources, lastFetched]);

  useEffect(() => {
    refreshTenders(true);
  }, [sources]);

  const addSource = useCallback((url: string) => {
    const newSource = { id: crypto.randomUUID(), url };
    setSources(prev => [...prev, newSource]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSource = useCallback((id: string, newUrl: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, url: newUrl } : s));
  }, []);
  
  const addMultipleSources = useCallback((urls: string[]) => {
    setSources(prev => {
        const existingUrls = new Set(prev.map(s => s.url));
        const newSources = urls
            .filter(url => !existingUrls.has(url))
            .map(url => ({ id: crypto.randomUUID(), url }));
        return [...prev, ...newSources];
    });
  }, []);

  const addToWatchlist = useCallback(async (tender: Tender) => {
    if (watchlist.some(item => item.tender.id === tender.id)) return;

    let category = 'Uncategorized';
    let aiInsights: AIInsights = {};

    if (aiConfig.apiKey && aiConfig.model) {
        try {
            const [catResult, insightsResult] = await Promise.all([
                categorizeTender(tender, aiConfig),
                extractTenderInsights(tender, aiConfig)
            ]);
            category = catResult;
            aiInsights = insightsResult;
        } catch (e) {
            console.error("AI processing failed:", e);
            addToast(`AI processing failed: ${(e as Error).message}`, 'error');
        }
    }
    
    setWatchlist(prev => {
        if (prev.some(item => item.tender.id === tender.id)) return prev;
        const newLog = createActivityLog(ActivityType.TENDER_ADDED, `Tender "${tender.title}" added.`, tender.id, tender.title);
        const newWatchlistItem: WatchlistItem = {
            tender,
            status: TenderStatus.WATCHING,
            addedAt: new Date().toISOString(),
            category: category,
            aiInsights: aiInsights,
            quoteItems: [],
            invoices: [],
            notes: '',
            financialDetails: {},
            technicalOfferType: TechnicalOfferType.GOODS,
            documents: [],
            activityLog: [newLog]
        };
        return [...prev, newWatchlistItem];
    });
}, [aiConfig, watchlist, addToast]);
  
  const addManualTender = useCallback((tenderData: Omit<Tender, 'id' | 'publishedDate' | 'isClosingDateEstimated' | 'source'>) => {
    const newTender: Tender = {
      ...tenderData,
      id: crypto.randomUUID(),
      publishedDate: new Date().toISOString(),
      isClosingDateEstimated: false,
      source: 'Manual Entry'
    };
    addToWatchlist(newTender);
  }, [addToWatchlist]);

  const updateWatchlistStatus = useCallback((tenderId: string, status: TenderStatus) => {
    withActivityLog(tenderId, ActivityType.STATUS_CHANGE, `Status changed to ${status}.`, (item) => {
        addNotification({
            type: NotificationType.STATUS_CHANGED,
            message: `Status for "${item.tender.title}" changed to ${status}.`,
            tenderId: item.tender.id,
        });
        return { ...item, status };
    });
  }, [withActivityLog, addNotification]);
  
  const removeFromWatchlist = useCallback((tenderId: string) => {
    setWatchlist(prev => prev.filter(item => item.tender.id !== tenderId));
  }, []);

  const updateTenderClosingDate = useCallback((tenderId: string, newDate: string) => {
    setWatchlist(prev => prev.map(item => item.tender.id === tenderId ? { ...item, tender: {...item.tender, closingDate: new Date(newDate).toISOString()} } : item));
  }, []);
  
  const updateTenderCategory = useCallback((tenderId: string, category: string) => {
    setWatchlist(prev => prev.map(item => item.tender.id === tenderId ? { ...item, category } : item));
  }, []);

  const updateNotes = useCallback((tenderId: string, notes: string) => {
    setWatchlist(prev => prev.map(item => item.tender.id === tenderId ? { ...item, notes } : item));
  }, []);

  const assignTenderToMember = useCallback((tenderId: string, memberId: string | null, assignerName: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    const description = member
      ? `${assignerName} assigned this tender to ${member.name}.`
      : `${assignerName} unassigned this tender.`;
    
    withActivityLog(tenderId, ActivityType.TENDER_ASSIGNED, description, (item) => ({ ...item, assignedTeamMemberId: memberId }));
  }, [withActivityLog, teamMembers]);

  const assignTenderToClient = useCallback((tenderId: string, clientId: string | null) => {
    setWatchlist(prev => prev.map(item => item.tender.id === tenderId ? { ...item, financialDetails: {...item.financialDetails, clientId }} : item));
  }, []);

  const updateFinancialDetails = useCallback((tenderId: string, details: Partial<FinancialDetails>) => {
    const description = details.paymentMethod 
      ? "Payment method updated." 
      : "Financial details updated.";
    const activityType = details.paymentMethod 
      ? ActivityType.PAYMENT_METHOD_UPDATED 
      : ActivityType.FINANCIALS_UPDATED;

    withActivityLog(tenderId, activityType, description, (item) => ({
        ...item,
        financialDetails: { ...item.financialDetails, ...details },
    }));
  }, [withActivityLog]);
  
  const addCatalogItem = useCallback((item: Omit<CatalogItem, 'id'>): CatalogItem => {
    const newItem: CatalogItem = { ...item, id: crypto.randomUUID()};
    setCatalog(prev => [...prev, newItem]);
    return newItem;
  }, []);
  
  const addQuoteItem = useCallback((tenderId: string, item: Omit<QuoteItem, 'id'>) => {
    let newItem: QuoteItem = { ...item, id: crypto.randomUUID() };

    // Auto-save to catalog if it's a manual entry with a name and doesn't already exist
    if (!item.catalogItemRef && item.itemName) {
        const existingCatalogItem = catalog.find(ci => ci.itemName.toLowerCase() === item.itemName.toLowerCase());
        
        if (!existingCatalogItem) {
            const newCatalogItemData: Omit<CatalogItem, 'id'> = {
                itemName: item.itemName,
                description: item.description,
                manufacturer: item.manufacturer,
                model: item.model,
                itemType: item.itemType || 'Goods',
                category: 'Uncategorized',
                salePrice: item.unitPrice,
                cost: item.cost || 0,
                uom: item.uom,
                vendorId: null,
                assignedPersonId: null,
                technicalSpecs: item.technicalDetails || {},
                documents: []
            };
            const newCatalogItem = addCatalogItem(newCatalogItemData);
            newItem.catalogItemRef = newCatalogItem.id;
        } else {
            newItem.catalogItemRef = existingCatalogItem.id;
        }
    }

    withActivityLog(tenderId, ActivityType.QUOTE_ITEM_ADDED, `Added item: ${item.itemName || item.description}.`, (watchlistItem) => ({
      ...watchlistItem,
      quoteItems: [...(watchlistItem.quoteItems || []), newItem],
    }));
}, [withActivityLog, addCatalogItem, catalog]);
  
  const addMultipleQuoteItems = useCallback((tenderId: string, items: Omit<QuoteItem, 'id'>[]) => {
      const newItems: QuoteItem[] = items.map(item => ({...item, id: crypto.randomUUID()}));
      withActivityLog(tenderId, ActivityType.QUOTE_ITEM_ADDED, `Added ${items.length} items from catalog.`, (watchlistItem) => ({
        ...watchlistItem,
        quoteItems: [...(watchlistItem.quoteItems || []), ...newItems],
      }));
  }, [withActivityLog]);

  const updateQuoteItem = useCallback((tenderId: string, itemId: string, updatedItem: QuoteItem) => {
    withActivityLog(tenderId, ActivityType.QUOTE_ITEM_UPDATED, `Updated item: ${updatedItem.itemName || updatedItem.description}.`, (watchlistItem) => ({
      ...watchlistItem,
      quoteItems: (watchlistItem.quoteItems || []).map(item => item.id === itemId ? updatedItem : item),
    }));
  }, [withActivityLog]);
  
  const removeQuoteItem = useCallback((tenderId: string, itemId: string) => {
    let desc = '';
    setWatchlist(prev => prev.map(item => {
      if (item.tender.id === tenderId) {
        const itemToRemove = item.quoteItems?.find(qi => qi.id === itemId);
        desc = itemToRemove?.itemName || itemToRemove?.description || 'an item';
        const newLog = createActivityLog(ActivityType.QUOTE_ITEM_REMOVED, `Removed item: ${desc}.`, item.tender.id, item.tender.title);
        return {
          ...item,
          quoteItems: (item.quoteItems || []).filter(qi => qi.id !== itemId),
          activityLog: [newLog, ...(item.activityLog || [])],
        };
      }
      return item;
    }));
  }, []);

  const updateTechnicalOfferType = useCallback((tenderId: string, type: TechnicalOfferType) => {
    setWatchlist(prev => prev.map(item => item.tender.id === tenderId ? { ...item, technicalOfferType: type } : item));
  }, []);

  const updateTechnicalOfferSOP = useCallback((tenderId: string, sop: string[]) => {
    setWatchlist(prev => prev.map(item => item.tender.id === tenderId ? { ...item, technicalOfferSOP: sop } : item));
  }, []);

  const addDocument = useCallback((tenderId: string, file: { name: string; data: string; type: string }, category: DocumentCategory, uploaderName: string, isGenerated = false) => {
    const newDoc: ManagedDocument = { 
        id: crypto.randomUUID(),
        name: file.name,
        status: DocumentStatus.COMPLETED,
        fileName: file.name,
        fileData: file.data,
        mimeType: file.type,
        category,
        uploadedBy: uploaderName,
        uploadedAt: new Date().toISOString(),
        isGenerated,
    };
    
    const logDescription = `${uploaderName} uploaded "${file.name}" to ${category}.`;
    withActivityLog(tenderId, ActivityType.DOCUMENT_UPLOADED, logDescription, (item) => ({
        ...item,
        documents: [...(item.documents || []), newDoc]
    }));
  }, [withActivityLog]);

  const removeDocument = useCallback((tenderId: string, docId: string, removerName: string) => {
    let docName = 'a document';
    let category = 'a category';
    setWatchlist(prev => prev.map(item => {
      if (item.tender.id === tenderId) {
        const docToRemove = (item.documents || []).find(d => d.id === docId);
        if (docToRemove) {
            docName = docToRemove.name;
            category = docToRemove.category;
        }
        const newLog = createActivityLog(ActivityType.DOCUMENT_REMOVED, `${removerName} removed "${docName}" from ${category}.`, item.tender.id, item.tender.title);
        return {
          ...item,
          documents: (item.documents || []).filter(d => d.id !== docId),
          activityLog: [newLog, ...(item.activityLog || [])],
        };
      }
      return item;
    }));
  }, []);

  const createInvoiceFromQuote = useCallback((tenderId: string) => {
    setWatchlist(prev => prev.map(item => {
      if (item.tender.id === tenderId) {
        const subtotal = item.quoteItems?.reduce((acc, q) => acc + q.quantity * q.unitPrice, 0) || 0;
        const delivery = item.financialDetails?.deliveryCost ?? 0;
        const installation = item.financialDetails?.installationCost ?? 0;
        const vat = subtotal * ((item.financialDetails?.vatPercentage ?? 0) / 100);
        const total = subtotal + delivery + installation + vat;
        
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(issueDate.getDate() + 30);

        const newInvoice: Invoice = {
            id: crypto.randomUUID(),
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            issueDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            description: `Invoice for ${item.tender.title}`,
            amount: total,
            status: InvoiceStatus.DRAFT,
        };
        const newLog = createActivityLog(ActivityType.INVOICE_CREATED, `Created invoice #${newInvoice.invoiceNumber}.`, item.tender.id, item.tender.title);
        return {...item, invoices: [...(item.invoices || []), newInvoice], activityLog: [newLog, ...(item.activityLog || [])]};
      }
      return item;
    }));
  }, []);

  const addInvoice = useCallback((tenderId: string, invoiceData: Omit<Invoice, 'id'>) => {
    withActivityLog(tenderId, ActivityType.INVOICE_CREATED, `Created invoice #${invoiceData.invoiceNumber}.`, (item) => {
        const newInvoice: Invoice = {
            ...invoiceData,
            id: crypto.randomUUID(),
        };
        return {...item, invoices: [...(item.invoices || []), newInvoice]};
    });
  }, [withActivityLog]);

  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = { ...entry, id: crypto.randomUUID() };
    setJournalEntries(prev => [newEntry, ...prev]);
  }, []);
  
  const findAccountByName = useCallback((accounts: Account[], name: string, type?: AccountType): Account | undefined => {
    return accounts.find(acc => acc.name.toLowerCase() === name.toLowerCase() && (type ? acc.type === type : true));
  }, []);

  const updateInvoice = useCallback((tenderId: string, invoiceId: string, updatedInvoice: Invoice) => {
    withActivityLog(tenderId, ActivityType.INVOICE_UPDATED, `Updated invoice #${updatedInvoice.invoiceNumber}.`, (item) => {
        const oldInvoice = item.invoices?.find(i => i.id === invoiceId);

        if (oldInvoice) {
            // Journal entry for sending invoice
            if ((oldInvoice.status !== InvoiceStatus.SENT && oldInvoice.status !== InvoiceStatus.OVERDUE) && (updatedInvoice.status === InvoiceStatus.SENT || updatedInvoice.status === InvoiceStatus.OVERDUE)) {
                const arAccount = findAccountByName(chartOfAccounts, 'Accounts Receivable', AccountType.ASSET);
                const revenueAccount = findAccountByName(chartOfAccounts, 'Sales Revenue', AccountType.REVENUE);
                if (arAccount && revenueAccount) {
                    addJournalEntry({
                        date: updatedInvoice.issueDate,
                        description: `Invoice Sent: #${updatedInvoice.invoiceNumber} for "${item.tender.title}"`,
                        transactions: [
                            { accountId: arAccount.id, debit: updatedInvoice.amount, credit: 0 },
                            { accountId: revenueAccount.id, debit: 0, credit: updatedInvoice.amount },
                        ]
                    });
                }
            }
            // Journal entry for payment
            if (oldInvoice.status !== InvoiceStatus.PAID && updatedInvoice.status === InvoiceStatus.PAID) {
                const cashAccount = findAccountByName(chartOfAccounts, 'Cash', AccountType.ASSET);
                const arAccount = findAccountByName(chartOfAccounts, 'Accounts Receivable', AccountType.ASSET);
                if (cashAccount && arAccount) {
                     addJournalEntry({
                        date: new Date().toISOString().split('T')[0], // Payment date is today
                        description: `Payment received for Invoice #${updatedInvoice.invoiceNumber}`,
                        transactions: [
                            { accountId: cashAccount.id, debit: updatedInvoice.amount, credit: 0 },
                            { accountId: arAccount.id, debit: 0, credit: updatedInvoice.amount },
                        ]
                    });
                }
            }
        }

        return {
            ...item,
            invoices: (item.invoices || []).map(inv => inv.id === invoiceId ? updatedInvoice : inv),
        };
    });
  }, [withActivityLog, addJournalEntry, chartOfAccounts, findAccountByName]);
  
  const removeInvoice = useCallback((tenderId: string, invoiceId: string) => {
    let invNum = '';
    setWatchlist(prev => prev.map(item => {
        if (item.tender.id === tenderId) {
            const invToRemove = item.invoices?.find(i => i.id === invoiceId);
            invNum = invToRemove?.invoiceNumber || 'an invoice';
            const newLog = createActivityLog(ActivityType.INVOICE_REMOVED, `Removed invoice #${invNum}.`, item.tender.id, item.tender.title);
            return {...item, invoices: (item.invoices || []).filter(i => i.id !== invoiceId), activityLog: [newLog, ...(item.activityLog || [])]};
        }
        return item;
    }));
  }, []);
  
  const addPurchaseOrder = useCallback((tenderId: string, po: Omit<PurchaseOrder, 'id'>) => {
    const newPO: PurchaseOrder = { ...po, id: crypto.randomUUID() };
    withActivityLog(tenderId, ActivityType.PO_CREATED, `Created PO #${po.poNumber}`, (item) => ({
      ...item,
      purchaseOrders: [...(item.purchaseOrders || []), newPO],
    }));
    setPoCounter(prev => prev + 1);
  }, [withActivityLog]);

  const updatePurchaseOrder = useCallback((tenderId: string, updatedPO: PurchaseOrder) => {
    setWatchlist(prev => prev.map(item => {
        if (item.tender.id === tenderId) {
            const oldPO = item.purchaseOrders?.find(p => p.id === updatedPO.id);
            if (oldPO && oldPO.status !== POStatus.ISSUED && updatedPO.status === POStatus.ISSUED) {
                const inventoryAccount = findAccountByName(chartOfAccounts, 'Inventory', AccountType.ASSET);
                const apAccount = findAccountByName(chartOfAccounts, 'Accounts Payable', AccountType.LIABILITY);
                const poTotal = updatedPO.items.reduce((sum, poItem) => sum + (poItem.quantity * poItem.unitPrice), 0);

                if (inventoryAccount && apAccount && poTotal > 0) {
                    addJournalEntry({
                        date: updatedPO.issueDate,
                        description: `Purchase Order Issued: #${updatedPO.poNumber}`,
                        transactions: [
                            { accountId: inventoryAccount.id, debit: poTotal, credit: 0 },
                            { accountId: apAccount.id, debit: 0, credit: poTotal },
                        ]
                    });
                }
            }
            return { ...item, purchaseOrders: (item.purchaseOrders || []).map(po => po.id === updatedPO.id ? updatedPO : po) };
        }
        return item;
    }));
  }, [addJournalEntry, chartOfAccounts, findAccountByName]);

  const removePurchaseOrder = useCallback((tenderId: string, poId: string) => {
    setWatchlist(prev => prev.map(item => 
      item.tender.id === tenderId 
        ? { ...item, purchaseOrders: (item.purchaseOrders || []).filter(po => po.id !== poId) } 
        : item
    ));
  }, []);

  const updateCatalogItem = useCallback((id: string, updatedItem: CatalogItem) => {
    setCatalog(prev => prev.map(item => item.id === id ? updatedItem : item));
  }, []);
  
  const updateCatalogItemFromQuoteItem = useCallback((catalogItemId: string, quoteItem: QuoteItem) => {
    setCatalog(prev => prev.map(item => 
        item.id === catalogItemId 
            ? { 
                ...item, 
                // Merge new specs, preferring the new values from the quote item
                technicalSpecs: { ...item.technicalSpecs, ...quoteItem.technicalDetails },
                manufacturer: quoteItem.manufacturer || item.manufacturer,
                model: quoteItem.model || item.model,
              } 
            : item
    ));
  }, []);

  const removeCatalogItem = useCallback((id: string) => {
    setCatalog(prev => prev.filter(item => item.id !== id));
  }, []);

  const addVendor = useCallback((vendor: Omit<Vendor, 'id'>) => setVendors(prev => [...prev, { ...vendor, id: crypto.randomUUID()}]), []);
  const updateVendor = useCallback((id: string, updatedVendor: Vendor) => setVendors(prev => prev.map(v => v.id === id ? updatedVendor : v)), []);
  const removeVendor = useCallback((id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
    setCatalog(prev => prev.map(item => item.vendorId === id ? { ...item, vendorId: null } : item));
    setShipments(prev => prev.map(s => s.vendorId === id ? { ...s, vendorId: '' } : s));
  }, []);

  const addVendorDocument = useCallback((vendorId: string, file: { name: string; data: string; type: string }, category: VendorDocumentCategory, uploaderId: string) => {
    setVendors(prev => prev.map(v => {
        if (v.id === vendorId) {
            const newDoc: VendorDocument = {
                id: crypto.randomUUID(),
                name: file.name,
                fileData: file.data,
                mimeType: file.type,
                category,
                uploadedBy: uploaderId,
                uploadedAt: new Date().toISOString(),
            };
            return { ...v, documents: [...(v.documents || []), newDoc] };
        }
        return v;
    }));
  }, []);

  const removeVendorDocument = useCallback((vendorId: string, documentId: string) => {
    setVendors(prev => prev.map(v => {
        if (v.id === vendorId) {
            return { ...v, documents: (v.documents || []).filter(d => d.id !== documentId) };
        }
        return v;
    }));
  }, []);
    
    // Client Documents
    const addClientDocument = useCallback((clientId: string, file: { name: string; data: string; type: string }, category: ClientDocumentCategory, uploaderId: string) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const newDoc: ClientDocument = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    fileData: file.data,
                    mimeType: file.type,
                    category,
                    uploadedBy: uploaderId,
                    uploadedAt: new Date().toISOString(),
                };
                return { ...c, documents: [...(c.documents || []), newDoc] };
            }
            return c;
        }));
    }, []);

    const removeClientDocument = useCallback((clientId: string, documentId: string) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                return { ...c, documents: (c.documents || []).filter(d => d.id !== documentId) };
            }
            return c;
        }));
    }, []);

    // Clients
    const addClient = useCallback((client: Omit<Client, 'id'>): Client => {
        const newClient: Client = { ...client, id: crypto.randomUUID(), contacts: [], interactions: [], documents: [] };
        setClients(prev => [...prev, newClient]);
        return newClient;
    }, []);

    const updateClient = useCallback((id: string, updatedClient: Client) => {
        setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
    }, []);

    const removeClient = useCallback((id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
        setWatchlist(prev => prev.map(item =>
            item.financialDetails?.clientId === id
                ? { ...item, financialDetails: { ...item.financialDetails, clientId: null } }
                : item
        ));
    }, []);

    // Client Contacts
    const addContactToClient = useCallback((clientId: string, contact: Omit<Contact, 'id'>) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const newContact: Contact = { ...contact, id: crypto.randomUUID() };
                return { ...c, contacts: [...(c.contacts || []), newContact] };
            }
            return c;
        }));
    }, []);

    const updateContactInClient = useCallback((clientId: string, updatedContact: Contact) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                return { ...c, contacts: (c.contacts || []).map(contact => contact.id === updatedContact.id ? updatedContact : contact) };
            }
            return c;
        }));
    }, []);

    const removeContactFromClient = useCallback((clientId: string, contactId: string) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                return { ...c, contacts: (c.contacts || []).filter(contact => contact.id !== contactId) };
            }
            return c;
        }));
    }, []);

    // Client Interactions
    const addInteractionToClient = useCallback((clientId: string, interactionData: Omit<Interaction, 'id'>) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const newInteraction: Interaction = { ...interactionData, id: crypto.randomUUID() };
                return { ...c, interactions: [newInteraction, ...(c.interactions || [])] };
            }
            return c;
        }));
    }, []);

    // Shipments
    const addShipment = useCallback((shipment: Omit<Shipment, 'id'>) => {
        const newShipment: Shipment = { ...shipment, id: crypto.randomUUID() };
        setShipments(prev => [...prev, newShipment]);
    }, []);

    const updateShipment = useCallback((id: string, updatedShipment: Shipment) => {
        setShipments(prev => prev.map(s => s.id === id ? updatedShipment : s));
    }, []);

    const removeShipment = useCallback((id: string) => {
        setShipments(prev => prev.filter(s => s.id !== id));
    }, []);

    // Tasks
    const addTask = useCallback((taskData: Omit<Task, 'id'>) => {
        const newTask: Task = { ...taskData, id: crypto.randomUUID() };
        setTasks(prev => [...prev, newTask]);
        const assignedMember = teamMembers.find(m => m.id === newTask.assignedToId);
        const tender = watchlist.find(w => w.tender.id === newTask.tenderId);
        if (assignedMember) {
            addNotification({
                type: NotificationType.TASK_ASSIGNED,
                message: `You were assigned a new task: "${newTask.title}" for tender "${tender?.tender.title}"`,
                tenderId: newTask.tenderId
            });
        }
    }, [teamMembers, addNotification, watchlist]);

    const updateTask = useCallback((id: string, updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    }, []);

    const removeTask = useCallback((id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    }, []);

    // Task Templates
    const addTaskTemplate = useCallback((template: Omit<TaskTemplate, 'id'>) => {
        const newTemplate: TaskTemplate = { ...template, id: crypto.randomUUID() };
        setTaskTemplates(prev => [...prev, newTemplate]);
    }, []);

    const updateTaskTemplate = useCallback((id: string, updatedTemplate: TaskTemplate) => {
        setTaskTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
    }, []);

    const removeTaskTemplate = useCallback((id: string) => {
        setTaskTemplates(prev => prev.filter(t => t.id !== id));
    }, []);

    const applyTaskTemplate = useCallback((tenderId: string, templateId: string, assignedToId: string | null, assignerId: string) => {
        const template = taskTemplates.find(t => t.id === templateId);
        if (!template) return;
        const tender = watchlist.find(w => w.tender.id === tenderId);
        if (!tender) return;

        const tenderStartDate = new Date(tender.tender.publishedDate);
        
        const newTasks: Task[] = template.tasks.map(taskItem => {
            const dueDate = new Date(tenderStartDate);
            dueDate.setDate(dueDate.getDate() + taskItem.dueDays);
            return {
                id: crypto.randomUUID(),
                title: taskItem.title,
                description: taskItem.description,
                tenderId: tenderId,
                assignedToId: assignedToId,
                assignedById: assignerId,
                dueDate: dueDate.toISOString().split('T')[0],
                status: TaskStatus.TODO
            };
        });

        setTasks(prev => [...prev, ...newTasks]);
        withActivityLog(tenderId, ActivityType.TEMPLATE_APPLIED, `Applied template "${template.name}".`, item => item);
    }, [taskTemplates, watchlist, withActivityLog]);

    // Team Members
    const addTeamMember = useCallback((member: Omit<TeamMember, 'id'>) => {
        const newMember: TeamMember = { ...member, id: crypto.randomUUID() };
        setTeamMembers(prev => [...prev, newMember]);
    }, []);

    const updateTeamMember = useCallback((id: string, updatedMember: TeamMember) => {
        setTeamMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
    }, []);

    const removeTeamMember = useCallback((id: string) => {
        setTeamMembers(prev => prev.filter(m => m.id !== id));
        setWatchlist(prev => prev.map(item => item.assignedTeamMemberId === id ? { ...item, assignedTeamMemberId: null } : item));
        setTasks(prev => prev.map(task => task.assignedToId === id ? { ...task, assignedToId: null } : task));
        setVendors(prev => prev.map(vendor => vendor.assignedTeamMemberId === id ? { ...vendor, assignedTeamMemberId: null } : vendor));
    }, []);

    // Expenses
    const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
        const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
        const expenseAccount = findAccountByName(chartOfAccounts, expense.category, AccountType.EXPENSE);
        const cashAccount = findAccountByName(chartOfAccounts, 'Cash', AccountType.ASSET);
        if (expenseAccount && cashAccount) {
            addJournalEntry({
                date: expense.date,
                description: `Expense: ${expense.description}`,
                transactions: [
                    { accountId: expenseAccount.id, debit: expense.amount, credit: 0 },
                    { accountId: cashAccount.id, debit: 0, credit: expense.amount },
                ]
            });
        }
        setExpenses(prev => [...prev, newExpense]);
    }, [addJournalEntry, chartOfAccounts, findAccountByName]);

    const updateExpense = useCallback((id: string, updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
    }, []);

    const removeExpense = useCallback((id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }, []);

    // Accounts
    const addAccount = useCallback((account: Omit<Account, 'id'>) => {
        const newAccount: Account = { ...account, id: crypto.randomUUID() };
        setChartOfAccounts(prev => [...prev, newAccount]);
    }, []);

    const removeAccount = useCallback((id: string) => {
        setChartOfAccounts(prev => prev.filter(a => a.id !== id));
    }, []);
    
    // Journal Entries
    const updateJournalEntry = useCallback((id: string, updatedEntry: JournalEntry) => {
        setJournalEntries(prev => prev.map(j => j.id === id ? updatedEntry : j));
    }, []);

    const removeJournalEntry = useCallback((id: string) => {
        setJournalEntries(prev => prev.filter(j => j.id !== id));
    }, []);
    
    // AI Functions
    const generateRiskAssessment = useCallback(async (tenderId: string) => {
        const item = watchlist.find(i => i.tender.id === tenderId);
        if (!item) throw new Error("Tender not found.");
        const quoteTotal = item.quoteItems?.reduce((acc, q) => acc + q.quantity * q.unitPrice, 0) || 0;
        const assessment = await assessTenderRisk(item.tender, quoteTotal, aiConfig);
        const newAssessment: RiskAssessment = { ...assessment, generatedAt: new Date().toISOString() };
        withActivityLog(tenderId, ActivityType.RISK_ASSESSMENT_GENERATED, 'Generated risk assessment.', (i) => ({ ...i, riskAssessment: newAssessment }));
    }, [watchlist, aiConfig, withActivityLog]);

    const generateDocumentAnalysis = useCallback(async (tenderId: string, docId: string): Promise<DocumentAnalysis> => {
        const item = watchlist.find(i => i.tender.id === tenderId);
        const doc = item?.documents?.find(d => d.id === docId);
        if (!item || !doc) throw new Error("Document not found.");

        const analysis = await analyzeDocument(doc, aiConfig);
        const newAnalysis: DocumentAnalysis = { ...analysis, generatedAt: new Date().toISOString() };
        
        withActivityLog(tenderId, ActivityType.DOCUMENT_ANALYZED, `Analyzed document "${doc.name}".`, (i) => ({
            ...i,
            documents: i.documents?.map(d => d.id === docId ? { ...d, analysis: newAnalysis } : d)
        }));
        return newAnalysis;
    }, [watchlist, aiConfig, withActivityLog]);

    const generateAISummary = useCallback(async (tenderId: string) => {
        const item = watchlist.find(i => i.tender.id === tenderId);
        if (!item) throw new Error("Tender not found.");
        const summary = await generateWorkspaceSummary(item.tender, aiConfig);
        setWatchlist(prev => prev.map(i => i.tender.id === tenderId ? { ...i, aiSummary: summary } : i));
    }, [watchlist, aiConfig]);

    // Collaboration
    const addComment = useCallback((tenderId: string, authorId: string, text: string, mentions: string[]) => {
        const newComment: Comment = { id: crypto.randomUUID(), tenderId, authorId, text, createdAt: new Date().toISOString(), mentions, };
        withActivityLog(tenderId, ActivityType.COMMENT_ADDED, `Added a comment.`, (item) => ({ ...item, comments: [...(item.comments || []), newComment] }));
        mentions.forEach(memberId => {
            const author = teamMembers.find(m => m.id === authorId);
            const tender = watchlist.find(w => w.tender.id === tenderId);
            addNotification({ type: NotificationType.USER_MENTIONED, message: `${author?.name || 'Someone'} mentioned you in a comment on "${tender?.tender.title}"`, tenderId: tenderId });
        });
    }, [withActivityLog, addNotification, teamMembers, watchlist]);

    // Data Management
    const exportData = useCallback((): BackupData => {
        return { sources, watchlist, companyProfile, catalog, vendors, teamMembers, clients, shipments, tasks, taskTemplates, currentUserId, aiConfig, expenses, notifications, expenseCategories, chartOfAccounts, journalEntries, poCounter, storageMode, cloudSyncConfig, documentSettings, mailSettings };
    }, [sources, watchlist, companyProfile, catalog, vendors, teamMembers, clients, shipments, tasks, taskTemplates, currentUserId, aiConfig, expenses, notifications, expenseCategories, chartOfAccounts, journalEntries, poCounter, storageMode, cloudSyncConfig, documentSettings, mailSettings]);

    const importData = useCallback((data: BackupData) => {
        setSources(data.sources || []);
        setWatchlist(data.watchlist || []);
        setCompanyProfile(data.companyProfile || { name: '', address: '', phone: '', email: '', regNo: '', tin: '', ungm: '' });
        setCatalog(data.catalog || []);
        setVendors(data.vendors || []);
        setTeamMembers(data.teamMembers || []);
        setClients(data.clients || []);
        setShipments(data.shipments || []);
        setTasks(data.tasks || []);
        setTaskTemplates(data.taskTemplates || []);
        setCurrentUserId(data.currentUserId || null);
        setAiConfig(data.aiConfig || { provider: AIProvider.GEMINI, apiKey: '', model: 'gemini-2.5-flash' });
        setExpenses(data.expenses || []);
        setNotifications(data.notifications || []);
        setExpenseCategories(data.expenseCategories || []);
        setChartOfAccounts(data.chartOfAccounts || []);
        setJournalEntries(data.journalEntries || []);
        setPoCounter(data.poCounter || 0);
        setStorageMode(data.storageMode || StorageMode.LOCAL_ONLY);
        setCloudSyncConfig(data.cloudSyncConfig || { provider: CloudProvider.SUPABASE });
        setDocumentSettings(data.documentSettings || {
            accentColor: '#007bff',
            fontFamily: 'Inter',
            fontSize: 10,
            showLogo: true,
            logoSize: 'medium',
            pageMargin: 'medium',
            documentTitleQuote: 'QUOTATION',
            documentTitleProforma: 'PROFORMA INVOICE',
            documentTitleInvoice: 'COMMERCIAL INVOICE',
            documentTitleDeliveryNote: 'DELIVERY NOTE',
            documentTitlePO: 'PURCHASE ORDER',
            notesLabel: 'Notes',
            termsLabel: 'Terms & Conditions',
            templateStyle: DocumentTemplateStyle.MODERN,
            logoPosition: 'left',
            tableTheme: 'striped',
            secondaryColor: '#f3f4f6',
            textColor: '#111827',
            footerText: 'Thank you for your business!',
            showPageNumbers: true,
        });
        setMailSettings(data.mailSettings || { url: '' });
        addToast("Data imported successfully!", 'success');
    }, [addToast]);
    
    const syncToCloud = useCallback(async () => {
        setCloudSyncState({ status: 'syncing' });
        addToast('Syncing data to cloud...', 'info');
        await new Promise(res => setTimeout(res, 2000));
        const hasError = Math.random() > 0.8;
        if (hasError) {
          setCloudSyncState({ status: 'error', error: 'Failed to connect to cloud provider.' });
          addToast('Cloud sync failed.', 'error');
        } else {
          setCloudSyncState({ status: 'success', lastSync: new Date().toISOString() });
          addToast('Data synced successfully.', 'success');
        }
    }, [addToast]);
    
    const pullFromCloud = useCallback(async () => {
        setCloudSyncState({ status: 'pulling' });
        addToast('Pulling data from cloud...', 'info');
        await new Promise(res => setTimeout(res, 2000));
        setCloudSyncState({ status: 'success', lastSync: new Date().toISOString() });
        addToast('Data pulled successfully.', 'success');
    }, [addToast]);

    return {
        sources, addSource, removeSource, updateSource, addMultipleSources,
        watchlist, addToWatchlist, addManualTender, updateWatchlistStatus, removeFromWatchlist, updateTenderClosingDate, updateTenderCategory,
        companyProfile, updateCompanyProfile,
        catalog, addCatalogItem, updateCatalogItem, removeCatalogItem, updateCatalogItemFromQuoteItem,
        vendors, addVendor, updateVendor, removeVendor, addVendorDocument, removeVendorDocument,
        teamMembers, addTeamMember, updateTeamMember, removeTeamMember,
        clients, addClient, updateClient, removeClient, addContactToClient, updateContactInClient, removeContactFromClient, addInteractionToClient, addClientDocument, removeClientDocument,
        shipments, addShipment, updateShipment, removeShipment,
        tasks, addTask, updateTask, removeTask, updateTaskStatus,
        taskTemplates, addTaskTemplate, updateTaskTemplate, removeTaskTemplate, applyTaskTemplate,
        currentUserId, setCurrentUserId,
        aiConfig, updateAIConfig,
        expenses, addExpense, updateExpense, removeExpense,
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        expenseCategories, setExpenseCategories,
        chartOfAccounts, addAccount, removeAccount,
        journalEntries, addJournalEntry, updateJournalEntry, removeJournalEntry,
        poCounter,
        storageMode, setStorageMode,
        cloudSyncConfig, updateCloudSyncConfig,
        cloudSyncState, syncToCloud, pullFromCloud,
        documentSettings, updateDocumentSettings,
        mailSettings, updateMailSettings,
        tenders,
        loading,
        error,
        lastFetched,
        refreshTenders,
        toasts, addToast, removeToast,
        updateNotes, assignTenderToMember, assignTenderToClient, updateFinancialDetails,
        addQuoteItem, addMultipleQuoteItems, updateQuoteItem, removeQuoteItem,
        updateTechnicalOfferType, updateTechnicalOfferSOP,
        addDocument, removeDocument,
        createInvoiceFromQuote, addInvoice, updateInvoice, removeInvoice,
        addPurchaseOrder, updatePurchaseOrder, removePurchaseOrder,
        generateRiskAssessment, generateDocumentAnalysis, generateAISummary,
        addComment,
        exportData, importData,
    };
};
