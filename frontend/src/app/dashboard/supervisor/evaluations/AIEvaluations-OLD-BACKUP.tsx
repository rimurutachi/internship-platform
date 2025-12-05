'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Send,
  Building2,
  Sparkles,
  Mic,
  Award
} from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface Evaluation {
  id: string;
  intern: string;
  position: string;
  evaluationPeriod: string;
  submittedDate: string | null;
  status: 'draft' | 'submitted' | 'processing' | 'completed';
  ratings: {
    technical: number;
    communication: number;
    workEthic: number;
    problemSolving: number;
    teamwork: number;
  };
  feedback: string;
  aiScore: number | null;
  confidence: number | null;
  recommendedGrade: string | null;
}

const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    intern: 'Alice Johnson',
    position: 'Software Engineering Intern',
    evaluationPeriod: 'Mid-term',
    submittedDate: '2025-11-08',
    status: 'completed',
    ratings: {
      technical: 4.7,
      communication: 4.3,
      workEthic: 4.6,
      problemSolving: 4.4,
      teamwork: 4.5
    },
    feedback: 'Excellent technical skills and strong problem-solving abilities. Shows great initiative and collaboration with the team.',
    aiScore: 4.5,
    confidence: 92,
    recommendedGrade: 'A'
  },
  {
    id: '2',
    intern: 'Bob Martinez',
    position: 'Full Stack Developer Intern',
    evaluationPeriod: 'Mid-term',
    submittedDate: null,
    status: 'draft',
    ratings: {
      technical: 4.0,
      communication: 4.4,
      workEthic: 4.3,
      problemSolving: 4.1,
      teamwork: 4.2
    },
    feedback: '',
    aiScore: null,
    confidence: null,
    recommendedGrade: null
  }
];

export default function SupervisorAIEvaluations() {
  const [selectedEval, setSelectedEval] = useState<string>(mockEvaluations[0]?.id || '');
  const [ratings, setRatings] = useState(mockEvaluations[0]?.ratings || {
    technical: 0,
    communication: 0,
    workEthic: 0,
    problemSolving: 0,
    teamwork: 0
  });
  const [feedback, setFeedback] = useState(mockEvaluations[0]?.feedback || '');
  const [evaluationText, setEvaluationText] = useState('');
  const [overallRating, setOverallRating] = useState('excellent');
  const [recommendation, setRecommendation] = useState('strongly-recommend');

  const currentEval = mockEvaluations.find(e => e.id === selectedEval);

  // Update ratings and feedback when selection changes
  useEffect(() => {
    if (currentEval) {
      setRatings(currentEval.ratings);
      setFeedback(currentEval.feedback);
    }
  }, [selectedEval, currentEval]);

  const stats = {
    total: mockEvaluations.length,
    draft: mockEvaluations.filter(e => e.status === 'draft').length,
    submitted: mockEvaluations.filter(e => e.status === 'submitted').length,
    completed: mockEvaluations.filter(e => e.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-primary/10 text-primary border-primary/20';
      case 'processing': return 'bg-warning/10 text-warning border-warning/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleRatingChange = (key: string, value: number[]) => {
    setRatings({...ratings, [key]: value[0]});
  };

  // LLT Feature Extraction results
  const lltFeatures = [
    { name: "Technical Skills", score: 92, color: "bg-primary" },
    { name: "Communication", score: 88, color: "bg-blue-500" },
    { name: "Problem Solving", score: 90, color: "bg-purple-500" },
    { name: "Initiative", score: 85, color: "bg-indigo-500" }
  ];

  // Sentiment Analysis scores
  const sentimentScores = [
    { name: "Positive Sentiment", score: 78, color: "bg-success" },
    { name: "Professional Tone", score: 95, color: "bg-blue-600" },
    { name: "Constructive Feedback", score: 82, color: "bg-purple-600" },
    { name: "Clarity", score: 88, color: "bg-indigo-600" }
  ];

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <SupervisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SupervisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">AI Evaluations</h1>
                  <p className="text-muted-foreground mt-1">Create and submit AI-powered evaluations</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
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

              {/* AI Evaluation Assistant Card */}
              <Card className="bg-gradient-to-br from-ai/5 to-purple-500/5 border-ai/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-ai flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-ai">AI Evaluation Assistant</CardTitle>
                        <CardDescription>Smart prompts and automated analysis</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-ai/30 text-ai hover:bg-ai/10">
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Input
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder="Describe the intern's performance, key achievements, areas of improvement, and overall contribution to the team. The AI will analyze your feedback for consistency, bias detection, and professional tone..."
                      value={evaluationText}
                      onChange={(e) => setEvaluationText(e.target.value)}
                      className="min-h-[180px] pr-12 resize-none"
                    />
                    <Button 
                      size="sm" 
                      className="absolute bottom-3 right-3 bg-gradient-ai hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* AI Writing Suggestions */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-ai/20">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-ai mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ai mb-1">AI Suggestions:</p>
                        <p className="text-xs text-muted-foreground">
                          Consider including specific examples of technical achievements • 
                          Add measurable outcomes • 
                          Mention collaboration with team members
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Dropdowns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Overall Rating
                      </label>
                      <Select value={overallRating} onValueChange={setOverallRating}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outstanding">Outstanding (95-100%)</SelectItem>
                          <SelectItem value="excellent">Excellent (90-94%)</SelectItem>
                          <SelectItem value="good">Good (80-89%)</SelectItem>
                          <SelectItem value="satisfactory">Satisfactory (70-79%)</SelectItem>
                          <SelectItem value="needs-improvement">Needs Improvement (&lt;70%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Recommendation
                      </label>
                      <Select value={recommendation} onValueChange={setRecommendation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strongly-recommend">Strongly recommend for hire</SelectItem>
                          <SelectItem value="recommend">Recommend for hire</SelectItem>
                          <SelectItem value="consider">Consider for hire</SelectItem>
                          <SelectItem value="not-recommend">Do not recommend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live AI Processing Preview */}
              <Card className="border-ai/30">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-ai" />
                    <CardTitle className="text-ai">Real-time AI Analysis</CardTitle>
                  </div>
                  <CardDescription>
                    Live processing with LLT feature extraction and sentiment analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Two Column Layout */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* LLT Feature Extraction */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-primary" />
                        LLT Feature Extraction
                      </h3>
                      <div className="space-y-3">
                        {lltFeatures.map((feature, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-foreground">{feature.name}</span>
                              <span className="text-sm font-semibold text-foreground">{feature.score}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${feature.color} transition-all duration-500`}
                                style={{ width: `${feature.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sentiment Analysis */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                        Sentiment Analysis
                      </h3>
                      <div className="space-y-3">
                        {sentimentScores.map((sentiment, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-foreground">{sentiment.name}</span>
                              <span className="text-sm font-semibold text-foreground">{sentiment.score}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${sentiment.color} transition-all duration-500`}
                                style={{ width: `${sentiment.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Predicted Grade Banner */}
                  <div className="bg-gradient-to-r from-success/10 to-success/5 border-2 border-success/30 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                          <Award className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Predicted Grade</p>
                          <p className="text-3xl font-bold text-success">A- (87/100)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">AI Confidence:</span>
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                              94%
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Processed in 0.8s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evaluations List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evaluations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockEvaluations.map((evaluation) => (
                      <button
                        key={evaluation.id}
                        onClick={() => {
                          setSelectedEval(evaluation.id);
                          if (evaluation) {
                            setRatings(evaluation.ratings);
                            setFeedback(evaluation.feedback);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedEval === evaluation.id
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'hover:bg-accent border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-foreground text-sm">{evaluation.intern}</div>
                          <Badge className={getStatusColor(evaluation.status)}>
                            {evaluation.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{evaluation.position}</div>
                        <div className="text-xs text-muted-foreground mt-2">{evaluation.evaluationPeriod}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Evaluation Form/Details */}
                <Card className="lg:col-span-2">
                  {currentEval && (
                    <>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{currentEval.intern}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{currentEval.position} - {currentEval.evaluationPeriod}</p>
                          </div>
                          <Badge className={getStatusColor(currentEval.status)}>
                            {currentEval.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="form" className="space-y-4">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="form">Evaluation Form</TabsTrigger>
                            <TabsTrigger value="ai-results" disabled={!currentEval.aiScore}>
                              AI Results
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="form" className="space-y-6">
                            {/* Ratings */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-foreground">Performance Ratings</h3>
                              {Object.entries(ratings).map(([key, value]) => (
                                <div key={key}>
                                  <div className="flex justify-between mb-2">
                                    <Label className="capitalize text-foreground">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </Label>
                                    <span className="text-sm font-semibold text-primary">{value.toFixed(1)}/5</span>
                                  </div>
                                  <div className="space-y-2">
                                    <Slider
                                      min={0}
                                      max={5}
                                      step={0.1}
                                      value={[value]}
                                      onValueChange={(val) => handleRatingChange(key, val)}
                                      disabled={currentEval.status !== 'draft'}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>0</span>
                                      <span>2.5</span>
                                      <span>5</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Feedback */}
                            <div>
                              <Label>Detailed Feedback</Label>
                              <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Provide detailed feedback on the intern's performance..."
                                className="mt-2 min-h-32"
                                disabled={currentEval.status !== 'draft'}
                                maxLength={5000}
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                {feedback.length}/5000 characters
                              </p>
                            </div>

                            {/* Actions */}
                            {currentEval.status === 'draft' && (
                              <div className="flex gap-3">
                                <Button className="flex-1 bg-primary hover:bg-primary/90">
                                  <Send className="w-4 h-4 mr-2" />
                                  Submit Evaluation
                                </Button>
                                <Button variant="outline" className="flex-1">
                                  Save Draft
                                </Button>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="ai-results" className="space-y-6">
                            {currentEval.aiScore && (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardContent className="pt-6 text-center">
                                      <div className="text-4xl font-bold text-primary">{currentEval.aiScore.toFixed(1)}</div>
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

                                <Card className="border-l-4 border-l-primary">
                                  <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm text-muted-foreground">AI Recommended Grade</div>
                                        <div className="text-3xl font-bold text-primary mt-1">{currentEval.recommendedGrade}</div>
                                      </div>
                                      <CheckCircle className="w-8 h-8 text-success" />
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="bg-primary/5 border-primary/20">
                                  <CardContent className="pt-4">
                                    <div className="flex gap-3">
                                      <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <div className="text-sm font-semibold text-foreground">AI Analysis</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Based on your ratings and feedback, the AI system has analyzed the evaluation 
                                          and suggests a grade of {currentEval.recommendedGrade} with {currentEval.confidence}% confidence.
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="AI Evaluations"
            subtitle="TechCorp Solutions"
            logo={
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Page Header - Mobile */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Evaluations</h1>
              <p className="text-sm text-muted-foreground mt-1">Create and submit evaluations</p>
            </div>
          </div>

          {/* New Evaluation Button - Mobile */}
          <Button className="w-full bg-primary hover:bg-primary/90">
            <FileText className="w-4 h-4 mr-2" />
            New Evaluation
          </Button>

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
                <div className="text-xl font-bold text-muted-foreground">{stats.draft}</div>
                <div className="text-xs text-muted-foreground">Drafts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-primary">{stats.submitted}</div>
                <div className="text-xs text-muted-foreground">Submitted</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-success">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Evaluations List - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockEvaluations.map((evaluation) => (
                <button
                  key={evaluation.id}
                  onClick={() => {
                    setSelectedEval(evaluation.id);
                    if (evaluation) {
                      setRatings(evaluation.ratings);
                      setFeedback(evaluation.feedback);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedEval === evaluation.id
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'hover:bg-accent border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-foreground text-sm">{evaluation.intern}</div>
                    <Badge className={getStatusColor(evaluation.status)}>
                      {evaluation.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{evaluation.position}</div>
                  <div className="text-xs text-muted-foreground mt-2">{evaluation.evaluationPeriod}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Evaluation Form - Mobile */}
          {currentEval && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentEval.intern}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{currentEval.position}</p>
                  </div>
                  <Badge className={getStatusColor(currentEval.status)}>
                    {currentEval.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="form" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="form">Form</TabsTrigger>
                    <TabsTrigger value="ai-results" disabled={!currentEval.aiScore}>
                      AI Results
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="form" className="space-y-4">
                    {/* Ratings - Mobile */}
                    <div className="space-y-4">
                      {Object.entries(ratings).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-2">
                            <Label className="capitalize text-sm text-foreground">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <span className="text-sm font-semibold text-primary">{value.toFixed(1)}/5</span>
                          </div>
                          <Slider
                            min={0}
                            max={5}
                            step={0.1}
                            value={[value]}
                            onValueChange={(val) => handleRatingChange(key, val)}
                            disabled={currentEval.status !== 'draft'}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Feedback - Mobile */}
                    <div>
                      <Label>Feedback</Label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide detailed feedback..."
                        className="mt-2 min-h-32"
                        disabled={currentEval.status !== 'draft'}
                        maxLength={5000}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {feedback.length}/5000
                      </p>
                    </div>

                    {/* Actions - Mobile */}
                    {currentEval.status === 'draft' && (
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 bg-primary hover:bg-primary/90">
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Save
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ai-results" className="space-y-4">
                    {currentEval.aiScore && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-primary">{currentEval.aiScore.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground mt-1">AI Score</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-primary">{currentEval.confidence}%</div>
                              <div className="text-xs text-muted-foreground mt-1">Confidence</div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">Recommended Grade</div>
                                <div className="text-2xl font-bold text-primary mt-1">{currentEval.recommendedGrade}</div>
                              </div>
                              <CheckCircle className="w-6 h-6 text-success" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-semibold text-foreground">AI Analysis</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Grade: {currentEval.recommendedGrade} ({currentEval.confidence}% confidence)
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="supervisor" />
        </div>
      </div>
    </div>
  );
}

