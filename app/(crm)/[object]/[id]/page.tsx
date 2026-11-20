import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActivityComposer } from '@/components/ActivityComposer';
import { DeleteButton } from '@/components/DeleteButton';
import { FieldValue } from '@/components/FieldValue';
import { ObjectIcon } from '@/components/ObjectIcon';
import { PathBar } from '@/components/PathBar';
import { completeActivity, deleteRecord } from '@/lib/actions';
import { formatDate, formatDateTime } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import {
  getField,
  getObject,
  OBJECTS,
  recordTitle,
  selectFor,
  UUID_RE,
  type ObjectDef,
  type Row,
} from '@/lib/objects';

type Params = Promise<{ object: string; id: string }>;

async function loadRecord(objectKey: string, id: string) {
  const def = getObject(objectKey);
  if (!def || !UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from(def.table).select(selectFor(def)).eq('id', id).maybeSingle();
  return data ? { def, record: data as unknown as Row } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { object, id } = await params;
  const loaded = await loadRecord(object, id);
  return { title: loaded ? recordTitle(loaded.def, loaded.record) || loaded.def.label : 'Not found' };
}

export default async function RecordPage({ params }: { params: Params }) {
  const { object, id } = await params;
  const loaded = await loadRecord(object, id);
  if (!loaded) notFound();
  const { def, record } = loaded;
  const supabase = await createClient();
  const title = recordTitle(def, record) || `Untitled ${def.label.toLowerCase()}`;
  const isConvertedLead = def.key === 'leads' && Boolean(record.converted_at);

  const [related, activities] = await Promise.all([
    Promise.all(
      (def.relatedLists ?? []).map(async (rl) => {
        const rdef = OBJECTS[rl.object];
        const { data, count } = await supabase
          .from(rdef.table)
          .select(selectFor(rdef, rl.columns), { count: 'exact' })
          .eq(rl.foreignKey, id)
          .order('created_at', { ascending: false })
          .limit(10);
        return { rl, rdef, rows: (data ?? []) as unknown as Row[], count: count ?? 0 };
      }),
    ),
    def.activityKey
      ? supabase
          .from('activities')
          .select(selectFor(OBJECTS.activities, ['owner_id']))
          .eq(def.activityKey, id)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(50)
          .then((r) => (r.data ?? []) as unknown as Row[])
      : Promise.resolve([] as Row[]),
  ]);

  const openActivities = activities.filter((a) => a.status !== 'Completed');
  const pastActivities = activities.filter((a) => a.status === 'Completed').reverse();
  const activityLinks: Record<string, string> = {};
  if (def.activityKey) activityLinks[def.activityKey] = id;
  if (def.key !== 'accounts' && record.account_id) activityLinks.account_id = String(record.account_id);
  if (def.key === 'opportunities' && record.contact_id) activityLinks.contact_id = String(record.contact_id);
  const here = `/${def.key}/${id}`;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 px-4 py-4">
          <ObjectIcon object={def.key} size="lg" />
          <div className="mr-auto min-w-0">
            <p className="text-xs text-muted">
              {def.inNav ? (
                <Link href={`/${def.key}`} className="hover:underline">
                  {def.label}
                </Link>
              ) : (
                def.label
              )}
            </p>
            <h1 className="truncate text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {def.key === 'leads' && !isConvertedLead && (
              <Link href={`/leads/${id}/convert`} className="btn-primary">
                Convert
              </Link>
            )}
            {!isConvertedLead && (
              <Link href={`/${def.key}/${id}/edit`} className="btn">
                Edit
              </Link>
            )}
            <DeleteButton action={deleteRecord.bind(null, def.key, id)} label={def.label} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 border-t border-line px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
          {def.highlights.map((h) => {
            const f = getField(def, h);
            if (!f) return null;
            return (
              <div key={h} className="min-w-0">
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd className="mt-0.5 truncate text-sm">
                  <FieldValue field={f} record={record} />
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {def.path && <PathBar def={def} record={record} />}

      {isConvertedLead && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="font-semibold">Converted {formatDate(record.converted_at)}</span>
          {(['converted_account_id', 'converted_contact_id', 'converted_opportunity_id'] as const).map((k) => {
            const f = getField(def, k)!;
            return record[k] ? (
              <span key={k}>
                {f.label.replace('Converted ', '')}: <FieldValue field={f} record={record} />
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DetailsCard def={def} record={record} />

          {related.map(({ rl, rdef, rows, count }) => (
            <section key={`${rl.object}-${rl.foreignKey}`} className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <ObjectIcon object={rl.object} size="sm" />
                  <h2 className="text-sm font-semibold">
                    {rl.title ?? rdef.plural} ({count})
                  </h2>
                </div>
                <Link href={`/${rl.object}/new?${rl.foreignKey}=${id}&returnTo=${encodeURIComponent(here)}`} className="btn text-xs">
                  New
                </Link>
              </div>
              {rows.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">No records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line">
                    <thead>
                      <tr>
                        {rl.columns.map((c) => (
                          <th key={c} className="th">
                            {getField(rdef, c)?.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows.map((r) => (
                        <tr key={r.id}>
                          {rl.columns.map((c, i) => {
                            const f = getField(rdef, c);
                            if (!f) return null;
                            return (
                              <td key={c} className="td max-w-xs truncate">
                                {i === 0 ? (
                                  <Link href={`/${rl.object}/${r.id}`} className="link font-medium">
                                    {f.type === 'lookup' ? recordTitle(rdef, r) || 'Open' : String(r[c] ?? '') || 'Untitled'}
                                  </Link>
                                ) : (
                                  <FieldValue field={f} record={r} />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>

        <aside className="space-y-4">
          {def.activityKey && (
            <section className="card">
              <div className="card-header">
                <h2 className="text-sm font-semibold">Activity</h2>
              </div>
              <ActivityComposer links={activityLinks} revalidate={here} />
              <div className="border-t border-line">
                <h3 className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">Upcoming &amp; overdue</h3>
                {openActivities.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted">Nothing open.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {openActivities.map((a) => (
                      <ActivityItem key={a.id} a={a} revalidate={here} />
                    ))}
                  </ul>
                )}
                <h3 className="border-t border-line px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">Past activity</h3>
                {pastActivities.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted">No past activity.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {pastActivities.map((a) => (
                      <ActivityItem key={a.id} a={a} revalidate={here} />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold">System information</h2>
            </div>
            <dl className="space-y-3 px-4 py-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Created by</dt>
                <dd>
                  {record.ref_created_by?.full_name ?? 'System'} · {formatDateTime(record.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Last modified</dt>
                <dd>{formatDateTime(record.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailsCard({ def, record }: { def: ObjectDef; record: Row }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="text-sm font-semibold">Details</h2>
      </div>
      {def.sections.map((section) => {
        const fields = def.fields.filter((f) => (f.section ?? def.sections[0]) === section);
        if (!fields.length) return null;
        if (section === 'Conversion' && !record.converted_at) return null;
        return (
          <div key={section} className="border-b border-line px-4 py-4 last:border-b-0">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{section}</h3>
            <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={`border-b border-dotted border-line pb-2 ${f.full ? 'md:col-span-2' : ''}`}>
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd className="mt-0.5 min-h-5 text-sm">
                    <FieldValue field={f} record={record} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </section>
  );
}

const ACTIVITY_COLORS: Record<string, string> = {
  Task: 'bg-emerald-600',
  Call: 'bg-sky-600',
  Email: 'bg-slate-600',
  Meeting: 'bg-fuchsia-600',
  Note: 'bg-amber-500',
};

function ActivityItem({ a, revalidate }: { a: Row; revalidate: string }) {
  const overdue = a.status !== 'Completed' && a.due_date && String(a.due_date) < new Date().toISOString().slice(0, 10);
  return (
    <li className="flex gap-3 px-4 py-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ACTIVITY_COLORS[a.type] ?? 'bg-slate-500'}`}>
        {String(a.type).slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/activities/${a.id}`} className="link block truncate text-sm font-medium">
          {a.subject}
        </Link>
        <p className="text-xs text-muted">
          {a.type}
          {a.due_date && (
            <>
              {' · '}
              <span className={overdue ? 'font-medium text-red-600' : undefined}>{formatDate(a.due_date)}</span>
            </>
          )}
          {a.ref_owner_id?.full_name && <> · {a.ref_owner_id.full_name}</>}
        </p>
        {a.description && <p className="mt-1 line-clamp-2 text-xs text-ink/80">{a.description}</p>}
      </div>
      {a.status !== 'Completed' && (
        <form action={completeActivity.bind(null, a.id as string, revalidate)}>
          <button className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-emerald-500 hover:text-emerald-700" title="Mark complete">
            ✓ Done
          </button>
        </form>
      )}
    </li>
  );
}
