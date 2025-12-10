'use client';

import { useState, useEffect } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { EvaluationTimeline } from '@/components/student/EvaluationTimeline';
import { EvaluationProgressSummary } from '@/components/student/EvaluationProgressSummary';
import { getStudentEvaluationTimeline, getStudentEvaluationProgress } from '@/lib/api/student-evaluations';
import { useToast } from '@/hooks/use-toast';

export default function Evaluations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [internshipId, setInternshipId] = useState<string | null>(null);

  // Fetch student's current internship
  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/student/current-internship`, {
          headers: {
            'Authorization': `Bearer ${(await (await import('@/lib/supabase')).createSupabaseClient().auth.getSession()).data.session?.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.id) {
            setInternshipId(data.data.id);
          }
        }
      } catch (error) {
        console.error('Error fetching internship:', error);
      }
    };

    fetchInternship();
  }, []);

  // Fetch evaluations and progress when internship is loaded
  useEffect(() => {
    if (!internshipId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [timelineData, progressData] = await Promise.all([
          getStudentEvaluationTimeline(internshipId),
          getStudentEvaluationProgress(internshipId)
        ]);

        setEvaluations(timelineData);
        setProgress(progressData);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load evaluations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [internshipId, toast]);

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <StudentHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Evaluations</h1>
                <p className="text-muted-foreground mt-1">Track your performance and feedback</p>
              </div>

              <EvaluationProgressSummary progress={progress} loading={loading} />
              <EvaluationTimeline evaluations={evaluations} loading={loading} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <MobileHeader title="Evaluations" subtitle="Track your performance" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Evaluations</h1>
              <p className="text-sm text-muted-foreground mt-1">Track your performance</p>
            </div>

            <EvaluationProgressSummary progress={progress} loading={loading} />
            <EvaluationTimeline evaluations={evaluations} loading={loading} />
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="student" />
        </div>
      </div>
    </div>
  );
}
