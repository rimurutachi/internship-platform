'use client';

import { useUser } from '@/hooks/use-user';
import MessagesPage from '@/components/shared/MessagesPage';
import { Loader2 } from 'lucide-react';

export default function StudentMessagesPage() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MessagesPage 
      currentUser={{
        id: user.id,
        role: user.role || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      }} 
    />
  );
}
