import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EmailMessage } from '@/types/email';

interface Candidate {
  email: string;
  ambiguous: boolean;
  matches: Array<{ id: string; kind: string; name: string; href: string }>;
}

export function MailCrmCandidates({ message }: { message: EmailMessage }) {
  const emails = [message.from?.email, ...((message.to || []).map((r) => r.email))]
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  const { data } = useQuery({
    queryKey: ['mail-crm-candidates', message.id, emails.join(',')],
    enabled: emails.length > 0,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return [] as Candidate[];
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'matchEmails', emails }),
      });
      const json = await res.json();
      return (json.candidates || []) as Candidate[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = (data || []).filter((row) => row.matches.length > 0);
  if (!rows.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/40">ARYX CRM candidates</p>
      {rows.map((row) => (
        <div key={row.email} className="mb-2 last:mb-0">
          <p className="text-xs text-white/45">
            {row.email} {row.ambiguous ? '· ambiguous, not linked' : '· single match'}
          </p>
          {row.matches.map((match) => (
            <a
              key={`${match.kind}-${match.id}`}
              href={match.href}
              target="_blank"
              rel="noreferrer"
              className="mr-3 text-xs text-emerald-200 underline"
            >
              {match.name} ({match.kind})
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
