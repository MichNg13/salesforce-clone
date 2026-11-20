import Link from 'next/link';
import { FieldValue } from '@/components/FieldValue';
import { ObjectIcon } from '@/components/ObjectIcon';
import { completeActivity } from '@/lib/actions';
import { formatCompactCurrency, formatCurrency, formatDate } from '@/lib/format';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getField, OBJECTS, OPPORTUNITY_STAGES, selectFor, type Row } from '@/lib/objects';

export default async function HomePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const now = new Date();
  const qStart = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1)).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const [pipeline, closingSoon, tasks, openLeads, openCases, wonQuarter, recentCases] = await Promise.all([
    supabase.from('pipeline_by_stage').select('*'),
    supabase
      .from('opportunities')
      .select(selectFor(OBJECTS.opportunities, ['account_id']))
      .eq('is_closed', false)
      .order('close_date', { ascending: true })
      .limit(6),
    supabase
      .from('activities')
      .select(selectFor(OBJECTS.activities, ['account_id', 'owner_id']))
      .neq('status', 'Completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(8),
    supabase.from('leads').select('id', { count: 'exact', head: true }).not('status', 'in', '("Converted","Unqualified")'),
    supabase.from('cases').select('id', { count: 'exact', head: true }).neq('status', 'Closed'),
    supabase.from('opportunities').select('amount').eq('is_won', true).gte('close_date', qStart),
    supabase
      .from('cases')
      .select(selectFor(OBJECTS.cases, ['account_id']))
      .neq('status', 'Closed')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stages = new Map<string, Row>(((pipeline.data ?? []) as Row[]).map((r) => [r.stage, r]));
  const openStages = OPPORTUNITY_STAGES.filter((s) => !s.startsWith('Closed'));
  const openTotal = openStages.reduce((sum, s) => sum + Number(stages.get(s)?.total_amount ?? 0), 0);
  const weighted = openStages.reduce((sum, s) => sum + Number(stages.get(s)?.weighted_amount ?? 0), 0);
  const openDeals = openStages.reduce((sum, s) => sum + Number(stages.get(s)?.deal_count ?? 0), 0);
  const won = ((wonQuarter.data ?? []) as Row[]).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const maxStage = Math.max(1, ...OPPORTUNITY_STAGES.map((s) => Number(stages.get(s)?.total_amount ?? 0)));

  const kpis = [
    { label: 'Open pipeline', value: formatCompactCurrency(openTotal), sub: `${openDeals} open deals`, href: '/opportunities' },
    { label: 'Weighted pipeline', value: formatCompactCurrency(weighted), sub: 'Amount × probability', href: '/opportunities' },
    { label: 'Won this quarter', value: formatCompactCurrency(won), sub: `Since ${formatDate(qStart)}`, href: '/opportunities?f=Closed+Won' },
    { label: 'Open leads', value: String(openLeads.count ?? 0), sub: 'Not converted', href: '/leads' },
    { label: 'Open cases', value: String(openCases.count ?? 0), sub: 'Awaiting resolution', href: '/cases' },
  ];

  const taskRows = (tasks.data ?? []) as unknown as Row[];
  const oppRows = (closingSoon.data ?? []) as unknown as Row[];
  const caseRows = (recentCases.data ?? []) as unknown as Row[];
  const firstName = user?.fullName.split(' ')[0];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Good to see you{firstName ? `, ${firstName}` : ''}.</h1>
        <p className="text-sm text-muted">Here&apos;s where your pipeline and service queue stand today.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card p-4 transition hover:border-brand-300">
            <p className="text-xs font-medium text-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
            <p className="mt-0.5 text-xs text-muted">{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="text-sm font-semibold">Pipeline by stage</h2>
            <span className="text-xs text-muted">Total amount</span>
          </div>
          <div className="space-y-2.5 p-4">
            {OPPORTUNITY_STAGES.map((s) => {
              const row = stages.get(s);
              const amount = Number(row?.total_amount ?? 0);
              const pct = (amount / maxStage) * 100;
              const color = s === 'Closed Won' ? 'bg-emerald-500' : s === 'Closed Lost' ? 'bg-slate-300' : 'bg-brand-500';
              return (
                <Link key={s} href={`/opportunities?f=${encodeURIComponent(s)}`} className="group grid grid-cols-[8.5rem_1fr_6rem] items-center gap-3 text-sm">
                  <span className="truncate text-muted group-hover:text-ink">{s}</span>
                  <span className="h-6 rounded bg-slate-100">
                    <span className={`block h-6 rounded ${color} transition-all`} style={{ width: `${Math.max(pct, amount ? 2 : 0)}%` }} />
                  </span>
                  <span className="text-right tabular-nums">
                    {formatCompactCurrency(amount)} <span className="text-xs text-muted">({row?.deal_count ?? 0})</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold">Open tasks</h2>
            <Link href="/activities/new?returnTo=%2F" className="btn text-xs">
              New
            </Link>
          </div>
          {taskRows.length === 0 ? (
            <p className="p-4 text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y divide-line">
              {taskRows.map((t) => {
                const overdue = t.due_date && String(t.due_date) < today;
                return (
                  <li key={t.id} className="flex items-start gap-3 px-4 py-2.5">
                    <form action={completeActivity.bind(null, t.id as string, '/')}>
                      <button className="mt-0.5 h-4 w-4 rounded border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50" title="Mark complete" aria-label={`Complete ${t.subject}`} />
                    </form>
                    <div className="min-w-0 flex-1">
                      <Link href={`/activities/${t.id}`} className="link block truncate text-sm">
                        {t.subject}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {t.type}
                        {t.due_date && (
                          <>
                            {' · '}
                            <span className={overdue ? 'font-medium text-red-600' : undefined}>
                              {overdue ? 'Overdue ' : ''}
                              {formatDate(t.due_date)}
                            </span>
                          </>
                        )}
                        {t.ref_account_id?.name && <> · {t.ref_account_id.name}</>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ObjectIcon object="opportunities" size="sm" />
              <h2 className="text-sm font-semibold">Closing soon</h2>
            </div>
            <Link href="/opportunities" className="text-xs link">
              View all
            </Link>
          </div>
          <table className="min-w-full divide-y divide-line">
            <tbody className="divide-y divide-line">
              {oppRows.map((o) => (
                <tr key={o.id}>
                  <td className="td max-w-[14rem] truncate">
                    <Link href={`/opportunities/${o.id}`} className="link font-medium">
                      {o.name}
                    </Link>
                    <p className="truncate text-xs text-muted">{o.ref_account_id?.name}</p>
                  </td>
                  <td className="td">
                    <FieldValue field={getField(OBJECTS.opportunities, 'stage')!} record={o} />
                  </td>
                  <td className="td text-right tabular-nums">{formatCurrency(o.amount)}</td>
                  <td className="td text-right text-xs text-muted">{formatDate(o.close_date)}</td>
                </tr>
              ))}
              {oppRows.length === 0 && (
                <tr>
                  <td className="td text-muted">No open opportunities.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ObjectIcon object="cases" size="sm" />
              <h2 className="text-sm font-semibold">Open cases</h2>
            </div>
            <Link href="/cases" className="text-xs link">
              View all
            </Link>
          </div>
          <table className="min-w-full divide-y divide-line">
            <tbody className="divide-y divide-line">
              {caseRows.map((c) => (
                <tr key={c.id}>
                  <td className="td max-w-[16rem] truncate">
                    <Link href={`/cases/${c.id}`} className="link font-medium">
                      {c.subject}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      #{c.case_number} · {c.ref_account_id?.name ?? 'No account'}
                    </p>
                  </td>
                  <td className="td">
                    <FieldValue field={getField(OBJECTS.cases, 'status')!} record={c} />
                  </td>
                  <td className="td text-right">
                    <FieldValue field={getField(OBJECTS.cases, 'priority')!} record={c} />
                  </td>
                </tr>
              ))}
              {caseRows.length === 0 && (
                <tr>
                  <td className="td text-muted">No open cases.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
