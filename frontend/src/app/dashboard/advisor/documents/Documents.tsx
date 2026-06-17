'use client';

import { DocumentsPage } from '@/components/shared/DocumentsPage';

export default function Documents() {
  return (
    <DocumentsPage 
      userType="advisor"
      defaultUploadType="template"
    />
  );
}

