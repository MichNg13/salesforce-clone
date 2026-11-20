import { setPathValue } from '@/lib/actions';
import type { ObjectDef, Row } from '@/lib/objects';

// Chevron-style progress path for stage/status fields.
export function PathBar({ def, record }: { def: ObjectDef; record: Row }) {
  const path = def.path!;
  const current = String(record[path.field] ?? '');
  const field = def.fields.find((f) => f.name === path.field);
  const settable = new Set(field?.options ?? []);
  const lost = path.lostSteps?.includes(current);
  const steps = lost ? [...path.steps.slice(0, -1), current] : path.steps;
  const currentIdx = steps.indexOf(current);
  const locked = def.key === 'leads' && current === 'Converted';

  return (
    <div className="card p-3">
      <ol className="flex w-full overflow-x-auto">
        {steps.map((step, i) => {
          const done = currentIdx > -1 && i < currentIdx;
          const isCurrent = i === currentIdx;
          const isLost = isCurrent && lost;
          const isWon = isCurrent && step === path.wonStep;
          const color = isLost
            ? 'bg-slate-500 text-white'
            : isWon
              ? 'bg-emerald-600 text-white'
              : isCurrent
                ? 'bg-brand-700 text-white'
                : done
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-muted hover:bg-slate-200';
          const clip =
            i === 0
              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
              : i === steps.length - 1
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)';
          const content = (
            <span className="block truncate">
              {done ? '✓ ' : ''}
              {step}
            </span>
          );
          const cls = `flex h-9 min-w-28 flex-1 items-center justify-center px-5 text-xs font-semibold transition ${color} ${i > 0 ? '-ml-1.5' : ''}`;
          return (
            <li key={step} className="flex flex-1">
              {settable.has(step) && !isCurrent && !locked ? (
                <form action={setPathValue.bind(null, def.key, record.id as string, step)} className="flex flex-1">
                  <button type="submit" className={cls} style={{ clipPath: clip }} title={`Mark as ${step}`}>
                    {content}
                  </button>
                </form>
              ) : (
                <span className={cls} style={{ clipPath: clip }} aria-current={isCurrent ? 'step' : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {path.lostSteps && !lost && !locked && current !== path.wonStep && (
        <div className="mt-2 flex justify-end gap-2">
          {path.lostSteps.filter((s) => settable.has(s)).map((s) => (
            <form key={s} action={setPathValue.bind(null, def.key, record.id as string, s)}>
              <button className="text-xs font-medium text-muted hover:text-red-700">Mark as {s}</button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
