'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  CheckCircle2,
  Users,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { getAdminMOASignedUrl } from '@/lib/api/document-requirements';

// Available programs for CvSU-BC
const PROGRAMS = [
  { code: 'BSPsych', name: 'Bachelor of Science in Psychology' },
  { code: 'BSCrim', name: 'Bachelor of Science in Criminology' },
  { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
  { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
  { code: 'BSEd-Math', name: 'Bachelor of Secondary Education major in Mathematics' },
  { code: 'BSEd-English', name: 'Bachelor of Secondary Education major in English' },
  { code: 'BSEd-Filipino', name: 'Bachelor of Secondary Education major in Filipino' },
  { code: 'BSBA-HRM', name: 'Bachelor of Science in Business Administration major in Human Resource Management' },
  { code: 'BSBA-MM', name: 'Bachelor of Science in Business Administration major in Marketing Management' },
  { code: 'BSHM', name: 'Bachelor of Science in Hospitality Management' },
];

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

interface MOASubmission {
  id: string;
  requirement_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: number;
  status: string;
  feedback: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  requirement_title: string;
  student_program: string;
  student_year_level: string;
  student_section: string;
  student_name: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    program: string;
    year_level: string;
    section: string;
  };
}

interface MOAStats {
  total_requirements: number;
  total_approved: number;
  total_pending: number;
  total_rejected: number;
  by_program: Record<string, number>;
}

interface ProgramGroup {
  program: string;
  programName: string;
  yearGroups: YearGroup[];
  totalCount: number;
  expanded: boolean;
}

interface YearGroup {
  year_level: string;
  sectionGroups: SectionGroup[];
}

interface SectionGroup {
  section: string;
  submissions: MOASubmission[];
}

export default function MOAManagementPage() {
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<MOASubmission[]>([]);
  const [stats, setStats] = useState<MOAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  // Fetch approved MOA submissions from backend
  const fetchMOASubmissions = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: Record<string, string> = { limit: '200' };
      if (filterProgram !== 'all') params.program = filterProgram;
      if (filterYear !== 'all') params.year_level = filterYear;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get('/admin/moa/submissions', { params });
      setSubmissions(response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to fetch MOA submissions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch approved MOA submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filterProgram, filterYear, searchQuery, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/moa/stats');
      setStats(response.data?.data || null);
    } catch (error: any) {
      console.error('Failed to fetch MOA stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMOASubmissions();
    fetchStats();
  }, [fetchMOASubmissions, fetchStats]);

  // Group submissions: Program → Year Level → Section
  const groupedByProgram: ProgramGroup[] = PROGRAMS.map((program) => {
    const programSubs = submissions.filter((s) => s.student_program === program.code);
    
    // Group by year level
    const yearGroups: YearGroup[] = YEAR_LEVELS
      .map((year) => {
        const yearSubs = programSubs.filter((s) => s.student_year_level === year);
        
        // Group by section
        const sections = new Set(yearSubs.map((s) => s.student_section));
        const sectionGroups: SectionGroup[] = Array.from(sections)
          .sort()
          .map((section) => ({
            section,
            submissions: yearSubs.filter((s) => s.student_section === section),
          }));
        
        return { year_level: year, sectionGroups };
      })
      .filter((yg) => yg.sectionGroups.length > 0);

    return {
      program: program.code,
      programName: program.name,
      yearGroups,
      totalCount: programSubs.length,
      expanded: expandedPrograms.has(program.code),
    };
  }).filter((group) => group.totalCount > 0);

  // Unassigned submissions
  const unassignedSubs = submissions.filter(
    (s) => s.student_program === 'Unassigned' || !PROGRAMS.find(p => p.code === s.student_program)
  );

  const toggleProgram = (programCode: string) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programCode)) {
        next.delete(programCode);
      } else {
        next.add(programCode);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPrograms(new Set(PROGRAMS.map((p) => p.code)));
  };

  const collapseAll = () => {
    setExpandedPrograms(new Set());
  };

  const handleViewFile = async (sub: MOASubmission) => {
    setLoadingUrl(sub.id);
    try {
      const response = await getAdminMOASignedUrl(sub.id);
      if (response.success && response.data?.signedUrl) {
        window.open(response.data.signedUrl, '_blank');
      } else {
        toast({ title: 'Error', description: 'Could not generate file URL', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Failed to get signed URL:', error);
      toast({ title: 'Error', description: error.message || 'Failed to open file', variant: 'destructive' });
    } finally {
      setLoadingUrl(null);
    }
  };

  const handleDownloadFile = async (sub: MOASubmission) => {
    setLoadingUrl(`dl-${sub.id}`);
    try {
      const response = await getAdminMOASignedUrl(sub.id);
      if (response.success && response.data?.signedUrl) {
        const a = document.createElement('a');
        a.href = response.data.signedUrl;
        a.download = sub.file_name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      } else {
        toast({ title: 'Error', description: 'Could not generate download URL', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Failed to get signed URL for download:', error);
      toast({ title: 'Error', description: error.message || 'Failed to download file', variant: 'destructive' });
    } finally {
      setLoadingUrl(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            MOA Management
          </h2>
          <p className="text-muted-foreground">
            Approved Memorandums of Agreement from advisor requirements, organized by program, year level, and section
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchMOASubmissions(); fetchStats(); }} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.total_approved ?? 0}</div>
                <div className="text-sm text-muted-foreground">Approved MOAs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.total_pending ?? 0}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats?.total_requirements ?? 0}</div>
                <div className="text-sm text-muted-foreground">MOA Requirements</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{groupedByProgram.filter(g => g.totalCount > 0).length}</div>
                <div className="text-sm text-muted-foreground">Programs with MOAs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, file name, or requirement..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {PROGRAMS.map((program) => (
                  <SelectItem key={program.code} value={program.code}>
                    {program.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Year level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEAR_LEVELS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MOA List by Program → Year → Section */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByProgram.map((group) => (
            <Card key={group.program}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleProgram(group.program)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {group.expanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.program}</CardTitle>
                      <CardDescription>{group.programName}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                    {group.totalCount} Approved MOA{group.totalCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              {group.expanded && (
                <CardContent className="space-y-6">
                  {group.yearGroups.map((yearGroup) => (
                    <div key={yearGroup.year_level}>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {yearGroup.year_level}
                      </h4>
                      {yearGroup.sectionGroups.map((sectionGroup) => (
                        <div key={sectionGroup.section} className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Section {sectionGroup.section}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({sectionGroup.submissions.length} submission{sectionGroup.submissions.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Requirement</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Date Approved</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sectionGroup.submissions.map((sub) => (
                                <TableRow key={sub.id}>
                                  <TableCell className="font-medium">
                                    {sub.student_name}
                                    <div className="text-xs text-muted-foreground">{sub.student?.email}</div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">{sub.requirement_title}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm truncate max-w-[200px] inline-block">{sub.file_name}</span>
                                  </TableCell>
                                  <TableCell className="text-sm">{formatFileSize(sub.file_size)}</TableCell>
                                  <TableCell className="text-sm">
                                    {sub.reviewed_at ? formatDate(sub.reviewed_at) : formatDate(sub.submitted_at)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {sub.file_url && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          title="View document"
                                          disabled={loadingUrl === sub.id}
                                          onClick={() => handleViewFile(sub)}
                                        >
                                          {loadingUrl === sub.id
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Eye className="w-4 h-4" />}
                                        </Button>
                                      )}
                                      {sub.file_url && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          title="Download document"
                                          disabled={loadingUrl === `dl-${sub.id}`}
                                          onClick={() => handleDownloadFile(sub)}
                                        >
                                          {loadingUrl === `dl-${sub.id}`
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Download className="w-4 h-4" />}
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}

          {/* Unassigned submissions */}
          {unassignedSubs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-yellow-600">Unassigned MOAs</CardTitle>
                <CardDescription>
                  These students don&apos;t have a program, year level, or section assigned yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedSubs.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.student_name}</TableCell>
                        <TableCell>{sub.requirement_title}</TableCell>
                        <TableCell>{sub.file_name}</TableCell>
                        <TableCell>{formatDate(sub.submitted_at)}</TableCell>
                        <TableCell>
                          {sub.file_url && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(sub.file_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {submissions.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Approved MOAs Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery || filterProgram !== 'all' || filterYear !== 'all'
                    ? 'Try adjusting your filters to find MOA submissions.'
                    : 'Approved MOA submissions from advisor requirements will appear here, organized by program, year level, and section.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
