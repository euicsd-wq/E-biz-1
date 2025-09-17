import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { 
    TenderStatus, 
    TechnicalOfferType,
    ActivityType,
    AIProvider,
    DocumentCategory,
    TaskStatus,
    DocumentStatus,
    NotificationType,
    ClientDocumentCategory,
    InvoiceStatus,
    POStatus,
    VendorDocumentCategory,
    TeamMemberRole,
    type Source, 
    type Tender, 
    type WatchlistItem,
    type QuoteItem,
    type Invoice,
    type FinancialDetails,
    type ManagedDocument,
    type CompanyProfile,
    type ActivityLog,
    type CatalogItem,
    type Vendor,
    type TeamMember,
    type Client,
    type Shipment,
    type Task,
    type AIConfig,
    type PurchaseOrder,
    type Expense,
    type Notification,
    type TaskTemplate,
    type DocumentSettings,
    type Comment,
    type Contact,
    type Interaction,
    type VendorDocument,
    type ClientDocument,
    type Toast,
    type AIInsights,
    type MailSettings,
    type TaskTemplateItem,
    type Account,
    type JournalEntry,
    type View,
} from '../types';
import { fetchAndParseRss } from '../services/rssService';
import { categorizeTender, extractTenderInsights, assessTenderRisk, analyzeDocument, generateWorkspaceSummary } from '../services/aiService';
import { ROLE_PERMISSIONS } from '../constants';

// FIX: Add watchlistId to ActivityLog creation to satisfy the type.
const createActivityLog = (type: ActivityType, description: string, tenderId: string, tenderTitle: string, watchlistId: string): ActivityLog => ({
    id: crypto.randomUUID(),
    watchlistId,
    timestamp: new Date().toISOString(),
    type,
    description,
    tenderId,
    tenderTitle,
});

const toDbWatchlistItem = (item: Partial<WatchlistItem>) => ({
    tender: item.tender,
    status: item.status,
    added_at: item.addedAt,
    assigned_team_member_id: item.assignedTeamMemberId,
    category: item.category,
    quote_items: item.quoteItems,
    invoices: item.invoices,
    notes: item.notes,
    financial_details: item.financialDetails,
    technical_offer_type: item.technicalOfferType,
    documents: item.documents,
    activity_log: item.activityLog,
    purchase_orders: item.purchaseOrders,
    risk_assessment: item.riskAssessment,
    ai_summary: item.aiSummary,
    comments: item.comments,
    ai_insights: item.aiInsights,
});

const fromDbWatchlistItem = (dbItem: any): WatchlistItem => ({
    id: dbItem.id,
    tender: dbItem.tender,
    status: dbItem.status,
    addedAt: dbItem.added_at,
    assignedTeamMemberId: dbItem.assigned_team_member_id,
    category: dbItem.category,
    quoteItems: dbItem.quote_items || [],
    invoices: dbItem.invoices || [],
    notes: dbItem.notes || '',
    financialDetails: dbItem.financial_details || {},
    technicalOfferType: dbItem.technical_offer_type,
    documents: dbItem.documents || [],
    activityLog: dbItem.activity_log || [],
    purchaseOrders: dbItem.purchase_orders || [],
    riskAssessment: dbItem.risk_assessment || null,
    aiSummary: dbItem.ai_summary || '',
    comments: dbItem.comments || [],
    aiInsights: dbItem.ai_insights || {},
});


export const useTenderStore = (user: User | null) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', phone: '', email: '', regNo: '', tin: '', ungm: '' });
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: AIProvider.GEMINI, apiKey: '', model: 'gemini-2.5-flash' });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([]);
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({} as DocumentSettings);
  const [mailSettings, setMailSettings] = useState<MailSettings>({ url: '' });
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const clearState = () => {
    setSources([]); setWatchlist([]); setCatalog([]); setVendors([]); setTeamMembers([]);
    setClients([]); setShipments([]); setTasks([]); setTaskTemplates([]); setExpenses([]);
    setNotifications([]); setJournalEntries([]); setChartOfAccounts([]);
  };

  useEffect(() => {
    if (!user) {
        clearState();
        return;
    }

    const fetchAllData = async () => {
        setLoading(true);
        const [
            {data: sourcesData, error: e1}, {data: watchlistData, error: e2}, {data: catalogData, error: e3}, 
            {data: vendorsData, error: e4}, {data: teamMembersData, error: e5}, {data: clientsData, error: e6}, 
            {data: shipmentsData, error: e7}, {data: tasksData, error: e8}, {data: taskTemplatesData, error: e9}, 
            {data: expensesData, error: e10}, {data: notificationsData, error: e11}, {data: journalEntriesData, error: e12},
            {data: accountsData, error: e13}, {data: profileData, error: e14}
        ] = await Promise.all([
            supabase.from('sources').select('*'),
            supabase.from('watchlist').select('*'),
            supabase.from('catalog').select('*'),
            supabase.from('vendors').select('*'),
            supabase.from('team_members').select('*'),
            supabase.from('clients').select('*'),
            supabase.from('shipments').select('*'),
            supabase.from('tasks').select('*'),
            supabase.from('task_templates').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('notifications').select('*'),
            supabase.from('journal_entries').select('*'),
            supabase.from('chart_of_accounts').select('*'),
            supabase.from('profiles').select('*').single(),
        ]);
        
        const errors = [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12,e13,e14].filter(Boolean);
        if (errors.length > 0) {
            addToast(`Error fetching data: ${errors[0]?.message}`, 'error');
            console.error(errors);
        }
        
        setSources(sourcesData || []);
        setWatchlist(watchlistData ? watchlistData.map(fromDbWatchlistItem) : []);
        setCatalog(catalogData || []);
        setVendors(vendorsData || []);
        setTeamMembers(teamMembersData || []);
        setClients(clientsData || []);
        setShipments(shipmentsData || []);
        setTasks(tasksData || []);
        setTaskTemplates(taskTemplatesData || []);
        setExpenses(expensesData || []);
        setNotifications(notificationsData || []);
        setJournalEntries(journalEntriesData || []);
        setChartOfAccounts(accountsData || []);
        
        if (profileData) {
            setCompanyProfile(profileData.company_profile || {});
            setAiConfig(profileData.ai_config || { provider: AIProvider.GEMINI, apiKey: '', model: 'gemini-2.5-flash' });
            setDocumentSettings(profileData.document_settings || {});
            setMailSettings(profileData.mail_settings || { url: '' });
        }
        setLoading(false);
    };
    
    fetchAllData();
    
    const channel = supabase.channel(`public:tables`);
    
    const createSubscription = <T extends {id: string}>(table: string, setter: React.Dispatch<React.SetStateAction<T[]>>, mapper: (dbItem: any) => T = (dbItem) => dbItem) => {
        return channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
            // Team members should update for everyone
            if (table === 'team_members') {
                 if (payload.eventType === 'INSERT') { setter(current => [...current, mapper(payload.new)]); }
                 if (payload.eventType === 'UPDATE') { setter(current => current.map(item => item.id === (payload.new as {id: string}).id ? mapper(payload.new) : item)); }
                 if (payload.eventType === 'DELETE') { setter(current => current.filter(item => item.id !== (payload.old as {id: string}).id)); }
                 return;
            }

            const newPayload = payload.new as any;
            if (newPayload && newPayload.user_id && newPayload.user_id !== user.id) return;

            if (payload.eventType === 'INSERT') {
                const newItem = mapper(payload.new);
                setter(current => [...current, newItem]);
            }
            if (payload.eventType === 'UPDATE') {
                const updatedItem = mapper(payload.new);
                setter(current => current.map(item => item.id === updatedItem.id ? updatedItem : item));
            }
            if (payload.eventType === 'DELETE') {
                setter(current => current.filter(item => item.id !== (payload.old as {id: string}).id));
            }
        });
    };

    createSubscription('sources', setSources);
    createSubscription('watchlist', setWatchlist, fromDbWatchlistItem);
    createSubscription('catalog', setCatalog);
    createSubscription('vendors', setVendors);
    createSubscription('team_members', setTeamMembers);
    createSubscription('clients', setClients);
    createSubscription('shipments', setShipments);
    createSubscription('tasks', setTasks);
    createSubscription('task_templates', setTaskTemplates);
    createSubscription('expenses', setExpenses);
    createSubscription('notifications', setNotifications);
    createSubscription('journal_entries', setJournalEntries);
    createSubscription('chart_of_accounts', setChartOfAccounts);

    channel.subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };

  }, [user, addToast]);
  
  const updateProfileData = useCallback(async (data: any) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) {
        addToast('Failed to save settings: ' + error.message, 'error');
    } else {
        if (data.company_profile) setCompanyProfile(prev => ({ ...prev, ...data.company_profile }));
        if (data.ai_config) setAiConfig(prev => ({ ...prev, ...data.ai_config }));
        if (data.document_settings) setDocumentSettings(prev => ({ ...prev, ...data.document_settings }));
        if (data.mail_settings) setMailSettings(prev => ({ ...prev, ...data.mail_settings }));
    }
  }, [user, addToast]);
  
  const createUpdater = <T extends { id: string }>(table: string, setter: React.Dispatch<React.SetStateAction<any[]>>, mapper?: (item: any) => any) => {
    return useCallback(async (id: string, updates: Partial<T>) => {
        if (!user) return { data: null, error: { message: 'User not logged in' } };
        const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
        if (error) {
            addToast(`Failed to update ${table}: ${error.message}`, 'error');
        } else if(data) {
            const mappedData = mapper ? mapper(data) : data;
            setter(current => current.map((item: T) => item.id === id ? mappedData : item));
        }
        return { data, error };
    }, [user, addToast, setter, mapper]);
  };
  
  const createDeleter = <T extends { id: string }>(
    table: string,
    state: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    return useCallback(async (id: string) => {
      if (!user) return;

      const originalState = [...state];
      
      const newState = state.filter(item => item.id !== id);
      setter(newState);

      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) {
        addToast(`Failed to delete from ${table}: ${error.message}`, 'error');
        setter(originalState);
      }
    }, [user, addToast, table, state, setter]);
  };
  
   const updateWatchlistItem = createUpdater<WatchlistItem>('watchlist', setWatchlist, fromDbWatchlistItem);

   const withActivityLog = useCallback(async (tenderId: string, type: ActivityType, description: string, updateFn: (item: WatchlistItem) => Partial<WatchlistItem>) => {
        const item = watchlist.find(i => i.tender.id === tenderId);
        if (!item) return;

        // FIX: Pass the watchlist item ID to createActivityLog.
        const newLog = createActivityLog(type, description, item.tender.id, item.tender.title, item.id);
        const updates = updateFn(item);
        const updatedLogs = [newLog, ...(item.activityLog || [])];
        
        const dbRecord = toDbWatchlistItem({ ...updates, activityLog: updatedLogs });
        
        updateWatchlistItem(item.id, dbRecord as any);

  }, [watchlist, updateWatchlistItem]);
  
   const refreshTenders = useCallback(async (force = false) => {
      if (!force && lastFetched && (Date.now() - lastFetched < 1000 * 60 * 60)) {
        addToast('Feeds were refreshed recently. Please wait at least an hour before refreshing again.', 'info');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const urlsToFetch = [...new Set(sources.map(s => s.url))];
        const allTenders = (await Promise.all(urlsToFetch.map(async (url) => {
            try {
                const tendersFromSource = await fetchAndParseRss(url);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return tendersFromSource;
            } catch (e: any) {
                console.error(`Skipping source ${url} due to error:`, e);
                addToast(e.message || `Failed to fetch from ${url}.`, 'error');
                return [];
            }
        }))).flat();

        const uniqueTenders = Array.from(new Map(allTenders.map(t => [t.id, t])).values());
        setTenders(uniqueTenders);
        setLastFetched(Date.now());
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
        addToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    }, [sources, addToast, lastFetched]);
    
    useEffect(() => {
        if (sources.length > 0) refreshTenders();
    }, [sources.length, refreshTenders]);
    
    const addToWatchlist = useCallback(async (tender: Tender, assignedTeamMemberId?: string | null) => {
        if (!user || watchlist.some(item => item.tender.id === tender.id)) return;

        const activityLogs: ActivityLog[] = [];
        // Note: A watchlist ID isn't available until after insertion, so we can't create a perfect log here.
        // The server-side or a subsequent update could populate this if needed. For now, we'll create it without.
        activityLogs.push(createActivityLog(ActivityType.TENDER_ADDED, `Tender "${tender.title}" added.`, tender.id, tender.title, 'temp-id'));

        if (assignedTeamMemberId) {
            const member = teamMembers.find(m => m.id === assignedTeamMemberId);
            if (member) {
                activityLogs.push(createActivityLog(ActivityType.TENDER_ASSIGNED, `Assigned to ${member.name}.`, tender.id, tender.title, 'temp-id'));
            }
        }

        const newWatchlistItem: Omit<WatchlistItem, 'id'> = {
            tender,
            status: TenderStatus.WATCHING,
            addedAt: new Date().toISOString(),
            category: 'Uncategorized',
            aiInsights: {},
            quoteItems: [], invoices: [], notes: '', financialDetails: {},
            technicalOfferType: TechnicalOfferType.GOODS, documents: [], activityLog: activityLogs,
            assignedTeamMemberId: assignedTeamMemberId || null, purchaseOrders: [], comments: [],
        };

        const dbRecord = { user_id: user.id, tender_id: tender.id, ...toDbWatchlistItem(newWatchlistItem) };
        const { data: newDbItem, error } = await supabase.from('watchlist').insert(dbRecord).select().single();

        if (error) {
            addToast('Failed to add to watchlist. ' + error.message, 'error');
            return;
        }
        
        if (newDbItem) {
            // Now that we have the real ID, update the activity logs
            const finalItem = fromDbWatchlistItem(newDbItem);
            if (finalItem.activityLog) {
                finalItem.activityLog.forEach(log => log.watchlistId = finalItem.id);
                updateWatchlistItem(finalItem.id, { activityLog: finalItem.activityLog } as any);
            }

            setWatchlist(currentWatchlist => [...currentWatchlist, finalItem]);
            addToast('Tender added to watchlist.', 'success');
        } else {
            addToast('Failed to add to watchlist, please refresh.', 'error');
        }

    }, [user, watchlist, addToast, teamMembers, updateWatchlistItem]);

    const removeFromWatchlist = createDeleter('watchlist', watchlist, setWatchlist);

    const addManualTender = useCallback((tenderData: Omit<Tender, 'id' | 'publishedDate' | 'isClosingDateEstimated' | 'source'>) => {
        addToWatchlist({ ...tenderData, id: crypto.randomUUID(), publishedDate: new Date().toISOString(), isClosingDateEstimated: false, source: 'Manual Entry' });
    }, [addToWatchlist]);
    
    const updateWatchlistStatus = useCallback((tenderId: string, status: TenderStatus) => {
        withActivityLog(tenderId, ActivityType.STATUS_CHANGE, `Status changed to ${status}.`, () => ({ status }));
    }, [withActivityLog]);

    const updateTenderClosingDate = useCallback(async(tenderId: string, newDate: string) => {
         const item = watchlist.find(i => i.tender.id === tenderId);
         if (!item) return;
         const updatedTender = { ...item.tender, closingDate: new Date(newDate).toISOString() };
         updateWatchlistItem(item.id, { tender: updatedTender } as any);
    }, [watchlist, updateWatchlistItem]);

    const updateTenderCategory = useCallback((tenderId: string, category: string) => {
        withActivityLog(tenderId, ActivityType.STATUS_CHANGE, `Category changed to ${category}.`, () => ({ category }));
    }, [withActivityLog]);
    
    const createGenericAdder = <T extends {}>(table: string, setter: React.Dispatch<React.SetStateAction<any[]>>, mapper: (item: any) => any = item => item) => 
        useCallback(async (newItem: T) => {
            if (!user) return { data: null, error: 'User not logged in' };
            const { data, error } = await supabase.from(table).insert({ ...newItem, user_id: user.id }).select().single();
            if (error) {
                addToast(`Failed to add to ${table}: ${error.message}`, 'error');
            } else if (data) {
                setter(current => [...current, mapper(data)]);
            }
            return { data: data ? mapper(data) : null, error };
        }, [user, addToast, setter, mapper]);
        
    const addSource = createGenericAdder<Partial<Source>>('sources', setSources);
    const removeSource = createDeleter('sources', sources, setSources);
    const updateSource = createUpdater<Source>('sources', setSources);

    const addMultipleSources = useCallback(async (urls: string[]) => {
        if (!user) return;
        const newSources = urls.filter(url => !sources.some(s => s.url === url)).map(url => ({ url, user_id: user.id }));
        if (newSources.length === 0) return;
        const { data, error } = await supabase.from('sources').insert(newSources).select();
        if (error) { addToast('Failed to add some sources.', 'error'); } 
        else if (data) { setSources(current => [...current, ...data]); }
    }, [user, sources, addToast]);

    const addCatalogItem = createGenericAdder<Partial<CatalogItem>>('catalog', setCatalog);
    const updateCatalogItem = createUpdater('catalog', setCatalog);
    const removeCatalogItem = createDeleter('catalog', catalog, setCatalog);

    const updateCatalogItemFromQuoteItem = useCallback(async (catalogId: string, quoteItem: QuoteItem) => {
        const updates = { item_name: quoteItem.itemName, description: quoteItem.description, manufacturer: quoteItem.manufacturer, model: quoteItem.model, technical_specs: quoteItem.technicalDetails };
        updateCatalogItem(catalogId, updates as any);
    }, [updateCatalogItem]);

    const addVendor = createGenericAdder<Partial<Vendor>>('vendors', setVendors);
    const updateVendor = createUpdater('vendors', setVendors);
    const removeVendor = createDeleter('vendors', vendors, setVendors);
    
    const addClient = createGenericAdder<Partial<Client>>('clients', setClients);
    const updateClient = createUpdater('clients', setClients);
    const removeClient = createDeleter('clients', clients, setClients);
    
    const addShipment = createGenericAdder<Partial<Shipment>>('shipments', setShipments);
    const updateShipment = createUpdater('shipments', setShipments);
    const removeShipment = createDeleter('shipments', shipments, setShipments);
    
    const addTask = createGenericAdder<Partial<Task>>('tasks', setTasks);
    const updateTask = createUpdater('tasks', setTasks);
    const removeTask = createDeleter('tasks', tasks, setTasks);
    const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
        updateTask(id, { status } as any);
    }, [updateTask]);
    
    const addTeamMember = useCallback(async (newMember: Omit<TeamMember, 'id' | 'permissions'> & { password?: string, permissions?: View[] }) => {
        if (!user) {
            addToast('You must be logged in to invite users.', 'error');
            return;
        }
        if (!newMember.password) {
            addToast('An initial password is required to invite a new user.', 'error');
            return;
        }

        const permissions = ROLE_PERMISSIONS[newMember.role];

        const { data, error } = await supabase.auth.signUp({
            email: newMember.email,
            password: newMember.password,
            options: {
                data: {
                    full_name: newMember.name,
                    role: newMember.role,
                    permissions: permissions,
                },
            },
        });

        if (error) {
            addToast(`Failed to create user: ${error.message}`, 'error');
            console.error("Sign up error:", error);
            return;
        }

        if (data.user) {
            addToast(`Invitation sent to ${newMember.email}. They must confirm their email to log in.`, 'success');
        }
    }, [user, addToast]);

    const updateTeamMember = createUpdater('team_members', setTeamMembers);
    const removeTeamMember = createDeleter('team_members', teamMembers, setTeamMembers);
    
    const updateCurrentUserName = useCallback(async (userId: string, newName: string) => {
        if (!user || user.id !== userId) return;

        const { error: authError } = await supabase.auth.updateUser({ data: { full_name: newName } });
        if (authError) {
            addToast(`Failed to update user name: ${authError.message}`, 'error');
            return;
        }

        await updateTeamMember(userId, { name: newName } as Partial<TeamMember>);
        addToast('Your name has been updated.', 'success');
    }, [user, addToast, updateTeamMember]);

    const addNotification = createGenericAdder<Partial<Notification>>('notifications', setNotifications);
    const updateNotification = createUpdater<Notification>('notifications', setNotifications);
    const markNotificationAsRead = useCallback((id: string) => updateNotification(id, { isRead: true }), [updateNotification]);
    const markAllNotificationsAsRead = useCallback(async () => {
        if (!user) return;
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length > 0) {
            setNotifications(n => n.map(item => ({...item, isRead: true})));
            const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
            if (error) addToast('Failed to mark all as read.', 'error');
        }
    }, [user, notifications, addToast]);

    const addExpense = createGenericAdder<Partial<Expense>>('expenses', setExpenses);
    const updateExpense = createUpdater('expenses', setExpenses);
    const removeExpense = createDeleter('expenses', expenses, setExpenses);
    
    const updateNotes = useCallback((tenderId: string, notes: string) => {
        withActivityLog(tenderId, ActivityType.NOTE_UPDATED, 'Notes were updated.', () => ({ notes }));
    }, [withActivityLog]);

    const assignTenderToMember = useCallback((tenderId: string, memberId: string | null, assignerName: string) => {
        const member = teamMembers.find(m => m.id === memberId);
        const description = member ? `Assigned to ${member.name} by ${assignerName}.` : 'Unassigned.';
        withActivityLog(tenderId, ActivityType.TENDER_ASSIGNED, description, () => ({ assignedTeamMemberId: memberId }));
    }, [withActivityLog, teamMembers]);

    const assignTenderToClient = useCallback((tenderId: string, clientId: string | null) => {
        withActivityLog(tenderId, ActivityType.FINANCIALS_UPDATED, `Client updated.`, item => ({ financialDetails: { ...item.financialDetails, clientId } }));
    }, [withActivityLog]);
    
    const updateFinancialDetails = useCallback((tenderId: string, details: Partial<FinancialDetails>) => {
        withActivityLog(tenderId, ActivityType.FINANCIALS_UPDATED, 'Financial details updated.', item => ({ financialDetails: { ...item.financialDetails, ...details } }));
    }, [withActivityLog]);
    
    const addQuoteItem = useCallback((tenderId: string, quoteItem: Omit<QuoteItem, 'id'>) => {
        const newItem = { ...quoteItem, id: crypto.randomUUID() };
        withActivityLog(tenderId, ActivityType.QUOTE_ITEM_ADDED, `Added item: ${newItem.itemName}`, item => ({ quoteItems: [...(item.quoteItems || []), newItem] }));
    }, [withActivityLog]);

     const addMultipleQuoteItems = useCallback((tenderId: string, quoteItems: Omit<QuoteItem, "id">[]) => {
        const newItems = quoteItems.map(item => ({ ...item, id: crypto.randomUUID() }));
        withActivityLog(tenderId, ActivityType.QUOTE_ITEM_ADDED, `Added ${newItems.length} items from catalog.`, item => ({ quoteItems: [...(item.quoteItems || []), ...newItems] }));
    }, [withActivityLog]);
    
    const updateQuoteItem = useCallback((tenderId: string, itemId: string, updatedItem: QuoteItem) => {
        withActivityLog(tenderId, ActivityType.QUOTE_ITEM_UPDATED, `Updated item: ${updatedItem.itemName}`, item => ({ quoteItems: (item.quoteItems || []).map(qi => qi.id === itemId ? updatedItem : qi) }));
    }, [withActivityLog]);

    const removeQuoteItem = useCallback((tenderId: string, itemId: string) => {
        const itemToRemove = watchlist.find(i => i.tender.id === tenderId)?.quoteItems?.find(qi => qi.id === itemId);
        withActivityLog(tenderId, ActivityType.QUOTE_ITEM_REMOVED, `Removed item: ${itemToRemove?.itemName || 'N/A'}`, item => ({ quoteItems: (item.quoteItems || []).filter(qi => qi.id !== itemId) }));
    }, [withActivityLog, watchlist]);

    const addDocument = useCallback((tenderId: string, file: { name: string, data: string, type: string }, category: DocumentCategory, uploadedBy: string, isGenerated = false) => {
        const newDoc: ManagedDocument = { id: crypto.randomUUID(), name: file.name, fileName: file.name, fileData: file.data, mimeType: file.type, status: DocumentStatus.COMPLETED, category, uploadedBy, uploadedAt: new Date().toISOString(), isGenerated };
        withActivityLog(tenderId, ActivityType.DOCUMENT_UPLOADED, `Uploaded document: ${file.name}`, item => ({ documents: [...(item.documents || []), newDoc] }));
    }, [withActivityLog]);
    
    const removeDocument = useCallback((tenderId: string, docId: string, removerName: string) => {
        const docToRemove = watchlist.find(i => i.tender.id === tenderId)?.documents?.find(d => d.id === docId);
        withActivityLog(tenderId, ActivityType.DOCUMENT_REMOVED, `Removed document: ${docToRemove?.fileName || 'N/A'} by ${removerName}`, item => ({ documents: (item.documents || []).filter(d => d.id !== docId) }));
    }, [withActivityLog, watchlist]);

    // FIX: Correctly construct the Comment object with 'watchlistId' and find the item first.
    const addComment = useCallback((tenderId: string, authorId: string, text: string, mentions?: string[]) => {
        const item = watchlist.find(i => i.tender.id === tenderId);
        if (!item) return;

        const newComment: Comment = { id: crypto.randomUUID(), watchlistId: item.id, authorId, text, createdAt: new Date().toISOString(), mentions };
        withActivityLog(tenderId, ActivityType.COMMENT_ADDED, `Added a new comment.`, item => ({ comments: [...(item.comments || []), newComment] }));
        
        mentions?.forEach(mentionedId => {
            if (mentionedId !== authorId) {
                const author = teamMembers.find(m => m.id === authorId);
                const tender = watchlist.find(t => t.tender.id === tenderId);
                addNotification({ type: NotificationType.USER_MENTIONED, message: `${author?.name} mentioned you in ${tender?.tender.title}.`, tenderId: tenderId, isRead: false } as any);
            }
        });
    }, [withActivityLog, addNotification, teamMembers, watchlist]);

    const addInvoice = useCallback((tenderId: string, invoice: Omit<Invoice, 'id'>) => {
        const newInvoice = { ...invoice, id: crypto.randomUUID() };
        withActivityLog(tenderId, ActivityType.INVOICE_CREATED, `Created invoice: ${newInvoice.invoiceNumber}`, item => ({ invoices: [...(item.invoices || []), newInvoice] }));
    }, [withActivityLog]);

    const updateInvoice = useCallback((tenderId: string, invoiceId: string, updatedInvoice: Invoice) => {
        withActivityLog(tenderId, ActivityType.INVOICE_UPDATED, `Updated invoice: ${updatedInvoice.invoiceNumber}`, item => ({ invoices: (item.invoices || []).map(i => i.id === invoiceId ? updatedInvoice : i) }));
    }, [withActivityLog]);

    const removeInvoice = useCallback((tenderId: string, invoiceId: string) => {
        const invToRemove = watchlist.find(i => i.tender.id === tenderId)?.invoices?.find(inv => inv.id === invoiceId);
        withActivityLog(tenderId, ActivityType.INVOICE_REMOVED, `Removed invoice: ${invToRemove?.invoiceNumber || 'N/A'}`, item => ({ invoices: (item.invoices || []).filter(i => i.id !== invoiceId) }));
    }, [withActivityLog, watchlist]);

    const createInvoiceFromQuote = useCallback((tenderId: string) => {
        const tender = watchlist.find(t => t.tender.id === tenderId);
        if (!tender) return;
        const subtotal = tender.quoteItems?.reduce((acc, q) => acc + q.quantity * q.unitPrice, 0) || 0;
        const delivery = tender.financialDetails?.deliveryCost ?? 0;
        const installation = tender.financialDetails?.installationCost ?? 0;
        const vat = subtotal * ((tender.financialDetails?.vatPercentage ?? 0) / 100);
        const total = subtotal + delivery + installation + vat;
        if (total <= 0) { addToast('Cannot create invoice from quote with zero value.', 'info'); return; }
        const newInvoice: Omit<Invoice, 'id'> = { invoiceNumber: `INV-${tender.tender.id.slice(-4)}-${(tender.invoices?.length || 0) + 1}`, issueDate: new Date().toISOString().split('T')[0], dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], description: `Invoice for: ${tender.tender.title}`, amount: total, status: InvoiceStatus.DRAFT };
        addInvoice(tenderId, newInvoice);
    }, [watchlist, addInvoice, addToast]);
    
    const addContactToClient = useCallback((clientId: string, contact: Omit<Contact, 'id'>) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        const newContact = { ...contact, id: crypto.randomUUID() };
        updateClient(clientId, { ...client, contacts: [...(client.contacts || []), newContact] } as Client);
    }, [clients, updateClient]);
    
    const updateContactInClient = useCallback((clientId: string, updatedContact: Contact) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        const updatedContacts = (client.contacts || []).map(c => c.id === updatedContact.id ? updatedContact : c);
        updateClient(clientId, { ...client, contacts: updatedContacts } as Client);
    }, [clients, updateClient]);

    const removeContactFromClient = useCallback((clientId: string, contactId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        const updatedContacts = (client.contacts || []).filter(c => c.id !== contactId);
        updateClient(clientId, { ...client, contacts: updatedContacts } as Client);
    }, [clients, updateClient]);

    const addInteractionToClient = useCallback((clientId: string, interaction: Omit<Interaction, 'id'>) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        const newInteraction = { ...interaction, id: crypto.randomUUID() };
        updateClient(clientId, { ...client, interactions: [...(client.interactions || []), newInteraction] } as Client);
    }, [clients, updateClient]);

    const addClientDocument = useCallback((clientId: string, file: { name: string; data: string; type: string; }, category: ClientDocumentCategory, uploadedBy: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        const newDoc: ClientDocument = { id: crypto.randomUUID(), name: file.name, fileData: file.data, mimeType: file.type, category, uploadedBy, uploadedAt: new Date().toISOString() };
        updateClient(clientId, { ...client, documents: [...(client.documents || []), newDoc] } as Client);
    }, [clients, updateClient]);
    
    const removeClientDocument = useCallback((clientId: string, docId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        updateClient(clientId, { ...client, documents: (client.documents || []).filter(d => d.id !== docId) } as Client);
    }, [clients, updateClient]);

    const addPurchaseOrder = useCallback((tenderId: string, po: Omit<PurchaseOrder, 'id'>) => {
        const newPO = { ...po, id: crypto.randomUUID() };
        withActivityLog(tenderId, ActivityType.PO_CREATED, `Created Purchase Order: ${newPO.poNumber}`, item => ({ purchaseOrders: [...(item.purchaseOrders || []), newPO] }));
    }, [withActivityLog]);

    const updatePurchaseOrder = useCallback((tenderId: string, updatedPo: PurchaseOrder) => {
        withActivityLog(tenderId, ActivityType.FINANCIALS_UPDATED, `Updated Purchase Order: ${updatedPo.poNumber}`, item => ({ purchaseOrders: (item.purchaseOrders || []).map(p => p.id === updatedPo.id ? updatedPo : p) }));
    }, [withActivityLog]);

    const removePurchaseOrder = useCallback((tenderId: string, poId: string) => {
        const poToRemove = watchlist.find(i => i.tender.id === tenderId)?.purchaseOrders?.find(p => p.id === poId);
        withActivityLog(tenderId, ActivityType.FINANCIALS_UPDATED, `Removed Purchase Order: ${poToRemove?.poNumber || 'N/A'}`, item => ({ purchaseOrders: (item.purchaseOrders || []).filter(p => p.id !== poId) }));
    }, [withActivityLog, watchlist]);
  
  const addVendorDocument = useCallback((vendorId: string, file: { name: string; data: string; type: string; }, category: VendorDocumentCategory, uploadedBy: string) => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) return;
      const newDoc: VendorDocument = { id: crypto.randomUUID(), name: file.name, fileData: file.data, mimeType: file.type, category, uploadedBy, uploadedAt: new Date().toISOString() };
      updateVendor(vendorId, { ...vendor, documents: [...(vendor.documents || []), newDoc] } as Vendor);
  }, [vendors, updateVendor]);

  const removeVendorDocument = useCallback((vendorId: string, docId: string) => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) return;
      updateVendor(vendorId, { ...vendor, documents: (vendor.documents || []).filter(d => d.id !== docId) } as Vendor);
  }, [vendors, updateVendor]);

  const addTaskTemplate = createGenericAdder<Partial<TaskTemplate>>('task_templates', setTaskTemplates);
  const updateTaskTemplate = createUpdater('task_templates', setTaskTemplates);
  const removeTaskTemplate = createDeleter('task_templates', taskTemplates, setTaskTemplates);
  const applyTaskTemplate = useCallback(async (tenderId: string, templateId: string, assignedToId: string | null, assignedById: string) => {
    const template = taskTemplates.find(t => t.id === templateId);
    if (!template) return;
    const tender = watchlist.find(w => w.tender.id === tenderId);
    if (!tender) return;
    const tenderStartDate = new Date(tender.tender.publishedDate);
    const newTasks: Omit<Task, 'id'>[] = template.tasks.map((taskTemplate: TaskTemplateItem) => {
        const dueDate = new Date(tenderStartDate);
        dueDate.setDate(dueDate.getDate() + taskTemplate.dueDays);
        return { title: taskTemplate.title, description: taskTemplate.description, tenderId: tenderId, assignedToId: assignedToId, assignedById: assignedById, dueDate: dueDate.toISOString().split('T')[0], status: TaskStatus.TODO };
    });
    if (newTasks.length > 0) {
        if (!user) return;
        const tasksToInsert = newTasks.map(t => ({...t, user_id: user.id}));
        const { data, error } = await supabase.from('tasks').insert(tasksToInsert).select();
        if (error) { addToast('Failed to apply template.', 'error'); } 
        else if(data) {
            setTasks(current => [...current, ...data]);
            withActivityLog(tenderId, ActivityType.TEMPLATE_APPLIED, `Applied template: "${template.name}"`, item => item);
            addToast('Task template applied.', 'success');
        }
    }
  }, [user, taskTemplates, watchlist, withActivityLog, addToast, setTasks]);

  const addJournalEntry = createGenericAdder<Partial<JournalEntry>>('journal_entries', setJournalEntries);
  const updateJournalEntry = createUpdater('journal_entries', setJournalEntries);
  const removeJournalEntry = createDeleter('journal_entries', journalEntries, setJournalEntries);
  const addAccount = createGenericAdder<Partial<Account>>('chart_of_accounts', setChartOfAccounts);
  const removeAccount = createDeleter('chart_of_accounts', chartOfAccounts, setChartOfAccounts);

  const generateRiskAssessment = useCallback(async (tenderId: string) => {
      const item = watchlist.find(i => i.tender.id === tenderId);
      if (!item) return;
      const quoteValue = item.quoteItems?.reduce((acc, q) => acc + q.quantity * q.unitPrice, 0) || 0;
      const assessment = await assessTenderRisk(item.tender, quoteValue, aiConfig);
      withActivityLog(tenderId, ActivityType.RISK_ASSESSMENT_GENERATED, 'Generated a new risk assessment.', () => ({ riskAssessment: { ...assessment, generatedAt: new Date().toISOString() } }));
  }, [watchlist, aiConfig, withActivityLog]);

  const generateDocumentAnalysis = useCallback(async (tenderId: string, docId: string) => {
      const item = watchlist.find(i => i.tender.id === tenderId);
      const doc = item?.documents?.find(d => d.id === docId);
      if (!item || !doc) throw new Error("Document not found");
      const analysis = await analyzeDocument(doc, aiConfig);
      const newAnalysis = { ...analysis, generatedAt: new Date().toISOString() };
      withActivityLog(tenderId, ActivityType.DOCUMENT_ANALYZED, `Analyzed document: ${doc.fileName}`, i => ({
          documents: (i.documents || []).map(d => d.id === docId ? { ...d, analysis: newAnalysis } : d)
      }));
      return newAnalysis;
  }, [watchlist, aiConfig, withActivityLog]);

  const generateAISummary = useCallback(async (tenderId: string) => {
      const item = watchlist.find(i => i.tender.id === tenderId);
      if (!item) return;
      const summary = await generateWorkspaceSummary(item.tender, aiConfig);
      withActivityLog(tenderId, ActivityType.NOTE_UPDATED, 'Generated AI summary.', () => ({ aiSummary: summary }));
  }, [watchlist, aiConfig, withActivityLog]);

  return {
    sources, watchlist, companyProfile, catalog, vendors, teamMembers, clients, shipments, tasks,
    taskTemplates, aiConfig, expenses, notifications, journalEntries, documentSettings, mailSettings,
    tenders, loading, error, lastFetched, toasts, chartOfAccounts, currentUserId,
    setCurrentUserId,
    addToast, removeToast, refreshTenders, addSource, removeSource, updateSource, addMultipleSources,
    addToWatchlist, addManualTender, updateWatchlistStatus, removeFromWatchlist, updateTenderClosingDate,
    updateTenderCategory, updateCompanyProfile: (p: any) => updateProfileData({ company_profile: p }),
    addCatalogItem, updateCatalogItem, removeCatalogItem, updateCatalogItemFromQuoteItem,
    addVendor, updateVendor, removeVendor, addVendorDocument, removeVendorDocument,
    addClient, updateClient, removeClient,
    addShipment, updateShipment, removeShipment,
    addTask, updateTask, removeTask, updateTaskStatus,
    addTeamMember, updateTeamMember, removeTeamMember, updateCurrentUserName,
    addExpense, updateExpense, removeExpense,
    updateAIConfig: (c: any) => updateProfileData({ ai_config: c }),
    updateDocumentSettings: (s: any) => updateProfileData({ document_settings: s }),
    updateMailSettings: (s: any) => updateProfileData({ mail_settings: s }),
    updateNotes, assignTenderToMember, assignTenderToClient, updateFinancialDetails,
    addQuoteItem, addMultipleQuoteItems, updateQuoteItem, removeQuoteItem, addDocument, removeDocument,
    addComment, addContactToClient, updateContactInClient, removeContactFromClient, addInteractionToClient,
    addClientDocument, removeClientDocument,
    addTaskTemplate, updateTaskTemplate, removeTaskTemplate, applyTaskTemplate,
    markNotificationAsRead, markAllNotificationsAsRead,
    addJournalEntry, updateJournalEntry, removeJournalEntry, addAccount, removeAccount,
    createInvoiceFromQuote, addInvoice, updateInvoice, removeInvoice,
    addPurchaseOrder, updatePurchaseOrder, removePurchaseOrder,
    generateRiskAssessment, generateDocumentAnalysis, generateAISummary,
  };
};