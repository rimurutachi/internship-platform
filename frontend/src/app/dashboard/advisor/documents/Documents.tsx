'use client';

import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { DocumentsPage } from '@/components/shared/DocumentsPage';

export default function Documents() {
  return (
    <DocumentsPage 
      sidebar={<AdvisorSidebar />}
      header={<AdvisorHeader />}
      userType="advisor"
      defaultUploadType="template"
    />
  );
}

