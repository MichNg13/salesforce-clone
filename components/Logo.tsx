export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2549ea" />
      <path d="M10 48 L26 22 L34 34 L40 26 L54 48 Z" fill="#fff" />
      <path d="M26 22 L30 28.5 L27 31 L23.5 27 Z" fill="#9fdcd2" />
    </svg>
  );
}
