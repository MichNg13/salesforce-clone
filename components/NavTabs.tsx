'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 sm:px-5" aria-label="Main">
      {tabs.map((t) => {
        const active = t.href === '/' ? pathname === '/' : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? 'border-brand-600 text-brand-700' : 'border-transparent text-muted hover:border-slate-300 hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
