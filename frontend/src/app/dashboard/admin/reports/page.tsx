'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, TrendingUp, Users, FileText, Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { adminReportsAPI } from '@/lib/api/admin-reports';
import {
  ReportOverview,
  MonthlyStat,
  UserGrowthPeriod,
  InternshipStatusData,
  EvaluationMetrics,
} from '@/types/reports';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // State for API data
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPeriod[]>([]);
  const [internshipStatus, setInternshipStatus] = useState<InternshipStatusData | null>(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetrics | null>(null);

  // Fetch all data on mount
  const fetchAllData = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch reports data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    setExporting(true);
    try {
      const blob = await adminReportsAPI.exportReport({
        format,
        metrics: ['overview', 'monthly_stats', 'user_growth', 'internship_status', 'evaluation_metrics'],
      });
      
      // Create download link
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

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
                  <p className="text-muted-foreground mt-1">Platform performance and historical data</p>
                </div>
                <Select onValueChange={(value) => handleExport(value as 'csv' | 'json' | 'pdf')} disabled={exporting}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={exporting ? 'Exporting...' : 'Export Report'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">Export as CSV</SelectItem>
                    <SelectItem value="json">Export as JSON</SelectItem>
                    <SelectItem value="pdf">Export as PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{overview?.total_users || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{overview?.active_internships || 0}</div>
                        <div className="text-sm text-muted-foreground">Internships</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <BarChart className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{overview?.total_evaluations || 0}</div>
                        <div className="text-sm text-muted-foreground">Evaluations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{overview?.completion_rate || 0}%</div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-muted">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="growth">User Growth</TabsTrigger>
                  <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead>New Users</TableHead>
                              <TableHead>Internships</TableHead>
                              <TableHead>Evaluations</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {monthlyStats.map((data) => (
                              <TableRow key={data.month}>
                                <TableCell className="font-medium text-foreground">{data.month}</TableCell>
                                <TableCell className="text-muted-foreground">{data.users}</TableCell>
                                <TableCell className="text-muted-foreground">{data.internships}</TableCell>
                                <TableCell className="text-muted-foreground">{data.evaluations}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="growth" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Growth by Role (Last 12 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Period</TableHead>
                              <TableHead>Students</TableHead>
                              <TableHead>Advisors</TableHead>
                              <TableHead>Supervisors</TableHead>
                              <TableHead>Admins</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userGrowth.map((data) => (
                              <TableRow key={data.period}>
                                <TableCell className="font-medium text-foreground">{data.period}</TableCell>
                                <TableCell className="text-muted-foreground">{data.students}</TableCell>
                                <TableCell className="text-muted-foreground">{data.advisors}</TableCell>
                                <TableCell className="text-muted-foreground">{data.supervisors}</TableCell>
                                <TableCell className="text-muted-foreground">{data.admins}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="evaluations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Evaluation Metrics - Average Ratings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {evaluationMetrics && (
                        <>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Overall Rating</span>
                              <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.overall.toFixed(2)}/10</span>
                            </div>
                            <Progress value={(evaluationMetrics.avg_ratings.overall / 10) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Technical Skills</span>
                              <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.technical.toFixed(2)}/10</span>
                            </div>
                            <Progress value={(evaluationMetrics.avg_ratings.technical / 10) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Communication</span>
                              <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.communication.toFixed(2)}/10</span>
                            </div>
                            <Progress value={(evaluationMetrics.avg_ratings.communication / 10) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Work Ethic</span>
                              <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.work_ethic.toFixed(2)}/10</span>
                            </div>
                            <Progress value={(evaluationMetrics.avg_ratings.work_ethic / 10) * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Quality Score</span>
                              <span className="text-sm font-bold text-primary">{evaluationMetrics.quality_score.toFixed(2)}%</span>
                            </div>
                            <Progress value={evaluationMetrics.quality_score} className="h-2" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {evaluationMetrics && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{evaluationMetrics.submission_stats.on_time}</div>
                            <div className="text-sm text-muted-foreground">On Time</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{evaluationMetrics.submission_stats.late}</div>
                            <div className="text-sm text-muted-foreground">Late</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{evaluationMetrics.submission_stats.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Internship Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {internshipStatus && (
                        <div className="space-y-4">
                          {internshipStatus.statuses.map((status) => (
                            <div key={status.status}>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-foreground capitalize">{status.status}</span>
                                <span className="text-sm font-bold text-primary">{status.count} ({status.percentage}%)</span>
                              </div>
                              <Progress value={status.percentage} className="h-2" />
                            </div>
                          ))}
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-foreground">Overall Completion Rate</span>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">{internshipStatus.avg_completion_rate}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>


              </Tabs>
            </div>
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
                <BarChart className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Export Button - Mobile */}
            <Select onValueChange={(value) => handleExport(value as 'csv' | 'json' | 'pdf')} disabled={exporting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={exporting ? 'Exporting...' : 'Export Report'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export as CSV</SelectItem>
                <SelectItem value="json">Export as JSON</SelectItem>
                <SelectItem value="pdf">Export as PDF</SelectItem>
              </SelectContent>
            </Select>

            {/* Platform Overview - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{overview?.total_users || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{overview?.active_internships || 0}</div>
                  <div className="text-xs text-muted-foreground">Internships</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <BarChart className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{overview?.total_evaluations || 0}</div>
                  <div className="text-xs text-muted-foreground">Evaluations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{overview?.completion_rate || 0}%</div>
                  <div className="text-xs text-muted-foreground">Completion</div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
                <TabsTrigger value="evaluations" className="text-xs">Evaluations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Monthly Statistics</h2>
                {monthlyStats.map((data) => (
                  <Card key={data.month}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-foreground">{data.month}</div>
                        <Badge variant="outline">{data.users} users</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Internships</div>
                          <div className="text-lg font-bold text-foreground">{data.internships}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Evaluations</div>
                          <div className="text-lg font-bold text-foreground">{data.evaluations}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="growth" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">User Growth (12 Months)</h2>
                {userGrowth.map((data) => (
                  <Card key={data.period}>
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground mb-3">{data.period}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Students</div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.students}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Advisors</div>
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.advisors}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Supervisors</div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">{data.supervisors}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Admins</div>
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.admins}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="evaluations" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Evaluation Metrics</h2>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {evaluationMetrics && (
                      <>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Overall Rating</span>
                            <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.overall.toFixed(2)}/10</span>
                          </div>
                          <Progress value={(evaluationMetrics.avg_ratings.overall / 10) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Technical Skills</span>
                            <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.technical.toFixed(2)}/10</span>
                          </div>
                          <Progress value={(evaluationMetrics.avg_ratings.technical / 10) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Communication</span>
                            <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.communication.toFixed(2)}/10</span>
                          </div>
                          <Progress value={(evaluationMetrics.avg_ratings.communication / 10) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Work Ethic</span>
                            <span className="text-sm font-bold text-primary">{evaluationMetrics.avg_ratings.work_ethic.toFixed(2)}/10</span>
                          </div>
                          <Progress value={(evaluationMetrics.avg_ratings.work_ethic / 10) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Quality Score</span>
                            <span className="text-sm font-bold text-primary">{evaluationMetrics.quality_score.toFixed(2)}%</span>
                          </div>
                          <Progress value={evaluationMetrics.quality_score} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
