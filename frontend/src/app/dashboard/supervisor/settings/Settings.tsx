'use client';

import { Save, Building2 } from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
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

export default function Settings() {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <SupervisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SupervisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
              </div>

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="ai">AI Settings</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal and company information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                            MS
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm">Change Photo</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Remove</Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input defaultValue="Maria" className="mt-2" />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input defaultValue="Santos" className="mt-2" />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input type="email" defaultValue="maria.santos@techcorp.com" className="mt-2" />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input type="tel" defaultValue="+1 (555) 123-4567" className="mt-2" />
                        </div>
                        <div>
                          <Label>Position</Label>
                          <Input defaultValue="Engineering Manager" className="mt-2" />
                        </div>
                        <div>
                          <Label>Department</Label>
                          <Input defaultValue="Engineering" className="mt-2" />
                        </div>
                      </div>

                      <div>
                        <Label>Company</Label>
                        <div className="flex items-center gap-3 mt-2 p-3 bg-muted rounded-lg">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium text-foreground">TechCorp Solutions</span>
                        </div>
                      </div>

                      <div>
                        <Label>Bio</Label>
                        <Textarea 
                          defaultValue="Engineering Manager with 10+ years of experience in software development. Passionate about mentoring the next generation of developers."
                          className="mt-2 min-h-24"
                        />
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Choose how you want to receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">Email Notifications</div>
                            <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">Push Notifications</div>
                            <div className="text-sm text-muted-foreground">Receive push notifications in browser</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">SMS Notifications</div>
                            <div className="text-sm text-muted-foreground">Receive notifications via SMS</div>
                          </div>
                          <Switch />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-foreground mb-4">Notification Types</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Intern Messages</div>
                              <div className="text-sm text-muted-foreground">When interns send you messages</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Task Updates</div>
                              <div className="text-sm text-muted-foreground">When interns complete tasks</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Evaluation Reminders</div>
                              <div className="text-sm text-muted-foreground">Reminders for pending evaluations</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">AI Processing Complete</div>
                              <div className="text-sm text-muted-foreground">When AI analysis is completed</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Advisor Messages</div>
                              <div className="text-sm text-muted-foreground">When advisors contact you</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">System Updates</div>
                              <div className="text-sm text-muted-foreground">Platform updates and announcements</div>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password & Security</CardTitle>
                      <CardDescription>Manage your password and security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Current Password</Label>
                          <Input type="password" className="mt-2" />
                        </div>
                        <div>
                          <Label>New Password</Label>
                          <Input type="password" className="mt-2" />
                        </div>
                        <div>
                          <Label>Confirm New Password</Label>
                          <Input type="password" className="mt-2" />
                        </div>
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        Update Password
                      </Button>

                      <div className="pt-6 border-t">
                        <h3 className="font-semibold text-foreground mb-4">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">Enable 2FA</div>
                            <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                          </div>
                          <Switch />
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="font-semibold text-foreground mb-4">Active Sessions</h3>
                        <div className="space-y-3">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-foreground">Current Device</div>
                                  <div className="text-sm text-muted-foreground">Windows 10 - Chrome - San Francisco, CA</div>
                                  <div className="text-xs text-muted-foreground mt-1">Last active: Just now</div>
                                </div>
                                <Button variant="ghost" size="sm" disabled>Active</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Display Preferences</CardTitle>
                      <CardDescription>Customize your platform experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label>Language</Label>
                        <Select defaultValue="en">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fil">Filipino</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Timezone</Label>
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
                        <Label>Theme</Label>
                        <Select defaultValue="light">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Default Dashboard View</Label>
                        <Select defaultValue="overview">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="overview">Overview</SelectItem>
                            <SelectItem value="interns">My Interns</SelectItem>
                            <SelectItem value="evaluations">Evaluations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Settings Tab */}
                <TabsContent value="ai" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Processing Settings</CardTitle>
                      <CardDescription>Configure AI-powered evaluation preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">Auto-Process Evaluations</div>
                          <div className="text-sm text-muted-foreground">Automatically run AI analysis on new evaluations</div>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">Bias Detection</div>
                          <div className="text-sm text-muted-foreground">Enable bias checking in AI recommendations</div>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">Sentiment Analysis</div>
                          <div className="text-sm text-muted-foreground">Analyze sentiment in evaluation feedback</div>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div>
                        <Label>Confidence Threshold</Label>
                        <Select defaultValue="85">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="70">70% (Low)</SelectItem>
                            <SelectItem value="80">80% (Medium)</SelectItem>
                            <SelectItem value="85">85% (Recommended)</SelectItem>
                            <SelectItem value="90">90% (High)</SelectItem>
                            <SelectItem value="95">95% (Very High)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          AI recommendations below this threshold will require manual review
                        </p>
                      </div>

                      <Button className="bg-primary hover:bg-primary/90">
                        <Save className="w-4 h-4 mr-2" />
                        Save AI Settings
                      </Button>
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
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Settings"
            subtitle="TechCorp Solutions"
            logo={
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
                <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs">Preferences</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs col-span-2">AI Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab - Mobile */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Profile Information</CardTitle>
                    <CardDescription className="text-xs">Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                          MS
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="text-xs">Change Photo</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">Remove</Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">First Name</Label>
                        <Input defaultValue="Maria" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Last Name</Label>
                        <Input defaultValue="Santos" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input type="email" defaultValue="maria.santos@techcorp.com" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input type="tel" defaultValue="+1 (555) 123-4567" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Position</Label>
                        <Input defaultValue="Engineering Manager" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Department</Label>
                        <Input defaultValue="Engineering" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Company</Label>
                        <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded-lg">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">TechCorp Solutions</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Save className="w-3 h-3 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab - Mobile */}
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Email Notifications</div>
                          <div className="text-xs text-muted-foreground">Receive via email</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Push Notifications</div>
                          <div className="text-xs text-muted-foreground">Browser notifications</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Intern Messages</div>
                          <div className="text-xs text-muted-foreground">When interns message you</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Task Updates</div>
                          <div className="text-xs text-muted-foreground">When tasks are completed</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Evaluation Reminders</div>
                          <div className="text-xs text-muted-foreground">Reminders for evaluations</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">AI Processing Complete</div>
                          <div className="text-xs text-muted-foreground">When analysis is done</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Save className="w-3 h-3 mr-2" />
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab - Mobile */}
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Password & Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Current Password</Label>
                        <Input type="password" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">New Password</Label>
                        <Input type="password" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">Confirm New Password</Label>
                        <Input type="password" className="mt-1 h-9" />
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      Update Password
                    </Button>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Two-Factor Authentication</div>
                          <div className="text-xs text-muted-foreground">Extra security layer</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab - Mobile */}
              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Display Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fil">Filipino</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Timezone</Label>
                      <Select defaultValue="pst">
                        <SelectTrigger className="mt-1 h-9">
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
                      <Label className="text-xs">Theme</Label>
                      <Select defaultValue="light">
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Save className="w-3 h-3 mr-2" />
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Settings Tab - Mobile */}
              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Processing Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Auto-Process Evaluations</div>
                          <div className="text-xs text-muted-foreground">Auto-run AI analysis</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Bias Detection</div>
                          <div className="text-xs text-muted-foreground">Check for bias</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-foreground">Sentiment Analysis</div>
                          <div className="text-xs text-muted-foreground">Analyze feedback sentiment</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Confidence Threshold</Label>
                      <Select defaultValue="85">
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="70">70% (Low)</SelectItem>
                          <SelectItem value="80">80% (Medium)</SelectItem>
                          <SelectItem value="85">85% (Recommended)</SelectItem>
                          <SelectItem value="90">90% (High)</SelectItem>
                          <SelectItem value="95">95% (Very High)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      <Save className="w-3 h-3 mr-2" />
                      Save AI Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="supervisor" />
        </div>
      </div>
    </div>
  );
}

