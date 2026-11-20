import { OBJECTS, type ObjectKey } from '@/lib/objects';

export function ObjectIcon({ object, size = 'md' }: { object: ObjectKey; size?: 'sm' | 'md' | 'lg' }) {
  const def = OBJECTS[object];
  const dims = size === 'sm' ? 'h-6 w-6 text-[10px]' : size === 'lg' ? 'h-11 w-11 text-sm' : 'h-8 w-8 text-xs';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white ${dims}`}
      style={{ backgroundColor: def.color }}
      aria-hidden
    >
      {def.glyph}
    </span>
  );
}
