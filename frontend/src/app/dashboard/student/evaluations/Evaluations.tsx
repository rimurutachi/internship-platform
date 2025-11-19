'use client';

import { Star, TrendingUp, Target, BookOpen, MessageSquare, Lightbulb, Calendar, User, Award } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Evaluations() {
  const overallRating = 4.5;
  
  const evaluations = [
    {
      id: 1,
      type: 'Mid-term',
      date: '2025-10-15',
      evaluator: 'John Doe (Supervisor)',
      ratings: {
        technical: 4.5,
        communication: 4.8,
        workEthic: 4.7,
        problemSolving: 4.3
      },
      overallScore: 4.6,
      feedback: 'Excellent progress. Shows strong technical skills and great communication with the team.',
      status: 'completed'
    }
  ];

  const skillProgress = [
    { skill: 'Technical Skills', current: 85, target: 90 },
    { skill: 'Communication', current: 90, target: 95 },
    { skill: 'Problem Solving', current: 80, target: 85 },
    { skill: 'Teamwork', current: 88, target: 90 }
  ];

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Evaluations</h1>
        <p className="text-muted-foreground mt-1">Track your performance and feedback</p>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Star className="w-8 h-8 text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overall Rating</div>
                <div className="text-3xl font-bold text-foreground">{overallRating}</div>
                <div className="flex items-center text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(overallRating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Evaluations</div>
                <div className="text-3xl font-bold text-foreground">{evaluations.length}</div>
                <div className="text-sm text-success">+1 this month</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-ai/10 rounded-lg">
                <Award className="w-8 h-8 text-ai" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Achievements</div>
                <div className="text-3xl font-bold text-foreground">5</div>
                <div className="text-sm text-ai">Badges earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Development Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillProgress.map((item) => (
            <div key={item.skill}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{item.skill}</span>
                <span className="text-sm text-muted-foreground">{item.current}% / {item.target}%</span>
              </div>
              <Progress value={item.current} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Evaluation History */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Evaluations</TabsTrigger>
          <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{evaluation.type} Evaluation</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(evaluation.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {evaluation.evaluator}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success">{evaluation.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rating Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(evaluation.ratings).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Overall Score */}
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                    <span className="font-semibold text-foreground">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{evaluation.overallScore}</span>
                      <div className="flex items-center text-warning">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(evaluation.overallScore) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-2">Feedback</div>
                    <div className="p-4 bg-muted rounded-lg text-muted-foreground">{evaluation.feedback}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="supervisor" className="space-y-4">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{evaluation.type} Evaluation</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(evaluation.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {evaluation.evaluator}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success">{evaluation.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rating Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(evaluation.ratings).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Overall Score */}
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                    <span className="font-semibold text-foreground">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{evaluation.overallScore}</span>
                      <div className="flex items-center text-warning">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(evaluation.overallScore) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-2">Feedback</div>
                    <div className="p-4 bg-muted rounded-lg text-muted-foreground">{evaluation.feedback}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Evaluations"
          subtitle="Track your performance and feedback"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Overall Performance */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{overallRating}</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{evaluations.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">5</div>
                  <div className="text-xs text-muted-foreground">Badges</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Skill Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillProgress.map((item) => (
                <div key={item.skill}>
                  <div className="flex justify-between mb-1.5 text-xs">
                    <span className="font-medium text-foreground">{item.skill}</span>
                    <span className="text-muted-foreground">{item.current}% / {item.target}%</span>
                  </div>
                  <Progress value={item.current} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Evaluations List */}
          <div className="space-y-3">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{evaluation.type}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(evaluation.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs">{evaluation.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(evaluation.ratings).map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-muted rounded-lg">
                        <div className="text-lg font-bold text-primary">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="font-semibold text-foreground text-sm">Overall</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">{evaluation.overallScore}</span>
                      <div className="flex items-center text-warning">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(evaluation.overallScore) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-1">Feedback</div>
                    <div className="text-xs text-muted-foreground">{evaluation.feedback}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

