'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Users, Server, Shield, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { adminDashboardAPI } from "@/lib/api/admin-dashboard";
import { DashboardKPI, UsageEngagementData, PerformanceMetric, FeatureUsage } from "@/types/dashboard";
import { toast } from "sonner";

// Theme-aware color palettes
const getChartColors = (isDark: boolean) => ({
  primary: isDark ? '#8b5cf6' : '#7c3aed',      // Purple
  success: isDark ? '#10b981' : '#059669',      // Green
  ai: isDark ? '#3b82f6' : '#2563eb',           // Blue
  warning: isDark ? '#f59e0b' : '#d97706',      // Orange
  error: isDark ? '#ef4444' : '#dc2626',        // Red
  info: isDark ? '#06b6d4' : '#0891b2',         // Cyan
  pink: isDark ? '#ec4899' : '#db2777',         // Pink
  indigo: isDark ? '#6366f1' : '#4f46e5',       // Indigo
});

export function AdminAnalytics() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const colors = getChartColors(isDark);
  
  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Data states
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [usageEngagement, setUsageEngagement] = useState<UsageEngagementData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  
  const [textColor, setTextColor] = useState(isDark ? '#94a3b8' : '#64748b');
  const [foregroundColor, setForegroundColor] = useState(isDark ? '#e2e8f0' : '#0f172a');
  const [cardBg, setCardBg] = useState(isDark ? '#1e293b' : '#ffffff');
  const [borderColor, setBorderColor] = useState(isDark ? '#334155' : '#e2e8f0');

  useEffect(() => {
    setTextColor(isDark ? '#94a3b8' : '#64748b');
    setForegroundColor(isDark ? '#e2e8f0' : '#0f172a');
    setCardBg(isDark ? '#1e293b' : '#ffffff');
    setBorderColor(isDark ? '#334155' : '#e2e8f0');
  }, [isDark, resolvedTheme]);

  // Fetch dashboard data
  const fetchDashboardData = async (silent: boolean = false) => {
    try {
      if (!silent) {
        console.log('Fetching dashboard data...');
      }
      const data = await adminDashboardAPI.getDashboardOverview();
      if (!silent) {
        console.log('Dashboard data received:', data);
      }
      setKpis(data.kpis);
      setUsageEngagement(data.usage_engagement);
      setPerformanceMetrics(data.performance_metrics);
      setFeatureUsage(data.feature_usage);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
      
      // Only show success toast on manual refresh
      if (refreshing && !silent) {
        toast.success("Dashboard data refreshed!");
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error?.message || "Failed to load dashboard data";
      toast.error(errorMessage);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(false);
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData(true); // Silent on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 5 minutes (reduced from 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent auto-refresh
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Custom tooltip component with theme-aware styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '12px',
            color: foregroundColor,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ marginBottom: '8px', fontWeight: 600, color: foregroundColor }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: '4px 0',
              }}
            >
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Last Updated and Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
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
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Key Platform Metrics */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{kpis?.total_users || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Active Users</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-success" />
                  <p className="text-2xl font-bold text-foreground">{kpis?.system_uptime || 0}%</p>
                  <p className="text-xs text-muted-foreground">System Uptime</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-ai" />
                  <p className="text-2xl font-bold text-foreground">{kpis?.response_time || 0}ms</p>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Server className="w-8 h-8 mx-auto mb-2 text-warning" />
                  <p className="text-2xl font-bold text-foreground">{kpis?.cpu_usage || 0}%</p>
                  <p className="text-xs text-muted-foreground">CPU Usage</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-info" />
                  <p className="text-2xl font-bold text-foreground">{kpis?.active_internships || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Internships</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-error" />
                  <p className="text-2xl font-bold text-foreground">{kpis?.security_alerts_24h || 0}</p>
                  <p className="text-xs text-muted-foreground">Security Alerts (24h)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Usage & Engagement</CardTitle>
              <CardDescription>User growth across all roles</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usageEngagement}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorAdvisors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.success} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.success} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorSupervisors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.ai} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.ai} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorAdmins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.warning} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.warning} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={{ stroke: borderColor }}
                  />
                  <YAxis 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={{ stroke: borderColor }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: foregroundColor }}
                    iconType="square"
                  />
                  <Area type="monotone" dataKey="students" stroke={colors.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" name="Students" />
                  <Area type="monotone" dataKey="advisors" stroke={colors.success} strokeWidth={2} fillOpacity={1} fill="url(#colorAdvisors)" name="Advisors" />
                  <Area type="monotone" dataKey="supervisors" stroke={colors.ai} strokeWidth={2} fillOpacity={1} fill="url(#colorSupervisors)" name="Supervisors" />
                  <Area type="monotone" dataKey="admins" stroke={colors.warning} strokeWidth={2} fillOpacity={1} fill="url(#colorAdmins)" name="Admins" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>System Performance Metrics</CardTitle>
              <CardDescription>Real-time monitoring of system health</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={{ stroke: borderColor }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={{ stroke: borderColor }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                    axisLine={{ stroke: borderColor }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: foregroundColor }}
                    iconType="line"
                  />
                  <Line yAxisId="left" type="monotone" dataKey="response_time" stroke={colors.primary} strokeWidth={3} name="Response Time (ms)" dot={{ fill: colors.primary, r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="cpu_usage" stroke={colors.warning} strokeWidth={3} name="CPU Usage %" dot={{ fill: colors.warning, r: 4 }} />
                  <Line yAxisId="left" type="monotone" dataKey="ai_processing" stroke={colors.ai} strokeWidth={3} name="AI Processing (s)" dot={{ fill: colors.ai, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature Usage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Analytics</CardTitle>
              <CardDescription>Adoption rates by feature</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={featureUsage} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
                  <XAxis 
                    dataKey="feature" 
                    stroke={textColor}
                    tick={{ fill: textColor, fontSize: 11 }}
                    axisLine={{ stroke: borderColor }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    stroke={textColor}
                    tick={{ fill: textColor, fontSize: 12 }}
                    axisLine={{ stroke: borderColor }}
                    label={{ value: 'Usage %', angle: -90, position: 'insideLeft', fill: textColor }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="usage_percent" 
                    fill={colors.ai} 
                    radius={[8, 8, 0, 0]} 
                    maxBarSize={60}
                    label={{ position: 'top', fill: foregroundColor, fontSize: 12, formatter: (value: number) => `${value}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
