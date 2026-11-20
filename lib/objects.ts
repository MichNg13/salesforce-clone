// Object metadata: one definition per CRM object drives list views, record
// pages, forms, related lists and search. Everything here is plain data so it
// can be passed straight to client components.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'picklist'
  | 'lookup'
  | 'checkbox';

export type LookupTarget = ObjectKey | 'profiles';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  section?: string;
  required?: boolean;
  readOnly?: boolean; // shown on record pages, never in forms
  options?: string[];
  lookup?: LookupTarget;
  defaultValue?: string | number | boolean;
  full?: boolean; // span both columns
  help?: string;
}

export interface RelatedListDef {
  object: ObjectKey;
  foreignKey: string;
  title?: string;
  columns: string[];
}

export interface PathDef {
  field: string;
  steps: string[];
  wonStep?: string;
  lostSteps?: string[];
}

export interface ObjectDef {
  key: ObjectKey;
  table: string;
  label: string;
  plural: string;
  color: string; // icon tile colour
  glyph: string; // 1–2 letters on the icon tile
  nameField: string;
  titleFrom?: string; // lookup field whose record name is used as the title
  listColumns: string[];
  highlights: string[];
  searchFields: string[];
  filterField?: string;
  defaultSort: { field: string; ascending: boolean };
  sections: string[];
  fields: FieldDef[];
  path?: PathDef;
  relatedLists?: RelatedListDef[];
  activityKey?: string; // column on activities pointing at this object
  inNav: boolean;
}

export type ObjectKey =
  | 'accounts'
  | 'contacts'
  | 'leads'
  | 'opportunities'
  | 'products'
  | 'opportunity_products'
  | 'cases'
  | 'activities';

const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const RATINGS = ['Hot', 'Warm', 'Cold'];
const INDUSTRIES = [
  'Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 'Retail',
  'Transportation', 'Hospitality', 'Education', 'Energy', 'Real Estate',
  'Food & Beverage', 'Government', 'Media', 'Telecommunications', 'Other',
];
const LEAD_SOURCES = [
  'Web', 'Phone Inquiry', 'Partner Referral', 'Trade Show', 'Advertisement', 'Email Campaign', 'Other',
];
export const OPPORTUNITY_STAGES = [
  'Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost',
];

const owner: FieldDef = { name: 'owner_id', label: 'Owner', type: 'lookup', lookup: 'profiles' };

export const OBJECTS: Record<ObjectKey, ObjectDef> = {
  accounts: {
    key: 'accounts',
    table: 'accounts',
    label: 'Account',
    plural: 'Accounts',
    color: '#5867e8',
    glyph: 'Ac',
    nameField: 'name',
    listColumns: ['name', 'type', 'industry', 'billing_city', 'phone', 'owner_id'],
    highlights: ['type', 'industry', 'phone', 'website', 'owner_id'],
    searchFields: ['name', 'phone', 'website', 'billing_city'],
    filterField: 'type',
    defaultSort: { field: 'name', ascending: true },
    sections: ['Account Information', 'Address', 'Description'],
    fields: [
      { name: 'name', label: 'Account Name', type: 'text', required: true, section: 'Account Information' },
      { ...owner, section: 'Account Information' },
      { name: 'type', label: 'Type', type: 'picklist', options: ['Prospect', 'Customer', 'Partner', 'Reseller', 'Competitor', 'Other'], section: 'Account Information' },
      { name: 'parent_account_id', label: 'Parent Account', type: 'lookup', lookup: 'accounts', section: 'Account Information' },
      { name: 'industry', label: 'Industry', type: 'picklist', options: INDUSTRIES, section: 'Account Information' },
      { name: 'rating', label: 'Rating', type: 'picklist', options: RATINGS, section: 'Account Information' },
      { name: 'website', label: 'Website', type: 'url', section: 'Account Information' },
      { name: 'phone', label: 'Phone', type: 'phone', section: 'Account Information' },
      { name: 'annual_revenue', label: 'Annual Revenue', type: 'currency', section: 'Account Information' },
      { name: 'employees', label: 'Employees', type: 'number', section: 'Account Information' },
      { name: 'billing_street', label: 'Billing Street', type: 'text', section: 'Address', full: true },
      { name: 'billing_city', label: 'Billing City', type: 'text', section: 'Address' },
      { name: 'billing_state', label: 'Billing State/Province', type: 'text', section: 'Address' },
      { name: 'billing_postal_code', label: 'Billing Postal Code', type: 'text', section: 'Address' },
      { name: 'billing_country', label: 'Billing Country', type: 'text', section: 'Address' },
      { name: 'description', label: 'Description', type: 'textarea', section: 'Description', full: true },
    ],
    relatedLists: [
      { object: 'contacts', foreignKey: 'account_id', columns: ['full_name', 'title', 'email', 'phone'] },
      { object: 'opportunities', foreignKey: 'account_id', columns: ['name', 'stage', 'amount', 'close_date'] },
      { object: 'cases', foreignKey: 'account_id', columns: ['case_number', 'subject', 'status', 'priority'] },
      { object: 'accounts', foreignKey: 'parent_account_id', title: 'Child Accounts', columns: ['name', 'type', 'billing_city'] },
    ],
    activityKey: 'account_id',
    inNav: true,
  },

  contacts: {
    key: 'contacts',
    table: 'contacts',
    label: 'Contact',
    plural: 'Contacts',
    color: '#7a4fd6',
    glyph: 'Co',
    nameField: 'full_name',
    listColumns: ['full_name', 'account_id', 'title', 'email', 'phone', 'owner_id'],
    highlights: ['account_id', 'title', 'email', 'phone', 'owner_id'],
    searchFields: ['full_name', 'email', 'phone', 'title'],
    defaultSort: { field: 'last_name', ascending: true },
    sections: ['Contact Information', 'Address', 'Description'],
    fields: [
      { name: 'salutation', label: 'Salutation', type: 'picklist', options: SALUTATIONS, section: 'Contact Information' },
      { ...owner, section: 'Contact Information' },
      { name: 'first_name', label: 'First Name', type: 'text', section: 'Contact Information' },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true, section: 'Contact Information' },
      { name: 'full_name', label: 'Name', type: 'text', readOnly: true, section: 'Contact Information' },
      { name: 'account_id', label: 'Account', type: 'lookup', lookup: 'accounts', section: 'Contact Information' },
      { name: 'title', label: 'Title', type: 'text', section: 'Contact Information' },
      { name: 'department', label: 'Department', type: 'text', section: 'Contact Information' },
      { name: 'email', label: 'Email', type: 'email', section: 'Contact Information' },
      { name: 'phone', label: 'Phone', type: 'phone', section: 'Contact Information' },
      { name: 'mobile', label: 'Mobile', type: 'phone', section: 'Contact Information' },
      { name: 'lead_source', label: 'Lead Source', type: 'picklist', options: LEAD_SOURCES, section: 'Contact Information' },
      { name: 'birthdate', label: 'Birthdate', type: 'date', section: 'Contact Information' },
      { name: 'mailing_street', label: 'Mailing Street', type: 'text', section: 'Address', full: true },
      { name: 'mailing_city', label: 'Mailing City', type: 'text', section: 'Address' },
      { name: 'mailing_state', label: 'Mailing State/Province', type: 'text', section: 'Address' },
      { name: 'mailing_postal_code', label: 'Mailing Postal Code', type: 'text', section: 'Address' },
      { name: 'mailing_country', label: 'Mailing Country', type: 'text', section: 'Address' },
      { name: 'description', label: 'Description', type: 'textarea', section: 'Description', full: true },
    ],
    relatedLists: [
      { object: 'opportunities', foreignKey: 'contact_id', columns: ['name', 'stage', 'amount', 'close_date'] },
      { object: 'cases', foreignKey: 'contact_id', columns: ['case_number', 'subject', 'status', 'priority'] },
    ],
    activityKey: 'contact_id',
    inNav: true,
  },

  leads: {
    key: 'leads',
    table: 'leads',
    label: 'Lead',
    plural: 'Leads',
    color: '#e8743b',
    glyph: 'Le',
    nameField: 'full_name',
    listColumns: ['full_name', 'company', 'status', 'rating', 'lead_source', 'email', 'owner_id'],
    highlights: ['company', 'title', 'email', 'phone', 'rating', 'owner_id'],
    searchFields: ['full_name', 'company', 'email', 'phone'],
    filterField: 'status',
    defaultSort: { field: 'created_at', ascending: false },
    sections: ['Lead Information', 'Address', 'Description', 'Conversion'],
    fields: [
      { name: 'salutation', label: 'Salutation', type: 'picklist', options: SALUTATIONS, section: 'Lead Information' },
      { ...owner, section: 'Lead Information' },
      { name: 'first_name', label: 'First Name', type: 'text', section: 'Lead Information' },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true, section: 'Lead Information' },
      { name: 'full_name', label: 'Name', type: 'text', readOnly: true, section: 'Lead Information' },
      { name: 'company', label: 'Company', type: 'text', required: true, section: 'Lead Information' },
      { name: 'title', label: 'Title', type: 'text', section: 'Lead Information' },
      { name: 'status', label: 'Lead Status', type: 'picklist', required: true, defaultValue: 'New', options: ['New', 'Working', 'Nurturing', 'Qualified', 'Unqualified'], section: 'Lead Information' },
      { name: 'email', label: 'Email', type: 'email', section: 'Lead Information' },
      { name: 'phone', label: 'Phone', type: 'phone', section: 'Lead Information' },
      { name: 'website', label: 'Website', type: 'url', section: 'Lead Information' },
      { name: 'rating', label: 'Rating', type: 'picklist', options: RATINGS, section: 'Lead Information' },
      { name: 'lead_source', label: 'Lead Source', type: 'picklist', options: LEAD_SOURCES, section: 'Lead Information' },
      { name: 'industry', label: 'Industry', type: 'picklist', options: INDUSTRIES, section: 'Lead Information' },
      { name: 'annual_revenue', label: 'Annual Revenue', type: 'currency', section: 'Lead Information' },
      { name: 'employees', label: 'Employees', type: 'number', section: 'Lead Information' },
      { name: 'street', label: 'Street', type: 'text', section: 'Address', full: true },
      { name: 'city', label: 'City', type: 'text', section: 'Address' },
      { name: 'state', label: 'State/Province', type: 'text', section: 'Address' },
      { name: 'postal_code', label: 'Postal Code', type: 'text', section: 'Address' },
      { name: 'country', label: 'Country', type: 'text', section: 'Address' },
      { name: 'description', label: 'Description', type: 'textarea', section: 'Description', full: true },
      { name: 'converted_at', label: 'Converted', type: 'datetime', readOnly: true, section: 'Conversion' },
      { name: 'converted_account_id', label: 'Converted Account', type: 'lookup', lookup: 'accounts', readOnly: true, section: 'Conversion' },
      { name: 'converted_contact_id', label: 'Converted Contact', type: 'lookup', lookup: 'contacts', readOnly: true, section: 'Conversion' },
      { name: 'converted_opportunity_id', label: 'Converted Opportunity', type: 'lookup', lookup: 'opportunities', readOnly: true, section: 'Conversion' },
    ],
    path: { field: 'status', steps: ['New', 'Working', 'Nurturing', 'Qualified', 'Converted'], wonStep: 'Converted', lostSteps: ['Unqualified'] },
    activityKey: 'lead_id',
    inNav: true,
  },

  opportunities: {
    key: 'opportunities',
    table: 'opportunities',
    label: 'Opportunity',
    plural: 'Opportunities',
    color: '#d9a400',
    glyph: 'Op',
    nameField: 'name',
    listColumns: ['name', 'account_id', 'stage', 'amount', 'close_date', 'owner_id'],
    highlights: ['account_id', 'amount', 'close_date', 'probability', 'owner_id'],
    searchFields: ['name', 'next_step'],
    filterField: 'stage',
    defaultSort: { field: 'close_date', ascending: true },
    sections: ['Opportunity Information', 'Description'],
    fields: [
      { name: 'name', label: 'Opportunity Name', type: 'text', required: true, section: 'Opportunity Information' },
      { ...owner, section: 'Opportunity Information' },
      { name: 'account_id', label: 'Account', type: 'lookup', lookup: 'accounts', section: 'Opportunity Information' },
      { name: 'contact_id', label: 'Primary Contact', type: 'lookup', lookup: 'contacts', section: 'Opportunity Information' },
      { name: 'stage', label: 'Stage', type: 'picklist', required: true, defaultValue: 'Prospecting', options: OPPORTUNITY_STAGES, section: 'Opportunity Information' },
      { name: 'close_date', label: 'Close Date', type: 'date', required: true, section: 'Opportunity Information' },
      { name: 'amount', label: 'Amount', type: 'currency', section: 'Opportunity Information', help: 'Calculated from products once line items are added.' },
      { name: 'probability', label: 'Probability (%)', type: 'percent', section: 'Opportunity Information', help: 'Leave blank to use the stage default.' },
      { name: 'type', label: 'Type', type: 'picklist', options: ['New Business', 'Existing Business', 'Renewal', 'Upsell'], section: 'Opportunity Information' },
      { name: 'lead_source', label: 'Lead Source', type: 'picklist', options: LEAD_SOURCES, section: 'Opportunity Information' },
      { name: 'next_step', label: 'Next Step', type: 'text', section: 'Opportunity Information', full: true },
      { name: 'description', label: 'Description', type: 'textarea', section: 'Description', full: true },
    ],
    path: { field: 'stage', steps: OPPORTUNITY_STAGES.slice(0, 6), wonStep: 'Closed Won', lostSteps: ['Closed Lost'] },
    relatedLists: [
      { object: 'opportunity_products', foreignKey: 'opportunity_id', title: 'Products', columns: ['product_id', 'quantity', 'unit_price', 'discount', 'total_price'] },
    ],
    activityKey: 'opportunity_id',
    inNav: true,
  },

  products: {
    key: 'products',
    table: 'products',
    label: 'Product',
    plural: 'Products',
    color: '#c23c7a',
    glyph: 'Pr',
    nameField: 'name',
    listColumns: ['name', 'product_code', 'family', 'list_price', 'is_active'],
    highlights: ['product_code', 'family', 'list_price', 'is_active'],
    searchFields: ['name', 'product_code'],
    filterField: 'family',
    defaultSort: { field: 'name', ascending: true },
    sections: ['Product Information'],
    fields: [
      { name: 'name', label: 'Product Name', type: 'text', required: true, section: 'Product Information' },
      { name: 'product_code', label: 'Product Code', type: 'text', section: 'Product Information' },
      { name: 'family', label: 'Product Family', type: 'picklist', options: ['Software', 'Hardware', 'Services', 'Support', 'Training'], section: 'Product Information' },
      { name: 'list_price', label: 'List Price', type: 'currency', required: true, defaultValue: 0, section: 'Product Information' },
      { name: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true, section: 'Product Information' },
      { ...owner, section: 'Product Information' },
      { name: 'description', label: 'Description', type: 'textarea', section: 'Product Information', full: true },
    ],
    relatedLists: [
      { object: 'opportunity_products', foreignKey: 'product_id', title: 'Opportunities', columns: ['opportunity_id', 'quantity', 'total_price'] },
    ],
    inNav: true,
  },

  opportunity_products: {
    key: 'opportunity_products',
    table: 'opportunity_products',
    label: 'Opportunity Product',
    plural: 'Opportunity Products',
    color: '#c23c7a',
    glyph: 'Li',
    nameField: 'id',
    titleFrom: 'product_id',
    listColumns: ['product_id', 'opportunity_id', 'quantity', 'unit_price', 'total_price'],
    highlights: ['opportunity_id', 'quantity', 'unit_price', 'total_price'],
    searchFields: ['description'],
    defaultSort: { field: 'created_at', ascending: false },
    sections: ['Line Item'],
    fields: [
      { name: 'opportunity_id', label: 'Opportunity', type: 'lookup', lookup: 'opportunities', required: true, section: 'Line Item' },
      { name: 'product_id', label: 'Product', type: 'lookup', lookup: 'products', required: true, section: 'Line Item' },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: 1, section: 'Line Item' },
      { name: 'unit_price', label: 'Sales Price', type: 'currency', section: 'Line Item', help: "Leave blank to use the product's list price." },
      { name: 'discount', label: 'Discount (%)', type: 'percent', defaultValue: 0, section: 'Line Item' },
      { name: 'total_price', label: 'Total Price', type: 'currency', readOnly: true, section: 'Line Item' },
      { name: 'description', label: 'Line Description', type: 'text', section: 'Line Item', full: true },
    ],
    inNav: false,
  },

  cases: {
    key: 'cases',
    table: 'cases',
    label: 'Case',
    plural: 'Cases',
    color: '#d6455d',
    glyph: 'Ca',
    nameField: 'subject',
    listColumns: ['case_number', 'subject', 'account_id', 'status', 'priority', 'origin', 'owner_id'],
    highlights: ['case_number', 'account_id', 'contact_id', 'priority', 'owner_id'],
    searchFields: ['subject', 'case_number', 'description'],
    filterField: 'status',
    defaultSort: { field: 'created_at', ascending: false },
    sections: ['Case Information', 'Description'],
    fields: [
      { name: 'case_number', label: 'Case Number', type: 'text', readOnly: true, section: 'Case Information' },
      { ...owner, section: 'Case Information' },
      { name: 'subject', label: 'Subject', type: 'text', required: true, section: 'Case Information', full: true },
      { name: 'account_id', label: 'Account', type: 'lookup', lookup: 'accounts', section: 'Case Information' },
      { name: 'contact_id', label: 'Contact', type: 'lookup', lookup: 'contacts', section: 'Case Information' },
      { name: 'status', label: 'Status', type: 'picklist', required: true, defaultValue: 'New', options: ['New', 'Working', 'Escalated', 'On Hold', 'Closed'], section: 'Case Information' },
      { name: 'priority', label: 'Priority', type: 'picklist', required: true, defaultValue: 'Medium', options: ['Low', 'Medium', 'High', 'Critical'], section: 'Case Information' },
      { name: 'origin', label: 'Case Origin', type: 'picklist', options: ['Email', 'Phone', 'Web', 'Chat', 'Other'], section: 'Case Information' },
      { name: 'type', label: 'Type', type: 'picklist', options: ['Question', 'Problem', 'Feature Request', 'Other'], section: 'Case Information' },
      { name: 'closed_at', label: 'Closed', type: 'datetime', readOnly: true, section: 'Case Information' },
      { name: 'description', label: 'Description', type: 'textarea', section: 'Description', full: true },
      { name: 'resolution', label: 'Resolution', type: 'textarea', section: 'Description', full: true },
    ],
    path: { field: 'status', steps: ['New', 'Working', 'Escalated', 'On Hold', 'Closed'], wonStep: 'Closed' },
    activityKey: 'case_id',
    inNav: true,
  },

  activities: {
    key: 'activities',
    table: 'activities',
    label: 'Activity',
    plural: 'Activities',
    color: '#1f9d74',
    glyph: 'Ta',
    nameField: 'subject',
    listColumns: ['subject', 'type', 'status', 'priority', 'due_date', 'account_id', 'owner_id'],
    highlights: ['type', 'status', 'priority', 'due_date', 'owner_id'],
    searchFields: ['subject', 'description'],
    filterField: 'status',
    defaultSort: { field: 'due_date', ascending: true },
    sections: ['Activity Information', 'Related To', 'Description'],
    fields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true, section: 'Activity Information', full: true },
      { name: 'type', label: 'Type', type: 'picklist', required: true, defaultValue: 'Task', options: ['Task', 'Call', 'Email', 'Meeting', 'Note'], section: 'Activity Information' },
      { name: 'status', label: 'Status', type: 'picklist', required: true, defaultValue: 'Not Started', options: ['Not Started', 'In Progress', 'Waiting', 'Completed', 'Deferred'], section: 'Activity Information' },
      { name: 'priority', label: 'Priority', type: 'picklist', required: true, defaultValue: 'Normal', options: ['Low', 'Normal', 'High'], section: 'Activity Information' },
      { name: 'due_date', label: 'Due Date', type: 'date', section: 'Activity Information' },
      { ...owner, label: 'Assigned To', section: 'Activity Information' },
      { name: 'completed_at', label: 'Completed', type: 'datetime', readOnly: true, section: 'Activity Information' },
      { name: 'account_id', label: 'Account', type: 'lookup', lookup: 'accounts', section: 'Related To' },
      { name: 'contact_id', label: 'Contact', type: 'lookup', lookup: 'contacts', section: 'Related To' },
      { name: 'lead_id', label: 'Lead', type: 'lookup', lookup: 'leads', section: 'Related To' },
      { name: 'opportunity_id', label: 'Opportunity', type: 'lookup', lookup: 'opportunities', section: 'Related To' },
      { name: 'case_id', label: 'Case', type: 'lookup', lookup: 'cases', section: 'Related To' },
      { name: 'description', label: 'Comments', type: 'textarea', section: 'Description', full: true },
    ],
    inNav: true,
  },
};

export const NAV_OBJECTS: ObjectKey[] = ['accounts', 'contacts', 'leads', 'opportunities', 'cases', 'products', 'activities'];

export function getObject(key: string): ObjectDef | null {
  return Object.prototype.hasOwnProperty.call(OBJECTS, key) ? OBJECTS[key as ObjectKey] : null;
}

export function lookupMeta(target: LookupTarget): { table: string; nameField: string; linkable: boolean } {
  if (target === 'profiles') return { table: 'profiles', nameField: 'full_name', linkable: false };
  const def = OBJECTS[target];
  return { table: def.table, nameField: def.nameField === 'id' ? 'id' : def.nameField, linkable: true };
}

export function getField(def: ObjectDef, name: string): FieldDef | undefined {
  if (name === 'owner_id' && !def.fields.some((f) => f.name === 'owner_id')) return owner;
  return def.fields.find((f) => f.name === name);
}

export function editableFields(def: ObjectDef): FieldDef[] {
  return def.fields.filter((f) => !f.readOnly);
}

/** PostgREST select string with every lookup embedded as ref_<column>. */
export function selectFor(def: ObjectDef, only?: string[]): string {
  const lookups = def.fields.filter(
    (f) => f.type === 'lookup' && f.lookup && (!only || only.includes(f.name)),
  );
  const parts = ['*'];
  for (const f of lookups) {
    const meta = lookupMeta(f.lookup!);
    parts.push(`ref_${f.name}:${meta.table}!${f.name}(id,${meta.nameField})`);
  }
  if (!only) parts.push('ref_created_by:profiles!created_by(id,full_name)');
  return parts.join(',');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export function recordTitle(def: ObjectDef, rec: Row): string {
  if (def.titleFrom) {
    const f = getField(def, def.titleFrom);
    const ref = rec[`ref_${def.titleFrom}`];
    if (f?.lookup && ref) return String(ref[lookupMeta(f.lookup).nameField] ?? '');
  }
  return String(rec[def.nameField] ?? '');
}

export const SORTABLE_SYSTEM_FIELDS = ['created_at', 'updated_at', 'last_name'];

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
