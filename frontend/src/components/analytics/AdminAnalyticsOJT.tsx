'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Building2, FileText, ClipboardCheck, AlertCircle, CheckCircle2, Clock, TrendingUp, RefreshCw, Loader2, GraduationCap, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";

// OJT Dashboard Metrics Type
interface OJTDashboardMetrics {
  students_enrolled: number;
  students_pending_deployment: number;
  active_internships: number;
  completed_internships: number;
  total_companies: number;
  companies_with_capacity: number;
  pending_weekly_reports: number;
  pending_supervisor_evaluations: number;
  pending_advisor_evaluations: number;
  completed_evaluations_this_month: number;
  timestamp: string;
}

// AI Insights Type
interface AIInsight {
  type: string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
}

// Quick Action Type
interface QuickAction {
  type: string;
  priority: 'high' | 'medium' | 'low';
  count: number;
  message: string;
  link: string;
}

// Dashboard Overview Response
interface DashboardOverview {
  metrics: OJTDashboardMetrics;
  insights: AIInsight[];
  quick_actions?: QuickAction[];
  recent_activity: {
    weekly_reports_this_week: number;
    evaluations_this_week: number;
  };
}

/**
 * AdminAnalyticsOJT Component
 * 
 * OJT-CENTRIC Admin Dashboard Analytics
 * - Shows internship metrics ONLY (no system performance metrics)
 * - AI insights from historical evaluations
 * - Quick action items for pending tasks
 * - CBSU-branded design
 */
export function AdminAnalyticsOJT() {
  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Data states
  const [metrics, setMetrics] = useState<OJTDashboardMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [recentActivity, setRecentActivity] = useState({
    weekly_reports_this_week: 0,
    evaluations_this_week: 0,
  });

  // Fetch dashboard data from backend
  const fetchDashboardData = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }

      // Get authenticated user
      const { data: { user: authUser } } = await createSupabaseClient().auth.getUser();
      
      if (!authUser) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Fetch user details to get university_id
      const { data: userData, error: userError } = await createSupabaseClient()
        .from('users')
        .select('university_id, role')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error('Failed to fetch user information. Please try logging in again.');
      }

      let universityId: string;

      if (!userData?.university_id) {
        console.warn('Admin user has no university_id, attempting to fetch first university');
        
        // For system-wide admins, get the first university
        const { data: universities, error: univError } = await createSupabaseClient()
          .from('universities')
          .select('id')
          .limit(1)
          .single();

        if (univError || !universities?.id) {
          throw new Error('No university found in the system. Please contact administrator.');
        }
        
        universityId = universities.id;
      } else {
        universityId = userData.university_id;
      }

      // Fetch OJT dashboard overview from backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // Get access token from Supabase session for authentication
      const { data: { session } } = await createSupabaseClient().auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }

      const response = await fetch(
        `${apiUrl}/admin/dashboard/ojt-overview?university_id=${universityId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      // Set the data from backend
      setMetrics(result.data.metrics);
      setInsights(result.data.insights || []);
      setRecentActivity(result.data.recent_activity || {
        weekly_reports_this_week: 0,
        evaluations_this_week: 0,
      });
      
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
      
      if (!silent) {
        toast.success("Dashboard data refreshed!");
      }
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.message || "Failed to load dashboard data");
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData(false);
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Last Updated and Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">OJT Platform Overview</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Key OJT Metrics - Students & Internships */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Student Enrollment & Deployment
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-hover transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{metrics?.students_enrolled || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Students Enrolled</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover transition-shadow border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{metrics?.students_pending_deployment || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Pending Deployment</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover transition-shadow border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{metrics?.active_internships || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Active Internships</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover transition-shadow border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{metrics?.completed_internships || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed This Year</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Company Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Company Partner Statistics
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:shadow-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{metrics?.total_companies || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Partner Companies</p>
                  <p className="text-xs text-muted-foreground mt-2">Active partnerships for internship placement</p>
                </div>
                <Building2 className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{metrics?.companies_with_capacity || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Companies with Available Slots</p>
                  <p className="text-xs text-muted-foreground mt-2">Ready to accept new interns</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflow Status - Reports & Evaluations */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          Pending Workflow Items
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                <p className="text-3xl font-bold text-foreground">{metrics?.pending_weekly_reports || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Weekly Reports</p>
                <p className="text-xs text-muted-foreground mt-2">Awaiting supervisor approval</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-orange-500" />
                <p className="text-3xl font-bold text-foreground">{metrics?.pending_supervisor_evaluations || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Supervisor Evaluations</p>
                <p className="text-xs text-muted-foreground mt-2">Pending submission</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                <p className="text-3xl font-bold text-foreground">{metrics?.pending_advisor_evaluations || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Advisor Reviews</p>
                <p className="text-xs text-muted-foreground mt-2">Awaiting final approval</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Activity</CardTitle>
          <CardDescription>Overview of recent submissions and completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{recentActivity.weekly_reports_this_week}</p>
              <p className="text-sm text-muted-foreground mt-2">Weekly Reports Submitted</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{recentActivity.evaluations_this_week}</p>
              <p className="text-sm text-muted-foreground mt-2">Evaluations Completed</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{metrics?.completed_evaluations_this_month || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">Evaluations This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights from Historical Evaluations */}
      {insights.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              AI-Generated Insights
            </CardTitle>
            <CardDescription>
              Historical evaluation analytics and trends (Post-approval analytics only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <Alert key={index} className="bg-primary/5 border-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <span className="font-medium">{insight.message}</span>
                    {insight.type === 'trend' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Trend
                      </Badge>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              * Insights generated from approved evaluations only. AI does not influence evaluation scoring.
            </p>
          </CardContent>
        </Card>
      )}

      {/* CBSU Branding Footer */}
      <div className="text-center py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Cavite State University - Bacoor Campus
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          On-the-Job Training Management Platform
        </p>
      </div>
    </div>
  );
}
