import { EmailSuite } from '@/components/email';
import { useAuth } from '@/contexts/AuthContext';

export function CosInbox() {
  const { profile, user } = useAuth();
  const userId = profile?.id || user?.id;

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center bg-aryx-bg text-aryx-muted">
        Loading mailbox…
      </div>
    );
  }

  return (
    <div className="-mx-4 h-[calc(100dvh-6rem)] sm:-mx-6 md:-mx-8">
      <EmailSuite userId={userId} className="h-full" />
    </div>
  );
}

export default CosInbox;
