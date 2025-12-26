'use client';

import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { SettingsPage } from '@/components/shared/SettingsPage';

export default function Settings() {
  return (
    <SettingsPage 
      sidebar={<AdvisorSidebar />}
      header={<AdvisorHeader />}
      userType="advisor"
    />
  );
}
