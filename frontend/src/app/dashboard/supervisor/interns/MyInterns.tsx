'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, Award, Eye, Loader2, AlertCircle, Clock, Target, Calendar, TrendingUp, Building2 } from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import supervisorStudentsAPI, { SupervisorStudent } from '@/lib/api/supervisor-students';
import { hoursApi } from '@/lib/api/hours';
import type { InternshipHoursSummary } from '@/types/hours';
import { createSupabaseClient } from '@/lib/supabase';

export default function MyInterns() {
  const router = useRouter();
  
  // State
  const [students, setStudents] = useState<SupervisorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<SupervisorStudent | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Hours data for selected student
  const [studentHoursSummary, setStudentHoursSummary] = useState<InternshipHoursSummary | null>(null);
  const [approvedDTRCount, setApprovedDTRCount] = useState<number>(0);
  
  // Hours data map for all interns (internshipId -> progress)
  const [hoursProgressMap, setHoursProgressMap] = useState<Record<string, number>>({});

  // Load students
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supervisorStudentsAPI.getMyStudents();
      setStudents(data || []);
      
      // Fetch hours data for all interns with internships
      const progressMap: Record<string, number> = {};
      await Promise.all(
        (data || [])
          .filter(s => s.internship?.id)
          .map(async (student) => {
            try {
              const hoursResult = await hoursApi.getInternshipHoursSummary(student.internship!.id);
              if (hoursResult.success && hoursResult.data) {
                progressMap[student.internship!.id] = hoursResult.data.progress_percentage;
              }
            } catch (e) {
              console.error(`Failed to fetch hours for intern ${student.id}:`, e);
            }
          })
      );
      setHoursProgressMap(progressMap);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (student: SupervisorStudent) => {
    setDetailsLoading(true);
    setShowDetails(true);
    setError(null);
    setSelectedStudent(student);
    setStudentHoursSummary(null);
    setApprovedDTRCount(0);
    
    // Fetch hours data if student has internship
    if (student.internship?.id) {
      try {
        const hoursResult = await hoursApi.getInternshipHoursSummary(student.internship.id);
        
        if (hoursResult.success && hoursResult.data) {
          setStudentHoursSummary(hoursResult.data);
          // Fallback if the backend is not yet restarted: keep it 0 or use days_reported if casted
        }
      } catch (e) {
        console.error('Failed to fetch hours:', e);
      }
    }
    
    setDetailsLoading(false);
  };



  // Filter students
  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`;
    const matchesSearch = 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.internship?.position?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.internship?.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || student.internship?.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.internship?.status === 'active').length,
    pending: students.filter(s => s.internship?.status === 'pending').length,
    completed: students.filter(s => s.internship?.status === 'completed').length
  };

  // Get unique departments for filter
  const departments = Array.from(new Set(
    students.map(s => s.internship?.department).filter((d): d is string => !!d)
  ));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first[0]}${last[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <SupervisorSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <SupervisorHeader />
          
          <div className="flex-1 overflow-y-auto p-8 bg-muted">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Interns</h1>
                <p className="text-muted-foreground mt-1">Monitor and evaluate your interns' performance</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-destructive bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Interns</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-primary">{stats.active}</div>
                    <div className="text-sm text-muted-foreground mt-1">Active</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-muted-foreground mt-1">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground mt-1">Completed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search interns..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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

              {/* Interns List */}
              {filteredStudents.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No interns found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          {/* Student Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-14 w-14">
                              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {getInitials(student.first_name, student.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-foreground">
                                  {student.first_name} {student.last_name}
                                </h3>
                                {student.internship?.status && (
                                  <Badge className={`${getStatusColor(student.internship.status)} text-xs border`}>
                                    {student.internship.status.charAt(0).toUpperCase() + student.internship.status.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </span>
                                {student.program && (
                                  <span className="flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    {student.program}
                                  </span>
                                )}
                              </div>

                              {/* Internship Info with Progress */}
                              {student.internship && (
                                <div className="bg-muted rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-foreground">{student.internship.position || student.internship.title}</p>
                                      <p className="text-sm text-muted-foreground">{student.internship.department || 'N/A'}</p>
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground">
                                      {student.internship.start_date && (
                                        <>Started {new Date(student.internship.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  {student.internship?.progress !== undefined && (
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Hours Progress</span>
                                        <span className="font-semibold text-primary">
                                          {hoursProgressMap[student.internship.id]?.toFixed(1) || student.internship.progress}%
                                        </span>
                                      </div>
                                      <Progress 
                                        value={hoursProgressMap[student.internship.id] || student.internship.progress} 
                                        className="h-2" 
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Performance Column */}
                          <div className="w-40">
                            <p className="text-sm font-semibold text-foreground mb-2">Performance</p>
                            {student.latest_evaluation ? (
                              <div className="space-y-1 text-sm">
                                {student.latest_evaluation.rating_overall && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Overall</span>
                                    <span className="font-semibold text-primary">{student.latest_evaluation.rating_overall}/10</span>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last: {new Date(student.latest_evaluation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No evaluations</p>
                            )}
                          </div>

                          {/* Actions - View Details only */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(student)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
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
          title="My Interns"
          subtitle={`${filteredStudents.length} intern${filteredStudents.length !== 1 ? 's' : ''}`}
          logo={
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          }
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">{stats.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Interns List - Mobile */}
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate">{student.first_name} {student.last_name}</h3>
                        {student.internship?.status && (
                          <Badge className={`${getStatusColor(student.internship.status)} text-xs border`}>
                            {student.internship.status}
                          </Badge>
                        )}
                      </div>
                      {student.internship && (
                        <p className="text-xs text-muted-foreground">{student.internship.position}</p>
                      )}
                    </div>
                  </div>

                  {student.internship?.progress !== undefined && (
                    <div className="bg-muted rounded p-3 mb-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Hours Progress</span>
                          <span className="font-semibold">
                            {hoursProgressMap[student.internship.id]?.toFixed(1) || student.internship.progress}%
                          </span>
                        </div>
                        <Progress 
                          value={hoursProgressMap[student.internship.id] || student.internship.progress} 
                          className="h-1.5" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(student)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNavigation type="supervisor" />
      </div>

      {/* Intern Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Intern Details</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedStudent ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedStudent.program && <Badge variant="outline">{selectedStudent.program}</Badge>}
                    {selectedStudent.university && <Badge variant="outline">{selectedStudent.university}</Badge>}
                  </div>
                </div>
              </div>

              {/* Internship Details */}
              {selectedStudent.internship && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-lg">Internship Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-semibold">{selectedStudent.internship.position || selectedStudent.internship.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-semibold">{selectedStudent.internship.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-semibold">
                        {selectedStudent.internship.start_date 
                          ? new Date(selectedStudent.internship.start_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedStudent.internship.status || 'pending')}>
                        {selectedStudent.internship.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Hours Progress - Full Display */}
              {studentHoursSummary && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Hours Progress</h3>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {studentHoursSummary.total_hours_worked} / {studentHoursSummary.required_hours} hours
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {studentHoursSummary.progress_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={studentHoursSummary.progress_percentage} className="h-3" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border bg-muted/50 text-center">
                      <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{studentHoursSummary.total_hours_worked}</p>
                      <p className="text-xs text-muted-foreground">Worked</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/50 text-center">
                      <Target className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{studentHoursSummary.remaining_hours}</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/50 text-center">
                      <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold">{studentHoursSummary.weeks_reported ?? (studentHoursSummary as any).days_reported ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Weeks</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/50 text-center">
                      <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-bold">
                        {studentHoursSummary.projected_end_date 
                          ? new Date(studentHoursSummary.projected_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'TBD'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">Est. End</p>
                    </div>
                  </div>

                  {/* Completion Status */}
                  {studentHoursSummary.is_completed && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center">
                      <p className="font-medium">✅ Hours requirement completed!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Latest Evaluation - Enhanced Display */}
              {selectedStudent.latest_evaluation && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Final Evaluation
                    </h3>
                    <Badge className={
                      selectedStudent.latest_evaluation.status === 'approved' 
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : selectedStudent.latest_evaluation.status === 'submitted'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                    }>
                      {selectedStudent.latest_evaluation.status || 'draft'}
                    </Badge>
                  </div>
                  
                  {/* Score Summary */}
                  {(selectedStudent.latest_evaluation.total_score !== undefined || selectedStudent.latest_evaluation.final_grade !== undefined) && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {selectedStudent.latest_evaluation.total_score ?? 'N/A'}
                          <span className="text-sm font-normal text-muted-foreground">/70</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Total Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {selectedStudent.latest_evaluation.total_score 
                            ? `${((selectedStudent.latest_evaluation.total_score / 70) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">Percentage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {selectedStudent.latest_evaluation.final_grade?.toFixed(2) ?? 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">Final Grade</p>
                      </div>
                    </div>
                  )}

                  {/* Criterion Scores */}
                  {selectedStudent.latest_evaluation.criterion_scores && selectedStudent.latest_evaluation.criterion_scores.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground">Rubric Criteria Scores</p>
                      <div className="space-y-1">
                        {selectedStudent.latest_evaluation.criterion_scores.map((score, idx) => (
                          <div key={`${score.criterion_code}-${idx}`} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                            <span className="text-muted-foreground">{score.criterion_code}. {score.criterion_name}</span>
                            <span className="font-semibold text-primary">{score.score}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attendance & Punctuality */}
                  {(selectedStudent.latest_evaluation.attendance || selectedStudent.latest_evaluation.punctuality) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedStudent.latest_evaluation.attendance || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Punctuality</p>
                        <Badge variant="outline" className="capitalize">
                          {selectedStudent.latest_evaluation.punctuality || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Supervisor Comments */}
                  {selectedStudent.latest_evaluation.supervisor_comments && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Supervisor's Comment</p>
                      <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">
                        {selectedStudent.latest_evaluation.supervisor_comments}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Evaluated on {new Date(selectedStudent.latest_evaluation.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* No Evaluation Yet */}
              {!selectedStudent.latest_evaluation && (
                <div className="border rounded-lg p-4 text-center">
                  <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No evaluation has been submitted yet for this intern.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the Evaluations page to create a final evaluation.
                  </p>
                </div>
              )}


            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

