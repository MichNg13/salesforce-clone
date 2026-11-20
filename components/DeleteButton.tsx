'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/actions';

export function DeleteButton({
  action,
  label,
}: {
  action: (prev: ActionState) => Promise<ActionState>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete this ${label.toLowerCase()}? This can't be undone.`)) e.preventDefault();
      }}
      className="contents"
    >
      <button type="submit" disabled={pending} className="btn-danger">
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {state.error && <p className="basis-full text-right text-xs text-red-700">{state.error}</p>}
    </form>
  );
}
