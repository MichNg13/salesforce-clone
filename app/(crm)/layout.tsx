import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { NavTabs } from '@/components/NavTabs';
import { getCurrentUser } from '@/lib/supabase/server';
import { NAV_OBJECTS, OBJECTS } from '@/lib/objects';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const tabs = [
    { href: '/', label: 'Home' },
    ...NAV_OBJECTS.map((k) => ({ href: `/${k}`, label: OBJECTS[k].plural })),
  ];
  const initials = user.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo className="h-8 w-8" />
            <span className="hidden text-base font-semibold tracking-tight sm:inline">Summit CRM</span>
          </Link>
          <form action="/search" className="mx-auto w-full max-w-xl">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M8.5 3a5.5 5.5 0 1 0 3.47 9.77l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 8.5 3ZM4.5 8.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" />
              </svg>
              <input
                name="q"
                placeholder="Search accounts, contacts, leads, opportunities, cases…"
                className="w-full rounded-lg border border-line bg-canvas/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </form>
          <details className="relative shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-0.5 hover:bg-slate-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                {initials || 'U'}
              </span>
            </summary>
            <div className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-white p-2 shadow-lg">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium">{user.fullName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                {user.role === 'admin' && (
                  <span className="mt-1 inline-block rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                    Admin
                  </span>
                )}
              </div>
              <Link href="/settings" className="block rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                Settings &amp; users
              </Link>
              <form action="/auth/signout" method="post">
                <button className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50">Sign out</button>
              </form>
            </div>
          </details>
        </div>
        <NavTabs tabs={tabs} />
      </header>
      <main className="px-4 py-5 sm:px-6">{children}</main>
    </div>
  );
}
