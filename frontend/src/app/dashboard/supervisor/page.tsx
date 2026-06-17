'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Supervisor Landing Page
 * Redirects to interns list (My Interns) as the main landing page
 */
export default function SupervisorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/supervisor/interns');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

