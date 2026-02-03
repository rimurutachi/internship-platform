'use client';

import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MessagesPage } from '@/components/shared/MessagesPage';

export default function Messages() {
  return (
    <MessagesPage 
      sidebar={<StudentSidebar />}
      header={<StudentHeader />}
      userType="student"
    />
  );
}
