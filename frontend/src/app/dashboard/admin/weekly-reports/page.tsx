'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Eye, Loader2, Search } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';

interface WeeklyReport {
  id: string;
  studentName: string;
  studentEmail?: string;
  internshipPosition?: string;
  company?: string;
  weekNumber: number;
  accomplishments: string;
  challenges?: string;
  learnings?: string;
  hoursRendered: number;
  weekStartDate?: string;
  weekEndDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  supervisorComment?: string;
  supervisorReviewedAt?: string;
}

const computeWeekDates = (startDate?: string, weekNumber?: number) => {
  if (!startDate || !weekNumber) return { week_start_date: '', week_end_date: '' };
  const start = new Date(startDate);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { week_start_date: weekStart.toISOString(), week_end_date: weekEnd.toISOString() };
};

const extractSections = (text: string) => {
  const match = text.match(/^(.*?)(?:\n\nChallenges:\s*([\s\S]*?))?(?:\n\nLearnings:\s*([\s\S]*?))?$/i);
  return {
    accomplishments: match?.[1]?.trim() || text.trim(),
    challenges: match?.[2]?.trim() || '',
    learnings: match?.[3]?.trim() || '',
  };
};

export default function AdminWeeklyReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session token available');

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      const res = await fetch(`${apiBase}/admin/weekly-reports`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Failed to fetch weekly reports');
      }

      const payload = await res.json();
      const mapped: WeeklyReport[] = (payload.data || []).map((report: any) => {
        const parsed = extractSections(report.accomplishments || '');
        const dates = computeWeekDates(report.internship?.start_date, report.week_number);
        const status = report.status === 'pending_approval' ? 'pending' : (report.status as WeeklyReport['status']);

        return {
          id: report.id,
          studentName: `${report.student?.first_name || ''} ${report.student?.last_name || ''}`.trim() || 'Unknown Student',
          studentEmail: report.student?.email,
          internshipPosition: report.internship?.position,
          company: report.internship?.companies?.name,
          weekNumber: report.week_number,
          accomplishments: parsed.accomplishments,
          challenges: parsed.challenges,
          learnings: parsed.learnings,
          hoursRendered: report.hours_rendered,
          weekStartDate: report.week_start_date || dates.week_start_date,
          weekEndDate: report.week_end_date || dates.week_end_date,
          status,
          submittedAt: report.created_at,
          supervisorComment: report.supervisor_comments,
          supervisorReviewedAt: report.approved_at || report.rejected_at,
        } satisfies WeeklyReport;
      });

      setReports(mapped);
      if (payload.stats) setStats({
        total: payload.stats.total || mapped.length,
        pending: payload.stats.pending || mapped.filter(r => r.status === 'pending').length,
        approved: payload.stats.approved || mapped.filter(r => r.status === 'approved').length,
        rejected: payload.stats.rejected || mapped.filter(r => r.status === 'rejected').length,
      });
    } catch (error: any) {
      console.error('❌ [Admin Weekly Reports] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load weekly reports',
        variant: 'destructive',
      });
      setReports([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (r.company?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border border-red-500/20';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Weekly Reports</h1>
                  <p className="text-muted-foreground mt-1">View all student weekly accomplishment reports</p>
                </div>
                <Button variant="outline" onClick={fetchReports} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Reports</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search by student or company..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 text-base"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="w-full md:w-56 h-11 text-base">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {loading ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <p className="text-muted-foreground text-lg">Loading reports...</p>
                    </CardContent>
                  </Card>
                ) : filteredReports.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <p className="text-muted-foreground text-lg">No reports found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredReports.map((report) => (
                    <Card key={report.id} className="hover:shadow-card transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={`${getStatusBadge(report.status)} text-sm px-3 py-1`}>{report.status}</Badge>
                              <span className="text-sm text-muted-foreground">Week {report.weekNumber}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-1">{report.studentName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{report.internshipPosition} {report.company ? `• ${report.company}` : ''}</p>
                            <p className="text-base text-foreground line-clamp-2">{report.accomplishments}</p>
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {report.weekStartDate ? new Date(report.weekStartDate).toLocaleDateString() : 'N/A'} - {report.weekEndDate ? new Date(report.weekEndDate).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {report.hoursRendered} hours
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" onClick={() => { setSelectedReport(report); setViewOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
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

      {/* Mobile */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader title="Weekly Reports" subtitle="All students" />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-foreground">{stats.total}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><div className="text-xs text-muted-foreground">Pending</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{stats.approved}</div><div className="text-xs text-muted-foreground">Approved</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-2xl font-bold text-red-600">{stats.rejected}</div><div className="text-xs text-muted-foreground">Rejected</div></CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search student or company"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <Card><CardContent className="py-10 text-center">Loading...</CardContent></Card>
          ) : filteredReports.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No reports found</CardContent></Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusBadge(report.status)} text-xs px-2 py-0.5`}>{report.status}</Badge>
                    <span className="text-xs text-muted-foreground">Week {report.weekNumber}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{report.studentName}</div>
                  <div className="text-xs text-muted-foreground">{report.internshipPosition} {report.company ? `• ${report.company}` : ''}</div>
                  <p className="text-sm text-foreground line-clamp-2">{report.accomplishments}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.weekStartDate ? new Date(report.weekStartDate).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.hoursRendered}h
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedReport(report); setViewOpen(true); }}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <BottomNavigation type="admin" />
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Weekly Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 mt-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{selectedReport.studentName}</h3>
                  <p className="text-sm text-muted-foreground">Week {selectedReport.weekNumber}</p>
                  {selectedReport.company && (
                    <p className="text-sm text-muted-foreground">{selectedReport.internshipPosition} • {selectedReport.company}</p>
                  )}
                </div>
                <Badge className={`${getStatusBadge(selectedReport.status)} text-sm px-3 py-1`}>{selectedReport.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Week Period</p>
                  <p className="font-medium text-foreground">
                    {selectedReport.weekStartDate ? new Date(selectedReport.weekStartDate).toLocaleDateString() : 'N/A'}
                    {selectedReport.weekEndDate ? ` - ${new Date(selectedReport.weekEndDate).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hours Rendered</p>
                  <p className="font-medium text-foreground">{selectedReport.hoursRendered} hours</p>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">Accomplishments</h4>
                <p className="text-sm text-foreground bg-muted p-4 rounded border">{selectedReport.accomplishments}</p>
              </div>

              {selectedReport.challenges && (
                <div>
                  <h4 className="text-base font-semibold text-foreground mb-2">Challenges</h4>
                  <p className="text-sm text-foreground bg-muted p-4 rounded border">{selectedReport.challenges}</p>
                </div>
              )}

              {selectedReport.learnings && (
                <div>
                  <h4 className="text-base font-semibold text-foreground mb-2">Learnings</h4>
                  <p className="text-sm text-foreground bg-muted p-4 rounded border">{selectedReport.learnings}</p>
                </div>
              )}

              {selectedReport.supervisorComment && (
                <div>
                  <h4 className="text-base font-semibold text-foreground mb-2">Supervisor's Comment</h4>
                  <p className="text-sm text-foreground bg-green-600/80 dark:text-green-300 bg-green-500/10 p-4 rounded border border-green-500/20">
                    {selectedReport.supervisorComment}
                  </p>
                  {selectedReport.supervisorReviewedAt && (
                    <p className="text-xs text-muted-foreground mt-2">Reviewed on {new Date(selectedReport.supervisorReviewedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
