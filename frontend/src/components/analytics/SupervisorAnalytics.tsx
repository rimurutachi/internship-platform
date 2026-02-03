'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Clock, Brain, AlertTriangle, Users, CheckCircle, Award, FileText, Download, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { exportAnalyticsToCSV, exportAnalyticsToJSON, exportAnalyticsToText } from "@/utils/exportAnalytics";
import { CustomReportBuilder } from './CustomReportBuilder';
import { HistoricalDataView } from './HistoricalDataView';

const internPerformanceData = [
  { month: "Jan", avgRating: 4.2, interns: 12 },
  { month: "Feb", avgRating: 4.3, interns: 14 },
  { month: "Mar", avgRating: 4.4, interns: 15 },
  { month: "Apr", avgRating: 4.5, interns: 15 },
  { month: "May", avgRating: 4.4, interns: 14 },
  { month: "Jun", avgRating: 4.6, interns: 16 },
];

const ratingDistributionData = [
  { rating: "Excellent (4.5-5.0)", count: 8, percentage: 40 },
  { rating: "Good (3.5-4.4)", count: 9, percentage: 45 },
  { rating: "Average (2.5-3.4)", count: 2, percentage: 10 },
  { rating: "Needs Improvement (1.0-2.4)", count: 1, percentage: 5 },
];

const aiAccuracyData = [
  { month: "Jan", aiRating: 4.3, manualRating: 4.2, accuracy: 92 },
  { month: "Feb", aiRating: 4.4, manualRating: 4.3, accuracy: 94 },
  { month: "Mar", aiRating: 4.5, manualRating: 4.4, accuracy: 93 },
  { month: "Apr", aiRating: 4.6, manualRating: 4.5, accuracy: 95 },
  { month: "May", aiRating: 4.5, manualRating: 4.4, accuracy: 96 },
  { month: "Jun", aiRating: 4.7, manualRating: 4.6, accuracy: 97 },
];

const timeSavingsData = [
  { task: "Manual Evaluation", hours: 80 },
  { task: "With AI", hours: 16 },
];

const internPerformanceMetrics = [
  { intern: "John Martinez", avgRating: 4.7, evaluations: 12, hireStatus: "Hired" },
  { intern: "Sarah Chen", avgRating: 4.5, evaluations: 10, hireStatus: "Hired" },
  { intern: "Mark Rodriguez", avgRating: 4.2, evaluations: 8, hireStatus: "Pending" },
  { intern: "Alice Johnson", avgRating: 4.8, evaluations: 15, hireStatus: "Hired" },
];

const evaluationStatsData = [
  { type: "Completed", count: 45, color: "bg-success" },
  { type: "Draft", count: 8, color: "bg-muted" },
  { type: "In Progress", count: 12, color: "bg-primary" },
];

export function SupervisorAnalytics() {
  const { resolvedTheme } = useTheme();
  const [textColor, setTextColor] = useState('#94a3b8');
  const [foregroundColor, setForegroundColor] = useState('#ededed');
  const [cardBg, setCardBg] = useState('#1a1a1a');
  const [borderColor, setBorderColor] = useState('#334155');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [aiColor, setAiColor] = useState('#8b5cf6');
  const [successColor, setSuccessColor] = useState('#10b981');
  const [warningColor, setWarningColor] = useState('#f59e0b');
  const [errorColor, setErrorColor] = useState('#ef4444');
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const tempEl = document.createElement('div');
    tempEl.style.color = 'var(--muted-foreground)';
    tempEl.style.backgroundColor = 'var(--card)';
    tempEl.style.borderColor = 'var(--border)';
    document.body.appendChild(tempEl);
    
    const computedStyle = window.getComputedStyle(tempEl);
    const computedMutedFg = computedStyle.color;
    const computedCard = computedStyle.backgroundColor;
    const computedBorder = computedStyle.borderColor;
    
    tempEl.style.color = 'var(--foreground)';
    const computedFg = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--primary)';
    const computedPrimary = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--ai)';
    const computedAi = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--success)';
    const computedSuccess = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--warning)';
    const computedWarning = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--destructive)';
    const computedError = window.getComputedStyle(tempEl).color;
    
    document.body.removeChild(tempEl);
    
    if (computedMutedFg) setTextColor(computedMutedFg);
    if (computedFg) setForegroundColor(computedFg);
    if (computedCard) setCardBg(computedCard);
    if (computedBorder) setBorderColor(computedBorder);
    if (computedPrimary) setPrimaryColor(computedPrimary);
    if (computedAi) setAiColor(computedAi);
    if (computedSuccess) setSuccessColor(computedSuccess);
    if (computedWarning) setWarningColor(computedWarning);
    if (computedError) setErrorColor(computedError);
    
    // Set pie chart colors array
    if (computedSuccess && computedPrimary && computedWarning && computedError) {
      setColors([computedSuccess, computedPrimary, computedWarning, computedError]);
    }
  }, [resolvedTheme]);

  // Custom tooltip component
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

  // Export handler
  const handleExport = (format: 'csv' | 'json' | 'txt') => {
    const analyticsData = {
      keyMetrics: {
        activeInterns: 16,
        aiAccuracy: 97,
        timeSaved: 64,
        evaluations: 65,
      },
      internPerformance: internPerformanceData,
      ratingDistribution: ratingDistributionData,
      aiAccuracy: aiAccuracyData,
      timeSavings: timeSavingsData,
      topPerformingInterns: internPerformanceMetrics,
      evaluationStats: evaluationStatsData.map(({ type, count }) => ({ type, count })),
    };

    switch (format) {
      case 'csv':
        exportAnalyticsToCSV(analyticsData);
        break;
      case 'json':
        exportAnalyticsToJSON(analyticsData);
        break;
      case 'txt':
        exportAnalyticsToText(analyticsData);
        break;
    }
  };

  const handleCustomExport = (reportData: any, format: 'csv' | 'json' | 'txt', template: string) => {
    // Handle custom report export with selected metrics and date range
    // For now, use the same export functions but with filtered data
    const analyticsData = {
      keyMetrics: reportData.selectedMetrics.keyMetrics ? reportData.keyMetrics : null,
      internPerformance: reportData.selectedMetrics.internPerformance ? internPerformanceData : [],
      ratingDistribution: reportData.selectedMetrics.ratingDistribution ? ratingDistributionData : [],
      aiAccuracy: reportData.selectedMetrics.aiAccuracy ? aiAccuracyData : [],
      timeSavings: reportData.selectedMetrics.timeSavings ? timeSavingsData : [],
      topPerformingInterns: reportData.selectedMetrics.topPerformers ? internPerformanceMetrics : [],
      evaluationStats: reportData.selectedMetrics.evaluationStats ? evaluationStatsData.map(({ type, count }) => ({ type, count })) : [],
    };

    switch (format) {
      case 'csv':
        exportAnalyticsToCSV(analyticsData);
        break;
      case 'json':
        exportAnalyticsToJSON(analyticsData);
        break;
      case 'txt':
        exportAnalyticsToText(analyticsData);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="w-full">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger value="current" className="flex-1 lg:flex-none">Current Analytics</TabsTrigger>
            <TabsTrigger value="historical" className="flex-1 lg:flex-none">Historical Data</TabsTrigger>
          </TabsList>

          {/* Export Buttons - Desktop */}
          <div className="hidden lg:flex gap-2">
            <CustomReportBuilder onExport={handleCustomExport} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Quick Export
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Text Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Export Buttons - Mobile */}
          <div className="flex lg:hidden flex-col gap-2 w-full">
            <CustomReportBuilder onExport={handleCustomExport} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Quick Export
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Text Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="current" className="space-y-6">
          {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Interns</p>
                <p className="text-3xl font-bold text-foreground">16</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+4 this quarter</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Accuracy</p>
                <p className="text-3xl font-bold text-foreground">97%</p>
                <p className="text-xs text-muted-foreground mt-1">vs manual evaluation</p>
              </div>
              <Brain className="w-8 h-8 text-ai" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time Saved</p>
                <p className="text-3xl font-bold text-foreground">64h</p>
                <p className="text-xs text-muted-foreground mt-1">This quarter</p>
              </div>
              <Clock className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Evaluations</p>
                <p className="text-3xl font-bold text-foreground">65</p>
                <p className="text-xs text-muted-foreground mt-1">Total this quarter</p>
              </div>
              <FileText className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intern Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Intern Performance Trends</CardTitle>
          <CardDescription>Average ratings and intern count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={internPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis 
                dataKey="month" 
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
              />
              <YAxis 
                yAxisId="left" 
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
                domain={[3.5, 5.0]}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: foregroundColor }}
                iconType="line"
              />
              <Line yAxisId="left" type="monotone" dataKey="avgRating" stroke={primaryColor} strokeWidth={3} name="Average Rating" />
              <Line yAxisId="right" type="monotone" dataKey="interns" stroke={aiColor} strokeWidth={3} name="Intern Count" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Current quarter breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratingDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, percentage }: { rating: string; percentage: number }) => `${rating}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ratingDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length] || primaryColor} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Savings */}
        <Card>
          <CardHeader>
            <CardTitle>Time Savings from Automation</CardTitle>
            <CardDescription>Hours spent on evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSavingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis 
                  dataKey="task" 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                  axisLine={{ stroke: textColor }}
                />
                <YAxis 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                  axisLine={{ stroke: textColor }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill={successColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm font-semibold text-success">80% Time Reduction</p>
              <p className="text-xs text-muted-foreground mt-1">AI automation saves 64 hours per quarter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Accuracy Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>AI Accuracy vs Manual Evaluation</CardTitle>
          <CardDescription>Trend lines showing AI performance improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={aiAccuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis 
                dataKey="month" 
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
              />
              <YAxis 
                yAxisId="left"
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
                domain={[3.5, 5.0]} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
                domain={[85, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: foregroundColor }}
                iconType="line"
              />
              <Line yAxisId="left" type="monotone" dataKey="aiRating" stroke={aiColor} strokeWidth={3} name="AI Rating" />
              <Line yAxisId="left" type="monotone" dataKey="manualRating" stroke={primaryColor} strokeWidth={3} name="Manual Rating" />
              <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke={successColor} strokeWidth={3} strokeDasharray="5 5" name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Interns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Interns</CardTitle>
          <CardDescription>Performance metrics and hire status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {internPerformanceMetrics.map((intern, index) => (
              <div key={index} className="p-4 border border-border rounded-lg hover:shadow-card transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{intern.intern}</h4>
                      <p className="text-xs text-muted-foreground">{intern.evaluations} evaluations completed</p>
                    </div>
                  </div>
                  <Badge variant={intern.hireStatus === "Hired" ? "success" : "default"}>
                    {intern.hireStatus}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Average Rating:</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.floor(intern.avgRating) ? "text-warning" : "text-muted"}>★</span>
                    ))}
                    <span className="ml-2 text-sm font-medium text-foreground">{intern.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Status Overview</CardTitle>
          <CardDescription>Breakdown of evaluation statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluationStatsData.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                  <div>
                    <p className="font-medium text-foreground">{stat.type}</p>
                    <p className="text-xs text-muted-foreground">{stat.count} evaluations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <HistoricalDataView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

