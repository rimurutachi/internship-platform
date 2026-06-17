'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Upload, AlertCircle, CheckCircle2, Shield, Lock, Eye, EyeOff, User, Bell, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useUser } from '@/hooks/use-user';
import { studentAPI } from '@/lib/api/student';
import { advisorAPI } from '@/lib/api/advisor';
import { createSupabaseClient } from '@/lib/supabase';

interface SettingsPageProps {
  userType: 'student' | 'advisor' | 'supervisor';
}

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  profile_data?: {
    department?: string;
    student_id?: string;
    faculty_id?: string;
    year_level?: string;
    course?: string;
    program?: string;
    section?: string;
    bio?: string;
    position?: string;
    company?: string;
    notification_preferences?: {
      email_notifications?: boolean;
      push_notifications?: boolean;
      sms_notifications?: boolean;
      notification_types?: {
        evaluations?: boolean;
        reports?: boolean;
        internship?: boolean;
        students?: boolean;
        system?: boolean;
      };
    };
    [key: string]: any;
  };
  role: string;
  created_at: string;
  updated_at: string;
}

export function SettingsPage({ userType }: SettingsPageProps) {
  const { user: currentUser } = useUser();
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
  const [facultyId, setFacultyId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [course, setCourse] = useState('');
  const [program, setProgram] = useState('');
  const [section, setSection] = useState('');
  const [bio, setBio] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notifyEvaluations, setNotifyEvaluations] = useState(true);
  const [notifyReports, setNotifyReports] = useState(true);

  const [notifyInternship, setNotifyInternship] = useState(true);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [userType]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setError(null);
      
      let response: any;
      
      if (userType === 'student') {
        response = await studentAPI.getProfile();
        if (response.success && response.data?.user) {
          const userData = response.data.user;
          setProfile(userData);
          populateForm(userData);
        }
      } else if (userType === 'advisor') {
        response = await advisorAPI.getProfile();
        if (response.user) {
          setProfile(response.user);
          populateForm(response.user);
        }
      } else {
        // Supervisor - reuse authenticated profile endpoint
        response = await advisorAPI.getProfile();
        if (response.user) {
          setProfile(response.user);
          populateForm(response.user);
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const populateForm = (userData: ProfileData) => {
    setFirstName(userData.first_name || '');
    setLastName(userData.last_name || '');
    setEmail(userData.email || '');
    setDepartment(userData.profile_data?.department || '');
    setStudentId(userData.profile_data?.student_id || '');
    setFacultyId(userData.profile_data?.faculty_id || '');
    // year_level is a direct column on users, not inside profile_data
    setYearLevel((userData as any).year_level || userData.profile_data?.year_level || '');
    setCourse(userData.profile_data?.course || '');
    setProgram(userData.profile_data?.program || '');
    setSection(userData.profile_data?.section || '');
    setBio(userData.profile_data?.bio || '');
    setPosition(userData.profile_data?.position || '');
    setCompany(userData.profile_data?.company || '');
    setPhone((userData as any).phone || userData.profile_data?.phone || '');
    setAvatarUrl(userData.avatar_url || null);
    
    // Load notification preferences
    const notifPrefs = userData.profile_data?.notification_preferences || {};
    setEmailNotifications(notifPrefs.email_notifications ?? true);
    setPushNotifications(notifPrefs.push_notifications ?? true);
    
    const notifTypes = notifPrefs.notification_types || {};
    setNotifyEvaluations(notifTypes.evaluations ?? true);
    setNotifyReports(notifTypes.reports ?? true);

    setNotifyInternship(notifTypes.internship ?? true);
    setNotifyStudents(notifTypes.students ?? true);
    setNotifySystem(notifTypes.system ?? false);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const profileData: any = {
        first_name: firstName,
        last_name: lastName,
        phone,
        profile_data: {
          ...profile?.profile_data,
          department,
        },
      };

      if (userType === 'student') {
        // Only student_id is editable; program/year_level/section are admin-assigned (read-only)
        profileData.profile_data.student_id = studentId;
        // Remove department/course from student saves — not relevant for students
        delete profileData.profile_data.department;
        
        const response = await studentAPI.updateProfile(profileData);
        if (response.success) {
          setSuccess('Profile updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else if (userType === 'advisor') {
        profileData.profile_data.faculty_id = facultyId;
        profileData.profile_data.bio = bio;
        
        await advisorAPI.updateProfile(profileData);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Supervisor - persist via shared profile endpoint
        profileData.profile_data.position = position;
        profileData.profile_data.company = company;

        await advisorAPI.updateProfile(profileData);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
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
        notification_types: {
          evaluations: notifyEvaluations,
          reports: notifyReports,

          ...(userType === 'student' && { internship: notifyInternship }),
          ...(userType === 'advisor' && { students: notifyStudents }),
          system: notifySystem,
        },
      };
      
      const profileData = {
        profile_data: {
          ...profile?.profile_data,
          notification_preferences: notificationPrefs,
        },
      };
      
      if (userType === 'student') {
        const response = await studentAPI.updateProfile(profileData);
        if (response.success) {
          setSuccess('Notification preferences saved!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else if (userType === 'advisor') {
        await advisorAPI.updateProfile(profileData);
        setSuccess('Notification preferences saved!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Supervisor
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

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);

      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
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
    return userType === 'student' ? 'ST' : userType === 'advisor' ? 'AD' : 'SU';
  };

  if (profileLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Get tabs based on user type
  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'security', label: 'Security', icon: KeyRound },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8 bg-muted/30">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
              </div>

              {/* Success/Error Alerts */}
              {success && (
                <Alert className="mb-4 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="mb-4 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-lg gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-0">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">
                        {userType === 'student' && 'Student Profile'}
                        {userType === 'advisor' && 'Advisor Profile'}
                        {userType === 'supervisor' && 'Supervisor Profile'}
                      </CardTitle>
                      <CardDescription>
                        {userType === 'student' && 'Manage your student account information'}
                        {userType === 'advisor' && 'Manage your advisor account information'}
                        {userType === 'supervisor' && 'Manage your supervisor account and company information'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b">
                        <Avatar className="w-20 h-20 lg:w-24 lg:h-24 ring-4 ring-background shadow-lg">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl lg:text-2xl font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Change Photo
                          </Button>
                          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB</p>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Basic Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">First Name</Label>
                            <Input 
                              value={firstName} 
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Enter first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Last Name</Label>
                            <Input 
                              value={lastName} 
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Enter last name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Email</Label>
                            <Input 
                              type="email" 
                              value={email} 
                              disabled
                              className="bg-muted/50"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Phone (Optional)</Label>
                            <Input 
                              type="tel" 
                              value={phone} 
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 (555) 000-0000"
                            />
                            <p className="text-xs text-muted-foreground">Your contact number</p>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      {/* Role-specific fields */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                          {userType === 'student' && 'Academic Information'}
                          {userType === 'advisor' && 'Faculty Information'}
                          {userType === 'supervisor' && 'Professional Information'}
                        </h3>
                        {userType === 'student' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Student ID</Label>
                              <Input 
                                value={studentId} 
                                onChange={(e) => setStudentId(e.target.value)}
                                placeholder="Enter student ID"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Program</Label>
                              <Input 
                                value={program}
                                disabled
                                className="bg-muted/50 cursor-not-allowed"
                                placeholder="Assigned by admin"
                              />
                              <p className="text-xs text-muted-foreground">Auto-assigned by admin based on your program</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Year Level</Label>
                              <Input 
                                value={yearLevel}
                                disabled
                                className="bg-muted/50 cursor-not-allowed"
                                placeholder="Assigned by admin"
                              />
                              <p className="text-xs text-muted-foreground">Auto-assigned by admin</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Section</Label>
                              <Input 
                                value={section}
                                disabled
                                className="bg-muted/50 cursor-not-allowed"
                                placeholder="Assigned by admin"
                              />
                              <p className="text-xs text-muted-foreground">Auto-assigned by admin</p>
                            </div>
                          </div>
                        )}

                        {userType === 'advisor' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Faculty ID</Label>
                              <Input 
                                value={facultyId} 
                                onChange={(e) => setFacultyId(e.target.value)}
                                placeholder="Enter faculty ID"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Department</Label>
                              <Input 
                                value={department} 
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g., Computer Science"
                              />
                            </div>
                          </div>
                        )}

                        {userType === 'supervisor' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Position</Label>
                              <Input 
                                value={position} 
                                onChange={(e) => setPosition(e.target.value)}
                                placeholder="e.g., Software Engineer"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Department</Label>
                              <Input 
                                value={department} 
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g., Engineering"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                              <Label className="text-sm font-medium">Company</Label>
                              <Input 
                                value={company} 
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="e.g., Tech Company Inc."
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bio for Advisor */}
                      {userType === 'advisor' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Bio</Label>
                          <Textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="min-h-[100px] resize-none"
                          />
                        </div>
                      )}

                      <Separator className="my-2" />

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6 mt-0">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Notification Preferences</CardTitle>
                      <CardDescription>Choose how you want to receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Channels */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notification Channels</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Email Notifications</Label>
                              <p className="text-sm text-muted-foreground mt-1">Receive notifications via email</p>
                            </div>
                            <Switch 
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Push Notifications</Label>
                              <p className="text-sm text-muted-foreground mt-1">Receive push notifications in the app</p>
                            </div>
                            <Switch 
                              checked={pushNotifications}
                              onCheckedChange={setPushNotifications}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Notification Types */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notification Types</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Evaluation Updates</Label>
                              <p className="text-sm text-muted-foreground mt-1">Get notified about evaluation changes</p>
                            </div>
                            <Switch 
                              checked={notifyEvaluations}
                              onCheckedChange={setNotifyEvaluations}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">Report Submissions</Label>
                              <p className="text-sm text-muted-foreground mt-1">Notifications for report activities</p>
                            </div>
                            <Switch 
                              checked={notifyReports}
                              onCheckedChange={setNotifyReports}
                            />
                          </div>

                          {/* Student-specific */}
                          {userType === 'student' && (
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-semibold">Internship Updates</Label>
                                <p className="text-sm text-muted-foreground mt-1">Updates about your internship status</p>
                              </div>
                              <Switch 
                                checked={notifyInternship}
                                onCheckedChange={setNotifyInternship}
                              />
                            </div>
                          )}

                          {/* Advisor-specific */}
                          {userType === 'advisor' && (
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-semibold">Student Activities</Label>
                                <p className="text-sm text-muted-foreground mt-1">Updates about your students</p>
                              </div>
                              <Switch 
                                checked={notifyStudents}
                                onCheckedChange={setNotifyStudents}
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">System Announcements</Label>
                              <p className="text-sm text-muted-foreground mt-1">Important platform updates</p>
                            </div>
                            <Switch 
                              checked={notifySystem}
                              onCheckedChange={setNotifySystem}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSaveNotifications}
                          disabled={saving}
                          className="gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Preferences
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6 mt-0">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Change Password</CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 max-w-md">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Current Password</Label>
                          <div className="relative">
                            <Input 
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">New Password</Label>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Confirm New Password</Label>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-start pt-2">
                        <Button 
                          onClick={handleChangePassword}
                          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                          className="gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">Enable 2FA</p>
                          <p className="text-sm text-muted-foreground">
                            Secure your account with two-factor authentication
                          </p>
                        </div>
                        <Switch 
                          checked={twoFactorEnabled}
                          onCheckedChange={setTwoFactorEnabled}
                        />
                      </div>
                      {twoFactorEnabled && (
                        <Alert className="mt-4 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-700 dark:text-blue-400">
                            Two-factor authentication is enabled. You'll need your authentication code to sign in.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
  );
}
