'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    FileText, 
    Save, 
    Send, 
    Loader2, 
    AlertCircle,
    Calendar,
    User,
    Building2,
    ArrowLeft,
    Info,
    AlertTriangle
  } from 'lucide-react';
  import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
  import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
  import { MobileHeader } from '@/components/mobile/MobileHeader';
  import { BottomNavigation } from '@/components/mobile/BottomNavigation';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Label } from '@/components/ui/label';
  import { Textarea } from '@/components/ui/textarea';
  import { Slider } from '@/components/ui/slider';
  import { Alert, AlertDescription } from '@/components/ui/alert';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
  import { useToast } from '@/hooks/use-toast';
  import { createSupabaseClient } from '@/lib/supabase';
  import supervisorStudentsAPI from '@/lib/api/supervisor-students';
import { getActiveRubric, EvaluationRubric, RubricCriterion } from '@/lib/api/supervisor-rubrics';
import { post } from '@/lib/api/client';

  interface Internship {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    position: string;
    company_name: string;
    start_date: string;
    end_date: string;
    latest_evaluation?: {
      id: string;
      status?: string;
      attendance?: string;
      punctuality?: string;
      supervisor_comments?: string;
      criterion_scores?: CriterionScore[];
    } | null;
  }

  interface CriterionScore {
    criterion_code: string;
    criterion_name: string;
    score: number;
  }

  export default function RubricBasedEvaluationPage() {
    const router = useRouter();
    const { toast } = useToast();
  
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
    // Data state
    const [rubric, setRubric] = useState<EvaluationRubric | null>(null);
    const [internship, setInternship] = useState<Internship | null>(null);
    const [internships, setInternships] = useState<Internship[]>([]);
    const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  
    // Form state - dynamic criterion scores
    const [criterionScores, setCriterionScores] = useState<Record<string, CriterionScore>>({});
    const [comments, setComments] = useState('');
    const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
    const [attendance, setAttendance] = useState<'regular' | 'irregular'>('regular');
    const [punctuality, setPunctuality] = useState<'regular' | 'irregular'>('regular');

    // Fetch rubric and internships
    useEffect(() => {
      Promise.all([fetchRubric(), fetchInternships()])
        .finally(() => setLoading(false));
    }, []);

    // When rubric is loaded after initial mount, load draft if not already loaded
    useEffect(() => {
      if (!rubric || !internship) return;
      
      // Only load draft if we haven't loaded one yet (status is still 'draft' initial state)
      if (status === 'draft' && Object.keys(criterionScores).length === rubric.criteria.length) {
        // Already loaded from initial rubric setup, don't override
        return;
      }
      
      // Load draft from current internship
      loadDraftFromInternship(internship);
    }, [rubric]);

    const fetchRubric = async () => {
      try {
        const activeRubric = await getActiveRubric();
        setRubric(activeRubric);
      
        // Initialize criterion scores from rubric
        const initialScores: Record<string, CriterionScore> = {};
        activeRubric.criteria.forEach((criterion: RubricCriterion, index: number) => {
          const criterionKey = criterion.code || criterion.id || `criterion-${index}`;
          initialScores[criterionKey] = {
            criterion_code: criterionKey,
            criterion_name: criterion.name,
            score: Math.ceil(criterion.max_score / 2), // Start at midpoint
          };
        });
        setCriterionScores(initialScores);
      } catch (error: any) {
        toast({
          title: 'Error Loading Rubric',
          description: error.message || 'Failed to fetch evaluation rubric. Please contact your administrator.',
          variant: 'destructive',
        });
      }
    };

    const fetchInternships = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const currentUserId = user.id;

        // Try PostgREST join first
        const { data: internshipsData, error } = await supabase
          .from('internships')
          .select(`
            *,
            users:student_id(first_name, last_name, email),
            companies:company_id(name)
          `)
          .eq('supervisor_id', user.id)
          .in('status', ['active', 'completed']);

        if (error || !internshipsData || internshipsData.some((int: any) => !int.users)) {
          console.log('Using backend API fallback (Supabase join not available due to RLS)');
          // Fallback to backend API which handles joins and RLS properly
          const studentsData = await supervisorStudentsAPI.getMyStudents();
          console.log('Backend students data:', studentsData);
          console.log('Backend students with evaluations:', studentsData.map(s => ({
            name: `${s.first_name} ${s.last_name}`,
            internship_id: s.internship?.id,
            has_evaluation: !!s.latest_evaluation,
            evaluation_status: s.latest_evaluation?.status
          })));
          
          const formattedFromBackend: Internship[] = studentsData
            .filter(student => student.internship)
            .map(student => ({
              id: student.internship!.id,
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              student_email: student.email,
              position: student.internship!.position || '',
              company_name: student.internship!.company?.name || 'Unknown Company',
              start_date: student.internship!.start_date || '',
              end_date: student.internship!.end_date || '',
              latest_evaluation: student.latest_evaluation,
            }));
          
          console.log('Formatted internships:', formattedFromBackend.map(i => ({
            student: i.student_name,
            has_draft: i.latest_evaluation?.status === 'draft',
            eval_status: i.latest_evaluation?.status
          })));
          
          setInternships(formattedFromBackend);
          if (formattedFromBackend.length > 0) {
            const firstInternship = formattedFromBackend[0];
            setSelectedInternshipId(firstInternship.id);
            setInternship(firstInternship);
            console.log('Loading draft for first internship:', {
              student: firstInternship.student_name,
              has_evaluation: !!firstInternship.latest_evaluation,
              status: firstInternship.latest_evaluation?.status
            });
            // Load draft if exists
            loadDraftFromInternship(firstInternship);
          }
          return;
        }

        console.log('Raw internships data (Supabase):', internshipsData);

        const formattedInternships: Internship[] = (internshipsData || []).map((int: any) => {
          const studentName = int.users 
            ? `${int.users.first_name} ${int.users.last_name}` 
            : 'Unknown Student';
          
          console.log('Internship processed:', {
            id: int.id,
            position: int.position,
            studentData: int.users,
            companyData: int.companies,
            studentName
          });
          
          return {
            id: int.id,
            student_id: int.student_id,
            student_name: studentName,
            student_email: int.users?.email || '',
            position: int.position,
            company_name: int.companies?.name || 'Unknown Company',
            start_date: int.start_date,
            end_date: int.end_date,
            latest_evaluation: int.latest_evaluation,
          };
        });

        setInternships(formattedInternships);
      
        if (formattedInternships.length > 0) {
          const firstInternship = formattedInternships[0];
          setSelectedInternshipId(firstInternship.id);
          setInternship(firstInternship);
          // Load draft if exists
          loadDraftFromInternship(firstInternship);
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch internships',
          variant: 'destructive',
        });
      }
    };

    const handleInternshipChange = (internshipId: string) => {
      setSelectedInternshipId(internshipId);
      const selected = internships.find(i => i.id === internshipId);
      if (selected) {
        setInternship(selected);
        // Load draft from selected internship data (already fetched from backend)
        loadDraftFromInternship(selected);
      }
    };

    // Load draft evaluation data from internship object (fetched from backend API)
    const loadDraftFromInternship = (internship: Internship) => {
      console.log('🔍 loadDraftFromInternship called:', {
        internship_id: internship.id,
        student: internship.student_name,
        has_evaluation: !!internship.latest_evaluation,
        evaluation_data: internship.latest_evaluation
      });
      
      const evaluation = internship.latest_evaluation;
      
      // Only load if it's a draft
      if (!evaluation || evaluation.status !== 'draft') {
        console.log('ℹ️ No draft found for this internship - status:', evaluation?.status || 'no evaluation');
        return;
      }

      console.log('✅ Loading draft evaluation:', evaluation);

      // Restore criterion scores
      const draftScores: Record<string, CriterionScore> = {};
      (evaluation.criterion_scores || []).forEach((s: CriterionScore, index: number) => {
        const key = s.criterion_code || `criterion-${index}`;
        draftScores[key] = {
          criterion_code: s.criterion_code,
          criterion_name: s.criterion_name,
          score: s.score,
        };
      });

      if (Object.keys(draftScores).length > 0) {
        setCriterionScores(draftScores);
        console.log('✅ Restored criterion scores:', draftScores);
      }

      // Restore other fields
      setAttendance((evaluation.attendance as any) || 'regular');
      setPunctuality((evaluation.punctuality as any) || 'regular');
      setComments(evaluation.supervisor_comments || '');
      setStatus('draft');
      
      console.log('✅ Draft loaded successfully');
    };

    const handleCriterionScoreChange = (criterionCode: string, score: number) => {
      console.log('🎯 Changing score:', { criterionCode, score });
      setCriterionScores(prev => {
        const existingCriterion = prev[criterionCode];
        if (!existingCriterion) {
          console.error('❌ Criterion not found in scores:', criterionCode);
          return prev;
        }
        const updated = {
          ...prev,
          [criterionCode]: {
            ...existingCriterion,
            score,
          },
        };
        console.log('✅ Updated scores:', updated);
        return updated;
      });
    };

    // Calculate ratings for the 4 required fields
    const calculateRatings = () => {
      if (!rubric) return { overall: 5, technical: 5, communication: 5, work_ethic: 5 };

      const scores = Object.values(criterionScores);
    
      // Map criteria to rating categories based on criterion codes or names
      const technical = scores.filter(s => 
        s.criterion_code.toLowerCase().includes('tech') || 
        s.criterion_code.toLowerCase().includes('skill') ||
        s.criterion_name.toLowerCase().includes('technical')
      );
    
      const communication = scores.filter(s => 
        s.criterion_code.toLowerCase().includes('comm') || 
        s.criterion_name.toLowerCase().includes('communication')
      );
    
      const work_ethic = scores.filter(s => 
        s.criterion_code.toLowerCase().includes('ethic') || 
        s.criterion_code.toLowerCase().includes('attitude') ||
        s.criterion_name.toLowerCase().includes('work ethic') ||
        s.criterion_name.toLowerCase().includes('dependability')
      );

      const avgScore = (arr: CriterionScore[]) => 
        arr.length > 0 ? Math.round(arr.reduce((sum, s) => sum + s.score, 0) / arr.length) : null;

      const overall = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) || 5;

      return {
        overall,
        technical: avgScore(technical),
        communication: avgScore(communication),
        work_ethic: avgScore(work_ethic),
      };
    };

    // Validate evaluation before showing confirmation
    const validateEvaluation = () => {
      if (!internship || !rubric) return false;

      // Comprehensive validation
      const allCriteriaScored = rubric.criteria.every((c, i) => {
        const key = c.id || c.code || `criterion-${i}`;
        return criterionScores[key];
      });
      if (!allCriteriaScored) {
        toast({
          title: 'Incomplete Evaluation',
          description: 'Please rate all performance criteria before submitting',
          variant: 'destructive',
        });
        return false;
      }

      if (!attendance || !punctuality) {
        toast({
          title: 'Validation Error',
          description: 'Attendance and punctuality are required',
          variant: 'destructive',
        });
        return false;
      }

      // Validation
      if (comments.trim().length < 50) {
        toast({
          title: 'Validation Error',
          description: 'Comments must be at least 50 characters',
          variant: 'destructive',
        });
        return false;
      }

      return true;
    };

    // Show confirmation dialog before submitting
    const handleShowConfirmation = () => {
      if (validateEvaluation()) {
        setShowConfirmDialog(true);
      }
    };

    const handleSubmitEvaluation = async () => {
      if (!internship || !rubric) return;
      
      setShowConfirmDialog(false);

      try {
        setSubmitting(true);

        // Prepare criterion scores for backend API
        const criterionScoreRecords = Object.values(criterionScores).map(score => ({
          criterion_code: score.criterion_code,
          criterion_name: score.criterion_name,
          score: score.score,
        }));

        // Use backend API to create and submit evaluation
        const evaluation: any = await post('/supervisor/evaluations', {
          internship_id: internship.id,
          criterion_scores: criterionScoreRecords,
          comments: comments.trim(),
          attendance,
          punctuality,
        });

        // Submit the evaluation
        await post(`/supervisor/evaluations/${evaluation.id}/submit`, {});

        toast({
          title: 'Evaluation Submitted',
          description: `Final evaluation for ${internship.student_name} has been submitted successfully`,
        });

        setStatus('submitted');
        router.push('/dashboard/supervisor/evaluations');
      } catch (error: any) {
        console.error('Submit error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit evaluation',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    };

    const handleSaveDraft = async () => {
      if (!internship || !rubric) return;

      // Check if at least one criterion is scored
      const hasScores = Object.keys(criterionScores).length > 0;
      if (!hasScores) {
        toast({
          title: 'No Scores',
          description: 'Please rate at least one criterion before saving',
          variant: 'destructive',
        });
        return;
      }

      try {
        setSaving(true);

        // Prepare criterion scores for backend API
        const criterionScoreRecords = Object.values(criterionScores).map(score => ({
          criterion_code: score.criterion_code,
          criterion_name: score.criterion_name,
          score: score.score,
        }));

        // Always use POST - backend will handle create or update logic
        await post('/supervisor/evaluations', {
          internship_id: internship.id,
          criterion_scores: criterionScoreRecords,
          comments: comments.trim() || null,
          attendance,
          punctuality,
        });

        toast({
          title: 'Draft Saved',
          description: 'Your evaluation has been saved as a draft',
        });
      } catch (error: any) {
        console.error('Save draft error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to save draft',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    };

    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!rubric) {
      return (
        <div className="h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">No Rubric Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No active evaluation rubric found for your university. Please contact your administrator.
              </p>
              <Button onClick={() => router.push('/dashboard/supervisor')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (internships.length === 0) {
      return (
        <div className="h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Internships Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You need active or completed internships to create final evaluations.
              </p>
              <Button onClick={() => router.push('/dashboard/supervisor')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="h-screen bg-background overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:flex h-full">
          <SupervisorSidebar />
        
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <SupervisorHeader />
          
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Final Evaluation</h1>
                    <p className="text-muted-foreground mt-1">
                      Rubric-based evaluation using {rubric.rubric_name}
                    </p>
                  </div>
                </div>

                {/* Rubric Info */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This evaluation uses the <strong>{rubric.rubric_name}</strong> rubric (Version {rubric.version}).
                    {rubric.description && ` ${rubric.description}`}
                  </AlertDescription>
                </Alert>

                {/* Intern Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Intern</CardTitle>
                    <CardDescription>Choose the intern to evaluate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Internship</Label>
                        <select
                          value={selectedInternshipId}
                          onChange={(e) => handleInternshipChange(e.target.value)}
                          disabled={status === 'submitted'}
                          className="w-full mt-2 p-2 border rounded-md"
                        >
                          {internships.map((int) => (
                            <option key={int.id} value={int.id}>
                              {int.student_name} - {int.position} at {int.company_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {internship && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Student</div>
                              <div className="font-medium">{internship.student_name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Company</div>
                              <div className="font-medium">{internship.company_name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Position</div>
                              <div className="font-medium">{internship.position}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Duration</div>
                              <div className="font-medium">
                                {new Date(internship.start_date).toLocaleDateString()} - {new Date(internship.end_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Rubric Criteria */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Criteria</CardTitle>
                    <CardDescription>Rate the intern based on each criterion from the rubric</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <>
                      {rubric.criteria?.map((criterion: RubricCriterion, index: number) => {
                        const criterionKey = criterion.code || criterion.id || `criterion-${index}`;
                        const currentScore = criterionScores[criterionKey]?.score ?? Math.ceil(criterion.max_score / 2);
                        return (
                          <div key={`${criterionKey}-${index}`} className="space-y-3 pb-6 border-b last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Label className="text-base font-semibold">{criterion.name}</Label>
                              <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                            </div>
                            <div className="text-2xl font-bold text-primary ml-4">
                              {currentScore}/{criterion.max_score}
                            </div>
                          </div>
                          <Slider
                            id={`slider-${criterionKey}`}
                            min={1}
                            max={criterion.max_score}
                            step={1}
                            value={[currentScore]}
                            onValueChange={(val) => handleCriterionScoreChange(criterionKey, val[0])}
                            disabled={status === 'submitted'}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 (Poor)</span>
                            <span>{Math.ceil(criterion.max_score / 2)} (Satisfactory)</span>
                            <span>{criterion.max_score} (Excellent)</span>
                          </div>
                        </div>
                        );
                      })}
                    </>
                  </CardContent>
                </Card>

                  {/* Attendance & Punctuality */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance & Punctuality</CardTitle>
                      <CardDescription>Select the trainee's attendance and punctuality status</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Attendance</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={attendance === 'regular' ? 'default' : 'outline'}
                            onClick={() => setAttendance('regular')}
                            disabled={status === 'submitted'}
                          >
                            Regular
                          </Button>
                          <Button
                            type="button"
                            variant={attendance === 'irregular' ? 'default' : 'outline'}
                            onClick={() => setAttendance('irregular')}
                            disabled={status === 'submitted'}
                          >
                            Irregular
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Punctuality</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={punctuality === 'regular' ? 'default' : 'outline'}
                            onClick={() => setPunctuality('regular')}
                            disabled={status === 'submitted'}
                          >
                            Regular
                          </Button>
                          <Button
                            type="button"
                            variant={punctuality === 'irregular' ? 'default' : 'outline'}
                            onClick={() => setPunctuality('irregular')}
                            disabled={status === 'submitted'}
                          >
                            Irregular
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                {/* Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Comments</CardTitle>
                    <CardDescription>
                      Provide detailed feedback on the intern's performance (minimum 50 characters)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Describe the intern's strengths, areas for improvement, and overall performance..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      disabled={status === 'submitted'}
                      className="min-h-[200px]"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      {comments.length} / 50 characters minimum
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end pb-6">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={saving || submitting || status === 'submitted'}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Draft...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleShowConfirmation}
                    disabled={submitting || saving || status === 'submitted'}
                    className="min-w-[180px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Evaluation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Confirm Submission
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-4">
                  <div>
                    You are about to submit the final evaluation for <strong>{internship?.student_name}</strong>.
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
                    <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      ⚠️ Important Notice:
                    </div>
                    <div className="text-yellow-700 dark:text-yellow-300">
                      Once submitted, this evaluation <strong>cannot be edited or changed</strong>. 
                      Please make sure all scores and comments are correct before proceeding.
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    The evaluation will be immediately visible to the advisor and admin.
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEvaluation}
                disabled={submitting}
                className="bg-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Yes, Submit Evaluation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mobile View */}
        <div className="lg:hidden flex flex-col h-full">
          <MobileHeader title="Final Evaluation" />
        
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="space-y-4">
              {/* Mobile content - same structure as desktop */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Using <strong>{rubric.rubric_name}</strong> (v{rubric.version})
                </AlertDescription>
              </Alert>

              {/* Rest of the mobile layout would go here - keeping it simple for now */}
              <Card>
                <CardHeader>
                  <CardTitle>Mobile View</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Please use desktop view for the best evaluation experience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <BottomNavigation type="supervisor" />
        </div>
      </div>
    );
  }
