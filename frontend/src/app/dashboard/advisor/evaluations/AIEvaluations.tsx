'use client';

import { useState } from 'react';
import { Brain, Zap, AlertCircle, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AIEvaluation {
  id: string;
  student: string;
  internship: string;
  submittedDate: string;
  status: 'pending' | 'processing' | 'completed' | 'reviewed';
  aiScore: number | null;
  confidence: number | null;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  } | null;
  recommendedGrade: string | null;
  biasCheck: boolean | null;
  feedback: string;
  supervisorRating: number;
}

const mockEvaluations: AIEvaluation[] = [
  {
    id: '1',
    student: 'Alice Johnson',
    internship: 'Software Engineering Intern - Tech Corp',
    submittedDate: '2025-11-08',
    status: 'completed',
    aiScore: 4.5,
    confidence: 92,
    sentiment: {
      positive: 85,
      neutral: 10,
      negative: 5
    },
    recommendedGrade: 'A',
    biasCheck: true,
    feedback: 'Excellent technical skills and communication. Shows strong initiative and problem-solving abilities.',
    supervisorRating: 4.6
  },
  {
    id: '2',
    student: 'Bob Martinez',
    internship: 'Data Analyst Intern - DataWorks Inc',
    submittedDate: '2025-11-10',
    status: 'processing',
    aiScore: null,
    confidence: null,
    sentiment: null,
    recommendedGrade: null,
    biasCheck: null,
    feedback: 'Good analytical skills. Working on improving presentation and documentation.',
    supervisorRating: 4.2
  },
  {
    id: '3',
    student: 'Charlie Davis',
    internship: 'UI/UX Design Intern - Creative Agency',
    submittedDate: '2025-11-05',
    status: 'reviewed',
    aiScore: 4.3,
    confidence: 88,
    sentiment: {
      positive: 80,
      neutral: 15,
      negative: 5
    },
    recommendedGrade: 'A-',
    biasCheck: true,
    feedback: 'Creative and detail-oriented. Excellent collaboration with the design team.',
    supervisorRating: 4.4
  }
];

export default function AIEvaluations() {
  const [selectedEvaluation, setSelectedEvaluation] = useState<string | null>(mockEvaluations[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const currentEval = mockEvaluations.find(e => e.id === selectedEvaluation);

  const filteredEvaluations = mockEvaluations.filter(evaluation => 
    filterStatus === 'all' || evaluation.status === filterStatus
  );

  const stats = {
    total: mockEvaluations.length,
    pending: mockEvaluations.filter(e => e.status === 'pending').length,
    processing: mockEvaluations.filter(e => e.status === 'processing').length,
    needsReview: mockEvaluations.filter(e => e.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning';
      case 'processing': return 'bg-primary/10 text-primary';
      case 'completed': return 'bg-ai/10 text-ai';
      case 'reviewed': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Zap className="w-4 h-4" />;
      case 'completed': return <Brain className="w-4 h-4" />;
      case 'reviewed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdvisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdvisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI-Powered Evaluations</h1>
                <p className="text-muted-foreground mt-1">Review AI-analyzed student evaluations with LLT-Sentiment fusion</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Evaluations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-warning/10 rounded-lg">
                        <Clock className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{stats.processing}</div>
                        <div className="text-sm text-muted-foreground">Processing</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-ai/10 rounded-lg">
                        <Brain className="w-6 h-6 text-ai" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-ai">{stats.needsReview}</div>
                        <div className="text-sm text-muted-foreground">Needs Review</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evaluations List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Evaluations</CardTitle>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredEvaluations.map((evaluation) => (
                      <button
                        key={evaluation.id}
                        onClick={() => setSelectedEvaluation(evaluation.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedEvaluation === evaluation.id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-foreground text-sm">{evaluation.student}</div>
                          <Badge className={getStatusColor(evaluation.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(evaluation.status)}
                              {evaluation.status}
                            </span>
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{evaluation.internship}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Submitted: {new Date(evaluation.submittedDate).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Evaluation Details */}
                <Card className="lg:col-span-2">
                  {currentEval ? (
                    <>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{currentEval.student}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{currentEval.internship}</p>
                          </div>
                          <Badge className={getStatusColor(currentEval.status)}>
                            {currentEval.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="ai-analysis" className="space-y-4">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
                            <TabsTrigger value="review">Review & Approve</TabsTrigger>
                          </TabsList>

                          <TabsContent value="ai-analysis" className="space-y-6">
                            {currentEval.status === 'processing' ? (
                              <div className="text-center py-12">
                                <Zap className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                                <p className="text-foreground font-semibold">AI Processing in Progress</p>
                                <p className="text-sm text-muted-foreground mt-2">Analyzing feedback with LLT-Sentiment fusion...</p>
                              </div>
                            ) : currentEval.aiScore !== null ? (
                              <>
                                {/* AI Score */}
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardContent className="pt-6 text-center">
                                      <div className="text-4xl font-bold text-ai">{currentEval.aiScore}</div>
                                      <div className="text-sm text-muted-foreground mt-1">AI Score</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="pt-6 text-center">
                                      <div className="text-4xl font-bold text-primary">{currentEval.confidence}%</div>
                                      <div className="text-sm text-muted-foreground mt-1">Confidence</div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Sentiment Analysis */}
                                {currentEval.sentiment && (
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-3">Sentiment Analysis</h3>
                                    <div className="space-y-3">
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm text-muted-foreground">Positive</span>
                                          <span className="text-sm font-semibold text-success">{currentEval.sentiment.positive}%</span>
                                        </div>
                                        <Progress value={currentEval.sentiment.positive} className="h-2" />
                                      </div>
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm text-muted-foreground">Neutral</span>
                                          <span className="text-sm font-semibold text-muted-foreground">{currentEval.sentiment.neutral}%</span>
                                        </div>
                                        <Progress value={currentEval.sentiment.neutral} className="h-2" />
                                      </div>
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm text-muted-foreground">Negative</span>
                                          <span className="text-sm font-semibold text-destructive">{currentEval.sentiment.negative}%</span>
                                        </div>
                                        <Progress value={currentEval.sentiment.negative} className="h-2" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Recommended Grade */}
                                <Card className="border-l-4 border-l-ai">
                                  <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm text-muted-foreground">AI Recommended Grade</div>
                                        <div className="text-3xl font-bold text-ai mt-1">{currentEval.recommendedGrade}</div>
                                      </div>
                                      {currentEval.biasCheck && (
                                        <div className="text-right">
                                          <CheckCircle className="w-8 h-8 text-success mb-1" />
                                          <div className="text-xs text-success font-semibold">Bias Check Passed</div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Feedback */}
                                <div>
                                  <h3 className="font-semibold text-foreground mb-2">Supervisor Feedback</h3>
                                  <div className="p-4 bg-muted/50 rounded-lg text-foreground">
                                    {currentEval.feedback}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No AI analysis available yet</p>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="review" className="space-y-4">
                            <div>
                              <Label>Final Grade</Label>
                              <Select defaultValue={currentEval.recommendedGrade || ''}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">A (Excellent)</SelectItem>
                                  <SelectItem value="A-">A- (Very Good)</SelectItem>
                                  <SelectItem value="B+">B+ (Good)</SelectItem>
                                  <SelectItem value="B">B (Above Average)</SelectItem>
                                  <SelectItem value="B-">B- (Average)</SelectItem>
                                  <SelectItem value="C+">C+ (Below Average)</SelectItem>
                                  <SelectItem value="C">C (Poor)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Advisor Comments</Label>
                              <Textarea 
                                placeholder="Add your comments and feedback..."
                                className="mt-2 min-h-32"
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button className="flex-1 bg-primary hover:bg-primary/90">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Evaluation
                              </Button>
                              <Button variant="outline" className="flex-1">
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                              </Button>
                            </div>

                            <Card className="bg-primary/10 border-primary/20">
                              <CardContent className="pt-4">
                                <div className="flex gap-3">
                                  <Brain className="w-5 h-5 text-ai flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">AI Recommendation</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Based on LLT-Sentiment analysis, this evaluation shows strong positive indicators 
                                      with high confidence. The recommended grade of {currentEval.recommendedGrade} aligns 
                                      with the supervisor's rating of {currentEval.supervisorRating}/5.
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Select an evaluation to view details</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="AI Evaluations"
          subtitle="Review AI-analyzed evaluations"
          notificationCount={15}
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{stats.processing}</div>
                <div className="text-xs text-muted-foreground">Processing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-ai">{stats.needsReview}</div>
                <div className="text-xs text-muted-foreground">Needs Review</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardContent className="pt-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Evaluations List - Mobile */}
          <div className="space-y-3">
            {filteredEvaluations.map((evaluation) => (
              <Card 
                key={evaluation.id}
                className={selectedEvaluation === evaluation.id ? 'border-primary' : ''}
              >
                <CardContent className="pt-4">
                  <button
                    onClick={() => setSelectedEvaluation(evaluation.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">{evaluation.student}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{evaluation.internship}</p>
                      </div>
                      <Badge className={getStatusColor(evaluation.status)}>
                        <span className="flex items-center gap-1 text-xs">
                          {getStatusIcon(evaluation.status)}
                          {evaluation.status}
                        </span>
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Submitted: {new Date(evaluation.submittedDate).toLocaleDateString()}
                    </div>
                  </button>

                  {/* Show details if selected */}
                  {selectedEvaluation === evaluation.id && evaluation.aiScore !== null && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-ai">{evaluation.aiScore}</div>
                          <div className="text-xs text-muted-foreground">AI Score</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{evaluation.confidence}%</div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                      </div>
                      {evaluation.recommendedGrade && (
                        <div className="p-3 bg-ai/10 rounded-lg border-l-4 border-l-ai">
                          <div className="text-xs text-muted-foreground">Recommended Grade</div>
                          <div className="text-xl font-bold text-ai">{evaluation.recommendedGrade}</div>
                        </div>
                      )}
                      <Button size="sm" className="w-full">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        Review Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNavigation type="advisor" />
      </div>
    </div>
  );
}

