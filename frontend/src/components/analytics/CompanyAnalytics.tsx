'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, DollarSign, Target, Award, Building2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const internPerformanceData = [
  { month: "Jan", performance: 75, productivity: 70 },
  { month: "Feb", performance: 78, productivity: 75 },
  { month: "Mar", performance: 82, productivity: 80 },
  { month: "Apr", performance: 85, productivity: 83 },
  { month: "May", performance: 88, productivity: 87 },
  { month: "Jun", performance: 90, productivity: 89 },
];

const evaluationTrendsData = [
  { year: "2020", avgGrade: 78, hireRate: 65 },
  { year: "2021", avgGrade: 80, hireRate: 70 },
  { year: "2022", avgGrade: 83, hireRate: 75 },
  { year: "2023", avgGrade: 85, hireRate: 80 },
  { year: "2024", avgGrade: 87, hireRate: 85 },
];

const universityPartnershipsData = [
  { university: "MIT", interns: 15, avgGrade: 92, retention: 87 },
  { university: "Stanford", interns: 12, avgGrade: 90, retention: 83 },
  { university: "UC Berkeley", interns: 10, avgGrade: 88, retention: 80 },
  { university: "Carnegie Mellon", interns: 8, avgGrade: 91, retention: 85 },
];

const roiData = [
  { quarter: "Q1", investment: 50000, value: 75000 },
  { quarter: "Q2", investment: 55000, value: 85000 },
  { quarter: "Q3", investment: 60000, value: 95000 },
  { quarter: "Q4", investment: 65000, value: 105000 },
];

const talentPipelineData = [
  { role: "Software Engineer", current: 8, projected: 12 },
  { role: "Data Analyst", current: 5, projected: 8 },
  { role: "Product Manager", current: 3, projected: 5 },
  { role: "DevOps Engineer", current: 4, projected: 6 },
];

const hiringRecommendations = [
  { name: "John Martinez", grade: 92, skills: "Full-stack, React, Node.js", recommendation: "Strongly Recommend", confidence: 95 },
  { name: "Sarah Chen", grade: 88, skills: "Data Science, Python, ML", recommendation: "Recommend", confidence: 90 },
  { name: "Mark Rodriguez", grade: 85, skills: "Product Management, Agile", recommendation: "Consider", confidence: 82 },
];

export function CompanyAnalytics() {
  const { resolvedTheme } = useTheme();
  const [textColor, setTextColor] = useState('#94a3b8');
  const [foregroundColor, setForegroundColor] = useState('#ededed');
  const [cardBg, setCardBg] = useState('#1a1a1a');
  const [borderColor, setBorderColor] = useState('#334155');

  useEffect(() => {
    // Get computed CSS variable values
    // Create a temporary element to get computed styles with CSS variables resolved
    const tempEl = document.createElement('div');
    tempEl.style.color = 'var(--muted-foreground)';
    tempEl.style.backgroundColor = 'var(--card)';
    tempEl.style.borderColor = 'var(--border)';
    document.body.appendChild(tempEl);
    
    const computedStyle = window.getComputedStyle(tempEl);
    const computedMutedFg = computedStyle.color;
    const computedCard = computedStyle.backgroundColor;
    const computedBorder = computedStyle.borderColor;
    
    // Get foreground color from a test element
    tempEl.style.color = 'var(--foreground)';
    const computedFg = window.getComputedStyle(tempEl).color;
    
    document.body.removeChild(tempEl);
    
    if (computedMutedFg) setTextColor(computedMutedFg);
    if (computedFg) setForegroundColor(computedFg);
    if (computedCard) setCardBg(computedCard);
    if (computedBorder) setBorderColor(computedBorder);
  }, [resolvedTheme]);

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
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Interns</p>
                <p className="text-3xl font-bold text-foreground">45</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+12% from last year</span>
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
                <p className="text-sm text-muted-foreground mb-1">Hire Rate</p>
                <p className="text-3xl font-bold text-foreground">85%</p>
                <p className="text-xs text-muted-foreground mt-1">38 of 45 hired</p>
              </div>
              <Award className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Program ROI</p>
                <p className="text-3xl font-bold text-foreground">162%</p>
                <p className="text-xs text-muted-foreground mt-1">$105K value</p>
              </div>
              <DollarSign className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Performance</p>
                <p className="text-3xl font-bold text-foreground">87%</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+5% improvement</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-ai" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intern Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Intern Performance Trends</CardTitle>
          <CardDescription>Performance and productivity metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={internPerformanceData}>
              <defs>
                <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                domain={[0, 100]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: foregroundColor }}
                iconType="square"
              />
              <Area type="monotone" dataKey="performance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPerformance)" name="Performance Score" />
              <Area type="monotone" dataKey="productivity" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorProductivity)" name="Productivity Score" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Historical Evaluation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Evaluation Trends</CardTitle>
          <CardDescription>5-year performance and hiring patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evaluationTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="year" 
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
              <Line yAxisId="left" type="monotone" dataKey="avgGrade" stroke="hsl(var(--primary))" strokeWidth={3} name="Average Grade" />
              <Line yAxisId="right" type="monotone" dataKey="hireRate" stroke="hsl(var(--success))" strokeWidth={3} name="Hire Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ROI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Program ROI Analysis</CardTitle>
            <CardDescription>Investment vs value generated</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="quarter" 
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
                <Legend 
                  wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                  iconType="square"
                />
                <Bar dataKey="investment" fill="hsl(var(--warning))" radius={[8, 8, 0, 0]} name="Investment" />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} name="Value Generated" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Talent Pipeline Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Talent Pipeline Forecast</CardTitle>
            <CardDescription>Current vs projected hiring needs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={talentPipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="role" 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                  axisLine={{ stroke: textColor }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                  axisLine={{ stroke: textColor }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                  iconType="square"
                />
                <Bar dataKey="current" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Current Pipeline" />
                <Bar dataKey="projected" fill="hsl(var(--ai))" radius={[8, 8, 0, 0]} name="Projected Need" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* University Partnership Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>University Partnership Effectiveness</CardTitle>
          <CardDescription>Performance metrics by university</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {universityPartnershipsData.map((uni, index) => (
              <div key={index} className="p-4 border border-border rounded-lg hover:shadow-card transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{uni.university}</h4>
                      <p className="text-xs text-muted-foreground">{uni.interns} interns • Avg Grade: {uni.avgGrade}%</p>
                    </div>
                  </div>
                  <Badge variant="success">{uni.retention}% retention</Badge>
                </div>
                <Progress value={uni.retention} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hiring Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Hiring Recommendations</CardTitle>
          <CardDescription>Top candidates based on performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hiringRecommendations.map((candidate, index) => (
              <div key={index} className="p-4 border border-border rounded-lg hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{candidate.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{candidate.skills}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={candidate.recommendation === "Strongly Recommend" ? "success" : "secondary"}>
                        {candidate.recommendation}
                      </Badge>
                      <span className="text-xs text-muted-foreground">AI Confidence: {candidate.confidence}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success mb-1">{candidate.grade}%</div>
                    <p className="text-xs text-muted-foreground">Final Grade</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
