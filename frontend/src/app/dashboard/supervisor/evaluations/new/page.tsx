'use client';

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
  ArrowLeft
} from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';

interface Internship {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  position: string;
  company_name: string;
  start_date: string;
  end_date: string;
}

interface CriteriaRating {
  score: number;
  description: string;
}

interface EvaluationCriteria {
  quality_of_work: CriteriaRating;
  attitude: CriteriaRating;
  judgment: CriteriaRating;
  cooperation: CriteriaRating;
  dependability: CriteriaRating;
  comprehension: CriteriaRating;
  safety: CriteriaRating;
}

const CRITERIA_LABELS = {
  quality_of_work: {
    label: 'A. Quality of Work',
    description: 'Thoroughness, accuracy, and care in work performance',
  },
  attitude: {
    label: 'B. Attitude',
    description: 'Enthusiasm, interest, and positive approach to work',
  },
  judgment: {
    label: 'C. Judgment',
    description: 'Decision-making ability and problem-solving skills',
  },
  cooperation: {
    label: 'D. Cooperation',
    description: 'Ability to work well with others and be a team player',
  },
  dependability: {
    label: 'E. Dependability',
    description: 'Reliability, punctuality, and following through on commitments',
  },
  comprehension: {
    label: 'F. Comprehension',
    description: 'Understanding of instructions and ability to learn',
  },
  safety: {
    label: 'G. Safety',
    description: 'Awareness and adherence to safety practices',
  },
};

const SCALE_DESCRIPTIONS = {
  1: '1-2: Poor - Significant improvement needed',
  3: '3-4: Below Average - Needs improvement',
  5: '5-6: Satisfactory - Meets basic expectations',
  7: '7-8: Good - Exceeds expectations',
  9: '9-10: Excellent - Outstanding performance',
};

// Grade equivalent mapping (CvSU system)
const GRADE_MAPPING = [
  { min: 97, max: 100, grade: 1.0 },
  { min: 94, max: 96, grade: 1.25 },
  { min: 91, max: 93, grade: 1.5 },
  { min: 88, max: 90, grade: 1.75 },
  { min: 85, max: 87, grade: 2.0 },
  { min: 82, max: 84, grade: 2.25 },
  { min: 79, max: 81, grade: 2.5 },
  { min: 76, max: 78, grade: 2.75 },
  { min: 75, max: 75, grade: 3.0 },
  { min: 70, max: 74, grade: 4.0 },
  { min: 0, max: 69, grade: 5.0 },
];

export default function FinalEvaluationPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Data state
  const [internship, setInternship] = useState<Internship | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  
  // Form state
  const [criteria, setCriteria] = useState<EvaluationCriteria>({
    quality_of_work: { score: 5, description: '' },
    attitude: { score: 5, description: '' },
    judgment: { score: 5, description: '' },
    cooperation: { score: 5, description: '' },
    dependability: { score: 5, description: '' },
    comprehension: { score: 5, description: '' },
    safety: { score: 5, description: '' },
  });
  
  const [attendance, setAttendance] = useState({
    total_days: 0,
    days_present: 0,
    days_absent: 0,
    days_late: 0,
  });
  
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');

  // Auto-save effect
  useEffect(() => {
    if (status === 'draft') {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      
      const timer = setTimeout(() => {
        handleSaveDraft(true); // Silent save
      }, 30000); // 30 seconds
      
      setAutoSaveTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [criteria, attendance, comments, status]);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get all active/completed internships supervised by this user
      const { data: internshipsData, error } = await supabase
        .from('internships')
        .select(`
          id,
          position,
          start_date,
          end_date,
          student_id,
          status,
          users!internships_student_id_fkey(
            id,
            email,
            first_name,
            last_name
          ),
          companies(name)
        `)
        .eq('supervisor_id', user.id)
        .in('status', ['active', 'completed', 'ongoing'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInternships: Internship[] = (internshipsData || []).map((int: any) => ({
        id: int.id,
        student_id: int.student_id,
        student_name: int.users 
          ? `${int.users.first_name} ${int.users.last_name}` 
          : 'Unknown Student',
        student_email: int.users?.email || '',
        position: int.position,
        company_name: (int.companies as any)?.name || 'Unknown Company',
        start_date: int.start_date,
        end_date: int.end_date,
      }));

      setInternships(formattedInternships);
      
      // Auto-select first internship if available
      if (formattedInternships.length > 0) {
        setSelectedInternshipId(formattedInternships[0].id);
        setInternship(formattedInternships[0]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch internships',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInternshipChange = (internshipId: string) => {
    setSelectedInternshipId(internshipId);
    const selected = internships.find(i => i.id === internshipId);
    if (selected) {
      setInternship(selected);
    }
  };

  const handleCriteriaChange = (criteriaKey: keyof EvaluationCriteria, score: number) => {
    setCriteria(prev => ({
      ...prev,
      [criteriaKey]: { ...prev[criteriaKey], score },
    }));
  };

  const calculateTotalScore = (): number => {
    return Object.values(criteria).reduce((sum, criterion) => sum + criterion.score, 0);
  };

  const calculatePercentage = (): number => {
    const totalScore = calculateTotalScore();
    const maxScore = 70; // 7 criteria × 10 points each
    return Math.round((totalScore / maxScore) * 100);
  };

  const getGradeEquivalent = (): number => {
    const percentage = calculatePercentage();
    const gradeInfo = GRADE_MAPPING.find(g => percentage >= g.min && percentage <= g.max);
    return gradeInfo?.grade || 5.0;
  };

  const handleSaveDraft = async (silent = false) => {
    if (!internship) return;

    try {
      setSaving(true);
      const supabase = createSupabaseClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const evaluationData = {
        internship_id: internship.id,
        supervisor_id: user.id,
        student_id: internship.student_id,
        evaluation_type: 'final',
        
        // CvSU Criteria (A-G)
        quality_of_work: criteria.quality_of_work.score,
        attitude: criteria.attitude.score,
        judgment: criteria.judgment.score,
        cooperation: criteria.cooperation.score,
        dependability: criteria.dependability.score,
        comprehension: criteria.comprehension.score,
        safety: criteria.safety.score,
        
        // Attendance
        total_days: attendance.total_days,
        days_present: attendance.days_present,
        days_absent: attendance.days_absent,
        days_late: attendance.days_late,
        
        // Calculated fields
        total_score: calculateTotalScore(),
        percentage_score: calculatePercentage(),
        final_grade: getGradeEquivalent(),
        
        // Comments
        comments: comments.trim() || null,
        
        status: 'draft',
      };

      // Check if draft already exists
      const { data: existing, error: checkError } = await supabase
        .from('evaluations')
        .select('id')
        .eq('internship_id', internship.id)
        .eq('evaluation_type', 'final')
        .eq('status', 'draft')
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        // Update existing draft
        const { error } = await supabase
          .from('evaluations')
          .update(evaluationData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await supabase
          .from('evaluations')
          .insert(evaluationData);

        if (error) throw error;
      }

      if (!silent) {
        toast({
          title: 'Draft Saved',
          description: 'Your evaluation has been saved as a draft',
        });
      }
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save draft',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!internship) return;

    // Validation
    if (comments.trim().length < 50) {
      toast({
        title: 'Validation Error',
        description: 'Comments must be at least 50 characters',
        variant: 'destructive',
      });
      return;
    }

    if (attendance.total_days <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter attendance information',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const evaluationData = {
        internship_id: internship.id,
        supervisor_id: user.id,
        student_id: internship.student_id,
        evaluation_type: 'final',
        
        // CvSU Criteria (A-G)
        quality_of_work: criteria.quality_of_work.score,
        attitude: criteria.attitude.score,
        judgment: criteria.judgment.score,
        cooperation: criteria.cooperation.score,
        dependability: criteria.dependability.score,
        comprehension: criteria.comprehension.score,
        safety: criteria.safety.score,
        
        // Attendance
        total_days: attendance.total_days,
        days_present: attendance.days_present,
        days_absent: attendance.days_absent,
        days_late: attendance.days_late,
        
        // Calculated fields
        total_score: calculateTotalScore(),
        percentage_score: calculatePercentage(),
        final_grade: getGradeEquivalent(),
        
        // Comments
        comments: comments.trim(),
        
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      // Check if draft exists to update, otherwise insert
      const { data: existing, error: checkError } = await supabase
        .from('evaluations')
        .select('id')
        .eq('internship_id', internship.id)
        .eq('evaluation_type', 'final')
        .eq('status', 'draft')
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        const { error } = await supabase
          .from('evaluations')
          .update(evaluationData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('evaluations')
          .insert(evaluationData);

        if (error) throw error;
      }

      toast({
        title: 'Evaluation Submitted',
        description: `Final evaluation for ${internship.student_name} has been submitted successfully`,
      });

      setStatus('submitted');
      router.push('/dashboard/supervisor/evaluations');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit evaluation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const totalScore = calculateTotalScore();
  const percentage = calculatePercentage();
  const gradeEquivalent = getGradeEquivalent();

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
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">Final Evaluation Form</h1>
                  <p className="text-muted-foreground mt-1">CvSU Performance Rating (7 Criteria)</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleSaveDraft(false)}
                    disabled={saving || status === 'submitted'}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Draft
                  </Button>
                  <Button 
                    onClick={handleSubmitEvaluation}
                    disabled={submitting || status === 'submitted'}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Evaluation
                  </Button>
                </div>
              </div>

              {/* Internship Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Intern</CardTitle>
                  <CardDescription>Choose the internship to evaluate</CardDescription>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedInternshipId}
                    onChange={(e) => handleInternshipChange(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    disabled={status === 'submitted'}
                  >
                    {internships.map((int) => (
                      <option key={int.id} value={int.id}>
                        {int.student_name} - {int.position} at {int.company_name}
                      </option>
                    ))}
                  </select>
                  
                  {internship && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
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
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Period</div>
                          <div className="font-medium text-xs">
                            {new Date(internship.start_date).toLocaleDateString()} - {new Date(internship.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score Summary */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-primary">{totalScore}/70</div>
                      <div className="text-sm text-muted-foreground mt-1">Total Score</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{percentage}%</div>
                      <div className="text-sm text-muted-foreground mt-1">Percentage</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">{gradeEquivalent.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground mt-1">Grade Equivalent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CvSU Criteria (A-G) */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Criteria (1-10 Scale)</CardTitle>
                  <CardDescription>Rate the intern's performance on each criterion</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(CRITERIA_LABELS).map(([key, { label, description }]) => (
                    <div key={key} className="space-y-3 pb-6 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Label className="text-base font-semibold">{label}</Label>
                          <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        </div>
                        <div className="text-2xl font-bold text-primary ml-4">
                          {criteria[key as keyof EvaluationCriteria].score}/10
                        </div>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[criteria[key as keyof EvaluationCriteria].score]}
                        onValueChange={(val) => handleCriteriaChange(key as keyof EvaluationCriteria, val[0])}
                        disabled={status === 'submitted'}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 (Poor)</span>
                        <span>5 (Satisfactory)</span>
                        <span>10 (Excellent)</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Scale Reference */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Rating Scale Reference:</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {Object.values(SCALE_DESCRIPTIONS).map((desc, idx) => (
                        <div key={idx}>• {desc}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance & Punctuality</CardTitle>
                  <CardDescription>Record the intern's attendance during the internship period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Total Days</Label>
                      <Input
                        type="number"
                        min="0"
                        value={attendance.total_days}
                        onChange={(e) => setAttendance({ ...attendance, total_days: parseInt(e.target.value) || 0 })}
                        disabled={status === 'submitted'}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Days Present</Label>
                      <Input
                        type="number"
                        min="0"
                        value={attendance.days_present}
                        onChange={(e) => setAttendance({ ...attendance, days_present: parseInt(e.target.value) || 0 })}
                        disabled={status === 'submitted'}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Days Absent</Label>
                      <Input
                        type="number"
                        min="0"
                        value={attendance.days_absent}
                        onChange={(e) => setAttendance({ ...attendance, days_absent: parseInt(e.target.value) || 0 })}
                        disabled={status === 'submitted'}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Days Late</Label>
                      <Input
                        type="number"
                        min="0"
                        value={attendance.days_late}
                        onChange={(e) => setAttendance({ ...attendance, days_late: parseInt(e.target.value) || 0 })}
                        disabled={status === 'submitted'}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>Supervisor Comments <span className="text-destructive">*</span></CardTitle>
                  <CardDescription>
                    Provide detailed feedback about the intern's overall performance (minimum 50 characters)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide specific examples of the intern's strengths, areas for improvement, and overall contribution to the organization..."
                    rows={8}
                    disabled={status === 'submitted'}
                    maxLength={5000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{comments.length} / 50 characters minimum</span>
                    <span>{comments.length} / 5000 characters</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Final Evaluation"
          subtitle="CvSU Performance Rating"
        />

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Score Summary */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-primary">{totalScore}/70</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{percentage}%</div>
                    <div className="text-xs text-muted-foreground">Percent</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{gradeEquivalent.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Intern Selection */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <Label className="text-sm mb-2 block">Select Intern</Label>
                <select
                  value={selectedInternshipId}
                  onChange={(e) => handleInternshipChange(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  disabled={status === 'submitted'}
                >
                  {internships.map((int) => (
                    <option key={int.id} value={int.id}>
                      {int.student_name} - {int.position}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Mobile Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(CRITERIA_LABELS).map(([key, { label }]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">{label}</Label>
                      <span className="text-sm font-bold text-primary">
                        {criteria[key as keyof EvaluationCriteria].score}/10
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[criteria[key as keyof EvaluationCriteria].score]}
                      onValueChange={(val) => handleCriteriaChange(key as keyof EvaluationCriteria, val[0])}
                      disabled={status === 'submitted'}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Mobile Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attendance</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Total Days</Label>
                  <Input
                    type="number"
                    value={attendance.total_days}
                    onChange={(e) => setAttendance({ ...attendance, total_days: parseInt(e.target.value) || 0 })}
                    disabled={status === 'submitted'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Present</Label>
                  <Input
                    type="number"
                    value={attendance.days_present}
                    onChange={(e) => setAttendance({ ...attendance, days_present: parseInt(e.target.value) || 0 })}
                    disabled={status === 'submitted'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Absent</Label>
                  <Input
                    type="number"
                    value={attendance.days_absent}
                    onChange={(e) => setAttendance({ ...attendance, days_absent: parseInt(e.target.value) || 0 })}
                    disabled={status === 'submitted'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Late</Label>
                  <Input
                    type="number"
                    value={attendance.days_late}
                    onChange={(e) => setAttendance({ ...attendance, days_late: parseInt(e.target.value) || 0 })}
                    disabled={status === 'submitted'}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mobile Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comments (50 min)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Detailed feedback..."
                  rows={6}
                  disabled={status === 'submitted'}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {comments.length} / 50 min
                </p>
              </CardContent>
            </Card>

            {/* Mobile Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => handleSaveDraft(false)}
                disabled={saving || status === 'submitted'}
                className="flex-1"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              <Button 
                onClick={handleSubmitEvaluation}
                disabled={submitting || status === 'submitted'}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit
              </Button>
            </div>
          </div>
        </div>

        <BottomNavigation type="supervisor" />
      </div>
    </div>
  );
}
