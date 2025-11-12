'use client';

import { useState } from 'react';
import { 
  Brain, 
  FileText, 
  BarChart3, 
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
  Award,
  Building2,
  Sparkles,
  Zap,
  Mic,
  Send,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { SwipeableInternCard } from '@/components/mobile/SwipeableInternCard';

/**
 * SupervisorDashboard Component
 * 
 * Supervisor portal dashboard with intern management, AI-powered evaluation
 * assistant, and real-time analysis. Includes desktop and mobile views.
 */
const SupervisorDashboard = () => {
  const [evaluationText, setEvaluationText] = useState('');
  const [selectedIntern, setSelectedIntern] = useState(1); // John Martinez selected by default
  const [overallRating, setOverallRating] = useState('excellent');
  const [recommendation, setRecommendation] = useState('strongly-recommend');

  // Mock interns data
  const interns = [
    {
      id: 1,
      name: "John Martinez",
      progress: 75,
      university: "MIT",
      position: "Software Developer Intern"
    },
    {
      id: 2,
      name: "Sarah Chen",
      progress: 60,
      university: "Stanford",
      position: "Data Analyst Intern"
    },
    {
      id: 3,
      name: "Mark Rodriguez",
      progress: 40,
      university: "UC Berkeley",
      position: "Product Management Intern"
    }
  ];

  // Historical performance stats
  const performanceStats = [
    { label: "Average Rating", value: "4.2/5.0", icon: Star, color: "text-warning" },
    { label: "Evaluations Given", value: "12", icon: FileText, color: "text-primary" },
    { label: "Hire Rate", value: "89%", icon: TrendingUp, color: "text-success" }
  ];

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

  const selectedInternData = interns.find(i => i.id === selectedIntern);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop View */}
      <div className="hidden lg:block">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TechCorp Solutions</h1>
              <p className="text-sm text-muted-foreground">Maria Santos • Senior Developer • Intern Supervisor</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Badge className="bg-gradient-ai text-white border-0 px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              SMART EVALUATION ENABLED
            </Badge>
            <Button className="bg-primary hover:bg-primary/90">
              <FileText className="w-4 h-4 mr-2" />
              New Evaluation
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-80 border-r bg-card/30 p-6 space-y-6 min-h-screen">
          {/* My Interns Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              My Interns ({interns.length})
            </h2>
            <div className="space-y-3">
              {interns.map((intern) => (
                <Card 
                  key={intern.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedIntern === intern.id 
                      ? 'border-primary bg-primary/5 shadow-card' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedIntern(intern.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{intern.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{intern.position}</p>
                        <p className="text-xs text-muted-foreground">{intern.university}</p>
                      </div>
                      {selectedIntern === intern.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{intern.progress}%</span>
                      </div>
                      <Progress value={intern.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Bulk Evaluation
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Advisor
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
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
                  <select 
                    className="w-full p-2.5 border rounded-md bg-background text-foreground"
                    value={overallRating}
                    onChange={(e) => setOverallRating(e.target.value)}
                  >
                    <option value="outstanding">Outstanding (95-100%)</option>
                    <option value="excellent">Excellent (90-94%)</option>
                    <option value="good">Good (80-89%)</option>
                    <option value="satisfactory">Satisfactory (70-79%)</option>
                    <option value="needs-improvement">Needs Improvement (&lt;70%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Recommendation
                  </label>
                  <select 
                    className="w-full p-2.5 border rounded-md bg-background text-foreground"
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                  >
                    <option value="strongly-recommend">Strongly recommend for hire</option>
                    <option value="recommend">Recommend for hire</option>
                    <option value="consider">Consider for hire</option>
                    <option value="not-recommend">Do not recommend</option>
                  </select>
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

          {/* Historical Performance Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            {performanceStats.map((stat, index) => (
              <Card key={index} className="hover:shadow-card transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${stat.color.replace('text-', '')}/20 to-${stat.color.replace('text-', '')}/10 flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" size="lg">
              Save Draft
            </Button>
            <Button size="lg" className="bg-gradient-primary hover:opacity-90">
              <Send className="w-4 h-4 mr-2" />
              Submit Evaluation
            </Button>
          </div>
        </main>
      </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title="TechCorp Solutions"
          subtitle="Maria Santos • Supervisor"
          logo={
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          }
        />

        {/* AI Smart Badge */}
        <div className="px-4 py-3 bg-gradient-to-r from-ai/10 to-purple-500/10 border-b border-ai/20">
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-ai text-white border-0 px-3 py-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              SMART EVALUATION ENABLED
            </Badge>
            <span className="text-sm font-medium text-ai">AI Powered</span>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 pb-20 space-y-4">
          {/* Intern Counter Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{interns.length}</p>
                    <p className="text-sm text-muted-foreground">Active Interns</p>
                  </div>
                </div>
                <Button size="sm" className="bg-primary">
                  <FileText className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Swipeable Intern Cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
              My Interns
            </h2>
            <div className="space-y-3">
              {interns.map((intern) => (
                <SwipeableInternCard
                  key={intern.id}
                  intern={intern}
                  isSelected={selectedIntern === intern.id}
                  onSelect={setSelectedIntern}
                />
              ))}
            </div>
          </div>

          {/* Quick Evaluate Button */}
          {selectedInternData && (
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/30">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-semibold text-foreground">{selectedInternData.name}</span>
                  </p>
                  <Button className="w-full bg-gradient-primary hover:opacity-90 h-12">
                    <Brain className="w-5 h-5 mr-2" />
                    Quick Evaluate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Evaluation Feature */}
          <Card className="bg-gradient-to-br from-ai/5 to-purple-500/5 border-ai/20">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-ai flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-base text-ai">Voice Evaluation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tap to start voice recording for quick evaluation
              </p>
              <Button 
                variant="outline" 
                className="w-full border-ai/30 text-ai hover:bg-ai/10 h-12"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Input
              </Button>
            </CardContent>
          </Card>

          {/* AI Assistant Card */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-ai/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-ai flex items-center justify-center flex-shrink-0">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get smart prompts and automated analysis for fair evaluations
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-ai">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">LLT + Sentiment Analysis</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Performance Stats - Mobile */}
          <div className="grid grid-cols-3 gap-3">
            {performanceStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation type="supervisor" />
      </div>
    </div>
  );
};

export default SupervisorDashboard;