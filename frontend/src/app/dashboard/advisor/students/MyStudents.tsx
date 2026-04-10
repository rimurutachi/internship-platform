'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, Award, Eye, Loader2, AlertCircle, Clock, Target, Calendar, TrendingUp, BookOpen, Hash } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { advisorStudentsAPI, type StudentListItem, type StudentDetails } from '@/lib/api/advisor-students';
import { hoursApi } from '@/lib/api/hours';
import type { InternshipHoursSummary } from '@/types/hours';

export default function MyStudents() {
  const router = useRouter();
  
  // State
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [yearLevelFilter, setYearLevelFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Hours data for selected student
  const [studentHoursSummary, setStudentHoursSummary] = useState<InternshipHoursSummary | null>(null);
  
  // Hours data map for all students (internshipId -> progress)
  const [hoursProgressMap, setHoursProgressMap] = useState<Record<string, number>>({});

  // Load students
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { students: fetchedStudents } = await advisorStudentsAPI.getMyStudents();
      // Sort students alphabetically by last name (extract last word from name)
      const sortedStudents = [...fetchedStudents].sort((a, b) => {
        const lastNameA = a.name.split(' ').slice(-1)[0]?.toLowerCase() || '';
        const lastNameB = b.name.split(' ').slice(-1)[0]?.toLowerCase() || '';
        return lastNameA.localeCompare(lastNameB);
      });
      setStudents(sortedStudents);
      
      // Fetch hours data for all students with internships
      const progressMap: Record<string, number> = {};
      await Promise.all(
        fetchedStudents
          .filter(s => s.internship?.id)
          .map(async (student) => {
            try {
              const hoursResult = await hoursApi.getInternshipHoursSummary(student.internship!.id);
              if (hoursResult.success && hoursResult.data) {
                progressMap[student.internship!.id] = hoursResult.data.progress_percentage;
              }
            } catch (e) {
              console.error(`Failed to fetch hours for student ${student.id}:`, e);
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

  const handleViewDetails = async (studentId: string) => {
    try {
      setDetailsLoading(true);
      setShowDetails(true);
      setError(null);
      setStudentHoursSummary(null);
      
      const { student } = await advisorStudentsAPI.getStudentDetails(studentId);
      setSelectedStudent(student);
      
      // Fetch hours data if student has internship
      if (student.internship?.id) {
        try {
          const hoursResult = await hoursApi.getInternshipHoursSummary(student.internship.id);
          if (hoursResult.success && hoursResult.data) {
            setStudentHoursSummary(hoursResult.data);
          }
        } catch (e) {
          console.error('Failed to fetch hours:', e);
        }
      }
    } catch (err: any) {
      console.error('Error loading student details:', err);
      setError(err.message || 'Failed to load student details');
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };



  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase());
    
    // For status filter: null internship students show under 'all' and 'no_internship'
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'no_internship' && !student.internship) ||
      (statusFilter !== 'no_internship' && student.internship?.status === statusFilter);
    const matchesProgram = programFilter === 'all' || student.program === programFilter;
    const matchesSection = sectionFilter === 'all' || student.section === sectionFilter;
    const matchesYearLevel = yearLevelFilter === 'all' || student.year_level === yearLevelFilter;
    
    return matchesSearch && matchesStatus && matchesProgram && matchesSection && matchesYearLevel;
  });

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.internship?.status === 'active').length,
    pending: students.filter(s => s.internship?.status === 'pending').length,
    completed: students.filter(s => s.internship?.status === 'completed').length,
    noInternship: students.filter(s => !s.internship).length,
  };

  // Get unique programs for filter
  const programs = Array.from(new Set(students.map(s => s.program)));

  // Get unique sections for filter (exclude N/A and empty)
  const sections = Array.from(new Set(students.map(s => s.section).filter(s => s && s !== 'N/A'))).sort();

  // Get unique year levels for filter (exclude N/A and empty)
  const yearLevels = Array.from(new Set(students.map(s => s.year_level).filter(s => s && s !== 'N/A'))).sort();

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400';
    switch (status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (student: typeof students[0]) => {
    if (!student.internship) return 'No Internship Yet';
    return student.internship.status.charAt(0).toUpperCase() + student.internship.status.slice(1);
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
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
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
          
          <div className="flex-1 overflow-y-auto p-8 bg-muted">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Students</h1>
                <p className="text-muted-foreground mt-1">Monitor and manage your advisee students</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="border-destructive bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Students</div>
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
                <Card>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-slate-500">{stats.noInternship}</div>
                    <div className="text-sm text-muted-foreground mt-1">No Internship Yet</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search students..."
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
                        <SelectItem value="no_internship">No Internship Yet</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={programFilter} onValueChange={setProgramFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(program => (
                          <SelectItem key={program} value={program}>{program}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {yearLevels.length > 0 && (
                      <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Year Levels</SelectItem>
                          {yearLevels.map(yl => (
                            <SelectItem key={yl} value={yl}>{yl}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {sections.length > 0 && (
                      <Select value={sectionFilter} onValueChange={setSectionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          {sections.map(section => (
                            <SelectItem key={section} value={section}>Section {section}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No students found</p>
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
                              {student.avatar_url ? (
                                <AvatarImage src={student.avatar_url} alt={student.name} />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                                <Badge className={`${getStatusColor(student.internship?.status)} text-xs border`}>
                                  {getStatusLabel(student)}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {student.program}
                                </span>
                                {student.year_level && student.year_level !== 'N/A' && (
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {student.year_level}
                                  </span>
                                )}
                                {student.section && student.section !== 'N/A' && (
                                  <span className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    Section {student.section}
                                  </span>
                                )}
                              </div>

                              {student.internship ? (
                                <div className="bg-muted rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-foreground">{student.internship.company}</p>
                                      <p className="text-sm text-muted-foreground">{student.internship.position}</p>
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground">
                                      Started {new Date(student.internship.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                  
                                  {/* Progress Bar */}
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
                                </div>
                              ) : (
                                <div className="bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-3">
                                  <p className="text-sm text-muted-foreground">
                                    ⏳ Student is pre-assigned to you but has no active internship yet.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {student.internship && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(student.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            )}
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

            {/* Mobile Section Filter */}
            {sections.length > 0 && (
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>Section {section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Mobile Year Level Filter */}
            {yearLevels.length > 0 && (
              <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Year Levels</SelectItem>
                  {yearLevels.map(yl => (
                    <SelectItem key={yl} value={yl}>{yl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Students List - Mobile */}
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      {student.avatar_url ? (
                        <AvatarImage src={student.avatar_url} alt={student.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate">{student.name}</h3>
                        <Badge className={`${getStatusColor(student.internship?.status)} text-xs border`}>
                          {getStatusLabel(student)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{student.program}</p>
                      {student.year_level && student.year_level !== 'N/A' && (
                        <p className="text-xs text-muted-foreground">{student.year_level}{student.section && student.section !== 'N/A' ? ` · Section ${student.section}` : ''}</p>
                      )}
                    </div>
                  </div>

                  {student.internship ? (
                    <div className="bg-muted rounded p-3 mb-3 space-y-2">
                      <p className="font-semibold text-sm">{student.internship.company}</p>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
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
                  ) : (
                    <div className="bg-muted/50 border border-dashed border-muted-foreground/30 rounded p-2 mb-3">
                      <p className="text-xs text-muted-foreground">⏳ No internship assigned yet</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {student.internship && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(student.id)}
                        className="flex-1 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
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
                  {selectedStudent.avatar_url ? (
                    <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                      {getInitials(selectedStudent.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{selectedStudent.name}</h2>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{selectedStudent.program}</Badge>
                    {selectedStudent.year_level && selectedStudent.year_level !== 'N/A' && (
                      <Badge variant="outline">{selectedStudent.year_level}</Badge>
                    )}
                    {selectedStudent.section && selectedStudent.section !== 'N/A' && (
                      <Badge variant="outline">Section {selectedStudent.section}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Internship Details */}
              {selectedStudent.internship && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-lg">Current Internship</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-semibold">{selectedStudent.internship.company}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-semibold">{selectedStudent.internship.position}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-semibold">{new Date(selectedStudent.internship.startDate).toLocaleDateString()}</p>
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
                      <p className="text-lg font-bold">{studentHoursSummary.days_reported}</p>
                      <p className="text-xs text-muted-foreground">Days</p>
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

              {/* Actions */}
              <div className="flex gap-3">

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

