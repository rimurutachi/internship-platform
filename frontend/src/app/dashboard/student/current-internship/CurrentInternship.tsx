'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Building2, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface InternshipData {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  supervisor: { name: string; email: string } | null;
  advisor: { name: string; email: string } | null;
  progress: number;
  status: string;
  department?: string;
}

interface Task {
  id: number;
  title: string;
  status: 'completed' | 'pending' | 'upcoming';
  dueDate: string;
}

interface Milestone {
  id: number;
  title: string;
  date: string;
  completed: boolean;
}

export default function CurrentInternship() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    loadInternshipData();
  }, []);

  const loadInternshipData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get active internship with company, supervisor, and advisor details
      const { data: internshipData, error: internshipError } = await supabase
        .from('internships')
        .select(`
          id,
          position,
          department,
          start_date,
          end_date,
          status,
          companies (
            id,
            name,
            address
          ),
          supervisor:supervisor_id (
            id,
            first_name,
            last_name,
            email
          ),
          advisor:advisor_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('student_id', user.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (internshipError) {
        if (internshipError.code === 'PGRST116') {
          setError('No active internship found');
        } else {
          throw internshipError;
        }
        setLoading(false);
        return;
      }

      // Calculate progress based on dates
      const startDate = new Date(internshipData.start_date);
      const endDate = new Date(internshipData.end_date);
      const today = new Date();
      const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysCompleted = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const progress = Math.min(100, Math.max(0, Math.round((daysCompleted / totalDays) * 100)));

      const formattedInternship: InternshipData = {
        id: internshipData.id,
        position: internshipData.position,
        company: (internshipData.companies as any)?.name || 'Unknown Company',
        location: (internshipData.companies as any)?.address || 'Location not specified',
        startDate: internshipData.start_date,
        endDate: internshipData.end_date,
        supervisor: internshipData.supervisor ? {
          name: `${(internshipData.supervisor as any).first_name} ${(internshipData.supervisor as any).last_name}`,
          email: (internshipData.supervisor as any).email
        } : null,
        advisor: internshipData.advisor ? {
          name: `${(internshipData.advisor as any).first_name} ${(internshipData.advisor as any).last_name}`,
          email: (internshipData.advisor as any).email
        } : null,
        progress,
        status: internshipData.status,
        department: internshipData.department || undefined
      };

      setInternship(formattedInternship);

      // Load tasks from weekly accomplishments
      const { data: weeklyReports } = await supabase
        .from('student_weekly_accomplishments')
        .select('id, week_number, accomplishments, status, created_at')
        .eq('internship_id', internshipData.id)
        .order('week_number', { ascending: false })
        .limit(4);

      if (weeklyReports) {
        const formattedTasks: Task[] = weeklyReports.map((report, index) => ({
          id: index + 1,
          title: `Week ${report.week_number} Report: ${report.accomplishments.substring(0, 50)}...`,
          status: report.status === 'approved' ? 'completed' : report.status === 'pending_approval' ? 'pending' : 'upcoming',
          dueDate: report.created_at
        }));
        setTasks(formattedTasks);
      }

      // Create milestones based on internship dates and evaluations
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('evaluation_type, created_at, status')
        .eq('internship_id', internshipData.id)
        .order('created_at', { ascending: true });

      const dynamicMilestones: Milestone[] = [
        {
          id: 1,
          title: 'Internship Start',
          date: internshipData.start_date,
          completed: new Date(internshipData.start_date) <= today
        }
      ];

      if (evaluations) {
        evaluations.forEach((evaluation, index) => {
          dynamicMilestones.push({
            id: index + 2,
            title: `${evaluation.evaluation_type.charAt(0).toUpperCase() + evaluation.evaluation_type.slice(1)} Evaluation`,
            date: evaluation.created_at.split('T')[0],
            completed: evaluation.status === 'approved' || evaluation.status === 'processed'
          });
        });
      }

      dynamicMilestones.push({
        id: dynamicMilestones.length + 1,
        title: 'Internship Completion',
        date: internshipData.end_date,
        completed: new Date(internshipData.end_date) <= today
      });

      setMilestones(dynamicMilestones);

    } catch (err: any) {
      console.error('Error loading internship:', err);
      setError(err.message || 'Failed to load internship data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="hidden lg:flex h-full">
          <StudentSidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StudentHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#4CAF50] mx-auto" />
                <p className="text-gray-600 text-lg">Loading internship details...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:hidden h-screen flex flex-col overflow-hidden">
          <MobileHeader title="Current Internship" subtitle="Loading..." />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#4CAF50]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="hidden lg:flex h-full">
          <StudentSidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StudentHeader />
            <div className="flex-1 flex items-center justify-center p-8">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">
                  {error || 'No active internship found'}
                  <div className="mt-4">
                    <Button onClick={() => router.push('/dashboard/student')} variant="outline">
                      Back to Dashboard
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Current Internship</h1>
        <p className="text-gray-600 mt-2 text-lg">Track your internship progress and milestones</p>
      </div>

      {/* Internship Overview Card */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-[#4CAF50] text-white text-base px-3 py-1">Active</Badge>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{internship.position}</h2>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <span className="text-lg">{internship.company}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-lg">{internship.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-lg">{new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="md:w-64">
              <Card className="bg-gray-50 border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="text-base text-gray-600 mb-2">Overall Progress</div>
                  <div className="text-4xl font-bold text-[#4CAF50] mb-4">{internship.progress}%</div>
                  <Progress value={internship.progress} className="h-3 bg-gray-200" />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 max-w-5xl">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-900">Company Supervisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-[#4CAF50]/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">{internship.supervisor?.name || 'Not assigned'}</div>
                <div className="text-base text-gray-600">{internship.supervisor?.email || 'No email'}</div>
              </div>
            </div>
            <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 text-base py-5">Send Message</Button>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-900">University Advisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">{internship.advisor?.name || 'Not assigned'}</div>
                <div className="text-base text-gray-600">{internship.advisor?.email || 'No email'}</div>
              </div>
            </div>
            <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 text-base py-5">Send Message</Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tasks and Milestones */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-white text-base px-6 py-2">Tasks</TabsTrigger>
          <TabsTrigger value="milestones" className="data-[state=active]:bg-white text-base px-6 py-2">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
                    ) : task.status === 'pending' ? (
                      <Clock className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-blue-500" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{task.title}</div>
                      <div className="text-base text-gray-600 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Badge className={
                    task.status === 'completed' ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20' :
                    task.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
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
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex gap-4 pb-8">
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                  milestone.completed ? 'bg-[#4CAF50]/10' : 'bg-gray-100'
                }`}>
                  {milestone.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  )}
                </div>
                <Card className="flex-1 bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="font-semibold text-gray-900 text-lg">{milestone.title}</div>
                    <div className="text-base text-gray-600 mt-1">{new Date(milestone.date).toLocaleDateString()}</div>
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
                    <div className="font-semibold text-foreground text-sm">{internship.supervisor?.name || 'Not assigned'}</div>
                    <div className="text-xs text-muted-foreground">{internship.supervisor?.email || 'No email'}</div>
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
                    <div className="font-semibold text-foreground text-sm">{internship.advisor?.name || 'Not assigned'}</div>
                    <div className="text-xs text-muted-foreground">{internship.advisor?.email || 'No email'}</div>
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

