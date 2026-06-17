'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
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
  const isGradeVisible = () => {
    if (!finalEval || finalEval.status !== 'approved') return false;
    
    const now = new Date();
    
    if (internshipEnd && new Date(internshipEnd) > now) {
      return false;
    }
    
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

  const FinalView = () => {
    const criterionScores = finalEval?.criterion_scores as any[] || [];

    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4 flex items-center justify-between">
          <CardTitle className="text-2xl text-gray-900">Final Evaluation</CardTitle>
          <ShieldCheck className="w-6 h-6 text-[#4CAF50]" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6 text-gray-800">
            {/* Basic Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <div className="mt-1">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold capitalize">
                    {finalEval?.status || 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Submitted</p>
                <p className="mt-1 font-medium">{finalEval?.created_at ? new Date(finalEval.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Score</p>
                <p className="mt-1 font-medium">{finalEval?.total_score ?? 'N/A'}/70</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Final Grade</p>
                <p className="mt-1 font-medium">{finalEval?.final_grade ? Number(finalEval.final_grade).toFixed(2) : 'N/A'}</p>
              </div>
            </div>

            {/* Attendance & Punctuality */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Attendance</p>
                <span className="px-3 py-1 border border-gray-200 rounded-full text-sm capitalize">
                  {finalEval?.attendance || 'N/A'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Punctuality</p>
                <span className="px-3 py-1 border border-gray-200 rounded-full text-sm capitalize">
                  {finalEval?.punctuality || 'N/A'}
                </span>
              </div>
            </div>

            {/* Evaluation Criteria */}
            {criterionScores.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Evaluation Criteria (CvSU A-G)</h3>
                <div className="space-y-2">
                  {criterionScores.map((score: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium text-gray-700">
                        {score.criterion_code}. {score.criterion_name}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">{score.score}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supervisor Info & Comments */}
            {finalEval?.supervisor && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-lg mb-2">Evaluator</h3>
                <p className="text-gray-700">
                  {finalEval.supervisor.name || `${finalEval.supervisor.first_name || ''} ${finalEval.supervisor.last_name || ''}`.trim()}
                  <span className="text-gray-500 text-sm ml-2">({finalEval.supervisor.email})</span>
                </p>
              </div>
            )}

            {finalEval?.supervisor_comments && (
              <div className="mt-4 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Supervisor Comments</h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{finalEval.supervisor_comments}</p>
              </div>
            )}

            {finalEval?.advisor_comments && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">Advisor Comments</h3>
                <p className="text-blue-700 whitespace-pre-wrap text-sm leading-relaxed">{finalEval.advisor_comments}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 mt-6">
              <p className="text-sm text-green-600 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-5 h-5" />
                Approved on {finalEval?.approved_at ? new Date(finalEval.approved_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
        <p className="text-gray-600 mt-1">Final evaluation visibility depends on approval and internship end date.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : available ? <FinalView /> : <UnavailableView />}
    </div>
  );
}
