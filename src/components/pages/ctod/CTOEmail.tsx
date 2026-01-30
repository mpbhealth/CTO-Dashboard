import { EmailSuite } from '@/components/email';
import { useAuth } from '@/contexts/AuthContext';

export function CTOEmail() {
  const { profile } = useAuth();
  const userId = profile?.id;

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <EmailSuite userId={userId} className="h-full" />
    </div>
  );
}

export default CTOEmail;
