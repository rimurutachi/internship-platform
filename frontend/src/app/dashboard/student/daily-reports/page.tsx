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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  // Data state
  const [internship, setInternship] = useState<Internship | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);



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
    // Intentionally empty since we've removed the state sets
  };

  const openViewDialog = (report: DailyReport) => {
    console.log(report);
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
    </div>
  );

  return (
    <div className="space-y-6">
            {reportContent}
    </div>
  );
}
