'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  Loader2,
  Eye,
  AlertCircle,
  Save,
  Send,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';

interface DailyReport {
  id: string;
  internship_id: string;
  student_id: string;
  report_date: string;
  activities: string;
  learnings?: string;
  hours_worked: number;
  created_at: string;
  updated_at: string;
}

interface Internship {
  id: string;
  position: string;
  company_name: string;
  start_date: string;
  end_date: string;
  required_hours: number;
  total_hours_worked: number;
  status: string;
}

export default function DailyReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Data state
  const [internship, setInternship] = useState<Internship | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    activities: '',
    learnings: '',
    hours_worked: 8,
  });
  useEffect(() => {
    fetchData();
  }, []);

  const getApiBase = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  };

  const getAuthHeaders = async () => {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No session token available');
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const apiBase = getApiBase();
      const headers = await getAuthHeaders();

      // Fetch active internship
      const internshipsRes = await fetch(
        `${apiBase}/internships?student_id=${encodeURIComponent(user.id)}&status=active`,
        { headers }
      );

      if (!internshipsRes.ok) {
        const err = await internshipsRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch internships');
      }

      const internshipsJson = await internshipsRes.json();
      const internshipsList = Array.isArray(internshipsJson?.data) ? internshipsJson.data : [];
      const active = internshipsList.find((i: any) => i?.status === 'active' && i?.is_archived !== true);

      if (active) {
        const internshipInfo: Internship = {
          id: active.id,
          position: active.position,
          company_name: active.company?.name || 'Unknown Company',
          start_date: active.start_date,
          end_date: active.end_date,
          required_hours: active.required_hours || 240,
          total_hours_worked: active.total_hours_worked || 0,
          status: active.status,
        };
        setInternship(internshipInfo);

        // Fetch daily reports
        const reportsRes = await fetch(
          `${apiBase}/student/daily-reports?internship_id=${active.id}`,
          { headers }
        );

        if (!reportsRes.ok) {
          const errorData = await reportsRes.json();
          throw new Error(errorData.message || 'Failed to fetch reports');
        }

        const result = await reportsRes.json();
        setReports(result.data || []);
      } else {
        setInternship(null);
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      report_date: today,
      activities: '',
      learnings: '',
      hours_worked: 8,
    });
    setIsEditing(false);
    setSelectedReport(null);
    setCreateDialogOpen(true);
  };

  const openViewDialog = (report: DailyReport) => {
    setSelectedReport(report);
    setFormData({
      report_date: report.report_date,
      activities: report.activities,
      learnings: report.learnings || '',
      hours_worked: report.hours_worked,
    });
    setIsEditing(false);
    setViewDialogOpen(true);
  };

  const handleCreateReport = async () => {
    if (!internship) return;

    if (!formData.activities || formData.activities.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Activities must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formData.hours_worked < 0 || formData.hours_worked > 24) {
      toast({
        title: 'Validation Error',
        description: 'Hours worked must be between 0 and 24',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const apiBase = getApiBase();
      const headers = await getAuthHeaders();

      const payload = {
        internship_id: internship.id,
        report_date: formData.report_date,
        activities: formData.activities.trim(),
        learnings: formData.learnings?.trim() || null,
        hours_worked: formData.hours_worked,
      };

      const response = await fetch(`${apiBase}/student/daily-reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to submit report');
      }

      toast({
        title: 'Report Submitted',
        description: `Daily report for ${formatDate(formData.report_date)} submitted successfully`,
      });

      setCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    if (!formData.activities || formData.activities.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Activities must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const apiBase = getApiBase();
      const headers = await getAuthHeaders();

      const payload = {
        activities: formData.activities.trim(),
        learnings: formData.learnings?.trim() || null,
        hours_worked: formData.hours_worked,
      };

      const response = await fetch(`${apiBase}/student/daily-reports/${selectedReport.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update report');
      }

      toast({
        title: 'Report Updated',
        description: 'Your daily report has been updated',
      });

      setViewDialogOpen(false);
      setSelectedReport(null);
      setIsEditing(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    try {
      setDeleting(true);
      const apiBase = getApiBase();
      const headers = await getAuthHeaders();

      const response = await fetch(`${apiBase}/student/daily-reports/${selectedReport.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to delete report');
      }

      toast({
        title: 'Report Deleted',
        description: 'Your daily report has been deleted',
      });

      setDeleteDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedReport(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete report',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalHours = reports.reduce((sum, r) => sum + r.hours_worked, 0);
  const requiredHours = internship?.required_hours || 240;
  const progressPercent = requiredHours > 0 ? Math.min(Math.round((totalHours / requiredHours) * 100), 100) : 0;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Internship</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need an active internship to submit daily reports.
            </p>
            <Button onClick={() => router.push('/dashboard/student')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reportContent = (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Daily Reports</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {internship.position} at {internship.company_name}
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-6 py-6"
          onClick={openCreateDialog}
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Today
        </Button>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Hours</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {totalHours.toFixed(1)}
              <span className="text-lg text-muted-foreground font-normal"> / {requiredHours}</span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{progressPercent}% complete</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Days Logged</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{reports.length}</div>
            <p className="text-sm text-muted-foreground mt-1">daily reports submitted</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {Math.max(requiredHours - totalHours, 0).toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">hours remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="bg-card border border-border">
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-2xl text-foreground">Report History</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Your daily activity logs
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg mb-6">No reports submitted yet</p>
              <Button 
                variant="outline"
                onClick={openCreateDialog}
              >
                Log Your First Day
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow border border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-foreground text-xl">
                            {formatDate(report.report_date)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-base text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {report.hours_worked} hours
                          </div>
                        </div>
                        <p className="text-base text-muted-foreground line-clamp-2">
                          {report.activities}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(report)}
                        className="border-gray-300 text-base px-4 py-5"
                      >
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Daily Report</DialogTitle>
            <DialogDescription>
              Record your activities and hours for the day
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                min={internship.start_date}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Activities <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Describe what you did today (minimum 10 characters)..."
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.activities.length} / 10 characters minimum
              </p>
            </div>

            <div>
              <Label>Hours Worked <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.hours_worked}
                onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || 0 })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total hours worked today (0-24)
              </p>
            </div>

            <div>
              <Label>Learnings (Optional)</Label>
              <Textarea
                placeholder="What did you learn today..."
                value={formData.learnings}
                onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              onClick={handleCreateReport}
              disabled={submitting || formData.activities.length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) {
          setIsEditing(false);
          setSelectedReport(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReport ? formatDate(selectedReport.report_date) : 'Report'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Edit your daily report' : 'View report details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Activities</Label>
              <Textarea
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                rows={5}
                className="mt-2"
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label>Hours Worked</Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.hours_worked}
                onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || 0 })}
                className="mt-2"
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label>Learnings</Label>
              <Textarea
                value={formData.learnings}
                onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                rows={3}
                className="mt-2"
                disabled={!isEditing}
              />
            </div>
          </div>

          <DialogFooter>
            {isEditing ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateReport}
                  disabled={submitting || formData.activities.length < 10}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the report for {selectedReport ? formatDate(selectedReport.report_date) : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReport}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="space-y-6">
            {reportContent}
    </div>
  );
}
