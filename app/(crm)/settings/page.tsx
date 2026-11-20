import type { Metadata } from 'next';
import { setUserRole } from '@/lib/actions';
import { formatDate } from '@/lib/format';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { ProfileForm } from './ProfileForm';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const me = (await getCurrentUser())!;
  const supabase = await createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, title, role, created_at')
    .order('created_at', { ascending: true });
  const self = users?.find((u) => u.id === me.id);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold">Your profile</h2>
        </div>
        <ProfileForm fullName={self?.full_name ?? ''} title={self?.title ?? ''} email={me.email} />
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold">Users ({users?.length ?? 0})</h2>
          <p className="text-xs text-muted">
            {me.role === 'admin' ? 'Admins can delete any record and manage roles.' : 'Only admins can change roles.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Title</th>
                <th className="th">Joined</th>
                <th className="th">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="td font-medium">{u.full_name}</td>
                  <td className="td">{u.email}</td>
                  <td className="td">{u.title}</td>
                  <td className="td">{formatDate(u.created_at)}</td>
                  <td className="td">
                    {me.role === 'admin' && u.id !== me.id ? (
                      <form action={setUserRole.bind(null, u.id, u.role === 'admin' ? 'user' : 'admin')} className="flex items-center gap-2">
                        <span className="capitalize">{u.role}</span>
                        <button className="text-xs link">{u.role === 'admin' ? 'Make user' : 'Make admin'}</button>
                      </form>
                    ) : (
                      <span className="capitalize">{u.role}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
