import { EmailSuite } from '@/components/email';
import { useAuth } from '@/contexts/AuthContext';

export function CosInbox() {
  const { profile, user } = useAuth();
  const userId = profile?.id || user?.id;

  if (!userId) {
    return (
      <div className="flex h-full items-center justify-center text-white/50">
        Loading mailbox…
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-6rem)]">
      <EmailSuite userId={userId} className="h-full" />
    </div>
  );
}

export default CosInbox;
