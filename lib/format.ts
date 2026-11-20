const currency = process.env.NEXT_PUBLIC_CURRENCY || 'USD';

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
const currencyFmtCents = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 });
const numberFmt = new Intl.NumberFormat('en-US');

export function formatCurrency(v: unknown, cents = false): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return (cents || !Number.isInteger(n) ? currencyFmtCents : currencyFmt).format(n);
}

export function formatCompactCurrency(v: unknown): string {
  const n = Number(v ?? 0);
  return compactFmt.format(Number.isNaN(n) ? 0 : n);
}

export function formatNumber(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : numberFmt.format(n);
}

/** Dates are stored as YYYY-MM-DD; format in UTC so they never shift a day. */
export function formatDate(v: unknown): string {
  if (!v) return '';
  const d = new Date(String(v).length === 10 ? `${v}T00:00:00Z` : String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(v: unknown): string {
  if (!v) return '';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function safeHref(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}
