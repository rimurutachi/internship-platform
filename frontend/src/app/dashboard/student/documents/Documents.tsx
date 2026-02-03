'use client';

import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { DocumentsPage } from '@/components/shared/DocumentsPage';

export default function Documents() {
  return (
    <DocumentsPage 
      sidebar={<StudentSidebar />}
      header={<StudentHeader />}
      userType="student"
      defaultUploadType="report"
    />
  );
}


