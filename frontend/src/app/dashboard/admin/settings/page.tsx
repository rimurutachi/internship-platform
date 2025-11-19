'use client';

import { useState } from 'react';
import { User, Bell, Lock, Mail, Globe, Palette, Save, Building2, Database, Upload, Trash2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

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
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage platform and administrator settings</p>
              </div>

              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="platform">Platform</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Administrator Profile</CardTitle>
                      <CardDescription>Manage your admin account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                          <AvatarFallback className="bg-gradient-primary text-white text-2xl font-semibold">
                            AD
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm">Change Photo</Button>
                          <Button variant="ghost" size="sm" className="text-error hover:text-error/80">Remove</Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input defaultValue="Admin" className="mt-2" />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input defaultValue="User" className="mt-2" />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input type="email" defaultValue="admin@platform.com" className="mt-2" />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input type="tel" defaultValue="+1 (555) 000-0000" className="mt-2" />
                        </div>
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Platform Tab */}
                <TabsContent value="platform" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Settings</CardTitle>
                      <CardDescription>Configure platform-wide settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label>Platform Name</Label>
                        <Input defaultValue="InternConnect" className="mt-2" />
                      </div>

                      <div>
                        <Label>Platform URL</Label>
                        <Input defaultValue="https://internconnect.com" className="mt-2" />
                      </div>

                      <div>
                        <Label>Support Email</Label>
                        <Input type="email" defaultValue="support@internconnect.com" className="mt-2" />
                      </div>

                      <div>
                        <Label>Max File Upload Size (MB)</Label>
                        <Input type="number" defaultValue="100" className="mt-2" />
                      </div>

                      <div>
                        <Label>Session Timeout (minutes)</Label>
                        <Input type="number" defaultValue="30" className="mt-2" />
                      </div>

                      <div>
                        <Label>Platform Timezone</Label>
                        <Select defaultValue="pst">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                            <SelectItem value="est">Eastern Time (EST)</SelectItem>
                            <SelectItem value="cst">Central Time (CST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Platform Announcement</Label>
                        <Textarea 
                          placeholder="Add a platform-wide announcement"
                          className="mt-2 min-h-24"
                        />
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Platform Settings
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Choose what notifications you receive</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-semibold">System Alerts</Label>
                            <p className="text-sm text-muted-foreground mt-1">Receive alerts for system issues</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-semibold">User Management</Label>
                            <p className="text-sm text-muted-foreground mt-1">New user registrations and changes</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-semibold">Security Events</Label>
                            <p className="text-sm text-muted-foreground mt-1">Security alerts and threats</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-semibold">Platform Performance</Label>
                            <p className="text-sm text-muted-foreground mt-1">Performance metrics and reports</p>
                          </div>
                          <Switch />
                        </div>
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Notification Settings
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>System maintenance and advanced options</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="font-semibold">Database Backup</Label>
                          <p className="text-sm text-muted-foreground mt-1">Last backup: 2 hours ago</p>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm">Backup Now</Button>
                            <Button variant="outline" size="sm">Restore</Button>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <Label className="font-semibold">Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground mt-1">Enable maintenance mode for platform updates</p>
                          <div className="mt-3">
                            <Switch />
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <Label className="font-semibold">API Rate Limiting</Label>
                          <p className="text-sm text-muted-foreground mt-1">Max requests per minute</p>
                          <Input type="number" defaultValue="1000" className="mt-3 w-32" />
                        </div>

                        <div className="border-t pt-4">
                          <Label className="font-semibold">Clear Cache</Label>
                          <p className="text-sm text-muted-foreground mt-1">Clear all system caches</p>
                          <Button variant="outline" size="sm" className="mt-3">Clear Cache</Button>
                        </div>
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
            title="Settings"
            subtitle="Platform Settings"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Tab Selector */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeTab === 'general' ? 'default' : 'outline'}
                onClick={() => setActiveTab('general')}
                className="h-auto py-3"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="text-xs">General</span>
              </Button>
              <Button
                variant={activeTab === 'platform' ? 'default' : 'outline'}
                onClick={() => setActiveTab('platform')}
                className="h-auto py-3"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="text-xs">Platform</span>
              </Button>
              <Button
                variant={activeTab === 'notifications' ? 'default' : 'outline'}
                onClick={() => setActiveTab('notifications')}
                className="h-auto py-3"
              >
                <Bell className="w-4 h-4 mr-2" />
                <span className="text-xs">Notifications</span>
              </Button>
              <Button
                variant={activeTab === 'advanced' ? 'default' : 'outline'}
                onClick={() => setActiveTab('advanced')}
                className="h-auto py-3"
              >
                <Database className="w-4 h-4 mr-2" />
                <span className="text-xs">Advanced</span>
              </Button>
            </div>

            {/* General Tab - Mobile */}
            {activeTab === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Administrator Profile</CardTitle>
                  <CardDescription className="text-sm">Manage your admin account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="bg-gradient-primary text-white text-xl font-semibold">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-3 h-3 mr-1" />
                        Change
                      </Button>
                      <Button variant="ghost" size="sm" className="text-error hover:text-error/80">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">First Name</Label>
                      <Input defaultValue="Admin" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm">Last Name</Label>
                      <Input defaultValue="User" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input type="email" defaultValue="admin@platform.com" className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm">Phone</Label>
                      <Input type="tel" defaultValue="+1 (555) 000-0000" className="mt-1.5" />
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Platform Tab - Mobile */}
            {activeTab === 'platform' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Settings</CardTitle>
                  <CardDescription className="text-sm">Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Platform Name</Label>
                    <Input defaultValue="InternConnect" className="mt-1.5" />
                  </div>

                  <div>
                    <Label className="text-sm">Platform URL</Label>
                    <Input defaultValue="https://internconnect.com" className="mt-1.5" />
                  </div>

                  <div>
                    <Label className="text-sm">Support Email</Label>
                    <Input type="email" defaultValue="support@internconnect.com" className="mt-1.5" />
                  </div>

                  <div>
                    <Label className="text-sm">Max File Upload Size (MB)</Label>
                    <Input type="number" defaultValue="100" className="mt-1.5" />
                  </div>

                  <div>
                    <Label className="text-sm">Session Timeout (minutes)</Label>
                    <Input type="number" defaultValue="30" className="mt-1.5" />
                  </div>

                  <div>
                    <Label className="text-sm">Platform Timezone</Label>
                    <Select defaultValue="pst">
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                        <SelectItem value="est">Eastern Time (EST)</SelectItem>
                        <SelectItem value="cst">Central Time (CST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Platform Announcement</Label>
                    <Textarea 
                      placeholder="Add a platform-wide announcement"
                      className="mt-1.5 min-h-20"
                    />
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Platform Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab - Mobile */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  <CardDescription className="text-sm">Choose what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">System Alerts</Label>
                        <p className="text-xs text-muted-foreground mt-1">Receive alerts for system issues</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">User Management</Label>
                        <p className="text-xs text-muted-foreground mt-1">New user registrations and changes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">Security Events</Label>
                        <p className="text-xs text-muted-foreground mt-1">Security alerts and threats</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="font-semibold text-sm">Platform Performance</Label>
                        <p className="text-xs text-muted-foreground mt-1">Performance metrics and reports</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Advanced Tab - Mobile */}
            {activeTab === 'advanced' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  <CardDescription className="text-sm">System maintenance and advanced options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-semibold text-sm">Database Backup</Label>
                      <p className="text-xs text-muted-foreground mt-1">Last backup: 2 hours ago</p>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="flex-1">Backup Now</Button>
                        <Button variant="outline" size="sm" className="flex-1">Restore</Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="font-semibold text-sm">Maintenance Mode</Label>
                      <p className="text-xs text-muted-foreground mt-1">Enable maintenance mode for platform updates</p>
                      <div className="mt-2">
                        <Switch />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="font-semibold text-sm">API Rate Limiting</Label>
                      <p className="text-xs text-muted-foreground mt-1">Max requests per minute</p>
                      <Input type="number" defaultValue="1000" className="mt-2" />
                    </div>

                    <div className="border-t pt-4">
                      <Label className="font-semibold text-sm">Clear Cache</Label>
                      <p className="text-xs text-muted-foreground mt-1">Clear all system caches</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">Clear Cache</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
