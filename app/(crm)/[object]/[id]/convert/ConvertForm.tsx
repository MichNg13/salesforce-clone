'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { ActionState } from '@/lib/actions';

export function ConvertForm({
  action,
  company,
  accounts,
  suggestedAccountId,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  company: string;
  accounts: { id: string; name: string }[];
  suggestedAccountId?: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [mode, setMode] = useState<'new' | 'existing'>(suggestedAccountId ? 'existing' : 'new');
  const [createOpp, setCreateOpp] = useState(true);

  return (
    <form action={formAction} className="card divide-y divide-line">
      <fieldset className="space-y-3 p-5">
        <legend className="mb-2 text-sm font-semibold">Account</legend>
        {suggestedAccountId && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
            An account named “{company}” already exists — it&apos;s selected below to avoid a duplicate.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="account_mode" value="new" checked={mode === 'new'} onChange={() => setMode('new')} className="accent-brand-600" />
          Create new account: <strong>{company}</strong>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="account_mode"
            value="existing"
            checked={mode === 'existing'}
            onChange={() => setMode('existing')}
            className="accent-brand-600"
          />
          Add to an existing account
        </label>
        {mode === 'existing' && (
          <select name="existing_account_id" defaultValue={suggestedAccountId ?? ''} required className="input">
            <option value="">— Select account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </fieldset>

      <fieldset className="space-y-3 p-5">
        <legend className="mb-2 text-sm font-semibold">Contact</legend>
        <p className="text-sm text-muted">A new contact is created from the lead&apos;s name and details.</p>
      </fieldset>

      <fieldset className="space-y-3 p-5">
        <legend className="mb-2 text-sm font-semibold">Opportunity</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="create_opportunity"
            checked={createOpp}
            onChange={(e) => setCreateOpp(e.target.checked)}
            className="accent-brand-600"
          />
          Create an opportunity
        </label>
        {createOpp && (
          <label className="block">
            <span className="field-label">Opportunity name</span>
            <input name="opportunity_name" defaultValue={`${company} - New Deal`} className="input" />
          </label>
        )}
      </fieldset>

      {state.error && <p className="px-5 py-3 text-sm text-red-700">{state.error}</p>}

      <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3">
        <Link href={cancelHref} className="btn">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Converting…' : 'Convert'}
        </button>
      </div>
    </form>
  );
}
