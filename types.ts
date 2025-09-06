export interface Source {
  id: string;
  url: string;
}

export interface Tender {
  id: string;
  title: string;
  summary: string;
  publishedDate: string;
  closingDate: string;
  isClosingDateEstimated: boolean;
  link: string;
  source: string;
}

export enum TenderStatus {
  WATCHING = "Watching",
  APPLYING = "Applying",
  SUBMITTED = "Submitted",
  WON = "Won",
  LOST = "Lost",
  ARCHIVED = "Archived"
}

export interface TechnicalDetails {
  [key: string]: string | undefined;
}


export interface QuoteItem {
  id: string;
  itemName: string;
  description: string;
  manufacturer?: string;
  model?: string;
  uom?: string;
  quantity: number;
  unitPrice: number;
  cost?: number; // Cost of the item
  technicalDetails?: TechnicalDetails;
  catalogItemRef?: string; // Reference to CatalogItem ID
  itemType?: 'Goods' | 'Services';
  hsnCode?: string;
}

export enum DocumentStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
}

export enum DocumentCategory {
    CLIENT = "Client Documents",
    TECHNICAL = "Technical",
    FINANCIAL = "Financial",
    LEGAL = "Legal",
    CORRESPONDENCE = "Correspondence",
    GENERATED = "Generated Offers",
    // New smarter categories
    PURCHASE_ORDER = "Purchase Orders",
    CONTRACT = "Contracts",
    GOODS_RECEIVED_NOTE = "Goods Received Notes",
}

export interface DocumentAnalysis {
    summary: string;
    keyRequirements: string[];
    deadlines: string[];
    risksOrRedFlags: string[];
    generatedAt: string;
}

export interface ManagedDocument {
  id: string;
  name: string;
  status: DocumentStatus; // Retained for potential future use, though category is primary now.
  fileName?: string;
  fileData?: string; // base64
  mimeType?: string;
  // New fields for Document Hub
  category: DocumentCategory;
  uploadedBy: string;
  uploadedAt: string;
  isGenerated?: boolean;
  analysis?: DocumentAnalysis;
}

export enum InvoiceStatus {
  DRAFT = "Draft",
  SENT = "Sent",
  PAID = "Paid",
  OVERDUE = "Overdue",
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  regNo: string;
  tin: string;
  ungm: string;
  logo?: string;
}

export interface FinancialDetails {
  clientId?: string | null;
  quoteNumber?: string;
  issueDate?: string;
  validTill?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToEmail?: string;
  shipToPhone?: string;
  itbRef?: string;
  itbDate?: string;
  incoterms?: string;
  currency?: string;
  amountInWords?: string;
  termsAndConditions?: string;
  paymentMethod?: string;
  deliveryCost?: number;
  installationCost?: number;
  vatPercentage?: number;
  // New detailed fields
  installationAndTraining?: string;
  validity?: string;
  deliveryTerms?: string;
  remarks?: string;
}

export enum TechnicalOfferType {
  GOODS = "Goods",
  SERVICES = "Services",
  CONSULTANCY = "Consultancy",
}

export enum ActivityType {
  TENDER_ADDED = "Tender Added",
  STATUS_CHANGE = "Status Change",
  NOTE_UPDATED = "Note Updated",
  QUOTE_ITEM_ADDED = "Quote Item Added",
  QUOTE_ITEM_REMOVED = "Quote Item Removed",
  QUOTE_ITEM_UPDATED = "Quote Item Updated",
  FINANCIALS_UPDATED = "Financials Updated",
  PAYMENT_METHOD_UPDATED = "Payment Method Updated",
  INVOICE_CREATED = "Invoice Created",
  INVOICE_UPDATED = "Invoice Updated",
  INVOICE_REMOVED = "Invoice Removed",
  TENDER_ASSIGNED = "Tender Assigned",
  TASK_ASSIGNED = "Task Assigned",
  PO_CREATED = "Purchase Order Created",
  DOCUMENT_UPLOADED = "Document Uploaded",
  DOCUMENT_REMOVED = "Document Removed",
  EXPENSE_ADDED = "Expense Added",
  EXPENSE_UPDATED = "Expense Updated",
  EXPENSE_REMOVED = "Expense Removed",
  TEMPLATE_APPLIED = "Template Applied",
  RISK_ASSESSMENT_GENERATED = "Risk Assessment Generated",
  DOCUMENT_ANALYZED = "Document Analyzed",
  COMMENT_ADDED = "Comment Added",
  USER_MENTIONED = "User Mentioned",
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: ActivityType;
  description: string;
  tenderId: string;
  tenderTitle: string;
}

export type OfferDocumentType = 'technicalOffer' | 'financialOffer' | 'combinedOffer';

export enum POStatus {
    DRAFT = 'Draft',
    ISSUED = 'Issued',
    COMPLETED = 'Completed',
}

export interface POItem {
    id: string;
    description: string;
    uom?: string;
    quantity: number;
    unitPrice: number;
    quoteItemRef: string; // Original QuoteItem ID
    hsnCode?: string;
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    issueDate: string;
    vendorId: string;
    status: POStatus;
    items: POItem[];
}

export enum RiskLevel {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
}

export interface RiskAssessment {
    overallRisk: RiskLevel;
    identifiedRisks: string[];
    mitigationStrategies: string[];
    confidenceScore: number; // e.g., 0.85 for 85%
    generatedAt: string;
}

export interface Comment {
    id: string;
    tenderId: string;
    authorId: string;
    text: string;
    createdAt: string;
    mentions?: string[]; // array of team member IDs
}

export interface AIInsights {
  keywords?: string[];
  estimatedValue?: string;
}

export interface WatchlistItem {
  tender: Tender;
  status: TenderStatus;
  addedAt: string;
  assignedTeamMemberId?: string | null;
  category?: string;
  // Workspace properties
  quoteItems?: QuoteItem[];
  // technicalOffer and financialOffer are kept for data model consistency, but UI will focus on combinedOffer
  technicalOffer?: ManagedDocument;
  financialOffer?: ManagedDocument;
  combinedOffer?: ManagedDocument;
  invoices?: Invoice[];
  notes?: string;
  financialDetails?: FinancialDetails;
  technicalOfferType?: TechnicalOfferType;
  clientDocuments?: ManagedDocument[]; // @deprecated - use documents instead
  documents?: ManagedDocument[];
  technicalOfferSOP?: string[];
  activityLog?: ActivityLog[];
  purchaseOrders?: PurchaseOrder[];
  riskAssessment?: RiskAssessment;
  aiSummary?: string;
  comments?: Comment[];
  aiInsights?: AIInsights;
}

export interface CatalogItemDocument {
  id: string;
  name: string;
  data: string; // base64
  mimeType: string;
}

export enum VendorType {
    GOODS_SUPPLIER = 'Goods Supplier',
    SERVICE_PROVIDER = 'Service Provider',
    LOGISTICS_PARTNER = 'Logistics Partner',
    OTHER = 'Other',
}

export enum VendorDocumentCategory {
    QUOTATION = 'Quotation',
    PROFORMA_INVOICE = 'Proforma Invoice',
    INVOICE = 'Invoice',
    LICENSE = 'License',
    CONTRACT = 'Contract',
    CERTIFICATE = 'Certificate',
    OTHER = 'Other',
}

export interface VendorDocument {
    id: string;
    name: string;
    category: VendorDocumentCategory;
    fileData: string; // base64
    mimeType: string;
    uploadedAt: string;
    uploadedBy: string; // TeamMember ID
}


export interface Vendor {
  id: string;
  name: string;
  vendorType: VendorType;
  // Contact Info
  address: string;
  city?: string;
  country?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  // Primary Contact
  contactPerson: string;
  // Internal Info
  assignedTeamMemberId: string | null;
  notes?: string;
  // Financial Info
  bankName?: string;
  bankAccountNumber?: string;
  taxId?: string;
  documents?: VendorDocument[];
}

export enum TeamMemberRole {
    ADMIN = 'Admin',
    MANAGER = 'Manager',
    MEMBER = 'Member',
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: TeamMemberRole;
}

export enum InteractionType {
    EMAIL = 'Email',
    CALL = 'Call',
    MEETING = 'Meeting',
    NOTE = 'Note',
}

export interface Interaction {
    id: string;
    type: InteractionType;
    notes: string;
    date: string; // ISO string
    authorId: string; // TeamMember ID
}

export interface Contact {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
}

export enum ClientDocumentCategory {
    CONTRACT = 'Contract',
    NDA = 'Non-Disclosure Agreement',
    RFQ = 'Request for Quotation',
    INVOICE = 'Invoice',
    CORRESPONDENCE = 'Correspondence',
    OTHER = 'Other',
}

export interface ClientDocument {
    id: string;
    name: string;
    category: ClientDocumentCategory;
    fileData: string; // base64
    mimeType: string;
    uploadedAt: string;
    uploadedBy: string; // TeamMember ID
}

export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  contactPerson: string;
  contacts?: Contact[];
  interactions?: Interaction[];
  documents?: ClientDocument[];
}

export interface CatalogItem {
  id: string;
  itemType: 'Goods' | 'Services';
  category: string;
  itemName: string;
  description: string;
  manufacturer?: string;
  model?: string;
  salePrice: number;
  cost: number;
  uom?: string;
  vendorId: string | null;
  assignedPersonId: string | null;
  technicalSpecs: TechnicalDetails;
  documents: CatalogItemDocument[];
  hsnCode?: string;
}

// Type for AI response before processing into CatalogItem
export interface AIExtractedItem {
  itemName: string;
  description: string;
  cost: number;
  uom?: string;
  manufacturer?: string;
  model?: string;
  technicalSpecs: { specName: string; specValue: string }[];
  hsnCode?: string;
}

export enum ShipmentStatus {
  PENDING = 'Pending',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
}

export interface ShipmentDocument {
    name: string;
    data: string; // base64
    mimeType: string;
}

export interface Shipment {
  id: string;
  tenderId: string;
  vendorId: string;
  status: ShipmentStatus;
  awbNumber: string;
  trackingLink?: string;
  pickupLocation: string;
  pickupDate: string;
  deliveryLocation: string;
  deliveryDate: string;
  cost: number;
  awbDocument?: ShipmentDocument;
  podDocument?: ShipmentDocument; // Proof of Delivery
  grnDocument?: ShipmentDocument; // Goods Received Note
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  tenderId: string; // Project
  assignedToId: string | null;
  assignedById: string | null; // Can be null if created by "system" or before team existed
  dueDate: string;
  status: TaskStatus;
}

export interface TaskTemplateItem {
  id: string;
  title: string;
  description: string;
  dueDays: number; // Days relative to tender start date
}

export interface TaskTemplate {
  id: string;
  name: string;
  tasks: TaskTemplateItem[];
}

export enum AIProvider {
    GEMINI = 'Google Gemini',
    OPENAI = 'OpenAI (ChatGPT)',
    DEEPSEEK = 'DeepSeek',
    ANTHROPIC = 'Anthropic (Claude)',
}

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    model?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  tenderId?: string;
}

export enum NotificationType {
    DEADLINE_APPROACHING = 'Deadline Approaching',
    TASK_ASSIGNED = 'Task Assigned',
    STATUS_CHANGED = 'Status Changed',
    INVOICE_OVERDUE = 'Invoice Overdue',
    TASK_OVERDUE = 'Task Overdue',
    USER_MENTIONED = "User Mentioned",
}

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    tenderId?: string; // To link to the relevant tender
    isRead: boolean;
    createdAt: string;
}

export enum AccountType {
    ASSET = 'Asset',
    LIABILITY = 'Liability',
    EQUITY = 'Equity',
    REVENUE = 'Revenue',
    EXPENSE = 'Expense',
}

export interface Account {
    id: string;
    name: string;
    type: AccountType;
}

export interface JournalEntryTransaction {
    accountId: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    date: string;
    description: string;
    transactions: JournalEntryTransaction[];
}

export enum CloudProvider {
    SUPABASE = 'Supabase',
    FIREBASE = 'Firebase',
    AWS = 'AWS S3',
    AZURE = 'Azure Blob Storage',
}

export interface CloudSyncConfig {
    provider: CloudProvider;
    // Supabase
    projectUrl?: string;
    apiKey?: string;
    // Firebase
    firebaseConfig?: string; // JSON string
    // AWS
    awsRegion?: string;
    awsBucket?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    // Azure
    azureAccountName?: string;
    azureContainerName?: string;
    azureSasToken?: string;
}


export type CloudSyncStatus = 'idle' | 'syncing' | 'pulling' | 'success' | 'error';

export interface CloudSyncState {
    lastSync?: string;
    status: CloudSyncStatus;
    error?: string;
}

export enum DocumentType {
    QUOTE = 'Quotation',
    PROFORMA_INVOICE = 'Proforma Invoice',
    COMMERCIAL_INVOICE = 'Commercial Invoice',
    DELIVERY_NOTE = 'Delivery Note',
    PURCHASE_ORDER = 'Purchase Order',
    TECHNICAL_OFFER = 'Technical Offer',
}

// FIX: Add DocumentTemplateStyle enum for document appearance settings.
export enum DocumentTemplateStyle {
    CLASSIC = 'Classic',
    MODERN = 'Modern',
    MINIMALIST = 'Minimalist',
}

// FIX: Expanded DocumentSettings to include all required fields for customization.
export interface DocumentSettings {
  accentColor: string;
  fontFamily: 'Inter' | 'Roboto' | 'Times New Roman' | 'Courier New';
  fontSize: number; // pt
  showLogo: boolean;
  logoSize: 'small' | 'medium' | 'large';
  pageMargin: 'small' | 'medium' | 'large';
  documentTitleQuote: string;
  documentTitleProforma: string;
  documentTitleInvoice: string;
  documentTitleDeliveryNote: string;
  documentTitlePO: string;
  notesLabel: string;
  termsLabel: string;
  templateStyle: DocumentTemplateStyle;
  logoPosition: 'left' | 'right';
  tableTheme: 'striped' | 'grid' | 'plain';
  secondaryColor: string;
  textColor: string;
  footerText: string;
  showPageNumbers: boolean;
}

export enum StorageMode {
    LOCAL_ONLY = 'Local Only',
    CLOUD_BACKUP = 'Local with Cloud Backup',
}

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export interface MailSettings {
  url: string;
}

export interface BackupData {
  sources: Source[];
  watchlist: WatchlistItem[];
  companyProfile: CompanyProfile;
  catalog: CatalogItem[];
  vendors: Vendor[];
  teamMembers: TeamMember[];
  clients: Client[];
  shipments: Shipment[];
  tasks: Task[];
  taskTemplates?: TaskTemplate[];
  currentUserId?: string | null;
  aiConfig?: AIConfig;
  expenses?: Expense[];
  notifications?: Notification[];
  expenseCategories?: string[];
  chartOfAccounts?: Account[];
  journalEntries?: JournalEntry[];
  poCounter?: number;
  storageMode?: StorageMode;
  cloudSyncConfig?: CloudSyncConfig;
  documentSettings?: DocumentSettings;
  mailSettings?: MailSettings;
}

export type View = 'home' | 'operations-hub' | 'crm-hub' | 'finance-hub' | 'reporting-hub' | 'settings' | 'notifications' | 'mail';

export type GlobalSearchResult = {
  type: 'tender' | 'client' | 'catalog';
  id: string;
  title: string;
  subtitle: string;
  item: WatchlistItem | Client | CatalogItem;
};