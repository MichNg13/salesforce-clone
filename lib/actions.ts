'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { editableFields, getObject, UUID_RE, type FieldDef, type Row } from '@/lib/objects';

export interface ActionState {
  error?: string;
  ok?: boolean;
}

function parseField(f: FieldDef, raw: FormDataEntryValue | null): { value: unknown; error?: string } {
  if (f.type === 'checkbox') return { value: raw === 'on' || raw === 'true' };
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (s === '') return { value: null };

  switch (f.type) {
    case 'number':
    case 'currency':
    case 'percent': {
      const n = Number(s.replace(/[,\s$]/g, ''));
      if (!Number.isFinite(n)) return { value: null, error: `${f.label} must be a number.` };
      if (f.type === 'percent' && (n < 0 || n > 100)) return { value: null, error: `${f.label} must be between 0 and 100.` };
      return { value: n };
    }
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { value: null, error: `${f.label} must be a valid date.` };
      return { value: s };
    case 'lookup':
      if (!UUID_RE.test(s)) return { value: null, error: `${f.label} is not a valid record.` };
      return { value: s };
    case 'picklist':
      if (f.options && !f.options.includes(s)) return { value: null, error: `${f.label} has an invalid value.` };
      return { value: s };
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { value: null, error: `${f.label} must be a valid email.` };
      return { value: s };
    default:
      return { value: s.slice(0, 10000) };
  }
}

/** Create (id = null) or update a record of any object from a form. */
export async function saveRecord(
  objectKey: string,
  id: string | null,
  returnTo: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const def = getObject(objectKey);
  if (!def) return { error: 'Unknown object.' };
  if (id && !UUID_RE.test(id)) return { error: 'Invalid record id.' };

  const payload: Row = {};
  for (const f of editableFields(def)) {
    const { value, error } = parseField(f, formData.get(f.name));
    if (error) return { error };
    if (f.required && (value === null || value === '')) return { error: `${f.label} is required.` };
    // On create, leave blanks out so database defaults apply.
    if (!id && value === null) continue;
    payload[f.name] = value;
  }

  const supabase = await createClient();
  let savedId = id;

  if (id) {
    const { error } = await supabase.from(def.table).update(payload).eq('id', id);
    if (error) return { error: friendlyError(error.message) };
  } else {
    const { data, error } = await supabase.from(def.table).insert(payload).select('id').single();
    if (error) return { error: friendlyError(error.message) };
    savedId = data.id as string;
  }

  revalidatePath('/', 'layout');
  redirect(safeReturn(returnTo) ?? `/${def.key}/${savedId}`);
}

export async function deleteRecord(objectKey: string, id: string, _prev: ActionState): Promise<ActionState> {
  const def = getObject(objectKey);
  if (!def || !UUID_RE.test(id)) return { error: 'Invalid record.' };

  const supabase = await createClient();

  // Line items have no list view of their own — go back to the parent opportunity.
  let after = `/${def.key}`;
  if (def.key === 'opportunity_products') {
    const { data } = await supabase.from(def.table).select('opportunity_id').eq('id', id).maybeSingle();
    after = data?.opportunity_id ? `/opportunities/${data.opportunity_id}` : '/opportunities';
  }

  const { error, count } = await supabase.from(def.table).delete({ count: 'exact' }).eq('id', id);
  if (error) return { error: friendlyError(error.message) };
  if (!count) return { error: 'Only the record owner or an admin can delete this record.' };

  revalidatePath('/', 'layout');
  redirect(after);
}

/** Used by the stage/status path on record pages. */
export async function setPathValue(objectKey: string, id: string, value: string): Promise<void> {
  const def = getObject(objectKey);
  if (!def?.path || !UUID_RE.test(id)) return;
  const field = def.fields.find((f) => f.name === def.path!.field);
  if (!field?.options?.includes(value)) return;

  const supabase = await createClient();
  await supabase.from(def.table).update({ [field.name]: value }).eq('id', id);
  revalidatePath(`/${def.key}/${id}`);
}

const ACTIVITY_LINKS = ['account_id', 'contact_id', 'lead_id', 'opportunity_id', 'case_id'] as const;
const ACTIVITY_TYPES = ['Task', 'Call', 'Email', 'Meeting', 'Note'];

export async function logActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const subject = String(formData.get('subject') ?? '').trim();
  const type = String(formData.get('type') ?? 'Task');
  const due = String(formData.get('due_date') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const revalidate = String(formData.get('revalidate') ?? '');

  if (!subject) return { error: 'Subject is required.' };
  if (!ACTIVITY_TYPES.includes(type)) return { error: 'Invalid activity type.' };
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) return { error: 'Invalid due date.' };

  const row: Row = {
    subject: subject.slice(0, 500),
    type,
    status: type === 'Task' ? 'Not Started' : 'Completed',
    due_date: due || null,
    description: description || null,
  };
  for (const k of ACTIVITY_LINKS) {
    const v = String(formData.get(k) ?? '');
    if (v && UUID_RE.test(v)) row[k] = v;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('activities').insert(row);
  if (error) return { error: friendlyError(error.message) };

  if (revalidate.startsWith('/')) revalidatePath(revalidate);
  revalidatePath('/');
  return { ok: true };
}

export async function completeActivity(id: string, revalidate: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const supabase = await createClient();
  await supabase.from('activities').update({ status: 'Completed' }).eq('id', id);
  if (revalidate.startsWith('/')) revalidatePath(revalidate);
  revalidatePath('/');
}

export async function convertLead(leadId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!UUID_RE.test(leadId)) return { error: 'Invalid lead.' };
  const accountMode = formData.get('account_mode');
  const existing = String(formData.get('existing_account_id') ?? '');
  const createOpp = formData.get('create_opportunity') === 'on';
  const oppName = String(formData.get('opportunity_name') ?? '').trim();

  if (accountMode === 'existing' && !UUID_RE.test(existing)) {
    return { error: 'Choose an existing account.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('convert_lead', {
    p_lead_id: leadId,
    p_account_id: accountMode === 'existing' ? existing : null,
    p_create_opportunity: createOpp,
    p_opportunity_name: oppName || null,
  });
  if (error) return { error: friendlyError(error.message) };

  const result = data as { account_id: string; opportunity_id: string | null };
  revalidatePath('/', 'layout');
  redirect(result.opportunity_id ? `/opportunities/${result.opportunity_id}` : `/accounts/${result.account_id}`);
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const full_name = String(formData.get('full_name') ?? '').trim().slice(0, 200);
  const title = String(formData.get('title') ?? '').trim().slice(0, 200);
  if (!full_name) return { error: 'Name is required.' };

  const { error } = await supabase.from('profiles').update({ full_name, title: title || null }).eq('id', user.id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  if (!UUID_RE.test(userId) || !['admin', 'user'].includes(role)) return;
  const supabase = await createClient();
  // RLS + the guard_profile_role trigger reject this unless the caller is an admin.
  await supabase.from('profiles').update({ role }).eq('id', userId);
  revalidatePath('/settings');
}

function safeReturn(path: string | null): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

function friendlyError(message: string): string {
  if (message.includes('violates foreign key constraint') && message.includes('product')) {
    return 'This product is used on opportunities and cannot be deleted.';
  }
  if (message.includes('violates check constraint')) return 'One of the values is not allowed.';
  if (message.includes('duplicate key')) return 'A record with that value already exists.';
  if (message.includes('row-level security')) return "You don't have permission to do that.";
  return message;
}
