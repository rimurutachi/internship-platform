'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, Building2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Mock historical internship data
const historicalInternships = [
  {
    year: '2023',
    semester: 'Spring',
    totalInterns: 45,
    avgRating: 4.3,
    hireRate: 78,
    companies: 12,
    completedEvaluations: 120,
    avgDuration: 16, // weeks
  },
  {
    year: '2023',
    semester: 'Fall',
    totalInterns: 52,
    avgRating: 4.4,
    hireRate: 82,
    companies: 15,
    completedEvaluations: 145,
    avgDuration: 16,
  },
  {
    year: '2024',
    semester: 'Spring',
    totalInterns: 48,
    avgRating: 4.5,
    hireRate: 85,
    companies: 14,
    completedEvaluations: 135,
    avgDuration: 16,
  },
  {
    year: '2024',
    semester: 'Fall',
    totalInterns: 55,
    avgRating: 4.6,
    hireRate: 87,
    companies: 16,
    completedEvaluations: 165,
    avgDuration: 16,
  },
];

const companyPerformance = [
  { company: 'TechCorp Solutions', interns: 45, avgRating: 4.7, hireRate: 90, years: ['2023', '2024'] },
  { company: 'InnovateHub', interns: 38, avgRating: 4.5, hireRate: 82, years: ['2023', '2024'] },
  { company: 'DataFlow Inc', interns: 32, avgRating: 4.8, hireRate: 94, years: ['2023', '2024'] },
  { company: 'CloudSys Technologies', interns: 28, avgRating: 4.4, hireRate: 79, years: ['2024'] },
];

export function HistoricalDataView() {
  const { resolvedTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [textColor, setTextColor] = useState('#94a3b8');
  const [foregroundColor, setForegroundColor] = useState('#ededed');
  const [borderColor, setBorderColor] = useState('#334155');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [successColor, setSuccessColor] = useState('#10b981');

  useEffect(() => {
    const tempEl = document.createElement('div');
    tempEl.style.color = 'var(--muted-foreground)';
    tempEl.style.borderColor = 'var(--border)';
    document.body.appendChild(tempEl);
    
    const computedStyle = window.getComputedStyle(tempEl);
    const computedMutedFg = computedStyle.color;
    const computedBorder = computedStyle.borderColor;
    
    tempEl.style.color = 'var(--foreground)';
    const computedFg = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--primary)';
    const computedPrimary = window.getComputedStyle(tempEl).color;
    
    tempEl.style.color = 'var(--success)';
    const computedSuccess = window.getComputedStyle(tempEl).color;
    
    document.body.removeChild(tempEl);
    
    if (computedMutedFg) setTextColor(computedMutedFg);
    if (computedFg) setForegroundColor(computedFg);
    if (computedBorder) setBorderColor(computedBorder);
    if (computedPrimary) setPrimaryColor(computedPrimary);
    if (computedSuccess) setSuccessColor(computedSuccess);
  }, [resolvedTheme]);

  const filteredData = selectedPeriod === 'all' 
    ? historicalInternships 
    : historicalInternships.filter(item => 
        selectedPeriod === '2024' ? item.year === '2024' : 
        selectedPeriod === '2023' ? item.year === '2023' : true
      );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '12px',
            color: foregroundColor,
          }}
        >
          <p style={{ marginBottom: '8px', fontWeight: 600 }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate trends
  const currentYear = filteredData.filter(d => d.year === '2024');
  const previousYear = filteredData.filter(d => d.year === '2023');
  const avgRatingTrend = currentYear.length > 0 && previousYear.length > 0
    ? ((currentYear.reduce((a, b) => a + b.avgRating, 0) / currentYear.length) - 
       (previousYear.reduce((a, b) => a + b.avgRating, 0) / previousYear.length))
    : 0;
  const hireRateTrend = currentYear.length > 0 && previousYear.length > 0
    ? ((currentYear.reduce((a, b) => a + b.hireRate, 0) / currentYear.length) - 
       (previousYear.reduce((a, b) => a + b.hireRate, 0) / previousYear.length))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Historical Internship Data</h2>
          <p className="text-muted-foreground mt-1">Past internships and performance trends</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Rating Trend</p>
                <p className="text-2xl font-bold text-foreground">
                  {avgRatingTrend > 0 ? '+' : ''}{avgRatingTrend.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs previous year</p>
              </div>
              {avgRatingTrend > 0 ? (
                <TrendingUp className="w-8 h-8 text-success" />
              ) : (
                <TrendingDown className="w-8 h-8 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hire Rate Trend</p>
                <p className="text-2xl font-bold text-foreground">
                  {hireRateTrend > 0 ? '+' : ''}{hireRateTrend.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs previous year</p>
              </div>
              {hireRateTrend > 0 ? (
                <TrendingUp className="w-8 h-8 text-success" />
              ) : (
                <TrendingDown className="w-8 h-8 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Past Internships</p>
                <p className="text-2xl font-bold text-foreground">
                  {historicalInternships.reduce((sum, item) => sum + item.totalInterns, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Across all periods</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="companies">Company Performance</TabsTrigger>
          <TabsTrigger value="detailed">Detailed History</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Internship Performance Over Time</CardTitle>
              <CardDescription>Average ratings and hire rates by semester</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                  <XAxis 
                    dataKey="semester" 
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
                  <Legend wrapperStyle={{ color: foregroundColor }} />
                  <Line type="monotone" dataKey="avgRating" stroke={primaryColor} strokeWidth={3} name="Avg Rating" />
                  <Line type="monotone" dataKey="hireRate" stroke={successColor} strokeWidth={3} name="Hire Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Intern Count Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                    <XAxis 
                      dataKey="semester" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <YAxis 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="totalInterns" stroke={primaryColor} fill={primaryColor} fillOpacity={0.3} name="Total Interns" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluations Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                    <XAxis 
                      dataKey="semester" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <YAxis 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="completedEvaluations" fill={successColor} name="Completed Evaluations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Performance History</CardTitle>
              <CardDescription>Long-term performance metrics by company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companyPerformance.map((company, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{company.company}</h4>
                            <p className="text-xs text-muted-foreground">
                              {company.interns} interns • {company.years.join(', ')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="success">{company.hireRate}% hire rate</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Average Rating</p>
                          <p className="text-lg font-bold text-foreground">{company.avgRating.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Interns</p>
                          <p className="text-lg font-bold text-foreground">{company.interns}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Years Active</p>
                          <p className="text-lg font-bold text-foreground">{company.years.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Historical Records</CardTitle>
              <CardDescription>Complete internship history by semester</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.map((record, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {record.semester} {record.year}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {record.avgDuration} weeks average duration
                            </p>
                          </div>
                        </div>
                        <Badge>{record.totalInterns} interns</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Rating</p>
                          <p className="text-lg font-bold text-foreground">{record.avgRating.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hire Rate</p>
                          <p className="text-lg font-bold text-success">{record.hireRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Companies</p>
                          <p className="text-lg font-bold text-foreground">{record.companies}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Evaluations</p>
                          <p className="text-lg font-bold text-foreground">{record.completedEvaluations}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

