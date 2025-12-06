/**
 * Supervisor AI Evaluations Page - REFACTORED WITH REAL API INTEGRATION
 * 
 * Integrates with backend AI service for real-time draft analysis and submission
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Send,
  Building2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { AIResultsPanel } from '@/components/supervisor/AIResultsPanel';
import { BiasWarningModal } from '@/components/supervisor/BiasWarningModal';
import { NewEvaluationModal } from '@/components/supervisor/NewEvaluationModal';
import { 
  useEvaluationAnalysis, 
  useSubmitEvaluation, 
  useSupervisorEvaluations 
} from '@/hooks/use-supervisor-evaluations';
import { 
  SupervisorEvaluation, 
  updateEvaluation 
} from '@/lib/api/supervisor-evaluations';

export default function SupervisorAIEvaluations() {
  const { toast } = useToast();

  // Fetch evaluations from API
  const { evaluations, isLoading: isLoadingEvals, error: evalsError, refetch } = useSupervisorEvaluations();
  
  // Selected evaluation state
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);
  const selectedEval = evaluations.find(e => e.id === selectedEvalId) || null;

  // New evaluation modal state
  const [showNewEvalModal, setShowNewEvalModal] = useState(false);

  // Form state
  const [feedbackText, setFeedbackText] = useState('');
  const [ratings, setRatings] = useState({
    technical: 5,
    communication: 5,
    workEthic: 5,
  });

  // Calculate overall rating (average of all ratings)
  const overallRating = Math.round((ratings.technical + ratings.communication + ratings.workEthic) / 3);

  // Real-time AI analysis (debounced)
  const { analysis, isLoading: isAnalyzing, error: analysisError } = useEvaluationAnalysis(feedbackText, 500);

  // Submission state
  const { submit, isSubmitting, error: submitError, result: submitResult, reset: resetSubmit } = useSubmitEvaluation();

  // Bias warning modal
  const [showBiasWarning, setShowBiasWarning] = useState(false);
  const [pendingSubmitId, setPendingSubmitId] = useState<string | null>(null);

  // Initialize form when evaluation is selected
  useEffect(() => {
    if (selectedEval) {
      setFeedbackText(selectedEval.feedback_text || '');
      setRatings({
        technical: selectedEval.rating_technical || 5,
        communication: selectedEval.rating_communication || 5,
        workEthic: selectedEval.rating_work_ethic || 5,
      });
    }
  }, [selectedEval]);

  // Auto-select first evaluation
  useEffect(() => {
    if (evaluations.length > 0 && !selectedEvalId) {
      setSelectedEvalId(evaluations[0].id);
    }
  }, [evaluations, selectedEvalId]);

  // Handle evaluation selection
  const handleSelectEvaluation = (evalId: string) => {
    setSelectedEvalId(evalId);
    resetSubmit();
  };

  // Handle rating changes
  const handleRatingChange = (key: string, value: number[]) => {
    setRatings(prev => ({ ...prev, [key]: value[0] }));
  };

  // Handle feedback change
  const handleFeedbackChange = (text: string) => {
    setFeedbackText(text);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedEval) {
      toast({
        title: 'No Evaluation Selected',
        description: 'Please select an evaluation to submit.',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (feedbackText.trim().length < 10) {
      toast({
        title: 'Feedback Too Short',
        description: 'Please provide at least 10 characters of feedback.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Update evaluation with current form data before submitting
      await updateEvaluation(selectedEval.id, {
        feedback_text: feedbackText,
        rating_technical: ratings.technical,
        rating_communication: ratings.communication,
        rating_work_ethic: ratings.workEthic,
        rating_overall: overallRating,
        internship_id: selectedEval.internship_id,
        supervisor_id: selectedEval.supervisor_id,
      });

      // Step 2: Submit for AI processing
      const result = await submit(selectedEval.id);

      // Check for high bias severity
      if (result.ai_analysis?.potential_biases && result.ai_analysis.potential_biases.length > 0) {
        // Show bias warning modal for review
        setPendingSubmitId(selectedEval.id);
        setShowBiasWarning(true);
      } else {
        // Success - no bias warnings
        toast({
          title: 'Evaluation Submitted',
          description: 'Your evaluation has been successfully submitted and processed by AI.',
        });
        refetch(); // Refresh evaluations list
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit evaluation',
        variant: 'destructive',
      });
    }
  };

  // Handle bias warning confirmation
  const handleBiasWarningConfirm = () => {
    setShowBiasWarning(false);
    toast({
      title: 'Evaluation Submitted',
      description: 'Your evaluation has been submitted despite bias warnings.',
    });
    refetch();
  };

  // Handle new evaluation creation success
  const handleNewEvaluationSuccess = (evaluationId: string) => {
    toast({
      title: 'Evaluation Created',
      description: 'New evaluation draft created successfully.',
    });
    refetch(); // Refresh evaluations list
    setSelectedEvalId(evaluationId); // Auto-select the new evaluation
  };

  // Calculate stats
  const stats = {
    total: evaluations.length,
    draft: evaluations.filter(e => e.status === 'draft').length,
    submitted: evaluations.filter(e => e.status === 'submitted').length,
    completed: evaluations.filter(e => e.status === 'processed' || e.status === 'approved').length,
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-primary/10 text-primary border-primary/20';
      case 'processed': return 'bg-success/10 text-success border-success/20';
      case 'approved': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      {/* New Evaluation Modal */}
      <NewEvaluationModal
        isOpen={showNewEvalModal}
        onClose={() => setShowNewEvalModal(false)}
        onSuccess={handleNewEvaluationSuccess}
      />

      {/* Bias Warning Modal */}
      {submitResult?.ai_analysis && (
        <BiasWarningModal
          isOpen={showBiasWarning}
          onClose={() => setShowBiasWarning(false)}
          onConfirm={handleBiasWarningConfirm}
          biasFlags={submitResult.ai_analysis.potential_biases}
          severity={submitResult.ai_analysis.potential_biases.length > 3 ? 'high' : 'medium'}
          consistencyScore={submitResult.ai_analysis.overall_confidence_score}
        />
      )}

      <div className="h-screen bg-background overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:flex h-full">
          <SupervisorSidebar />
          
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <SupervisorHeader />
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">AI Evaluations</h1>
                    <p className="text-muted-foreground mt-1">Create and submit AI-powered evaluations</p>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setShowNewEvalModal(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    New Evaluation
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total Evaluations</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
                      <div className="text-sm text-muted-foreground">Drafts</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-primary">{stats.submitted}</div>
                      <div className="text-sm text-muted-foreground">Submitted</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-success">{stats.completed}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Grid: List | Form | AI Results */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Evaluations List */}
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="text-lg">Evaluations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {isLoadingEvals ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : evalsError ? (
                        <div className="text-sm text-destructive">{evalsError}</div>
                      ) : evaluations.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No evaluations found
                        </div>
                      ) : (
                        evaluations.map((evaluation) => (
                          <button
                            key={evaluation.id}
                            onClick={() => handleSelectEvaluation(evaluation.id)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                              selectedEvalId === evaluation.id
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'hover:bg-accent border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-foreground text-sm">
                                {evaluation.internship?.student 
                                  ? `${evaluation.internship.student.first_name} ${evaluation.internship.student.last_name}`
                                  : 'Unknown Student'}
                              </div>
                              <Badge className={getStatusColor(evaluation.status)}>
                                {evaluation.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {evaluation.internship?.position || 'No position'}
                            </div>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Evaluation Form */}
                  <Card className="lg:col-span-5">
                    {selectedEval ? (
                      <>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>
                                {selectedEval.internship?.student
                                  ? `${selectedEval.internship.student.first_name} ${selectedEval.internship.student.last_name}`
                                  : 'Evaluation Form'}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedEval.internship?.position || 'No position'}
                              </p>
                            </div>
                            <Badge className={getStatusColor(selectedEval.status)}>
                              {selectedEval.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Performance Ratings */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Performance Ratings</h3>
                            {Object.entries(ratings).map(([key, value]) => (
                              <div key={key}>
                                <div className="flex justify-between mb-2">
                                  <Label className="capitalize text-foreground">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </Label>
                                  <span className="text-sm font-semibold text-primary">{value}/10</span>
                                </div>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[value]}
                                  onValueChange={(val) => handleRatingChange(key, val)}
                                  disabled={selectedEval.status !== 'draft'}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>1</span>
                                  <span>5</span>
                                  <span>10</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Detailed Feedback */}
                          <div>
                            <Label>Detailed Feedback</Label>
                            <Textarea
                              value={feedbackText}
                              onChange={(e) => handleFeedbackChange(e.target.value)}
                              placeholder="Provide specific feedback about the student's performance, achievements, and areas for improvement..."
                              className="mt-2 min-h-[200px]"
                              disabled={selectedEval.status !== 'draft'}
                              maxLength={5000}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              {feedbackText.length}/5000 characters
                            </p>
                          </div>

                          {/* Submit Actions */}
                          {selectedEval.status === 'draft' && (
                            <div className="flex gap-3 pt-4">
                              <Button
                                className="flex-1 bg-primary hover:bg-primary/90"
                                onClick={handleSubmit}
                                disabled={isSubmitting || feedbackText.trim().length < 10}
                              >
                                {isSubmitting ? (
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
                          )}

                          {/* Submission Error */}
                          {submitError && (
                            <div className="flex items-start space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-destructive">{submitError}</div>
                            </div>
                          )}
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Select an evaluation to view details</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* AI Results Panel - Phase 1 Enhanced */}
                  <div className="lg:col-span-4">
                    {selectedEval && selectedEval.status === 'draft' ? (
                      <AIResultsPanel
                        analysis={analysis}
                        isLoading={isAnalyzing}
                        error={analysisError}
                        currentRating={overallRating}
                      />
                    ) : selectedEval && submitResult?.ai_analysis ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-primary" />
                            AI Analysis Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="pt-6 text-center">
                                <div className="text-3xl font-bold text-primary">
                                  {Math.round(submitResult.ai_analysis.overall_confidence_score * 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Confidence</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6 text-center">
                                <div className="text-3xl font-bold text-success">
                                  {submitResult.ai_analysis.potential_biases.length === 0 ? '✓' : '!'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {submitResult.ai_analysis.potential_biases.length === 0 ? 'No Bias' : 'Review'}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">Evaluation submitted successfully</span>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            AI analysis will appear here for draft evaluations
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden h-screen flex flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <MobileHeader 
              title="AI Evaluations"
              subtitle="Supervisor Dashboard"
              logo={
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              }
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
            {/* Stats - Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-primary">{stats.draft}</div>
                  <div className="text-xs text-muted-foreground">Drafts</div>
                </CardContent>
              </Card>
            </div>

            {/* Evaluations List - Mobile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evaluations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingEvals ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  evaluations.map((evaluation) => (
                    <button
                      key={evaluation.id}
                      onClick={() => handleSelectEvaluation(evaluation.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedEvalId === evaluation.id
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : 'hover:bg-accent border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-foreground text-sm">
                          {evaluation.internship?.student
                            ? `${evaluation.internship.student.first_name} ${evaluation.internship.student.last_name}`
                            : 'Unknown'}
                        </div>
                        <Badge className={getStatusColor(evaluation.status)}>
                          {evaluation.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {evaluation.internship?.position || 'No position'}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Selected Evaluation Form - Mobile */}
            {selectedEval && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedEval.internship?.student
                      ? `${selectedEval.internship.student.first_name} ${selectedEval.internship.student.last_name}`
                      : 'Evaluation'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="form" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="form">Form</TabsTrigger>
                      <TabsTrigger value="ai-results" className="flex items-center gap-2">
                        AI Results
                        {isAnalyzing && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="form" className="space-y-4">
                      {/* Ratings - Mobile */}
                      <div className="space-y-4">
                        {Object.entries(ratings).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between mb-2">
                              <Label className="capitalize text-sm">{key}</Label>
                              <span className="text-sm font-semibold text-primary">{value}/10</span>
                            </div>
                            <Slider
                              min={1}
                              max={10}
                              step={1}
                              value={[value]}
                              onValueChange={(val) => handleRatingChange(key, val)}
                              disabled={selectedEval.status !== 'draft'}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Feedback - Mobile */}
                      <div>
                        <Label>Feedback</Label>
                        <Textarea
                          value={feedbackText}
                          onChange={(e) => handleFeedbackChange(e.target.value)}
                          placeholder="Provide detailed feedback..."
                          className="mt-2 min-h-32"
                          disabled={selectedEval.status !== 'draft'}
                          maxLength={5000}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {feedbackText.length}/5000
                        </p>
                      </div>

                      {/* Submit - Mobile */}
                      {selectedEval.status === 'draft' && (
                        <Button
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit
                            </>
                          )}
                        </Button>
                      )}
                    </TabsContent>

                    <TabsContent value="ai-results" className="space-y-4">
                      <AIResultsPanel
                        analysis={analysis}
                        isLoading={isAnalyzing}
                        error={analysisError}
                        currentRating={overallRating}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex-shrink-0">
            <BottomNavigation type="supervisor" />
          </div>
        </div>
      </div>
    </>
  );
}
