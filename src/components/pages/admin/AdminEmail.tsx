import { EmailSuite } from '@/components/email';
import { useAuth } from '@/contexts/AuthContext';

export function AdminEmail() {
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
    <div className="h-[calc(100vh-120px)] p-4">
      <EmailSuite userId={userId} className="h-full" />
    </div>
  );
}

export default AdminEmail;
