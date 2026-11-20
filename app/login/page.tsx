import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <Logo className="h-9 w-9" />
            <span className="text-xl font-semibold tracking-tight text-ink">Summit CRM</span>
          </div>
          <LoginForm
            next={next ?? '/'}
            initialError={error === 'link' ? 'That link is invalid or has expired. Please sign in.' : undefined}
          />
        </div>
      </section>
      <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 text-white">
        <svg className="absolute inset-x-0 bottom-0 w-full opacity-25" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden>
          <path d="M0 300 L160 120 L260 210 L420 40 L560 190 L660 110 L800 230 L800 300 Z" fill="white" />
        </svg>
        <div className="relative m-auto max-w-md px-10">
          <h2 className="text-3xl font-semibold leading-tight">Every account, deal and case in one place.</h2>
          <p className="mt-4 text-white/80">
            Track your pipeline from first lead to closed deal, keep customers happy with case management,
            and see what needs attention today.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li>• Leads, accounts, contacts and opportunities</li>
            <li>• Lead conversion and stage paths</li>
            <li>• Products, line items and pipeline dashboards</li>
            <li>• Support cases and activity timelines</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
