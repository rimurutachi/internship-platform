'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Users, Server, Shield, DollarSign, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const platformUsageData = [
  { month: "Jan", students: 120, advisors: 15, supervisors: 25, companies: 8 },
  { month: "Feb", students: 145, advisors: 18, supervisors: 30, companies: 10 },
  { month: "Mar", students: 165, advisors: 20, supervisors: 35, companies: 12 },
  { month: "Apr", students: 190, advisors: 22, supervisors: 40, companies: 14 },
  { month: "May", students: 210, advisors: 25, supervisors: 45, companies: 15 },
  { month: "Jun", students: 235, advisors: 28, supervisors: 50, companies: 18 },
];

const systemPerformanceData = [
  { hour: "00:00", responseTime: 120, cpuUsage: 45, aiProcessing: 2.1 },
  { hour: "04:00", responseTime: 110, cpuUsage: 40, aiProcessing: 1.9 },
  { hour: "08:00", responseTime: 180, cpuUsage: 70, aiProcessing: 2.8 },
  { hour: "12:00", responseTime: 220, cpuUsage: 85, aiProcessing: 3.2 },
  { hour: "16:00", responseTime: 200, cpuUsage: 80, aiProcessing: 2.9 },
  { hour: "20:00", responseTime: 150, cpuUsage: 60, aiProcessing: 2.3 },
];

const universityAdoptionData = [
  { university: "MIT", users: 85, growth: 25 },
  { university: "Stanford", users: 72, growth: 20 },
  { university: "UC Berkeley", users: 68, growth: 18 },
  { university: "Carnegie Mellon", users: 55, growth: 15 },
  { university: "Georgia Tech", users: 48, growth: 12 },
];

const featureUsageData = [
  { feature: "AI Evaluations", usage: 92 },
  { feature: "Document Collaboration", usage: 78 },
  { feature: "Real-time Chat", usage: 85 },
  { feature: "Analytics Dashboard", usage: 70 },
  { feature: "Mobile App", usage: 65 },
];

const revenueData = [
  { month: "Jan", subscription: 15000, enterprise: 8000 },
  { month: "Feb", subscription: 18000, enterprise: 10000 },
  { month: "Mar", subscription: 22000, enterprise: 12000 },
  { month: "Apr", subscription: 25000, enterprise: 15000 },
  { month: "May", subscription: 28000, enterprise: 18000 },
  { month: "Jun", subscription: 32000, enterprise: 20000 },
];

const subscriptionBreakdownData = [
  { plan: "Free", count: 85, percentage: 36 },
  { plan: "Basic", count: 95, percentage: 40 },
  { plan: "Pro", count: 42, percentage: 18 },
  { plan: "Enterprise", count: 13, percentage: 6 },
];

const securityMetricsData = [
  { type: "Login Attempts", success: 9850, failed: 150 },
  { type: "API Calls", success: 125000, failed: 250 },
  { type: "Data Access", success: 45000, failed: 45 },
];

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

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b'];

export function AdminAnalytics() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const colors = getChartColors(isDark);
  
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
      {/* Key Platform Metrics */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">235</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-foreground">99.8%</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-ai" />
              <p className="text-2xl font-bold text-foreground">2.3s</p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Server className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-foreground">65%</p>
              <p className="text-xs text-muted-foreground">CPU Usage</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-foreground">$52K</p>
              <p className="text-xs text-muted-foreground">MRR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-error" />
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Security Alerts</p>
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
            <AreaChart data={platformUsageData}>
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
            <LineChart data={systemPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
              <XAxis 
                dataKey="hour" 
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
              <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke={colors.primary} strokeWidth={3} name="Response Time (ms)" dot={{ fill: colors.primary, r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="cpuUsage" stroke={colors.warning} strokeWidth={3} name="CPU Usage %" dot={{ fill: colors.warning, r: 4 }} />
              <Line yAxisId="left" type="monotone" dataKey="aiProcessing" stroke={colors.ai} strokeWidth={3} name="AI Processing (s)" dot={{ fill: colors.ai, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* University Adoption Rates */}
        <Card>
          <CardHeader>
            <CardTitle>University Adoption Rates</CardTitle>
            <CardDescription>User count and growth by institution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={universityAdoptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} opacity={0.3} />
                <XAxis 
                  dataKey="university" 
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
                <Bar dataKey="users" fill={colors.primary} radius={[8, 8, 0, 0]} name="Total Users" />
                <Bar dataKey="growth" fill={colors.success} radius={[8, 8, 0, 0]} name="Monthly Growth" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Analytics</CardTitle>
            <CardDescription>Adoption rates by feature</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={featureUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                  dataKey="usage" 
                  fill={colors.ai} 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={60}
                  label={{ position: 'top', fill: foregroundColor, fontSize: 12, formatter: (value: number) => `${value}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>Subscription and enterprise revenue streams</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorSubscription" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.success} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors.success} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorEnterprise" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05} />
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
              <Area type="monotone" dataKey="subscription" stroke={colors.success} strokeWidth={2} fillOpacity={1} fill="url(#colorSubscription)" name="Subscription Revenue" />
              <Area type="monotone" dataKey="enterprise" stroke={colors.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorEnterprise)" name="Enterprise Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan Distribution</CardTitle>
            <CardDescription>User breakdown by plan tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percentage }: { plan: string; percentage: number }) => `${plan}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {subscriptionBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Security Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Compliance</CardTitle>
            <CardDescription>Authentication and access monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityMetricsData.map((metric, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{metric.type}</h4>
                    <Badge variant="success">
                      {((metric.success / (metric.success + metric.failed)) * 100).toFixed(2)}% success
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Success</p>
                      <p className="text-xl font-bold text-success">{metric.success.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="text-xl font-bold text-error">{metric.failed.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
