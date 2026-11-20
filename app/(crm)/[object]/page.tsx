import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FieldValue } from '@/components/FieldValue';
import { ObjectIcon } from '@/components/ObjectIcon';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getField, getObject, recordTitle, selectFor, SORTABLE_SYSTEM_FIELDS, type Row } from '@/lib/objects';

const PAGE_SIZE = 25;

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ object: string }> }): Promise<Metadata> {
  const def = getObject((await params).object);
  return { title: def?.plural ?? 'Not found' };
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
}

export default async function ListPage({ params, searchParams }: { params: Promise<{ object: string }>; searchParams: Promise<SP> }) {
  const def = getObject((await params).object);
  if (!def || !def.inNav) notFound();
  const sp = await searchParams;

  const q = one(sp.q).replace(/[%*,()"\\]/g, ' ').trim().slice(0, 100);
  const scope = one(sp.scope) === 'mine' ? 'mine' : 'all';
  const filterField = def.filterField ? getField(def, def.filterField) : undefined;
  const filter = filterField?.options?.includes(one(sp.f)) ? one(sp.f) : '';
  const page = Math.max(1, Number.parseInt(one(sp.page) || '1', 10) || 1);

  const sortable = new Set([...def.listColumns, ...SORTABLE_SYSTEM_FIELDS]);
  const sortParam = one(sp.sort);
  const sort = sortable.has(sortParam) && getField(def, sortParam)?.type !== 'lookup' ? sortParam : def.defaultSort.field;
  const ascending = sortParam ? one(sp.dir) !== 'desc' : def.defaultSort.ascending;

  const user = await getCurrentUser();
  const supabase = await createClient();
  let query = supabase
    .from(def.table)
    .select(selectFor(def, def.listColumns), { count: 'exact' })
    .order(sort, { ascending, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) query = query.or(def.searchFields.map((f) => `${f}.ilike."%${q}%"`).join(','));
  if (scope === 'mine' && user) query = query.eq('owner_id', user.id);
  if (filter && def.filterField) query = query.eq(def.filterField, filter);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (overrides: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { q, scope: scope === 'mine' ? 'mine' : '', f: filter, sort: sortParam, dir: one(sp.dir), page: '' };
    for (const [k, v] of Object.entries({ ...base, ...overrides })) if (v !== null && v !== '' && v !== undefined) p.set(k, String(v));
    const s = p.toString();
    return `/${def.key}${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <ObjectIcon object={def.key} size="lg" />
          <div className="mr-auto">
            <p className="text-xs text-muted">{def.plural}</p>
            <h1 className="text-lg font-semibold">{scope === 'mine' ? `My ${def.plural}` : `All ${def.plural}`}</h1>
          </div>
          <form className="flex items-center gap-2" action={`/${def.key}`}>
            {scope === 'mine' && <input type="hidden" name="scope" value="mine" />}
            {filter && <input type="hidden" name="f" value={filter} />}
            <input name="q" defaultValue={q} placeholder={`Search ${def.plural.toLowerCase()}…`} className="input w-56" />
          </form>
          <Link href={`/${def.key}/new`} className="btn-primary">
            New
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2 text-xs">
          <Link href={href({ scope: '', page: null })} className={pill(scope === 'all')}>
            All
          </Link>
          <Link href={href({ scope: 'mine', page: null })} className={pill(scope === 'mine')}>
            Owned by me
          </Link>
          {filterField?.options && (
            <>
              <span className="mx-1 h-4 w-px bg-line" />
              <Link href={href({ f: null, page: null })} className={pill(!filter)}>
                Any {filterField.label.toLowerCase()}
              </Link>
              {filterField.options.map((o) => (
                <Link key={o} href={href({ f: o, page: null })} className={pill(filter === o)}>
                  {o}
                </Link>
              ))}
            </>
          )}
          <span className="ml-auto text-muted">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {error ? (
          <p className="p-6 text-sm text-red-700">Couldn&apos;t load records: {error.message}</p>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No {def.plural.toLowerCase()} found</p>
            <p className="mt-1 text-sm text-muted">Try a different search or filter, or create a new record.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-slate-50">
              <tr>
                {def.listColumns.map((c) => {
                  const f = getField(def, c);
                  if (!f) return null;
                  const canSort = f.type !== 'lookup';
                  const active = sort === c;
                  return (
                    <th key={c} className="th">
                      {canSort ? (
                        <Link href={href({ sort: c, dir: active && ascending ? 'desc' : 'asc', page: null })} className="inline-flex items-center gap-1 hover:text-ink">
                          {f.label}
                          {active && <span aria-hidden>{ascending ? '▲' : '▼'}</span>}
                        </Link>
                      ) : (
                        f.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40">
                  {def.listColumns.map((c, i) => {
                    const f = getField(def, c);
                    if (!f) return null;
                    return (
                      <td key={c} className="td max-w-xs truncate">
                        {i === 0 ? (
                          <Link href={`/${def.key}/${r.id}`} className="link font-medium">
                            {f.type === 'lookup' ? recordTitle(def, r) || 'Open' : String(r[c] ?? '') || 'Untitled'}
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
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          {page > 1 && (
            <Link href={href({ page: page - 1 })} className="btn">
              Previous
            </Link>
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href({ page: page + 1 })} className="btn">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function pill(active: boolean) {
  return `rounded-full px-2.5 py-1 font-medium transition ${
    active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-muted hover:bg-slate-200 hover:text-ink'
  }`;
}
