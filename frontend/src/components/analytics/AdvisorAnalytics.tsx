'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Clock, Brain, AlertTriangle, Building2, CheckCircle, FileText, Download, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { exportAdvisorAnalyticsToCSV, exportAdvisorAnalyticsToJSON, exportAdvisorAnalyticsToText } from "@/utils/exportAdvisorAnalytics";
import { CustomReportBuilder } from './CustomReportBuilder';
import { HistoricalDataView } from './HistoricalDataView';

const cohortPerformanceData = [
  { month: "Jan", avgGrade: 78, students: 42 },
  { month: "Feb", avgGrade: 80, students: 45 },
  { month: "Mar", avgGrade: 82, students: 48 },
  { month: "Apr", avgGrade: 85, students: 50 },
  { month: "May", avgGrade: 84, students: 48 },
  { month: "Jun", avgGrade: 87, students: 52 },
];

const gradeDistributionData = [
  { grade: "A (90-100)", count: 18, percentage: 35 },
  { grade: "B (80-89)", count: 23, percentage: 45 },
  { grade: "C (70-79)", count: 8, percentage: 15 },
  { grade: "D (60-69)", count: 3, percentage: 5 },
];

const aiAccuracyData = [
  { month: "Jan", aiGrade: 85, manualGrade: 82, accuracy: 92 },
  { month: "Feb", aiGrade: 88, manualGrade: 87, accuracy: 94 },
  { month: "Mar", aiGrade: 86, manualGrade: 85, accuracy: 93 },
  { month: "Apr", aiGrade: 90, manualGrade: 88, accuracy: 95 },
  { month: "May", aiGrade: 87, manualGrade: 86, accuracy: 96 },
  { month: "Jun", aiGrade: 92, manualGrade: 90, accuracy: 97 },
];

const timeSavingsData = [
  { task: "Manual Grading", hours: 120 },
  { task: "With AI", hours: 24 },
];

const companyPartnershipsData = [
  { company: "TechCorp", interns: 15, avgRating: 4.5, hireRate: 80 },
  { company: "InnovateHub", interns: 12, avgRating: 4.2, hireRate: 75 },
  { company: "DataFlow", interns: 10, avgRating: 4.8, hireRate: 90 },
  { company: "CloudSys", interns: 8, avgRating: 4.3, hireRate: 70 },
];

const biasDetectionData = [
  { type: "Gender Bias", detected: 3, resolved: 3 },
  { type: "Age Bias", detected: 1, resolved: 1 },
  { type: "Education Bias", detected: 2, resolved: 2 },
];

export function AdvisorAnalytics() {
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
        activeStudents: 52,
        aiAccuracy: 97,
        timeSaved: 96,
        biasAlerts: 6,
      },
      cohortPerformance: cohortPerformanceData,
      gradeDistribution: gradeDistributionData,
      aiAccuracy: aiAccuracyData,
      timeSavings: timeSavingsData,
      companyPartnerships: companyPartnershipsData,
      biasDetection: biasDetectionData,
    };

    switch (format) {
      case 'csv':
        exportAdvisorAnalyticsToCSV(analyticsData);
        break;
      case 'json':
        exportAdvisorAnalyticsToJSON(analyticsData);
        break;
      case 'txt':
        exportAdvisorAnalyticsToText(analyticsData);
        break;
    }
  };

  const handleCustomExport = (reportData: any, format: 'csv' | 'json' | 'txt', template: string) => {
    // Handle custom report export with selected metrics and date range
    const analyticsData = {
      keyMetrics: {
        activeStudents: reportData.selectedMetrics.keyMetrics ? 52 : 0,
        aiAccuracy: reportData.selectedMetrics.keyMetrics ? 97 : 0,
        timeSaved: reportData.selectedMetrics.keyMetrics ? 96 : 0,
        biasAlerts: reportData.selectedMetrics.keyMetrics ? 6 : 0,
      },
      cohortPerformance: reportData.selectedMetrics.cohortPerformance ? cohortPerformanceData : [],
      gradeDistribution: reportData.selectedMetrics.gradeDistribution ? gradeDistributionData : [],
      aiAccuracy: reportData.selectedMetrics.aiAccuracy ? aiAccuracyData : [],
      timeSavings: reportData.selectedMetrics.timeSavings ? timeSavingsData : [],
      companyPartnerships: reportData.selectedMetrics.companyPartnerships ? companyPartnershipsData : [],
      biasDetection: reportData.selectedMetrics.biasDetection ? biasDetectionData : [],
    };

    switch (format) {
      case 'csv':
        exportAdvisorAnalyticsToCSV(analyticsData);
        break;
      case 'json':
        exportAdvisorAnalyticsToJSON(analyticsData);
        break;
      case 'txt':
        exportAdvisorAnalyticsToText(analyticsData);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="w-full">
        {/* Header with Tabs and Export Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* Tabs */}
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="current" className="flex-1 sm:flex-none">Current Analytics</TabsTrigger>
            <TabsTrigger value="historical" className="flex-1 sm:flex-none">Historical Data</TabsTrigger>
          </TabsList>

          {/* Export Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <CustomReportBuilder onExport={handleCustomExport} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Quick Export</span>
                  <span className="sm:hidden">Export</span>
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
                  Export as Text
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
                <p className="text-sm text-muted-foreground mb-1">Active Students</p>
                <p className="text-3xl font-bold text-foreground">52</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+8 this semester</span>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Accuracy</p>
                <p className="text-3xl font-bold text-foreground">97%</p>
                <p className="text-xs text-muted-foreground mt-1">vs manual grading</p>
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
                <p className="text-3xl font-bold text-foreground">96h</p>
                <p className="text-xs text-muted-foreground mt-1">This semester</p>
              </div>
              <Clock className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bias Alerts</p>
                <p className="text-3xl font-bold text-foreground">6</p>
                <p className="text-xs text-success mt-1">All resolved</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Student Cohort Performance</CardTitle>
          <CardDescription>Average grades and enrollment trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cohortPerformanceData}>
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
              <Line yAxisId="left" type="monotone" dataKey="avgGrade" stroke={primaryColor} strokeWidth={3} name="Average Grade" />
              <Line yAxisId="right" type="monotone" dataKey="students" stroke={aiColor} strokeWidth={3} name="Student Count" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Current semester breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percentage }: { grade: string; percentage: number }) => `${grade}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeDistributionData.map((entry, index) => (
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
              <p className="text-xs text-muted-foreground mt-1">AI automation saves 96 hours per semester</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Accuracy Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>AI Accuracy vs Manual Grading</CardTitle>
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
                stroke={textColor}
                tick={{ fill: textColor }}
                axisLine={{ stroke: textColor }}
                domain={[70, 100]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: foregroundColor }}
                iconType="line"
              />
              <Line type="monotone" dataKey="aiGrade" stroke={aiColor} strokeWidth={3} name="AI Grade" />
              <Line type="monotone" dataKey="manualGrade" stroke={primaryColor} strokeWidth={3} name="Manual Grade" />
              <Line type="monotone" dataKey="accuracy" stroke={successColor} strokeWidth={3} strokeDasharray="5 5" name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Company Partnership Success */}
      <Card>
        <CardHeader>
          <CardTitle>Company Partnership Metrics</CardTitle>
          <CardDescription>Effectiveness and success rates by company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyPartnershipsData.map((company, index) => (
              <div key={index} className="p-4 border border-border rounded-lg hover:shadow-card transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{company.company}</h4>
                      <p className="text-xs text-muted-foreground">{company.interns} interns placed</p>
                    </div>
                  </div>
                  <Badge variant="success">{company.hireRate}% hire rate</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.floor(company.avgRating) ? "text-warning" : "text-muted"}>★</span>
                    ))}
                    <span className="ml-2 text-sm font-medium text-foreground">{company.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bias Detection Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Bias Detection Reports</CardTitle>
          <CardDescription>Identified and resolved bias alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {biasDetectionData.map((bias, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">{bias.type}</p>
                    <p className="text-xs text-muted-foreground">{bias.detected} cases detected</p>
                  </div>
                </div>
                <Badge variant="success">
                  {bias.resolved}/{bias.detected} resolved
                </Badge>
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
