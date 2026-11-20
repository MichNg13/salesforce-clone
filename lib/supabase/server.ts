import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { supabaseEnv } from './env';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — the middleware refreshes the session instead.
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
}

/** The signed-in user and their profile (deduplicated per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name ?? user.email ?? 'User',
    role: profile?.role === 'admin' ? 'admin' : 'user',
  };
});
