'use client';

import { Server, Database, Zap, AlertTriangle, CheckCircle, Activity, HardDrive, Cpu, Shield } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function SystemPage() {
  const systemHealth = {
    status: 'healthy',
    uptime: '99.98%',
    responseTime: '45ms',
    errorRate: '0.02%'
  };

  const services = [
    { name: 'API Server', status: 'running', uptime: '15 days', memory: 45, cpu: 23 },
    { name: 'Database', status: 'running', uptime: '30 days', memory: 67, cpu: 12 },
    { name: 'AI Service', status: 'running', uptime: '7 days', memory: 82, cpu: 45 },
    { name: 'Socket Server', status: 'running', uptime: '15 days', memory: 34, cpu: 8 }
  ];

  const metrics = [
    { label: 'Total Users', value: '1,234', change: '+12%', trend: 'up' },
    { label: 'Active Sessions', value: '89', change: '+5%', trend: 'up' },
    { label: 'API Calls (24h)', value: '45.2K', change: '+8%', trend: 'up' },
    { label: 'Storage Used', value: '145 GB', change: '+3%', trend: 'up' }
  ];

  const recentEvents = [
    { id: 1, type: 'info', message: 'System backup completed successfully', time: '5 mins ago' },
    { id: 2, type: 'warning', message: 'High CPU usage detected on AI Service', time: '1 hour ago' },
    { id: 3, type: 'success', message: 'Database optimization completed', time: '3 hours ago' },
    { id: 4, type: 'info', message: 'New user registration: alice.j@university.edu', time: '5 hours ago' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success/10 text-success dark:bg-success/20';
      case 'stopped': return 'bg-error/10 text-error dark:bg-error/20';
      case 'warning': return 'bg-warning/10 text-warning dark:bg-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-error" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const getEventBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-success';
      case 'warning': return 'border-l-warning';
      case 'error': return 'border-l-error';
      default: return 'border-l-primary';
    }
  };

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
              <div>
                <h1 className="text-3xl font-bold text-foreground">System Management</h1>
                <p className="text-muted-foreground mt-1">Monitor system health and performance</p>
              </div>

              {/* System Health */}
              <Card className="border-l-4 border-l-success">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="text-sm font-semibold text-muted-foreground">System Status</span>
                      </div>
                      <div className="text-2xl font-bold text-success">Healthy</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Uptime</div>
                      <div className="text-2xl font-bold text-foreground">{systemHealth.uptime}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Response Time</div>
                      <div className="text-2xl font-bold text-foreground">{systemHealth.responseTime}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Error Rate</div>
                      <div className="text-2xl font-bold text-foreground">{systemHealth.errorRate}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                  <Card key={metric.label} className="hover:shadow-card transition-shadow">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">{metric.label}</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{metric.value}</div>
                      <div className={`text-sm mt-2 ${metric.trend === 'up' ? 'text-success' : 'text-error'}`}>
                        {metric.change} from last week
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4 flex-1">
                        <Server className="w-8 h-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{service.name}</span>
                            <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Uptime: {service.uptime}</div>
                        </div>
                      </div>
                      <div className="hidden md:flex gap-8">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Memory</span>
                          </div>
                          <Progress value={service.memory} className="w-24 h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{service.memory}%</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Cpu className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">CPU</span>
                          </div>
                          <Progress value={service.cpu} className="w-24 h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{service.cpu}%</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent System Events</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentEvents.map((event) => (
                      <div key={event.id} className={`flex items-start gap-3 p-3 border border-border rounded-lg border-l-2 ${getEventBorderColor(event.type)}`}>
                        {getEventIcon(event.type)}
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{event.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">{event.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <MobileHeader 
            title="System"
            subtitle="System Management"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* System Health - Mobile */}
            <Card className="border-l-4 border-l-success">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-semibold text-muted-foreground">System Status</span>
                </div>
                <div className="text-2xl font-bold text-success mb-4">Healthy</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <div className="text-lg font-bold text-foreground">{systemHealth.uptime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Response</div>
                    <div className="text-lg font-bold text-foreground">{systemHealth.responseTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                    <div className="text-lg font-bold text-foreground">{systemHealth.errorRate}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <Card key={metric.label}>
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                    <div className="text-xl font-bold text-foreground mt-1">{metric.value}</div>
                    <div className={`text-xs mt-1 ${metric.trend === 'up' ? 'text-success' : 'text-error'}`}>
                      {metric.change}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Services - Mobile Cards */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Services</h2>
              <div className="space-y-3">
                {services.map((service) => (
                  <Card key={service.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Server className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <div className="font-semibold text-foreground text-sm">{service.name}</div>
                            <div className="text-xs text-muted-foreground">Uptime: {service.uptime}</div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(service.status)} style={{ fontSize: '0.7rem' }}>
                          {service.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Memory</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{service.memory}%</span>
                          </div>
                          <Progress value={service.memory} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">CPU</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{service.cpu}%</span>
                          </div>
                          <Progress value={service.cpu} className="h-1.5" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">Manage</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Events - Mobile */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-foreground">Recent Events</h2>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <Card key={event.id} className={`border-l-2 ${getEventBorderColor(event.type)}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {getEventIcon(event.type)}
                        <div className="flex-1">
                          <div className="text-xs text-foreground">{event.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">{event.time}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
