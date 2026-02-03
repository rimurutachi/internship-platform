'use client';

import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { SettingsPage } from '@/components/shared/SettingsPage';

export default function Settings() {
  return (
    <SettingsPage 
      sidebar={<StudentSidebar />}
      header={<StudentHeader />}
      userType="student"
    />
  );
}
