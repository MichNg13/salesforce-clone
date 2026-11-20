import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ObjectIcon } from '@/components/ObjectIcon';
import { RecordForm } from '@/components/RecordForm';
import { saveRecord } from '@/lib/actions';
import { buildFormFields } from '@/lib/form-data';
import { createClient } from '@/lib/supabase/server';
import { editableFields, getObject, recordTitle, selectFor, UUID_RE, type Row } from '@/lib/objects';

export const metadata: Metadata = { title: 'Edit' };

export default async function EditRecordPage({ params }: { params: Promise<{ object: string; id: string }> }) {
  const { object, id } = await params;
  const def = getObject(object);
  if (!def || !UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from(def.table).select(selectFor(def)).eq('id', id).maybeSingle();
  if (!data) notFound();
  const record = data as unknown as Row;
  if (def.key === 'leads' && record.converted_at) redirect(`/leads/${id}`);

  const values: Record<string, string | number | boolean | null> = {};
  for (const f of editableFields(def)) values[f.name] = record[f.name] ?? null;
  const fields = await buildFormFields(def);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <ObjectIcon object={def.key} size="lg" />
        <div>
          <p className="text-xs text-muted">Edit {def.label}</p>
          <h1 className="text-xl font-semibold">{recordTitle(def, record) || def.label}</h1>
        </div>
      </div>
      <RecordForm
        fields={fields}
        sections={def.sections}
        values={values}
        action={saveRecord.bind(null, def.key, id, null)}
        cancelHref={`/${def.key}/${id}`}
      />
    </div>
  );
}
