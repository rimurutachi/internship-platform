'use client';

import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { SettingsPage } from '@/components/shared/SettingsPage';

export default function Settings() {
  return (
    <SettingsPage 
      sidebar={<SupervisorSidebar />}
      header={<SupervisorHeader />}
      userType="supervisor"
    />
  );
}
