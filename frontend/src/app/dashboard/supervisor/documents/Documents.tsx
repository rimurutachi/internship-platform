'use client';

import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { DocumentsPage } from '@/components/shared/DocumentsPage';

export default function Documents() {
  return (
    <DocumentsPage 
      sidebar={<SupervisorSidebar />}
      header={<SupervisorHeader />}
      userType="supervisor"
      defaultUploadType="report"
    />
  );
}
