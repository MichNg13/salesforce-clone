'use client';

import { useActionState } from 'react';
import { updateProfile, type ActionState } from '@/lib/actions';

export function ProfileForm({ fullName, title, email }: { fullName: string; title: string; email: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-4 p-5 md:grid-cols-3">
      <label className="block">
        <span className="field-label">Full name</span>
        <input name="full_name" defaultValue={fullName} required className="input" />
      </label>
      <label className="block">
        <span className="field-label">Title</span>
        <input name="title" defaultValue={title} className="input" />
      </label>
      <label className="block">
        <span className="field-label">Email</span>
        <input value={email} disabled className="input bg-slate-50 text-muted" />
      </label>
      <div className="flex items-center gap-3 md:col-span-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : 'Save profile'}
        </button>
        {state.ok && <span className="text-sm text-emerald-700">Saved.</span>}
        {state.error && <span className="text-sm text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}
