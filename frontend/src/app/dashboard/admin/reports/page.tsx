'use client';

import { useState } from 'react';
import { BarChart, TrendingUp, Users, FileText, Calendar, Download, Filter, Shield } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const platformStats = {
    totalUsers: 1234,
    totalInternships: 156,
    totalEvaluations: 892,
    completionRate: 87.5
  };

  const monthlyData = [
    { month: 'Jan', users: 234, internships: 12, evaluations: 45 },
    { month: 'Feb', users: 289, internships: 15, evaluations: 58 },
    { month: 'Mar', users: 345, internships: 18, evaluations: 72 },
    { month: 'Apr', users: 412, internships: 22, evaluations: 89 },
    { month: 'May', users: 498, internships: 28, evaluations: 105 },
    { month: 'Jun', users: 567, internships: 32, evaluations: 128 },
  ];

  const userGrowth = [
    { period: 'Week 1', students: 145, advisors: 32, supervisors: 8 },
    { period: 'Week 2', students: 178, advisors: 38, supervisors: 12 },
    { period: 'Week 3', students: 212, advisors: 42, supervisors: 15 },
    { period: 'Week 4', students: 267, advisors: 48, supervisors: 18 }
  ];

  const evaluationMetrics = [
    { name: 'Average Score', value: 4.2, max: 5.0 },
    { name: 'On-time Submission', value: 92, max: 100 },
    { name: 'Completion Rate', value: 87.5, max: 100 },
    { name: 'Quality Score', value: 89, max: 100 }
  ];

  const departmentStats = [
    { name: 'Engineering', interns: 45, companies: 12, completion: 89 },
    { name: 'Data Science', interns: 28, companies: 8, completion: 85 },
    { name: 'Design', interns: 22, companies: 6, completion: 91 },
    { name: 'Product', interns: 15, companies: 4, completion: 87 },
    { name: 'Marketing', interns: 12, companies: 3, completion: 83 }
  ];

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
                <Button className="bg-primary hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>

              {/* Platform Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{platformStats.totalUsers}</div>
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
                        <div className="text-2xl font-bold text-foreground">{platformStats.totalInternships}</div>
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
                        <div className="text-2xl font-bold text-foreground">{platformStats.totalEvaluations}</div>
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
                        <div className="text-2xl font-bold text-foreground">{platformStats.completionRate}%</div>
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 bg-muted">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="growth">User Growth</TabsTrigger>
                  <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                  <TabsTrigger value="departments">By Department</TabsTrigger>
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
                            {monthlyData.map((data) => (
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
                      <CardTitle>User Growth by Role (Last 4 Weeks)</CardTitle>
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
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userGrowth.map((data) => (
                              <TableRow key={data.period}>
                                <TableCell className="font-medium text-foreground">{data.period}</TableCell>
                                <TableCell className="text-muted-foreground">{data.students}</TableCell>
                                <TableCell className="text-muted-foreground">{data.advisors}</TableCell>
                                <TableCell className="text-muted-foreground">{data.supervisors}</TableCell>
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
                      <CardTitle>Evaluation Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {evaluationMetrics.map((metric) => (
                        <div key={metric.name}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">{metric.name}</span>
                            <span className="text-sm font-bold text-primary">{metric.value}{metric.max !== 100 ? '/5' : '%'}</span>
                          </div>
                          <Progress value={(metric.value / metric.max) * 100} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="departments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Department</TableHead>
                              <TableHead>Interns</TableHead>
                              <TableHead>Companies</TableHead>
                              <TableHead>Completion Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {departmentStats.map((dept) => (
                              <TableRow key={dept.name}>
                                <TableCell className="font-medium text-foreground">{dept.name}</TableCell>
                                <TableCell className="text-muted-foreground">{dept.interns}</TableCell>
                                <TableCell className="text-muted-foreground">{dept.companies}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={dept.completion} className="w-24 h-2" />
                                    <span className="text-sm font-medium text-foreground">{dept.completion}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>

            {/* Platform Overview - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{platformStats.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{platformStats.totalInternships}</div>
                  <div className="text-xs text-muted-foreground">Internships</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <BarChart className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{platformStats.totalEvaluations}</div>
                  <div className="text-xs text-muted-foreground">Evaluations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="text-xl font-bold text-foreground">{platformStats.completionRate}%</div>
                  <div className="text-xs text-muted-foreground">Completion</div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="evaluations" className="text-xs">Evaluations</TabsTrigger>
                <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Monthly Statistics</h2>
                {monthlyData.map((data) => (
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
                <h2 className="text-lg font-bold text-foreground">User Growth (4 Weeks)</h2>
                {userGrowth.map((data) => (
                  <Card key={data.period}>
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground mb-3">{data.period}</div>
                      <div className="grid grid-cols-3 gap-3">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="evaluations" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">Evaluation Metrics</h2>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {evaluationMetrics.map((metric) => (
                      <div key={metric.name}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{metric.name}</span>
                          <span className="text-sm font-bold text-primary">{metric.value}{metric.max !== 100 ? '/5' : '%'}</span>
                        </div>
                        <Progress value={(metric.value / metric.max) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="departments" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground">By Department</h2>
                {departmentStats.map((dept) => (
                  <Card key={dept.name}>
                    <CardContent className="p-4">
                      <div className="font-semibold text-foreground mb-3">{dept.name}</div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Interns</div>
                          <div className="text-lg font-bold text-foreground">{dept.interns}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Companies</div>
                          <div className="text-lg font-bold text-foreground">{dept.companies}</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Completion Rate</span>
                          <span className="text-xs font-bold text-foreground">{dept.completion}%</span>
                        </div>
                        <Progress value={dept.completion} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
