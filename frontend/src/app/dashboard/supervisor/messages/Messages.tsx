'use client';

import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MessagesPage } from '@/components/shared/MessagesPage';

export default function Messages() {
  return (
    <MessagesPage 
      sidebar={<SupervisorSidebar />}
      header={<SupervisorHeader />}
      userType="supervisor"
    />
  );
}
