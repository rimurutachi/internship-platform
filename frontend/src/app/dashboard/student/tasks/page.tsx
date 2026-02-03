"use client";

import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TaskListsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for future implementation
    console.log('🔵 [Tasks] Placeholder page mounted');
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const Placeholder = () => (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900">Task Lists</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          This is a placeholder for the upcoming Task Lists feature.
          Tasks will show here once implemented.
        </p>
      </CardContent>
    </Card>
  );

  const Desktop = () => (
    <div className="hidden lg:flex h-full">
      <StudentSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <StudentHeader />
        <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="max-w-4xl"><Placeholder /></div>
          )}
        </div>
      </div>
    </div>
  );

  const Mobile = () => (
    <div className="lg:hidden h-screen flex flex-col overflow-hidden">
      <MobileHeader title="Task Lists" />
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Placeholder />
        )}
      </div>
      <BottomNavigation type="student" />
    </div>
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      <Desktop />
      <Mobile />
    </div>
  );
}
