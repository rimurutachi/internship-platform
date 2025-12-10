'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, Award, MessageSquare, Eye, X, MapPin, Calendar, Building2, Loader2, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { advisorStudentsAPI, type StudentListItem, type StudentDetails } from '@/lib/api/advisor-students';

export default function MyStudents() {
  const router = useRouter();
  
  // State
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Load students
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 [MyStudents] Starting to load students...');
      const { students: fetchedStudents } = await advisorStudentsAPI.getMyStudents();
      console.log('🔵 [MyStudents] Fetched students:', fetchedStudents);
      console.log('🔵 [MyStudents] Students count:', fetchedStudents?.length || 0);
      setStudents(fetchedStudents);
    } catch (err: any) {
      console.error('❌ [MyStudents] Error loading students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (studentId: string) => {
    try {
      setDetailsLoading(true);
      setShowDetails(true);
      setError(null);
      
      const { student } = await advisorStudentsAPI.getStudentDetails(studentId);
      setSelectedStudent(student);
    } catch (err: any) {
      console.error('Error loading student details:', err);
      setError(err.message || 'Failed to load student details');
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSendMessage = (studentId: string) => {
    router.push(`/dashboard/advisor/messages?userId=${studentId}`);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      student.internship?.status === statusFilter;
    
    const matchesProgram = 
      programFilter === 'all' || 
      student.program === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.internship?.status === 'active').length,
    pending: students.filter(s => s.internship?.status === 'pending').length,
    completed: students.filter(s => s.internship?.status === 'completed').length
  };

  // Get unique programs for filter
  const programs = Array.from(new Set(students.map(s => s.program)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdvisorSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdvisorHeader />
          
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">My Students</h1>
                <p className="text-gray-600 mt-2 text-lg">Monitor and manage your advisee students</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-base text-gray-600 mt-1">Total Students</div>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-[#4CAF50]">{stats.active}</div>
                    <div className="text-base text-gray-600 mt-1">Active Internships</div>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-base text-gray-600 mt-1">Pending</div>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
                    <div className="text-base text-gray-600 mt-1">Completed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="Search students..."
                        className="pl-10 h-11 text-base border-gray-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 text-base border-gray-300">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={programFilter} onValueChange={setProgramFilter}>
                      <SelectTrigger className="h-11 text-base border-gray-300">
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(program => (
                          <SelectItem key={program} value={program}>{program}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500 text-lg">No students found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="bg-white border border-gray-200 hover:border-[#4CAF50]/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-16 w-16">
                              {student.avatar_url ? (
                                <AvatarImage src={student.avatar_url} alt={student.name} />
                              ) : (
                                <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] text-xl font-semibold">
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                                {student.internship && (
                                  <Badge className={`${getStatusColor(student.internship.status)} text-sm px-3 py-1 border`}>
                                    {student.internship.status.charAt(0).toUpperCase() + student.internship.status.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-base text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  {student.email}
                                </div>
                                <div className="flex items-center gap-2 text-base text-gray-600">
                                  <Award className="h-4 w-4" />
                                  {student.program} - Year {student.year}
                                  </div>
                              </div>

                              {student.internship && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-gray-900 text-base">{student.internship.company}</p>
                                      <p className="text-sm text-gray-600">{student.internship.position}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-600">
                                        {new Date(student.internship.startDate).toLocaleDateString()} - {new Date(student.internship.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-gray-600">Progress</span>
                                      <span className="font-semibold text-gray-900">{student.internship.progress}%</span>
                                    </div>
                                    <Progress value={student.internship.progress} className="h-2" />
                                  </div>

                                  {student.performance.overall > 0 && (
                                    <div className="grid grid-cols-4 gap-3 pt-2 border-t">
                                      <div>
                                        <p className="text-xs text-gray-500">Overall</p>
                                        <p className="text-lg font-bold text-[#4CAF50]">{student.performance.overall.toFixed(1)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Technical</p>
                                        <p className="text-lg font-bold text-gray-900">{student.performance.technical.toFixed(1)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Communication</p>
                                        <p className="text-lg font-bold text-gray-900">{student.performance.communication.toFixed(1)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Work Ethic</p>
                                        <p className="text-lg font-bold text-gray-900">{student.performance.workEthic.toFixed(1)}</p>
                                      </div>
                                    </div>
                                  )}

                                  {student.lastEvaluation && (
                                    <p className="text-xs text-gray-500 pt-2">
                                      Last evaluation: {new Date(student.lastEvaluation).toLocaleDateString()} ({student.evaluationCount} total)
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(student.id)}
                              className="border-gray-300"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendMessage(student.id)}
                              className="border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="My Students"
          subtitle={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-[#4CAF50]">{stats.active}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(program => (
                    <SelectItem key={program} value={program}>{program}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Students List */}
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      {student.avatar_url ? (
                        <AvatarImage src={student.avatar_url} alt={student.name} />
                      ) : (
                        <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] text-sm font-semibold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate">{student.name}</h3>
                        {student.internship && (
                          <Badge className={`${getStatusColor(student.internship.status)} text-xs px-2 py-0.5 border`}>
                            {student.internship.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{student.email}</p>
                      <p className="text-xs text-gray-600">{student.program}</p>
                    </div>
                  </div>

                  {student.internship && (
                    <div className="bg-gray-50 rounded p-3 mb-3 space-y-2">
                      <p className="font-semibold text-sm">{student.internship.company}</p>
                      <p className="text-xs text-gray-600">{student.internship.position}</p>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{student.internship.progress}%</span>
                        </div>
                        <Progress value={student.internship.progress} className="h-1.5" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(student.id)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(student.id)}
                      className="flex-1 text-xs border-[#4CAF50] text-[#4CAF50]"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNavigation type="advisor" />
      </div>

      {/* Student Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Student Details</span>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
            </div>
          ) : selectedStudent ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  {selectedStudent.avatar_url ? (
                    <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} />
                  ) : (
                    <AvatarFallback className="bg-[#4CAF50]/10 text-[#4CAF50] text-2xl font-semibold">
                      {getInitials(selectedStudent.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{selectedStudent.program}</Badge>
                    <Badge variant="outline">Year {selectedStudent.year}</Badge>
                    {selectedStudent.student_id && <Badge variant="outline">{selectedStudent.student_id}</Badge>}
                  </div>
                </div>
              </div>

              {/* Internship Details */}
              {selectedStudent.internship && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-lg">Current Internship</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-semibold">{selectedStudent.internship.company}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Position</p>
                      <p className="font-semibold">{selectedStudent.internship.position}</p>
                    </div>
                    {selectedStudent.internship.companyLocation && (
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold">{selectedStudent.internship.companyLocation}</p>
                      </div>
                    )}
                    {selectedStudent.internship.companyIndustry && (
                      <div>
                        <p className="text-sm text-gray-600">Industry</p>
                        <p className="font-semibold">{selectedStudent.internship.companyIndustry}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-semibold">{new Date(selectedStudent.internship.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-semibold">{new Date(selectedStudent.internship.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold">{selectedStudent.internship.progress}%</span>
                    </div>
                    <Progress value={selectedStudent.internship.progress} className="h-3" />
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {selectedStudent.performance && selectedStudent.performance.overall > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#4CAF50]">{selectedStudent.performance.overall.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Overall</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{selectedStudent.performance.technical.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Technical</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{selectedStudent.performance.communication.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Communication</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{selectedStudent.performance.workEthic.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Work Ethic</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Based on {selectedStudent.evaluationCount} evaluation{selectedStudent.evaluationCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Recent Reports */}
              {selectedStudent.recentReports && selectedStudent.recentReports.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4">Recent Weekly Reports</h3>
                  <div className="space-y-2">
                    {selectedStudent.recentReports.slice(0, 5).map((report: any) => (
                      <div key={report.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Week {report.week_number}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.status || 'submitted'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleSendMessage(selectedStudent.id)}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049]"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

