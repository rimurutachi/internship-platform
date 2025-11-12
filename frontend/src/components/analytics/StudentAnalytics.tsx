'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Award, Target, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const skillProgressionData = [
  { month: "Jan", technical: 65, communication: 70, problemSolving: 60 },
  { month: "Feb", technical: 72, communication: 75, problemSolving: 68 },
  { month: "Mar", technical: 78, communication: 80, problemSolving: 75 },
  { month: "Apr", technical: 85, communication: 85, problemSolving: 82 },
  { month: "May", technical: 88, communication: 88, problemSolving: 87 },
  { month: "Jun", technical: 92, communication: 90, problemSolving: 90 },
];

const internshipHistoryData = [
  { company: "TechCorp", grade: 88, year: "2023" },
  { company: "InnovateHub", grade: 85, year: "2023" },
  { company: "DataFlow Inc", grade: 92, year: "2024" },
];

const careerCompatibilityData = [
  { skill: "Software Development", score: 92 },
  { skill: "Data Science", score: 78 },
  { skill: "UI/UX Design", score: 65 },
  { skill: "Project Management", score: 70 },
  { skill: "DevOps", score: 85 },
];

const peerComparisonData = [
  { category: "Technical", you: 92, average: 78 },
  { category: "Communication", you: 88, average: 82 },
  { category: "Problem Solving", you: 90, average: 75 },
  { category: "Teamwork", you: 85, average: 80 },
  { category: "Leadership", you: 80, average: 70 },
];

const goalProgressData = [
  { goal: "Complete 3 Projects", progress: 100, status: "completed" },
  { goal: "Learn React Advanced", progress: 75, status: "in-progress" },
  { goal: "Contribute to Open Source", progress: 60, status: "in-progress" },
  { goal: "Get AWS Certification", progress: 40, status: "in-progress" },
];

export function StudentAnalytics() {
  const { resolvedTheme } = useTheme();
  const [textColor, setTextColor] = useState('#94a3b8');
  const [foregroundColor, setForegroundColor] = useState('#ededed');
  const [cardBg, setCardBg] = useState('#1a1a1a');
  const [borderColor, setBorderColor] = useState('#334155');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [aiColor, setAiColor] = useState('#8b5cf6');
  const [successColor, setSuccessColor] = useState('#10b981');
  const [mutedColor, setMutedColor] = useState('#64748b');

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
    
    tempEl.style.color = 'var(--muted)';
    const computedMuted = window.getComputedStyle(tempEl).color;
    
    document.body.removeChild(tempEl);
    
    if (computedMutedFg) setTextColor(computedMutedFg);
    if (computedFg) setForegroundColor(computedFg);
    if (computedCard) setCardBg(computedCard);
    if (computedBorder) setBorderColor(computedBorder);
    if (computedPrimary) setPrimaryColor(computedPrimary);
    if (computedAi) setAiColor(computedAi);
    if (computedSuccess) setSuccessColor(computedSuccess);
    if (computedMuted) setMutedColor(computedMuted);
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

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall GPA</p>
                <p className="text-3xl font-bold text-foreground">3.8</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+0.3 from last semester</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Internships Completed</p>
                <p className="text-3xl font-bold text-foreground">3</p>
                <p className="text-xs text-muted-foreground mt-1">Average grade: 88.3%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Peer Ranking</p>
                <p className="text-3xl font-bold text-foreground">Top 15%</p>
                <p className="text-xs text-muted-foreground mt-1">Among 200 students</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-ai/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-ai" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Progression Over Time</CardTitle>
          <CardDescription>Your skill development tracked across internships</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={skillProgressionData}>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: foregroundColor }}
                iconType="square"
              />
              <Area type="monotone" dataKey="technical" stroke={primaryColor} fillOpacity={0.6} fill={primaryColor} name="Technical Skills" />
              <Area type="monotone" dataKey="communication" stroke={aiColor} fillOpacity={0.6} fill={aiColor} name="Communication" />
              <Area type="monotone" dataKey="problemSolving" stroke={successColor} fillOpacity={0.6} fill={successColor} name="Problem Solving" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Internship History */}
        <Card>
          <CardHeader>
            <CardTitle>Internship History</CardTitle>
            <CardDescription>Your grades and feedback timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={internshipHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis 
                  dataKey="company" 
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
                <Bar dataKey="grade" fill={primaryColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Career Compatibility */}
        <Card>
          <CardHeader>
            <CardTitle>Career Compatibility Meter</CardTitle>
            <CardDescription>AI-based career path analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={careerCompatibilityData}>
                <PolarGrid stroke={borderColor} />
                <PolarAngleAxis 
                  dataKey="skill" 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <Radar name="Compatibility" dataKey="score" stroke={aiColor} fill={aiColor} fillOpacity={0.6} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Peer Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Peer Comparison</CardTitle>
          <CardDescription>Anonymous benchmarking against your cohort</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peerComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis 
                dataKey="category" 
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
              <Bar dataKey="you" fill={primaryColor} radius={[8, 8, 0, 0]} name="Your Score" />
              <Bar dataKey="average" fill={mutedColor} radius={[8, 8, 0, 0]} name="Cohort Average" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Goal Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Tracking</CardTitle>
          <CardDescription>Your achievement progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {goalProgressData.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{goal.goal}</span>
                <Badge variant={goal.status === "completed" ? "success" : "secondary"}>
                  {goal.progress}%
                </Badge>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
