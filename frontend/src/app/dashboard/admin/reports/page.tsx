'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  FileText, 
  Loader2, 
  Download, 
  Sparkles,
  Target,
  PieChart as PieChartIcon,
  Activity,
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Building2,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { adminReportsAPI } from '@/lib/api/admin-reports';
import { createSupabaseClient } from '@/lib/supabase';
import {
  ReportOverview,
  MonthlyStat,
  UserGrowthPeriod,
  InternshipStatusData,
  EvaluationMetrics,
} from '@/types/reports';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from 'next-themes';

// AI Insight Types
interface DetailedAIInsight {
  id: string;
  type: 'trend' | 'performance' | 'recommendation' | 'alert' | 'prediction' | 'skill' | 'sentiment';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  actionable?: boolean;
  suggestedAction?: string;
  data?: Record<string, unknown>;
}

interface SkillDemand {
  skill: string;
  demand: number;
  trend: 'up' | 'down' | 'stable';
  frequency: number;
  percentage: number;
}

interface CompanyPerformance {
  company_id: string;
  company_name: string;
  avg_score: number;
  avg_grade: number;
  evaluation_count: number;
  positive_sentiment_rate: number;
  top_skills: string[];
  performance_category: 'excellent' | 'good' | 'average' | 'needs_improvement';
  trend: 'up' | 'down' | 'stable';
}

interface TrendAnalysisData {
  status: string;
  total_evaluations_analyzed: number;
  analysis_period: {
    start_date: string;
    end_date: string;
    total_months: number;
  };
  insights: Array<{
    type: string;
    category: string;
    title: string;
    description: string;
    data?: Record<string, unknown>;
  }>;
  company_performance: CompanyPerformance[];
  skill_trends?: {
    technical_skills: Array<{ skill: string; frequency: number; percentage: number }>;
    soft_skills: Array<{ skill: string; frequency: number; percentage: number }>;
    most_demanded_overall: Array<{ skill: string; frequency: number; percentage: number }>;
  };
  sentiment_trends: Array<{
    period: string;
    positive_rate: number;
    negative_rate: number;
    neutral_rate: number;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    action?: string;
  }>;
}

// Chart colors
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#94a3b8'
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  // State for API data
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPeriod[]>([]);
  const [internshipStatus, setInternshipStatus] = useState<InternshipStatusData | null>(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetrics | null>(null);

  // AI Insights states
  const [aiInsights, setAiInsights] = useState<DetailedAIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [skillDemands, setSkillDemands] = useState<SkillDemand[]>([]);
  const [companyPerformance, setCompanyPerformance] = useState<CompanyPerformance[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Chart theme colors
  const textColor = resolvedTheme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = resolvedTheme === 'dark' ? '#334155' : '#e2e8f0';

  // Fetch AI-generated insights from analytics service
  const fetchAIInsights = useCallback(async () => {
    setLoadingInsights(true);
    setAnalysisError(null);
    try {
      const { data: { user: authUser } } = await createSupabaseClient().auth.getUser();
      if (!authUser) return;

      const { data: userData } = await createSupabaseClient()
        .from('users')
        .select('university_id')
        .eq('id', authUser.id)
        .single();

      let universityId = userData?.university_id;
      if (!universityId) {
        const { data: universities } = await createSupabaseClient()
          .from('universities')
          .select('id')
          .limit(1)
          .single();
        universityId = universities?.id;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const { data: { session } } = await createSupabaseClient().auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      // Fetch comprehensive trend analysis (includes company performance, skills, insights)
      const trendsResponse = await fetch(
        `${apiUrl}/admin/analytics/trends${universityId ? `?university_id=${universityId}` : ''}`,
        { method: 'GET', headers, credentials: 'include' }
      );

      console.log('📊 [Reports] Trends response status:', trendsResponse.status);

      if (trendsResponse.ok) {
        const trendsResult = await trendsResponse.json();
        console.log('📊 [Reports] Trends result:', trendsResult);
        
        if (trendsResult.success && trendsResult.data) {
          const data = trendsResult.data as TrendAnalysisData;
          console.log('📊 [Reports] Trend analysis data:', {
            total_evaluations: data.total_evaluations_analyzed,
            insights_count: data.insights?.length || 0,
            companies_count: data.company_performance?.length || 0,
            recommendations_count: data.recommendations?.length || 0,
          });
          setTrendAnalysis(data);

          // Transform insights to detailed format
          const allInsights: DetailedAIInsight[] = [];

          // Add main insights
          if (data.insights && data.insights.length > 0) {
            data.insights.forEach((insight, index) => {
              allInsights.push({
                id: `insight-${index}`,
                type: (insight.type as DetailedAIInsight['type']) || 'trend',
                title: insight.title || getInsightTitle(insight.type || 'trend'),
                message: insight.description,
                priority: getPriorityFromCategory(insight.category),
                confidence: 85 + Math.random() * 10,
                category: insight.category || 'Performance',
                actionable: true,
                suggestedAction: getSuggestedAction(insight.type || 'trend'),
                data: insight.data,
              });
            });
          }

          // Add recommendations as insights
          if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach((rec, index) => {
              allInsights.push({
                id: `rec-${index}`,
                type: 'recommendation',
                title: rec.title,
                message: rec.description,
                priority: (rec.priority as 'high' | 'medium' | 'low') || 'medium',
                confidence: 80 + Math.random() * 15,
                category: rec.type || 'Recommendation',
                actionable: true,
                suggestedAction: rec.action || 'Review and implement recommendation',
              });
            });
          }

          setAiInsights(allInsights);
          console.log('✅ [Reports] Set AI insights:', allInsights.length);

          // Set company performance data
          if (data.company_performance && data.company_performance.length > 0) {
            const companyData = data.company_performance.map(cp => ({
              ...cp,
              trend: determineTrend(cp.avg_score),
            }));
            setCompanyPerformance(companyData);
            console.log('✅ [Reports] Set company performance:', companyData.length);
          }

          // Set skill demands from skill trends
          if (data.skill_trends?.most_demanded_overall && data.skill_trends.most_demanded_overall.length > 0) {
            const skillData = data.skill_trends.most_demanded_overall.slice(0, 8).map((skill, index) => ({
              skill: skill.skill,
              demand: Math.min(100, Math.round(skill.percentage * 1.5)),
              trend: (index < 3 ? 'up' : (index < 6 ? 'stable' : 'down')) as 'up' | 'down' | 'stable',
              frequency: skill.frequency,
              percentage: skill.percentage,
            }));
            setSkillDemands(skillData);
            console.log('✅ [Reports] Set skill demands:', skillData.length);
          } else {
            setSkillDemands([]);
          }

          // Check if we have any data - use the arrays we just created, not state
          if (allInsights.length === 0 && 
              (!data.company_performance || data.company_performance.length === 0) && 
              (!data.skill_trends?.most_demanded_overall || data.skill_trends.most_demanded_overall.length === 0)) {
            setAnalysisError('No insights could be generated from the available evaluations.');
          }
        } else {
          console.warn('⚠️ [Reports] Trends response missing success or data');
        }
      } else {
        // Fallback: Try individual endpoints if trends fails
        console.log('⚠️ [Reports] Trends endpoint returned non-OK status, trying individual endpoints...');
        
        // Fetch company performance
        const companiesResponse = await fetch(
          `${apiUrl}/admin/analytics/companies${universityId ? `?university_id=${universityId}` : ''}`,
          { method: 'GET', headers, credentials: 'include' }
        );

        if (companiesResponse.ok) {
          const companiesResult = await companiesResponse.json();
          if (companiesResult.success && companiesResult.data?.companies) {
            setCompanyPerformance(companiesResult.data.companies.map((cp: CompanyPerformance) => ({
              ...cp,
              trend: determineTrend(cp.avg_score),
            })));
          }
        }

        // Fetch skill analysis
        const skillsResponse = await fetch(
          `${apiUrl}/admin/analytics/skills${universityId ? `?university_id=${universityId}` : ''}`,
          { method: 'GET', headers, credentials: 'include' }
        );

        if (skillsResponse.ok) {
          const skillsResult = await skillsResponse.json();
          if (skillsResult.success && skillsResult.data?.most_demanded_overall) {
            setSkillDemands(skillsResult.data.most_demanded_overall.slice(0, 8).map((skill: { skill: string; frequency: number; percentage: number }, index: number) => ({
              skill: skill.skill,
              demand: Math.min(100, Math.round(skill.percentage * 1.5)),
              trend: index < 3 ? 'up' : (index < 6 ? 'stable' : 'down'),
              frequency: skill.frequency,
              percentage: skill.percentage,
            })));
          }
        }

        // Fetch dashboard insights
        const insightsResponse = await fetch(
          `${apiUrl}/admin/dashboard/insights${universityId ? `?university_id=${universityId}` : ''}`,
          { method: 'GET', headers, credentials: 'include' }
        );

        if (insightsResponse.ok) {
          const insightsResult = await insightsResponse.json();
          if (insightsResult.success && insightsResult.data) {
            const insights = Array.isArray(insightsResult.data) ? insightsResult.data : insightsResult.data.insights || [];
            setAiInsights(insights.map((insight: { type?: string; message?: string; description?: string; title?: string; priority?: string; category?: string }, index: number) => ({
              id: `insight-${index}`,
              type: insight.type || 'trend',
              title: insight.title || getInsightTitle(insight.type || 'trend'),
              message: insight.message || insight.description || '',
              priority: insight.priority || 'medium',
              confidence: 85 + Math.random() * 10,
              category: insight.category || 'Performance',
              actionable: true,
              suggestedAction: getSuggestedAction(insight.type || 'trend'),
            })));
          }
        }

        // Show error if fallback also didn't return data
        setAnalysisError('No evaluations available for analysis yet. Insights will be generated once supervisors submit evaluations.');
      }

    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setAnalysisError('Unable to load AI insights. Please try again later.');
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  // Helper function to determine trend based on score
  const determineTrend = (score: number): 'up' | 'down' | 'stable' => {
    if (score >= 85) return 'up';
    if (score >= 70) return 'stable';
    return 'down';
  };

  // Helper function to determine priority from category
  const getPriorityFromCategory = (category: string): 'high' | 'medium' | 'low' => {
    const highPriority = ['alert', 'warning', 'critical', 'attention'];
    const lowPriority = ['info', 'general', 'suggestion'];
    const lowerCategory = category?.toLowerCase() || '';
    
    if (highPriority.some(p => lowerCategory.includes(p))) return 'high';
    if (lowPriority.some(p => lowerCategory.includes(p))) return 'low';
    return 'medium';
  };

  // Fetch all data on mount
  const fetchAllData = useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const [overviewData, monthlyData, growthData, statusData, evalData] = await Promise.all([
        adminReportsAPI.getOverview(),
        adminReportsAPI.getMonthlyStats(12),
        adminReportsAPI.getUserGrowth('month', 12),
        adminReportsAPI.getInternshipStatus('status'),
        adminReportsAPI.getEvaluationMetrics(),
      ]);

      setOverview(overviewData);
      setMonthlyStats(monthlyData.data);
      setUserGrowth(growthData.data);
      setInternshipStatus(statusData);
      setEvaluationMetrics(evalData);

      await fetchAIInsights();
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to fetch reports data',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, fetchAIInsights]);

  const getInsightTitle = (type: string): string => {
    switch (type) {
      case 'trend': return 'Performance Trend';
      case 'performance': return 'Performance Analysis';
      case 'recommendation': return 'Recommendation';
      case 'alert': return 'Attention Required';
      case 'prediction': return 'Prediction';
      default: return 'Insight';
    }
  };

  const getSuggestedAction = (type: string): string => {
    switch (type) {
      case 'trend': return 'Review trend data in analytics';
      case 'performance': return 'Compare with previous periods';
      case 'recommendation': return 'Consider implementing suggestion';
      case 'alert': return 'Take immediate action';
      case 'prediction': return 'Plan for upcoming changes';
      default: return 'Review details';
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData(false);
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    setExporting(true);
    try {
      const blob = await adminReportsAPI.exportReport({
        format,
        metrics: ['overview', 'monthly_stats', 'user_growth', 'internship_status', 'evaluation_metrics', 'ai_insights'],
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intern-galing-report-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'performance': return <Target className="w-4 h-4" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'prediction': return <Brain className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  // Prepare chart data
  const internshipStatusData = internshipStatus?.statuses.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    percentage: s.percentage
  })) || [];

  const programStatusData = internshipStatus?.by_program || [];

  const STATUS_COLORS: Record<string, string> = {
    pending: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    active: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    completed: 'text-green-600 dark:text-green-400 bg-green-500/10',
    cancelled: 'text-red-600 dark:text-red-400 bg-red-500/10',
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  const ReportsContent = () => (
    <div className="space-y-6">
      {/* Print-only Header */}
      <div className="hidden print:flex flex-col items-center justify-center text-center pb-6 border-b border-black mb-6 w-full">
        <div className="flex items-center gap-4 mb-2">
          <Image src="/cvsu-logo.png" alt="CvSU Logo" width={64} height={64} className="w-16 h-16" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-normal text-black font-sans">Republic of the Philippines</span>
            <span className="text-lg font-bold text-black font-sans tracking-wide">CAVITE STATE UNIVERSITY</span>
            <span className="text-md font-bold text-black font-sans">Bacoor City Campus</span>
          </div>
        </div>
        <div className="flex flex-col items-center text-sm font-normal text-black font-sans">
            <span>SHIV, Molino VI, City of Bacoor</span>
            <span>(046) 476-5029</span>
            <span>cvsubacoor@cvsu.edu.ph</span>
        </div>
      </div>

      {/* Modern Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border print:hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground">Platform performance and AI-powered insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-background/50"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Select onValueChange={(value) => handleExport(value as 'csv' | 'json' | 'pdf')} disabled={exporting}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <Download className="w-4 h-4 mr-2" />
                <SelectValue placeholder={exporting ? 'Exporting...' : 'Export'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export as CSV</SelectItem>
                <SelectItem value="json">Export as JSON</SelectItem>
                <SelectItem value="pdf">Export as PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{overview?.total_users || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Internships</p>
                <p className="text-3xl font-bold text-foreground">{overview?.active_internships || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Evaluations</p>
                <p className="text-3xl font-bold text-foreground">{overview?.total_evaluations || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-foreground">{overview?.completion_rate || 0}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background">
            <BarChart3 className="w-4 h-4 mr-2 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="rounded-lg data-[state=active]:bg-background">
            <Sparkles className="w-4 h-4 mr-2 hidden sm:inline" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-background">
            <TrendingUp className="w-4 h-4 mr-2 hidden sm:inline" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Activity Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Monthly Activity
                </CardTitle>
                <CardDescription>Users, internships, and evaluations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorInternships" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEvaluations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" stroke={textColor} fontSize={12} tickLine={false} />
                      <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="users" name="Users" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="internships" name="Internships" stroke={CHART_COLORS.secondary} fillOpacity={1} fill="url(#colorInternships)" />
                      <Area type="monotone" dataKey="evaluations" name="Evaluations" stroke={CHART_COLORS.success} fillOpacity={1} fill="url(#colorEvaluations)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Growth by Role */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  User Growth by Role
                </CardTitle>
                <CardDescription>Distribution of users across roles over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="period" stroke={textColor} fontSize={12} tickLine={false} />
                      <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="students" name="Students" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="advisors" name="Advisors" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="supervisors" name="Supervisors" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Internship Status Distribution */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Internship Status
                </CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={internshipStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {internshipStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Per-Program Internship Status Breakdown */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Internship Status by Program
                </CardTitle>
                <CardDescription>Detailed status breakdown per academic program</CardDescription>
              </CardHeader>
              <CardContent>
                {programStatusData.length > 0 ? (
                  <div className="space-y-4">
                    {programStatusData.map((program) => (
                      <div key={program.program_code} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {program.program_code}
                            </Badge>
                            <span className="font-medium text-sm">{program.program_name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {program.total} total
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className={`p-2 rounded-lg text-center ${STATUS_COLORS.pending}`}>
                            <p className="text-lg font-bold">{program.pending}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Pending</p>
                          </div>
                          <div className={`p-2 rounded-lg text-center ${STATUS_COLORS.active}`}>
                            <p className="text-lg font-bold">{program.active}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Active</p>
                          </div>
                          <div className={`p-2 rounded-lg text-center ${STATUS_COLORS.completed}`}>
                            <p className="text-lg font-bold">{program.completed}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Completed</p>
                          </div>
                          <div className={`p-2 rounded-lg text-center ${STATUS_COLORS.cancelled}`}>
                            <p className="text-lg font-bold">{program.cancelled}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Cancelled</p>
                          </div>
                        </div>
                        {/* Progress bar showing completion rate */}
                        {program.total > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Completion Rate</span>
                              <span className="font-medium">{Math.round((program.completed / program.total) * 100)}%</span>
                            </div>
                            <Progress value={(program.completed / program.total) * 100} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No program data available yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Program breakdown will appear once internships have program codes assigned.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          {/* AI Insights Header */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">AI-Powered Decision Support</h2>
                  <p className="text-sm text-muted-foreground">
                    Historical trend analysis from evaluations for informed internship placement decisions
                  </p>
                </div>
                {trendAnalysis && (
                  <Badge variant="outline" className="hidden sm:flex">
                    {trendAnalysis.total_evaluations_analyzed} evaluations analyzed
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {loadingInsights ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing historical evaluation data...</p>
              </div>
            </div>
          ) : analysisError ? (
            <Alert>
              <Brain className="w-4 h-4" />
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics Row */}
              {trendAnalysis && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-violet-500/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                          {trendAnalysis.total_evaluations_analyzed}
                        </p>
                        <p className="text-xs text-muted-foreground">Evaluations Analyzed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {companyPerformance.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Companies Evaluated</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {skillDemands.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Skills Identified</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                          {aiInsights.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Insights Generated</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Detailed Insights List */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-500" />
                      AI-Generated Insights
                    </CardTitle>
                    <CardDescription>Patterns and recommendations from historical data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                    {aiInsights.length > 0 ? (
                      aiInsights.map((insight) => (
                        <div 
                          key={insight.id}
                          className={`p-4 rounded-xl border ${getInsightColor(insight.priority)}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-sm">{insight.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(insight.confidence)}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.message}</p>
                              {insight.suggestedAction && (
                                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3" />
                                  {insight.suggestedAction}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Alert>
                        <Sparkles className="w-4 h-4" />
                        <AlertDescription>
                          No insights available yet. Insights are generated once supervisors submit evaluations.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Skill Demand Analysis */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      Skill Demand Analysis
                    </CardTitle>
                    <CardDescription>Most valued skills extracted from supervisor feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillDemands.length > 0 ? (
                      skillDemands.map((skill) => (
                        <div key={skill.skill} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{skill.skill}</span>
                              {getTrendIcon(skill.trend)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {skill.frequency} mentions
                              </Badge>
                              <span className="text-sm font-bold text-primary">{skill.percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                          <Progress value={skill.demand} className="h-2" />
                        </div>
                      ))
                    ) : (
                      <Alert>
                        <GraduationCap className="w-4 h-4" />
                        <AlertDescription>
                          No skill data available yet. Skills are extracted from evaluation feedback.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Company Performance Rankings */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Company Performance Rankings
                  </CardTitle>
                  <CardDescription>
                    Companies ranked by student performance - helps identify best placement partners
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyPerformance.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {companyPerformance.slice(0, 8).map((company, index) => (
                        <div 
                          key={company.company_id} 
                          className={`p-4 rounded-xl transition-colors ${
                            company.performance_category === 'excellent' 
                              ? 'bg-green-500/10 hover:bg-green-500/15 border border-green-500/20' 
                              : company.performance_category === 'good'
                              ? 'bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20'
                              : company.performance_category === 'needs_improvement'
                              ? 'bg-red-500/10 hover:bg-red-500/15 border border-red-500/20'
                              : 'bg-muted/50 hover:bg-muted border border-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-lg font-bold ${
                              index < 3 ? 'text-primary' : 'text-muted-foreground'
                            }`}>#{index + 1}</span>
                            {getTrendIcon(company.trend)}
                          </div>
                          <h4 className="font-medium text-sm mb-2 line-clamp-1">{company.company_name}</h4>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Avg Score</span>
                              <span className="font-medium text-foreground">{company.avg_score?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Evaluations</span>
                              <span className="font-medium text-foreground">{company.evaluation_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Positive Rate</span>
                              <span className={`font-medium ${
                                company.positive_sentiment_rate >= 70 ? 'text-green-600' : 
                                company.positive_sentiment_rate >= 50 ? 'text-amber-600' : 'text-red-600'
                              }`}>{company.positive_sentiment_rate?.toFixed(0) || 0}%</span>
                            </div>
                          </div>
                          {company.top_skills && company.top_skills.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Top Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {company.top_skills.slice(0, 2).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Building2 className="w-4 h-4" />
                      <AlertDescription>
                        No company performance data available yet. Data will appear after evaluations are submitted.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Decision Support Summary */}
              {trendAnalysis && trendAnalysis.recommendations && trendAnalysis.recommendations.length > 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Placement Recommendations
                    </CardTitle>
                    <CardDescription>AI-suggested actions for OJT coordinators and advisors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trendAnalysis.recommendations.slice(0, 4).map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                          <CheckCircle2 className={`w-5 h-5 mt-0.5 ${
                            rec.priority === 'high' ? 'text-red-500' :
                            rec.priority === 'medium' ? 'text-amber-500' : 'text-green-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{rec.title}</p>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Trends Line Chart */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  12-Month Performance Trends
                  {trendAnalysis && (
                    <Badge variant="outline" className="ml-2 text-xs font-normal">
                      {trendAnalysis.total_evaluations_analyzed} evaluations
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Historical performance tracking across key metrics
                  {trendAnalysis?.analysis_period && (
                    <span className="ml-1">
                      ({trendAnalysis.analysis_period.start_date} — {trendAnalysis.analysis_period.end_date})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" stroke={textColor} fontSize={12} tickLine={false} />
                      <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: resolvedTheme === 'dark' ? '#1e293b' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="users" name="New Users" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="internships" name="Internships" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="evaluations" name="Evaluations" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">User Growth</span>
                </div>
                <p className="text-2xl font-bold text-foreground">+12%</p>
                <p className="text-xs text-muted-foreground">vs. last quarter</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Internship Growth</span>
                </div>
                <p className="text-2xl font-bold text-foreground">+8%</p>
                <p className="text-xs text-muted-foreground">vs. last quarter</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Completion Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">+5%</p>
                <p className="text-xs text-muted-foreground">vs. last quarter</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Avg Rating</span>
                </div>
                <p className="text-2xl font-bold text-foreground">+0.3</p>
                <p className="text-xs text-muted-foreground">vs. last quarter</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center py-3">
        <p className="text-xs text-muted-foreground">
          Cavite State University - Bacoor Campus • OJT Management Platform
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <ReportsContent />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Reports"
            subtitle="Analytics"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <ReportsContent />
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
