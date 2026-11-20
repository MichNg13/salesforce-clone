import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ObjectIcon } from '@/components/ObjectIcon';
import { RecordForm } from '@/components/RecordForm';
import { saveRecord } from '@/lib/actions';
import { todayISO } from '@/lib/format';
import { buildFormFields } from '@/lib/form-data';
import { getCurrentUser } from '@/lib/supabase/server';
import { editableFields, getObject, UUID_RE } from '@/lib/objects';

export async function generateMetadata({ params }: { params: Promise<{ object: string }> }): Promise<Metadata> {
  const def = getObject((await params).object);
  return { title: def ? `New ${def.label}` : 'Not found' };
}

export default async function NewRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ object: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const def = getObject((await params).object);
  if (!def) notFound();
  const sp = await searchParams;
  const user = await getCurrentUser();

  const values: Record<string, string | number | boolean | null> = {};
  for (const f of editableFields(def)) {
    if (f.defaultValue !== undefined) values[f.name] = f.defaultValue;
    const pre = sp[f.name];
    if (typeof pre === 'string' && pre) {
      if (f.type === 'lookup' && !UUID_RE.test(pre)) continue;
      values[f.name] = pre.slice(0, 500);
    }
  }
  if (def.fields.some((f) => f.name === 'owner_id') && !values.owner_id && user) values.owner_id = user.id;
  if (def.key === 'opportunities' && !values.close_date) values.close_date = todayISO(30);

  const returnTo = typeof sp.returnTo === 'string' && sp.returnTo.startsWith('/') && !sp.returnTo.startsWith('//') ? sp.returnTo : null;
  const fields = await buildFormFields(def);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <ObjectIcon object={def.key} size="lg" />
        <h1 className="text-xl font-semibold">New {def.label}</h1>
      </div>
      <RecordForm
        fields={fields}
        sections={def.sections}
        values={values}
        action={saveRecord.bind(null, def.key, null, returnTo)}
        cancelHref={returnTo ?? `/${def.key}`}
        submitLabel={`Save ${def.label}`}
      />
    </div>
  );
}
