'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Building2,
  Loader2
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import supervisorStudentsAPI, { SupervisorStudent } from '@/lib/api/supervisor-students';

export default function MyInterns() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<SupervisorStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<SupervisorStudent | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supervisorStudentsAPI.getMyStudents();
      setStudents(data || []);
    } catch (err: any) {
      console.error('Failed to load students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`;
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.internship?.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || student.internship?.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || student.internship?.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.internship?.status === 'active').length,
    completed: students.filter(s => s.internship?.status === 'completed').length,
    pending: students.filter(s => s.internship?.status === 'pending').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewDetails = (student: SupervisorStudent) => {
    setSelectedStudent(student);
    setShowDetailsDialog(true);
  };

  const handleSendMessage = (student: SupervisorStudent) => {
    router.push(`/dashboard/supervisor/messages?userId=${student.id}`);
  };

  const handleEvaluate = (student: SupervisorStudent) => {
    if (student.internship?.id) {
      router.push(`/dashboard/supervisor/evaluations/create?internshipId=${student.internship.id}`);
    }
  };

  // Get unique departments for filter
  const departments = Array.from(new Set(
    students
      .map(s => s.internship?.department)
      .filter((d): d is string => !!d)
  ));

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadStudents}>Try Again</Button>
        </div>
      </div>
    );
  }

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
                    <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
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
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Interns List */}
              <div className="space-y-4">
                {filteredStudents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No interns found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredStudents.map((student) => (
                    <Card key={student.id} className="hover:shadow-card transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Student Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src="/placeholder.svg" alt={`${student.first_name} ${student.last_name}`} />
                              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {student.first_name[0]}{student.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {student.first_name} {student.last_name}
                                </h3>
                                {student.internship?.status && (
                                  <Badge className={getStatusColor(student.internship.status)}>
                                    {student.internship.status}
                                  </Badge>
                                )}
                              </div>
                              {student.internship && (
                                <>
                                      <p className="text-sm font-medium text-foreground">{student.internship.position || student.internship.title}</p>
                                  <p className="text-sm text-muted-foreground">{student.internship.department || 'N/A'}</p>
                                </>
                              )}
                              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {student.email}
                                </span>
                                {student.internship?.start_date && student.internship?.end_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(student.internship.start_date).toLocaleDateString()} - {new Date(student.internship.end_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="flex-1">
                            <div className="space-y-3">
                              {student.internship?.progress !== undefined && (
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Internship Progress</span>
                                    <span className="font-semibold text-foreground">{student.internship.progress}%</span>
                                  </div>
                                  <Progress value={student.internship.progress} className="h-2" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {student.university && <span className="block">{student.university}</span>}
                                  {student.program && <span className="block">{student.program}</span>}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Performance */}
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground mb-3">Performance</div>
                            {student.latest_evaluation ? (
                              <div className="space-y-2">
                                {student.latest_evaluation.rating_overall && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Overall</span>
                                    <span className="font-semibold text-primary">{student.latest_evaluation.rating_overall}/10</span>
                                  </div>
                                )}
                                {student.latest_evaluation.rating_technical && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Technical</span>
                                    <span className="text-foreground">{student.latest_evaluation.rating_technical}/10</span>
                                  </div>
                                )}
                                {student.latest_evaluation.rating_communication && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Communication</span>
                                    <span className="text-foreground">{student.latest_evaluation.rating_communication}/10</span>
                                  </div>
                                )}
                                {student.latest_evaluation.rating_work_ethic && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Work Ethic</span>
                                    <span className="text-foreground">{student.latest_evaluation.rating_work_ethic}/10</span>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-2">
                                  Last evaluation: {new Date(student.latest_evaluation.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No evaluations yet</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewDetails(student)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleSendMessage(student)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                            <Button 
                              size="sm" 
                              className="w-full bg-primary hover:bg-primary/90"
                              onClick={() => handleEvaluate(student)}
                              disabled={!student.internship}
                            >
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
            subtitle={students[0]?.internship?.company?.name || 'Company'}
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
                <div className="text-xl font-bold text-warning">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
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
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interns List - Mobile */}
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No interns found</p>
                </CardContent>
              </Card>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-card transition-shadow">
                  <CardContent className="p-4 space-y-4">
                    {/* Student Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="/placeholder.svg" alt={`${student.first_name} ${student.last_name}`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {student.first_name[0]}{student.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {student.first_name} {student.last_name}
                          </h3>
                          {student.internship?.status && (
                            <Badge className={getStatusColor(student.internship.status || 'pending')}>
                              {student.internship.status}
                            </Badge>
                          )}
                        </div>
                        {student.internship && (
                          <>
                            <p className="text-sm text-muted-foreground">{student.internship.position}</p>
                            <p className="text-xs text-muted-foreground">{student.internship.department || 'N/A'}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    {student.internship?.progress !== undefined && (
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold text-foreground">{student.internship.progress}%</span>
                          </div>
                          <Progress value={student.internship.progress} className="h-2" />
                        </div>
                      </div>
                    )}

                    {/* Performance */}
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">Performance</div>
                      {student.latest_evaluation ? (
                        <>
                          {student.latest_evaluation.rating_overall && (
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Overall</span>
                              <span className="font-semibold text-primary">{student.latest_evaluation.rating_overall}/10</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Last: {new Date(student.latest_evaluation.created_at).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No evaluations yet</p>
                      )}
                    </div>

                    {/* Actions - Mobile */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewDetails(student)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => handleEvaluate(student)}
                        disabled={!student.internship}
                      >
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

      {/* Student Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View detailed information about this student intern
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{selectedStudent.email}</p>
                  </div>
                  {selectedStudent.university && (
                    <div>
                      <p className="text-muted-foreground">University</p>
                      <p className="font-medium text-foreground">{selectedStudent.university}</p>
                    </div>
                  )}
                  {selectedStudent.program && (
                    <div>
                      <p className="text-muted-foreground">Program</p>
                      <p className="font-medium text-foreground">{selectedStudent.program}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Internship Info */}
              {selectedStudent.internship && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Internship Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-medium text-foreground">
                        {selectedStudent.internship.position}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium text-foreground">
                        {selectedStudent.internship.department || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-medium text-foreground">
                        {selectedStudent.internship.company?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedStudent.internship.status || 'pending')}>
                        {selectedStudent.internship.status}
                      </Badge>
                    </div>
                    {selectedStudent.internship.start_date && (
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium text-foreground">
                          {new Date(selectedStudent.internship.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selectedStudent.internship.end_date && (
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium text-foreground">
                          {new Date(selectedStudent.internship.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance */}
                    {selectedStudent.latest_evaluation && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Latest Evaluation</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {selectedStudent.latest_evaluation.rating_overall && (
                      <div>
                        <p className="text-muted-foreground">Overall</p>
                        <p className="text-2xl font-bold text-primary">
                          {selectedStudent.latest_evaluation.rating_overall}/10
                        </p>
                      </div>
                    )}
                    {selectedStudent.latest_evaluation.rating_technical && (
                      <div>
                        <p className="text-muted-foreground">Technical</p>
                        <p className="text-2xl font-bold text-foreground">
                          {selectedStudent.latest_evaluation.rating_technical}/10
                        </p>
                      </div>
                    )}
                    {selectedStudent.latest_evaluation.rating_communication && (
                      <div>
                        <p className="text-muted-foreground">Communication</p>
                        <p className="text-2xl font-bold text-foreground">
                          {selectedStudent.latest_evaluation.rating_communication}/10
                        </p>
                      </div>
                    )}
                    {selectedStudent.latest_evaluation.rating_work_ethic && (
                      <div>
                        <p className="text-muted-foreground">Work Ethic</p>
                        <p className="text-2xl font-bold text-foreground">
                          {selectedStudent.latest_evaluation.rating_work_ethic}/10
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Evaluated on {new Date(selectedStudent.latest_evaluation.created_at).toLocaleDateString()}
                  </p>
                </div>
                  )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleSendMessage(selectedStudent)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleEvaluate(selectedStudent);
                  }}
                  disabled={!selectedStudent.internship}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Create Evaluation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

