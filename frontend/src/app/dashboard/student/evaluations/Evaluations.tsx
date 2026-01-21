'use client';

import { useEffect, useState } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Clock, Calendar } from 'lucide-react';
import { studentAPI } from '@/lib/api/student';
import { useToast } from '@/hooks/use-toast';

export default function Evaluations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [finalEval, setFinalEval] = useState<any | null>(null);
  const [internshipEnd, setInternshipEnd] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('🔵 [Evaluations] Loading final evaluation...');
        const [internshipRes, evalsRes] = await Promise.all([
          studentAPI.getCurrentInternship(),
          studentAPI.getEvaluations(10, 0),
        ]);

        if (internshipRes.success) {
          setInternshipEnd(internshipRes.data?.internship?.end_date || null);
        }

        if (evalsRes.success) {
          const finalOnly = (evalsRes.data?.evaluations || []).find((e: any) => (e.evaluation_type || 'final') === 'final');
          setFinalEval(finalOnly || null);
        } else {
          console.warn('⚠️ [Evaluations] Failed to fetch evaluations:', evalsRes.error);
        }
      } catch (e: any) {
        console.error('❌ [Evaluations] Load error:', e);
        toast({ title: 'Error', description: e.message || 'Failed to load evaluation', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  // Check if grade should be visible
  // Grade is visible if:
  // 1. Evaluation is approved AND
  // 2. Either no grade_reveal_date set OR grade_reveal_date has passed AND
  // 3. Internship end date has passed
  const isGradeVisible = () => {
    if (!finalEval || finalEval.status !== 'approved') return false;
    
    const now = new Date();
    
    // Check internship end date
    if (internshipEnd && new Date(internshipEnd) > now) {
      return false;
    }
    
    // Check grade reveal date if set
    if (finalEval.grade_reveal_date) {
      const revealDate = new Date(finalEval.grade_reveal_date);
      if (revealDate > now) {
        return false;
      }
    }
    
    return true;
  };

  const getRevealDate = () => {
    if (finalEval?.grade_reveal_date) {
      return new Date(finalEval.grade_reveal_date);
    }
    if (internshipEnd) {
      return new Date(internshipEnd);
    }
    return null;
  };

  const available = isGradeVisible();

  const FinalView = () => (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="border-b border-gray-200 pb-4 flex items-center justify-between">
        <CardTitle className="text-2xl text-gray-900">Final Evaluation</CardTitle>
        <ShieldCheck className="w-6 h-6 text-[#4CAF50]" />
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3 text-gray-800">
          <div><span className="font-semibold">Overall Rating:</span> {finalEval?.rating_overall ?? finalEval?.final_grade ?? 'N/A'}</div>
          <div><span className="font-semibold">Technical:</span> {finalEval?.rating_technical ?? 'N/A'}</div>
          <div><span className="font-semibold">Communication:</span> {finalEval?.rating_communication ?? 'N/A'}</div>
          <div><span className="font-semibold">Work Ethic:</span> {finalEval?.rating_work_ethic ?? 'N/A'}</div>
          {finalEval?.total_score && (
            <div><span className="font-semibold">Total Score:</span> {finalEval.total_score}</div>
          )}
          {finalEval?.supervisor && (
            <div><span className="font-semibold">Supervisor:</span> {finalEval.supervisor.name || `${finalEval.supervisor.first_name} ${finalEval.supervisor.last_name}`} ({finalEval.supervisor.email})</div>
          )}
          {finalEval?.supervisor_comments && (
            <div className="mt-4">
              <div className="font-semibold">Supervisor Comments</div>
              <p className="text-gray-700 whitespace-pre-wrap">{finalEval.supervisor_comments}</p>
            </div>
          )}
          {finalEval?.advisor_comments && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-800">Advisor Comments</div>
              <p className="text-blue-700 whitespace-pre-wrap">{finalEval.advisor_comments}</p>
            </div>
          )}
          <div className="pt-4 border-t mt-4">
            <p className="text-sm text-green-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Approved on {finalEval?.approved_at ? new Date(finalEval.approved_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const UnavailableView = () => {
    const revealDate = getRevealDate();
    
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-2xl text-gray-900">Final Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {finalEval?.status === 'approved' ? (
            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Evaluation Approved - Grade Scheduled</AlertTitle>
              <AlertDescription className="text-amber-700">
                Your final evaluation has been approved by your advisor. 
                {revealDate && (
                  <>
                    <br />
                    <span className="flex items-center gap-1 mt-2">
                      <Calendar className="w-4 h-4" />
                      Your grade will be visible on: <strong>{revealDate.toLocaleDateString()}</strong>
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-gray-700">
              <p>
                {finalEval ? 
                  `Your final evaluation is currently ${finalEval.status === 'submitted' ? 'under review by your advisor' : 'being processed'}.` : 
                  'No final evaluation has been submitted yet.'}
              </p>
              {internshipEnd && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Internship ends on {new Date(internshipEnd).toLocaleDateString()}.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const Desktop = () => (
    <div className="hidden lg:flex h-full">
      <StudentSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <StudentHeader />
        <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
              <p className="text-gray-600 mt-1">Final evaluation visibility depends on approval and internship end date.</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : available ? <FinalView /> : <UnavailableView />}
          </div>
        </div>
      </div>
    </div>
  );

  const Mobile = () => (
    <div className="lg:hidden h-screen flex flex-col overflow-hidden">
      <MobileHeader title="Evaluations" subtitle="Final evaluation" />
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : available ? <FinalView /> : <UnavailableView />}
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
