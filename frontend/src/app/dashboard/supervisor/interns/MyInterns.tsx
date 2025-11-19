'use client';

import { useState } from 'react';
import { 
  Search, 
  Mail, 
  Phone, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  MoreVertical, 
  Eye, 
  Calendar,
  Building2
} from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Intern {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  program: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on-leave';
  progress: number;
  performance: {
    overall: number;
    technical: number;
    communication: number;
    workEthic: number;
    problemSolving: number;
  };
  lastEvaluation: string;
  tasksCompleted: number;
  totalTasks: number;
}

const mockInterns: Intern[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    phone: '+1 234-567-8901',
    university: 'State University',
    program: 'Computer Science',
    position: 'Software Engineering Intern',
    department: 'Engineering',
    startDate: '2025-09-01',
    endDate: '2025-12-15',
    status: 'active',
    progress: 75,
    performance: {
      overall: 4.5,
      technical: 4.7,
      communication: 4.3,
      workEthic: 4.6,
      problemSolving: 4.4
    },
    lastEvaluation: '2025-11-08',
    tasksCompleted: 12,
    totalTasks: 15
  },
  {
    id: '2',
    name: 'Bob Martinez',
    email: 'bob.m@university.edu',
    phone: '+1 234-567-8902',
    university: 'Tech University',
    program: 'Information Technology',
    position: 'Full Stack Developer Intern',
    department: 'Engineering',
    startDate: '2025-09-15',
    endDate: '2025-12-20',
    status: 'active',
    progress: 65,
    performance: {
      overall: 4.2,
      technical: 4.0,
      communication: 4.4,
      workEthic: 4.3,
      problemSolving: 4.1
    },
    lastEvaluation: '2025-11-05',
    tasksCompleted: 8,
    totalTasks: 12
  },
  {
    id: '3',
    name: 'Carol Chen',
    email: 'carol.c@university.edu',
    phone: '+1 234-567-8903',
    university: 'State University',
    program: 'Data Science',
    position: 'Data Analyst Intern',
    department: 'Analytics',
    startDate: '2025-08-15',
    endDate: '2025-11-30',
    status: 'completed',
    progress: 100,
    performance: {
      overall: 4.8,
      technical: 4.9,
      communication: 4.7,
      workEthic: 4.8,
      problemSolving: 4.7
    },
    lastEvaluation: '2025-11-10',
    tasksCompleted: 20,
    totalTasks: 20
  }
];

export default function MyInterns() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const filteredInterns = mockInterns.filter(intern => {
    const matchesSearch = intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         intern.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || intern.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || intern.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = {
    total: mockInterns.length,
    active: mockInterns.filter(i => i.status === 'active').length,
    completed: mockInterns.filter(i => i.status === 'completed').length,
    onLeave: mockInterns.filter(i => i.status === 'on-leave').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'on-leave': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Interns</h1>
                <p className="text-muted-foreground mt-1">Monitor and evaluate your interns' performance</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Interns</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">{stats.active}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-warning">{stats.onLeave}</div>
                    <div className="text-sm text-muted-foreground">On Leave</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by name, email, or position..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Analytics">Analytics</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Interns List */}
              <div className="space-y-4">
                {filteredInterns.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No interns found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredInterns.map((intern) => (
                    <Card key={intern.id} className="hover:shadow-card transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Intern Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src="/placeholder.svg" alt={intern.name} />
                              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {intern.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-foreground">{intern.name}</h3>
                                <Badge className={getStatusColor(intern.status)}>
                                  {intern.status}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-foreground">{intern.position}</p>
                              <p className="text-sm text-muted-foreground">{intern.department}</p>
                              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {intern.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(intern.startDate).toLocaleDateString()} - {new Date(intern.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress & Tasks */}
                          <div className="flex-1">
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Internship Progress</span>
                                  <span className="font-semibold text-foreground">{intern.progress}%</span>
                                </div>
                                <Progress value={intern.progress} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Tasks Completed</span>
                                  <span className="font-semibold text-foreground">{intern.tasksCompleted}/{intern.totalTasks}</span>
                                </div>
                                <Progress value={(intern.tasksCompleted / intern.totalTasks) * 100} className="h-2" />
                              </div>
                            </div>
                          </div>

                          {/* Performance */}
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground mb-3">Performance</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Overall</span>
                                <span className="font-semibold text-primary">{intern.performance.overall}/5</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Technical</span>
                                <span className="text-foreground">{intern.performance.technical}/5</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Communication</span>
                                <span className="text-foreground">{intern.performance.communication}/5</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2">
                                Last evaluation: {new Date(intern.lastEvaluation).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                            <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                              <Award className="w-4 h-4 mr-2" />
                              Evaluate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
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
            title="My Interns"
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
          {/* Stats Cards - Mobile */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-success">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-primary">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xl font-bold text-warning">{stats.onLeave}</div>
                <div className="text-xs text-muted-foreground">On Leave</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters - Mobile */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search interns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interns List - Mobile */}
          <div className="space-y-3">
            {filteredInterns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No interns found</p>
                </CardContent>
              </Card>
            ) : (
              filteredInterns.map((intern) => (
                <Card key={intern.id} className="hover:shadow-card transition-shadow">
                  <CardContent className="p-4 space-y-4">
                    {/* Intern Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="/placeholder.svg" alt={intern.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {intern.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{intern.name}</h3>
                          <Badge className={getStatusColor(intern.status)}>
                            {intern.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{intern.position}</p>
                        <p className="text-xs text-muted-foreground">{intern.department}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{intern.progress}%</span>
                        </div>
                        <Progress value={intern.progress} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Tasks</span>
                          <span className="font-semibold text-foreground">{intern.tasksCompleted}/{intern.totalTasks}</span>
                        </div>
                        <Progress value={(intern.tasksCompleted / intern.totalTasks) * 100} className="h-2" />
                      </div>
                    </div>

                    {/* Performance */}
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">Performance</div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Overall</span>
                        <span className="font-semibold text-primary">{intern.performance.overall}/5</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(intern.lastEvaluation).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions - Mobile */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                        <Award className="w-3 h-3 mr-1" />
                        Evaluate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="supervisor" />
        </div>
      </div>
    </div>
  );
}

