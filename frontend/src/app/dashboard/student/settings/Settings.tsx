'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useUser } from '@/hooks/use-user';
import { studentAPI } from '@/lib/api/student';

interface StudentProfileData {
  id: string;
  email: string;
  first_name?: string;
  avatar_url?: string;
  profile_data?: {
    department?: string;
    student_id?: string;
    year_level?: string;
    course?: string;
    notification_preferences?: {
      email_notifications?: boolean;
      push_notifications?: boolean;
      sms_notifications?: boolean;
      notification_types?: {
        evaluations?: boolean;
        reports?: boolean;
        messages?: boolean;
        internship?: boolean;
        system?: boolean;
      };
    };
    [key: string]: any;
  };
  role: string;
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const { user: currentUser } = useUser();
  
  // Profile state
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [course, setCourse] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notifyEvaluations, setNotifyEvaluations] = useState(true);
  const [notifyReports, setNotifyReports] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyInternship, setNotifyInternship] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setError(null);
      
      const response = await studentAPI.getProfile();
      
      if (response.success && response.data?.user) {
        const userData = response.data.user;
        setProfile(userData);
        
        // Populate form fields
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
        setEmail(userData.email || '');
        setDepartment(userData.profile_data?.department || '');
        setStudentId(userData.profile_data?.student_id || '');
        setYearLevel(userData.profile_data?.year_level || '');
        setCourse(userData.profile_data?.course || '');
        setAvatarUrl(userData.avatar_url || null);
        
        // Load notification preferences
        const notifPrefs = userData.profile_data?.notification_preferences || {};
        setEmailNotifications(notifPrefs.email_notifications ?? true);
        setPushNotifications(notifPrefs.push_notifications ?? true);
        setSmsNotifications(notifPrefs.sms_notifications ?? false);
        
        const notifTypes = notifPrefs.notification_types || {};
        setNotifyEvaluations(notifTypes.evaluations ?? true);
        setNotifyReports(notifTypes.reports ?? true);
        setNotifyMessages(notifTypes.messages ?? true);
        setNotifyInternship(notifTypes.internship ?? true);
        setNotifySystem(notifTypes.system ?? false);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        profile_data: {
          ...profile?.profile_data,
          department,
          student_id: studentId,
          year_level: yearLevel,
          course,
        },
      };
      
      const response = await studentAPI.updateProfile(profileData);
      
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        await loadProfile();
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const notificationPrefs = {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        sms_notifications: smsNotifications,
        notification_types: {
          evaluations: notifyEvaluations,
          reports: notifyReports,
          messages: notifyMessages,
          internship: notifyInternship,
          system: notifySystem,
        },
      };
      
      const profileData = {
        profile_data: {
          ...profile?.profile_data,
          notification_preferences: notificationPrefs,
        },
      };
      
      const response = await studentAPI.updateProfile(profileData);
      
      if (response.success) {
        setSuccess('Notification preferences saved!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving notifications:', err);
      setError(err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'ST';
  };

  if (profileLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <StudentSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <StudentHeader />
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account and preferences</p>
              </div>

              {/* Success/Error Alerts */}
              {success && (
                <Alert className="mb-4 border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="mb-4 border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100">
                  <TabsTrigger value="profile" className="text-base">Profile</TabsTrigger>
                  <TabsTrigger value="notifications" className="text-base">Notifications</TabsTrigger>
                  <TabsTrigger value="security" className="text-base">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card className="bg-white">
                    <CardHeader className="border-b">
                      <CardTitle className="text-2xl">Profile Information</CardTitle>
                      <CardDescription className="text-base">Update your personal information and profile details</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
                          ) : (
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                              {getInitials()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Avatar upload coming soon
                          </p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-base">First Name</Label>
                          <Input 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="mt-2 h-11 text-base"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label className="text-base">Last Name</Label>
                          <Input 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="mt-2 h-11 text-base"
                            placeholder="Enter last name"
                          />
                        </div>
                        <div>
                          <Label className="text-base">Email</Label>
                          <Input 
                            type="email" 
                            value={email}
                            className="mt-2 h-11 text-base bg-gray-50"
                            disabled
                          />
                        </div>
                        <div>
                          <Label className="text-base">Department</Label>
                          <Input 
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="mt-2 h-11 text-base"
                            placeholder="Enter department"
                          />
                        </div>
                        <div>
                          <Label className="text-base">Student ID</Label>
                          <Input 
                            value={studentId}
                            className="mt-2 h-11 text-base bg-gray-50"
                            disabled
                          />
                        </div>
                        <div>
                          <Label className="text-base">Year Level</Label>
                          <Input 
                            value={yearLevel}
                            onChange={(e) => setYearLevel(e.target.value)}
                            className="mt-2 h-11 text-base"
                            placeholder="e.g., 3rd Year"
                          />
                        </div>
                        <div>
                          <Label className="text-base">Course</Label>
                          <Input 
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            className="mt-2 h-11 text-base"
                            placeholder="Enter course"
                          />
                        </div>
                      </div>

                      <Button 
                        className="bg-blue-500 hover:bg-blue-600 text-white text-base py-6"
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card className="bg-white">
                    <CardHeader className="border-b">
                      <CardTitle className="text-2xl">Notification Channels</CardTitle>
                      <CardDescription className="text-base">Choose how you want to receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Email Notifications</div>
                            <div className="text-sm text-gray-600">Receive notifications via email</div>
                          </div>
                          <Switch 
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Push Notifications</div>
                            <div className="text-sm text-gray-600">Receive browser push notifications</div>
                          </div>
                          <Switch 
                            checked={pushNotifications}
                            onCheckedChange={setPushNotifications}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">SMS Notifications</div>
                            <div className="text-sm text-gray-600">Receive text messages</div>
                          </div>
                          <Switch 
                            checked={smsNotifications}
                            onCheckedChange={setSmsNotifications}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader className="border-b">
                      <CardTitle className="text-2xl">Notification Types</CardTitle>
                      <CardDescription className="text-base">Select which types of notifications you want to receive</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Evaluations</div>
                            <div className="text-sm text-gray-600">Evaluation results and feedback</div>
                          </div>
                          <Switch 
                            checked={notifyEvaluations}
                            onCheckedChange={setNotifyEvaluations}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Reports</div>
                            <div className="text-sm text-gray-600">Weekly report submissions</div>
                          </div>
                          <Switch 
                            checked={notifyReports}
                            onCheckedChange={setNotifyReports}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Messages</div>
                            <div className="text-sm text-gray-600">New messages from advisors and supervisors</div>
                          </div>
                          <Switch 
                            checked={notifyMessages}
                            onCheckedChange={setNotifyMessages}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Internship Updates</div>
                            <div className="text-sm text-gray-600">Updates about your internship</div>
                          </div>
                          <Switch 
                            checked={notifyInternship}
                            onCheckedChange={setNotifyInternship}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">System Updates</div>
                            <div className="text-sm text-gray-600">Platform updates and announcements</div>
                          </div>
                          <Switch 
                            checked={notifySystem}
                            onCheckedChange={setNotifySystem}
                          />
                        </div>
                      </div>

                      <Button 
                        className="bg-blue-500 hover:bg-blue-600 text-white text-base py-6"
                        onClick={handleSaveNotifications}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card className="bg-white">
                    <CardHeader className="border-b">
                      <CardTitle className="text-2xl">Password & Security</CardTitle>
                      <CardDescription className="text-base">Manage your password and security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <Alert className="border-blue-500 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-700">
                          Password changes are managed through your Supabase authentication.
                          Please use the &quot;Forgot Password&quot; link on the login page to reset your password.
                        </AlertDescription>
                      </Alert>

                      <div className="pt-6 border-t">
                        <h3 className="font-semibold text-lg mb-4">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-base">Enable 2FA</div>
                            <div className="text-sm text-gray-600">Add an extra layer of security</div>
                          </div>
                          <Switch disabled />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Two-factor authentication is coming soon.
                        </p>
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
          subtitle="Manage your account"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Success/Error Alerts */}
            {success && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
                <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
              </TabsList>

              {/* Profile Tab - Mobile */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
                        ) : (
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">First Name</Label>
                        <Input 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Last Name</Label>
                        <Input 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input 
                          type="email" 
                          value={email}
                          className="mt-1 text-sm bg-gray-50"
                          disabled
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Department</Label>
                        <Input 
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Student ID</Label>
                        <Input 
                          value={studentId}
                          className="mt-1 text-sm bg-gray-50"
                          disabled
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          Save Changes
                        </>
                      )}
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
                          <div className="font-medium text-sm">Email Notifications</div>
                          <div className="text-xs text-gray-600">Receive via email</div>
                        </div>
                        <Switch 
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Push Notifications</div>
                          <div className="text-xs text-gray-600">Browser notifications</div>
                        </div>
                        <Switch 
                          checked={pushNotifications}
                          onCheckedChange={setPushNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Evaluations</div>
                          <div className="text-xs text-gray-600">Results and feedback</div>
                        </div>
                        <Switch 
                          checked={notifyEvaluations}
                          onCheckedChange={setNotifyEvaluations}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Messages</div>
                          <div className="text-xs text-gray-600">New messages</div>
                        </div>
                        <Switch 
                          checked={notifyMessages}
                          onCheckedChange={setNotifyMessages}
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      onClick={handleSaveNotifications}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-2" />
                          Save Preferences
                        </>
                      )}
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
                    <Alert className="border-blue-500 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-xs text-blue-700">
                        Use &quot;Forgot Password&quot; on the login page to reset your password.
                      </AlertDescription>
                    </Alert>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Two-Factor Authentication</div>
                          <div className="text-xs text-gray-600">Coming soon</div>
                        </div>
                        <Switch disabled />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

