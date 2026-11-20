import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="text-sm text-muted">The record may have been deleted, or the link is wrong.</p>
      <Link href="/" className="btn-primary mt-2">
        Back to Home
      </Link>
    </div>
  );
}
