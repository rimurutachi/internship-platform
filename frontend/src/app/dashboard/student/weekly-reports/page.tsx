'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Weekly reports page has been deprecated in favor of daily reports
export default function WeeklyReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/student/daily-reports');
  }, [router]);

  return null;
}
