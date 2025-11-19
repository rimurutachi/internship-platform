'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Key, Globe, FileText, Server } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'failed';
  ipAddress: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    user: 'alice.j@university.edu',
    action: 'login',
    resource: 'auth',
    timestamp: '2025-11-18 09:30 AM',
    status: 'success',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    user: 'admin@platform.com',
    action: 'user_deleted',
    resource: 'users',
    timestamp: '2025-11-18 08:45 AM',
    status: 'success',
    ipAddress: '203.0.113.45'
  },
  {
    id: '3',
    user: 'john.doe@techcorp.com',
    action: 'evaluation_submitted',
    resource: 'evaluations',
    timestamp: '2025-11-18 07:20 AM',
    status: 'success',
    ipAddress: '198.51.100.12'
  },
  {
    id: '4',
    user: 'bob.m@university.edu',
    action: 'login_failed',
    resource: 'auth',
    timestamp: '2025-11-17 11:15 PM',
    status: 'failed',
    ipAddress: '192.0.2.1'
  },
  {
    id: '5',
    user: 'jane.smith@university.edu',
    action: 'password_changed',
    resource: 'auth',
    timestamp: '2025-11-17 10:00 PM',
    status: 'success',
    ipAddress: '192.168.1.150'
  }
];

const securityThreats = [
  {
    id: 1,
    type: 'Multiple Failed Logins',
    severity: 'medium',
    details: '5 failed login attempts from IP 192.0.2.1',
    timestamp: '2 hours ago',
    status: 'investigating'
  },
  {
    id: 2,
    type: 'Unusual Activity',
    severity: 'low',
    details: 'Large file download from user account',
    timestamp: '4 hours ago',
    status: 'resolved'
  }
];

export default function SecurityPage() {
  const [showIPs, setShowIPs] = useState(false);
  const [activeTab, setActiveTab] = useState('audit');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success dark:bg-success/20';
      case 'failed': return 'bg-error/10 text-error dark:bg-error/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-error/10 text-error dark:bg-error/20';
      case 'medium': return 'bg-warning/10 text-warning dark:bg-warning/20';
      case 'low': return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
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
                <h1 className="text-3xl font-bold text-foreground">Security Management</h1>
                <p className="text-muted-foreground mt-1">Monitor security and audit logs</p>
              </div>

              {/* Security Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Shield className="w-8 h-8 text-success" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">Secure</div>
                        <div className="text-sm text-muted-foreground">Overall Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">256-bit</div>
                        <div className="text-sm text-muted-foreground">Encryption</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Globe className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">HTTPS</div>
                        <div className="text-sm text-muted-foreground">All Traffic</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-warning" />
                      <div>
                        <div className="text-2xl font-bold text-foreground">{securityThreats.length}</div>
                        <div className="text-sm text-muted-foreground">Active Alerts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-muted">
                  <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                  <TabsTrigger value="threats">Security Alerts</TabsTrigger>
                  <TabsTrigger value="settings">Security Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="audit" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Audit Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Resource</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Timestamp</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockAuditLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="font-medium text-foreground">{log.user}</TableCell>
                                <TableCell className="text-muted-foreground">{log.action}</TableCell>
                                <TableCell className="text-muted-foreground">{log.resource}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(log.status)}>
                                    {log.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {showIPs ? log.ipAddress : '***.***.***.*'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{log.timestamp}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="threats" className="space-y-4">
                  {securityThreats.map((threat) => (
                    <Card key={threat.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <AlertTriangle className="w-6 h-6 text-warning mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{threat.type}</h3>
                              <p className="text-muted-foreground mt-1">{threat.details}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getSeverityColor(threat.severity)}>
                                  {threat.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{threat.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-warning/10 text-warning dark:bg-warning/20">{threat.status}</Badge>
                            <Button variant="outline" size="sm">Investigate</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground mt-1">Require 2FA for all admin accounts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">IP Whitelist</Label>
                          <p className="text-sm text-muted-foreground mt-1">Restrict admin access to specific IPs</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Session Timeout</Label>
                          <p className="text-sm text-muted-foreground mt-1">Auto-logout after 30 minutes of inactivity</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">API Key Rotation</Label>
                          <p className="text-sm text-muted-foreground mt-1">Rotate API keys every 90 days</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Show IP Addresses in Audit Logs</Label>
                          <p className="text-sm text-muted-foreground mt-1">Display full IP addresses (currently {showIPs ? 'shown' : 'hidden'})</p>
                        </div>
                        <Switch checked={showIPs} onCheckedChange={setShowIPs} />
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">Save Security Settings</Button>
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
            title="Security"
            subtitle="Security Management"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Security Summary - Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-6 h-6 text-success" />
                    <div className="text-lg font-bold text-foreground">Secure</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Overall Status</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div className="text-lg font-bold text-foreground">256-bit</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Encryption</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <div className="text-lg font-bold text-foreground">HTTPS</div>
                  </div>
                  <div className="text-xs text-muted-foreground">All Traffic</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-6 h-6 text-warning" />
                    <div className="text-lg font-bold text-foreground">{securityThreats.length}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Active Alerts</div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted">
                <TabsTrigger value="audit" className="text-xs">Logs</TabsTrigger>
                <TabsTrigger value="threats" className="text-xs">Alerts</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="audit" className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-foreground">Audit Logs</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowIPs(!showIPs)}
                  >
                    {showIPs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {mockAuditLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground text-sm">{log.user}</div>
                            <div className="text-xs text-muted-foreground mt-1">{log.action} • {log.resource}</div>
                          </div>
                          <Badge className={getStatusColor(log.status)} style={{ fontSize: '0.7rem' }}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono">
                            {showIPs ? log.ipAddress : '***.***.***.*'}
                          </span>
                          <span className="text-muted-foreground">{log.timestamp}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="threats" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground mb-2">Security Alerts</h2>
                {securityThreats.map((threat) => (
                  <Card key={threat.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-sm">{threat.type}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{threat.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge className={getSeverityColor(threat.severity)} style={{ fontSize: '0.7rem' }}>
                              {threat.severity}
                            </Badge>
                            <Badge className="bg-warning/10 text-warning dark:bg-warning/20" style={{ fontSize: '0.7rem' }}>
                              {threat.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{threat.timestamp}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">Investigate</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">Two-Factor Authentication</Label>
                        <p className="text-xs text-muted-foreground mt-1">Require 2FA for all admin accounts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">IP Whitelist</Label>
                        <p className="text-xs text-muted-foreground mt-1">Restrict admin access to specific IPs</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">Session Timeout</Label>
                        <p className="text-xs text-muted-foreground mt-1">Auto-logout after 30 minutes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">API Key Rotation</Label>
                        <p className="text-xs text-muted-foreground mt-1">Rotate API keys every 90 days</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">Show IP Addresses</Label>
                        <p className="text-xs text-muted-foreground mt-1">Currently {showIPs ? 'shown' : 'hidden'}</p>
                      </div>
                      <Switch checked={showIPs} onCheckedChange={setShowIPs} />
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90">Save Settings</Button>
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
