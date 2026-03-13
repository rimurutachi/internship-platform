'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Weekly reports page has been deprecated.
// Daily reports are now student-only and not visible to admins.
export default function AdminWeeklyReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin');
  }, [router]);

  return null;
}
