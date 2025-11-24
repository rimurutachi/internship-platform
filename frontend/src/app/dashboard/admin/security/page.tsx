'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { adminSecurityAPI } from '@/lib/api/admin-security';
import { AuditLog, SecurityAlert, SecuritySettings, SecurityHealth } from '@/types/security';
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

// ...existing code...

export default function SecurityPage() {
  // State declarations
  const [showIPs, setShowIPs] = useState(false);
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [health, setHealth] = useState<SecurityHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Helper functions
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

  // Fetch all data
  const fetchAll = useCallback(() => {
    setAuditLoading(true);
    setAlertsLoading(true);
    setSettingsLoading(true);
    setHealthLoading(true);
    adminSecurityAPI.getAuditLogs({ page: 1, limit: 20 })
      .then(data => setAuditLogs(data.logs))
      .catch(e => { setAuditError('Failed to load audit logs'); toast.error('Failed to load audit logs'); })
      .finally(() => setAuditLoading(false));
    adminSecurityAPI.getAlerts({ page: 1, limit: 20 })
      .then(data => setAlerts(data.alerts))
      .catch(e => { setAlertsError('Failed to load alerts'); toast.error('Failed to load alerts'); })
      .finally(() => setAlertsLoading(false));
    adminSecurityAPI.getSettings()
      .then(data => setSettings(data))
      .catch(e => { setSettingsError('Failed to load settings'); toast.error('Failed to load settings'); })
      .finally(() => setSettingsLoading(false));
    adminSecurityAPI.getHealthStatus()
      .then(data => setHealth(data))
      .catch(e => { setHealthError('Failed to load health status'); toast.error('Failed to load health status'); })
      .finally(() => setHealthLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
    if (refreshInterval) clearInterval(refreshInterval);
    const interval = setInterval(fetchAll, 60000);
    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const updated = await adminSecurityAPI.updateSettings(settings);
      setSettings(updated);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Export audit logs
  const handleExportAuditLogs = async () => {
    try {
      const blob = await adminSecurityAPI.exportAuditLogs({}, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_logs.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    } catch (e) {
      toast.error('Failed to export audit logs');
    }
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await adminSecurityAPI.acknowledgeAlert(alertId, 'Acknowledged by admin');
      toast.success('Alert acknowledged');
      fetchAll();
    } catch (e) {
      toast.error('Failed to acknowledge alert');
    }
  };

  // Settings toggles
  const handleSettingChange = (key: keyof SecuritySettings, value: boolean | number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
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
                        <div className="text-2xl font-bold text-foreground">{healthLoading ? '...' : health?.status ?? '-'}</div>
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
                        <div className="text-2xl font-bold text-foreground">{healthLoading ? '...' : health?.encryption ? '256-bit' : 'None'}</div>
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
                        <div className="text-2xl font-bold text-foreground">{healthLoading ? '...' : health?.tls ? 'HTTPS' : 'None'}</div>
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
                        <div className="text-2xl font-bold text-foreground">{healthLoading ? '...' : health?.active_alerts ?? '-'}</div>
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
                      <div className="flex items-center justify-between">
                        <CardTitle>Audit Logs</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleExportAuditLogs}>Export CSV</Button>
                      </div>
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
                            {auditLoading ? (
                              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                            ) : auditError ? (
                              <TableRow><TableCell colSpan={6} className="text-error">{auditError}</TableCell></TableRow>
                            ) : auditLogs.length === 0 ? (
                              <TableRow><TableCell colSpan={6}>No logs found</TableCell></TableRow>
                            ) : (
                              auditLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell className="font-medium text-foreground">{log.user_email ?? log.user_id}</TableCell>
                                  <TableCell className="text-muted-foreground">{log.action}</TableCell>
                                  <TableCell className="text-muted-foreground">{log.resource}</TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(log.status)}>
                                      {log.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {showIPs ? log.ip_address : '***.***.***.*'}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">{log.created_at}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="threats" className="space-y-4">
                  {alertsLoading ? (
                    <Card><CardContent>Loading...</CardContent></Card>
                  ) : alertsError ? (
                    <Card><CardContent className="text-error">{alertsError}</CardContent></Card>
                  ) : alerts.length === 0 ? (
                    <Card><CardContent>No alerts found</CardContent></Card>
                  ) : (
                    alerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <AlertTriangle className="w-6 h-6 text-warning mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{alert.alert_type}</h3>
                                <p className="text-muted-foreground mt-1">{alert.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                                  <span className="text-xs text-muted-foreground">{alert.created_at}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={alert.is_acknowledged ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                                {alert.is_acknowledged ? 'acknowledged' : 'active'}
                              </Badge>
                              {!alert.is_acknowledged && (
                                <Button variant="outline" size="sm" onClick={() => handleAcknowledgeAlert(alert.id)}>Acknowledge</Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {settingsLoading ? (
                        <div>Loading...</div>
                      ) : settingsError ? (
                        <div className="text-error">{settingsError}</div>
                      ) : settings ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Two-Factor Authentication</Label>
                              <p className="text-sm text-muted-foreground mt-1">Require 2FA for all admin accounts</p>
                            </div>
                            <Switch checked={settings.twofa_required} onCheckedChange={v => handleSettingChange('twofa_required', v)} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">IP Whitelist</Label>
                              <p className="text-sm text-muted-foreground mt-1">Restrict admin access to specific IPs</p>
                            </div>
                            <Switch checked={settings.ip_whitelist_enabled} onCheckedChange={v => handleSettingChange('ip_whitelist_enabled', v)} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Session Timeout</Label>
                              <p className="text-sm text-muted-foreground mt-1">Auto-logout after {settings.session_timeout_minutes} minutes of inactivity</p>
                            </div>
                            <Switch checked={!!settings.session_timeout_minutes} onCheckedChange={v => handleSettingChange('session_timeout_minutes', v ? 30 : 0)} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">API Key Rotation</Label>
                              <p className="text-sm text-muted-foreground mt-1">Rotate API keys every {settings.api_key_rotation_days} days</p>
                            </div>
                            <Switch checked={!!settings.api_key_rotation_days} onCheckedChange={v => handleSettingChange('api_key_rotation_days', v ? 90 : 0)} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Show IP Addresses in Audit Logs</Label>
                              <p className="text-sm text-muted-foreground mt-1">Display full IP addresses (currently {settings.show_ip_in_logs ? 'shown' : 'hidden'})</p>
                            </div>
                            <Switch checked={settings.show_ip_in_logs} onCheckedChange={v => handleSettingChange('show_ip_in_logs', v)} />
                          </div>
                          <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveSettings} disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Security Settings'}</Button>
                        </>
                      ) : null}
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
                    <div className="text-lg font-bold text-foreground">{healthLoading ? '...' : health?.active_alerts ?? '-'}</div>
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
                {auditLoading ? (
                  <Card><CardContent className="p-4">Loading...</CardContent></Card>
                ) : auditError ? (
                  <Card><CardContent className="p-4 text-error">{auditError}</CardContent></Card>
                ) : auditLogs.length === 0 ? (
                  <Card><CardContent className="p-4">No logs found</CardContent></Card>
                ) : (
                  auditLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-foreground text-sm">{log.user_email ?? log.user_id}</div>
                              <div className="text-xs text-muted-foreground mt-1">{log.action} • {log.resource}</div>
                            </div>
                            <Badge className={getStatusColor(log.status)} style={{ fontSize: '0.7rem' }}>
                              {log.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-mono">
                              {showIPs ? log.ip_address : '***.***.***.*'}
                            </span>
                            <span className="text-muted-foreground">{log.created_at}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="threats" className="space-y-3">
                <h2 className="text-lg font-bold text-foreground mb-2">Security Alerts</h2>
                {alertsLoading ? (
                  <Card><CardContent className="p-4">Loading...</CardContent></Card>
                ) : alertsError ? (
                  <Card><CardContent className="p-4 text-error">{alertsError}</CardContent></Card>
                ) : alerts.length === 0 ? (
                  <Card><CardContent className="p-4">No alerts found</CardContent></Card>
                ) : (
                  alerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-sm">{alert.alert_type}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge className={getSeverityColor(alert.severity)} style={{ fontSize: '0.7rem' }}>
                                {alert.severity}
                              </Badge>
                              <Badge className={alert.is_acknowledged ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'} style={{ fontSize: '0.7rem' }}>
                                {alert.is_acknowledged ? 'acknowledged' : 'active'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{alert.created_at}</span>
                          </div>
                          {!alert.is_acknowledged && (
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleAcknowledgeAlert(alert.id)}>Acknowledge</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingsLoading ? (
                      <div>Loading...</div>
                    ) : settingsError ? (
                      <div className="text-error">{settingsError}</div>
                    ) : settings ? (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="font-semibold text-sm">Two-Factor Authentication</Label>
                            <p className="text-xs text-muted-foreground mt-1">Require 2FA for all admin accounts</p>
                          </div>
                          <Switch checked={settings.twofa_required} onCheckedChange={v => handleSettingChange('twofa_required', v)} />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="font-semibold text-sm">IP Whitelist</Label>
                            <p className="text-xs text-muted-foreground mt-1">Restrict admin access to specific IPs</p>
                          </div>
                          <Switch checked={settings.ip_whitelist_enabled} onCheckedChange={v => handleSettingChange('ip_whitelist_enabled', v)} />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="font-semibold text-sm">Session Timeout</Label>
                            <p className="text-xs text-muted-foreground mt-1">Auto-logout after {settings.session_timeout_minutes} minutes</p>
                          </div>
                          <Switch checked={!!settings.session_timeout_minutes} onCheckedChange={v => handleSettingChange('session_timeout_minutes', v ? 30 : 0)} />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="font-semibold text-sm">API Key Rotation</Label>
                            <p className="text-xs text-muted-foreground mt-1">Rotate API keys every {settings.api_key_rotation_days} days</p>
                          </div>
                          <Switch checked={!!settings.api_key_rotation_days} onCheckedChange={v => handleSettingChange('api_key_rotation_days', v ? 90 : 0)} />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="font-semibold text-sm">Show IP Addresses</Label>
                            <p className="text-xs text-muted-foreground mt-1">Currently {settings.show_ip_in_logs ? 'shown' : 'hidden'}</p>
                          </div>
                          <Switch checked={settings.show_ip_in_logs} onCheckedChange={v => handleSettingChange('show_ip_in_logs', v)} />
                        </div>

                        <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSaveSettings} disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Settings'}</Button>
                      </>
                    ) : null}
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
