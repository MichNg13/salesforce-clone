'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp, type AuthState } from './actions';

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {
    error: initialError,
  });
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === 'signin' ? signInState : signUpState;
  const pending = signingIn || signingUp;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h1>
      <p className="mt-1 text-sm text-muted">
        {mode === 'signin' ? 'Welcome back. Enter your details to continue.' : 'The first person to sign up becomes the admin.'}
      </p>

      <form action={mode === 'signin' ? signInAction : signUpAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        {mode === 'signup' && (
          <label className="block">
            <span className="field-label">Full name</span>
            <input name="full_name" required autoComplete="name" className="input" />
          </label>
        )}
        <label className="block">
          <span className="field-label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="block">
          <span className="field-label">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'signup' ? 8 : undefined}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            className="input"
          />
        </label>

        {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state.message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.message}</p>}

        <button type="submit" disabled={pending} className="btn-primary w-full justify-center py-2.5">
          {pending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="font-medium text-brand-600 hover:underline"
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
