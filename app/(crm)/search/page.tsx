import type { Metadata } from 'next';
import Link from 'next/link';
import { FieldValue } from '@/components/FieldValue';
import { ObjectIcon } from '@/components/ObjectIcon';
import { createClient } from '@/lib/supabase/server';
import { getField, OBJECTS, recordTitle, selectFor, type ObjectKey, type Row } from '@/lib/objects';

export const metadata: Metadata = { title: 'Search' };

const SEARCHABLE: ObjectKey[] = ['accounts', 'contacts', 'leads', 'opportunities', 'cases', 'products', 'activities'];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const raw = (await searchParams).q ?? '';
  const q = String(raw).replace(/[%*,()"\\]/g, ' ').trim().slice(0, 100);
  const supabase = await createClient();

  const results = q
    ? await Promise.all(
        SEARCHABLE.map(async (key) => {
          const def = OBJECTS[key];
          const cols = def.listColumns.slice(0, 4);
          const { data } = await supabase
            .from(def.table)
            .select(selectFor(def, cols))
            .or(def.searchFields.map((f) => `${f}.ilike."%${q}%"`).join(','))
            .limit(10);
          return { def, cols, rows: (data ?? []) as unknown as Row[] };
        }),
      )
    : [];
  const total = results.reduce((s, r) => s + r.rows.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Search results</h1>
        <p className="text-sm text-muted">
          {q ? `${total} result${total === 1 ? '' : 's'} for “${q}”` : 'Type in the search bar above to search every object.'}
        </p>
      </div>
      {results
        .filter((r) => r.rows.length)
        .map(({ def, cols, rows }) => (
          <section key={def.key} className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <ObjectIcon object={def.key} size="sm" />
                <h2 className="text-sm font-semibold">
                  {def.plural} ({rows.length})
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line">
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c} className="th">
                        {getField(def, c)?.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      {cols.map((c, i) => (
                        <td key={c} className="td max-w-xs truncate">
                          {i === 0 ? (
                            <Link href={`/${def.key}/${r.id}`} className="link font-medium">
                              {recordTitle(def, r) || String(r[c] ?? 'Open')}
                            </Link>
                          ) : (
                            <FieldValue field={getField(def, c)!} record={r} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
    </div>
  );
}
