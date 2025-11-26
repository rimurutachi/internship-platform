'use client';

import { useState, useEffect } from 'react';
import { Server, Database, Zap, AlertTriangle, CheckCircle, Activity, HardDrive, Cpu, Shield, Loader, RefreshCw, Power, Settings } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminSystemAPI } from '@/lib/api/admin-system';
import type { SystemMetrics, SystemEvent, ServiceStatus } from '@/types/system';

export default function SystemPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [serviceLogs, setServiceLogs] = useState<SystemEvent[]>([]);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch metrics on mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await adminSystemAPI.getMetrics();

        if (response.success) {
          setMetrics(response.data);
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load system metrics',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await adminSystemAPI.getEvents({
          limit: 20,
          severity: eventFilter === 'all' ? undefined : eventFilter
        });

        if (response.success) {
          setEvents(response.events);
        }
      } catch (error: any) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();

    // Auto-refresh events every 15 seconds (more frequent than metrics)
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [eventFilter]);

  const handleAcknowledgeEvent = async (eventId: string) => {
    try {
      const response = await adminSystemAPI.acknowledgeEvent(eventId, true);

      if (response.success) {
        setEvents(events.map(e => e.id === eventId ? response.event : e));
        toast({ title: 'Success', description: 'Event acknowledged' });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to acknowledge event',
        variant: 'destructive'
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'border-l-success bg-success/5';
      case 'warning': return 'border-l-warning bg-warning/5';
      case 'critical': return 'border-l-error bg-error/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  const getHealthTextColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success/10 text-success dark:bg-success/20';
      case 'stopped': return 'bg-error/10 text-error dark:bg-error/20';
      case 'warning': return 'bg-warning/10 text-warning dark:bg-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <Activity className="w-4 h-4 text-primary" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-error" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-error" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const getEventBorderColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'border-l-primary';
      case 'warning': return 'border-l-warning';
      case 'error': return 'border-l-error';
      case 'critical': return 'border-l-error';
      default: return 'border-l-primary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-primary/10 text-primary dark:bg-primary/20';
      case 'warning': return 'bg-warning/10 text-warning dark:bg-warning/20';
      case 'error': return 'bg-error/10 text-error dark:bg-error/20';
      case 'critical': return 'bg-error/10 text-error dark:bg-error/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleManageService = (service: ServiceStatus) => {
    setSelectedService(service);
    setIsServiceDialogOpen(true);
  };

  const handleServiceAction = async (action: 'restart' | 'view_logs' | 'clear_cache') => {
    if (!selectedService) return;

    setIsPerformingAction(true);
    try {
      switch (action) {
        case 'restart':
          const restartResponse = await adminSystemAPI.restartService(selectedService.name);
          toast({
            title: 'Service Restart',
            description: `${selectedService.name} restart initiated. Check Recent Events for status.`,
          });
          // Refresh metrics and events after restart
          setTimeout(async () => {
            const [metricsResponse, eventsResponse] = await Promise.all([
              adminSystemAPI.getMetrics(),
              adminSystemAPI.getEvents({ 
                limit: 20,
                severity: eventFilter === 'all' ? undefined : eventFilter
              })
            ]);
            if (metricsResponse.success) {
              setMetrics(metricsResponse.data);
            }
            if (eventsResponse.success) {
              setEvents(eventsResponse.events);
            }
          }, 1000);
          break;
        case 'view_logs':
          // Fetch logs for this service
          const logsResponse = await adminSystemAPI.getServiceLogs(selectedService.name, { limit: 50 });
          if (logsResponse.success) {
            setServiceLogs(logsResponse.logs);
            setIsServiceDialogOpen(false);
            setIsLogsDialogOpen(true);
          }
          break;
        case 'clear_cache':
          await adminSystemAPI.performMaintenance('clear_cache');
          toast({
            title: 'Cache Cleared',
            description: 'System cache cleared successfully. Check Recent Events for details.',
          });
          // Refresh events to show the cache clear event
          setTimeout(async () => {
            const eventsResponse = await adminSystemAPI.getEvents({ 
              limit: 20,
              severity: eventFilter === 'all' ? undefined : eventFilter
            });
            if (eventsResponse.success) {
              setEvents(eventsResponse.events);
            }
          }, 1000);
          break;
      }
      setIsServiceDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-error" />
          <p className="text-foreground font-semibold mt-4">Unable to load system metrics</p>
          <p className="text-muted-foreground text-sm mt-2">Please try again later</p>
        </div>
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
              <div>
                <h1 className="text-3xl font-bold text-foreground">System Management</h1>
                <p className="text-muted-foreground mt-1">Monitor system health and performance</p>
              </div>

              {/* System Health */}
              <Card className={`border-l-4 ${getHealthColor(metrics.overallHealth)}`}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className={`w-5 h-5 ${getHealthTextColor(metrics.overallHealth)}`} />
                        <span className="text-sm font-semibold text-muted-foreground">System Status</span>
                      </div>
                      <div className={`text-2xl font-bold ${getHealthTextColor(metrics.overallHealth)}`}>
                        {metrics.overallHealth.charAt(0).toUpperCase() + metrics.overallHealth.slice(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Uptime</div>
                      <div className="text-2xl font-bold text-foreground">{metrics.uptime}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Response Time</div>
                      <div className="text-2xl font-bold text-foreground">{metrics.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">Error Rate</div>
                      <div className="text-2xl font-bold text-foreground">{metrics.errorRate}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Users</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{metrics.totalUsers.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Active Sessions</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{metrics.activeSessions}</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">API Calls (24h)</div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {metrics.apiCallsLast24h >= 1000 
                        ? `${(metrics.apiCallsLast24h / 1000).toFixed(1)}K` 
                        : metrics.apiCallsLast24h.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Storage Used</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{metrics.storageUsedGB} GB</div>
                  </CardContent>
                </Card>
              </div>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4 flex-1">
                        <Server className="w-8 h-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{service.name}</span>
                            <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Uptime: {service.uptime} days</div>
                        </div>
                      </div>
                      <div className="hidden md:flex gap-8">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Memory</span>
                          </div>
                          <Progress value={service.memoryUsage} className="w-24 h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{service.memoryUsage}%</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Cpu className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">CPU</span>
                          </div>
                          <Progress value={service.cpuUsage} className="w-24 h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{service.cpuUsage}%</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleManageService(service)}
                      >
                        Manage
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent System Events</CardTitle>
                    <div className="space-x-2">
                      <Button
                        variant={eventFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEventFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={eventFilter === 'critical' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEventFilter('critical')}
                      >
                        Critical
                      </Button>
                      <Button
                        variant={eventFilter === 'warning' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEventFilter('warning')}
                      >
                        Warnings
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No events</p>
                    ) : (
                      events.map((event) => (
                        <div key={event.id} className={`flex items-start justify-between p-3 border border-border rounded-lg border-l-2 ${getEventBorderColor(event.severity)}`}>
                          <div className="flex items-start gap-3 flex-1">
                            {getEventIcon(event.severity)}
                            <div className="flex-1">
                              <div className="text-sm text-foreground">{event.message}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(event.created_at)}
                              </div>
                            </div>
                          </div>
                          {!event.resolved_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledgeEvent(event.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      ))
                    )}
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
            <Card className={`border-l-4 ${getHealthColor(metrics.overallHealth)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className={`w-5 h-5 ${getHealthTextColor(metrics.overallHealth)}`} />
                  <span className="text-sm font-semibold text-muted-foreground">System Status</span>
                </div>
                <div className={`text-2xl font-bold ${getHealthTextColor(metrics.overallHealth)} mb-4`}>
                  {metrics.overallHealth.charAt(0).toUpperCase() + metrics.overallHealth.slice(1)}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <div className="text-lg font-bold text-foreground">{metrics.uptime}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Response</div>
                    <div className="text-lg font-bold text-foreground">{metrics.responseTime}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                    <div className="text-lg font-bold text-foreground">{metrics.errorRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Total Users</div>
                  <div className="text-xl font-bold text-foreground mt-1">{metrics.totalUsers.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Active Sessions</div>
                  <div className="text-xl font-bold text-foreground mt-1">{metrics.activeSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">API Calls (24h)</div>
                  <div className="text-xl font-bold text-foreground mt-1">
                    {metrics.apiCallsLast24h >= 1000 
                      ? `${(metrics.apiCallsLast24h / 1000).toFixed(1)}K` 
                      : metrics.apiCallsLast24h}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Storage Used</div>
                  <div className="text-xl font-bold text-foreground mt-1">{metrics.storageUsedGB} GB</div>
                </CardContent>
              </Card>
            </div>

            {/* Services - Mobile Cards */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Services</h2>
              <div className="space-y-3">
                {metrics.services.map((service) => (
                  <Card key={service.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Server className="w-6 h-6 text-muted-foreground" />
                          <div>
                            <div className="font-semibold text-foreground text-sm">{service.name}</div>
                            <div className="text-xs text-muted-foreground">Uptime: {service.uptime} days</div>
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
                            <span className="text-xs text-muted-foreground">{service.memoryUsage}%</span>
                          </div>
                          <Progress value={service.memoryUsage} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">CPU</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{service.cpuUsage}%</span>
                          </div>
                          <Progress value={service.cpuUsage} className="h-1.5" />
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => handleManageService(service)}
                      >
                        Manage
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Events - Mobile */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-foreground">Recent Events</h2>
                <div className="space-x-2">
                  <Button
                    variant={eventFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={eventFilter === 'critical' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventFilter('critical')}
                  >
                    Critical
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No events</p>
                ) : (
                  events.map((event) => (
                    <Card key={event.id} className={`border-l-2 ${getEventBorderColor(event.severity)}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {getEventIcon(event.severity)}
                          <div className="flex-1">
                            <div className="text-xs text-foreground">{event.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">{formatTimeAgo(event.created_at)}</div>
                          </div>
                          {!event.resolved_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledgeEvent(event.id)}
                            >
                              Ack
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>

      {/* Service Management Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {selectedService?.name}</DialogTitle>
            <DialogDescription>
              Choose an action to perform on this service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleServiceAction('view_logs')}
                disabled={isPerformingAction}
              >
                <Activity className="w-4 h-4 mr-2" />
                View Logs
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleServiceAction('clear_cache')}
                disabled={isPerformingAction}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                className="justify-start text-warning"
                onClick={() => handleServiceAction('restart')}
                disabled={isPerformingAction || selectedService?.status === 'stopped'}
              >
                <Power className="w-4 h-4 mr-2" />
                Restart Service
              </Button>
            </div>
            {selectedService && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Service Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedService.status)}>
                      {selectedService.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>{selectedService.uptime} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory Usage:</span>
                    <span>{selectedService.memoryUsage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPU Usage:</span>
                    <span>{selectedService.cpuUsage}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsServiceDialogOpen(false)}
              disabled={isPerformingAction}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Service Logs - {selectedService?.name}</DialogTitle>
            <DialogDescription>
              Recent log entries for this service
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {serviceLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found for this service
              </div>
            ) : (
              serviceLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 bg-card ${getEventBorderColor(log.severity)}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {log.count > 1 && (
                        <Badge variant="outline" className="text-xs">
                          x{log.count}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.type}
                    </Badge>
                  </div>
                  <p className="text-sm">{log.message}</p>
                  {log.error_code && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Error Code: {log.error_code}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLogsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
