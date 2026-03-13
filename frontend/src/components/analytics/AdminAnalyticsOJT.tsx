'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Users, Building2, FileText, ClipboardCheck, CheckCircle2, Clock, TrendingUp, RefreshCw, Loader2, Briefcase, Sparkles, ArrowUpRight, Activity } from "lucide-react";
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
  total_daily_reports: number;
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
    daily_reports_this_week: number;
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
    daily_reports_this_week: 0,
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
        daily_reports_this_week: 0,
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">OJT Platform Overview</h2>
                {lastUpdated && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-background/50 backdrop-blur-sm hover:bg-background"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics - Modern Grid with Subtle Animations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Students Enrolled</p>
                <p className="text-3xl font-bold text-foreground">{metrics?.students_enrolled || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Deployment</p>
                <p className="text-3xl font-bold text-foreground">{metrics?.students_pending_deployment || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-green-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Internships</p>
                <p className="text-3xl font-bold text-foreground">{metrics?.active_internships || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completed This Year</p>
                <p className="text-3xl font-bold text-foreground">{metrics?.completed_internships || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout - Partners & Workflow */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Company Partners Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Company Partners</CardTitle>
              </div>
              <Link href="/dashboard/admin/companies">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{metrics?.total_companies || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Partners</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics?.companies_with_capacity || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Available Slots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Workflow Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
              </div>
              <Link href="/dashboard/admin/evaluations">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Manage <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Daily Reports</span>
                </div>
                <Badge variant="secondary" className="font-bold">
                  {metrics?.total_daily_reports || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Supervisor Evaluations</span>
                </div>
                <Badge variant={((metrics?.pending_supervisor_evaluations || 0) > 0) ? "destructive" : "secondary"} className="font-bold">
                  {metrics?.pending_supervisor_evaluations || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Week's Activity - Compact Modern Stats */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">This Week's Activity</CardTitle>
              <CardDescription>Overview of recent submissions and completions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-green-500/5 border border-green-500/10">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{recentActivity.daily_reports_this_week}</p>
              <p className="text-xs text-muted-foreground mt-1">Daily Reports</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{recentActivity.evaluations_this_week}</p>
              <p className="text-xs text-muted-foreground mt-1">Evaluations</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{metrics?.completed_evaluations_this_month || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Monthly Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights - Modern Condensed View */}
      {insights.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI-Generated Insights</CardTitle>
                  <CardDescription>Historical evaluation analytics</CardDescription>
                </div>
              </div>
              <Link href="/dashboard/admin/reports">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  View Details <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <TrendingUp className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center italic">
              Insights generated from approved evaluations only
            </p>
          </CardContent>
        </Card>
      )}

      {/* CBSU Branding Footer - Minimal */}
      <div className="text-center py-3">
        <p className="text-xs text-muted-foreground">
          Cavite State University - Bacoor Campus • OJT Management Platform
        </p>
      </div>
    </div>
  );
}
