'use client';

import { Calendar, MapPin, User, Building2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CurrentInternship() {
  const internship = {
    position: 'Software Engineering Intern',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    startDate: '2025-09-01',
    endDate: '2025-12-15',
    supervisor: 'John Doe',
    advisor: 'Dr. Jane Smith',
    progress: 65,
    status: 'active'
  };

  const tasks = [
    { id: 1, title: 'Complete onboarding training', status: 'completed', dueDate: '2025-09-05' },
    { id: 2, title: 'Submit weekly progress report', status: 'completed', dueDate: '2025-11-08' },
    { id: 3, title: 'Present project demo', status: 'pending', dueDate: '2025-11-20' },
    { id: 4, title: 'Final evaluation submission', status: 'upcoming', dueDate: '2025-12-10' }
  ];

  const milestones = [
    { id: 1, title: 'Orientation & Setup', date: '2025-09-01', completed: true },
    { id: 2, title: 'Mid-term Evaluation', date: '2025-10-15', completed: true },
    { id: 3, title: 'Project Presentation', date: '2025-11-20', completed: false },
    { id: 4, title: 'Final Assessment', date: '2025-12-15', completed: false }
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
        <h1 className="text-3xl font-bold text-foreground">Current Internship</h1>
        <p className="text-muted-foreground mt-1">Track your internship progress and milestones</p>
      </div>

      {/* Internship Overview Card */}
      <Card className="border-l-4 border-l-blue-600">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{internship.position}</h2>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{internship.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{internship.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Overall Progress</div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{internship.progress}%</div>
                  <Progress value={internship.progress} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Supervisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{internship.supervisor}</div>
                <div className="text-sm text-muted-foreground">supervisor@techcorp.com</div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">Send Message</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">University Advisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{internship.advisor}</div>
                <div className="text-sm text-muted-foreground">advisor@university.edu</div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">Send Message</Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tasks and Milestones */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : task.status === 'pending' ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground">{task.title}</div>
                      <div className="text-sm text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Badge className={
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {task.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex gap-4 pb-8">
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                  milestone.completed ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  {milestone.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  )}
                </div>
                <Card className="flex-1">
                  <CardContent className="pt-4">
                    <div className="font-semibold text-foreground">{milestone.title}</div>
                    <div className="text-sm text-muted-foreground">{new Date(milestone.date).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Current Internship"
          subtitle="Track your progress and milestones"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Internship Overview */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-success/10 text-success">Active</Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{internship.position}</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{internship.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{internship.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground mb-1">Overall Progress</div>
                  <div className="text-2xl font-bold text-primary mb-2">{internship.progress}%</div>
                  <Progress value={internship.progress} className="h-2" />
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Team Info */}
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Supervisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{internship.supervisor}</div>
                    <div className="text-xs text-muted-foreground">supervisor@techcorp.com</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 text-xs" size="sm">Send Message</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Advisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ai/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-ai" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{internship.advisor}</div>
                    <div className="text-xs text-muted-foreground">advisor@university.edu</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 text-xs" size="sm">Send Message</Button>
              </CardContent>
            </Card>
          </div>

          {/* Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : task.status === 'pending' ? (
                      <Clock className="w-4 h-4 text-warning" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-primary" />
                    )}
                    <div>
                      <div className="font-medium text-foreground text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Badge className={task.status === 'completed' ? 'bg-success/10 text-success' : task.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

