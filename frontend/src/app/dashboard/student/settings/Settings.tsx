'use client';

import { Save } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Settings() {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
              </div>

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal information and profile picture</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                            JM
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
                          <Input defaultValue="Juan" className="mt-2" />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input defaultValue="Martinez" className="mt-2" />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input type="email" defaultValue="juan.martinez@university.edu" className="mt-2" />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input type="tel" defaultValue="+1 234-567-8900" className="mt-2" />
                        </div>
                        <div>
                          <Label>Major</Label>
                          <Input defaultValue="Computer Science" className="mt-2" />
                        </div>
                        <div>
                          <Label>Student ID</Label>
                          <Input defaultValue="STU-2025-001" className="mt-2" disabled />
                        </div>
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
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-foreground mb-4">Notification Types</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Evaluation Updates</div>
                              <div className="text-sm text-muted-foreground">When you receive new evaluations</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Messages</div>
                              <div className="text-sm text-muted-foreground">When you receive new messages</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">Document Updates</div>
                              <div className="text-sm text-muted-foreground">When documents are shared or updated</div>
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
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Settings"
          subtitle="Manage your account and preferences"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Profile Information</CardTitle>
                  <CardDescription className="text-xs">Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        JM
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="text-xs">Change Photo</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">First Name</Label>
                      <Input defaultValue="Juan" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">Last Name</Label>
                      <Input defaultValue="Martinez" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input type="email" defaultValue="juan.martinez@university.edu" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">Phone</Label>
                      <Input type="tel" defaultValue="+1 234-567-8900" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">Major</Label>
                      <Input defaultValue="Computer Science" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">Student ID</Label>
                      <Input defaultValue="STU-2025-001" className="mt-1 text-sm" disabled />
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs">Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground text-sm">Email Notifications</div>
                        <div className="text-xs text-muted-foreground">Receive notifications via email</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground text-sm">Push Notifications</div>
                        <div className="text-xs text-muted-foreground">Receive push notifications</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <h3 className="font-semibold text-foreground mb-3 text-sm">Notification Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground text-sm">Evaluation Updates</div>
                          <div className="text-xs text-muted-foreground">New evaluations</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground text-sm">Messages</div>
                          <div className="text-xs text-muted-foreground">New messages</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground text-sm">Document Updates</div>
                          <div className="text-xs text-muted-foreground">Document changes</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground text-sm">System Updates</div>
                          <div className="text-xs text-muted-foreground">Platform updates</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Password & Security</CardTitle>
                  <CardDescription className="text-xs">Manage your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Current Password</Label>
                      <Input type="password" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">New Password</Label>
                      <Input type="password" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-sm">Confirm New Password</Label>
                      <Input type="password" className="mt-1 text-sm" />
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                    Update Password
                  </Button>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-foreground mb-3 text-sm">Active Sessions</h3>
                    <Card>
                      <CardContent className="pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground text-sm">Current Device</div>
                            <div className="text-xs text-muted-foreground">Windows 10 - Chrome</div>
                            <div className="text-xs text-muted-foreground mt-1">Last active: Just now</div>
                          </div>
                          <Button variant="ghost" size="sm" disabled className="text-xs">Active</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

