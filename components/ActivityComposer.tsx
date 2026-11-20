'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { logActivity, type ActionState } from '@/lib/actions';

const TYPES = [
  { value: 'Task', label: 'New Task' },
  { value: 'Call', label: 'Log a Call' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Note', label: 'Note' },
];

export function ActivityComposer({ links, revalidate }: { links: Record<string, string>; revalidate: string }) {
  const [type, setType] = useState('Task');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(logActivity, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-line px-3 pt-2" role="tablist">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={type === t.value}
            onClick={() => setType(t.value)}
            className={`-mb-px border-b-2 px-2.5 py-1.5 text-xs font-medium ${
              type === t.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form ref={formRef} action={formAction} className="space-y-2 p-3">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="revalidate" value={revalidate} />
        {Object.entries(links).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input name="subject" required placeholder={type === 'Note' ? 'Title' : 'Subject'} className="input" />
        <div className="flex gap-2">
          {type !== 'Note' && (
            <input name="due_date" type="date" aria-label={type === 'Task' ? 'Due date' : 'Date'} className="input" />
          )}
        </div>
        <textarea name="description" rows={2} placeholder="Details (optional)" className="input" />
        {state.error && <p className="text-xs text-red-700">{state.error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Saving…' : type === 'Task' ? 'Add task' : 'Log'}
          </button>
        </div>
      </form>
    </div>
  );
}
