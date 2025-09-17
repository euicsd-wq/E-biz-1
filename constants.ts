import type { Source, View } from './types';
import { TeamMemberRole } from './types';

export const DEFAULT_SOURCES: Source[] = [
  { id: 'sudanbid-json', url: 'https://rss.app/feeds/v1.1/5hvMa0JIXJnG0baI.json' },
];

export const CORS_PROXY_URL = 'https://corsproxy.io/?';

export const ALL_PERMISSIONS: { id: View; label: string }[] = [
    { id: 'home', label: 'Home Dashboard' },
    { id: 'operations-hub', label: 'Operations Hub' },
    { id: 'crm-hub', label: 'CRM Hub' },
    { id: 'finance-hub', label: 'Finance Hub' },
    { id: 'reporting-hub', label: 'Reporting Hub' },
    { id: 'mail', label: 'Mail Client' },
    { id: 'settings', label: 'Settings' },
];

export const ROLE_PERMISSIONS: Record<TeamMemberRole, View[]> = {
    [TeamMemberRole.ADMIN]: ['home', 'operations-hub', 'crm-hub', 'finance-hub', 'reporting-hub', 'settings', 'mail'],
    [TeamMemberRole.MANAGER]: ['home', 'operations-hub', 'crm-hub', 'finance-hub', 'reporting-hub', 'settings', 'mail'],
    [TeamMemberRole.MEMBER]: ['home', 'operations-hub', 'crm-hub', 'settings', 'mail'],
};


export const DEFAULT_TECH_SPEC_FIELDS: { id: string; label: string; type: 'text' | 'textarea' }[] = [
  { id: 'manufacturerName', label: 'I. Manufacturer Name', type: 'text' },
  { id: 'modelNo', label: 'II. Model No.', type: 'text' },
  { id: 'countryOfOrigin', label: 'III. Country of Origin', type: 'text' },
  { id: 'descriptionOfFunction', label: '1. Description of Function', type: 'textarea' },
  { id: 'operationalRequirements', label: '2. Operational Requirements', type: 'textarea' },
  { id: 'systemConfiguration', label: '3. System Configuration', type: 'textarea' },
  { id: 'technicalSpecifications', label: '4. Technical Specifications', type: 'textarea' },
  { id: 'accessoriesSparesConsumables', label: '5. Accessories, Spares, and Consumables', type: 'textarea' },
  { id: 'operatingEnvironment', label: '6. Operating Environment', type: 'textarea' },
  { id: 'standardsSafetyRequirements', label: '7. Standards and Safety Requirements', type: 'textarea' },
  { id: 'userTraining', label: '8. User Training', type: 'textarea' },
  { id: 'warranty', label: '9. Warranty', type: 'textarea' },
  { id: 'maintenanceService', label: '10. Maintenance Service During Warranty Period', type: 'textarea' },
  { id: 'installationCommissioning', label: '11. Installation and Commissioning', type: 'textarea' },
  { id: 'documentation', label: '12. Documentation', type: 'textarea' },
];

export const DEFAULT_SERVICE_SPEC_FIELDS: { id: string; label: string; type: 'text' | 'textarea' }[] = [
  { id: 'scopeOfWork', label: '1. Scope of Work', type: 'textarea' },
  { id: 'keyDeliverables', label: '2. Key Deliverables', type: 'textarea' },
  { id: 'timeline', label: '3. Proposed Timeline', type: 'textarea' },
  { id: 'personnel', label: '4. Key Personnel', type: 'textarea' },
  { id: 'reporting', label: '5. Reporting Requirements', type: 'textarea' },
  { id: 'qualityAssurance', label: '6. Quality Assurance Plan', type: 'textarea' },
];