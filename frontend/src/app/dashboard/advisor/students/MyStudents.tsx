'use client';

import { useState } from 'react';
import { Search, Mail, Phone, Award, MessageSquare, Eye } from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  year: number;
  internship: {
    company: string;
    position: string;
    status: 'active' | 'pending' | 'completed';
    startDate: string;
    endDate: string;
    progress: number;
  } | null;
  performance: {
    overall: number;
    technical: number;
    communication: number;
    workEthic: number;
  };
  lastEvaluation: string;
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    phone: '+1 234-567-8901',
    program: 'Computer Science',
    year: 3,
    internship: {
      company: 'Tech Corp',
      position: 'Software Engineering Intern',
      status: 'active',
      startDate: '2025-09-01',
      endDate: '2025-12-15',
      progress: 75
    },
    performance: {
      overall: 4.5,
      technical: 4.7,
      communication: 4.3,
      workEthic: 4.6
    },
    lastEvaluation: '2025-11-08'
  },
  {
    id: '2',
    name: 'Bob Martinez',
    email: 'bob.m@university.edu',
    phone: '+1 234-567-8902',
    program: 'Information Technology',
    year: 4,
    internship: {
      company: 'DataWorks Inc',
      position: 'Data Analyst Intern',
      status: 'active',
      startDate: '2025-09-15',
      endDate: '2025-12-20',
      progress: 65
    },
    performance: {
      overall: 4.2,
      technical: 4.0,
      communication: 4.4,
      workEthic: 4.3
    },
    lastEvaluation: '2025-11-05'
  },
  {
    id: '3',
    name: 'Carol Chen',
    email: 'carol.c@university.edu',
    phone: '+1 234-567-8903',
    program: 'Computer Science',
    year: 3,
    internship: null,
    performance: {
      overall: 0,
      technical: 0,
      communication: 0,
      workEthic: 0
    },
    lastEvaluation: 'N/A'
  }
];

export default function MyStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || student.internship?.status === filterStatus || 
                         (filterStatus === 'no-internship' && !student.internship);
    const matchesProgram = filterProgram === 'all' || student.program === filterProgram;
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const stats = {
    total: mockStudents.length,
    active: mockStudents.filter(s => s.internship?.status === 'active').length,
    pending: mockStudents.filter(s => s.internship?.status === 'pending').length,
    noInternship: mockStudents.filter(s => !s.internship).length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'completed': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
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
                <h1 className="text-3xl font-bold text-foreground">My Students</h1>
                <p className="text-muted-foreground mt-1">Monitor and manage your advisee students</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">{stats.active}</div>
                    <div className="text-sm text-muted-foreground">Active Internships</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-destructive">{stats.noInternship}</div>
                    <div className="text-sm text-muted-foreground">No Internship</div>
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
                        placeholder="Search by name or email..."
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="no-internship">No Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Students List */}
              <div className="space-y-4">
                {filteredStudents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No students found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredStudents.map((student) => (
                    <Card key={student.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Student Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="w-16 h-16">
                              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-foreground">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">{student.program} - Year {student.year}</p>
                              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {student.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {student.phone}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Internship Info */}
                          <div className="flex-1">
                            {student.internship ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(student.internship.status)}>
                                    {student.internship.status}
                                  </Badge>
                                </div>
                                <div>
                                  <div className="font-semibold text-foreground">{student.internship.position}</div>
                                  <div className="text-sm text-muted-foreground">{student.internship.company}</div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-semibold text-foreground">{student.internship.progress}%</span>
                                  </div>
                                  <Progress value={student.internship.progress} className="h-2" />
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">No active internship</p>
                              </div>
                            )}
                          </div>

                          {/* Performance */}
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground mb-3">Performance</div>
                            {student.internship ? (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Overall</span>
                                  <span className="font-semibold text-primary">{student.performance.overall}/5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Technical</span>
                                  <span className="text-foreground">{student.performance.technical}/5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Communication</span>
                                  <span className="text-foreground">{student.performance.communication}/5</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Last evaluation: {student.lastEvaluation !== 'N/A' ? new Date(student.lastEvaluation).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">No evaluations yet</p>
                              </div>
                            )}
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
                            {student.internship && (
                              <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                                <Award className="w-4 h-4 mr-2" />
                                Evaluate
                              </Button>
                            )}
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
        <MobileHeader 
          title="My Students"
          subtitle="Monitor and manage your advisee students"
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
                <div className="text-2xl font-bold text-success">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
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
                <div className="text-2xl font-bold text-destructive">{stats.noInternship}</div>
                <div className="text-xs text-muted-foreground">No Internship</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no-internship">No Internship</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterProgram} onValueChange={setFilterProgram}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No students found</p>
                </CardContent>
              </Card>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col gap-3">
                      {/* Student Info */}
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm">{student.name}</h3>
                          <p className="text-xs text-muted-foreground">{student.program} - Year {student.year}</p>
                          <div className="flex flex-col gap-1 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {student.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Internship Info */}
                      {student.internship ? (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(student.internship.status)}>
                              {student.internship.status}
                            </Badge>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{student.internship.position}</div>
                            <div className="text-xs text-muted-foreground">{student.internship.company}</div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold text-foreground">{student.internship.progress}%</span>
                            </div>
                            <Progress value={student.internship.progress} className="h-1.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-muted/50 rounded-lg mt-2">
                          <p className="text-xs text-muted-foreground">No active internship</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        {student.internship && (
                          <Button size="sm" className="flex-1 text-xs bg-primary hover:bg-primary/90">
                            <Award className="w-3 h-3 mr-1" />
                            Evaluate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        <BottomNavigation type="advisor" />
      </div>
    </div>
  );
}

