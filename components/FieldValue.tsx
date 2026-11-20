import Link from 'next/link';
import { formatCurrency, formatDate, formatDateTime, formatNumber, safeHref } from '@/lib/format';
import { lookupMeta, type FieldDef, type Row } from '@/lib/objects';

const BADGE_COLORS: Record<string, string> = {
  Hot: 'bg-red-50 text-red-700',
  Warm: 'bg-amber-50 text-amber-800',
  Cold: 'bg-sky-50 text-sky-700',
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-50 text-orange-700',
  'Closed Won': 'bg-emerald-50 text-emerald-700',
  'Closed Lost': 'bg-slate-100 text-slate-600',
  Closed: 'bg-slate-100 text-slate-600',
  Completed: 'bg-emerald-50 text-emerald-700',
  Converted: 'bg-emerald-50 text-emerald-700',
  Escalated: 'bg-red-50 text-red-700',
  Qualified: 'bg-emerald-50 text-emerald-700',
  Unqualified: 'bg-slate-100 text-slate-600',
};

const BADGE_FIELDS = new Set(['status', 'stage', 'rating', 'priority']);

export function FieldValue({ field, record }: { field: FieldDef; record: Row }) {
  const v = record[field.name];

  if (field.type === 'lookup' && field.lookup) {
    const ref = record[`ref_${field.name}`];
    if (!ref) return <Empty />;
    const meta = lookupMeta(field.lookup);
    const label = String(ref[meta.nameField] ?? '—');
    return meta.linkable ? (
      <Link href={`/${field.lookup}/${ref.id}`} className="link">
        {label}
      </Link>
    ) : (
      <span>{label}</span>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] ${v ? 'border-brand-600 bg-brand-600 text-white' : 'border-line'}`}
        aria-label={v ? 'Yes' : 'No'}
      >
        {v ? '✓' : ''}
      </span>
    );
  }

  if (v === null || v === undefined || v === '') return <Empty />;

  switch (field.type) {
    case 'currency':
      return <span className="tabular-nums">{formatCurrency(v)}</span>;
    case 'number':
      return <span className="tabular-nums">{formatNumber(v)}</span>;
    case 'percent':
      return <span className="tabular-nums">{formatNumber(v)}%</span>;
    case 'date':
      return <span>{formatDate(v)}</span>;
    case 'datetime':
      return <span>{formatDateTime(v)}</span>;
    case 'email':
      return (
        <a href={`mailto:${v}`} className="link">
          {String(v)}
        </a>
      );
    case 'phone':
      return (
        <a href={`tel:${String(v).replace(/[^\d+]/g, '')}`} className="link">
          {String(v)}
        </a>
      );
    case 'url': {
      const href = safeHref(v);
      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="link">
          {String(v).replace(/^https?:\/\//, '')}
        </a>
      ) : (
        <span>{String(v)}</span>
      );
    }
    case 'textarea':
      return <span className="whitespace-pre-wrap">{String(v)}</span>;
    case 'picklist':
      if (BADGE_FIELDS.has(field.name)) {
        return (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[String(v)] ?? 'bg-brand-50 text-brand-800'}`}>
            {String(v)}
          </span>
        );
      }
      return <span>{String(v)}</span>;
    default:
      return <span>{String(v)}</span>;
  }
}

function Empty() {
  return <span className="text-slate-300">—</span>;
}
