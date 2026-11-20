import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ObjectIcon } from '@/components/ObjectIcon';
import { convertLead } from '@/lib/actions';
import { createClient } from '@/lib/supabase/server';
import { UUID_RE } from '@/lib/objects';
import { ConvertForm } from './ConvertForm';

export const metadata: Metadata = { title: 'Convert lead' };

export default async function ConvertLeadPage({ params }: { params: Promise<{ object: string; id: string }> }) {
  const { object, id } = await params;
  if (object !== 'leads' || !UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: lead }, { data: accounts }] = await Promise.all([
    supabase.from('leads').select('id, full_name, company, converted_at').eq('id', id).maybeSingle(),
    supabase.from('accounts').select('id, name').order('name').limit(1000),
  ]);
  if (!lead) notFound();
  if (lead.converted_at) redirect(`/leads/${id}`);

  const match = (accounts ?? []).find((a) => a.name.trim().toLowerCase() === String(lead.company).trim().toLowerCase());

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <ObjectIcon object="leads" size="lg" />
        <div>
          <p className="text-xs text-muted">Convert Lead</p>
          <h1 className="text-xl font-semibold">
            {lead.full_name} · {lead.company}
          </h1>
        </div>
      </div>
      <ConvertForm
        action={convertLead.bind(null, id)}
        company={String(lead.company)}
        accounts={(accounts ?? []).map((a) => ({ id: a.id, name: a.name }))}
        suggestedAccountId={match?.id}
        cancelHref={`/leads/${id}`}
      />
    </div>
  );
}
