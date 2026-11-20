import 'server-only';
import type { FormFieldProps } from '@/components/RecordForm';
import { createClient } from '@/lib/supabase/server';
import { editableFields, lookupMeta, type ObjectDef } from '@/lib/objects';

/** Build serialisable form field props, loading lookup options from the database. */
export async function buildFormFields(def: ObjectDef): Promise<FormFieldProps[]> {
  const supabase = await createClient();
  const fields = editableFields(def);

  const lookupOptions = new Map<string, { value: string; label: string }[]>();
  await Promise.all(
    [...new Set(fields.filter((f) => f.type === 'lookup' && f.lookup).map((f) => f.lookup!))].map(async (target) => {
      const meta = lookupMeta(target);
      const cols = target === 'profiles' ? 'id, full_name, email' : `id, ${meta.nameField}`;
      let query = supabase.from(meta.table).select(cols).order(meta.nameField, { ascending: true }).limit(1000);
      if (target === 'products') query = query.eq('is_active', true);
      const { data } = await query;
      const rows = (data ?? []) as unknown as Record<string, string | null>[];
      lookupOptions.set(
        target,
        rows.map((r) => ({
          value: String(r.id),
          label: String(r[meta.nameField] ?? r.email ?? r.id),
        })),
      );
    }),
  );

  return fields.map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    section: f.section ?? def.sections[0],
    required: f.required,
    full: f.full,
    help: f.help,
    options:
      f.type === 'lookup' && f.lookup
        ? lookupOptions.get(f.lookup) ?? []
        : f.options?.map((o) => ({ value: o, label: o })),
  }));
}
