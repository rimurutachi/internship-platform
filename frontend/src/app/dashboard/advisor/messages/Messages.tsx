'use client';

import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MessagesPage } from '@/components/shared/MessagesPage';

export default function Messages() {
  return (
    <MessagesPage 
      sidebar={<AdvisorSidebar />}
      header={<AdvisorHeader />}
      userType="advisor"
    />
  );
}
