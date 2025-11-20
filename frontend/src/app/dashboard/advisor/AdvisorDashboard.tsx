'use client';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Eye,
  Settings as SettingsIcon,
  Users,
  BarChart3
} from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserContext } from '@/components/providers/UserProvider';

/**
 * AdvisorDashboard Component
 * 
 * Main dashboard view for advisors with desktop and mobile layouts.
 * Includes overview with AI-powered grade recommendations.
 */
const AdvisorDashboard = () => {
  const { user } = useUserContext();
  
  const getInitials = () => {
    if (!user?.first_name || !user?.last_name) return 'AD';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const initials = getInitials();

  const keyMetrics = [
    {
      title: "Active Interns",
      value: "42",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Pending Evaluations",
      value: "15",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "AI Accuracy Rate",
      value: "92%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ];

  const evaluationCards = [
    {
      id: 1,
      studentName: "John Martinez",
      company: "TechCorp Solutions",
      grade: "A-",
      confidence: 94,
      hasBiasAlert: false,
      lltFeatures: {
        technicalSkills: 92,
        communication: 88,
        workEthic: 95,
        problemSolving: 90
      },
      sentimentScore: 0.85,
      supervisorFeedback: "Excellent problem-solving abilities and strong technical foundation. Consistently delivers high-quality work ahead of schedule."
    },
    {
      id: 2,
      studentName: "Maria Santos",
      company: "InnovateHub",
      grade: "B+",
      confidence: 78,
      hasBiasAlert: true,
      lltFeatures: {
        technicalSkills: 85,
        communication: 90,
        workEthic: 88,
        problemSolving: 82
      },
      sentimentScore: 0.62,
      supervisorFeedback: "Good technical skills, but could improve time management. Shows potential for growth."
    }
  ];

  const gradeDistribution = [
    { grade: "A Grades", percentage: 35, color: "bg-success" },
    { grade: "B Grades", percentage: 45, color: "bg-primary" },
    { grade: "C Grades", percentage: 20, color: "bg-warning" }
  ];

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
          
          {/* Dashboard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {keyMetrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-card transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {metric.title}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {metric.value}
                        </p>
                      </div>
                      <div className={`${metric.bgColor} p-3 rounded-lg`}>
                        <metric.icon className={`w-6 h-6 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Grade Recommendations Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-ai" />
                      <span>AI Grade Recommendations</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Linear Law-based Feature Transformation + Sentiment Analysis
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-ai border-ai/30">
                    Real-time Processing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {evaluationCards.map((evaluation) => (
                  <Card 
                    key={evaluation.id} 
                    className={`${evaluation.hasBiasAlert ? 'border-warning/50 bg-warning/5' : 'border-border'}`}
                  >
                    <CardContent className="pt-6">
                      {/* Student Info Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {evaluation.studentName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {evaluation.company}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-success mb-1">
                            {evaluation.grade}
                          </div>
                          <div className="flex items-center space-x-1 text-sm">
                            <Brain className="w-3 h-3 text-ai" />
                            <span className="text-ai font-medium">
                              {evaluation.confidence}% confidence
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bias Alert */}
                      {evaluation.hasBiasAlert && (
                        <div className="mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-warning">
                                ⚠️ Bias Alert
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Potential gender bias detected in evaluation. Manual review recommended.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Analysis Summary */}
                      <div className="bg-muted/30 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-ai" />
                          LLT Feature Analysis
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(evaluation.lltFeatures).map(([key, value]) => (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                  {value}%
                                </span>
                              </div>
                              <Progress value={value} className="h-2" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Sentiment Score
                            </span>
                            <span className="text-sm font-semibold text-ai">
                              {evaluation.sentimentScore.toFixed(2)} (Positive)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Supervisor Feedback */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          Supervisor Feedback
                        </h4>
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{evaluation.supervisorFeedback}&rdquo;
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        {evaluation.hasBiasAlert ? (
                          <Button className="flex-1 bg-warning hover:bg-warning/90 text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            Manual Review Required
                          </Button>
                        ) : (
                          <>
                            <Button className="flex-1 bg-success hover:bg-success/90 text-white">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Grade
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <Eye className="w-4 h-4 mr-2" />
                              Review Details
                            </Button>
                            <Button variant="outline">
                              <SettingsIcon className="w-4 h-4 mr-2" />
                              Adjust Grade
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Current semester overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gradeDistribution.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.grade}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`${item.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Processing Stats</CardTitle>
                  <CardDescription>System performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Average Processing Time
                      </span>
                      <span className="text-2xl font-bold text-ai">2.3 min</span>
                    </div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>15% faster than last month</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Evaluations Processed
                      </span>
                      <span className="text-2xl font-bold text-primary">156</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This semester
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Bias Alerts Detected
                      </span>
                      <span className="text-2xl font-bold text-warning">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title="Advisor Portal"
          subtitle={user?.email || 'Advisor'}
          notificationCount={15}
          logo={
            <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
          }
        />

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-ai/10 to-purple-500/10 border-ai/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-ai">
                <AvatarFallback className="bg-gradient-ai text-white font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">Welcome, {user?.first_name || 'Advisor'}!</h2>
                <p className="text-sm text-muted-foreground">{user?.email || 'Advisor Portal'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics - Mobile */}
          <div className="grid grid-cols-3 gap-3">
            {keyMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className={`${metric.bgColor} p-2 rounded-lg inline-block mb-2`}>
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div className="text-xl font-bold text-foreground">{metric.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{metric.title}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Evaluations Pending Badge */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">AI Evaluations</h3>
                  <p className="text-sm text-muted-foreground">15 pending reviews</p>
                </div>
                <Badge className="bg-gradient-ai text-white border-0 px-3 py-1 text-sm">
                  15 PENDING
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Grade Recommendations - Mobile Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Brain className="w-4 h-4 text-ai" />
                <span>AI Grade Recommendations</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Recent evaluations ready for review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {evaluationCards.slice(0, 2).map((evaluation) => (
                <Card key={evaluation.id} className="border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground">
                          {evaluation.studentName}
                        </h4>
                        <p className="text-xs text-muted-foreground">{evaluation.company}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">{evaluation.grade}</div>
                        <div className="text-xs text-ai">{evaluation.confidence}%</div>
                      </div>
                    </div>
                    {evaluation.hasBiasAlert && (
                      <Badge variant="outline" className="text-warning border-warning/30 text-xs mt-2">
                        ⚠️ Bias Alert
                      </Badge>
                    )}
                    <Button size="sm" className="w-full mt-3" variant="outline">
                      <Eye className="w-3 h-3 mr-2" />
                      Review
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation type="advisor" />
      </div>
    </div>
  );
};

export default AdvisorDashboard;