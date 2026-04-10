'use client';

import { useUser } from '@/hooks/use-user';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import MessagesPage from '@/components/shared/MessagesPage';
import { Loader2 } from 'lucide-react';

export default function StudentMessagesPage() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MessagesPage 
      currentUser={user as any} 
      sidebar={<StudentSidebar />} 
      header={<StudentHeader />} 
    />
  );
}
